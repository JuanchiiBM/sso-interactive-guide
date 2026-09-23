/**
 * Simulador de planificación de corto plazo, tick a tick (unidad de tiempo entera).
 * Reglas de desempate y de E/S: ver docs/brain/simuladores/Simulador de Planificación.md
 */
import type {
  ConfigPlanificacion,
  EstadoProceso,
  MetricasProceso,
  OrigenListo,
  ResultadoPlanificacion,
  Tick,
} from './tipos'

// Criterio de la guía UTN FRBA: clock > fin de evento (E/S) > nuevo; después, nombre ascendente
const DESEMPATE_DEFAULT: OrigenListo[] = ['desalojo', 'io', 'nuevo']
const LIMITE_TICKS = 10_000

interface Pcb {
  id: string
  llegada: number
  rafagas: number[]
  prioridad: number
  rafaga: number
  restante: number
  estado: EstadoProceso
  espera: number
  primerCPU: number | null
  fin: number | null
  listoDesde: number
}

interface Entrante {
  id: string
  origen: OrigenListo
}

const esDesalojante = (a: ConfigPlanificacion['algoritmo']) =>
  a === 'srt' || a === 'prioridades-desalojo'

export function simularPlanificacion(config: ConfigPlanificacion): ResultadoPlanificacion {
  const { algoritmo, quantum, ioUnica = true, prioridadMenorEsMejor = true } = config
  const desempate = config.desempate ?? DESEMPATE_DEFAULT
  if (algoritmo === 'rr' && !quantum) throw new Error('Round Robin requiere quantum')

  const pcbs = new Map<string, Pcb>(
    config.procesos.map((p) => [
      p.id,
      {
        id: p.id,
        llegada: p.llegada,
        rafagas: p.rafagas,
        prioridad: p.prioridad ?? 0,
        rafaga: 0,
        restante: p.rafagas[0],
        estado: 'nuevo',
        espera: 0,
        primerCPU: null,
        fin: null,
        listoDesde: p.llegada,
      },
    ]),
  )
  const todos = [...pcbs.values()]
  const get = (id: string) => pcbs.get(id)!

  const listos: string[] = []
  const colaIO: string[] = []
  const enIO = new Set<string>()
  let pendientes: Entrante[] = []
  let cpu: string | null = null
  let quantumUsado = 0
  const ticks: Tick[] = []

  const mejor = (a: Pcb, b: Pcb, t: number): boolean => {
    switch (algoritmo) {
      case 'sjf':
      case 'srt':
        return a.restante < b.restante
      case 'prioridades':
      case 'prioridades-desalojo':
        return prioridadMenorEsMejor ? a.prioridad < b.prioridad : a.prioridad > b.prioridad
      case 'hrrn':
        return responseRatio(a, t) > responseRatio(b, t)
      default:
        return false
    }
  }

  const elegir = (t: number): string | null => {
    if (listos.length === 0) return null
    let idx = 0
    for (let i = 1; i < listos.length; i++) {
      if (mejor(get(listos[i]), get(listos[idx]), t)) idx = i
    }
    return listos.splice(idx, 1)[0]
  }

  for (let t = 0; t < LIMITE_TICKS; t++) {
    if (todos.every((p) => p.fin != null)) break
    const eventos: string[] = []

    for (const p of todos) {
      if (p.llegada === t) pendientes.push({ id: p.id, origen: 'nuevo' })
    }
    const orden = (e: Entrante) => desempate.indexOf(e.origen)
    pendientes.sort((a, b) => orden(a) - orden(b) || a.id.localeCompare(b.id))
    for (const e of pendientes) {
      const p = get(e.id)
      p.estado = 'listo'
      p.listoDesde = t
      listos.push(e.id)
      if (e.origen === 'nuevo') eventos.push(`Llega ${e.id} a la cola de listos.`)
      if (e.origen === 'io') eventos.push(`${e.id} termina su E/S y vuelve a listos.`)
    }
    pendientes = []

    if (cpu && esDesalojante(algoritmo) && listos.length > 0) {
      const actual = get(cpu)
      const candidato = listos.reduce((best, id) => (mejor(get(id), get(best), t) ? id : best))
      if (mejor(get(candidato), actual, t)) {
        eventos.push(
          `${candidato} desaloja a ${cpu} (${criterio(algoritmo, get(candidato), actual)}).`,
        )
        actual.estado = 'listo'
        actual.listoDesde = t
        listos.push(cpu)
        cpu = null
      }
    }

    if (cpu == null) {
      cpu = elegir(t)
      quantumUsado = 0
      if (cpu) {
        const p = get(cpu)
        p.estado = 'ejecutando'
        p.primerCPU ??= t
        eventos.push(`El planificador elige a ${cpu}${motivoEleccion(algoritmo)}.`)
      } else {
        eventos.push('CPU ociosa: no hay procesos listos.')
      }
    }

    if (ioUnica && enIO.size === 0 && colaIO.length > 0) {
      const id = colaIO.shift()!
      enIO.add(id)
      get(id).estado = 'bloqueado'
      eventos.push(`${id} toma el dispositivo de E/S.`)
    }

    ticks.push({
      t,
      cpu,
      io: [...enIO],
      colaIO: [...colaIO],
      listos: [...listos],
      estados: Object.fromEntries(todos.map((p) => [p.id, p.estado])),
      eventos,
    })

    // ── Ejecución del tick [t, t+1) ──
    for (const id of listos) get(id).espera += 1
    if (cpu) {
      get(cpu).restante -= 1
      quantumUsado += 1
    }
    for (const id of enIO) get(id).restante -= 1

    // ── Eventos al final del tick (instante t+1) ──
    for (const id of [...enIO]) {
      const p = get(id)
      if (p.restante > 0) continue
      enIO.delete(id)
      avanzarRafaga(p, t + 1, pendientes, 'io')
    }

    if (cpu) {
      const p = get(cpu)
      if (p.restante === 0) {
        cpu = null
        p.rafaga += 1
        if (p.rafaga >= p.rafagas.length) {
          p.estado = 'fin'
          p.fin = t + 1
        } else {
          p.restante = p.rafagas[p.rafaga]
          if (ioUnica) {
            p.estado = 'espera-io'
            colaIO.push(p.id)
            // si el dispositivo está libre lo toma al inicio del próximo tick (evento en ese tick)
          } else {
            p.estado = 'bloqueado'
            enIO.add(p.id)
          }
        }
      } else if (algoritmo === 'rr' && quantumUsado >= quantum!) {
        p.estado = 'listo'
        pendientes.push({ id: p.id, origen: 'desalojo' })
        cpu = null
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
  }
}

function avanzarRafaga(p: Pcb, instante: number, pendientes: Entrante[], origen: OrigenListo) {
  p.rafaga += 1
  if (p.rafaga >= p.rafagas.length) {
    p.estado = 'fin'
    p.fin = instante
    return
  }
  p.restante = p.rafagas[p.rafaga]
  pendientes.push({ id: p.id, origen })
}

function responseRatio(p: Pcb, t: number): number {
  const s = p.rafagas[p.rafaga]
  return (t - p.listoDesde + s) / s
}

function criterio(algoritmo: ConfigPlanificacion['algoritmo'], nuevo: Pcb, actual: Pcb): string {
  if (algoritmo === 'srt') return `le restan ${nuevo.restante} < ${actual.restante}`
  return `prioridad ${nuevo.prioridad} vs ${actual.prioridad}`
}

function motivoEleccion(algoritmo: ConfigPlanificacion['algoritmo']): string {
  switch (algoritmo) {
    case 'fifo':
    case 'rr':
      return ' (primero en la cola de listos)'
    case 'sjf':
      return ' (ráfaga más corta)'
    case 'srt':
      return ' (menor tiempo restante)'
    case 'prioridades':
    case 'prioridades-desalojo':
      return ' (mayor prioridad)'
    case 'hrrn':
      return ' (mayor response ratio)'
  }
}
