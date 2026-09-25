import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { plantilla } from '@lib/semaforos/parser'
import type { EjercicioSemaforos } from '@lib/semaforos/tipos'
import { FACTOR_SECCION_CRITICA, puntajeSemaforos } from './puntaje-semaforos'

type ConSolucion = EjercicioSemaforos & { solucion: string }
const desafio = (rel: string): ConSolucion => {
  const texto = readFileSync(`src/content/ejercicios/${rel}`, 'utf8')
  return parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1]).semaforos[0]
}

describe('puntajeSemaforos', { timeout: 30_000 }, () => {
  const cafe = desafio('sincronizacion/ej-29.md')

  it('la solución de referencia saca 1', () => {
    const p = puntajeSemaforos(cafe.solucion, cafe)
    expect(p).toMatchObject({ puntaje: 1, compila: true, seccionCriticaDeMas: false })
    expect(p.testsOk).toBe(p.tests)
  })

  it('correcta pero con la sección crítica de más saca 0,75', () => {
    const ancha = cafe.solucion.replace(
      '    pedido = generarPedido();\n    wait(capacidadPreparador);\n    wait(mutexPendientes);\n',
      '    wait(capacidadPreparador);\n    wait(mutexPendientes);\n    pedido = generarPedido();\n',
    )
    const p = puntajeSemaforos(ancha, cafe)
    expect(p.testsOk).toBe(p.tests)
    expect(p.seccionCriticaDeMas).toBe(true)
    expect(p.puntaje).toBe(FACTOR_SECCION_CRITICA)
  })

  it('si no compila saca 0', () => {
    const p = puntajeSemaforos('semaphore x = 1;\nvoid Cliente( {', cafe)
    expect(p).toMatchObject({ puntaje: 0, compila: false })
  })

  it('una solución parcial suma la proporción de tests que pasa', () => {
    // sin el límite de pendientes: falla solo el test del límite
    const sinLimite = cafe.solucion.replace(/ *(wait|signal)\(capacidadPreparador\);\n/g, '')
    const p = puntajeSemaforos(sinLimite, cafe)
    expect(p.testsOk).toBe(p.tests - 1)
    expect(p.puntaje).toBeCloseTo((p.tests - 1) / p.tests)
  })

  it('el código original de "Z" (con deadlock y sección crítica de más) combina los dos descuentos', () => {
    const z = desafio('sincronizacion/ej-21.md')
    const p = puntajeSemaforos(plantilla(z), z)
    expect(p.seccionCriticaDeMas).toBe(true)
    expect(p.testsOk).toBeLessThan(p.tests)
    expect(p.puntaje).toBeCloseTo((p.testsOk / p.tests) * FACTOR_SECCION_CRITICA)
  })
})
