import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from './simular'
import { pasosPlanificacion } from './pasos'
import type { ConfigPlanificacion } from './tipos'

type Resultado = ReturnType<typeof simularPlanificacion>
const gantt = (r: Resultado) => r.ticks.map((t) => t.cpu ?? '-').join('')
const cpu = (r: Resultado, k: number) => r.ticks.map((t) => t.cpus[k] ?? '-').join('')
const descripciones = (c: ConfigPlanificacion) =>
  pasosPlanificacion(c)
    .map((p) => p.descripcion)
    .join('\n')

// Casos resueltos a mano; el razonamiento está en el brain (Simulador de Planificación)
describe('Virtual Round Robin', () => {
  it('el que vuelve de E/S sin agotar el quantum pasa por la auxiliar con el quantum restante', () => {
    const procesos = [
      { id: 'A', llegada: 0, rafagas: [1, 2, 3] },
      { id: 'B', llegada: 0, rafagas: [5] },
    ]
    expect(gantt(simularPlanificacion({ algoritmo: 'rr', quantum: 3, procesos }))).toBe('ABBBAAABB')
    expect(gantt(simularPlanificacion({ algoritmo: 'vrr', quantum: 3, procesos }))).toBe(
      'ABBBAABBA',
    )
  })

  it('Stallings: el quantum restante descuenta todo lo usado desde que salió de la principal', () => {
    const r = simularPlanificacion({
      algoritmo: 'vrr',
      quantum: 3,
      ioUnica: false,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [1, 1, 1, 1, 2] },
        { id: 'B', llegada: 0, rafagas: [6] },
        { id: 'C', llegada: 8, rafagas: [3] },
      ],
    })
    // en t=8 A sale de la auxiliar con 3 − 2 = 1 de quantum y vuelve a la principal detrás de C
    expect(gantt(r)).toBe('ABBBABBBACCCA')
  })
})

describe('Varios dispositivos de E/S', () => {
  const procesos = [
    { id: 'A', llegada: 0, rafagas: [1, 2, 1], dispositivos: ['red'] },
    { id: 'B', llegada: 0, rafagas: [1, 2, 1], dispositivos: ['pantalla'] },
  ]

  it('cada dispositivo es una cola FIFO independiente', () => {
    const r = simularPlanificacion({ algoritmo: 'fifo', procesos })
    expect(gantt(r)).toBe('AB-AB')
    expect([...r.ticks[2].io].sort()).toEqual(['A', 'B'])
    expect(r.ticks[2].dispositivos?.map((d) => [d.nombre, d.usando])).toEqual([
      ['red', 'A'],
      ['pantalla', 'B'],
    ])
  })

  it('sin dispositivos nombrados se comparte el único dispositivo', () => {
    const sinNombre = procesos.map((p) => ({ id: p.id, llegada: p.llegada, rafagas: p.rafagas }))
    expect(gantt(simularPlanificacion({ algoritmo: 'fifo', procesos: sinNombre }))).toBe('AB-A-B')
  })
})

describe('Grado de multiprogramación', () => {
  const procesos = [
    { id: 'A', llegada: 0, rafagas: [1, 2, 1] },
    { id: 'B', llegada: 0, rafagas: [1] },
  ]

  it('el que no entra espera en New hasta que otro termina (el bloqueado ocupa lugar)', () => {
    const r = simularPlanificacion({ algoritmo: 'fifo', multiprogramacion: 1, procesos })
    expect(gantt(r)).toBe('A--AB')
    expect(r.ticks[1].estados.B).toBe('espera-admision')
    expect(r.ticks[1].nuevos).toEqual(['B'])
    expect(r.metricas[1]).toMatchObject({ retorno: 5, espera: 0 })
  })

  it('sin límite no cambia nada', () => {
    expect(gantt(simularPlanificacion({ algoritmo: 'fifo', procesos }))).toBe('AB-A')
  })
})

describe('Estimación de ráfagas (SJF/SRT)', () => {
  it('SJF elige por la estimación, no por la ráfaga real', () => {
    const r = simularPlanificacion({
      algoritmo: 'sjf',
      alfa: 0.5,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [3], estimacionInicial: 6 },
        { id: 'B', llegada: 0, rafagas: [5], estimacionInicial: 2 },
      ],
    })
    expect(gantt(r)).toBe('BBBBBAAA')
  })

  it('SRT compara estimación restante (estimación − ya ejecutado)', () => {
    const procesos = [
      { id: 'A', llegada: 0, rafagas: [4], estimacionInicial: 4 },
      { id: 'B', llegada: 1, rafagas: [2], estimacionAnterior: 2, rafagaAnterior: 4 },
    ]
    // en t=1: A estima 4 − 1 = 3, B estima 0,5·2 + 0,5·4 = 3 → empate, no desaloja
    expect(gantt(simularPlanificacion({ algoritmo: 'srt', alfa: 0.5, procesos }))).toBe('AAAABB')
    expect(gantt(simularPlanificacion({ algoritmo: 'srt', procesos }))).toBe('ABBAAA')
  })

  it('usa T_i = α·T_{i-1} + (1−α)·R_{i-1} y lo muestra en la descripción', () => {
    const texto = descripciones({
      algoritmo: 'sjf',
      alfa: 0.25,
      procesos: [
        { id: 'A', llegada: 0, rafagas: [2, 1, 2], estimacionAnterior: 4, rafagaAnterior: 8 },
      ],
    })
    expect(texto).toContain('T = 0,25·4 (estimada) + 0,75·8 (real) = 7')
    expect(texto).toContain('T = 0,25·7 (estimada) + 0,75·2 (real) = 3,25')
  })
})

describe('Colas multinivel', () => {
  it('Guía FRBA Ej. 10 (FIFO arriba, RR Q=3 abajo, con desalojo entre colas)', () => {
    const r = simularPlanificacion({
      algoritmo: 'multinivel',
      colas: [{ algoritmo: 'fifo' }, { algoritmo: 'rr', quantum: 3 }],
      procesos: [
        { id: 'A', llegada: 1, rafagas: [4, 1, 5], prioridad: 0, cola: 1 },
        { id: 'B', llegada: 1, rafagas: [5, 5, 5], prioridad: 2, cola: 2 },
        { id: 'C', llegada: 0, rafagas: [2, 2, 3], prioridad: 1, cola: 2 },
      ],
    })
    expect(gantt(r)).toBe('CAAAABAAAAACBBBCCCB-----BBBBB')
  })

  it('sin desalojo entre colas, el de la cola baja termina su turno', () => {
    const r = simularPlanificacion({
      algoritmo: 'multinivel',
      desalojoEntreColas: false,
      colas: [{ algoritmo: 'fifo' }, { algoritmo: 'rr', quantum: 3 }],
      procesos: [
        { id: 'A', llegada: 1, rafagas: [2], cola: 1 },
        { id: 'C', llegada: 0, rafagas: [3], cola: 2 },
      ],
    })
    expect(gantt(r)).toBe('CCCAA')
  })
})

describe('Feedback multinivel', () => {
  it('Guía FRBA Ej. 11 (RR Q=2 → FIFO, promoción tras E/S, desalojo entre colas)', () => {
    const r = simularPlanificacion({
      algoritmo: 'feedback',
      colas: [{ algoritmo: 'rr', quantum: 2 }, { algoritmo: 'fifo' }],
      trasIO: 'primera',
      procesos: [
        { id: 'A', llegada: 0, rafagas: [4, 3, 2] },
        { id: 'B', llegada: 0, rafagas: [2, 3, 1, 4, 1] },
        { id: 'C', llegada: 3, rafagas: [10, 2, 5] },
      ],
    })
    expect(gantt(r)).toBe('AABBCCABCCCCBACCCAAC--CCCCC')
  })
})

describe('Dos procesadores', () => {
  const procesos = [
    { id: 'A', llegada: 0, rafagas: [2, 1, 1] },
    { id: 'B', llegada: 0, rafagas: [3] },
    { id: 'C', llegada: 1, rafagas: [2] },
  ]

  it('sin afinidad: el proceso toma cualquier CPU libre', () => {
    const r = simularPlanificacion({ algoritmo: 'fifo', procesadores: 2, procesos })
    expect([cpu(r, 0), cpu(r, 1)]).toEqual(['AACC', 'BBBA'])
  })

  it('con afinidad: espera al CPU donde ejecutó primero aunque el otro esté libre', () => {
    const r = simularPlanificacion({ algoritmo: 'fifo', procesadores: 2, afinidad: true, procesos })
    expect([cpu(r, 0), cpu(r, 1)]).toEqual(['AACCA', 'BBB--'])
  })
})
