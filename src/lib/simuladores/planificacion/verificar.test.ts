import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from './simular'
import {
  grillaEsperada,
  variantesPlanificacion,
  verificarGantt,
  type GrillaGantt,
} from './verificar'

const r = simularPlanificacion({
  algoritmo: 'fifo',
  procesos: [
    { id: 'A', llegada: 0, rafagas: [1, 2, 1] },
    { id: 'B', llegada: 0, rafagas: [2] },
  ],
})

describe('grillaEsperada', () => {
  it('marca CPU y uso de E/S por proceso', () => {
    // A: CPU t0, E/S t1-2, CPU t3 · B: CPU t1-2
    expect(grillaEsperada(r, ['A', 'B'])).toEqual({
      A: ['cpu', 'io', 'io', 'cpu'],
      B: [null, 'cpu', 'cpu', null],
    })
  })
})

describe('verificarGantt', () => {
  const esperada = grillaEsperada(r, ['A', 'B'])

  it('acepta la respuesta exacta', () => {
    const v = verificarGantt(esperada, structuredClone(esperada))
    expect(v).toMatchObject({ ok: true, correctos: 8, total: 8 })
  })

  it('una E/S sin marcar es error, y se informa el primero en el tiempo', () => {
    const resp: GrillaGantt = { A: ['cpu', null, 'io', 'cpu'], B: [null, 'cpu', 'cpu', 'cpu'] }
    const v = verificarGantt(esperada, resp)
    expect(v.ok).toBe(false)
    expect(v.correctos).toBe(6)
    expect(v.primerError).toEqual({ proceso: 'A', t: 1, esperado: 'io', marcado: null })
  })

  it('una respuesta vacía no rompe', () => {
    expect(verificarGantt(esperada, {}).correctos).toBe(2)
  })
})

describe('grillaEsperada con dos procesadores', () => {
  it('distingue CPU 1 de CPU 2', () => {
    const r2 = simularPlanificacion({
      algoritmo: 'fifo',
      procesadores: 2,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [1] },
        { id: 'B', llegada: 0, rafagas: [2] },
      ],
    })
    expect(grillaEsperada(r2, ['A', 'B'])).toEqual({ A: ['cpu', null], B: ['cpu2', 'cpu2'] })
  })
})

describe('grillaEsperada con overhead de interrupciones', () => {
  it('agrega la fila SO con la CPU que usa el SO', () => {
    const r3 = simularPlanificacion({
      algoritmo: 'fifo',
      overheadInterrupcion: 2,
      procesos: [{ id: 'A', llegada: 0, rafagas: [1, 1, 1] }],
    })
    expect(grillaEsperada(r3, ['A'])).toEqual({
      A: ['cpu', 'io', null, null, 'cpu'],
      SO: [null, null, 'cpu', 'cpu', null],
    })
  })
})

describe('variantes válidas con 2 CPUs (Planificación Ej. 3)', () => {
  const base = {
    algoritmo: 'fifo' as const,
    procesadores: 2,
    procesos: [
      { id: 'A', llegada: 0, rafagas: [5, 1, 3, 3, 4] },
      { id: 'B', llegada: 1, rafagas: [4, 5, 4] },
      { id: 'C', llegada: 2, rafagas: [3, 3, 2, 2, 3] },
    ],
  }
  const texto = (g: GrillaGantt) =>
    Object.fromEntries(
      Object.entries(g).map(([p, m]) => [
        p,
        m.map((x) => (x === 'cpu' ? '1' : x === 'cpu2' ? '2' : x === 'io' ? 'E' : '.')).join(''),
      ]),
    )
  const conAfinidad = variantesPlanificacion({ ...base, afinidad: true })

  it('la primera variante es la del simulador (CPU libre de menor número)', () => {
    const r = conAfinidad[0]
    expect(texto(grillaEsperada(r, r.hilos))).toEqual(
      texto(grillaEsperada(simularPlanificacion({ ...base, afinidad: true }), r.hilos)),
    )
  })

  it('en t=5 C puede tomar la CPU 2 (nunca ejecutó: todavía no tiene afinidad)', () => {
    const grillas = conAfinidad.map((r) => texto(grillaEsperada(r, r.hilos)))
    expect(grillas).toContainEqual({
      A: '11111E111.....EEE1111.',
      B: '.2222.EEEEE2222.......',
      C: '.....222...EEE.22EE222',
    })
  })

  it('una E/S mal medida sigue siendo error aunque se elija otra CPU', () => {
    const mal = {
      A: '11111E111....EEE.1111.',
      B: '.2222.EEEE2222........',
      C: '.....222..EEE.22EE222.',
    }
    const grillas = conAfinidad.map((r) => texto(grillaEsperada(r, r.hilos)))
    expect(grillas).not.toContainEqual(mal)
  })

  it('sin afinidad hay más combinaciones, pero todas respetan FIFO', () => {
    const sin = variantesPlanificacion(base)
    expect(sin.length).toBeGreaterThan(conAfinidad.length)
    for (const r of sin) expect(r.fin).toBe(simularPlanificacion(base).fin)
  })
})
