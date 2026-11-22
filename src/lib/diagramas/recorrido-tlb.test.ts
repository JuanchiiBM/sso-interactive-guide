import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { etapas, hastaAca, recorridoTlb } from './recorrido-tlb'
import { renglones } from './recorrido-tlb-svg'
import { simularTlb } from './tlb'
import { ej06, ej07 } from './tlb.ejemplos'

const filas = (spec: typeof ej07, k: number) =>
  etapas(spec, simularTlb(spec)[k]).map((e) => [e.titulo, e.dato, e.porque, e.tono])

describe('recorridoTlb: etapas', () => {
  it('ej-07 PA 19333h: el camino del tablero tlb-B, textos y tonos', () => {
    expect(filas(ej07, 2)).toEqual([
      [
        'DL',
        '19333h = 000110 | 01 0011 0011 0011',
        '6 bits de página | 14 de offset → página 6, offset 1333h',
        'neutro',
      ],
      [
        'TLB',
        'miss: no hay 6 de A',
        'Hay una 11 y una 7 de A, y dos de B: ninguna sirve (tiene que ser del mismo proceso).',
        'mal',
      ],
      [
        'Tabla de páginas de A',
        'pág. 6 · P = 0 → PF',
        'Acceso a TP (el 2.º del ejercicio). La página no está en memoria.',
        'mal',
      ],
      [
        'LRU local (frames de A)',
        'sale la 13 (acc 20) del frame 8',
        'acc de A: 5 (65), 7 (75), 11 (90), 13 (20). La 6 entra en el frame 8.',
        'aviso',
      ],
      [
        'TLB (FIFO)',
        'sale 11/2/A (50) · entra 6/8/A (95)',
        'Ingresos: 50, 75, 85, 60. La más vieja es la de 50, en la posición 0.',
        'aviso',
      ],
      ['DF', '8 × 4000h + 1333h = 21333h', 'frame (4 bits) | offset (14 bits)', 'ok'],
    ])
    expect(hastaAca(ej07, simularTlb(ej07), 2)).toBe('TLB hits: 1 · accesos a TP: 2 · PF: 1')
  })

  it('ej-07: miss sin PF (tlb-2), hit (tlb-3) y PF con frame libre (tlb-5)', () => {
    expect(filas(ej07, 0).map((f) => f[0])).toEqual([
      'DL',
      'TLB',
      'Tabla de páginas de B',
      'TLB (FIFO)',
      'DF',
    ])
    expect(filas(ej07, 0)[1]).toEqual([
      'TLB',
      'miss: la 11 de la TLB es de A',
      'Las de B son la 3 y la 15: ninguna sirve (tiene que ser del mismo proceso).',
      'mal',
    ])
    expect(filas(ej07, 0)[2][1]).toBe('pág. 11 · P = 1 → frame 1')
    expect(filas(ej07, 1).map((f) => f[1])).toEqual([
      '2F022h = 001011 | 11 0000 0010 0010',
      'hit: 11 → frame 2, de A',
      '2 × 4000h + 3022h = 0B022h',
    ])
    expect(filas(ej07, 3)[3]).toEqual([
      'LRU local (frames de B)',
      'sin víctima: entra en el frame 3, libre',
      'B ocupa 3 de sus 4 frames (1, 7, 9): no hace falta sacar a nadie.',
      'neutro',
    ])
  })

  it('ej-06: sin DL ni DF, la última etapa cuenta accesos (tlb-06)', () => {
    expect(filas(ej06, 4)).toEqual([
      ['TLB', 'miss: no está la 4', 'TLB llena con 10, 11, 0 y 3.', 'mal'],
      [
        'Tabla de páginas',
        'pág. 4 · P = 0 → PF',
        'Leer la TP es 1 acceso a memoria; traer la página, 1 acceso a disco.',
        'mal',
      ],
      [
        'LRU (4 frames)',
        'sale la 10 (ref. 1) del frame 0',
        'Últimos usos: 10 (1), 11 (2), 0 (3), 3 (4). La 4 entra en el frame 0.',
        'aviso',
      ],
      [
        'TLB (FIFO)',
        'sale la 10 · entra la 4',
        'Entraron en orden 10, 11, 0 y 3: la primera es la 10, en la posición 0.',
        'aviso',
      ],
      [
        'Accesos',
        'TLB 1 · memoria 2 · disco 1',
        'Miss: TP + dato en memoria. El PF suma la lectura de disco.',
        'ok',
      ],
    ])
    expect(hastaAca(ej06, simularTlb(ej06), 4)).toBe('TLB: 5 · memoria: 10 · disco: 5')
    expect(hastaAca(ej06, simularTlb(ej06), 12)).toBe('TLB: 13 · memoria: 18 · disco: 5')
  })
})

describe('recorridoTlb: pasos y dibujo', () => {
  it('ej-07: estado inicial + un paso por referencia', () => {
    const r = recorridoTlb(ej07)
    expect(r.pasos!.map((p) => p.titulo)).toEqual([
      'Estado inicial',
      'PB 2C010h (instante 85)',
      'PA 2F022h (instante 90)',
      'PA 19333h (instante 95)',
      'PB 1E041h (instante 100)',
      'PA 30000h (instante 105)',
    ])
    expect(r.pasos![3].texto).toBe(
      '**Miss** en la TLB y **PF**: sale la 13 del frame 8. DF = **21333h**.',
    )
    const html = renderRecorrido(r)
    expect(html).toContain('95 (nueva)')
    expect(html).toContain('TLB después de este paso (sin cambios: FIFO no mira los hits)')
    expect(html).toContain('PB 2C010h (85) · PA 2F022h (90)')
  })

  it('renglones corta por palabras sin pasarse', () => {
    expect(renglones('uno dos tres cuatro', 8)).toEqual(['uno dos', 'tres', 'cuatro'])
  })
})
