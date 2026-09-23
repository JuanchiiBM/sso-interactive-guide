import { describe, expect, it } from 'vitest'
import { verificarLineaCPU } from './verificar'

describe('verificarLineaCPU', () => {
  it('acepta la respuesta exacta, incluida la CPU ociosa', () => {
    const v = verificarLineaCPU(['A', null, 'B'], ['A', null, 'B'])
    expect(v).toEqual({ ok: true, correctos: 3, total: 3, primerError: null })
  })

  it('informa el primer instante erróneo', () => {
    const v = verificarLineaCPU(['A', 'A', 'B', 'B'], ['A', 'B', 'B', 'A'])
    expect(v.ok).toBe(false)
    expect(v.correctos).toBe(2)
    expect(v.primerError).toBe(1)
  })

  it('una respuesta incompleta cuenta los vacíos como ociosos', () => {
    expect(verificarLineaCPU(['A', 'B'], ['A']).primerError).toBe(1)
  })
})
