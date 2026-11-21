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

describe('recorridoTraza · Clock mejorado (ej-21)', () => {
  const r = recorridoTraza(ej21, 'clock-mejorado')
  const pasos = r.pasos!

  it('un paso para el estado inicial y uno por referencia', () => {
    expect(pasos).toHaveLength(4)
    expect(pasos[1].titulo).toBe('P2 7800 → P2p0 (L)')
  })

  it('narra el recorrido del puntero frame por frame y dónde queda', () => {
    expect(pasos[1].texto).toContain('1.ª vuelta busca (0,0): F5 (1,1), F6 (0,1), F7 (0,0) víctima')
    expect(pasos[1].texto).toContain('El puntero queda en F0')
    expect(pasos[3].texto).toContain(
      '2.ª vuelta busca (0,1) bajando U: F1 → U=0, F2 → U=0, F3 (0,1) víctima',
    )
    expect(pasos[3].texto).toContain('M=1: **se escribe en disco**')
    expect(pasos[3].texto).toContain('El puntero queda en F4')
  })

  it('la grilla muestra cada columna recién en su paso', () => {
    const html = renderRecorrido(r)
    expect(html).toMatch(/data-el="col-3"[^>]*data-rc-oculto/)
    expect(pasos[2].mostrar).toEqual(['col-2'])
    expect(pasos[2].resaltar).toEqual(['col-0', 'col-1', 'col-2'])
    expect(html).toContain('>PF<')
    expect(html).toContain('>Disco<')
  })
})

describe('recorridoTraza · otros algoritmos', () => {
  it('FIFO: sale la del puntero, la que entró primero', () => {
    const p = recorridoTraza(simple([1, 2, 3, 1, 4], 'fifo'), 'fifo').pasos!
    expect(p[1].texto).toContain('F0 estaba libre')
    expect(p[4].texto).toContain('acierto')
    expect(p[5].texto).toContain('sale **1** de F0')
    expect(p[5].texto).toContain('la que entró primero')
  })

  it('LRU: ordena por último uso', () => {
    const p = recorridoTraza(simple([1, 2, 3, 1, 4], 'lru'), 'lru').pasos!
    expect(p[5].texto).toContain('de la usada hace más tiempo a la más reciente: 2, 3, 1')
    expect(p[5].texto).toContain('sale **2**')
  })

  it('Óptimo: mira el próximo uso', () => {
    const p = recorridoTraza(simple([1, 2, 3, 4, 1, 2], 'optimo'), 'optimo').pasos!
    expect(p[4].texto).toContain('3 (nunca)')
    expect(p[4].texto).toContain('sale **3**')
  })

  it('Clock: baja los U = 1 que encuentra hasta uno en 0', () => {
    const p = recorridoTraza(simple([1, 2, 3, 4], 'clock'), 'clock').pasos!
    expect(p[4].texto).toContain('F0 (U=1) → U=0, F1 (U=1) → U=0, F2 (U=1) → U=0, F0 (U=0) víctima')
  })
})
