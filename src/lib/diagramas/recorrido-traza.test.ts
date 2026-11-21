import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoTraza } from './recorrido-traza'
import type { TrazaSpec } from '../calculos/traza'

// Memoria Virtual ej-21: Clock mejorado global, 8 frames, puntero en el 5
const ej21: TrazaSpec = {
  marcos: [
    { marco: 0, pagina: 'P4p3', u: false, m: false, ultimoUso: -1 },
    { marco: 1, pagina: 'P3p3', u: true, m: false, ultimoUso: -1 },
    { marco: 2, pagina: 'P1p1', u: true, m: false, ultimoUso: -1 },
    { marco: 3, pagina: 'P3p0', u: false, m: true, ultimoUso: -1 },
    { marco: 4, pagina: 'P2p2', u: true, m: false, ultimoUso: -1 },
    { marco: 5, pagina: 'P1p0', u: true, m: true, ultimoUso: -1 },
    { marco: 6, pagina: 'P3p2', u: false, m: true, ultimoUso: -1 },
    { marco: 7, pagina: 'P2p1', u: false, m: false, ultimoUso: -1 },
  ],
  puntero: 5,
  referencias: [
    { etiqueta: 'P2 7800', pagina: 'P2p0', acceso: 'L' },
    { etiqueta: 'P1 18010', pagina: 'P1p2', acceso: 'L' },
    { etiqueta: 'P4 83045', pagina: 'P4p10', acceso: 'L' },
  ],
  algoritmos: ['clock-mejorado'],
  invalida: false,
}

const vacios = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    marco: i,
    pagina: null,
    u: false,
    m: false,
    ultimoUso: -1,
  }))
const simple = (refs: number[], alg: TrazaSpec['algoritmos'][number]): TrazaSpec => ({
  marcos: vacios(3),
  puntero: 0,
  referencias: refs.map((p) => ({ etiqueta: String(p), pagina: p, acceso: 'L' as const })),
  algoritmos: [alg],
  invalida: false,
})
const pasosDe = (spec: TrazaSpec, alg: TrazaSpec['algoritmos'][number]) =>
  recorridoTraza(spec, alg).variantes![0].pasos

describe('recorridoTraza reusa la grilla de la cátedra', () => {
  it('desde un estado: la grilla de recorridoReemplazoEstado, con las páginas como texto', () => {
    const html = renderRecorrido(recorridoTraza(ej21, 'clock-mejorado'))
    expect(html).toContain('A disco')
    expect(html).toContain('Frame 5')
    expect(html).toContain('P2p0 L')
    expect(html).not.toContain('rt-celda')
  })

  it('frames vacíos y páginas numéricas: la grilla de recorridoReemplazo', () => {
    const p = pasosDe(simple([1, 2, 3, 1, 4], 'fifo'), 'fifo')
    expect(p[0].titulo).toBe('Carga inicial.')
  })
})

describe('narración paso a paso', () => {
  const p = pasosDe(ej21, 'clock-mejorado')

  it('Clock mejorado: el puntero frame por frame y dónde queda', () => {
    expect(p[1].texto).toContain('1.ª vuelta busca (0,0): F5 (1,1), F6 (0,1), F7 (0,0) víctima')
    expect(p[1].texto).toContain('El puntero queda en el F0')
    expect(p[3].texto).toContain(
      '2.ª vuelta busca (0,1) bajando U: F1 → U=0, F2 → U=0, F3 (0,1) víctima',
    )
    expect(p[3].texto).toContain('**se escribe en disco**')
    expect(p[3].texto).toContain('El puntero queda en el F4')
  })

  it('FIFO y Clock desde un estado dado', () => {
    const cargado: TrazaSpec = {
      marcos: [
        { marco: 0, pagina: 1, u: true, m: false, ultimoUso: 1 },
        { marco: 1, pagina: 2, u: true, m: false, ultimoUso: 2 },
      ],
      puntero: 0,
      referencias: [{ etiqueta: '3', pagina: 3, acceso: 'L' }],
      algoritmos: ['fifo', 'clock'],
      invalida: false,
    }
    expect(pasosDe(cargado, 'fifo')[1].texto).toContain('la que hace más tiempo que entró')
    expect(pasosDe(cargado, 'clock')[1].texto).toContain(
      'F0 (U=1) → U=0, F1 (U=1) → U=0, F0 (U=0) víctima',
    )
  })
})
