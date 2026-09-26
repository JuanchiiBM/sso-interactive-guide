/** Algoritmo del banquero (evasión de deadlock), puro: arma los números del recorrido `banquero`. */

export type Vector = number[]

export const restar = (a: Vector, b: Vector) => a.map((x, j) => x - b[j])
export const sumar = (a: Vector, b: Vector) => a.map((x, j) => x + b[j])
export const menorIgual = (a: Vector, b: Vector) => a.every((x, j) => x <= b[j])
export const fmt = (v: Vector) => `(${v.join(', ')})`

/** `D = T − (suma de columnas de A)`. */
export const disponibles = (total: Vector, asig: Vector[]) => asig.reduce(restar, total)

export const pendiente = (max: Vector[], asig: Vector[]) => max.map((f, i) => restar(f, asig[i]))

export interface Vuelta {
  /** Procesos revisados en orden hasta encontrar uno que pueda terminar. */
  revisados: { proceso: number; cumple: boolean }[]
  /** El que termina en esta vuelta, o null si ninguno puede (inseguro). */
  elegido: number | null
  /** D antes y después de que termine el elegido. */
  antes: Vector
  despues: Vector
}

export interface Seguridad {
  pend: Vector[]
  vueltas: Vuelta[]
  secuencia: number[]
  seguro: boolean
}

/** Chequeo de estado seguro: en cada vuelta termina el primer proceso (en orden) con `Pend ≤ D`. */
export function estadoSeguro(max: Vector[], asig: Vector[], disp: Vector): Seguridad {
  const pend = pendiente(max, asig)
  const terminado = pend.map(() => false)
  const vueltas: Vuelta[] = []
  const secuencia: number[] = []
  let d = disp
  while (secuencia.length < pend.length) {
    const revisados: Vuelta['revisados'] = []
    let elegido: number | null = null
    for (let i = 0; i < pend.length && elegido === null; i++) {
      if (terminado[i]) continue
      const cumple = menorIgual(pend[i], d)
      revisados.push({ proceso: i, cumple })
      if (cumple) elegido = i
    }
    const antes = d
    if (elegido !== null) {
      d = sumar(d, asig[elegido])
      terminado[elegido] = true
      secuencia.push(elegido)
    }
    vueltas.push({ revisados, elegido, antes, despues: d })
    if (elegido === null) break
  }
  return { pend, vueltas, secuencia, seguro: secuencia.length === pend.length }
}

export interface Solicitud {
  /** `Sol ≤ Pend[p]`: si no, el proceso pide más de lo que declaró (error). */
  valida: boolean
  /** `Sol ≤ D`: si no, el proceso espera. */
  alcanza: boolean
  /** Estado simulado (si es válida y alcanza). */
  asig?: Vector[]
  disp?: Vector
  seguridad?: Seguridad
  concede: boolean
}

/** El proceso `p` pide `sol`: se simula y se concede solo si el estado simulado es seguro. */
export function solicitar(
  max: Vector[],
  asig: Vector[],
  disp: Vector,
  p: number,
  sol: Vector,
): Solicitud {
  const valida = menorIgual(sol, pendiente(max, asig)[p])
  const alcanza = menorIgual(sol, disp)
  if (!valida || !alcanza) return { valida, alcanza, concede: false }
  const asigSim = asig.map((f, i) => (i === p ? sumar(f, sol) : f))
  const dispSim = restar(disp, sol)
  const seguridad = estadoSeguro(max, asigSim, dispSim)
  return { valida, alcanza, asig: asigSim, disp: dispSim, seguridad, concede: seguridad.seguro }
}
