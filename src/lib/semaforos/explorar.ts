/**
 * Explora TODAS las intercalaciones del programa (BFS sobre estados) y evalúa los tests.
 * Semántica, simetría, inanición y cotas: docs/brain/simuladores/Verificador de Semáforos.md
 */
import { parsear } from './parser'
import type {
  EjercicioSemaforos,
  Instruccion,
  Programa,
  ResultadoTest,
  ResultadoVerificacion,
  TestSemaforos,
} from './tipos'

const MAX_ESTADOS = 250_000
const TOPE_SEMAFORO = 12
const TOPE_VARIABLE = 8
/** pc de un proceso que terminó (función sin while(TRUE)). */
const FIN = -1

interface Instancia {
  grupo: number
  nombre: string
  instrucciones: Instruccion[]
  inicioCiclo: number
  tieneCiclo: boolean
}

interface Estado {
  pcs: number[]
  sems: number[]
  vars: number[]
  seq: number
}

const INANICION: TestSemaforos = { tipo: 'sin-inanicion' }

export function nombreTest(t: TestSemaforos): string {
  if (t.nombre) return t.nombre
  switch (t.tipo) {
    case 'exclusion':
      return `Mutua exclusión sobre ${t.recurso}`
    case 'concurrencia-max':
      return `Nunca hay más de ${t.max} a la vez en ${t.accion}`
    case 'concurrencia-alcanzable':
      return `Permite ${t.valor} a la vez en ${t.accion}`
    case 'capacidad':
      return `Nunca hay más de ${t.max} usando ${t.recurso}`
    case 'capacidad-alcanzable':
      return `Permite que ${t.valor} usen ${t.recurso} a la vez`
    case 'secuencia':
      return `Respeta la secuencia ${t.acciones.join(' → ')} → …`
    case 'rango':
      return `${t.variable} se mantiene entre ${t.min ?? '-∞'} y ${t.max ?? '∞'}`
    case 'sin-deadlock':
      return 'Nunca quedan todos bloqueados (sin deadlock)'
    case 'sin-inanicion':
      return 'Ningún proceso queda esperando para siempre (sin inanición)'
    case 'todas-ejecutan':
      return 'Todas las acciones llegan a ejecutarse'
    case 'max-semaforos':
      return `Usa como máximo ${t.max} semáforos`
  }
}

export function verificarSemaforos(fuente: string, ej: EjercicioSemaforos): ResultadoVerificacion {
  const { programa, errores } = parsear(fuente, ej)
  if (errores.length) return { errores, tests: [], ok: false, acotada: false }
  return { errores, ...explorar(programa, ej) }
}

const texto = (i: Instruccion) =>
  i.tipo === 'accion' ? `${i.accion}` : `${i.tipo}(${i.sem})`

export function explorar(
  programa: Programa,
  ej: EjercicioSemaforos,
): { tests: ResultadoTest[]; ok: boolean; acotada: boolean } {
  const nombresSem = Object.keys(programa.semaforos)
  const idxSem = new Map(nombresSem.map((s, i) => [s, i]))
  const nombresVar = Object.keys(ej.variables ?? {})
  const idxVar = new Map(nombresVar.map((v, i) => [v, i]))

  const instancias: Instancia[] = []
  ej.procesos.forEach((def, grupo) => {
    const p = programa.procesos.find((x) => x.nombre === def.nombre)!
    for (let k = 0; k < def.instancias; k++) instancias.push({ ...p, grupo })
  })

  const tests = ej.tests.some((t) => t.tipo === 'sin-inanicion') ? ej.tests : [...ej.tests, INANICION]
  const motivo: (string | undefined)[] = tests.map(() => undefined)
  const fallar = (k: number, m: string) => (motivo[k] ??= m)
  const maximo = tests.map(() => 0)
  const ejecutadas = new Set<string>()
  const kSecuencia = tests.findIndex((t) => t.tipo === 'secuencia')
  const secuencia = kSecuencia >= 0 ? (tests[kSecuencia] as { acciones: string[] }).acciones : null
  const enSecuencia = new Set(secuencia ?? [])

  const instrEn = (i: Instancia, pc: number) => (pc === FIN ? undefined : i.instrucciones[pc])
  const siguiente = (i: Instancia, pc: number) => {
    const n = pc + 1
    if (n < i.instrucciones.length) return n
    return i.tieneCiclo && i.instrucciones.length > i.inicioCiclo ? i.inicioCiclo : FIN
  }

  // instancias del mismo proceso son intercambiables: ordenar sus pcs reduce estados sin perder casos
  const clave = (e: Estado) => {
    const porGrupo: number[][] = []
    e.pcs.forEach((pc, i) => (porGrupo[instancias[i].grupo] ??= []).push(pc))
    return `${porGrupo.map((g) => g.sort((a, b) => a - b).join(',')).join('/')}|${e.sems}|${e.vars}|${e.seq}`
  }

  const chequearEstado = (e: Estado) => {
    tests.forEach((t, k) => {
      if (t.tipo === 'exclusion' || t.tipo === 'capacidad' || t.tipo === 'capacidad-alcanzable') {
        const dentro = instancias
          .map((inst, j) => instrEn(inst, e.pcs[j]))
          .filter((ins): ins is Extract<Instruccion, { tipo: 'accion' }> =>
            ins?.tipo === 'accion' && (ej.acciones[ins.accion]?.recursos ?? []).includes(t.recurso),
          )
        maximo[k] = Math.max(maximo[k], dentro.length)
        const detalle = dentro.map((d) => `${d.accion} (línea ${d.linea})`).join(' y ')
        if (t.tipo === 'exclusion' && dentro.length > 1) {
          fallar(k, `Dos procesos pueden estar usando ${t.recurso} al mismo tiempo: ${detalle}.`)
        }
        if (t.tipo === 'capacidad' && dentro.length > t.max) {
          fallar(k, `En alguna intercalación hay ${dentro.length} usando ${t.recurso} a la vez.`)
        }
      } else if (t.tipo === 'concurrencia-max' || t.tipo === 'concurrencia-alcanzable') {
        const n = instancias.filter((i, j) => {
          const ins = instrEn(i, e.pcs[j])
          return ins?.tipo === 'accion' && ins.accion === t.accion
        }).length
        maximo[k] = Math.max(maximo[k], n)
        if (t.tipo === 'concurrencia-max' && n > t.max) {
          fallar(k, `En alguna intercalación hay ${n} procesos a la vez en ${t.accion}.`)
        }
      } else if (t.tipo === 'rango') {
        const v = e.vars[idxVar.get(t.variable)!]
        if ((t.min != null && v < t.min) || (t.max != null && v > t.max)) {
          fallar(k, `Hay una intercalación en la que ${t.variable} llega a valer ${v}.`)
        }
      }
    })
  }

  const inicial: Estado = {
    pcs: instancias.map((i) => (i.instrucciones.length ? 0 : FIN)),
    sems: nombresSem.map((s) => programa.semaforos[s]),
    vars: nombresVar.map((v) => ej.variables![v]),
    seq: 0,
  }

  // grafo para inanición: etiqueta "grupo:pc" = alguna instancia de ese grupo avanzó desde ese pc
  const ids = new Map<string, number>()
  const estados: Estado[] = []
  const predecesores: number[][] = []
  const avancesEn: Set<string>[] = []
  const optimista = new Set<number>()
  const bloqueados = new Set<number>()

  const registrar = (e: Estado) => {
    const k = clave(e)
    let id = ids.get(k)
    if (id != null) return { id, nuevo: false }
    id = estados.length
    ids.set(k, id)
    estados.push(e)
    predecesores.push([])
    avancesEn.push(new Set())
    return { id, nuevo: true }
  }

  const kDeadlock = tests.findIndex((t) => t.tipo === 'sin-deadlock')
  let acotada = false
  const cola: number[] = [registrar(inicial).id]

  for (let cabeza = 0; cabeza < cola.length; cabeza++) {
    const id = cola[cabeza]
    const e = estados[id]
    if (estados.length > MAX_ESTADOS) {
      acotada = true
      for (let r = cabeza; r < cola.length; r++) optimista.add(cola[r])
      break
    }
    chequearEstado(e)
    let habilitadas = 0

    instancias.forEach((inst, j) => {
      const ins = instrEn(inst, e.pcs[j])
      if (!ins) return
      const sems = [...e.sems]
      const vars = [...e.vars]
      let seq = e.seq
      if (ins.tipo === 'wait') {
        const s = idxSem.get(ins.sem)!
        if (sems[s] === 0) return
        sems[s] -= 1
      } else if (ins.tipo === 'signal') {
        sems[idxSem.get(ins.sem)!] += 1
      } else {
        ejecutadas.add(ins.accion)
        for (const [v, d] of Object.entries(ej.acciones[ins.accion]?.efecto ?? {})) {
          vars[idxVar.get(v)!] += d
        }
        if (secuencia && enSecuencia.has(ins.accion)) {
          if (secuencia[seq] !== ins.accion) {
            fallar(kSecuencia, `Hay una intercalación en la que se ejecuta ${ins.accion} cuando le tocaba a ${secuencia[seq]}.`)
          }
          seq = (seq + 1) % secuencia.length
        }
      }
      habilitadas++
      avancesEn[id].add(`${inst.grupo}:${e.pcs[j]}`)
      if (sems.some((v) => v > TOPE_SEMAFORO) || vars.some((v) => Math.abs(v) > TOPE_VARIABLE)) {
        acotada = true
        optimista.add(id)
        return
      }
      const pcs = [...e.pcs]
      pcs[j] = siguiente(inst, pcs[j])
      const destino = registrar({ pcs, sems, vars, seq })
      predecesores[destino.id].push(id)
      if (destino.nuevo) cola.push(destino.id)
    })

    const vivos = instancias.filter((_, j) => e.pcs[j] !== FIN)
    if (habilitadas === 0 && vivos.length > 0) {
      bloqueados.add(id)
      if (kDeadlock >= 0) {
        const donde = [
          ...new Set(
            instancias
              .map((inst, j) => ({ inst, ins: instrEn(inst, e.pcs[j]) }))
              .filter((x) => x.ins)
              .map(({ inst, ins }) => `${inst.nombre} en ${texto(ins!)} (línea ${ins!.linea})`),
          ),
        ]
        fallar(kDeadlock, `Hay una intercalación en la que todos quedan bloqueados: ${donde.join(', ')}.`)
      }
    }
  }

  const kInanicion = tests.findIndex((t) => t.tipo === 'sin-inanicion')
  const puedeAvanzar = new Map<string, Set<number>>()
  const alcanzan = (etiqueta: string) => {
    let set = puedeAvanzar.get(etiqueta)
    if (set) return set
    set = new Set<number>()
    const pila: number[] = []
    estados.forEach((_, id) => {
      if (avancesEn[id].has(etiqueta) || optimista.has(id)) {
        set!.add(id)
        pila.push(id)
      }
    })
    while (pila.length) {
      for (const p of predecesores[pila.pop()!]) {
        if (!set.has(p)) {
          set.add(p)
          pila.push(p)
        }
      }
    }
    puedeAvanzar.set(etiqueta, set)
    return set
  }

  explorados: for (let id = 0; id < estados.length && motivo[kInanicion] == null; id++) {
    if (optimista.has(id) || bloqueados.has(id)) continue
    const e = estados[id]
    for (let j = 0; j < instancias.length; j++) {
      const inst = instancias[j]
      const pc = e.pcs[j]
      if (pc === FIN || alcanzan(`${inst.grupo}:${pc}`).has(id)) continue
      const ins = inst.instrucciones[pc]
      let m = `Hay una ejecución en la que un ${inst.nombre} queda esperando en ${texto(ins)} (línea ${ins.linea}) para siempre`
      if (ins.tipo === 'wait') m += `: después de ese punto nadie vuelve a hacer signal(${ins.sem}).`
      if (ins.tipo === 'wait' && inst.tieneCiclo && pc < inst.inicioCiclo) {
        m += ` Ese wait está antes del while(TRUE), así que cada ${inst.nombre} lo ejecuta una sola vez: el que pasa primero se queda en el ciclo y los demás quedan bloqueados.`
      }
      fallar(kInanicion, m)
      break explorados
    }
  }

  const resultados: ResultadoTest[] = tests.map((t, k) => {
    let m = motivo[k]
    if (t.tipo === 'concurrencia-alcanzable' && maximo[k] < t.valor) {
      m = `Nunca llegan a estar ${t.valor} en ${t.accion} a la vez (como mucho ${maximo[k]}): la sincronización restringe más de lo necesario.`
    }
    if (t.tipo === 'capacidad-alcanzable' && maximo[k] < t.valor) {
      m = `Nunca llegan a estar ${t.valor} usando ${t.recurso} a la vez (como mucho ${maximo[k]}): la sincronización restringe más de lo necesario.`
    }
    if (t.tipo === 'todas-ejecutan') {
      const faltan = Object.keys(ej.acciones).filter((a) => !ejecutadas.has(a))
      m = faltan.length ? `Nunca llega a ejecutarse: ${faltan.join(', ')}.` : undefined
    }
    if (t.tipo === 'max-semaforos' && nombresSem.length > t.max) {
      m = `Usaste ${nombresSem.length} semáforos y el enunciado pide como máximo ${t.max}.`
    }
    return { nombre: nombreTest(t), ok: m == null, ...(m ? { motivo: m } : {}) }
  })
  return { tests: resultados, ok: resultados.every((r) => r.ok), acotada }
}
