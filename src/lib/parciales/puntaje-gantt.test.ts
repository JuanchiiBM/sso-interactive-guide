import { describe, expect, it } from 'vitest'
import type { GrillaGantt, Marca } from '@lib/simuladores/planificacion/verificar'
import { porcentajeGantt, puntajeGantt } from './puntaje-gantt'

/** `"11E.."` → grilla de marcas: 1 = CPU, 2 = CPU 2, E = E/S, otro = vacío. */
const g = (filas: Record<string, string>): GrillaGantt =>
  Object.fromEntries(
    Object.entries(filas).map(([p, s]) => [
      p,
      [...s].map((c): Marca => (c === '1' ? 'cpu' : c === '2' ? 'cpu2' : c === 'E' ? 'io' : null)),
    ]),
  )

const esperada = g({ A: '11111EE111', B: '.....11111' })

describe('porcentajeGantt', () => {
  it('perfecto da 1 y en blanco da 0 (las celdas vacías de los dos no cuentan)', () => {
    expect(porcentajeGantt(esperada, [esperada])).toBe(1)
    expect(porcentajeGantt(g({ A: '', B: '' }), [esperada])).toBe(0)
  })

  it('cuenta sobre las celdas no vacías de la esperada o de la respuesta', () => {
    // 15 celdas relevantes en la esperada; 1 celda mal (A en t=9) → 14/15
    const r = g({ A: '11111EE11.', B: '.....11111' })
    expect(porcentajeGantt(r, [esperada])).toBeCloseTo(14 / 15)
  })

  it('marcar de más también resta', () => {
    const r = g({ A: '11111EE111', B: '1....11111' })
    expect(porcentajeGantt(r, [esperada])).toBeCloseTo(15 / 16)
  })

  it('toma la mejor variante válida', () => {
    const otra = g({ A: '22222EE222', B: '.....22222' })
    expect(porcentajeGantt(otra, [esperada, otra])).toBe(1)
  })
})

describe('puntajeGantt (umbral del 80 %)', () => {
  it('por debajo del 80 % no suma', () => {
    // 11/15 = 73 %
    const r = g({ A: '11111.....', B: '.....11111' })
    expect(puntajeGantt(r, [esperada])).toBe(0)
  })

  it('desde el 80 % sube lineal hasta 1', () => {
    expect(puntajeGantt(esperada, [esperada])).toBe(1)
    // 14/15 = 93,3 % → (0,933 − 0,8) / 0,2 = 0,667
    const r = g({ A: '11111EE11.', B: '.....11111' })
    expect(puntajeGantt(r, [esperada])).toBeCloseTo((14 / 15 - 0.8) / 0.2)
  })

  it('justo en el 80 % da 0', () => {
    // 12/15 = 80 %
    const r = g({ A: '11111EE...', B: '.....11111' })
    expect(porcentajeGantt(r, [esperada])).toBeCloseTo(0.8)
    expect(puntajeGantt(r, [esperada])).toBeCloseTo(0)
  })
})
