import { describe, expect, it } from 'vitest'
import { huecosDe, simularHuecos, type SpecMemoria } from './memoria-huecos'

// Memoria Real ej-10: segmentación pura de 64 KiB con Best Fit
const ej10: SpecMemoria = {
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
    { carga: 'B.S3', tam: 0x4000, compactar: [{ mover: 'B.S1', a: 0x0000 }] },
  ],
}

const base = (bloques: { nombre: string; inicio: number }[], nombre: string) =>
  bloques.find((b) => b.nombre === nombre)?.inicio

describe('huecosDe', () => {
  it('devuelve lo libre entre los bloques, en orden de dirección', () => {
    expect(
      huecosDe(
        0x10000,
        ej10.inicial.map((b) => ({ ...b, proceso: 'A' })),
      ),
    ).toEqual([
      { inicio: 0x2000, tam: 0x7000 },
      { inicio: 0xb000, tam: 0x2000 },
    ])
  })
})

describe('simularHuecos', () => {
  const pasos = simularHuecos(ej10)

  it('el primer paso es el estado inicial y después uno por operación', () => {
    expect(pasos).toHaveLength(6)
    expect(pasos[0].op).toBeNull()
    expect(pasos[0].despues.map((b) => b.proceso)).toEqual(['A', 'A', 'A'])
  })

  it('ubica cada carga con el algoritmo y marca los candidatos', () => {
    expect(base(pasos[1].despues, 'B.S0')).toBe(0x2000)
    expect(pasos[1].candidatos.map((c) => c.estado)).toEqual(['elegido', 'no-entra'])
    expect(base(pasos[2].despues, 'B.S1')).toBe(0xb000)
    expect(pasos[2].candidatos.map((c) => c.estado)).toEqual(['no-elegido', 'elegido'])
    expect(base(pasos[3].despues, 'B.S2')).toBe(0x6000)
    expect(pasos[3].nuevo?.nombre).toBe('B.S2')
  })

  it('liberar un proceso saca todos sus segmentos', () => {
    expect(pasos[4].liberados.map((b) => b.nombre)).toEqual(['A.S2', 'A.S0', 'A.S1'])
    expect(huecosDe(0x10000, pasos[4].despues).map((h) => h.tam)).toEqual([0x2000, 0x2000, 0x3000])
  })

  it('compacta con los movimientos dados y recién ahí ubica', () => {
    const p = pasos[5]
    expect(p.candidatos.every((c) => c.estado === 'no-entra')).toBe(true)
    expect(p.movidos).toEqual([{ nombre: 'B.S1', de: 0xb000, a: 0x0000 }])
    expect(base(p.despues, 'B.S3')).toBe(0x9000)
    expect(huecosDe(0x10000, p.despues)).toEqual([{ inicio: 0xd000, tam: 0x3000 }])
  })

  it('una carga que no entra sin compactar rompe el build', () => {
    const sinCompactar = {
      ...ej10,
      operaciones: ej10.operaciones.slice(0, 4).concat({ carga: 'B.S3', tam: 0x4000 }),
    }
    expect(() => simularHuecos(sinCompactar)).toThrow(/B\.S3.*no entra/)
  })

  it('un movimiento que pisa otro segmento rompe el build', () => {
    const pisa = {
      ...ej10,
      operaciones: [
        ...ej10.operaciones.slice(0, 4),
        { carga: 'B.S3', tam: 0x4000, compactar: [{ mover: 'B.S1', a: 0x2000 }] },
      ],
    }
    expect(() => simularHuecos(pisa)).toThrow(/B\.S1/)
  })

  it('bloques iniciales superpuestos rompen el build', () => {
    expect(() =>
      simularHuecos({
        ...ej10,
        inicial: [...ej10.inicial, { nombre: 'X', inicio: 0x1000, tam: 0x2000 }],
      }),
    ).toThrow(/superpone/)
  })
})

describe('empates y otros algoritmos', () => {
  // Memoria Real ej-07: dos huecos de 4096 empatan con Best Fit
  const ej07: SpecMemoria = {
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
  }

  it('Best Fit con empate toma el primero y marca el otro como empate', () => {
    const [, p] = simularHuecos(ej07)
    expect(p.nuevo?.inicio).toBe(8192)
    expect(p.candidatos.map((c) => c.estado)).toEqual([
      'elegido',
      'no-entra',
      'no-elegido',
      'empate',
    ])
  })

  it('Worst Fit recalcula los huecos después de cada asignación (ej-08)', () => {
    const pasos = simularHuecos({
      total: 16384,
      algoritmo: 'peor',
      inicial: [
        { nombre: 'P1.S1', inicio: 0, tam: 4096 },
        { nombre: 'P1.S3', inicio: 7168, tam: 2048 },
        { nombre: 'P1.S4', inicio: 10240, tam: 2048 },
        { nombre: 'P1.S2', inicio: 14336, tam: 2048 },
      ],
      operaciones: [
        { carga: 'P2.S1', tam: 2048 },
        { carga: 'P2.S2', tam: 1024 },
      ],
    })
    expect(pasos[1].nuevo?.inicio).toBe(4096)
    expect(pasos[2].nuevo?.inicio).toBe(12288)
    expect(pasos[2].huecosAntes.map((h) => h.tam)).toEqual([1024, 1024, 2048])
  })

  it('First Fit toma el primero por dirección donde entra', () => {
    const [, p] = simularHuecos({
      ...ej07,
      algoritmo: 'primer',
      operaciones: [{ carga: 'X', tam: 5000 }],
    })
    expect(p.nuevo?.inicio).toBe(43008)
  })
})

// FAT/UFS ej-37: particiones dinámicas de 16 MiB (en KiB); P2 crece 1538 KiB
const ej37: SpecMemoria = {
  total: 16384,
  algoritmo: 'primer',
  inicial: [
    { nombre: 'P1', inicio: 0, tam: 8192 },
    { nombre: 'P2', inicio: 9216, tam: 4096 },
    { nombre: 'P3', inicio: 14336, tam: 2048 },
  ],
  operaciones: [{ agranda: 'P2', tam: 1538, compactar: [{ mover: 'P2', a: 8192 }] }],
}

describe('simularHuecos: agrandar', () => {
  it('crece en su lugar si el hueco de atrás alcanza', () => {
    const [, p] = simularHuecos({ ...ej37, operaciones: [{ agranda: 'P2', tam: 1000 }] })
    expect(p.despues.find((b) => b.nombre === 'P2')).toMatchObject({ inicio: 9216, tam: 5096 })
    expect(p.crece).toEqual({ nombre: 'P2', inicio: 13312, tam: 1000 })
    expect(p.candidatos.map((c) => c.estado)).toEqual(['no-al-lado', 'elegido'])
  })

  it('si no alcanza, compacta con los movimientos del autor y crece', () => {
    const [, p] = simularHuecos(ej37)
    expect(p.candidatos.map((c) => c.estado)).toEqual(['no-al-lado', 'no-entra'])
    expect(p.movidos).toEqual([{ nombre: 'P2', de: 9216, a: 8192 }])
    expect(p.despues.find((b) => b.nombre === 'P2')).toMatchObject({ inicio: 8192, tam: 5634 })
    expect(p.crece).toEqual({ nombre: 'P2', inicio: 12288, tam: 1538 })
    expect(huecosDe(16384, p.despues)).toEqual([{ inicio: 13826, tam: 510 }])
  })

  it('rompe sin compactación, si no alcanza después de compactar o si no existe', () => {
    expect(() => simularHuecos({ ...ej37, operaciones: [{ agranda: 'P2', tam: 1538 }] })).toThrow(
      'no hay compactación',
    )
    expect(() =>
      simularHuecos({
        ...ej37,
        operaciones: [{ agranda: 'P2', tam: 1538, compactar: [{ mover: 'P3', a: 14336 }] }],
      }),
    ).toThrow('ni después de compactar')
    expect(() => simularHuecos({ ...ej37, operaciones: [{ agranda: 'P9', tam: 1 }] })).toThrow('P9')
  })
})

// FAT/UFS ej-32: segmentación pura de 1 MiB (en KiB); C carga dos segmentos juntos
const ej32: SpecMemoria = {
  total: 1024,
  algoritmo: 'primer',
  inicial: [
    { nombre: 'PA.S0', inicio: 0, tam: 256 },
    { nombre: 'PB.S0', inicio: 384, tam: 128 },
    { nombre: 'PB.S1', inicio: 576, tam: 128 },
    { nombre: 'PA.S1', inicio: 768, tam: 256 },
  ],
  operaciones: [
    {
      carga: 'PC',
      segmentos: [
        { nombre: 'PC.S0', tam: 100 },
        { nombre: 'PC.S1', tam: 100 },
      ],
      compactar: [{ mover: 'PB.S1', a: 256 }],
    },
  ],
}

describe('simularHuecos: varios segmentos juntos', () => {
  it('un hueco que admite uno solo no alcanza: compacta y los pone pegados', () => {
    const [, p] = simularHuecos(ej32)
    expect(p.candidatos.map((c) => c.estado)).toEqual(['entra-uno', 'no-entra', 'no-entra'])
    expect(p.juntos?.map((b) => [b.nombre, b.proceso, b.inicio])).toEqual([
      ['PC.S0', 'PC', 512],
      ['PC.S1', 'PC', 612],
    ])
    expect(huecosDe(1024, p.despues)).toEqual([{ inicio: 712, tam: 56 }])
  })

  it('si entran juntos en un hueco, no compacta', () => {
    const [, p] = simularHuecos({
      ...ej32,
      operaciones: [
        {
          carga: 'PC',
          segmentos: [
            { nombre: 'PC.S0', tam: 60 },
            { nombre: 'PC.S1', tam: 60 },
          ],
        },
      ],
    })
    expect(p.movidos).toEqual([])
    expect(p.juntos?.map((b) => b.inicio)).toEqual([256, 316])
  })
})
