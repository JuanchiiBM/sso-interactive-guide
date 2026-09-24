/**
 * Hilos (ULT sobre KLT) contra RESOLUCIONES OFICIALES; un carácter por instante según la `leyenda`.
 * Modelo y erratas: docs/brain/simuladores/Simulador de Planificación.md (sección Hilos)
 */
import { describe, expect, it } from 'vitest'
import { simularPlanificacion } from './simular'
import type { ConfigPlanificacion } from './tipos'

/** Gantt de cada CPU, con los caracteres de la leyenda del examen. */
const gantt = (c: ConfigPlanificacion, leyenda: Record<string, string>) => {
  const car = Object.fromEntries(Object.entries(leyenda).map(([k, v]) => [v, k]))
  const r = simularPlanificacion(c)
  return Array.from({ length: r.procesadores }, (_, k) =>
    r.ticks.map((t) => (t.cpus[k] ? car[t.cpus[k]!] : '-')).join(''),
  )
}
const fines = (c: ConfigPlanificacion) =>
  Object.fromEntries(simularPlanificacion(c).metricas.map((m) => [m.id, m.finalizacion]))

interface Caso {
  examen: string
  config: ConfigPlanificacion
  leyenda: Record<string, string>
  oficial: string[]
  fin?: Record<string, number>
}

const casos: Caso[] = [
  {
    examen: '1P 1C2024 TM · Ej. 1 (VRR Q=3, FIFO; A wrapper, B jacketing)',
    config: {
      algoritmo: 'vrr',
      quantum: 3,
      procesos: [
        {
          id: 'KLTA',
          modoIO: 'wrapper',
          hilos: [
            { id: 'ULTA1', llegada: 0, rafagas: [2, 2, 3] },
            { id: 'ULTA2', llegada: 1, rafagas: [2, 1, 1] },
          ],
        },
        {
          id: 'KLTB',
          modoIO: 'jacketing',
          hilos: [
            { id: 'ULTB1', llegada: 2, rafagas: [2, 2, 2] },
            { id: 'ULTB2', llegada: 3, rafagas: [3, 1, 1] },
          ],
        },
        { id: 'KLTC', llegada: 6, rafagas: [1, 1, 3] },
      ],
    },
    leyenda: { '1': 'ULTA1', '2': 'ULTA2', '3': 'ULTB1', '4': 'ULTB2', C: 'KLTC' },
    oficial: ['1133424432C11CC3412C'],
    fin: { ULTB2: 17, ULTA1: 18, ULTA2: 19, KLTC: 20 },
  },
  {
    examen: '1P 1C2024 TT · Ej. 1 (RR Q=3, biblioteca SRT sin jacketing)',
    config: {
      algoritmo: 'rr',
      quantum: 3,
      procesos: [
        { id: 'KLT1', llegada: 0, rafagas: [3, 2, 4] },
        {
          id: 'KLT2',
          biblioteca: 'srt',
          hilos: [
            { id: 'ULTA1', llegada: 1, rafagas: [6, 1, 1] },
            { id: 'ULTA2', llegada: 4, rafagas: [2, 2, 1] },
            { id: 'ULTA3', llegada: 13, rafagas: [3, 3, 2] },
          ],
        },
        { id: 'KLT3', llegada: 15, rafagas: [1, 4, 4] },
      ],
    },
    leyenda: { K: 'KLT1', '1': 'ULTA1', '2': 'ULTA2', '3': 'ULTA3', B: 'KLT3' },
    oficial: ['KKK122KKK211K111B1333BBBB33'],
    fin: { ULTA2: 10, KLT1: 13, ULTA1: 18, KLT3: 25, ULTA3: 27 },
  },
  {
    examen: '1P 1C2025 TM · Ej. 1 (inverso: VRR Q=3; KA SJF + jacketing, KB prioridades)',
    config: {
      algoritmo: 'vrr',
      quantum: 3,
      procesos: [
        {
          id: 'KA',
          biblioteca: 'sjf',
          modoIO: 'jacketing',
          hilos: [
            { id: 'UA1', llegada: 0, rafagas: [3, 1, 2] },
            { id: 'UA2', llegada: 0, rafagas: [1, 1, 1] },
            { id: 'UA3', llegada: 0, rafagas: [4] },
          ],
        },
        {
          id: 'KB',
          biblioteca: 'prioridades',
          hilos: [
            { id: 'UB1', llegada: 0, rafagas: [1], prioridad: 2 },
            { id: 'UB2', llegada: 0, rafagas: [4, 1, 1], prioridad: 1 },
          ],
        },
        { id: 'KC', llegada: 0, rafagas: [1, 1, 2] },
      ],
    },
    leyenda: { a: 'UA1', b: 'UA2', c: 'UA3', d: 'UB1', e: 'UB2', C: 'KC' },
    oficial: ['baaeeeCabaCCeaccedcc'],
    fin: { UA2: 9, KC: 12, UA1: 14, UB2: 17, UB1: 18, UA3: 20 },
  },
  {
    examen: '1P 1C2026 TT · Ej. 2 (inverso: RR Q=3; KA SJF + jacketing, KB FIFO wrapper)',
    config: {
      algoritmo: 'rr',
      quantum: 3,
      procesos: [
        {
          id: 'KA',
          biblioteca: 'sjf',
          modoIO: 'jacketing',
          hilos: [
            { id: 'UA1', llegada: 0, rafagas: [3, 1, 2] },
            { id: 'UA2', llegada: 0, rafagas: [1, 1, 1] },
            { id: 'UA3', llegada: 0, rafagas: [4] },
          ],
        },
        {
          id: 'KB',
          // el Gantt deduce que UB2 estaba primero en la cola de la biblioteca
          hilos: [
            { id: 'UB2', llegada: 0, rafagas: [4, 1, 1] },
            { id: 'UB1', llegada: 0, rafagas: [1] },
          ],
        },
        { id: 'KC', llegada: 0, rafagas: [1, 1, 2] },
      ],
    },
    leyenda: { a: 'UA1', b: 'UA2', c: 'UA3', d: 'UB1', e: 'UB2', C: 'KC' },
    oficial: ['baaeeeCabaeCCaccdecc'],
    fin: { UA2: 9, KC: 13, UA1: 14, UB1: 17, UB2: 18, UA3: 20 },
  },
  {
    examen: '1P 2C2025 TM · Ej. 2 (VRR Q=3; P1 FIFO wrapper, P2 SRT + jacketing)',
    config: {
      algoritmo: 'vrr',
      quantum: 3,
      procesos: [
        {
          id: 'KLT1',
          hilos: [
            { id: 'ULT1.1', llegada: 0, rafagas: [4, 2, 2] },
            { id: 'ULT1.2', llegada: 1, rafagas: [3] },
          ],
        },
        {
          id: 'KLT2',
          biblioteca: 'srt',
          modoIO: 'jacketing',
          hilos: [
            { id: 'ULT2.1', llegada: 3, rafagas: [5] },
            { id: 'ULT2.2', llegada: 5, rafagas: [1, 1, 2] },
          ],
        },
      ],
    },
    leyenda: { a: 'ULT1.1', b: 'ULT1.2', c: 'ULT2.1', d: 'ULT2.2' },
    // errata: en t9 la resolución corre ULT2.1 (restan 3) teniendo lista a ULT2.2 (ráfaga 2): oficial 'aaaacdcbbcccbaadd'
    oficial: ['aaaacdcbbddcbaacc'],
    fin: { 'ULT2.2': 11, 'ULT1.2': 13, 'ULT1.1': 15, 'ULT2.1': 17 },
  },
  {
    examen: '1P 2C2025 TT · Ej. 2 (2 CPUs, SO FIFO, bibliotecas SJF sin jacketing)',
    config: {
      algoritmo: 'fifo',
      procesadores: 2,
      afinidad: true,
      procesos: [
        {
          id: 'KLTA',
          biblioteca: 'sjf',
          hilos: [
            { id: 'ULT1', llegada: 0, rafagas: [3] },
            { id: 'ULT2', llegada: 0, rafagas: [2] },
          ],
        },
        {
          id: 'KLTB',
          biblioteca: 'sjf',
          hilos: [
            { id: 'ULT3', llegada: 2, rafagas: [1, 2] },
            { id: 'ULT4', llegada: 2, rafagas: [2] },
          ],
        },
      ],
    },
    leyenda: { '1': 'ULT1', '2': 'ULT2', '3': 'ULT3', '4': 'ULT4' },
    oficial: ['22111--', '--3--44'],
    fin: { ULT2: 2, ULT1: 5, ULT3: 5, ULT4: 7 },
  },
  {
    examen: '1R 1C2026 TM · Ej. 2 (inverso: SO SJF; KA prioridades U1 > U2 > U3)',
    config: {
      algoritmo: 'sjf',
      procesos: [
        {
          id: 'KA',
          biblioteca: 'prioridades',
          hilos: [
            { id: 'U1', llegada: 0, rafagas: [2, 1, 1], prioridad: 1 },
            { id: 'U3', llegada: 0, rafagas: [3], prioridad: 3 },
            { id: 'U2', llegada: 0, rafagas: [1, 1, 1], prioridad: 2 },
          ],
        },
        { id: 'KB', llegada: 1, rafagas: [3, 1, 1] },
        { id: 'KC', llegada: 2, rafagas: [2, 2, 5] },
      ],
    },
    leyenda: { '1': 'U1', '2': 'U2', '3': 'U3', B: 'KB', C: 'KC' },
    oficial: ['11CC12BBB2333BCCCCC'],
    fin: { U1: 5, U2: 10, U3: 13, KB: 14, KC: 19 },
  },
  {
    examen: '1R 1C2026 TT · Ej. 3 (VRR Q=3; A SJF wrapper, B SJF syscall directa)',
    config: {
      algoritmo: 'vrr',
      quantum: 3,
      procesos: [
        {
          id: 'KLT A',
          biblioteca: 'sjf',
          modoIO: 'wrapper',
          hilos: [
            { id: 'A1', llegada: 0, rafagas: [2, 2, 3] },
            { id: 'A2', llegada: 0, rafagas: [3, 2, 1] },
          ],
        },
        {
          id: 'KLT B',
          biblioteca: 'sjf',
          modoIO: 'directa',
          hilos: [
            { id: 'B1', llegada: 3, rafagas: [1, 1, 3] },
            { id: 'B2', llegada: 3, rafagas: [2, 4, 1] },
          ],
        },
      ],
    },
    leyenda: { a: 'A1', b: 'A2', c: 'B1', d: 'B2' },
    oficial: ['aa-cbccbbcddbaaad'],
    fin: { B1: 10, A2: 13, A1: 16, B2: 17 },
  },
]

describe('hilos (ULT/KLT) vs. resoluciones oficiales de la cátedra', () => {
  it.each(casos)('$examen', ({ config, leyenda, oficial, fin }) => {
    expect(gantt(config, leyenda)).toEqual(oficial)
    if (fin) expect(fines(config)).toMatchObject(fin)
  })

  it.skip('1P 1C2025 TT · Ej. 3: suspende por prioridad al llegar al grado de multiprogramación (mediano plazo, no modelado)', () => {})
  it.skip('1P 1C2026 TT · Ej. 3: el SO ocupa 2 u.t. de CPU por interrupción (overhead del SO, no modelado)', () => {})
  it.skip('1R 1C2026 TM · Ej. 4: el Gantt dado es el de un estudiante, con un error a propósito', () => {})
})

/** Caso con otro modo de E/S en uno de sus KLTs. */
const conModo = (examen: string, klt: string, modoIO: 'directa' | 'wrapper' | 'jacketing') => {
  const { config } = casos.find((c) => c.examen.startsWith(examen))!
  return {
    ...config,
    procesos: config.procesos.map((p) => (p.id === klt ? { ...p, modoIO } : p)),
  }
}
const primerCambio = (a: ConfigPlanificacion, b: ConfigPlanificacion) => {
  const [ga, gb] = [a, b].map((c) => simularPlanificacion(c).ticks.map((t) => t.cpu))
  return ga.findIndex((id, t) => id !== gb[t])
}

describe('preguntas de "qué cambiaría si…" de las resoluciones oficiales', () => {
  it('1P 1C2024 TM b: con syscalls directas en B cambia desde t=4', () => {
    const base = conModo('1P 1C2024 TM', 'KLTB', 'jacketing')
    expect(primerCambio(base, conModo('1P 1C2024 TM', 'KLTB', 'directa'))).toBe(4)
  })
  it('1P 1C2024 TT c: con jacketing no cambia', () => {
    const base = conModo('1P 1C2024 TT', 'KLT2', 'wrapper')
    expect(primerCambio(base, conModo('1P 1C2024 TT', 'KLT2', 'jacketing'))).toBe(-1)
  })
  it('1P 1C2026 TM: con jacketing en KB, KB termina en t=15', () => {
    const f = fines(conModo('1P 1C2025 TM', 'KB', 'jacketing'))
    expect(Math.max(f.UB1, f.UB2)).toBe(15)
  })
  it('1R 1C2026 TM: con jacketing en KA cambia desde t=2 y KA termina en t=8', () => {
    const base = conModo('1R 1C2026 TM', 'KA', 'wrapper')
    const jack = conModo('1R 1C2026 TM', 'KA', 'jacketing')
    expect(primerCambio(base, jack)).toBe(2)
    const f = fines(jack)
    expect(Math.max(f.U1, f.U2, f.U3)).toBe(8)
  })
})

describe('modos de E/S de un ULT (guía de Hilos, Ej. 1: todo FIFO)', () => {
  const ej1 = (modoIO: 'directa' | 'wrapper' | 'jacketing'): ConfigPlanificacion => ({
    algoritmo: 'fifo',
    procesos: [
      {
        id: 'A',
        modoIO,
        hilos: [
          { id: 'A1', llegada: 0, rafagas: [1, 4, 3] },
          { id: 'A2', llegada: 0, rafagas: [1, 2, 2] },
        ],
      },
    ],
  })
  const ley = { '1': 'A1', '2': 'A2' }

  it('syscall directa: bloquea todo el KLT y al volver sigue el mismo ULT', () => {
    expect(gantt(ej1('directa'), ley)).toEqual(['1----1112--22'])
  })
  it('wrapper: bloquea todo el KLT y al volver la biblioteca replanifica', () => {
    expect(gantt(ej1('wrapper'), ley)).toEqual(['1----2--11122'])
  })
  it('jacketing: solo se bloquea el ULT; el KLT sigue con otro', () => {
    expect(gantt(ej1('jacketing'), ley)).toEqual(['12---11122'])
  })
})

describe('reglas del modelo', () => {
  it('sin ULTs, un KLT se comporta como un proceso', () => {
    const base = { algoritmo: 'rr' as const, quantum: 2 }
    const r1 = simularPlanificacion({ ...base, procesos: [{ id: 'A', llegada: 0, rafagas: [3] }] })
    const r2 = simularPlanificacion({
      ...base,
      procesos: [{ id: 'K', hilos: [{ id: 'A', llegada: 0, rafagas: [3] }] }],
    })
    expect(r2.ticks.map((t) => t.cpu)).toEqual(r1.ticks.map((t) => t.cpu))
  })

  it('el quantum es del KLT: cambiar de ULT no lo reinicia', () => {
    const r = simularPlanificacion({
      algoritmo: 'rr',
      quantum: 3,
      procesos: [
        {
          id: 'K',
          hilos: [
            { id: 'U1', llegada: 0, rafagas: [1] },
            { id: 'U2', llegada: 0, rafagas: [5] },
          ],
        },
        { id: 'Z', llegada: 0, rafagas: [1] },
      ],
    })
    // U1 usa 1 del quantum y U2 solo los 2 que quedan antes de que entre Z
    expect(r.ticks.map((t) => t.cpu)).toEqual(['U1', 'U2', 'U2', 'Z', 'U2', 'U2', 'U2'])
  })

  it('jacketing sin otro ULT listo: el KLT deja la CPU y vuelve al terminar la E/S', () => {
    const r = simularPlanificacion({
      algoritmo: 'fifo',
      procesos: [
        { id: 'K', modoIO: 'jacketing', hilos: [{ id: 'U', llegada: 0, rafagas: [1, 2, 1] }] },
        { id: 'Z', llegada: 0, rafagas: [3] },
      ],
    })
    expect(r.ticks.map((t) => t.cpu)).toEqual(['U', 'Z', 'Z', 'Z', 'U'])
  })

  it('el panel muestra el ULT elegido por cada biblioteca y el quantum que le queda al KLT', () => {
    const r = simularPlanificacion({
      algoritmo: 'rr',
      quantum: 3,
      procesos: [
        {
          id: 'K',
          hilos: [
            { id: 'U1', llegada: 0, rafagas: [2] },
            { id: 'U2', llegada: 0, rafagas: [2] },
          ],
        },
      ],
    })
    expect(r.ticks[1].bibliotecas).toEqual([{ klt: 'K', elegido: 'U1', listos: ['U2'] }])
    expect(r.ticks[1].quantum).toEqual([2])
    expect(r.kltDe).toEqual({ U1: 'K', U2: 'K' })
  })
})
