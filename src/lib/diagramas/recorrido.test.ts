import { describe, expect, it } from 'vitest'
import { estados, renderRecorrido, type Recorrido } from './recorrido'
import { RECORRIDOS } from './recorridos/index'
import { caja, grupo, texto } from './svg'

const base: Recorrido = {
  ancho: 200,
  alto: 100,
  titulo: 'Prueba',
  cuerpo: [
    caja(50, 50, 60, 30, 'A', '', 'a'),
    caja(150, 50, 60, 30, 'B', '', 'b'),
    grupo('nota', texto(100, 90, '!'), { oculto: true }),
    texto(100, 10, 'x = 0', { val: 'x' }),
  ],
  fichas: { p: 'P' },
  lugares: { a: { x: 50, y: 35 }, b: { x: 150, y: 35 } },
  pasos: [
    { titulo: '1', texto: '', resaltar: ['a'], fichas: { p: 'a' }, valores: { x: 'x = 1' } },
    { titulo: '2', texto: '', fichas: { p: 'b' }, clases: { b: 'rc-ok' }, mostrar: ['nota'] },
    { titulo: '3', texto: '', fichas: { p: null }, clases: { b: '' }, ocultar: ['nota'] },
  ],
}

describe('estados de un recorrido', () => {
  it('fichas, valores, clases y visibles se heredan; el resaltado no', () => {
    const [e1, e2, e3] = estados(base, base.pasos!)
    expect(e1).toEqual({ r: ['a'], f: { p: [50, 35] }, v: { x: 'x = 1' }, c: {}, m: [] })
    expect(e2).toEqual({
      r: [],
      f: { p: [150, 35] },
      v: { x: 'x = 1' },
      c: { b: 'rc-ok' },
      m: ['nota'],
    })
    expect(e3).toEqual({ r: [], f: { p: null }, v: { x: 'x = 1' }, c: {}, m: [] })
  })

  it('un lugar o una ficha que no existen fallan en build', () => {
    expect(() => estados(base, [{ titulo: '', texto: '', fichas: { p: 'z' } }])).toThrow(/lugar/)
    expect(() => estados(base, [{ titulo: '', texto: '', fichas: { q: 'a' } }])).toThrow(/ficha/)
  })

  it('el texto admite código y negrita, y escapa HTML', () => {
    const html = renderRecorrido({
      ...base,
      pasos: [{ titulo: 'T', texto: 'usa `fork()` y **no** <b>' }],
    })
    expect(html).toContain('<code>fork()</code>')
    expect(html).toContain('<strong>no</strong>')
    expect(html).toContain('&lt;b&gt;')
  })
})

/** Valores de un atributo en el SVG generado. */
const atributos = (html: string, attr: string) =>
  new Set([...html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map((m) => m[1]))

describe.each(Object.entries(RECORRIDOS))('recorrido %s', (_, r) => {
  const html = renderRecorrido(r)
  const els = atributos(html, 'data-el')
  const vals = atributos(html, 'data-val')
  const ocultos = new Set([...html.matchAll(/data-el="([^"]+)" data-rc-oculto/g)].map((m) => m[1]))
  const pasos = (r.variantes ?? [{ nombre: '', pasos: r.pasos ?? [] }]).flatMap((v) => v.pasos)

  it('tiene pasos con título y texto', () => {
    expect(pasos.length).toBeGreaterThan(1)
    for (const p of pasos) expect(p.titulo && p.texto, JSON.stringify(p)).toBeTruthy()
  })

  it('todo lo que nombra un paso existe en el dibujo', () => {
    for (const p of pasos) {
      for (const el of [...(p.resaltar ?? []), ...Object.keys(p.clases ?? {})])
        expect(els, `${p.titulo}: data-el "${el}"`).toContain(el)
      for (const el of [...(p.mostrar ?? []), ...(p.ocultar ?? [])])
        expect(ocultos, `${p.titulo}: "${el}" no es un grupo oculto`).toContain(el)
      for (const v of Object.keys(p.valores ?? {}))
        expect(vals, `${p.titulo}: data-val "${v}"`).toContain(v)
      for (const c of Object.values(p.clases ?? {}))
        expect(['', 'rc-ok', 'rc-mal', 'rc-aviso'], `${p.titulo}: clase "${c}"`).toContain(c)
    }
  })
})
