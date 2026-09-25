/**
 * Simulador de planificación de corto plazo, tick a tick (unidad de tiempo entera).
 * Modelo, variantes, hilos y desempates: docs/brain/simuladores/Simulador de Planificación.md
 */
import {
  esKlt,
  FILA_SO,
  type AlgoritmoBase,
  type AlgoritmoBiblioteca,
  type ColaConfig,
  type ConfigPlanificacion,
  type EstadoDispositivo,
  type EstadoProceso,
  type MetricasProceso,
  type ModoIO,
  type OrigenListo,
  type ResultadoPlanificacion,
  type Tick,
} from './tipos'

// Criterio de la guía UTN FRBA: clock > fin de evento (E/S) > nuevo; después, nombre ascendente
const DESEMPATE_DEFAULT: OrigenListo[] = ['desalojo', 'io', 'nuevo']
const LIMITE_TICKS = 10_000
const DISPOSITIVO_UNICO = 'E/S'

/** Lo que ejecuta en una CPU: un proceso / KLT simple o un ULT. */
interface Hilo {
  id: string
  llegada: number
  rafagas: number[]
  prioridad: number
  dispositivos?: string[]
  rafaga: number
  restante: number
  estado: EstadoProceso
  espera: number
  primerCPU: number | null
  fin: number | null
  /** Solo ULTs: su KLT. */
  klt: Pcb | null
}

/** Biblioteca de ULTs de un KLT: decide solo mientras el KLT tiene la CPU. */
interface Biblioteca {
  algoritmo: AlgoritmoBiblioteca
  quantum: number | null
  modo: ModoIO
  ults: Hilo[]
  actual: Hilo | null
  listos: Hilo[]
  /** Entró un ULT a su cola desde la última decisión: una biblioteca desalojante revisa. */
  novedad: boolean
  /** Quantum de la biblioteca ya usado por `actual`. */
  usado: number
  pendientes: { h: Hilo; origen: OrigenListo }[]
  /** ULT cuya E/S (directa o wrapper) tiene bloqueado a todo el KLT. */
  bloqueante: Hilo | null
  /** Volvió de una syscall directa: la biblioteca no se enteró y sigue el mismo. */
  trasDirecta: boolean
}

/** Lo que planifica el SO: proceso, KLT simple (es su propio hilo) o KLT con biblioteca. */
interface Pcb extends Hilo {
  colaFija: number
  listoDesde: number
  /** Cola de listos en la que está (o de la que salió si ejecuta). */
  cola: number
  /** VRR: CPU usado desde que se lo eligió por última vez de la cola principal. */
  usadoVRR: number
  afinidad: number | null
  /** Estimación por índice de ráfaga (solo ráfagas de CPU). */
  est: number[]
  bib: Biblioteca | null
}

interface Entrante {
  id: string
  origen: OrigenListo
  cola: number
  texto?: string
}

interface Cpu {
  id: string | null
  usado: number
  limite: number | null
  /** Interrupciones que el SO atiende en esta CPU (la primera se está atendiendo). */
  so: { h: Hilo; restante: number }[]
}

/** Proceso para el grado de multiprogramación: agrupa sus KLTs (`proceso` en la config). */
interface Grupo {
  id: string
  prioridad: number
  klts: Pcb[]
  estado: 'fuera' | 'new' | 'memoria' | 'suspendido' | 'fin'
}

interface DatosHilo {
  id: string
  llegada: number
  rafagas: number[]
  prioridad?: number
  dispositivos?: string[]
}

const DESALOJANTES: AlgoritmoBase[] = ['srt', 'prioridades-desalojo']

const NOMBRE_BIB: Record<AlgoritmoBiblioteca, string> = {
  fifo: 'FIFO',
  sjf: 'SJF',
  srt: 'SRT',
  rr: 'RR',
  prioridades: 'prioridades',
  'prioridades-desalojo': 'prioridades con desalojo',
}

const nuevoHilo = (u: DatosHilo, klt: Pcb | null): Hilo => ({
  id: u.id,
  llegada: u.llegada,
  rafagas: u.rafagas,
  prioridad: u.prioridad ?? 0,
  dispositivos: u.dispositivos,
  rafaga: 0,
  restante: u.rafagas[0] ?? 0,
  estado: 'nuevo',
  espera: 0,
  primerCPU: null,
  fin: null,
  klt,
})

export interface OpcionesSimulacion {
  /** Con 2+ CPUs libres a la vez, qué CPU toma primero es arbitrario: `true` invierte el orden en esa decisión. */
  invertirCpus?: (decision: number) => boolean
}

export function simularPlanificacion(
  config: ConfigPlanificacion,
  opts: OpcionesSimulacion = {},
): ResultadoPlanificacion {
  let decisionesCpu = 0
  const { algoritmo, quantum, ioUnica = true, prioridadMenorEsMejor = true, alfa } = config
  const desempate = config.desempate ?? DESEMPATE_DEFAULT
  const grado = config.multiprogramacion
  const nCpus = config.procesadores ?? 1
  const afinidad = nCpus > 1 && (config.afinidad ?? false)
  const multicola = algoritmo === 'multinivel' || algoritmo === 'feedback'
  const desalojoEntreColas = multicola && (config.desalojoEntreColas ?? true)
  const trasIO = config.trasIO ?? 'misma'
  const suspension = grado != null && (config.suspensionPorPrioridad ?? false)
  const overhead = config.overheadInterrupcion ?? 0

  if ((algoritmo === 'rr' || algoritmo === 'vrr') && !quantum) {
    throw new Error(
      `${algoritmo === 'rr' ? 'Round Robin' : 'Virtual Round Robin'} requiere quantum`,
    )
  }
  const defColas = definirColas(config)
  const ultimaCola = defColas.length - 1

  const pcbs = new Map<string, Pcb>()
  const hilos = new Map<string, Hilo>()
  const registrar = (h: Hilo) => {
    if (hilos.has(h.id) || pcbs.has(h.id)) throw new Error(`Id repetido: ${h.id}`)
    hilos.set(h.id, h)
  }
  for (const p of config.procesos) {
    let colaFija = 0
    if (algoritmo === 'multinivel') {
      if (p.cola == null || p.cola < 1 || p.cola > defColas.length) {
        throw new Error(`Multinivel: ${p.id} necesita una cola entre 1 y ${defColas.length}`)
      }
      colaFija = p.cola - 1
    }
    const so = { colaFija, cola: colaFija, usadoVRR: 0, afinidad: null, est: [] }
    if (!esKlt(p)) {
      const pcb: Pcb = { ...nuevoHilo(p, null), ...so, listoDesde: p.llegada, bib: null }
      registrar(pcb)
      pcbs.set(p.id, pcb)
      continue
    }
    if (!p.hilos.length) throw new Error(`${p.id} no tiene ULTs`)
    if (alfa != null) throw new Error('La estimación con α no está soportada con ULTs')
    const algBib = p.biblioteca ?? 'fifo'
    if (algBib === 'rr' && !p.quantumBiblioteca) {
      throw new Error(`La biblioteca RR de ${p.id} requiere quantumBiblioteca`)
    }
    const llegada = Math.min(...p.hilos.map((u) => u.llegada))
    const base = nuevoHilo({ id: p.id, llegada, rafagas: [], prioridad: p.prioridad }, null)
    const pcb: Pcb = { ...base, ...so, listoDesde: llegada, bib: null }
    const ults = p.hilos.map((u) => nuevoHilo(u, pcb))
    pcb.bib = {
      algoritmo: algBib,
      quantum: algBib === 'rr' ? p.quantumBiblioteca! : null,
      modo: p.modoIO ?? 'wrapper',
      ults,
      actual: null,
      listos: [],
      novedad: false,
      usado: 0,
      pendientes: [],
      bloqueante: null,
      trasDirecta: false,
    }
    if (hilos.has(p.id) || pcbs.has(p.id)) throw new Error(`Id repetido: ${p.id}`)
    pcbs.set(p.id, pcb)
    ults.forEach(registrar)
  }
  const todos = [...pcbs.values()]
  const get = (id: string) => pcbs.get(id)!
  const grupos = new Map<string, Grupo>()
  const grupoDe = new Map<string, Grupo>()
  for (const p of config.procesos) {
    const gid = p.proceso ?? p.id
    if (gid !== p.id && pcbs.has(gid)) throw new Error(`El proceso ${gid} tiene el id de un KLT`)
    if (!grupos.has(gid)) {
      grupos.set(gid, { id: gid, prioridad: get(p.id).prioridad, klts: [], estado: 'fuera' })
    }
    grupos.get(gid)!.klts.push(get(p.id))
    grupoDe.set(p.id, grupos.get(gid)!)
  }
  // Candidato a suspender: todos sus KLTs vivos (ya llegados) están en Ready
  const enReady = (g: Grupo) => {
    const vivos = g.klts.filter((k) => k.fin == null && k.estado !== 'nuevo')
    return (
      vivos.length > 0 && vivos.every((k) => k.estado === 'listo' && colas[k.cola].includes(k.id))
    )
  }
  const unitario = (g: Grupo) => g.klts.length === 1 && g.klts[0].id === g.id
  if (overhead > 0 && hilos.has(FILA_SO))
    throw new Error(`"${FILA_SO}" está reservado para la fila del SO`)
  const getH = (id: string) => hilos.get(id)!
  const hayHilos = todos.some((p) => p.bib)
  const quien = hayHilos ? 'El SO' : 'El planificador'

  const colas: string[][] = defColas.map(() => [])
  const cpus: Cpu[] = Array.from({ length: nCpus }, () => ({
    id: null,
    usado: 0,
    limite: null,
    so: [],
  }))
  const dispositivos = new Map<string, EstadoDispositivo>()
  const conDispositivos = [...hilos.values()].some((h) => h.dispositivos?.length)
  const enParalelo = new Set<string>()
  /** Procesos (grupos) esperando admisión, en orden de llegada. */
  const colaNew: string[] = []
  const suspendidos: Grupo[] = []
  let admitidos = 0
  let pendientes: Entrante[] = []
  let avisos: string[] = []
  const ociosa: (string | null)[] = cpus.map(() => null)
  const ticks: Tick[] = []

  const nombreCola = (q: number) => {
    if (algoritmo === 'vrr') return q === 0 ? 'la cola auxiliar' : 'la cola de listos principal'
    if (defColas.length === 1) return 'la cola de listos'
    const c = defColas[q]
    return `la cola ${q + 1} (${etiquetaAlgoritmo(c)})`
  }
  const cpuTxt = (k: number) => (nCpus > 1 ? ` en el CPU ${k + 1}` : '')

  const mejorULT = (a: Hilo, b: Hilo, alg: AlgoritmoBiblioteca): boolean => {
    if (alg === 'sjf' || alg === 'srt') return a.restante < b.restante
    if (alg === 'prioridades' || alg === 'prioridades-desalojo') {
      return prioridadMenorEsMejor ? a.prioridad < b.prioridad : a.prioridad > b.prioridad
    }
    return false
  }
  // El ULT que correría si el KLT tuviera la CPU ahora (empate → el primero de la cola)
  const candidato = (b: Biblioteca): { h: Hilo | null; desaloja: boolean } => {
    let mejorListo: Hilo | null = null
    for (const u of b.listos)
      if (!mejorListo || mejorULT(u, mejorListo, b.algoritmo)) mejorListo = u
    if (!b.actual) return { h: mejorListo, desaloja: false }
    const desaloja =
      !b.trasDirecta &&
      b.novedad &&
      mejorListo != null &&
      DESALOJANTES.includes(b.algoritmo) &&
      mejorULT(mejorListo, b.actual, b.algoritmo)
    return desaloja ? { h: mejorListo, desaloja } : { h: b.actual, desaloja }
  }
  // Para SJF/SRT/HRRN del SO, la ráfaga de un KLT es la del ULT que su biblioteca tiene elegido
  const hiloActivo = (p: Pcb): Hilo => (p.bib ? (candidato(p.bib).h ?? p) : p)

  const estimacion = (p: Pcb) => p.est[p.rafaga]
  const criterioSJF = (p: Pcb, alg: AlgoritmoBase) => {
    if (alfa == null) return hiloActivo(p).restante
    return alg === 'srt' ? estimacion(p) - (p.rafagas[p.rafaga] - p.restante) : estimacion(p)
  }
  const responseRatio = (p: Pcb, t: number): number => {
    const h = hiloActivo(p)
    const s = h.rafagas[h.rafaga]
    return (t - p.listoDesde + s) / s
  }

  const mejor = (a: Pcb, b: Pcb, alg: AlgoritmoBase, t: number): boolean => {
    switch (alg) {
      case 'sjf':
      case 'srt':
        return criterioSJF(a, alg) < criterioSJF(b, alg)
      case 'prioridades':
      case 'prioridades-desalojo':
        return prioridadMenorEsMejor ? a.prioridad < b.prioridad : a.prioridad > b.prioridad
      case 'hrrn':
        return responseRatio(a, t) > responseRatio(b, t)
      default:
        return false
    }
  }

  // Mejor candidato para el CPU k: primera cola no vacía (con afinidad compatible), criterio de esa cola
  const buscar = (k: number, t: number): { q: number; idx: number } | null => {
    for (let q = 0; q < colas.length; q++) {
      let idx = -1
      colas[q].forEach((id, i) => {
        const p = get(id)
        if (afinidad && p.afinidad != null && p.afinidad !== k) return
        if (idx < 0 || mejor(p, get(colas[q][idx]), defColas[q].algoritmo, t)) idx = i
      })
      if (idx >= 0) return { q, idx }
    }
    return null
  }

  const estimar = (p: Pcb): string => {
    if (alfa == null || p.est[p.rafaga] != null) return ''
    const r = p.rafaga
    const input = config.procesos.find((x) => x.id === p.id)!
    if (esKlt(input)) return ''
    let tAnt: number
    let rAnt: number
    if (r === 0) {
      if (input.estimacionInicial != null) {
        p.est[0] = input.estimacionInicial
        return ` Estimación inicial de su ráfaga: ${fmt(p.est[0])}.`
      }
      if (input.estimacionAnterior == null || input.rafagaAnterior == null) {
        throw new Error(`${p.id} necesita estimacionInicial o estimacionAnterior + rafagaAnterior`)
      }
      tAnt = input.estimacionAnterior
      rAnt = input.rafagaAnterior
    } else {
      tAnt = p.est[r - 2]
      rAnt = p.rafagas[r - 2]
    }
    const pesoEst = config.alfaSobre === 'real' ? 1 - alfa : alfa
    p.est[r] = pesoEst * tAnt + (1 - pesoEst) * rAnt
    return ` Estimación de su ráfaga: T = ${fmt(pesoEst)}·${fmt(tAnt)} (estimada) + ${fmt(1 - pesoEst)}·${fmt(rAnt)} (real) = ${fmt(p.est[r])}.`
  }

  /** Devuelve el nombre del dispositivo si es uno nombrado (para la descripción). */
  const enviarAIO = (p: Hilo): string | null => {
    const n = (p.rafaga - 1) / 2
    const nombre = p.dispositivos?.[n] ?? (ioUnica ? DISPOSITIVO_UNICO : null)
    if (nombre == null) {
      p.estado = 'bloqueado'
      enParalelo.add(p.id)
      return null
    }
    if (!dispositivos.has(nombre)) dispositivos.set(nombre, { nombre, usando: null, cola: [] })
    p.estado = 'espera-io'
    dispositivos.get(nombre)!.cola.push(p.id)
    return nombre === DISPOSITIVO_UNICO ? null : nombre
  }

  const colaTrasIO = (p: Pcb): number => {
    if (algoritmo === 'vrr') return p.usadoVRR < quantum! ? 0 : 1
    if (algoritmo === 'feedback') return trasIO === 'primera' ? 0 : p.cola
    return p.colaFija
  }
  const colaNuevo = (p: Pcb) => (algoritmo === 'vrr' ? 1 : p.colaFija)

  const textoTrasIO = (p: Pcb, q: number): string => {
    if (algoritmo === 'vrr') {
      return q === 0
        ? `${p.id} termina su E/S sin haber agotado su quantum (usó ${p.usadoVRR} de ${quantum}): pasa a la cola auxiliar.`
        : `${p.id} termina su E/S; ya había agotado su quantum, vuelve a la cola de listos principal.`
    }
    if (algoritmo === 'feedback' && trasIO === 'primera' && p.cola !== 0) {
      return `${p.id} termina su E/S y es promovido a ${nombreCola(0)}.`
    }
    return `${p.id} termina su E/S y vuelve a ${nombreCola(q)}.`
  }
  const vuelveKLT = (p: Pcb, q: number): string => {
    if (algoritmo === 'vrr') {
      return q === 0
        ? `${p.id} pasa a la cola auxiliar (usó ${p.usadoVRR} de ${quantum} de su quantum)`
        : `${p.id} vuelve a la cola de listos principal (ya había agotado su quantum)`
    }
    if (algoritmo === 'feedback' && trasIO === 'primera' && p.cola !== 0) {
      return `${p.id} es promovido a ${nombreCola(0)}`
    }
    return `${p.id} vuelve a ${nombreCola(q)}`
  }

  const motivoULT = (b: Biblioteca, h: Hilo): string => {
    switch (b.algoritmo) {
      case 'fifo':
        return 'FIFO: primero en su cola'
      case 'rr':
        return `RR Q=${b.quantum}: primero en su cola`
      case 'sjf':
        return `SJF: ráfaga ${h.restante}`
      case 'srt':
        return `SRT: le restan ${h.restante}`
      default:
        return `${NOMBRE_BIB[b.algoritmo]}: prioridad ${h.prioridad}`
    }
  }
  const criterioULT = (b: Biblioteca, nuevo: Hilo, viejo: Hilo): string =>
    b.algoritmo === 'srt'
      ? `le restan ${nuevo.restante} < ${viejo.restante}`
      : `prioridad ${nuevo.prioridad} vs ${viejo.prioridad}`
  const quantumKLT = (p: Pcb, slot: Cpu): string => {
    if (slot.limite == null) return ''
    const n = slot.limite - slot.usado
    return ` El quantum de ${p.id} no se reinicia: le ${n === 1 ? 'queda' : 'quedan'} ${n}.`
  }

  /** Decisión de la biblioteca del KLT que está en `slot` (recién despachado o siguiendo). */
  const elegirULT = (p: Pcb, slot: Cpu, recien: boolean, t: number, eventos: string[]) => {
    const b = p.bib!
    const { h, desaloja } = candidato(b)
    if (!h) throw new Error(`${p.id} está en CPU sin ULTs listos`)
    if (desaloja && b.actual) {
      eventos.push(
        `${h.id} desaloja a ${b.actual.id} dentro de ${p.id} (biblioteca ${NOMBRE_BIB[b.algoritmo]}: ${criterioULT(b, h, b.actual)}).${recien ? '' : quantumKLT(p, slot)}`,
      )
      b.listos.push(b.actual)
      b.actual = null
    }
    if (!b.actual) {
      b.listos.splice(b.listos.indexOf(h), 1)
      b.actual = h
      b.usado = 0
      if (!desaloja) {
        eventos.push(
          `La biblioteca de ${p.id} elige a ${h.id} (${motivoULT(b, h)}).${recien ? '' : quantumKLT(p, slot)}`,
        )
      }
    } else if (recien) {
      const motivo = b.trasDirecta
        ? 'hizo la E/S con una syscall directa: la biblioteca no se enteró y no replanifica'
        : DESALOJANTES.includes(b.algoritmo)
          ? 'ningún ULT listo lo mejora'
          : `${NOMBRE_BIB[b.algoritmo]} sin desalojo: sigue el ULT que tenía elegido`
      eventos.push(`La biblioteca de ${p.id} sigue con ${h.id} (${motivo}).`)
    }
    b.novedad = false
    b.trasDirecta = false
    h.primerCPU ??= t
  }

  // El proceso libera su lugar en memoria cuando terminaron todos sus KLTs
  const liberar = (p: Pcb) => {
    const g = grupoDe.get(p.id)!
    if (g.estado === 'fin' || g.klts.some((k) => k.fin == null)) return
    g.estado = 'fin'
    admitidos -= 1
  }
  const finKLT = (p: Pcb, instante: number) => {
    p.estado = 'fin'
    p.fin = instante
    liberar(p)
  }

  const vencerQuantum = (slot: Cpu, p: Pcb) => {
    const q =
      algoritmo === 'vrr' ? 1 : algoritmo === 'feedback' ? Math.min(p.cola + 1, ultimaCola) : p.cola
    const texto =
      algoritmo === 'feedback' && q !== p.cola
        ? `${p.id} agota su quantum (Q=${slot.limite}) y baja a ${nombreCola(q)}.`
        : `${p.id} agota su ${algoritmo === 'vrr' && p.cola === 0 ? 'quantum restante' : 'quantum'} (${slot.limite}) y va al final de ${nombreCola(q)}.`
    p.estado = 'listo'
    pendientes.push({ id: p.id, origen: 'desalojo', cola: q, texto })
    slot.id = null
  }

  /** Fin de la E/S de un ULT: según el modo, vuelve a la biblioteca o desbloquea a todo el KLT. */
  const finIOUlt = (h: Hilo, termino: boolean) => {
    const p = h.klt!
    const b = p.bib!
    if (!termino) h.estado = 'listo'
    const fin = termino ? ' y finaliza' : ''
    if (b.bloqueante === h) {
      b.bloqueante = null
      if (b.modo === 'directa') {
        if (termino) b.actual = null
        else b.trasDirecta = true
      } else if (!termino) {
        b.pendientes.push({ h, origen: 'io' })
      }
      const luego = termino
        ? ''
        : b.modo === 'directa'
          ? ` (seguirá ${h.id}: la biblioteca no se enteró de la E/S)`
          : ' (al volver a ejecutar, la biblioteca replanifica)'
      avisos.push(`${h.id} termina su E/S${fin} y se desbloquea ${p.id}${luego}.`)
      return
    }
    if (!termino) b.pendientes.push({ h, origen: 'io' })
    avisos.push(
      `${h.id} termina su E/S${fin}${termino ? '' : ` y vuelve a la cola de la biblioteca de ${p.id}`}.`,
    )
  }

  /** Fin del tick para un KLT con ULTs en CPU: fin de ráfaga del ULT o de quantum de la biblioteca. */
  const finTickULT = (p: Pcb, slot: Cpu, instante: number) => {
    const b = p.bib!
    const h = b.actual!
    if (h.restante > 0) {
      if (b.quantum != null && b.usado >= b.quantum) {
        b.pendientes.push({ h, origen: 'desalojo' })
        b.actual = null
        avisos.push(
          `${h.id} agota el quantum de la biblioteca (${b.quantum}) y va al final de la cola de ${p.id}.`,
        )
      }
      return
    }
    h.rafaga += 1
    b.actual = null
    if (h.rafaga >= h.rafagas.length) {
      h.estado = 'fin'
      h.fin = instante
      avisos.push(`${h.id} finaliza.`)
      return
    }
    h.restante = h.rafagas[h.rafaga]
    const disp = enviarAIO(h)
    const d = disp ? ` (${disp})` : ''
    if (b.modo === 'jacketing') {
      avisos.push(`${h.id} pide E/S${d} con jacketing: se bloquea solo ${h.id}, no todo ${p.id}.`)
      return
    }
    b.bloqueante = h
    if (b.modo === 'directa') b.actual = h
    p.estado = 'bloqueado'
    slot.id = null
    avisos.push(
      b.modo === 'directa'
        ? `${h.id} hace E/S${d} con una syscall directa: se bloquea todo ${p.id} y la biblioteca no se entera.`
        : `${h.id} hace E/S${d} por wrapper: se bloquea todo ${p.id}.`,
    )
  }

  /** Cierre del instante para los KLTs con ULTs: colas de biblioteca, CPU y desbloqueos. */
  const cerrarBibliotecas = (instante: number) => {
    const orden = (o: OrigenListo) => desempate.indexOf(o)
    for (const p of todos) {
      const b = p.bib
      if (!b?.pendientes.length) continue
      b.pendientes.sort(
        (x, y) => orden(x.origen) - orden(y.origen) || b.ults.indexOf(x.h) - b.ults.indexOf(y.h),
      )
      for (const e of b.pendientes) b.listos.push(e.h)
      b.pendientes = []
      b.novedad = true
    }
    for (const slot of cpus) {
      const p = slot.id ? get(slot.id) : null
      const b = p?.bib
      if (!p || !b) continue
      if (!b.actual && !b.listos.length) {
        slot.id = null
        if (b.ults.every((u) => u.fin != null)) {
          finKLT(p, instante)
          avisos.push(`${p.id} termina: no le quedan ULTs.`)
        } else {
          p.estado = 'bloqueado'
          avisos.push(`${p.id} no tiene ULTs listos: deja la CPU.`)
        }
      } else if (slot.limite != null && slot.usado >= slot.limite) {
        vencerQuantum(slot, p)
      }
    }
    for (const p of todos) {
      const b = p.bib
      if (!b || p.estado !== 'bloqueado' || b.bloqueante) continue
      if (b.actual || b.listos.length) {
        const q = colaTrasIO(p)
        p.estado = 'listo'
        pendientes.push({ id: p.id, origen: 'io', cola: q, texto: `${vuelveKLT(p, q)}.` })
      } else if (b.ults.every((u) => u.fin != null)) {
        finKLT(p, instante)
      }
    }
  }

  /** Fin de E/S ya atendido por el SO: el hilo vuelve a listos (o termina). */
  const completarIO = (h: Hilo, instante: number) => {
    const termino = h.rafaga >= h.rafagas.length
    if (termino) {
      h.estado = 'fin'
      h.fin = instante
    } else {
      h.restante = h.rafagas[h.rafaga]
    }
    if (h.klt) {
      finIOUlt(h, termino)
      return
    }
    const p = get(h.id)
    if (termino) {
      liberar(p)
      return
    }
    const q = colaTrasIO(p)
    pendientes.push({ id: h.id, origen: 'io', cola: q, texto: textoTrasIO(p, q) })
  }

  // CPU de la interrupción: la del proceso si está libre, si no otra libre, si no la suya (la pausa)
  const atenderInterrupcion = (h: Hilo) => {
    const p = h.klt ?? get(h.id)
    const libre = (k: number) => !cpus[k].id && !cpus[k].so.length
    let k =
      p.afinidad != null && libre(p.afinidad) ? p.afinidad : cpus.findIndex((_, i) => libre(i))
    if (k < 0) k = p.afinidad ?? 0
    const pausa = cpus[k].id && !cpus[k].so.length ? ` (${cpus[k].id} espera sin ejecutar)` : ''
    cpus[k].so.push({ h, restante: overhead })
    avisos.push(
      `Interrupción por fin de E/S de ${h.id}: el SO la atiende${cpuTxt(k)} (${overhead} u.t.)${pausa}.`,
    )
  }

  for (let t = 0; t < LIMITE_TICKS; t++) {
    if (todos.every((p) => p.fin != null)) break
    const eventos: string[] = avisos
    avisos = []

    // ULTs que llegan: entran a la cola de su biblioteca, en el orden en que se declararon
    for (const p of todos) {
      const b = p.bib
      const llegados = b?.ults.filter((u) => u.llegada === t) ?? []
      if (!b || !llegados.length) continue
      for (const u of llegados) {
        u.estado = 'listo'
        b.listos.push(u)
      }
      b.novedad = true
      if (p.llegada === t) continue
      const ids = llegados.map((u) => u.id).join(', ')
      if (p.estado === 'bloqueado' && !b.bloqueante) {
        p.estado = 'listo'
        pendientes.push({
          id: p.id,
          origen: 'nuevo',
          cola: colaNuevo(p),
          texto: `Llega ${ids} a la biblioteca de ${p.id}, que no tenía ULTs listos: ${p.id} entra a ${nombreCola(colaNuevo(p))}.`,
        })
      } else {
        eventos.push(`Llega ${ids} a la biblioteca de ${p.id}.`)
      }
    }

    const llegan = todos.filter((p) => p.llegada === t).sort((a, b) => a.id.localeCompare(b.id))
    for (const p of llegan) {
      const g = grupoDe.get(p.id)!
      if (grado == null) {
        const texto = p.bib
          ? `Llega ${p.id} (ULTs: ${p.bib.listos.map((u) => u.id).join(', ')}) a ${nombreCola(colaNuevo(p))}.`
          : undefined
        pendientes.push({ id: p.id, origen: 'nuevo', cola: colaNuevo(p), texto })
      } else if (g.estado === 'memoria') {
        // KLT nuevo de un proceso ya admitido: no ocupa otro lugar
        pendientes.push({ id: p.id, origen: 'nuevo', cola: colaNuevo(p) })
      } else if (g.estado === 'suspendido') {
        p.estado = 'suspendido'
      } else {
        p.estado = 'espera-admision'
        if (g.estado === 'fuera') {
          g.estado = 'new'
          colaNew.push(g.id)
        }
      }
    }
    // Se liberó lugar: vuelven primero los suspendidos (mejor prioridad), después los de New (FIFO)
    while (grado != null && admitidos < grado && (suspendidos.length || colaNew.length)) {
      if (suspendidos.length) {
        suspendidos.sort((a, b) => a.prioridad - b.prioridad)
        const g = suspendidos.shift()!
        g.estado = 'memoria'
        admitidos += 1
        eventos.push(
          `Se liberó un lugar: ${g.id} vuelve a memoria (planificador de mediano plazo).`,
        )
        for (const k of g.klts) {
          if (k.estado !== 'suspendido') continue
          const texto = `${k.id} vuelve a ${nombreCola(colaNuevo(k))}.`
          pendientes.push({ id: k.id, origen: 'nuevo', cola: colaNuevo(k), texto })
        }
        continue
      }
      const g = grupos.get(colaNew.shift()!)!
      g.estado = 'memoria'
      admitidos += 1
      for (const k of g.klts) {
        if (k.estado !== 'espera-admision') continue
        const unico = unitario(g)
        const quien = unico ? k.id : `${k.id} (proceso ${g.id})`
        const texto =
          k.llegada === t
            ? unico
              ? undefined
              : `Llega ${quien} a ${nombreCola(colaNuevo(k))}.`
            : `${quien} es admitido por el planificador de largo plazo (se liberó un lugar; grado de multiprogramación ${grado}) y entra a ${nombreCola(colaNuevo(k))}.`
        pendientes.push({ id: k.id, origen: 'nuevo', cola: colaNuevo(k), texto })
      }
    }

    const orden = (e: Entrante) => desempate.indexOf(e.origen)
    pendientes.sort((a, b) => orden(a) - orden(b) || a.id.localeCompare(b.id))
    const entrar = (e: Entrante) => {
      const p = get(e.id)
      p.estado = 'listo'
      p.listoDesde = t
      p.cola = e.cola
      colas[e.cola].push(e.id)
      const est = e.origen === 'desalojo' ? '' : estimar(p)
      if (e.texto) eventos.push(e.texto + est)
      else if (e.origen === 'nuevo') eventos.push(`Llega ${e.id} a ${nombreCola(e.cola)}.${est}`)
      else if (e.origen === 'io') eventos.push(textoTrasIO(p, e.cola) + est)
    }
    // Con suspensión, New se reevalúa cada vez que cambia Ready (en el orden del desempate)
    const reevaluar = () => {
      if (!suspension) return
      for (let i = 0; i < colaNew.length; i++) {
        const g = grupos.get(colaNew[i])!
        const victima = [...grupos.values()]
          .filter((v) => v.estado === 'memoria' && v.prioridad > g.prioridad && enReady(v))
          .sort((a, b) => b.prioridad - a.prioridad)[0]
        if (!victima) continue
        victima.estado = 'suspendido'
        suspendidos.push(victima)
        for (const k of victima.klts) {
          if (k.estado !== 'listo') continue
          colas[k.cola].splice(colas[k.cola].indexOf(k.id), 1)
          k.estado = 'suspendido'
        }
        colaNew.splice(i, 1)
        g.estado = 'memoria'
        eventos.push(
          `${g.id} (prioridad ${g.prioridad}) tiene mayor prioridad que ${victima.id} (prioridad ${victima.prioridad}), el de menor prioridad en Ready: el SO suspende a ${victima.id} (sale de memoria) y admite a ${g.id}.`,
        )
        for (const k of g.klts) {
          if (k.estado === 'espera-admision')
            entrar({ id: k.id, origen: 'nuevo', cola: colaNuevo(k) })
        }
        i = -1
      }
    }
    const lote = pendientes
    pendientes = []
    reevaluar()
    for (const e of lote) {
      entrar(e)
      reevaluar()
    }
    for (const gid of colaNew) {
      const g = grupos.get(gid)!
      if (!g.klts.some((k) => k.llegada === t)) continue
      const extra = suspension ? ' y en Ready no hay ningún proceso de menor prioridad' : ''
      eventos.push(
        `Llega ${gid}, pero el grado de multiprogramación (${grado}) está completo${extra}: queda en New.`,
      )
    }

    // Desalojo: por cola de mayor prioridad (multinivel) o por criterio del algoritmo de la cola
    cpus.forEach((slot, k) => {
      if (!slot.id || slot.so.length) return
      const cand = buscar(k, t)
      if (!cand) return
      const actual = get(slot.id)
      const nuevo = get(colas[cand.q][cand.idx])
      const qa = actual.cola
      let texto: string | null = null
      if (desalojoEntreColas && cand.q < qa) {
        texto = `${nuevo.id} está en ${nombreCola(cand.q)}, de mayor prioridad: desaloja a ${actual.id}${cpuTxt(k)}, que va al final de ${nombreCola(qa)}.`
      } else if (
        cand.q === qa &&
        DESALOJANTES.includes(defColas[qa].algoritmo) &&
        mejor(nuevo, actual, defColas[qa].algoritmo, t)
      ) {
        const alg = defColas[qa].algoritmo
        texto = `${nuevo.id} desaloja a ${actual.id}${cpuTxt(k)} (${criterio(alg, nuevo, actual, criterioSJF, alfa != null)}).`
      }
      if (!texto) return
      eventos.push(texto)
      actual.estado = 'listo'
      actual.listoDesde = t
      colas[qa].push(actual.id)
      slot.id = null
    })

    const recien = cpus.map(() => false)
    const ordenCpus = cpus.map((_, k) => k)
    const libres = cpus.filter((s) => !s.id && !s.so.length).length
    if (libres > 1 && colas.some((c) => c.length > 0)) {
      if (opts.invertirCpus?.(decisionesCpu)) ordenCpus.reverse()
      decisionesCpu++
    }
    ordenCpus.forEach((k) => {
      const slot = cpus[k]
      if (slot.id) return
      if (slot.so.length) {
        ociosa[k] = null
        return
      }
      const sel = buscar(k, t)
      if (!sel) {
        const esperanOtro = colas.some((c) => c.length > 0)
        const msg =
          esperanOtro && afinidad
            ? `CPU ${k + 1} ociosa: los listos tienen afinidad con otro procesador.`
            : `${nCpus > 1 ? `CPU ${k + 1}` : 'CPU'} ociosa: no hay procesos listos.`
        // con varios CPUs se avisa solo cuando cambia, para no repetirlo en cada tick
        if (nCpus === 1 || ociosa[k] !== msg) eventos.push(msg)
        ociosa[k] = msg
        return
      }
      ociosa[k] = null
      const id = colas[sel.q].splice(sel.idx, 1)[0]
      const p = get(id)
      const cola = defColas[sel.q]
      let limite: number | null = cola.algoritmo === 'rr' ? cola.quantum! : null
      if (algoritmo === 'vrr') {
        if (sel.q === 1) p.usadoVRR = 0
        limite = quantum! - p.usadoVRR
      }
      slot.id = id
      slot.usado = 0
      slot.limite = limite
      p.estado = 'ejecutando'
      p.primerCPU ??= t
      const porAfinidad = afinidad && p.afinidad === k
      if (afinidad) p.afinidad ??= k
      const motivo = motivoEleccion({
        algoritmo,
        cola,
        q: sel.q,
        nombre: nombreCola(sel.q),
        limite,
        valor:
          alfa != null && (cola.algoritmo === 'sjf' || cola.algoritmo === 'srt')
            ? fmt(criterioSJF(p, cola.algoritmo))
            : null,
        multicola: defColas.length > 1,
      })
      eventos.push(
        `${quien} elige a ${id}${cpuTxt(k)}${porAfinidad ? ' por afinidad' : ''}${motivo}.`,
      )
      recien[k] = true
    })

    cpus.forEach((slot, k) => {
      const p = slot.id && !slot.so.length ? get(slot.id) : null
      if (p?.bib) elegirULT(p, slot, recien[k], t, eventos)
    })

    for (const d of dispositivos.values()) {
      if (d.usando || d.cola.length === 0) continue
      d.usando = d.cola.shift()!
      getH(d.usando).estado = 'bloqueado'
      const nombre = d.nombre === DISPOSITIVO_UNICO ? 'de E/S' : d.nombre
      eventos.push(`${d.usando} toma el dispositivo ${nombre}.`)
    }

    const listos = colas.flat()
    const usandoIO = [...[...dispositivos.values()].flatMap((d) => d.usando ?? []), ...enParalelo]
    const conSO = cpus.map((c) => c.so.length > 0)
    const enCpu = cpus.map((c) => {
      if (!c.id || c.so.length) return null
      const p = get(c.id)
      return p.bib ? p.bib.actual!.id : p.id
    })
    const estados: Record<string, EstadoProceso> = {}
    for (const h of hilos.values()) {
      const k = h.klt
      if (k && enCpu.includes(h.id)) estados[h.id] = 'ejecutando'
      // los ULTs listos de un KLT en New o suspendido muestran el estado de su KLT
      else if (
        k &&
        h.estado === 'listo' &&
        (k.estado === 'suspendido' || k.estado === 'espera-admision')
      )
        estados[h.id] = k.estado
      else estados[h.id] = h.estado
    }
    // el que el SO interrumpió en su CPU espera sin ejecutar
    cpus.forEach((c) => {
      if (c.id && c.so.length && !get(c.id).bib) estados[c.id] = 'listo'
    })
    ticks.push({
      t,
      cpu: enCpu[0],
      cpus: enCpu,
      io: usandoIO,
      colaIO: [...dispositivos.values()].flatMap((d) => d.cola),
      listos,
      ...(defColas.length > 1 && {
        colas: colas.map((c, q) => ({
          nombre: nombreCorto(algoritmo, defColas, q),
          procesos: [...c],
        })),
      }),
      ...(conDispositivos && {
        dispositivos: [...dispositivos.values()].map((d) => ({ ...d, cola: [...d.cola] })),
      }),
      ...(grado != null && { nuevos: [...colaNew] }),
      ...(suspension && { suspendidos: suspendidos.map((g) => g.id) }),
      ...(overhead > 0 && { so: conSO }),
      ...(hayHilos && {
        bibliotecas: todos.flatMap((p) =>
          p.bib
            ? [
                {
                  klt: p.id,
                  elegido: p.bib.actual?.id ?? null,
                  listos: p.bib.listos.map((u) => u.id),
                },
              ]
            : [],
        ),
        quantum: cpus.map((c) => (c.id && c.limite != null ? c.limite - c.usado : null)),
      }),
      estados,
      eventos,
    })

    // ── Ejecución del tick [t, t+1) ──
    for (const id of listos) if (!get(id).bib) get(id).espera += 1
    for (const h of hilos.values()) if (h.klt && estados[h.id] === 'listo') h.espera += 1
    for (const slot of cpus) {
      if (slot.so.length) {
        slot.so[0].restante -= 1
        continue
      }
      if (!slot.id) continue
      const p = get(slot.id)
      const h = p.bib ? p.bib.actual! : p
      h.restante -= 1
      p.usadoVRR += 1
      slot.usado += 1
      if (p.bib) p.bib.usado += 1
    }
    for (const id of usandoIO) getH(id).restante -= 1

    // ── Eventos al final del tick (instante t+1) ──
    const interrupciones: Hilo[] = []
    for (const id of usandoIO) {
      const h = getH(id)
      if (h.restante > 0) continue
      enParalelo.delete(id)
      for (const d of dispositivos.values()) if (d.usando === id) d.usando = null
      h.rafaga += 1
      if (overhead > 0) {
        h.estado = 'espera-so'
        interrupciones.push(h)
      } else completarIO(h, t + 1)
    }
    cpus.forEach((slot, k) => {
      const i = slot.so[0]
      if (!conSO[k] || i.restante > 0) return
      slot.so.shift()
      avisos.push(`El SO termina de atender la interrupción de ${i.h.id}${cpuTxt(k)}.`)
      completarIO(i.h, t + 1)
    })

    cpus.forEach((slot, k) => {
      if (!slot.id || conSO[k]) return
      const p = get(slot.id)
      if (p.bib) {
        finTickULT(p, slot, t + 1)
        return
      }
      if (p.restante === 0) {
        slot.id = null
        p.rafaga += 1
        if (p.rafaga >= p.rafagas.length) {
          p.estado = 'fin'
          p.fin = t + 1
          liberar(p)
          avisos.push(`${p.id} finaliza.`)
        } else {
          p.restante = p.rafagas[p.rafaga]
          const disp = enviarAIO(p)
          avisos.push(
            `${p.id} termina su ráfaga de CPU y se bloquea por E/S${disp ? ` (${disp})` : ''}.`,
          )
        }
      } else if (slot.limite != null && slot.usado >= slot.limite) {
        vencerQuantum(slot, p)
      }
    })
    if (hayHilos) cerrarBibliotecas(t + 1)
    for (const h of interrupciones) atenderInterrupcion(h)
  }

  const metricas: MetricasProceso[] = [...hilos.values()].map((p) => ({
    id: p.id,
    llegada: p.llegada,
    finalizacion: p.fin ?? NaN,
    retorno: (p.fin ?? NaN) - p.llegada,
    espera: p.espera,
    respuesta: (p.primerCPU ?? NaN) - p.llegada,
  }))
  const prom = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

  return {
    ticks,
    metricas,
    promedioRetorno: prom(metricas.map((m) => m.retorno)),
    promedioEspera: prom(metricas.map((m) => m.espera)),
    fin: Math.max(...metricas.map((m) => m.finalizacion)),
    procesadores: nCpus,
    hilos: [...hilos.keys()],
    ...(decisionesCpu > 0 && { decisionesCpu }),
    ...(overhead > 0 && { so: true }),
    ...(hayHilos && {
      kltDe: Object.fromEntries(
        [...hilos.values()].flatMap((h) => (h.klt ? [[h.id, h.klt.id]] : [])),
      ),
    }),
  }
}

function definirColas(config: ConfigPlanificacion): ColaConfig[] {
  const { algoritmo, quantum } = config
  if (algoritmo === 'vrr') {
    // 0 = auxiliar (sale primero), 1 = principal; el quantum de la auxiliar se calcula aparte
    return [
      { algoritmo: 'rr', quantum },
      { algoritmo: 'rr', quantum },
    ]
  }
  if (algoritmo === 'multinivel' || algoritmo === 'feedback') {
    if (!config.colas?.length) throw new Error(`${algoritmo} requiere colas`)
    for (const c of config.colas) {
      if (c.algoritmo === 'rr' && !c.quantum) throw new Error('Cola RR sin quantum')
    }
    return config.colas
  }
  return [{ algoritmo, quantum }]
}

function etiquetaAlgoritmo(c: ColaConfig): string {
  const nombres: Record<AlgoritmoBase, string> = {
    fifo: 'FIFO',
    sjf: 'SJF',
    srt: 'SRT',
    rr: 'RR',
    prioridades: 'prioridades',
    'prioridades-desalojo': 'prioridades con desalojo',
    hrrn: 'HRRN',
  }
  return c.algoritmo === 'rr' ? `RR Q=${c.quantum}` : nombres[c.algoritmo]
}

function nombreCorto(
  algoritmo: ConfigPlanificacion['algoritmo'],
  defColas: ColaConfig[],
  q: number,
) {
  if (algoritmo === 'vrr') return q === 0 ? 'Auxiliar' : 'Principal'
  return `Cola ${q + 1} · ${etiquetaAlgoritmo(defColas[q])}`
}

function criterio(
  alg: AlgoritmoBase,
  nuevo: Pcb,
  actual: Pcb,
  valor: (p: Pcb, alg: AlgoritmoBase) => number,
  estimado: boolean,
): string {
  if (alg === 'srt') {
    const que = estimado ? 'estimación restante' : 'le restan'
    return `${que} ${fmt(valor(nuevo, alg))} < ${fmt(valor(actual, alg))}`
  }
  return `prioridad ${nuevo.prioridad} vs ${actual.prioridad}`
}

interface Eleccion {
  algoritmo: ConfigPlanificacion['algoritmo']
  cola: ColaConfig
  q: number
  nombre: string
  limite: number | null
  valor: string | null
  multicola: boolean
}

function motivoEleccion(e: Eleccion): string {
  if (e.algoritmo === 'vrr') {
    return e.q === 0
      ? ` de la cola auxiliar (tiene prioridad sobre la principal); ejecuta con el quantum restante: ${e.limite}`
      : ' (primero en la cola de listos principal)'
  }
  if (!e.multicola) return motivoAlgoritmo(e.cola.algoritmo, e.valor)
  const fifo = e.cola.algoritmo === 'fifo' || e.cola.algoritmo === 'rr'
  const intra = fifo ? 'es el primero' : motivoAlgoritmo(e.cola.algoritmo, e.valor).slice(2, -1)
  const superiores = e.q > 0 ? ' y las colas de mayor prioridad están vacías' : ''
  return ` de ${e.nombre}: ${intra}${superiores}`
}

function motivoAlgoritmo(alg: AlgoritmoBase, valor: string | null): string {
  switch (alg) {
    case 'fifo':
    case 'rr':
      return ' (primero en la cola de listos)'
    case 'sjf':
      return valor ? ` (menor estimación: ${valor})` : ' (ráfaga más corta)'
    case 'srt':
      return valor ? ` (menor estimación restante: ${valor})` : ' (menor tiempo restante)'
    case 'prioridades':
    case 'prioridades-desalojo':
      return ' (mayor prioridad)'
    case 'hrrn':
      return ' (mayor response ratio)'
  }
}

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
