import { describe, expect, it } from 'vitest'
import { exigir, idTipo, linksAMetodologia, metodologiaHref } from './validar'

describe('metodología: validación de build', () => {
  it('el id del tipo es el último tramo del id de la entrada', () => {
    expect(idTipo('parcial-2/memoria-real/dl-df-hexa')).toBe('dl-df-hexa')
  })

  it('arma la ruta del tema y el ancla del tipo', () => {
    expect(metodologiaHref('parcial-2/memoria-real')).toBe('/metodologia/parcial-2/memoria-real/')
    expect(metodologiaHref('parcial-2/memoria-real', 'huecos')).toBe(
      '/metodologia/parcial-2/memoria-real/#huecos',
    )
  })

  it('un tipo o un ancla inexistente rompe el build', () => {
    expect(() => exigir(['a', 'b'], ['a', 'b', 'c'], 'x')).not.toThrow()
    expect(() => exigir(['a', 'zz'], new Set(['a']), 'memoria-real/ej-03')).toThrow(
      'memoria-real/ej-03: no existe zz',
    )
  })

  it('encuentra los links a la metodología en el markdown de la teoría', () => {
    const md =
      'texto <a href="/metodologia/parcial-2/memoria-real/#dl-df-hexa">x</a> y ' +
      '[y](/metodologia/parcial-2/fat-ufs/#leer-byte) pero no [z](/teoria/parcial-2/fat-ufs/#a)'
    expect(linksAMetodologia(md)).toEqual([
      { tema: 'parcial-2/memoria-real', tipo: 'dl-df-hexa' },
      { tema: 'parcial-2/fat-ufs', tipo: 'leer-byte' },
    ])
  })
})
