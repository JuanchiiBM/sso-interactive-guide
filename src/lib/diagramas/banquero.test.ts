import { describe, expect, it } from 'vitest'
import { disponibles, estadoSeguro, pendiente, solicitar } from './banquero'
import { EJEMPLO_BANQUERO as E } from './recorridos/deadlock'

describe('banquero con los datos del recorrido', () => {
  const d = disponibles(E.total, E.asig)

  it('Pend = Max − A y D = T − suma de A', () => {
    expect(pendiente(E.max, E.asig)).toEqual([
      [3, 3, 2],
      [1, 1, 1],
      [3, 1, 2],
    ])
    expect(d).toEqual([2, 1, 2])
  })

  it('el estado es seguro con la secuencia P2, P3, P1', () => {
    const s = estadoSeguro(E.max, E.asig, d)
    expect(s.seguro).toBe(true)
    expect(s.secuencia).toEqual([1, 2, 0])
    expect(s.vueltas.map((v) => v.despues)).toEqual([
      [4, 2, 3],
      [6, 4, 4],
      [7, 4, 5],
    ])
    // P1 no puede en las dos primeras vueltas
    expect(s.vueltas[0].revisados).toEqual([
      { proceso: 0, cumple: false },
      { proceso: 1, cumple: true },
    ])
    expect(s.vueltas[1].revisados).toEqual([
      { proceso: 0, cumple: false },
      { proceso: 2, cumple: true },
    ])
  })

  it('P3 pide (1, 0, 1): queda seguro y se concede', () => {
    const r = solicitar(E.max, E.asig, d, 2, [1, 0, 1])
    expect(r.disp).toEqual([1, 1, 1])
    expect(r.asig![2]).toEqual([3, 2, 2])
    expect(r.seguridad!.secuencia).toEqual([1, 2, 0])
    expect(r.concede).toBe(true)
  })

  it('P1 pide (1, 1, 0): hay disponibles pero queda inseguro y no se concede', () => {
    const r = solicitar(E.max, E.asig, d, 0, [1, 1, 0])
    expect(r.valida && r.alcanza).toBe(true)
    expect(r.disp).toEqual([1, 0, 2])
    expect(r.seguridad!.vueltas).toHaveLength(1)
    expect(r.seguridad!.vueltas[0].elegido).toBeNull()
    expect(r.concede).toBe(false)
  })

  it('pedir más de lo declarado o de lo disponible no se simula', () => {
    expect(solicitar(E.max, E.asig, d, 1, [2, 0, 0])).toMatchObject({
      valida: false,
      concede: false,
    })
    expect(solicitar(E.max, E.asig, d, 0, [3, 0, 0])).toMatchObject({
      alcanza: false,
      concede: false,
    })
  })
})
