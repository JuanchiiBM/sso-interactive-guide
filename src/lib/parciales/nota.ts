/** Nota de un simulacro: cada ítem vale de 0 a 1; teoría 40 % y práctica 60 %, redondeada a 0,5. */

export const PESO_TEORIA = 0.4

export type Banda = 'verde' | 'amarillo' | 'naranja' | 'rojo'

const promedio = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length
const acotar = (x: number) => Math.min(1, Math.max(0, x))

/**
 * `teoria`: el puntaje de cada pregunta. `practica`: el de cada parte de cada ejercicio (las partes de
 * un ejercicio se reparten su peso en partes iguales). Si falta una de las dos, la otra vale el 100 %.
 */
export function calcularNota(
  teoria: number[],
  practica: number[][],
): { exacta: number; nota: number } {
  const ejercicios = practica.filter((partes) => partes.length > 0)
  const t = teoria.length ? promedio(teoria.map(acotar)) : null
  const p = ejercicios.length
    ? promedio(ejercicios.map((partes) => promedio(partes.map(acotar))))
    : null
  const fraccion =
    t == null && p == null
      ? 0
      : t == null
        ? p!
        : p == null
          ? t
          : PESO_TEORIA * t + (1 - PESO_TEORIA) * p
  const exacta = 10 * fraccion
  return { exacta, nota: Math.round(exacta * 2) / 2 }
}

/** Color del borde de la card: 8–10 verde, 6–7,5 amarillo, 4–5,5 naranja, 0–3,5 rojo. */
export function banda(nota: number): Banda {
  if (nota >= 8) return 'verde'
  if (nota >= 6) return 'amarillo'
  if (nota >= 4) return 'naranja'
  return 'rojo'
}
