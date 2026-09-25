/** Puntaje de un desafío de semáforos en un simulacro: todo o nada, con descuento por sección crítica de más. */
import { verificarSemaforos } from '@lib/semaforos/explorar'
import { parsear } from '@lib/semaforos/parser'
import { accionesDeMas } from '@lib/semaforos/seccion-critica'
import type { EjercicioSemaforos, ResultadoVerificacion } from '@lib/semaforos/tipos'

/** Correcto pero con la sección crítica más grande que la de la resolución: "bien, pero no excelente". */
export const FACTOR_SECCION_CRITICA = 0.75

export interface PuntajeSemaforos {
  puntaje: number
  compila: boolean
  /** Pasa todos los tests. Contar los que pasa no sirve: el verificador poda al primer fallo. */
  correcto: boolean
  /** Acciones de más dentro de mutex, comparado con la solución de referencia. */
  seccionCriticaDeMas: boolean
  /** Lo que devolvió el verificador (para mostrar los tests al revelar). */
  verificacion: ResultadoVerificacion
}

export function puntajeSemaforos(
  codigo: string,
  desafio: EjercicioSemaforos & { solucion: string },
): PuntajeSemaforos {
  const r = verificarSemaforos(codigo, desafio)
  const compila = !r.errores.length && r.tests.length > 0
  if (!compila || !r.ok) {
    return { puntaje: 0, compila, correcto: false, seccionCriticaDeMas: false, verificacion: r }
  }
  const alumno = accionesDeMas(parsear(codigo, desafio).programa, desafio)
  const referencia = accionesDeMas(parsear(desafio.solucion, desafio).programa, desafio)
  const seccionCriticaDeMas = alumno > referencia
  return {
    puntaje: seccionCriticaDeMas ? FACTOR_SECCION_CRITICA : 1,
    compila,
    correcto: true,
    seccionCriticaDeMas,
    verificacion: r,
  }
}
