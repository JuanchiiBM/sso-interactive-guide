import { describe, expect, it } from 'vitest'
import { recorridoTraduccionPasos, type SpecTraduccionPasos } from './recorrido-traduccion-pasos'
import { renderTraduccion } from './traduccion-bloque'

const tres: SpecTraduccionPasos = {
  sentido: 'pasos',
  titulo: 'Leer 6B10h en tres esquemas',
  dl: 0x6b10,
  acceso: 'lectura',
  esquemas: [
    {
      nombre: 'Segmentación pura',
      bitsSegmento: 2,
      bitsOffset: 14,
      segmentos: [
        { seg: 0, base: 0, limite: 0x1fff, permisos: 'RW-' },
        { seg: 1, base: 0x8000, limite: 0x2fff, permisos: 'R-X' },
      ],
    },
    {
      nombre: 'Paginación pura',
      bitsPagina: 4,
      bitsOffset: 12,
      paginas: { 5: 9, 6: 3, 7: 14 },
    },
    {
      nombre: 'Segmentación paginada',
      bitsSegmento: 2,
      bitsPagina: 2,
      bitsOffset: 12,
      segmentos: [{ seg: 1, limite: 0x2fff, permisos: 'R-X', paginas: { 0: 5, 1: 10, 2: 12 } }],
    },
  ],
}
const plano = (t: string) => t.replace(/\*\*/g, '')

describe('traducción en pasos cortos (Metodología)', () => {
  const r = recorridoTraduccionPasos(tres)

  it('una pestaña por esquema, una slide por paso de la receta', () => {
    expect(r.variantes!.map((v) => [v.nombre, v.pasos.map((p) => p.titulo)])).toEqual([
      ['Segmentación pura', ['Corte', 'Límite', 'Permiso', 'DF']],
      ['Paginación pura', ['Corte', 'Tabla de páginas', 'DF']],
      ['Segmentación paginada', ['Corte', 'Límite', 'Permiso', 'Tabla de páginas', 'DF']],
    ])
  })

  it('la misma DL da una DF distinta en cada esquema', () => {
    const df = r.variantes!.map((v) => plano(v.pasos.at(-1)!.texto))
    expect(df[0]).toContain('8000h + 2B10h = AB10h')
    expect(df[1]).toContain('3B10h')
    expect(df[2]).toContain('CB10h')
  })

  it('el corte dice qué bits del primer dígito siguen siendo desplazamiento', () => {
    const [pura, pag, segPag] = r.variantes!.map((v) => plano(v.pasos[0].texto))
    expect(pura).toContain(
      '6 = 01|10 → segmento 1, y los otros 2 bits siguen siendo desplazamiento',
    )
    expect(pag).toContain('primer dígito entero: página 6')
    expect(segPag).toContain('6 = 01|10 → segmento 1, página 2.')
  })

  it('cada slide muestra solo su fotograma', () => {
    const p = r.variantes![2].pasos[1]
    expect(p.mostrar).toEqual(['e2-p1'])
    expect(p.ocultar).toHaveLength(11)
  })

  it('en decimal corta dividiendo', () => {
    const dec = recorridoTraduccionPasos({
      ...tres,
      dl: 20780,
      unidad: 'decimal',
      acceso: 'escritura',
      esquemas: [
        {
          nombre: 'Segmentación paginada',
          bitsSegmento: 2,
          bitsPagina: 3,
          bitsOffset: 10,
          segmentos: [{ seg: 2, limite: 6143, permisos: 'RW-', paginas: { 3: 9, 4: 14, 5: 6 } }],
        },
      ],
    })
    const pasos = dec.pasos!.map((p) => plano(p.texto))
    expect(pasos[0]).toContain('20780 div 8192 = 2 y el resto, 4396')
    expect(pasos[0]).toContain('4396 div 1024 = página 4, resto 300')
    expect(pasos.at(-1)).toContain('14 × 1024 + 300 = 14636')
  })

  it('un fault corta la receta en ese paso', () => {
    const mal = recorridoTraduccionPasos({ ...tres, dl: 0x7c00, esquemas: [tres.esquemas[0]] })
    expect(mal.pasos!.map((p) => p.titulo)).toEqual(['Corte', 'Límite'])
    expect(plano(mal.pasos![1].texto)).toContain('segmentation fault')
  })

  it('rompe el build si falta el segmento de la DL', () => {
    expect(() =>
      recorridoTraduccionPasos({ ...tres, dl: 0xc000, esquemas: [tres.esquemas[0]] }),
    ).toThrow('falta el segmento 3')
  })

  it('el bloque acepta sentido: pasos', () => {
    const html = renderTraduccion(
      'sentido: pasos\ntitulo: x\ndl: 0x6B10\nesquemas:\n  - { nombre: P, bitsPagina: 4, bitsOffset: 12, paginas: { 6: 3 } }',
    )
    expect(html).toContain('e0-p2')
  })
})
