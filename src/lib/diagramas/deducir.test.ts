import { describe, expect, it } from 'vitest'
import { deducir, realDe } from './deducir'
import { ej11, ej16, ej18 } from './deducir.ejemplos'

const veredicto = (s: typeof ej18) =>
  Object.fromEntries(deducir(s).algoritmos.map((a) => [a.alg, a.coincide]))

describe('deducir el algoritmo', () => {
  it('ej-18: víctima B2 en el frame 20 → LRU y Clock', () => {
    expect(realDe(ej18)).toEqual([{ proceso: 'A', pagina: 11, frame: 20, victima: 20 }])
    expect(veredicto(ej18)).toEqual({
      fifo: false,
      lru: true,
      clock: true,
      'clock-mejorado': false,
    })
    const [fifo, , clock, cm] = deducir(ej18).algoritmos
    expect(fifo.victimas).toEqual([30])
    expect(clock).toMatchObject({ puntero: 20, cualquiera: false })
    expect(cm).toMatchObject({ victimas: [30], cualquiera: true })
  })

  it('ej-11: la 6 (M = 0) → Clock mejorado sea cual sea el puntero, LRU no', () => {
    expect(veredicto(ej11)).toEqual({ lru: false, 'clock-mejorado': true })
    const [lru, cm] = deducir(ej11).algoritmos
    expect(lru.victimas).toEqual([6])
    expect(cm.cualquiera).toBe(true)
  })

  it('ej-16: tres víctimas en orden → solo Clock, con el puntero en el frame 4', () => {
    expect(realDe(ej16).map((r) => r.victima)).toEqual([4, 0, 5, null])
    expect(veredicto(ej16)).toEqual({
      fifo: false,
      lru: false,
      clock: true,
      'clock-mejorado': false,
    })
    const [fifo, lru, clock, cm] = deducir(ej16).algoritmos
    expect(fifo).toMatchObject({ victimas: [4, 5], desvio: 1, puntero: 4 })
    expect(lru).toMatchObject({ victimas: [4, 0, 7], desvio: 2 })
    expect(clock).toMatchObject({ victimas: [4, 0, 5, null], puntero: 4 })
    expect(cm).toMatchObject({ victimas: [0], desvio: 0 })
  })

  it('rompe con datos que no cierran', () => {
    expect(() =>
      realDe({ ...ej18, referencias: [{ proceso: 'A', dl: 0, df: 0x99 << 20 }] }),
    ).toThrow('frame 153')
    expect(() => deducir({ ...ej16, marcos: ej16.marcos.map((m) => ({ ...m, tc: 1 })) })).toThrow(
      'FIFO por TC',
    )
  })
})
