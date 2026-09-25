import { describe, expect, it } from 'vitest'
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri'
import {
  PATRON_DECIMAL,
  campoACalcular,
  celdasACalcularPlugin,
  esCeldaACalcular,
  etiquetaCampo,
} from './celdas-a-calcular'

describe('esCeldaACalcular', () => {
  it('reconoce la marca exacta, sin importar mayúsculas ni espacios', () => {
    expect(esCeldaACalcular('(a calcular)')).toBe(true)
    expect(esCeldaACalcular('  (A Calcular) ')).toBe(true)
    expect(esCeldaACalcular('( a  calcular )')).toBe(true)
  })
  it('no toma celdas que solo mencionan la frase', () => {
    expect(esCeldaACalcular('a calcular')).toBe(false)
    expect(esCeldaACalcular('5 (a calcular)')).toBe(false)
    expect(esCeldaACalcular('máximos para calcular')).toBe(false)
    expect(esCeldaACalcular('')).toBe(false)
  })
})

describe('PATRON_DECIMAL', () => {
  const re = new RegExp(`^(?:${PATRON_DECIMAL})$`)
  it('acepta enteros y decimales con coma o punto', () => {
    for (const v of ['4', '4,5', '4.5', '10', '-1,25']) expect(re.test(v)).toBe(true)
  })
  it('rechaza lo que no es un número', () => {
    for (const v of ['4,', ',5', '4,5,1', 'abc', '4 5', '']) expect(re.test(v)).toBe(false)
  })
})

describe('campoACalcular / etiquetaCampo', () => {
  it('arma la etiqueta con columna y fila', () => {
    expect(etiquetaCampo(['Proceso', ' Est. CPU '], 1, 'A')).toBe('Est. CPU de A')
    expect(etiquetaCampo([], 0, '')).toBe('Valor a calcular')
  })
  it('numera los encabezados repetidos', () => {
    const cols = ['Proceso', 'Est. CPU', 'Real CPU', 'IO', 'Est. CPU']
    expect(etiquetaCampo(cols, 1, 'B')).toBe('Est. CPU (1) de B')
    expect(etiquetaCampo(cols, 4, 'B')).toBe('Est. CPU (2) de B')
  })
  it('escapa la etiqueta en el HTML', () => {
    expect(campoACalcular('a "b" <c>')).toContain('aria-label="a &quot;b&quot; &lt;c&gt;"')
  })
})

describe('celdasACalcularPlugin en Sätteri', () => {
  const md = [
    '| Proceso | Est. CPU | Real | Est. CPU |',
    '| ------- | -------------- | ---- | -------------- |',
    '| A | _(a calcular)_ | 2 | _(a calcular)_ |',
    '| B | 3 (a calcular) | 1 | 4 |',
    '',
    'Texto (a calcular) suelto.',
  ].join('\n')

  it('convierte solo las celdas marcadas en inputs etiquetados', async () => {
    const proc = await createSatteriMarkdownProcessor({
      mdastPlugins: [celdasACalcularPlugin as never],
    })
    const { code } = await proc.render(md)
    expect(code.match(/<input/g)).toHaveLength(2)
    expect(code).toContain('aria-label="Est. CPU (1) de A"')
    expect(code).toContain('aria-label="Est. CPU (2) de A"')
    expect(code).toContain('inputmode="decimal"')
    expect(code).toContain('3 (a calcular)')
    expect(code).toContain('Texto (a calcular) suelto.')
  })
})
