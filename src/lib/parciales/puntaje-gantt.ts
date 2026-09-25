/** Puntaje de un Gantt en un simulacro: se empieza a sumar desde el 80 % de celdas correctas. */
import type { GrillaGantt } from '@lib/simuladores/planificacion/verificar'

export const UMBRAL_GANTT = 0.8

/**
 * Proporción de celdas correctas contando solo las que no están vacías en la esperada o en la
 * respuesta (así dejar el Gantt en blanco no suma), contra la mejor de las variantes válidas.
 */
export function porcentajeGantt(respuesta: GrillaGantt, variantes: GrillaGantt[]): number {
  let mejor = 0
  for (const esperada of variantes) {
    let relevantes = 0
    let bien = 0
    for (const fila of Object.keys(esperada)) {
      const e = esperada[fila]
      const r = respuesta[fila] ?? []
      const largo = Math.max(e.length, r.length)
      for (let t = 0; t < largo; t++) {
        const a = e[t] ?? null
        const b = r[t] ?? null
        if (a == null && b == null) continue
        relevantes++
        if (a === b) bien++
      }
    }
    mejor = Math.max(mejor, relevantes ? bien / relevantes : 1)
  }
  return mejor
}

/** 0 por debajo del umbral; de ahí sube lineal hasta 1 con el 100 %. */
export function puntajeGantt(respuesta: GrillaGantt, variantes: GrillaGantt[]): number {
  const p = porcentajeGantt(respuesta, variantes)
  return p < UMBRAL_GANTT ? 0 : (p - UMBRAL_GANTT) / (1 - UMBRAL_GANTT)
}
