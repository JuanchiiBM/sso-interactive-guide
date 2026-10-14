import { describe, expect, it } from 'vitest'
import { fallos, reemplazo } from '../memoria'
import { REFS_GUIA_EJ8, REFS_GUIA_EJ9 } from './guia-memoria'

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

describe('Guía de Memoria, Ej. 9: direcciones → páginas de 8 KB', () => {
  it('172100 es la página 21, fuera del proceso de 20 páginas', () => {
    expect(REFS_GUIA_EJ9.map((r) => r.pagina)).toEqual([0, 15, 12, 17, 15, 19, null, 0])
    expect(REFS_GUIA_EJ9.map((r) => r.escritura)).toEqual([
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      false,
    ])
  })
})
