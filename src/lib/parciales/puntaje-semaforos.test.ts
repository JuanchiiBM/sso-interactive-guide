import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { sep } from 'node:path'
import { parse } from 'yaml'
import { plantilla } from '@lib/semaforos/parser'
import type { EjercicioSemaforos } from '@lib/semaforos/tipos'
import { FACTOR_SECCION_CRITICA, puntajeSemaforos } from './puntaje-semaforos'

type ConSolucion = EjercicioSemaforos & { solucion: string }
const desafios = (rel: string): ConSolucion[] => {
  const texto = readFileSync(`src/content/ejercicios/${rel}`, 'utf8')
  return parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1]).semaforos ?? []
}
const desafio = (rel: string) => desafios(rel)[0]
const desafiosConSemaforos = () =>
  readdirSync('src/content/ejercicios', { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.split(sep).join('/'))
    .filter((f) => desafios(f).length > 0)

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

  it('la plantilla sin tocar saca 0 aunque pase los tests que no necesitan sincronización', () => {
    const p = puntajeSemaforos(plantilla(cafe), cafe)
    expect(p.testsGratis).toBeGreaterThan(0)
    expect(p.testsOk).toBe(p.testsGratis)
    expect(p.puntaje).toBe(0)
  })

  it('una solución parcial suma la proporción de los tests que la plantilla no pasa', () => {
    // sin el límite de pendientes: falla solo el test del límite
    const sinLimite = cafe.solucion.replace(/ *(wait|signal)\(capacidadPreparador\);\n/g, '')
    const p = puntajeSemaforos(sinLimite, cafe)
    expect(p.testsOk).toBe(p.tests - 1)
    expect(p.puntaje).toBeCloseTo((p.tests - 1 - p.testsGratis) / (p.tests - p.testsGratis))
  })

  it('el código original de "Z" (con deadlock) no suma: es la plantilla', () => {
    const z = desafio('sincronizacion/ej-21.md')
    const p = puntajeSemaforos(plantilla(z), z)
    expect(p.seccionCriticaDeMas).toBe(true)
    expect(p.puntaje).toBe(0)
  })

  it('en todos los desafíos la plantilla vale 0 y la referencia 1', () => {
    for (const rel of desafiosConSemaforos()) {
      for (const d of desafios(rel)) {
        expect(puntajeSemaforos(plantilla(d), d).puntaje, rel).toBe(0)
        expect(puntajeSemaforos(d.solucion, d).puntaje, rel).toBe(1)
      }
    }
  })
})
