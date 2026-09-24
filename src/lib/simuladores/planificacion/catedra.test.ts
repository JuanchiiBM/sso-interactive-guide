/**
 * El simulador contra las RESOLUCIONES OFICIALES de parciales de la cátedra (UTN FRBA).
 * Un carácter por instante: quién tiene la CPU ('-' = ociosa). Ver docs/brain/dominio/Convenciones de la Cátedra FRBA.md
 */
import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from './simular'
import type { ConfigPlanificacion } from './tipos'

const gantt = (c: ConfigPlanificacion) =>
  simularPlanificacion(c)
    .ticks.map((t) => t.cpu ?? '-')
    .join('')

const casos: { examen: string; config: ConfigPlanificacion; oficial: string }[] = [
  {
    examen: '1R 1C2025 TM · Ej. 1 (SRT con estimación)',
    config: {
      algoritmo: 'srt',
      alfa: 0.5,
      procesos: [
        { id: 'A', llegada: 0, estimacionInicial: 5, rafagas: [4] },
        { id: 'B', llegada: 1, estimacionInicial: 3, rafagas: [5, 2, 1] },
        { id: 'C', llegada: 3, estimacionInicial: 1, rafagas: [3, 2, 1] },
        { id: 'D', llegada: 10, estimacionInicial: 2, rafagas: [2, 2, 2] },
      ],
    },
    oficial: 'ABBBBBCCCADDCAADDB',
  },
  {
    examen: '1R 2C2025 · Ej. 1 (SRT con ráfaga anterior)',
    config: {
      algoritmo: 'srt',
      alfa: 0.5,
      procesos: [
        { id: '1', llegada: 0, estimacionAnterior: 2, rafagaAnterior: 3, rafagas: [2, 1, 2] },
        { id: '2', llegada: 0, estimacionAnterior: 2, rafagaAnterior: 1, rafagas: [6, 1, 3] },
        { id: '3', llegada: 0, estimacionAnterior: 5, rafagaAnterior: 2, rafagas: [1, 3, 1] },
        { id: '4', llegada: 0, estimacionAnterior: 8, rafagaAnterior: 1, rafagas: [3, 1, 2] },
      ],
    },
    oficial: '222222113112322444-44',
  },
  {
    examen: '1R 1C2025 TT · Ej. 3 (HRRN)',
    config: {
      algoritmo: 'hrrn',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [4, 3, 2] },
        { id: 'B', llegada: 2, rafagas: [5] },
        { id: 'C', llegada: 3, rafagas: [2, 3, 1] },
        { id: 'D', llegada: 5, rafagas: [1] },
      ],
    },
    oficial: 'AAAACCDBBBBBAAC',
  },
  {
    examen: '1P 1C2026 TM · Ej. 3 (feedback RR Q=3 / FIFO)',
    config: {
      algoritmo: 'feedback',
      colas: [{ algoritmo: 'rr', quantum: 3 }, { algoritmo: 'fifo' }],
      desalojoEntreColas: true,
      trasIO: 'primera',
      procesos: [
        { id: '1', llegada: 0, rafagas: [2, 1, 2] },
        { id: '2', llegada: 1, rafagas: [5] },
        { id: '3', llegada: 5, rafagas: [1, 1, 1] },
      ],
    },
    oficial: '11222113232',
  },
  {
    examen: '1P 2C2025 TM · Ej. 1 (prioridades sin desalojo, Gantt dado)',
    config: {
      algoritmo: 'prioridades',
      procesos: [
        { id: '1', llegada: 0, rafagas: [6, 2, 4], prioridad: 3 },
        { id: '2', llegada: 1, rafagas: [6, 3, 1], prioridad: 2 },
        { id: '3', llegada: 3, rafagas: [3, 1, 1], prioridad: 1 },
      ],
    },
    oficial: '111111333222222311112',
  },
  {
    examen: '1R 2C2025 · Ej. 2 (VRR Q=3, Gantt dado)',
    config: {
      algoritmo: 'vrr',
      quantum: 3,
      procesos: [
        { id: '1', llegada: 0, rafagas: [1, 6, 4] },
        { id: '2', llegada: 0, rafagas: [2, 1, 4] },
        { id: '3', llegada: 0, rafagas: [3, 1, 2] },
        { id: '4', llegada: 0, rafagas: [1, 1, 5] },
      ],
    },
    oficial: '1223334112441133222444',
  },
  {
    examen: '1R 1C2026 TT · Ej. 1 (FIFO, E/S única, Gantt dado)',
    config: {
      algoritmo: 'fifo',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [2, 2] },
        { id: 'B', llegada: 0, rafagas: [1, 2] },
        { id: 'C', llegada: 0, rafagas: [2, 1] },
        { id: 'D', llegada: 0, rafagas: [2] },
      ],
    },
    oficial: 'AABCCDD',
  },
]

describe('simulador vs. resoluciones oficiales de la cátedra', () => {
  it.each(casos)('$examen', ({ config, oficial }) => {
    expect(gantt(config)).toBe(oficial)
  })
})

describe('fórmula del estimador (varía entre exámenes)', () => {
  const base = (alfaSobre?: 'estimacion' | 'real'): ConfigPlanificacion => ({
    algoritmo: 'sjf',
    alfa: 0.8,
    ...(alfaSobre ? { alfaSobre } : {}),
    procesos: [{ id: 'A', llegada: 0, estimacionAnterior: 10, rafagaAnterior: 2, rafagas: [1] }],
  })
  const estimacion = (c: ConfigPlanificacion) => simularPlanificacion(c).ticks[0].eventos.join(' ')

  it('por defecto α pondera la estimación anterior (fórmula de la guía)', () => {
    expect(estimacion(base())).toMatch(/= 8,4/) // 0,8·10 + 0,2·2
  })

  it("con alfaSobre: 'real', α pondera la ráfaga real (1R 1C2025 TM, 1R 1C2026 TM)", () => {
    expect(estimacion(base('real'))).toMatch(/= 3,6/) // 0,2·10 + 0,8·2
  })
})
