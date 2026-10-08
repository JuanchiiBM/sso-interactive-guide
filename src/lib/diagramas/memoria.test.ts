import { describe, expect, it } from 'vitest'
import {
  buddy,
  clockMejorado,
  conjuntoTrabajo,
  fallos,
  fragmentacionExterna,
  particionamientoDinamico,
  reemplazo,
  traducirPaginacion,
  ubicar,
  type Instante,
} from './memoria'

const REFS = [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2]
/** Fila de cada marco a lo largo del tiempo, como en las tablas de la cátedra ('–' = vacío). */
const filas = (inst: Instante[], n = 3) =>
  Array.from({ length: n }, (_, m) => inst.map((i) => i.marcos[m] ?? '–').join(' '))

describe('reemplazo con la secuencia de la clase (3 marcos)', () => {
  it('Óptimo: 6 PF', () => {
    const r = reemplazo(REFS, 3, 'optimo')
    expect(fallos(r)).toBe(6)
    expect(filas(r)).toEqual([
      '2 2 2 2 2 2 4 4 4 2 2 2',
      '– 3 3 3 3 3 3 3 3 3 3 3',
      '– – – 1 5 5 5 5 5 5 5 5',
    ])
  })

  it('FIFO: 9 PF, y el puntero no se mueve en los aciertos', () => {
    const r = reemplazo(REFS, 3, 'fifo')
    expect(fallos(r)).toBe(9)
    expect(filas(r)).toEqual([
      '2 2 2 2 5 5 5 5 3 3 3 3',
      '– 3 3 3 3 2 2 2 2 2 5 5',
      '– – – 1 1 1 4 4 4 4 4 2',
    ])
    expect(r[2].puntero).toBe(r[1].puntero)
  })

  it('LRU: 7 PF', () => {
    const r = reemplazo(REFS, 3, 'lru')
    expect(fallos(r)).toBe(7)
    expect(filas(r)).toEqual([
      '2 2 2 2 2 2 2 2 3 3 3 3',
      '– 3 3 3 5 5 5 5 5 5 5 5',
      '– – – 1 1 1 4 4 4 2 2 2',
    ])
  })

  it('Clock: 8 PF, con los bits de uso y el puntero de la diapositiva', () => {
    const r = reemplazo(REFS, 3, 'clock')
    expect(fallos(r)).toBe(8)
    expect(filas(r)).toEqual([
      '2 2 2 2 5 5 5 5 3 3 3 3',
      '– 3 3 3 3 2 2 2 2 2 2 2',
      '– – – 1 1 1 4 4 4 4 5 5',
    ])
    expect(r.map((i) => i.puntero)).toEqual([1, 2, 2, 0, 1, 2, 0, 0, 1, 1, 0, 0])
    // t5: da la vuelta entera bajando los bits y reemplaza el marco 0
    expect(r[4].uso).toEqual([true, false, false])
  })
})

describe('anomalía de Belady (FIFO)', () => {
  const refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
  it('con 4 marcos hay más fallos que con 3', () => {
    expect(fallos(reemplazo(refs, 3, 'fifo'))).toBe(9)
    expect(fallos(reemplazo(refs, 4, 'fifo'))).toBe(10)
  })
  it('LRU no la sufre con la misma secuencia', () => {
    expect(fallos(reemplazo(refs, 3, 'lru'))).toBe(10)
    expect(fallos(reemplazo(refs, 4, 'lru'))).toBe(8)
  })
})

describe('clock mejorado (ejemplo de la clase: se lee la página 7)', () => {
  const estado = [
    { pagina: 2, u: true, m: true },
    { pagina: 3, u: true, m: false },
    { pagina: 6, u: false, m: true },
    { pagina: 8, u: true, m: true },
  ]
  it('la pasada 1 no encuentra (0,0); la 2 baja U en los marcos 0 y 1 y elige el 2', () => {
    const { victima, visitas, marcos } = clockMejorado(estado, 0)
    expect(victima).toBe(2)
    expect(visitas.filter((v) => v.pasada === 1).every((v) => !v.elegido)).toBe(true)
    expect(visitas.filter((v) => v.pasada === 2).map((v) => [v.marco, v.bajaU])).toEqual([
      [0, true],
      [1, true],
      [2, false],
    ])
    expect(marcos.map((m) => m.u)).toEqual([false, false, false, true])
  })
  it('si no hay (0,0) ni (0,1), la segunda vuelta encuentra uno', () => {
    const todos = [true, true].map((m, i) => ({ pagina: i, u: true, m }))
    expect(clockMejorado(todos, 0).victima).toBe(0)
  })
})

describe('buddy system (1024 MB, ejemplo de la clase)', () => {
  const estados = buddy(1024, [
    { carga: 'P1', tam: 200 },
    { carga: 'P2', tam: 100 },
    { carga: 'P3', tam: 400 },
    { carga: 'P4', tam: 64 },
    { descarga: 'P2' },
    { descarga: 'P1' },
    { descarga: 'P4' },
  ])
  const ver = (i: number) => estados[i].map((b) => `${b.proceso ?? '·'}${b.tam}`).join(' ')
  it('redondea a 256, 128, 512 y 64', () => {
    expect(ver(3)).toBe('P1256 P2128 P464 ·64 P3512')
  })
  it('descargar P2 y P1 no une nada; P4 consolida en cascada hasta 512', () => {
    expect(ver(4)).toBe('P1256 ·128 P464 ·64 P3512')
    expect(ver(5)).toBe('·256 ·128 P464 ·64 P3512')
    expect(ver(6)).toBe('·512 P3512')
  })
})

describe('ubicación en particionamiento dinámico', () => {
  const huecos = [
    { inicio: 0, tam: 8 },
    { inicio: 14, tam: 12 },
    { inicio: 30, tam: 6 },
    { inicio: 40, tam: 10 },
  ]
  it('cada algoritmo elige un hueco distinto para 6 MB', () => {
    expect(ubicar(huecos, 6, 'primer')).toBe(0)
    expect(ubicar(huecos, 6, 'mejor')).toBe(2)
    expect(ubicar(huecos, 6, 'peor')).toBe(1)
    expect(ubicar(huecos, 6, 'siguiente', 36)).toBe(3)
  })
  it('fragmentación externa: 10 MB libres pero ningún hueco de 8', () => {
    const libres = [
      { inicio: 8, tam: 2 },
      { inicio: 16, tam: 6 },
      { inicio: 38, tam: 2 },
    ]
    expect(libres.reduce((s, h) => s + h.tam, 0)).toBe(10)
    expect(ubicar(libres, 8, 'primer')).toBe(-1)
  })
})

describe('traducción y working set', () => {
  it('paginación: 0x2A50 con páginas de 4096 B y la página 2 en el marco 9 → 39504', () => {
    const tabla = [6, 11, 9, 1, 14, 4, 3, 7]
    expect(traducirPaginacion(0x2a50, 12, tabla)).toEqual({
      pagina: 2,
      offset: 0xa50,
      marco: 9,
      df: 39504,
    })
    expect(0x2a50).toBe(10832)
  })
  it('W(t, Δ) son las páginas distintas de las últimas Δ referencias', () => {
    expect(conjuntoTrabajo(REFS, 5, 4)).toEqual([1, 2, 5])
    expect(conjuntoTrabajo(REFS, 0, 4)).toEqual([2])
  })
})

describe('particionamiento dinámico (RAM de 48 MB, SO de 8: la secuencia de la clase)', () => {
  const OPS = [
    { carga: 'P1', tam: 10 },
    { carga: 'P2', tam: 12 },
    { carga: 'P3', tam: 6 },
    { descarga: 'P2' },
    { carga: 'P4', tam: 6 },
    { descarga: 'P1' },
    { carga: 'P5', tam: 8 },
    { carga: 'P1', tam: 10 },
  ]
  const estados = particionamientoDinamico(40, OPS)
  const ver = (i: number) => estados[i].map((p) => `${p.proceso ?? '·'}${p.tam}`).join(' ')
  it('con primer ajuste termina como en la diapositiva', () => {
    expect(ver(7)).toBe('P58 ·2 P46 ·6 P36 P110 ·2')
  })
  it('P6 de 8 MB no entra: fragmentación externa; compactando queda un hueco de 10', () => {
    expect(fragmentacionExterna(estados[7], 8)).toBe(true)
    const [compacto] = particionamientoDinamico(40, [...OPS, { compactar: true }]).slice(-1)
    expect(compacto.map((p) => `${p.proceso ?? '·'}${p.inicio}+${p.tam}`).join(' ')).toBe(
      'P50+8 P48+6 P314+6 P120+10 ·30+10',
    )
  })
})
