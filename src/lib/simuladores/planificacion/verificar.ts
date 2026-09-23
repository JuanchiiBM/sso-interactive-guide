import type { ResultadoPlanificacion } from './tipos'

export type LineaCPU = (string | null)[]

export interface Veredicto {
  ok: boolean
  correctos: number
  total: number
  /** Primer instante donde la respuesta difiere; null si no hay errores. */
  primerError: number | null
}

export const lineaEsperada = (r: ResultadoPlanificacion): LineaCPU => r.ticks.map((t) => t.cpu)

/** Compara la ocupación de CPU instante por instante. */
export function verificarLineaCPU(esperada: LineaCPU, respuesta: LineaCPU): Veredicto {
  let correctos = 0
  let primerError: number | null = null
  esperada.forEach((cpu, t) => {
    if ((respuesta[t] ?? null) === cpu) correctos++
    else primerError ??= t
  })
  return { ok: primerError == null, correctos, total: esperada.length, primerError }
}
