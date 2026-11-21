import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoMemoria, type SpecRecorridoMemoria } from './recorrido-memoria'

const ej10: SpecRecorridoMemoria = {
  titulo: 'Segmentos de B con Best Fit',
  unidad: 'hexa',
  tabla: 'B',
  total: 0x10000,
  algoritmo: 'mejor',
  inicial: [
    { nombre: 'A.S2', inicio: 0x0000, tam: 0x2000 },
    { nombre: 'A.S0', inicio: 0x9000, tam: 0x2000 },
    { nombre: 'A.S1', inicio: 0xd000, tam: 0x3000 },
  ],
  operaciones: [
    { carga: 'B.S0', tam: 0x4000 },
    { carga: 'B.S1', tam: 0x2000 },
    { carga: 'B.S2', tam: 0x3000 },
    { libera: 'A' },
    {
      carga: 'B.S3',
      tam: 0x4000,
      compactar: [{ mover: 'B.S1', a: 0x0000 }],
      texto: '¿Por qué B.S1 y no B.S2? Mover B.S2 deja **dos huecos**.',
    },
  ],
}

const r = recorridoMemoria(ej10)
const html = renderRecorrido(r)
const pasos = r.pasos!

describe('recorridoMemoria', () => {
  it('un paso por estado (inicial + cada operación), cada uno con su fotograma', () => {
    expect(pasos).toHaveLength(6)
    pasos.forEach((p, i) => {
      expect(p.mostrar).toContain(`paso-${i}`)
      expect(p.ocultar).toEqual(pasos.map((_, k) => `paso-${k}`).filter((_, k) => k !== i))
      expect(html).toMatch(new RegExp(`data-el="paso-${i}"[^>]*data-rc-oculto`))
    })
  })

  it('títulos y textos explican el porqué', () => {
    expect(pasos.map((p) => p.titulo)).toEqual([
      'Estado inicial',
      'B.S0 (16 KiB)',
      'B.S1 (8 KiB)',
      'B.S2 (12 KiB)',
      'A termina',
      'B.S3 (16 KiB)',
    ])
    expect(pasos[2].texto).toContain('Best Fit elige el más chico donde entra')
    expect(pasos[2].texto).toContain('**B000h**')
    expect(pasos[5].texto).toContain('fragmentación externa')
    expect(pasos[5].texto).toContain('Mover B.S2 deja **dos huecos**')
  })

  it('chips de huecos candidatos con rango, tamaño y estado', () => {
    expect(html).toContain('[0000h, 2000h) 8 KiB ✗ no entra')
    expect(html).toContain('[B000h, D000h) 8 KiB ✓ elegido')
    expect(html).toContain('[6000h, 9000h) 12 KiB · entra, pero Best Fit no lo elige')
    expect(html).toContain('total libre 28 KiB ≥ 16 KiB → compactar')
  })

  it('barras antes y después con marcas en hexa y la flecha del movimiento', () => {
    expect(html).toContain('>Antes<')
    expect(html).toContain('>Después<')
    expect(html).toContain('>0000h<')
    expect(html).toContain('>10000h<')
    expect(html).toContain('B.S1: base B000h → 0000h')
    expect(html).toContain('rm-mov')
    expect(html).toContain('rm-nuevo')
  })

  it('tabla de segmentos del proceso en cada paso', () => {
    expect(html).toContain('Tabla de segmentos de B en este paso')
    expect(html).toContain('0000h ← B000h')
    expect(html).toContain('9000h (nuevo)')
    expect(html).toContain('3000h (12 KiB)')
  })
})

describe('recorridoMemoria en decimal', () => {
  const html07 = renderRecorrido(
    recorridoMemoria({
      titulo: 'Best Fit',
      unidad: 'decimal',
      tabla: 'P1',
      total: 65536,
      algoritmo: 'mejor',
      inicial: [
        { nombre: 'P1.S0', inicio: 0, tam: 8192 },
        { nombre: 'P1.S2', inicio: 12288, tam: 14336 },
        { nombre: 'P2.S1', inicio: 28672, tam: 6144 },
        { nombre: 'P1.S1', inicio: 34816, tam: 8192 },
        { nombre: 'P2.S2', inicio: 49152, tam: 6144 },
        { nombre: 'P2.S0', inicio: 59392, tam: 6144 },
      ],
      operaciones: [{ carga: 'P1.S3', tam: 4096 }],
    }),
  )

  it('direcciones y tamaños en bytes, y el empate se marca', () => {
    expect(html07).toContain('[8192, 12288) 4096 B ✓ elegido')
    expect(html07).toContain('[55296, 59392) 4096 B ✓ también vale (empate)')
    expect(html07).toContain('8192 (nuevo)')
  })
})
