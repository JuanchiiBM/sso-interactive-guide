import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import {
  recorridoTraduccionBusqueda,
  type SpecTraduccionBusqueda,
} from './recorrido-traduccion-busqueda'

// Memoria Real ej-11 a): de la DF a la DL buscando el frame en las tablas de páginas
const ej11: SpecTraduccionBusqueda = {
  sentido: 'busqueda',
  titulo: 'De dirección física a lógica',
  bitsSegmento: 1,
  bitsPagina: 3,
  bitsOffset: 12,
  bitsFrame: 4,
  procesos: [
    {
      pid: 'PID1',
      segmentos: [
        { seg: 0, nombre: 'RO', paginas: { 0: 7, 1: 6, 2: 10 } },
        { seg: 1, paginas: { 0: 5, 1: 11 } },
      ],
    },
    {
      pid: 'PID2',
      segmentos: [
        { seg: 0, nombre: 'RO', paginas: { 0: 14, 1: 1, 2: 2, 3: 3, 4: 4 } },
        { seg: 1, paginas: { 0: 8, 1: 9, 2: 12 } },
      ],
    },
  ],
  direcciones: [{ df: 0x5111 }, { df: 0xb333 }, { df: 0x8111 }, { df: 0x7444 }],
}

const r = recorridoTraduccionBusqueda(ej11)
const html = renderRecorrido(r)
const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]

describe('recorridoTraduccionBusqueda (DF → frame → tabla → DL)', () => {
  it('un paso por DF, con el proceso y la DL', () => {
    expect(r.pasos!.map((p) => p.titulo)).toEqual([
      '5111h → PID1 · 8111h',
      'B333h → PID1 · 9333h',
      '8111h → PID2 · 8111h',
      '7444h → PID1 · 0444h',
    ])
  })

  it('1. corta la DF en frame | offset', () => {
    const f = frame(0)
    expect(f).toContain('1. Cortar la DF 5111h: 4 bits de frame | 12 de offset')
    expect(f.match(/tr-bit tr-bit-frame"/g)).toHaveLength(4)
    expect(f).toMatch(/frame <tspan[^>]*>5<\/tspan>/)
    expect(f).toMatch(/offset <tspan[^>]*>111h<\/tspan>/)
  })

  it('2. busca el frame en todas las tablas y marca la que lo tiene', () => {
    const f = frame(0)
    expect(f).toContain('2. Buscar el frame 5 en las tablas de páginas')
    expect(f.match(/tr-caja tr-caja-sel"/g)).toHaveLength(1)
    expect(f.match(/tr-caja tr-caja-otra"/g)).toHaveLength(3)
    expect(f).toContain('>PID1 · Seg 0 (RO)<')
    expect(f).toMatch(/class="rm-izq tr-acento"[^>]*>5</)
    expect(f).toMatch(/Está en <tspan[^>]*>PID1<\/tspan>, segmento <tspan[^>]*>1<\/tspan>/)
  })

  it('3. arma la DL con segmento | página | offset', () => {
    const f = frame(0)
    expect(f).toContain('3. Armar la DL: 1 bit de segmento | 3 de página | 12 de offset')
    expect(f.match(/tr-bit tr-bit-pag"/g)).toHaveLength(3)
    expect(f).toContain('= 8111h')
    expect(r.pasos![0].texto).toBe(
      'El frame **5** es la página 0 del segmento 1 de **PID1**. El offset no cambia al traducir, así que la DL es segmento 1 | página 000 | offset 111h = **8111h**.',
    )
  })

  it('chips por paso', () => {
    const f = frame(1)
    expect(f).toMatch(/rm-chip-ok tr-chip-pasado"[^]*?5111h → PID1 · 8111h/)
    expect(f).toMatch(/rm-chip-ok tr-chip-actual"[^]*?B333h → PID1 · 9333h/)
    expect(f).toMatch(/tr-chip-pendiente"[^]*?8111h → \?/)
  })

  it('un frame que no está en ninguna tabla queda libre', () => {
    const libre = recorridoTraduccionBusqueda({ ...ej11, direcciones: [{ df: 0xd000 }] })
    expect(libre.pasos![0].titulo).toBe('D000h → libre')
    expect(renderRecorrido(libre)).toContain('no se arma')
  })

  it('un frame en dos tablas o datos fuera de los bits rompen el build', () => {
    const dos = structuredClone(ej11)
    dos.procesos[1].segmentos[1].paginas[2] = 5
    expect(() => recorridoTraduccionBusqueda(dos)).toThrow(/varias tablas/)
    expect(() => recorridoTraduccionBusqueda({ ...ej11, direcciones: [{ df: 0x10000 }] })).toThrow(
      /16 bits/,
    )
  })
})
