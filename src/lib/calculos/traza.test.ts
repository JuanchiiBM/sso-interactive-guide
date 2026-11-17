import { describe, expect, it } from 'vitest'
import { columnaCorrecta, marcarDe, trazaEsperada, verificarTraza, type TrazaSpec } from './traza'

const spec: TrazaSpec = {
  marcos: [
    { marco: 1, pagina: 14, u: true, m: true, ultimoUso: 28 },
    { marco: 3, pagina: 17, u: true, m: false, ultimoUso: 3 },
    { marco: 5, pagina: 19, u: true, m: true, ultimoUso: 15 },
    { marco: 8, pagina: null, u: false, m: false, ultimoUso: -1 },
  ],
  puntero: 3,
  referencias: [
    { etiqueta: '100', pagina: 0, acceso: 'L' },
    { etiqueta: '122950', pagina: 15, acceso: 'E' },
    { etiqueta: '98306', pagina: 12, acceso: 'L' },
    { etiqueta: '139264', pagina: 17, acceso: 'E' },
    { etiqueta: '122880', pagina: 15, acceso: 'L' },
    { etiqueta: '155650', pagina: 19, acceso: 'E' },
    { etiqueta: '172100', pagina: null, acceso: 'L' },
    { etiqueta: '100', pagina: 0, acceso: 'L' },
  ],
  algoritmos: ['lru', 'clock-mejorado'],
  invalida: true,
}

describe('traza de reemplazo (Memoria virtual Ej. 5)', () => {
  it('cuenta los PF y escrituras de la resolución', () => {
    const cuenta = (alg: 'lru' | 'clock-mejorado') => {
      const t = trazaEsperada(spec, alg)
      return [t.filter((c) => c.resultado === 'pf').length, t.filter((c) => c.disco).length]
    }
    expect(cuenta('lru')).toEqual([6, 2])
    expect(cuenta('clock-mejorado')).toEqual([5, 1])
  })

  it('la dirección inválida no cambia los frames', () => {
    const t = trazaEsperada(spec, 'lru')
    expect(t[6].resultado).toBe('invalida')
    expect(t[6].paginas).toEqual(t[5].paginas)
  })

  it('H marca el frame del hit', () => {
    const t = trazaEsperada(spec, 'lru')
    expect(t[4].resultado).toBe('acierto')
    expect(t[4].h).toEqual(t[4].paginas.map((p) => p === '15'))
    expect(t[0].h.some(Boolean)).toBe(false)
  })

  it('en LRU no se comparan U ni puntero', () => {
    const marcar = marcarDe('lru', spec)
    const e = trazaEsperada(spec, 'lru')[0]
    expect(columnaCorrecta(e, { ...e, u: e.u.map((x) => !x), puntero: 2 }, marcar)).toBe(true)
    expect(columnaCorrecta(e, { ...e, m: e.m.map((x) => !x) }, marcar)).toBe(false)
  })

  it('verifica todo junto', () => {
    const esperadas = spec.algoritmos.map((a) => trazaEsperada(spec, a))
    const marcar = spec.algoritmos.map((a) => marcarDe(a, spec))
    expect(verificarTraza(esperadas, esperadas, marcar).ok).toBe(true)
    const mal = esperadas.map((cols) => cols.map((c) => ({ ...c })))
    mal[1][2].disco = !mal[1][2].disco
    expect(verificarTraza(esperadas, mal, marcar)).toMatchObject({ ok: false, correctas: 15 })
  })
})

describe('traza desde frames vacíos (Memoria virtual Ej. 4)', () => {
  const vacio: TrazaSpec = {
    marcos: [0, 1, 2, 3].map((marco) => ({
      marco,
      pagina: null,
      u: false,
      m: false,
      ultimoUso: -1,
    })),
    puntero: 0,
    referencias: [0, 1, 7, 2, 3, 2, 7, 1, 0, 3, 0, 2, 3, 1].map((p) => ({
      etiqueta: String(p),
      pagina: p,
      acceso: 'L' as const,
    })),
    algoritmos: [],
    invalida: false,
  }
  it.each([
    ['optimo', 6],
    ['fifo', 7],
    ['lru', 8],
    ['clock', 7],
  ] as const)('%s da %i PF', (alg, pf) => {
    expect(trazaEsperada(vacio, alg).filter((c) => c.resultado === 'pf').length).toBe(pf)
  })
  it('Clock pide U y puntero; FIFO no', () => {
    expect(marcarDe('clock', vacio)).toMatchObject({ u: true, puntero: true, m: false })
    expect(marcarDe('fifo', vacio)).toMatchObject({ u: false, puntero: false })
  })
})

describe('traza con rótulos de proceso y FIFO/Clock desde un estado', () => {
  const global: TrazaSpec = {
    marcos: [
      { marco: 0, pagina: 'A3', u: true, m: true, ultimoUso: 0 },
      { marco: 1, pagina: 'B2', u: true, m: false, ultimoUso: 0 },
      { marco: 2, pagina: 'C0', u: false, m: true, ultimoUso: 0 },
      { marco: 3, pagina: 'C2', u: false, m: false, ultimoUso: 0 },
    ],
    puntero: 1,
    referencias: [
      { etiqueta: 'PC 8197', pagina: 'C2', acceso: 'L' },
      { etiqueta: 'PA 6195', pagina: 'A1', acceso: 'E' },
      { etiqueta: 'PB 15419', pagina: 'B3', acceso: 'L' },
      { etiqueta: 'PC 4399', pagina: 'C1', acceso: 'L' },
    ],
    algoritmos: ['clock-mejorado'],
    invalida: false,
  }
  it('Clock mejorado global (Memoria virtual Ej. 12) termina como la resolución', () => {
    const fin = trazaEsperada(global, 'clock-mejorado').at(-1)!
    expect(fin.paginas).toEqual(['A3', 'B3', 'A1', 'C1'])
    expect(fin.puntero).toBe(0)
  })
  it('compara los rótulos sin mayúsculas ni espacios', () => {
    const e = trazaEsperada(global, 'clock-mejorado')[0]
    const r = { ...e, paginas: e.paginas.map((p) => p && ` ${p.toLowerCase()}`) }
    expect(columnaCorrecta(e, r, marcarDe('clock-mejorado', global))).toBe(true)
  })
  it('FIFO desde un estado saca la página del puntero', () => {
    const t = trazaEsperada({ ...global, algoritmos: ['fifo'] }, 'fifo')
    expect(t[1].paginas).toEqual(['A3', 'A1', 'C0', 'C2'])
  })
})
