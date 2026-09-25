import { describe, expect, it } from 'vitest'
import { banda, calcularNota, formatearNota, notaDeItems } from './nota'

describe('calcularNota', () => {
  it('todo bien da 10 y todo mal da 0', () => {
    expect(calcularNota([1, 1, 1], [[1], [1, 1]]).nota).toBe(10)
    expect(calcularNota([0, 0], [[0], [0]]).nota).toBe(0)
  })

  it('teoría pesa 40 % y práctica 60 %', () => {
    expect(calcularNota([1, 1], [[0], [0]]).exacta).toBeCloseTo(4)
    expect(calcularNota([0, 0], [[1], [1]]).exacta).toBeCloseTo(6)
  })

  it('cada pregunta de teoría vale lo mismo', () => {
    // 3 de 4 bien en teoría → 0,75 × 4 = 3, más práctica perfecta = 6
    expect(calcularNota([1, 1, 1, 0], [[1]]).exacta).toBeCloseTo(9)
  })

  it('las partes de un ejercicio se reparten su peso', () => {
    // ejercicio 1 con Gantt bien y MC mal = 0,5; ejercicio 2 perfecto = 1 → práctica 0,75
    expect(calcularNota([1], [[1, 0], [1]]).exacta).toBeCloseTo(4 + 0.75 * 6)
  })

  it('si no hay teoría, la práctica vale el 100 % (y al revés)', () => {
    expect(calcularNota([], [[1], [0]]).exacta).toBeCloseTo(5)
    expect(calcularNota([1, 0], []).exacta).toBeCloseTo(5)
    expect(calcularNota([], []).nota).toBe(0)
  })

  it('redondea al 0,5 más cercano y acota cada puntaje entre 0 y 1', () => {
    expect(calcularNota([1, 1, 0], [[1]]).nota).toBe(8.5) // 8,67
    expect(calcularNota([1, 0], [[1, 0]]).nota).toBe(5) // 5,0
    expect(calcularNota([1, 1, 1, 0], [[0.5]]).nota).toBe(6) // 6,0
    expect(calcularNota([1, 1, 1, 0], [[0.42]]).nota).toBe(5.5) // 5,52
    expect(calcularNota([1.5], [[-1]]).exacta).toBeCloseTo(4)
  })
})

describe('banda', () => {
  it.each([
    [10, 'verde'],
    [8, 'verde'],
    [7.5, 'amarillo'],
    [7, 'amarillo'],
    [6, 'amarillo'],
    [5.5, 'naranja'],
    [5, 'naranja'],
    [4, 'naranja'],
    [3.5, 'rojo'],
    [3, 'rojo'],
    [0, 'rojo'],
  ] as const)('nota %s → %s', (nota, color) => {
    expect(banda(nota)).toBe(color)
  })
})

describe('formatearNota', () => {
  it('usa coma decimal', () => {
    expect(formatearNota(7.5)).toBe('7,5')
    expect(formatearNota(10)).toBe('10')
    expect(formatearNota(0)).toBe('0')
  })
})

describe('notaDeItems', () => {
  it('reparte el peso de un ejercicio entre sus partes', () => {
    const r = notaDeItems([
      { seccion: 'teoria', ejercicio: null, puntaje: 1 },
      { seccion: 'teoria', ejercicio: null, puntaje: 0 },
      { seccion: 'practica', ejercicio: 0, puntaje: 1 },
      { seccion: 'practica', ejercicio: 0, puntaje: 0 },
      { seccion: 'practica', ejercicio: 0, puntaje: 1 },
      { seccion: 'practica', ejercicio: 0, puntaje: 0 },
      { seccion: 'practica', ejercicio: 1, puntaje: 1 },
    ])
    // teoría 0,5 · 0,4 + práctica (0,5 + 1) / 2 · 0,6
    expect(r.exacta).toBeCloseTo(6.5)
    expect(r).toEqual(calcularNota([1, 0], [[1, 0, 1, 0], [1]]))
  })
})
