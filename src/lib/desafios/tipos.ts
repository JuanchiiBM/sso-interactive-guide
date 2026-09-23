/** Contrato de un desafío: el alumno responde y recién al acertar se ve la resolución. */
export interface Desafio {
  verificar: () => { ok: boolean; mensaje: string }
  limpiar: () => void
}
