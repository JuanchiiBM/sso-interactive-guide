import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from '../simuladores/planificacion/simular'
import { estados } from './recorrido'
import { recorridos as hilos, configQuantumUlt } from './recorridos/hilos'
import { configRoundRobin, recorridos as planificacion } from './recorridos/planificacion'

const cpu = (c: Parameters<typeof simularPlanificacion>[0]) =>
  simularPlanificacion(c).ticks.map((t) => t.cpu ?? '-')

describe('rr-quantum coincide con el simulador', () => {
  it('q = 1: el Gantt que narran los pasos', () => {
    const r = simularPlanificacion(configRoundRobin(1))
    expect(cpu(configRoundRobin(1)).join('')).toBe('ABCACAB')
    expect(r.ticks.filter((t) => t.io.includes('B')).map((t) => t.t)).toEqual([2, 3])
    // en t = 4 A (clock) entra antes que B (fin de E/S)
    expect(r.ticks[4].listos).toEqual(['A', 'B'])
  })

  it('q = 3: nadie agota el quantum y queda igual que FIFO', () => {
    const q3 = cpu(configRoundRobin(3))
    expect(q3.join('')).toBe('AAABCCB')
    expect(cpu({ ...configRoundRobin(3), algoritmo: 'fifo' })).toEqual(q3)
    const r = simularPlanificacion(configRoundRobin(3))
    expect(r.ticks.filter((t) => t.io.includes('B')).map((t) => t.t)).toEqual([4, 5])
  })

  it('el contador del último paso de cada pestaña', () => {
    const rr = planificacion['rr-quantum']
    const finales = rr.variantes!.map((v) => estados(rr, v.pasos).at(-1)!.v.cambios)
    expect(finales).toEqual(['cambios de contexto: 6', 'cambios de contexto: 3'])
  })
})

describe('quantum-ult coincide con el simulador', () => {
  it('ULT1 y ULT2 comparten el quantum de KA; al volver sigue ULT2', () => {
    const r = simularPlanificacion(configQuantumUlt)
    expect(r.ticks.map((t) => t.cpu)).toEqual([
      'ULT1',
      'ULT1',
      'ULT2',
      'ULT2',
      'P',
      'P',
      'ULT2',
      'ULT2',
    ])
    // lo que le queda a KA al empezar cada tick (el dibujo lo pinta al terminar)
    expect([0, 1, 2, 3, 6, 7].map((t) => r.ticks[t].quantum![0])).toEqual([4, 3, 2, 1, 4, 3])
    expect(r.ticks[4].bibliotecas![0].elegido).toBe('ULT2')
    expect(hilos['quantum-ult']).toBeDefined()
  })
})
