import { FILA_SO, type ResultadoPlanificacion } from './tipos'

/** Lo que el alumno marca en cada celda (proceso, t). 'cpu' = CPU 1 (o el único), 'cpu2' = CPU 2. */
export type Marca = 'cpu' | 'cpu2' | 'io' | null
/** marcas[proceso][t] */
export type GrillaGantt = Record<string, Marca[]>

export interface ErrorCelda {
  proceso: string
  t: number
  esperado: Marca
  marcado: Marca
}

export interface Veredicto {
  ok: boolean
  correctos: number
  total: number
  /** Primer error en orden temporal; null si no hay errores. */
  primerError: ErrorCelda | null
}

/** Solo cuenta como E/S el uso efectivo del dispositivo (no la espera en su cola). */
/** Con overhead de interrupciones suma la fila "SO" (una marca por instante: la de menor CPU). */
export function grillaEsperada(r: ResultadoPlanificacion, procesos: string[]): GrillaGantt {
  const filaSO = r.ticks.map((tick): Marca => {
    const k = tick.so?.indexOf(true) ?? -1
    return k < 0 ? null : k === 0 ? 'cpu' : 'cpu2'
  })
  return Object.fromEntries([
    ...procesos.map((id) => [
      id,
      r.ticks.map((tick): Marca => {
        const k = tick.cpus.indexOf(id)
        if (k >= 0) return k === 0 ? 'cpu' : 'cpu2'
        return tick.io.includes(id) ? 'io' : null
      }),
    ]),
    ...(r.so ? [[FILA_SO, filaSO]] : []),
  ])
}

export function verificarGantt(esperada: GrillaGantt, respuesta: GrillaGantt): Veredicto {
  const procesos = Object.keys(esperada)
  const ticks = esperada[procesos[0]]?.length ?? 0
  let correctos = 0
  let primerError: ErrorCelda | null = null
  for (let t = 0; t < ticks; t++) {
    for (const proceso of procesos) {
      const esperado = esperada[proceso][t]
      const marcado = respuesta[proceso]?.[t] ?? null
      if (esperado === marcado) correctos++
      else primerError ??= { proceso, t, esperado, marcado }
    }
  }
  return { ok: primerError == null, correctos, total: ticks * procesos.length, primerError }
}
