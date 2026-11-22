/** Locks con RR (```locks): corre el código de cada proceso turno a turno y anota qué hizo el cerrojo. Ver brain: Resolución gráfica paso a paso. */

export interface SpecLocks {
  titulo: string
  /** Obligatorio: el SO rechaza el acceso sin lock; sugerido: solo frena a quien lo pide. */
  cerrojo: 'obligatorio' | 'sugerido'
  /** Compartido: el modo sale del open (read → compartido); exclusivo: siempre exclusivo. */
  modo: 'compartido' | 'exclusivo'
  archivo: { nombre: string; contenido: string }
  /** En el orden de Ready. */
  procesos: { nombre: string; codigo: string[] }[]
}

export type ModoLock = 'compartido' | 'exclusivo'
export interface Tenencia {
  p: number
  modo: ModoLock
}

export type Evento =
  | { tipo: 'open' | 'asignar' }
  | { tipo: 'toma'; modo: ModoLock; con: number[] }
  | { tipo: 'bloquea'; modo: ModoLock; duenos: Tenencia[] }
  /** falla/pasa: acceso sin lock mientras otro lo tiene; valor = cómo queda la variable o el archivo. */
  | {
      tipo: 'lee' | 'escribe' | 'falla' | 'pasa'
      op: 'read' | 'write'
      valor: string
      duenos: Tenencia[]
    }
  | { tipo: 'libera'; despierta: Tenencia[] }
  | { tipo: 'imprime'; valor: string }

export interface Ejecutada {
  linea: number
  evento: Evento
}

export interface Impresion {
  p: number
  valor: string
  bloqueados: number[]
}

export interface EstadoLocks {
  procesos: { pc: number; estado: 'ready' | 'bloqueado' | 'terminado'; conLock: boolean }[]
  duenos: Tenencia[]
  cola: Tenencia[]
  archivo: string
  pantalla: Impresion[]
}

export interface Turno {
  p: number
  lineas: Ejecutada[]
  despues: EstadoLocks
}

type Instr =
  | { op: 'open'; modo: 'read' | 'write' }
  | { op: 'asignar'; valor: string }
  | { op: 'lock' | 'unlock' | 'read' | 'write' | 'print' }

function parsear(linea: string, archivo: string): Instr {
  const l = linea.trim()
  const m =
    l.match(/^(open)\((\w+),\s*(read|write)\)$/) ??
    l.match(/^(lock|unlock)\((\w+)\)$/) ??
    l.match(/^(read|write)\((\w+),\s*\w+\)$/)
  if (m) {
    if (m[2] !== archivo) throw new Error(`locks: \`${l}\` usa otro archivo que \`${archivo}\``)
    return m[1] === 'open'
      ? { op: 'open', modo: m[3] as 'read' | 'write' }
      : { op: m[1] as 'lock' | 'unlock' | 'read' | 'write' }
  }
  if (/^print\(\w+\)$/.test(l)) return { op: 'print' }
  const a = l.match(/^\w+\s*=\s*'(.*)'$/)
  if (a) return { op: 'asignar', valor: a[1] }
  throw new Error(`locks: no sé ejecutar \`${l}\``)
}

/** Corre RR: cada turno sigue hasta el print (clock), un lock que bloquea o el final del código. */
export function simularLocks(spec: SpecLocks): Turno[] {
  const codigo = spec.procesos.map((p) => p.codigo.map((l) => parsear(l, spec.archivo.nombre)))
  const pc = codigo.map(() => 0)
  const variable = codigo.map(() => '')
  const abierto = codigo.map((): 'read' | 'write' => 'read')
  const estado = codigo.map((): EstadoLocks['procesos'][number]['estado'] => 'ready')
  const ready = codigo.map((_, i) => i)
  let duenos: Tenencia[] = []
  const cola: Tenencia[] = []
  let archivo = spec.archivo.contenido
  const pantalla: Impresion[] = []
  const turnos: Turno[] = []

  const compatible = (modo: ModoLock) =>
    !duenos.length || (modo === 'compartido' && duenos.every((d) => d.modo === 'compartido'))

  while (ready.length) {
    if (turnos.length > 200) throw new Error('locks: el código no termina')
    const p = ready.shift()!
    const lineas: Ejecutada[] = []
    for (;;) {
      if (pc[p] >= codigo[p].length) {
        estado[p] = 'terminado'
        break
      }
      const ins = codigo[p][pc[p]]
      const linea = pc[p]
      const anotar = (evento: Evento) => lineas.push({ linea, evento })
      if (ins.op === 'open') {
        abierto[p] = ins.modo
        anotar({ tipo: 'open' })
      } else if (ins.op === 'asignar') {
        variable[p] = ins.valor
        anotar({ tipo: 'asignar' })
      } else if (ins.op === 'lock') {
        const modo: ModoLock =
          spec.modo === 'exclusivo' || abierto[p] === 'write' ? 'exclusivo' : 'compartido'
        if (!compatible(modo)) {
          anotar({ tipo: 'bloquea', modo, duenos: [...duenos] })
          cola.push({ p, modo })
          estado[p] = 'bloqueado'
          break
        }
        anotar({ tipo: 'toma', modo, con: duenos.map((d) => d.p) })
        duenos.push({ p, modo })
      } else if (ins.op === 'unlock') {
        if (!duenos.some((d) => d.p === p))
          throw new Error(`locks: ${spec.procesos[p].nombre} hace unlock sin tener el lock`)
        duenos = duenos.filter((d) => d.p !== p)
        const despierta: Tenencia[] = []
        while (cola.length && compatible(cola[0].modo)) {
          const t = cola.shift()!
          duenos.push(t)
          despierta.push(t)
          pc[t.p]++
          estado[t.p] = 'ready'
          ready.push(t.p)
        }
        anotar({ tipo: 'libera', despierta })
      } else if (ins.op === 'read' || ins.op === 'write') {
        const otros = duenos.filter((d) => d.p !== p)
        const sinLock = otros.length > 0 && !duenos.some((d) => d.p === p)
        const falla = sinLock && spec.cerrojo === 'obligatorio'
        if (!falla && ins.op === 'read') variable[p] = archivo
        if (!falla && ins.op === 'write') archivo = variable[p]
        const tipo = falla ? 'falla' : sinLock ? 'pasa' : ins.op === 'read' ? 'lee' : 'escribe'
        anotar({ tipo, op: ins.op, valor: variable[p], duenos: otros })
      } else {
        pantalla.push({ p, valor: variable[p], bloqueados: cola.map((t) => t.p) })
        anotar({ tipo: 'imprime', valor: variable[p] })
        pc[p]++
        if (pc[p] < codigo[p].length) ready.push(p)
        else estado[p] = 'terminado'
        break
      }
      pc[p]++
    }
    turnos.push({
      p,
      lineas,
      despues: {
        procesos: pc.map((n, i) => ({
          pc: n,
          estado: estado[i],
          conLock: duenos.some((d) => d.p === i),
        })),
        duenos: [...duenos],
        cola: [...cola],
        archivo,
        pantalla: [...pantalla],
      },
    })
  }
  return turnos
}
