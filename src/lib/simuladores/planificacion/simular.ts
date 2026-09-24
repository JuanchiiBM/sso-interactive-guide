/**
 * Simulador de planificación de corto plazo, tick a tick (unidad de tiempo entera).
 * Modelo, variantes y desempates: docs/brain/simuladores/Simulador de Planificación.md
 */
import type {
  AlgoritmoBase,
  ColaConfig,
  ConfigPlanificacion,
  EstadoDispositivo,
  EstadoProceso,
  MetricasProceso,
  OrigenListo,
  ResultadoPlanificacion,
  Tick,
} from './tipos'

// Criterio de la guía UTN FRBA: clock > fin de evento (E/S) > nuevo; después, nombre ascendente
const DESEMPATE_DEFAULT: OrigenListo[] = ['desalojo', 'io', 'nuevo']
const LIMITE_TICKS = 10_000
const DISPOSITIVO_UNICO = 'E/S'

interface Pcb {
  id: string
  llegada: number
  rafagas: number[]
  prioridad: number
  dispositivos?: string[]
  colaFija: number
  rafaga: number
  restante: number
  estado: EstadoProceso
  espera: number
  primerCPU: number | null
  fin: number | null
  listoDesde: number
  /** Cola de listos en la que está (o de la que salió si ejecuta). */
  cola: number
  /** VRR: CPU usado desde que se lo eligió por última vez de la cola principal. */
  usadoVRR: number
  afinidad: number | null
  /** Estimación por índice de ráfaga (solo ráfagas de CPU). */
  est: number[]
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
}

const DESALOJANTES: AlgoritmoBase[] = ['srt', 'prioridades-desalojo']

export function simularPlanificacion(config: ConfigPlanificacion): ResultadoPlanificacion {
  const { algoritmo, quantum, ioUnica = true, prioridadMenorEsMejor = true, alfa } = config
  const desempate = config.desempate ?? DESEMPATE_DEFAULT
  const grado = config.multiprogramacion
  const nCpus = config.procesadores ?? 1
  const afinidad = nCpus > 1 && (config.afinidad ?? false)
  const multicola = algoritmo === 'multinivel' || algoritmo === 'feedback'
  const desalojoEntreColas = multicola && (config.desalojoEntreColas ?? true)
  const trasIO = config.trasIO ?? 'misma'

  if ((algoritmo === 'rr' || algoritmo === 'vrr') && !quantum) {
    throw new Error(
      `${algoritmo === 'rr' ? 'Round Robin' : 'Virtual Round Robin'} requiere quantum`,
    )
  }
  const defColas = definirColas(config)
  const ultimaCola = defColas.length - 1

  const pcbs = new Map<string, Pcb>(
    config.procesos.map((p) => {
      let colaFija = 0
      if (algoritmo === 'multinivel') {
        if (p.cola == null || p.cola < 1 || p.cola > defColas.length) {
          throw new Error(`Multinivel: ${p.id} necesita una cola entre 1 y ${defColas.length}`)
        }
        colaFija = p.cola - 1
      }
      return [
        p.id,
        {
          id: p.id,
          llegada: p.llegada,
          rafagas: p.rafagas,
          prioridad: p.prioridad ?? 0,
          dispositivos: p.dispositivos,
          colaFija,
          rafaga: 0,
          restante: p.rafagas[0],
          estado: 'nuevo',
          espera: 0,
          primerCPU: null,
          fin: null,
          listoDesde: p.llegada,
          cola: colaFija,
          usadoVRR: 0,
          afinidad: null,
          est: [],
        },
      ]
    }),
  )
  const todos = [...pcbs.values()]
  const get = (id: string) => pcbs.get(id)!

  const colas: string[][] = defColas.map(() => [])
  const cpus: Cpu[] = Array.from({ length: nCpus }, () => ({ id: null, usado: 0, limite: null }))
  const dispositivos = new Map<string, EstadoDispositivo>()
  const conDispositivos = config.procesos.some((p) => p.dispositivos?.length)
  const enParalelo = new Set<string>()
  const colaNew: string[] = []
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

  const estimacion = (p: Pcb) => p.est[p.rafaga]
  const criterioSJF = (p: Pcb, alg: AlgoritmoBase) => {
    if (alfa == null) return p.restante
    return alg === 'srt' ? estimacion(p) - (p.rafagas[p.rafaga] - p.restante) : estimacion(p)
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
    p.est[r] = alfa * tAnt + (1 - alfa) * rAnt
    return ` Estimación de su ráfaga: T = ${fmt(alfa)}·${fmt(tAnt)} + ${fmt(1 - alfa)}·${fmt(rAnt)} = ${fmt(p.est[r])}.`
  }

  /** Devuelve el nombre del dispositivo si es uno nombrado (para la descripción). */
  const enviarAIO = (p: Pcb): string | null => {
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

  for (let t = 0; t < LIMITE_TICKS; t++) {
    if (todos.every((p) => p.fin != null)) break
    const eventos: string[] = avisos
    avisos = []

    const llegan = todos.filter((p) => p.llegada === t).sort((a, b) => a.id.localeCompare(b.id))
    for (const p of llegan) {
      if (grado == null) {
        pendientes.push({ id: p.id, origen: 'nuevo', cola: colaNuevo(p) })
      } else {
        colaNew.push(p.id)
        p.estado = 'espera-admision'
      }
    }
    while (grado != null && colaNew.length > 0 && admitidos < grado) {
      const p = get(colaNew.shift()!)
      admitidos += 1
      const texto =
        p.llegada === t
          ? undefined
          : `${p.id} es admitido por el planificador de largo plazo (se liberó un lugar; grado de multiprogramación ${grado}) y entra a ${nombreCola(colaNuevo(p))}.`
      pendientes.push({ id: p.id, origen: 'nuevo', cola: colaNuevo(p), texto })
    }
    for (const id of colaNew) {
      if (get(id).llegada === t) {
        eventos.push(
          `Llega ${id}, pero el grado de multiprogramación (${grado}) está completo: queda en New.`,
        )
      }
    }

    const orden = (e: Entrante) => desempate.indexOf(e.origen)
    pendientes.sort((a, b) => orden(a) - orden(b) || a.id.localeCompare(b.id))
    for (const e of pendientes) {
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
    pendientes = []

    // Desalojo: por cola de mayor prioridad (multinivel) o por criterio del algoritmo de la cola
    cpus.forEach((slot, k) => {
      if (!slot.id) return
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

    cpus.forEach((slot, k) => {
      if (slot.id) return
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
        `El planificador elige a ${id}${cpuTxt(k)}${porAfinidad ? ' por afinidad' : ''}${motivo}.`,
      )
    })

    for (const d of dispositivos.values()) {
      if (d.usando || d.cola.length === 0) continue
      d.usando = d.cola.shift()!
      get(d.usando).estado = 'bloqueado'
      const nombre = d.nombre === DISPOSITIVO_UNICO ? 'de E/S' : d.nombre
      eventos.push(`${d.usando} toma el dispositivo ${nombre}.`)
    }

    const listos = colas.flat()
    const usandoIO = [...[...dispositivos.values()].flatMap((d) => d.usando ?? []), ...enParalelo]
    ticks.push({
      t,
      cpu: cpus[0].id,
      cpus: cpus.map((c) => c.id),
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
      estados: Object.fromEntries(todos.map((p) => [p.id, p.estado])),
      eventos,
    })

    // ── Ejecución del tick [t, t+1) ──
    for (const id of listos) get(id).espera += 1
    for (const slot of cpus) {
      if (!slot.id) continue
      const p = get(slot.id)
      p.restante -= 1
      p.usadoVRR += 1
      slot.usado += 1
    }
    for (const id of usandoIO) get(id).restante -= 1

    // ── Eventos al final del tick (instante t+1) ──
    for (const id of usandoIO) {
      const p = get(id)
      if (p.restante > 0) continue
      enParalelo.delete(id)
      for (const d of dispositivos.values()) if (d.usando === id) d.usando = null
      p.rafaga += 1
      if (p.rafaga >= p.rafagas.length) {
        p.estado = 'fin'
        p.fin = t + 1
        admitidos -= 1
        continue
      }
      p.restante = p.rafagas[p.rafaga]
      const q = colaTrasIO(p)
      pendientes.push({ id, origen: 'io', cola: q, texto: textoTrasIO(p, q) })
    }

    for (const slot of cpus) {
      if (!slot.id) continue
      const p = get(slot.id)
      if (p.restante === 0) {
        slot.id = null
        p.rafaga += 1
        if (p.rafaga >= p.rafagas.length) {
          p.estado = 'fin'
          p.fin = t + 1
          admitidos -= 1
          avisos.push(`${p.id} finaliza.`)
        } else {
          p.restante = p.rafagas[p.rafaga]
          const disp = enviarAIO(p)
          avisos.push(
            `${p.id} termina su ráfaga de CPU y se bloquea por E/S${disp ? ` (${disp})` : ''}.`,
          )
        }
      } else if (slot.limite != null && slot.usado >= slot.limite) {
        const q =
          algoritmo === 'vrr'
            ? 1
            : algoritmo === 'feedback'
              ? Math.min(p.cola + 1, ultimaCola)
              : p.cola
        const texto =
          algoritmo === 'feedback' && q !== p.cola
            ? `${p.id} agota su quantum (Q=${slot.limite}) y baja a ${nombreCola(q)}.`
            : `${p.id} agota su ${algoritmo === 'vrr' && p.cola === 0 ? 'quantum restante' : 'quantum'} (${slot.limite}) y va al final de ${nombreCola(q)}.`
        p.estado = 'listo'
        pendientes.push({ id: p.id, origen: 'desalojo', cola: q, texto })
        slot.id = null
      }
    }
  }

  const metricas: MetricasProceso[] = todos.map((p) => ({
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

function responseRatio(p: Pcb, t: number): number {
  const s = p.rafagas[p.rafaga]
  return (t - p.listoDesde + s) / s
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
