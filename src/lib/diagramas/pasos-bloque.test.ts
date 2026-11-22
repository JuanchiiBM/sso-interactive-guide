import { describe, expect, it } from 'vitest'
import { recorridoPasos, renderPasos } from './pasos-bloque'
import { renderTraza } from './traza-bloque'

describe('bloque pasos (ejemplos de la Metodología)', () => {
  const r = recorridoPasos({
    titulo: 'Formato',
    pasos: [
      {
        titulo: 'Offset',
        texto: 'a',
        campos: [{ nombre: 'offset', bits: 11 }],
        resultado: 'offset 11',
      },
      { titulo: 'Frame', texto: 'b', grande: '2^17 / 2^11 = **64**', resultado: '✓ frame 6' },
      {
        titulo: 'Tabla',
        texto: 'c',
        tabla: {
          columnas: ['A', 'B'],
          filas: [
            [1, 2],
            [3, 4],
          ],
          marca: 1,
        },
      },
    ],
  })

  it('una slide por paso, cada una sola en su fotograma', () => {
    expect(r.pasos!.map((p) => p.titulo)).toEqual(['Offset', 'Frame', 'Tabla'])
    expect(r.pasos![2].mostrar).toEqual(['e0-p2'])
  })

  it('los resultados quedan como chips en los pasos siguientes', () => {
    const svg = r.cuerpo.join('')
    const tercera = svg.slice(svg.indexOf('e0-p2'))
    expect(tercera).toContain('offset 11')
    expect(tercera).toContain('rm-chip rm-chip-ok')
  })

  it('con variantes arma pestañas', () => {
    const v = recorridoPasos({
      titulo: 'x',
      variantes: [
        { nombre: 'Hit', pasos: [{ titulo: 'a', texto: 'a' }] },
        { nombre: 'Page fault', pasos: [{ titulo: 'b', texto: 'b' }] },
      ],
    })
    expect(v.variantes!.map((x) => x.nombre)).toEqual(['Hit', 'Page fault'])
  })

  it('rompe el build sin pasos o sin texto', () => {
    expect(() => renderPasos('titulo: x')).toThrow('lleva `pasos` o `variantes`')
    expect(() => renderPasos('titulo: x\npasos: [{ titulo: a }]')).toThrow('falta titulo o texto')
  })
})

describe('bloque traza', () => {
  it('Clock mejorado desde un estado: la vuelta 2 encuentra la (0,1)', () => {
    const html = renderTraza(`titulo: t
algoritmo: clock-mejorado
puntero: 0
marcos:
  - { marco: 0, pagina: A0, u: true }
  - { marco: 1, pagina: A1, m: true }
  - { marco: 2, pagina: A2, u: true, m: true }
referencias:
  - { pagina: A3 }
  - { pagina: A0, acceso: E }`)
    expect(html).toContain('A3')
    expect(html).toMatch(/2\.ª vuelta/)
  })

  it('rompe el build con un algoritmo inventado', () => {
    expect(() => renderTraza('titulo: t\nalgoritmo: magia\nmarcos: []\nreferencias: []')).toThrow(
      'algoritmo "magia"',
    )
  })
})
