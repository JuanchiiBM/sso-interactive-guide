import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import {
  recorridoTraduccionDirecta,
  type SpecTraduccionDirecta,
} from './recorrido-traduccion-directa'

// Memoria Real ej-04: escribir en 4 direcciones de 18 bits con segmentación y protección
const ej04: SpecTraduccionDirecta = {
  sentido: 'directo',
  titulo: 'Escrituras con segmentación y protección',
  bitsSegmento: 2,
  bitsOffset: 16,
  acceso: 'escritura',
  segmentos: [
    { seg: 0, base: 0x00000, largo: 0x0abcd, permisos: 'r' },
    { seg: 1, base: 0x1b000, largo: 0x007ff, permisos: 'x' },
    { seg: 2, base: 0x1b800, largo: 0x00fff, permisos: 'rw' },
    { seg: 3, base: 0x30000, largo: 0x01234, permisos: 'rw' },
  ],
  direcciones: [
    { dl: 0x20000 },
    { dl: 0x10000 },
    { dl: 0x0beef, texto: 'Texto del autor.' },
    { dl: 0x00ace },
  ],
}

const r = recorridoTraduccionDirecta(ej04)
const html = renderRecorrido(r)
const pasos = r.pasos!
// fotograma de un paso: lo que hay dentro de su grupo
const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]

describe('recorridoTraduccionDirecta (DL → DF con límite y permiso)', () => {
  it('un paso por dirección, con su resultado en el título', () => {
    expect(pasos.map((p) => p.titulo)).toEqual([
      '20000h → 1B800h',
      '10000h → Fault (permiso)',
      '0BEEFh → Fault (límite)',
      '00ACEh → Fault (permiso)',
    ])
  })

  it('1. corta la dirección bit a bit, con los de segmento aparte', () => {
    const f = frame(2)
    expect(f).toContain('1. Cortar 0BEEFh: 2 bits de segmento | 16 de desplazamiento')
    expect(f.match(/class="tr-bit tr-bit-seg"/g)).toHaveLength(2)
    expect(f.match(/class="tr-bit tr-bit-off"/g)).toHaveLength(16)
    expect(f).toMatch(/segmento <tspan[^>]*>0<\/tspan>/)
    expect(f).toMatch(/desplazamiento <tspan[^>]*>BEEFh<\/tspan>/)
  })

  it('2. marca la fila del segmento y el dato que falla', () => {
    const f = frame(2)
    expect(f).toContain('2. Buscar la fila del segmento 0')
    expect(f).toContain('>Protección<')
    expect(f.match(/tr-fila-sel/g)).toHaveLength(1)
    expect(f).toMatch(/class="tr-mal"[^>]*>0ABCDh</)
    expect(frame(1)).toMatch(/class="tr-mal"[^>]*>Exec only</)
  })

  it('3. el límite falla primero y lo que sigue no se llega', () => {
    const f = frame(2)
    expect(f).toContain('3. Chequeos de la MMU, en orden')
    expect(f).toContain('BEEFh ≥ ABCDh → segmentation fault')
    expect(f).toContain('no se llega (además es Read only)')
    expect(f).toContain('DF = base + desplazamiento (no se calcula)')
    expect(f.indexOf('desplazamiento &lt; largo')).toBeLessThan(
      f.indexOf('modo de acceso permitido'),
    )
  })

  it('3. con el permiso en falta, el límite pasa y el permiso corta', () => {
    const f = frame(1)
    expect(f).toContain('0000h &lt; 07FFh')
    expect(f).toContain('escribir en un segmento Exec only → fault por permiso')
    expect(f).not.toContain('además')
  })

  it('3. si pasa todo, calcula la DF', () => {
    const f = frame(0)
    expect(f).toContain('0000h &lt; 0FFFh')
    expect(f).toContain('Read write permite escribir')
    expect(f).toContain('1B800h + 0000h = 1B800h')
  })

  it('chips: resueltos hasta el paso, el actual marcado y el resto con "?"', () => {
    const f = frame(2)
    expect(f).toMatch(/rm-chip-ok[^"]*"[^]*?20000h → 1B800h/)
    expect(f).toMatch(/rm-chip-mal[^"]*"[^]*?10000h → Fault \(permiso\)/)
    expect(f).toMatch(/rm-chip-mal tr-chip-actual"[^]*?0BEEFh → Fault \(límite\)/)
    expect(f).toMatch(/tr-chip-pendiente"[^]*?00ACEh → \?/)
  })

  it('el texto dice por qué falla o qué da, y suma el del autor', () => {
    expect(pasos[2].texto).toBe(
      'El primer chequeo ya falla: el desplazamiento **BEEFh** no es menor que el largo **ABCDh**, así que la MMU corta con **segmentation fault** sin mirar el permiso. Texto del autor.',
    )
    expect(pasos[1].texto).toContain('el segmento 1 es **Exec only**')
    expect(pasos[1].texto).toContain('**fault por permiso**')
    expect(pasos[0].texto).toContain('DF = 1B800h + 0000h = **1B800h**')
  })

  it('un dato inconsistente rompe el build', () => {
    const con = (d: Partial<SpecTraduccionDirecta>) => () =>
      recorridoTraduccionDirecta({ ...ej04, ...d })
    expect(con({ direcciones: [{ dl: 0x40000 }] })).toThrow(/18 bits/)
    expect(con({ segmentos: ej04.segmentos.slice(1) })).toThrow(/segmento 0/)
    expect(con({ segmentos: [{ seg: 0, base: 0, largo: 1, permisos: 'rz' }] })).toThrow(
      /permisos/,
    )
  })
})
