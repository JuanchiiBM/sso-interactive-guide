import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from './simular'
import { grillaEsperada, verificarGantt, type GrillaGantt } from './verificar'

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
