import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoTraduccion, type SpecTraduccion } from './recorrido-traduccion'

// Memoria Real ej-10 a): reconstruir la tabla de segmentos de A desde traducciones
const ej10: SpecTraduccion = {
  titulo: 'Tabla de segmentos de A desde sus traducciones',
  total: 0x10000,
  bitsSegmento: 2,
  bitsOffset: 14,
  proceso: 'A',
  direcciones: [
    { dl: 0x9fff, df: 0x1fff, tam: 0x2000, texto: 'Es la última dirección válida.' },
    { dl: 0x0a98, df: 0x9a98, tam: 0x2000 },
    { dl: 0x51fa, df: 0xe1fa, tam: 0x3000 },
  ],
}

const r = recorridoTraduccion(ej10)
const html = renderRecorrido(r)
const pasos = r.pasos!

describe('recorridoTraduccion (inversa: DL y DF → base)', () => {
  it('un paso por dirección y uno final con la tabla', () => {
    expect(pasos.map((p) => p.titulo)).toEqual([
      'DL 9FFFh → DF 1FFFh',
      'DL 0A98h → DF 9A98h',
      'DL 51FAh → DF E1FAh',
      'Tabla de segmentos',
    ])
  })

  it('corta los bits, despeja la base y suma el texto del autor', () => {
    expect(pasos[2].texto).toContain('`01 | 01 0001 1111 1010`')
    expect(pasos[2].texto).toContain('segmento **1**, offset **11FAh**')
    expect(pasos[2].texto).toContain('E1FAh − 11FAh = **D000h**')
    expect(pasos[0].texto).toContain('Es la última dirección válida.')
  })

  it('dibuja el corte de bits, la cuenta y la DF sobre la barra', () => {
    expect(html).toContain('1. Cortar la dirección lógica: 2 bits de segmento | 14 bits de offset')
    expect(html).toContain('2. La DF es base + offset, entonces base = DF − offset')
    expect(html).toContain('3. Ubicarlo en la memoria')
    expect(html).toContain('DF E1FAh')
    expect(html).toContain('>A.S1<')
  })

  it('al final, la tabla completa y los huecos', () => {
    expect(html).toContain('Tabla de segmentos de A')
    expect(pasos[3].texto).toContain('[2000h, 9000h) 28 KiB')
    expect(pasos[3].texto).toContain('[B000h, D000h) 8 KiB')
  })

  it('una DF que no da una base alineada con la barra rompe el build', () => {
    expect(() =>
      recorridoTraduccion({ ...ej10, direcciones: [{ dl: 0x51fa, df: 0x01fa, tam: 0x3000 }] }),
    ).toThrow(/base/)
  })
})
