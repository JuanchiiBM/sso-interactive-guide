import { describe, expect, it } from 'vitest'
import { simularTlb, type SpecTlb } from './tlb'

// memoria-virtual ej-07: TLB FIFO de 4 entradas, LRU local con 4 frames por proceso
export const ej07: SpecTlb = {
  titulo: 'Referencias de A y B',
  bitsPagina: 6,
  bitsOffset: 14,
  bitsFrame: 4,
  entradas: 4,
  tlb: [
    { pagina: 11, frame: 2, proceso: 'A', ingreso: 50 },
    { pagina: 7, frame: 12, proceso: 'A', ingreso: 75 },
    { pagina: 3, frame: 9, proceso: 'B', ingreso: 35 },
    { pagina: 15, frame: 7, proceso: 'B', ingreso: 60 },
  ],
  procesos: {
    A: [
      { frame: 2, pagina: 11, acc: 80 },
      { frame: 5, pagina: 5, acc: 65 },
      { frame: 8, pagina: 13, acc: 20 },
      { frame: 12, pagina: 7, acc: 75 },
    ],
    B: [
      { frame: 1, pagina: 11, acc: 30 },
      { frame: 3 },
      { frame: 7, pagina: 15, acc: 60 },
      { frame: 9, pagina: 3, acc: 48 },
    ],
  },
  referencias: [
    { proceso: 'B', dl: 0x2c010, instante: 85 },
    { proceso: 'A', dl: 0x2f022, instante: 90 },
    { proceso: 'A', dl: 0x19333, instante: 95 },
    { proceso: 'B', dl: 0x1e041, instante: 100 },
    { proceso: 'A', dl: 0x30000, instante: 105 },
  ],
}

// memoria-virtual ej-06, P1: TLB y frames vacíos, referencias como páginas
export const ej06: SpecTlb = {
  titulo: 'P1',
  entradas: 4,
  procesos: { P1: [{ frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3 }] },
  referencias: [10, 11, 0, 3, 4, 11, 0, 3, 4, 11, 0, 3, 4],
}

const tlbStr = (t: { pagina: number; frame: number; proceso: string }[]) =>
  t.map((e) => `${e.pagina}/${e.frame}/${e.proceso}`)

describe('simularTlb', () => {
  it('ej-07: DF, hits, accesos a TP y PF como la resolución', () => {
    const pasos = simularTlb(ej07)
    expect(pasos.map((p) => p.df!.toString(16))).toEqual(['4010', 'b022', '21333', 'e041', '14000'])
    expect(pasos.map((p) => p.hit)).toEqual([null, 0, null, null, null])
    expect(pasos.map((p) => p.pf)).toEqual([false, false, true, true, true])
    const ultimo = pasos.at(-1)!
    expect([ultimo.hits, ultimo.accesosTP, ultimo.pfs]).toEqual([1, 4, 3])
    expect(tlbStr(ultimo.tlb)).toEqual(['6/8/A', '12/5/A', '11/1/B', '7/3/B'])
  })

  it('ej-07: víctimas de LRU y lo que sale de la TLB', () => {
    const [b1, , a6, b7, a12] = simularTlb(ej07)
    expect(b1.sale).toMatchObject({ pagina: 3, ingreso: 35 })
    expect(b1.pos).toBe(2)
    expect(a6.victima).toEqual({ pagina: 13, frame: 8, acc: 20 })
    expect(a6.usos).toEqual([
      { pagina: 11, acc: 90 },
      { pagina: 5, acc: 65 },
      { pagina: 13, acc: 20 },
      { pagina: 7, acc: 75 },
    ])
    expect(b7.victima).toBeUndefined()
    expect(b7.frame).toBe(3)
    expect(a12.victima).toEqual({ pagina: 5, frame: 5, acc: 65 })
    expect(a12.sale).toMatchObject({ pagina: 7, ingreso: 75 })
  })

  it('ej-06: 5 fallos de TLB y 5 PF; después, todo hit', () => {
    const pasos = simularTlb(ej06)
    expect(pasos.map((p) => p.hit != null)).toEqual([
      ...Array(5).fill(false),
      ...Array(8).fill(true),
    ])
    expect(pasos[4].victima).toEqual({ pagina: 10, frame: 0, acc: 1 })
    expect(pasos[4].sale).toMatchObject({ pagina: 10, ingreso: 1 })
    expect(pasos[0].sale).toBeNull()
    expect(pasos.at(-1)!.pfs).toBe(5)
  })

  it('rompe con datos que no cierran', () => {
    expect(() => simularTlb({ ...ej07, referencias: [{ proceso: 'C', dl: 1 }] })).toThrow(
      'proceso C',
    )
    expect(() => simularTlb({ ...ej07, referencias: [{ proceso: 'A', dl: 0x100000 }] })).toThrow(
      'no entra',
    )
    expect(() =>
      simularTlb({ ...ej07, referencias: [{ proceso: 'A', dl: 0x2f022, instante: 70 }] }),
    ).toThrow('no es posterior')
    expect(() => simularTlb({ ...ej07, referencias: [5] })).toThrow('de qué proceso')
    const chica = { titulo: 'x', entradas: 4, procesos: { P: [{ frame: 0 }, { frame: 1 }] } }
    expect(() => simularTlb({ ...chica, referencias: [1, 2, 3] })).toThrow('queda en la TLB')
  })
})
