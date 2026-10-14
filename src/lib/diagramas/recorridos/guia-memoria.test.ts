import { describe, expect, it } from 'vitest'
import { fallos, reemplazo } from '../memoria'
import { REFS_GUIA_EJ8 } from './guia-memoria'

describe('Guía de Memoria, Ej. 8 (4 marcos)', () => {
  it.each([
    ['optimo', 6],
    ['fifo', 7],
    ['lru', 8],
    ['clock', 7],
  ] as const)('%s: %i PF', (alg, pf) => {
    expect(fallos(reemplazo(REFS_GUIA_EJ8, 4, alg))).toBe(pf)
  })
})
