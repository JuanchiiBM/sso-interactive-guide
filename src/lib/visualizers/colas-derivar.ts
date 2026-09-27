/** Datos del diagrama de colas que el Tick no trae y se reconstruyen de la traza (sin tocar el simulador). */
import type {
  ConfigPlanificacion,
  EstadoProceso,
  ResultadoPlanificacion,
  Tick,
} from '@lib/simuladores/planificacion/tipos'

export interface QuantumCpu {
  /** Quantum con el que se lo despachó (en VRR desde la auxiliar: Q − usado). */
  limite: number
  /** Lo que le queda al empezar el tick. */
  restante: number
}

const BLOQUEOS: EstadoProceso[] = ['bloqueado', 'espera-io', 'espera-so']

/**
 * Quantum restante de cada CPU en cada tick (`[t][k]`), o null si el algoritmo no tiene quantum.
 * Repite las reglas de cola de destino del simulador; ver brain "Diagrama de Colas" (Planificación).
 */
export function quantumPorTick(
  config: ConfigPlanificacion,
  r: ResultadoPlanificacion,
): (QuantumCpu | null)[][] {
  const { algoritmo, quantum } = config
  const conQuantum = ['rr', 'vrr', 'multinivel', 'feedback'].includes(algoritmo)
  if (r.kltDe || !conQuantum) return r.ticks.map((t) => t.cpus.map(() => null))

  const colas = algoritmo === 'multinivel' || algoritmo === 'feedback' ? (config.colas ?? []) : []
  const qDe = (c: number): number | null => {
    if (algoritmo === 'rr' || algoritmo === 'vrr') return quantum ?? null
    const def = colas[c]
    return def?.algoritmo === 'rr' ? (def.quantum ?? null) : null
  }
  const ultima = Math.max(0, colas.length - 1)
  const fija = new Map(config.procesos.map((p) => [p.id, Math.max(0, (p.cola ?? 1) - 1)] as const))
  const colaNuevo = (id: string) =>
    algoritmo === 'vrr' ? 1 : algoritmo === 'feedback' ? 0 : (fija.get(id) ?? 0)

  const cola = new Map<string, number>()
  const usadoVRR = new Map<string, number>()
  let corriendo = new Map<string, { limite: number | null; usado: number }>()
  const salida: (QuantumCpu | null)[][] = []

  r.ticks.forEach((tick, t) => {
    const previo: Tick | undefined = r.ticks[t - 1]
    // la cola de cada listo sale directo del Tick
    tick.colas?.forEach((c, i) => c.procesos.forEach((id) => cola.set(id, i)))
    const ahora = new Map<string, { limite: number | null; usado: number }>()
    salida.push(
      tick.cpus.map((id, k) => {
        if (!id || tick.so?.[k]) return null
        const antes = corriendo.get(id)
        const vencio = antes && antes.limite != null && antes.usado >= antes.limite
        let run = antes && !vencio ? antes : null
        if (!run) {
          const estadoPrevio = previo?.estados[id]
          let c: number
          const enCola = previo?.colas?.findIndex((q) => q.procesos.includes(id)) ?? -1
          if (estadoPrevio === 'listo' && enCola >= 0) c = enCola
          else if (vencio) {
            const actual = cola.get(id) ?? 0
            c =
              algoritmo === 'vrr'
                ? 1
                : algoritmo === 'feedback'
                  ? Math.min(actual + 1, ultima)
                  : actual
          } else if (estadoPrevio && BLOQUEOS.includes(estadoPrevio)) {
            const usado = usadoVRR.get(id) ?? 0
            c =
              algoritmo === 'vrr'
                ? usado < (quantum ?? 0)
                  ? 0
                  : 1
                : algoritmo === 'feedback'
                  ? config.trasIO === 'primera'
                    ? 0
                    : (cola.get(id) ?? 0)
                  : (fija.get(id) ?? 0)
          } else c = cola.get(id) ?? colaNuevo(id)
          cola.set(id, c)
          if (algoritmo === 'vrr' && c === 1) usadoVRR.set(id, 0)
          const q = qDe(c)
          const limite = q == null ? null : algoritmo === 'vrr' ? q - (usadoVRR.get(id) ?? 0) : q
          run = { limite, usado: 0 }
        }
        ahora.set(id, { limite: run.limite, usado: run.usado + 1 })
        usadoVRR.set(id, (usadoVRR.get(id) ?? 0) + 1)
        return run.limite == null ? null : { limite: run.limite, restante: run.limite - run.usado }
      }),
    )
    corriendo = ahora
  })
  return salida
}

/** Cuántos ticks le quedan desde `t` a la ráfaga actual de `id` en el estado dado (CPU o E/S). */
export function rafagaRestante(
  r: ResultadoPlanificacion,
  t: number,
  id: string,
  estado: 'ejecutando' | 'bloqueado',
): number {
  let n = 0
  for (let s = t; s < r.ticks.length; s++) {
    const e = r.ticks[s].estados[id]
    if (e === estado) n++
    // la ráfaga de CPU puede cortarse por desalojo (vuelve a listos) y seguir después
    else if (!(estado === 'ejecutando' && e === 'listo')) break
  }
  return n
}
