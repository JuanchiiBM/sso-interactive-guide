/** Contrato de un desafío: el alumno responde y recién al acertar se ve la resolución. */
export interface Desafio {
  verificar: () => { ok: boolean; mensaje: string }
  limpiar: () => void
}

/** Un ítem de simulacro: sin feedback mientras se rinde; al finalizar se corrige y se revela. */
export interface ItemExamen {
  /** De 0 a 1. */
  puntaje: () => Promise<number>
  /** Resultado en pocas palabras para marcar el ítem al corregir (después de `puntaje`). */
  detalle: () => string
  /** Muestra la corrección y la resolución, y bloquea la respuesta. */
  revelar: () => void
}
