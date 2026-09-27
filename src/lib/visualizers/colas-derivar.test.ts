import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from '@lib/simuladores/planificacion/simular'
import type { ConfigPlanificacion } from '@lib/simuladores/planificacion/tipos'
import { quantumPorTick, rafagaRestante } from './colas-derivar'

// Ej. 9, 10 y 11 de la guía (los que tienen quantum)
const ej9 = [
  { id: 'A', llegada: 0, rafagas: [1, 2, 6] },
  { id: 'B', llegada: 1, rafagas: [2, 3, 4] },
  { id: 'C', llegada: 3, rafagas: [1, 2, 1, 1, 2] },
  { id: 'D', llegada: 9, rafagas: [5] },
]
const casos: [string, ConfigPlanificacion][] = [
  ['RR', { algoritmo: 'rr', quantum: 3, procesos: ej9 }],
  ['VRR', { algoritmo: 'vrr', quantum: 3, procesos: ej9 }],
  [
    'multinivel',
    {
      algoritmo: 'multinivel',
      colas: [{ algoritmo: 'fifo' }, { algoritmo: 'rr', quantum: 3 }],
      procesos: [
        { id: 'A', llegada: 1, rafagas: [4, 1, 5], cola: 1 },
        { id: 'B', llegada: 1, rafagas: [5, 5, 5], cola: 2 },
        { id: 'C', llegada: 0, rafagas: [2, 2, 3], cola: 2 },
      ],
    },
  ],
  [
    'feedback',
    {
      algoritmo: 'feedback',
      colas: [{ algoritmo: 'rr', quantum: 2 }, { algoritmo: 'fifo' }],
      trasIO: 'primera',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [4, 3, 2] },
        { id: 'B', llegada: 0, rafagas: [2, 3, 1, 4, 1] },
        { id: 'C', llegada: 3, rafagas: [10, 2, 5] },
      ],
    },
  ],
]

describe('quantumPorTick coincide con los avisos del simulador', () => {
  it.each(casos)('%s', (_, config) => {
    const r = simularPlanificacion(config)
    const q = quantumPorTick(config, r)
    let chequeos = 0
    r.ticks.forEach((tick, t) => {
      tick.cpus.forEach((id, k) => {
        if (!id) return
        const actual = q[t][k]
        if (actual) expect(actual.restante).toBeGreaterThan(0)
        // "X agota su quantum (L)" se avisa en el tick siguiente
        const agota = r.ticks[t + 1]?.eventos
          .map((e) => e.match(/^(\w+) agota su quantum(?: restante)? \((?:Q=)?(\d+)\)/))
          .find((m) => m?.[1] === id)
        if (agota) {
          expect(actual).toEqual({ limite: Number(agota[2]), restante: 1 })
          chequeos++
        }
        const aux = tick.eventos
          .map((e) => e.match(/elige a (\w+) de la cola auxiliar.*quantum restante: (\d+)/))
          .find((m) => m?.[1] === id)
        if (aux) {
          expect(actual).toEqual({ limite: Number(aux[2]), restante: Number(aux[2]) })
          chequeos++
        }
      })
    })
    expect(chequeos).toBeGreaterThan(0)
  })

  it('sin quantum (FIFO) no inventa nada', () => {
    const config: ConfigPlanificacion = { algoritmo: 'fifo', procesos: ej9 }
    const q = quantumPorTick(config, simularPlanificacion(config))
    expect(q.flat().every((x) => x === null)).toBe(true)
  })
})

describe('rafagaRestante', () => {
  it('cuenta la ráfaga de CPU aunque la corte un desalojo, y la de E/S', () => {
    const config: ConfigPlanificacion = casos[2][1]
    const r = simularPlanificacion(config)
    // C arranca en t=0 con ráfaga 2, A lo desaloja en t=1 y C la termina después
    expect(rafagaRestante(r, 0, 'C', 'ejecutando')).toBe(2)
    const t = r.ticks.findIndex((x) => x.estados.A === 'bloqueado')
    expect(rafagaRestante(r, t, 'A', 'bloqueado')).toBe(1)
  })
})
