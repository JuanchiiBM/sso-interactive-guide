/** Algoritmo de detección de deadlock, puro: arma los números del recorrido `deteccion`. */
import { menorIgual, sumar, type Vector } from './banquero'

export interface VueltaDeteccion {
  /** Procesos sin marcar revisados en orden hasta encontrar uno con `Pet ≤ D`. */
  revisados: { proceso: number; cumple: boolean }[]
  /** El que se marca en esta vuelta, o null si ninguno puede avanzar. */
  elegido: number | null
  antes: Vector
  despues: Vector
}

export interface Deteccion {
  /** Sin nada asignado: se marcan de entrada (no pueden ser parte de un deadlock). */
  descartados: number[]
  vueltas: VueltaDeteccion[]
  /** Marcados en las vueltas, en orden. */
  marcados: number[]
  /** Los que quedaron sin marcar. */
  deadlock: number[]
}

/** En cada vuelta se marca el primer proceso (en orden) con `Pet ≤ D` y se hace `D = D + A`. */
export function detectar(asig: Vector[], pet: Vector[], disp: Vector): Deteccion {
  const descartados = asig.flatMap((a, i) => (a.every((x) => x === 0) ? [i] : []))
  const marcado = asig.map((_, i) => descartados.includes(i))
  const vueltas: VueltaDeteccion[] = []
  const marcados: number[] = []
  let d = disp
  while (marcado.includes(false)) {
    const revisados: VueltaDeteccion['revisados'] = []
    let elegido: number | null = null
    for (let i = 0; i < asig.length && elegido === null; i++) {
      if (marcado[i]) continue
      const cumple = menorIgual(pet[i], d)
      revisados.push({ proceso: i, cumple })
      if (cumple) elegido = i
    }
    const antes = d
    if (elegido !== null) {
      d = sumar(d, asig[elegido])
      marcado[elegido] = true
      marcados.push(elegido)
    }
    vueltas.push({ revisados, elegido, antes, despues: d })
    if (elegido === null) break
  }
  const deadlock = marcado.flatMap((m, i) => (m ? [] : [i]))
  return { descartados, vueltas, marcados, deadlock }
}
