/** Puntaje de un desafío de semáforos en un simulacro: corrección (tests) y tamaño de la sección crítica. */
import { verificarSemaforos } from '@lib/semaforos/explorar'
import { parsear } from '@lib/semaforos/parser'
import { accionesDeMas } from '@lib/semaforos/seccion-critica'
import type { EjercicioSemaforos } from '@lib/semaforos/tipos'

/** Correcto pero con la sección crítica más grande que la de la resolución: "bien, pero no excelente". */
export const FACTOR_SECCION_CRITICA = 0.75

export interface PuntajeSemaforos {
  puntaje: number
  compila: boolean
  testsOk: number
  tests: number
  /** Acciones de más dentro de mutex, comparado con la solución de referencia. */
  seccionCriticaDeMas: boolean
}

export function puntajeSemaforos(
  codigo: string,
  desafio: EjercicioSemaforos & { solucion: string },
): PuntajeSemaforos {
  const r = verificarSemaforos(codigo, desafio)
  if (r.errores.length || r.tests.length === 0) {
    return {
      puntaje: 0,
      compila: false,
      testsOk: 0,
      tests: r.tests.length,
      seccionCriticaDeMas: false,
    }
  }
  const testsOk = r.tests.filter((t) => t.ok).length
  const alumno = accionesDeMas(parsear(codigo, desafio).programa, desafio)
  const referencia = accionesDeMas(parsear(desafio.solucion, desafio).programa, desafio)
  const seccionCriticaDeMas = alumno > referencia
  const factor = seccionCriticaDeMas ? FACTOR_SECCION_CRITICA : 1
  return {
    puntaje: (testsOk / r.tests.length) * factor,
    compila: true,
    testsOk,
    tests: r.tests.length,
    seccionCriticaDeMas,
  }
}
