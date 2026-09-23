import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from './simular'
import type { ProcesoInput } from './tipos'

const gantt = (r: ReturnType<typeof simularPlanificacion>) =>
  r.ticks.map((t) => t.cpu ?? '-').join('')

// Silberschatz, "Operating System Concepts", cap. 5
const llegadasEscalonadas: ProcesoInput[] = [
  { id: 'A', llegada: 0, rafagas: [8] },
  { id: 'B', llegada: 1, rafagas: [4] },
  { id: 'C', llegada: 2, rafagas: [9] },
  { id: 'D', llegada: 3, rafagas: [5] },
]

describe('simularPlanificacion', () => {
  it('FIFO respeta el orden de llegada', () => {
    const r = simularPlanificacion({ algoritmo: 'fifo', procesos: llegadasEscalonadas })
    expect(r.metricas.map((m) => m.finalizacion)).toEqual([8, 12, 21, 26])
    expect(r.fin).toBe(26)
  })

  it('SJF sin desalojo (todos en t=0): espera promedio 7', () => {
    const r = simularPlanificacion({
      algoritmo: 'sjf',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [6] },
        { id: 'B', llegada: 0, rafagas: [8] },
        { id: 'C', llegada: 0, rafagas: [7] },
        { id: 'D', llegada: 0, rafagas: [3] },
      ],
    })
    expect(gantt(r)).toBe('DDDAAAAAACCCCCCCBBBBBBBB')
    expect(r.promedioEspera).toBe(7)
  })

  it('SRT: espera promedio 6.5', () => {
    const r = simularPlanificacion({ algoritmo: 'srt', procesos: llegadasEscalonadas })
    expect(gantt(r)).toBe('ABBBBDDDDDAAAAAAACCCCCCCCC')
    expect(r.promedioEspera).toBe(6.5)
  })

  it('RR q=4: espera promedio 17/3', () => {
    const r = simularPlanificacion({
      algoritmo: 'rr',
      quantum: 4,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [24] },
        { id: 'B', llegada: 0, rafagas: [3] },
        { id: 'C', llegada: 0, rafagas: [3] },
      ],
    })
    expect(gantt(r).slice(0, 10)).toBe('AAAABBBCCC')
    expect(r.promedioEspera).toBeCloseTo(17 / 3)
  })

  it('Prioridades sin desalojo: menor número = mayor prioridad', () => {
    const r = simularPlanificacion({
      algoritmo: 'prioridades',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [10], prioridad: 3 },
        { id: 'B', llegada: 0, rafagas: [1], prioridad: 1 },
        { id: 'C', llegada: 0, rafagas: [2], prioridad: 4 },
        { id: 'D', llegada: 0, rafagas: [1], prioridad: 5 },
        { id: 'E', llegada: 0, rafagas: [5], prioridad: 2 },
      ],
    })
    expect(r.promedioEspera).toBe(8.2)
  })

  it('E/S en paralelo: el proceso vuelve a listos al terminar su E/S', () => {
    const r = simularPlanificacion({
      algoritmo: 'fifo',
      ioUnica: false,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [2, 3, 1] },
        { id: 'B', llegada: 0, rafagas: [4] },
      ],
    })
    // A:0-2, B:2-6, A vuelve de E/S en t=5 y ejecuta en 6
    expect(gantt(r)).toBe('AABBBBA')
    expect(r.metricas[0].finalizacion).toBe(7)
  })

  it('Guía FRBA Ej. 1 (FIFO, E/S única)', () => {
    const r = simularPlanificacion({
      algoritmo: 'fifo',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [5, 1, 3, 3, 4] },
        { id: 'B', llegada: 1, rafagas: [4, 5, 4] },
        { id: 'C', llegada: 2, rafagas: [3, 3, 2, 2, 3] },
      ],
    })
    expect(gantt(r)).toBe('AAAAABBBBCCCAAABBBBCCAAAACCC')
    expect(r.metricas.map((m) => m.finalizacion)).toEqual([25, 19, 28])
  })

  it('E/S única: los bloqueados hacen cola FIFO en el dispositivo', () => {
    const r = simularPlanificacion({
      algoritmo: 'fifo',
      ioUnica: true,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [1, 3, 1] },
        { id: 'B', llegada: 0, rafagas: [1, 3, 1] },
      ],
    })
    // A usa E/S 1-4, B espera el dispositivo y lo usa 4-7
    expect(gantt(r)).toBe('AB--A--B')
  })
})
