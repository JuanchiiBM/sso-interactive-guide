/**
 * Explora TODAS las intercalaciones del programa (BFS sobre estados) y evalúa los tests.
 * Semántica, simetría, inanición y cotas: docs/brain/simuladores/Verificador de Semáforos.md
 */
import { parsear, textoAccion } from './parser'
import type {
  AccionSpec,
  EjercicioSemaforos,
  Instruccion,
  Programa,
  RefSemaforo,
  ResultadoTest,
  ResultadoVerificacion,
  TestSemaforos,
} from './tipos'

const MAX_ESTADOS = 250_000
const TOPE_SEMAFORO = 12
const TOPE_VARIABLE = 8
const ALCANZABILIDAD = new Set(['concurrencia-alcanzable', 'capacidad-alcanzable', 'simultaneas', 'valor-alcanzable', 'todas-ejecutan'])
/** pc de un proceso que terminó (función sin while(TRUE)). */
const FIN = -1

interface Instancia {
  grupo: number
  /** Posición dentro de su grupo: es el valor de `id`. */
  id: number
  nombre: string
  instrucciones: Instruccion[]
  inicioCiclo: number
  tieneCiclo: boolean
}

interface Estado {
  pcs: number[]
  sems: number[]
  vars: number[]
  /** Locales de cada instancia, aplanadas: instancia * cantidad de locales + k. */
  locs: number[]
  /** Unidades libres de cada recurso implícito. */
  impl: number[]
  seq: number
  orden: number[]
}

class ErrorEjecucion extends Error {
  constructor(
    mensaje: string,
    readonly linea: number,
  ) {
    super(mensaje)
  }
}

const INANICION: TestSemaforos = { tipo: 'sin-inanicion' }

export function nombreTest(t: TestSemaforos): string {
  if (t.nombre) return t.nombre
  const recurso = (r: string) => (r.endsWith('[*]') ? `cada ${r.slice(0, -3)}` : r)
  switch (t.tipo) {
    case 'exclusion':
      return `Mutua exclusión sobre ${recurso(t.recurso)}`
    case 'concurrencia-max':
      return `Nunca hay más de ${t.max} a la vez en ${t.accion}`
    case 'concurrencia-alcanzable':
      return `Permite ${t.valor} a la vez en ${t.accion}`
    case 'capacidad':
      return `Nunca hay más de ${t.max} usando ${recurso(t.recurso)}`
    case 'capacidad-alcanzable':
      return `Permite que ${t.valor} usen ${recurso(t.recurso)} a la vez`
    case 'secuencia':
      return `Respeta la secuencia ${t.acciones.join(' → ')} → …`
    case 'orden-instancias':
      return `Los ${t.proceso} hacen ${t.accion} en orden`
    case 'rango':
      return `${t.variable} se mantiene entre ${t.min ?? '-∞'} y ${t.max ?? '∞'}`
    case 'simultaneas':
      return `Pueden estar a la vez en ${t.acciones[0]} y ${t.acciones[1]}`
    case 'valor-alcanzable':
      return `${t.variable} puede llegar a ${t.valor}`
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
  try {
    return { errores, ...explorar(programa, ej) }
  } catch (e) {
    if (!(e instanceof ErrorEjecucion)) throw e
    return { errores: [{ linea: e.linea, mensaje: e.message, ejecucion: true }], tests: [], ok: false, acotada: false }
  }
}

const refTexto = (r: RefSemaforo) => (r.indice != null ? `${r.nombre}[${r.indice}]` : r.nombre)
const texto = (i: Instruccion) => (i.tipo === 'accion' ? i.accion : `${i.tipo}(${refTexto(i.sem)})`)

/** Todas las asignaciones posibles de `n` variables con valores 0..k-1. */
function combinaciones(n: number, k: number, distintos: boolean): number[][] {
  const out: number[][] = []
  const rec = (pref: number[]) => {
    if (pref.length === n) return void out.push(pref)
    for (let v = 0; v < k; v++) if (!distintos || !pref.includes(v)) rec([...pref, v])
  }
  rec([])
  return out
}

export function explorar(
  programa: Programa,
  ej: EjercicioSemaforos,
): { tests: ResultadoTest[]; ok: boolean; acotada: boolean } {
  // ── layout del estado ──
  const baseSem = new Map<string, number>()
  const semIniciales: number[] = []
  for (const [nombre, decl] of Object.entries(programa.semaforos)) {
    baseSem.set(nombre, semIniciales.length)
    semIniciales.push(...decl.valores)
  }
  const nombresVar = Object.keys(ej.variables ?? {})
  const idxVar = new Map(nombresVar.map((v, i) => [v, i]))
  const locales = ej.locales ?? []
  const idxLocal = new Map(locales.map((v, i) => [v, i]))
  const idxImpl = new Map<string, number>()
  const implIniciales: number[] = []
  for (const [nombre, r] of Object.entries(ej.recursosImplicitos ?? {})) {
    for (let k = 0; k < r.cantidad; k++) {
      idxImpl.set(`${nombre}[${k}]`, implIniciales.length)
      implIniciales.push(r.instancias)
    }
  }

  const instancias: Instancia[] = []
  ej.procesos.forEach((def, grupo) => {
    const p = programa.procesos.find((x) => x.nombre === def.nombre)!
    for (let id = 0; id < def.instancias; id++) instancias.push({ ...p, grupo, id })
  })

  const tests = ej.tests.some((t) => t.tipo === 'sin-inanicion') ? ej.tests : [...ej.tests, INANICION]
  const motivo: (string | undefined)[] = tests.map(() => undefined)
  const fallar = (k: number, m: string) => (motivo[k] ??= tests[k].motivo ?? m)
  const maximo = tests.map(() => 0)
  const ejecutadas = new Set<string>()
  const kSecuencia = tests.findIndex((t) => t.tipo === 'secuencia')
  const secuencia = kSecuencia >= 0 ? (tests[kSecuencia] as { acciones: string[] }).acciones : null
  const enSecuencia = new Set(secuencia ?? [])
  const ordenes = tests
    .map((t, k) => ({ t, k }))
    .filter((x): x is { t: Extract<TestSemaforos, { tipo: 'orden-instancias' }>; k: number } => x.t.tipo === 'orden-instancias')
    .map(({ t, k }) => ({ k, accion: t.accion, grupo: ej.procesos.findIndex((p) => p.nombre === t.proceso) }))

  // si el código usa `id`, las instancias dejan de ser intercambiables
  const usaId =
    ordenes.length > 0 ||
    instancias.some((i) => i.instrucciones.some((x) => x.tipo !== 'accion' && x.sem.indice === 'id')) ||
    Object.values(ej.acciones).some((a) =>
      [...(a.recursos ?? []), ...(a.adquiere ?? []), ...(a.libera ?? [])].some((r) => r.includes('[id]')),
    )

  // ── resolución de índices y nombres con índice ──
  const valorIndice = (expr: string, j: number, e: Estado, linea: number): number => {
    const x = expr.trim()
    if (/^\d+$/.test(x)) return Number(x)
    if (x === 'id') return instancias[j].id
    const kl = idxLocal.get(x)
    if (kl != null) return e.locs[j * locales.length + kl]
    const kv = idxVar.get(x)
    if (kv != null) return e.vars[kv]
    if (ej.constantes?.[x] != null) return ej.constantes[x]
    const f = ej.funciones?.[x]
    if (f) {
      const v = e.vars[idxVar.get(f.variable)!] + (f.mas ?? 0)
      return f.modulo ? ((v % f.modulo) + f.modulo) % f.modulo : v
    }
    throw new ErrorEjecucion(`En ejecución: no se puede evaluar el índice "${x}"`, linea)
  }
  const resolver = (plantilla: string, j: number, e: Estado, linea: number) =>
    plantilla.replace(/\[((?:[^[\]]|\[[^\]]*\])+)\]/g, (_, expr: string) => `[${valorIndice(expr, j, e, linea)}]`)

  const slotSem = (ref: RefSemaforo, j: number, e: Estado, linea: number) => {
    const base = baseSem.get(ref.nombre)!
    if (ref.indice == null) return base
    const i = valorIndice(ref.indice, j, e, linea)
    const tam = programa.semaforos[ref.nombre].valores.length
    if (i < 0 || i >= tam) {
      throw new ErrorEjecucion(
        `En ejecución: ${ref.nombre}[${ref.indice}] vale ${ref.nombre}[${i}], pero ${ref.nombre} tiene ${tam} posiciones (0 a ${tam - 1})`,
        linea,
      )
    }
    return base + i
  }
  const slotImpl = (nombre: string, linea: number) => {
    const k = idxImpl.get(nombre)
    if (k == null) throw new ErrorEjecucion(`En ejecución: el recurso ${nombre} no existe`, linea)
    return k
  }

  const instrEn = (i: Instancia, pc: number) => (pc === FIN ? undefined : i.instrucciones[pc])
  const siguiente = (i: Instancia, pc: number) => {
    const n = pc + 1
    if (n < i.instrucciones.length) return n
    return i.tieneCiclo && i.instrucciones.length > i.inicioCiclo ? i.inicioCiclo : FIN
  }
  // una acción puede tener spec propia por proceso: "Jugador::posicionarse()"
  const spec = (ins: Instruccion, inst: Instancia): AccionSpec =>
    ins.tipo === 'accion' ? (ej.acciones[`${inst.nombre}::${ins.accion}`] ?? ej.acciones[ins.accion] ?? {}) : {}

  const clave = (e: Estado) => {
    const tupla = (j: number) =>
      [e.pcs[j], ...e.locs.slice(j * locales.length, (j + 1) * locales.length)].join('.')
    let pcs: string
    if (usaId) {
      pcs = instancias.map((_, j) => tupla(j)).join(',')
    } else {
      // instancias del mismo proceso son intercambiables: ordenar sus tuplas reduce estados sin perder casos
      const porGrupo: string[][] = []
      instancias.forEach((inst, j) => (porGrupo[inst.grupo] ??= []).push(tupla(j)))
      pcs = porGrupo.map((g) => g.sort().join(',')).join('/')
    }
    return `${pcs}|${e.sems}|${e.vars}|${e.impl}|${e.seq}|${e.orden}`
  }

  const coincide = (patron: string, nombre: string) =>
    patron.endsWith('[*]') ? nombre.startsWith(`${patron.slice(0, -3)}[`) : nombre === patron

  const chequearEstado = (e: Estado): boolean => {
    let violado = false
    // recursos en uso por instancia (resueltos con sus locales)
    const enUso = instancias.map((inst, j) => {
      const ins = instrEn(inst, e.pcs[j])
      if (ins?.tipo !== 'accion') return [] as { nombre: string; ins: Extract<Instruccion, { tipo: 'accion' }> }[]
      return (spec(ins, inst).recursos ?? []).map((r) => ({ nombre: resolver(r, j, e, ins.linea), ins }))
    })
    tests.forEach((t, k) => {
      if (t.tipo === 'exclusion' || t.tipo === 'capacidad' || t.tipo === 'capacidad-alcanzable') {
        const porNombre = new Map<string, Extract<Instruccion, { tipo: 'accion' }>[]>()
        for (const lista of enUso) {
          for (const u of lista) {
            if (!coincide(t.recurso, u.nombre)) continue
            porNombre.set(u.nombre, [...(porNombre.get(u.nombre) ?? []), u.ins])
          }
        }
        for (const [nombre, dentro] of porNombre) {
          maximo[k] = Math.max(maximo[k], dentro.length)
          const detalle = dentro.map((d) => `${d.accion} (línea ${d.linea})`).join(' y ')
          if (t.tipo === 'exclusion' && dentro.length > 1) {
            fallar(k, `Dos procesos pueden estar usando ${nombre} al mismo tiempo: ${detalle}.`)
            violado = true
          }
          if (t.tipo === 'capacidad' && dentro.length > t.max) {
            fallar(k, `En alguna intercalación hay ${dentro.length} usando ${nombre} a la vez.`)
            violado = true
          }
        }
      } else if (t.tipo === 'concurrencia-max' || t.tipo === 'concurrencia-alcanzable') {
        const n = instancias.filter((i, j) => {
          const ins = instrEn(i, e.pcs[j])
          return ins?.tipo === 'accion' && ins.accion === t.accion
        }).length
        maximo[k] = Math.max(maximo[k], n)
        if (t.tipo === 'concurrencia-max' && n > t.max) {
          fallar(k, `En alguna intercalación hay ${n} procesos a la vez en ${t.accion}.`)
          violado = true
        }
      } else if (t.tipo === 'simultaneas') {
        const en = instancias.map((i, j) => instrEn(i, e.pcs[j])).map((x) => (x?.tipo === 'accion' ? x.accion : null))
        const a = en.indexOf(t.acciones[0])
        if (a >= 0 && en.some((x, j) => j !== a && x === t.acciones[1])) maximo[k] = 1
      } else if (t.tipo === 'valor-alcanzable') {
        if (e.vars[idxVar.get(t.variable)!] >= t.valor) maximo[k] = Math.max(maximo[k], t.valor)
      } else if (t.tipo === 'rango') {
        const v = e.vars[idxVar.get(t.variable)!]
        if ((t.min != null && v < t.min) || (t.max != null && v > t.max)) {
          fallar(k, `Hay una intercalación en la que ${t.variable} llega a valer ${v}.`)
          violado = true
        }
      }
    })
    return violado
  }

  const inicial: Estado = {
    pcs: instancias.map((i) => (i.instrucciones.length ? 0 : FIN)),
    sems: semIniciales,
    vars: nombresVar.map((v) => ej.variables![v]),
    locs: instancias.flatMap(() => locales.map(() => 0)),
    impl: implIniciales,
    seq: 0,
    orden: ordenes.map(() => 0),
  }

  // grafo para inanición: etiqueta "grupo:pc" = alguna instancia de ese grupo avanzó desde ese pc
  const ids = new Map<string, number>()
  const estados: Estado[] = []
  const predecesores: number[][] = []
  const avancesEn: Set<string>[] = []
  const optimista = new Set<number>()
  const bloqueados = new Set<number>()
  const etiqueta = (j: number, pc: number) => (usaId ? `${j}:${pc}` : `${instancias[j].grupo}:${pc}`)

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

  /** Estados siguientes si la instancia j da un paso (vacío si está bloqueada). */
  const pasos = (e: Estado, j: number): Estado[] => {
    const inst = instancias[j]
    const ins = instrEn(inst, e.pcs[j])
    if (!ins) return []
    const pcs = [...e.pcs]
    pcs[j] = siguiente(inst, pcs[j])
    if (ins.tipo === 'wait' || ins.tipo === 'signal') {
      const s = slotSem(ins.sem, j, e, ins.linea)
      if (ins.tipo === 'wait' && e.sems[s] === 0) return []
      const sems = [...e.sems]
      sems[s] += ins.tipo === 'wait' ? -1 : 1
      return [{ ...e, pcs, sems }]
    }
    const a = spec(ins, inst)
    const impl = [...e.impl]
    for (const r of a.adquiere ?? []) {
      const k = slotImpl(resolver(r, j, e, ins.linea), ins.linea)
      if (impl[k] === 0) return []
      impl[k] -= 1
    }
    for (const r of a.libera ?? []) impl[slotImpl(resolver(r, j, e, ins.linea), ins.linea)] += 1
    const vars = [...e.vars]
    for (const [v, d] of Object.entries(a.efecto ?? {})) {
      const k = idxVar.get(v)!
      vars[k] += d
      const m = ej.modulos?.[v]
      if (m) vars[k] = ((vars[k] % m) + m) % m
    }
    let seq = e.seq
    if (secuencia && enSecuencia.has(ins.accion)) {
      if (secuencia[seq] !== ins.accion) {
        fallar(kSecuencia, `Hay una intercalación en la que se ejecuta ${ins.accion} cuando le tocaba a ${secuencia[seq]}.`)
      }
      seq = (seq + 1) % secuencia.length
    }
    const orden = [...e.orden]
    ordenes.forEach((o, n) => {
      if (o.accion !== ins.accion || o.grupo !== inst.grupo) return
      if (orden[n] !== inst.id) {
        fallar(o.k, `Hay una intercalación en la que el ${inst.nombre} con id ${inst.id} hace ${ins.accion} cuando le tocaba al de id ${orden[n]}.`)
      }
      orden[n] = (orden[n] + 1) % ej.procesos[o.grupo].instancias
    })
    ejecutadas.add(ins.accion)
    const base = { ...e, pcs, vars, impl, seq, orden }
    if (!a.asigna) return [base]
    const { variables, valores, distintos = false } = a.asigna
    return combinaciones(variables.length, valores, distintos).map((vals) => {
      const locs = [...e.locs]
      variables.forEach((v, n) => (locs[j * locales.length + idxLocal.get(v)!] = vals[n]))
      return { ...base, locs }
    })
  }

  const kDeadlock = tests.findIndex((t) => t.tipo === 'sin-deadlock')
  let acotada = false
  let podado = false
  const cola: number[] = [registrar(inicial).id]

  for (let cabeza = 0; cabeza < cola.length; cabeza++) {
    const id = cola[cabeza]
    const e = estados[id]
    if (estados.length > MAX_ESTADOS) {
      acotada = true
      for (let r = cabeza; r < cola.length; r++) optimista.add(cola[r])
      break
    }
    // un estado que ya viola un test de seguridad no se expande (ver brain: poda por violación)
    if (chequearEstado(e)) {
      podado = true
      optimista.add(id)
      continue
    }
    let habilitadas = 0

    instancias.forEach((_, j) => {
      const siguientes = pasos(e, j)
      if (!siguientes.length) return
      habilitadas++
      avancesEn[id].add(etiqueta(j, e.pcs[j]))
      for (const nuevo of siguientes) {
        if (nuevo.sems.some((v) => v > TOPE_SEMAFORO) || nuevo.vars.some((v) => Math.abs(v) > TOPE_VARIABLE)) {
          acotada = true
          optimista.add(id)
          continue
        }
        const destino = registrar(nuevo)
        predecesores[destino.id].push(id)
        if (destino.nuevo) cola.push(destino.id)
      }
    })

    if (habilitadas === 0 && instancias.some((_, j) => e.pcs[j] !== FIN)) {
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
  const alcanzan = (et: string) => {
    let set = puedeAvanzar.get(et)
    if (set) return set
    set = new Set<number>()
    const pila: number[] = []
    estados.forEach((_, id) => {
      if (avancesEn[id].has(et) || optimista.has(id)) {
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
    puedeAvanzar.set(et, set)
    return set
  }

  explorados: for (let id = 0; id < estados.length && motivo[kInanicion] == null; id++) {
    if (optimista.has(id) || bloqueados.has(id)) continue
    const e = estados[id]
    for (let j = 0; j < instancias.length; j++) {
      const inst = instancias[j]
      const pc = e.pcs[j]
      if (pc === FIN || alcanzan(etiqueta(j, pc)).has(id)) continue
      const ins = inst.instrucciones[pc]
      let m = `Hay una ejecución en la que un ${inst.nombre} queda esperando en ${texto(ins)} (línea ${ins.linea}) para siempre`
      if (ins.tipo === 'wait') m += `: después de ese punto nadie vuelve a hacer signal(${refTexto(ins.sem)}).`
      else m += ': el recurso que pide nunca se libera.'
      if (ins.tipo === 'wait' && inst.tieneCiclo && pc < inst.inicioCiclo) {
        m += ` Ese wait está antes del while(TRUE), así que cada ${inst.nombre} lo ejecuta una sola vez: el que pasa primero se queda en el ciclo y los demás quedan bloqueados.`
      }
      fallar(kInanicion, m)
      break explorados
    }
  }

  const nSemaforos = Object.keys(programa.semaforos).length
  const resultados: ResultadoTest[] = tests.map((t, k) => {
    let m = motivo[k]
    if (t.tipo === 'concurrencia-alcanzable' && maximo[k] < t.valor) {
      m = `Nunca llegan a estar ${t.valor} en ${t.accion} a la vez (como mucho ${maximo[k]}): la sincronización restringe más de lo necesario.`
    }
    if (t.tipo === 'capacidad-alcanzable' && maximo[k] < t.valor) {
      m = `Nunca llegan a estar ${t.valor} usando ${t.recurso.replace('[*]', '')} a la vez (como mucho ${maximo[k]}): la sincronización restringe más de lo necesario.`
    }
    if (t.tipo === 'simultaneas' && maximo[k] === 0) {
      m = t.motivo ?? `Nunca pueden estar a la vez en ${t.acciones[0]} y ${t.acciones[1]}: la sección crítica abarca más de lo necesario.`
    }
    if (t.tipo === 'valor-alcanzable' && maximo[k] < t.valor) {
      m = t.motivo ?? `${t.variable} nunca llega a ${t.valor}: la sincronización restringe más de lo necesario.`
    }
    if (t.tipo === 'todas-ejecutan') {
      const faltan = [...new Set(Object.keys(ej.acciones).map(textoAccion))].filter((a) => !ejecutadas.has(a))
      m = faltan.length ? `Nunca llega a ejecutarse: ${faltan.join(', ')}.` : undefined
    }
    if (t.tipo === 'max-semaforos' && nSemaforos > t.max) {
      m = `Usaste ${nSemaforos} semáforos y el enunciado pide como máximo ${t.max}.`
    }
    // con poda, "nunca se alcanza" no es concluyente: el fallo de seguridad ya basta
    if (podado && ALCANZABILIDAD.has(t.tipo)) m = undefined
    return { nombre: nombreTest(t), ok: m == null, ...(m ? { motivo: m } : {}) }
  })
  return { tests: resultados, ok: resultados.every((r) => r.ok), acotada }
}
