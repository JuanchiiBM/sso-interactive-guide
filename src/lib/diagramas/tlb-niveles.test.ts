import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoTlbNiveles } from './recorrido-tlb-niveles'
import { etapasNiveles, simularNiveles } from './tlb-niveles'
import { ej08 } from './tlb.ejemplos'

describe('TLB con dos niveles (ej-08)', () => {
  it('DF, PF y frame del bitmap como la resolución', () => {
    const pasos = simularNiveles(ej08)
    expect(pasos.map((p) => p.df.toString(16).padStart(8, '0'))).toEqual([
      '000a2222',
      '001510a1',
      '000b0000',
    ])
    expect(pasos.map((p) => [p.hit, p.pf])).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ])
    expect(pasos[1].frame).toBe(0x15)
    expect(pasos.at(-1)!.tlb).toHaveLength(7)
    expect([pasos[1].hits, pasos[1].accesos, pasos[1].pfs]).toEqual([1, 2, 1])
  })

  it('030110A1h: el camino del tablero tlb-08', () => {
    const x = simularNiveles(ej08)[1]
    expect(etapasNiveles(ej08, x).map((e) => [e.titulo, e.dato, e.porque, e.tono])).toEqual([
      [
        'DL',
        '030110A1h = 03 | 01 | 10A1',
        '8 bits de 1.er nivel | 8 de 2.º nivel | 16 de offset → página 0301',
        'neutro',
      ],
      ['TLB', 'miss: la 0301 es de B', 'Está 0301 → 00AA, pero de B: no sirve para A.', 'mal'],
      [
        'TP 1.er nivel',
        'TP1[03] → FFF30000h',
        'Acceso a memoria: dónde empieza la tabla de 2.º nivel.',
        'neutro',
      ],
      [
        'TP 2.º nivel',
        'TP2[01] · presencia 0 → PF',
        'Acceso a memoria. La página no está cargada.',
        'mal',
      ],
      [
        'Bitmap de frames',
        'primer libre: 0015h (21)',
        'Asignación ascendente desde la flecha: el 0015 está en 0, pasa a 1. Hay lugar: sin víctima.',
        'aviso',
      ],
      ['TLB', 'entra 0301 → 0015, A', 'La TLB tiene lugar: se agrega sin sacar ninguna.', 'aviso'],
      ['DF', '0015 | 10A1 → 001510A1h', 'frame (16 bits) | offset (16 bits)', 'ok'],
    ])
  })

  it('recorrido: estado inicial + un paso por referencia, con el bitmap', () => {
    const r = recorridoTlbNiveles(ej08)
    expect(r.pasos!.map((p) => p.titulo)).toEqual([
      'Estado inicial',
      'A A1012222h',
      'A 030110A1h',
      'A 03030000h',
    ])
    const html = renderRecorrido(r)
    expect(html).toContain('Bitmap después (siguiente libre: 0018)')
    expect(html).toContain('A (nueva)')
  })

  it('rompe si falta una tabla o la TLB se llena', () => {
    expect(() => simularNiveles({ ...ej08, tp1: {} })).toThrow('tp1')
    expect(() => simularNiveles({ ...ej08, entradas: 5 })).toThrow('se llenó')
  })
})
