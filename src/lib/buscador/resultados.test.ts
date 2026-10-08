import { describe, expect, it } from 'vitest'
import { agrupar, armarResultado, normalizarConsulta } from './resultados'

const sub = (title: string, ancla: string, hits: number) => ({
  title,
  url: `/teoria/parcial-1/arquitectura/${ancla}`,
  excerpt: title,
  locations: Array.from({ length: hits }, (_, i) => i),
})
const arquitectura = {
  url: '/teoria/parcial-1/arquitectura/',
  excerpt: 'una <mark>interrupción</mark> es un aviso',
  meta: { title: 'Repaso de arquitectura', tipo: 'Teoría' },
  sub_results: [
    { ...sub('Repaso de arquitectura', '', 2), url: '/teoria/parcial-1/arquitectura/' },
    sub('Componentes básicos', '#componentes', 1),
    sub('Registros', '#registros', 2),
    sub('Interrupciones', '#interrupciones', 3),
    sub('Qué pasa cuando llega una interrupción', '#que-pasa', 7),
    sub('Preguntas de parcial', '#preguntas', 7),
  ],
}

describe('armarResultado', () => {
  it('lleva a la sección que se llama como lo buscado, con su extracto', () => {
    const r = armarResultado(arquitectura, 'interrupciones')
    expect(r.titulo).toBe('Repaso de arquitectura')
    expect(r.seccion).toBe('Interrupciones')
    expect(r.url).toBe('/teoria/parcial-1/arquitectura/#interrupciones')
    expect(r.extracto).toBe('Interrupciones')
    expect(r.secciones.map((s) => s.titulo)).toEqual([
      'Qué pasa cuando llega una interrupción',
      'Preguntas de parcial',
    ])
  })

  it('singular, sin tilde y en mayúsculas cuenta igual', () => {
    expect(armarResultado(arquitectura, 'INTERRUPCION').seccion).toBe('Interrupciones')
  })

  it('si ningún título la nombra, gana la sección con más coincidencias', () => {
    expect(armarResultado(arquitectura, 'psw').seccion).toBe(
      'Qué pasa cuando llega una interrupción',
    )
  })

  it('sin secciones lleva al principio de la página', () => {
    const r = armarResultado({ url: '/x/', excerpt: 'e', meta: {} })
    expect(r).toEqual({
      titulo: '/x/',
      url: '/x/',
      seccion: '',
      tipo: '',
      fuente: '',
      extracto: 'e',
      secciones: [],
    })
  })
})

describe('agrupar', () => {
  const ej = (n: number) => ({
    url: `/ej-${n}/`,
    excerpt: '',
    meta: { title: `Ej. ${n}`, tipo: 'Ejercicio' },
  })
  it('teoría primero aunque los ejercicios tengan más puntaje; cada grupo conserva su orden', () => {
    const grupos = agrupar([ej(19), ej(33), arquitectura, ej(16)], 'interrupciones')
    expect(grupos.map((g) => [g.nombre, g.resultados.map((r) => r.titulo)])).toEqual([
      ['Teoría', ['Repaso de arquitectura']],
      ['Ejercicios', ['Ej. 19', 'Ej. 33', 'Ej. 16']],
    ])
  })
  it('un grupo vacío no aparece', () => {
    expect(agrupar([ej(1)]).map((g) => g.nombre)).toEqual(['Ejercicios'])
  })
})

describe('normalizarConsulta', () => {
  it('recorta espacios y descarta consultas de una letra', () => {
    expect(normalizarConsulta('  page   fault ')).toBe('page fault')
    expect(normalizarConsulta(' a ')).toBeNull()
  })
})
