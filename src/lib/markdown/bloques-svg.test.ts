import { describe, expect, it } from 'vitest'
import { bloqueSVG } from './bloques-svg'

const yaml = `
titulo: Segmentos de B con Best Fit
total: 0x10000
algoritmo: mejor
tabla: B
inicial:
  - { nombre: A.S2, inicio: 0x0000, tam: 0x2000 }
  - { nombre: A.S0, inicio: 0x9000, tam: 0x2000 }
operaciones:
  - { carga: B.S0, tam: 0x4000 }
  - { libera: A }
`

describe('bloque ```memoria', () => {
  it('lee el YAML (con hexa) y dibuja el recorrido', () => {
    const html = bloqueSVG('memoria', yaml)!
    expect(html).toContain('data-recorrido')
    expect(html).toContain('Tabla de segmentos de B en este paso')
    expect(html).toContain('>10000h<')
  })

  it('un YAML sin título o con un error de datos rompe el build', () => {
    expect(() => bloqueSVG('memoria', yaml.replace(/titulo:.*\n/, ''))).toThrow(/titulo/)
    expect(() => bloqueSVG('memoria', yaml.replace('libera: A', 'libera: Z'))).toThrow(/Z/)
  })
})
