/** Gantt de código contra las RESOLUCIONES OFICIALES; un carácter por instante ('-' = CPU ociosa). */
import { describe, expect, it } from 'vitest'
import { simularCodigo } from './simular'
import type { ConfigCodigo } from './tipos'

const gantt = (c: ConfigCodigo, car: Record<string, string>) =>
  simularCodigo(c)
    .ticks.map((t) => (t.cpu ? car[t.cpu] : '-'))
    .join('')
const fines = (c: ConfigCodigo) =>
  Object.fromEntries(simularCodigo(c).metricas.map((m) => [m.id, m.finalizacion]))
const bloqueados = (c: ConfigCodigo, t: number) => simularCodigo(c).ticks[t].io

const casos: {
  examen: string
  config: ConfigCodigo
  car: Record<string, string>
  oficial: string
  fin?: Record<string, number>
}[] = [
  {
    examen: '1P 1C2024 TM · Ej. 3 (RR Q=3, mutex cruzados, líneas de 2 ut)',
    config: {
      algoritmo: 'rr',
      quantum: 3,
      duracion: 2,
      semaforos: { mutexA: 1, mutexB: 1 },
      procesos: [
        {
          id: 'P1',
          llegada: 0,
          codigo:
            'Wait(mutexA)\ncontadorA++\nWait(mutexB)\ncontadorB++\nSignal(mutexA)\nSignal(mutexB)',
        },
        {
          id: 'P2',
          llegada: 0,
          codigo:
            'Wait(mutexB)\ncontadorB++\nWait(mutexA)\ncontadorA++\nSignal(mutexB)\nSignal(mutexA)',
        },
      ],
    },
    car: { P1: '1', P2: '2' },
    oficial: '111222111222',
  },
  {
    examen: '1P 1C2024 TT · Ej. 3 (CASA, RR Q=2, empieza S y después C)',
    config: {
      algoritmo: 'rr',
      quantum: 2,
      semaforos: { CS: 1, C: 1, A: 0, S: 0 },
      procesos: [
        {
          id: 'S',
          llegada: 0,
          codigo: 'while(true){\nwait(CS)\nwait(S)\nprint("S")\nsignal(A)\nsignal(C)\n}',
        },
        {
          id: 'C',
          llegada: 0,
          codigo: 'while(true){\nwait(CS)\nwait(C)\nprint("C")\nsignal(A)\nsignal(S)\n}',
        },
        { id: 'A', llegada: 0, codigo: 'while(true){\nwait(A)\nprint("A")\nsignal(CS)\n}' },
      ],
    },
    car: { S: 'S', C: 'C', A: 'A' },
    oficial: 'SSCA',
  },
  {
    examen: '1P 1C2025 TM · Ej. 3 (prioridades con desalojo, wait/signal atómicos)',
    config: {
      algoritmo: 'prioridades-desalojo',
      duracion: 2,
      atomicas: true,
      semaforos: { A: 1, B: 1, C: 1 },
      procesos: [
        {
          id: 'P1',
          llegada: 0,
          prioridad: 10,
          codigo: 'WAIT(A)\nWAIT(B)\nWAIT(C)\na = b + c\nSIGNAL(A)\nSIGNAL(B)\nSIGNAL(C)',
        },
        {
          id: 'P2',
          llegada: 5,
          prioridad: 5,
          codigo: 'WAIT(C)\nWAIT(B)\nc = c + b\nSIGNAL(C)\nSIGNAL(B)',
        },
        {
          id: 'P3',
          llegada: 3,
          prioridad: 1,
          codigo: 'WAIT(B)\nWAIT(A)\na++\nb++\nSIGNAL(B)\nSIGNAL(A)',
        },
      ],
    },
    car: { P1: '1', P2: '2', P3: '3' },
    oficial: '111133222211',
  },
  {
    examen: '1P 2C2025 TT · Ej. 4 (RR Q=3 + detector de deadlock, hasta t=25)',
    config: {
      algoritmo: 'rr',
      quantum: 3,
      recursos: { recurso_A: 1, recurso_B: 1 },
      detector: { sentencia: 'deadlock_detect()' },
      hasta: 25,
      procesos: [
        { id: 'Det', llegada: 0, codigo: 'while(true){\ndeadlock_detect() // 2\nsleep(5)\n}' },
        {
          id: 'KLTA',
          llegada: 1,
          codigo:
            'get(recurso_A) // 2\na++\nget(recurso_B) // 2\nb=a+b\nd=b*2\nrelease(recurso_B)\nrelease(recurso_A)\nprint(d) // 2',
        },
        {
          id: 'KLTB',
          llegada: 2,
          codigo:
            'get(recurso_B) // 2\nb++\nget(recurso_A) // 2\nb=a+b\nrelease(recurso_A)\nrelease(recurso_B)',
        },
      ],
    },
    car: { Det: 'D', KLTA: 'A', KLTB: 'B' },
    oficial: 'DDAAABBBAADDBB---DDBBB--D',
    fin: { KLTA: 19, KLTB: 22 },
  },
  {
    examen: '1P 2C2025 TT · Ej. 5 (RR q=2, wait/signal de 3 ut con interrupciones deshabilitadas)',
    config: {
      algoritmo: 'rr',
      quantum: 2,
      atomicas: true,
      semaforos: { S: 1 },
      procesos: [
        { id: 'KLTA', llegada: 0, codigo: 'wait(S) // 3\nCONT++ // 2\nsignal(S) // 3' },
        { id: 'KLTB', llegada: 1, codigo: 'wait(S) // 3\nCONT++ // 2\nsignal(S) // 3' },
        { id: 'KLTC', llegada: 2, codigo: 'CONT++ // 2' },
      ],
    },
    car: { KLTA: 'A', KLTB: 'B', KLTC: 'C' },
    oficial: 'AAABBBCCAAAAABBBBB',
    fin: { KLTC: 8, KLTA: 13, KLTB: 18 },
  },
  {
    examen: '1P 1C2026 TT · Ej. 5 (prioridades con desalojo → inversión de prioridades)',
    config: {
      algoritmo: 'prioridades-desalojo',
      semaforos: { S: 1 },
      hastaQueTerminen: ['A', 'C'],
      procesos: [
        {
          id: 'A',
          llegada: 4,
          prioridad: 0,
          codigo: 'tarea1() // 2\nwait(S)\ntarea2()\nsignal(S)',
        },
        {
          id: 'B',
          llegada: 8,
          prioridad: 1,
          codigo: 'while(true){\nmonitoreo() // 2\nsleep(2)\n}',
        },
        {
          id: 'C',
          llegada: 0,
          prioridad: 2,
          codigo: 'tarea3() // 2\nwait(S)\ntarea4() // 6\nsignal(S)',
        },
      ],
    },
    car: { A: 'A', B: 'B', C: 'C' },
    oficial: 'CCCCAAACBBCCBBCCBBCAA',
    fin: { C: 19, A: 21 },
  },
  {
    examen: '1R 1C2026 TM · Ej. 5 (RR Q=2, KLTs, wait/signal de 2 ut no interrumpibles)',
    config: {
      algoritmo: 'rr',
      quantum: 2,
      duracion: 2,
      atomicas: true,
      semaforos: { a: 1, b: 1 },
      procesos: [
        {
          id: 'KLT1',
          llegada: 0,
          codigo:
            'Wait(a);\nsinopsisByLLM(ClaudioSanata); // 3\nWait(b);\nSignal(a);\nsinopsisByLLM(Puntero) // 3\nsinopsisByLLM(GePeTo) // 3\nSignal(b);',
        },
        {
          id: 'KLT2',
          llegada: 0,
          codigo: 'Wait(a);\nWait(b);\nsinopsisByLLM(ClaudioPus) // 3\nSignal(b);',
        },
        { id: 'KLT3', llegada: 0, codigo: 'Wait(a);\nsinopsisByLLM(Gemita) // 3\nSignal(a);' },
      ],
    },
    car: { KLT1: '1', KLT2: '2', KLT3: '3' },
    oficial: '1122331111111221111111122222',
    fin: { KLT1: 23, KLT2: 28 },
  },
]

describe('Gantt de código vs. resoluciones oficiales de la cátedra', () => {
  it.each(casos)('$examen', ({ config, car, oficial, fin }) => {
    expect(gantt(config, car)).toBe(oficial)
    if (fin) expect(fines(config)).toMatchObject(fin)
  })

  it('1P 2C2025 TT · Ej. 5 b: lista de bloqueados en t=4 y t=8', () => {
    const c = casos[4].config
    expect(bloqueados(c, 4)).toEqual([])
    expect(bloqueados(c, 8)).toEqual(['KLTB'])
  })

  it('1R 1C2026 TM · Ej. 5 b: KLT3 queda bloqueado para siempre (no es deadlock)', () => {
    const r = simularCodigo(casos[6].config)
    expect(r.ticks.at(-1)!.estados.KLT3).toBe('bloqueado')
    expect(r.ticks.at(-1)!.eventos.join(' ')).toMatch(
      /KLT3 \(en a\) quedan? bloqueados? para siempre/,
    )
  })
})
