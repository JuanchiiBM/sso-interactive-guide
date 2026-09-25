import { describe, expect, it } from 'vitest'
import { formatearTiempo } from './tiempo'

describe('formatearTiempo', () => {
  it('minutos y segundos', () => {
    expect(formatearTiempo(0)).toBe('00:00')
    expect(formatearTiempo(65_999)).toBe('01:05')
    expect(formatearTiempo(59 * 60_000)).toBe('59:00')
  })
  it('desde la hora suma las horas', () => {
    expect(formatearTiempo(3600_000)).toBe('1:00:00')
    expect(formatearTiempo(2 * 3600_000 + 61_000)).toBe('2:01:01')
  })
  it('nunca negativo', () => {
    expect(formatearTiempo(-5)).toBe('00:00')
  })
})
