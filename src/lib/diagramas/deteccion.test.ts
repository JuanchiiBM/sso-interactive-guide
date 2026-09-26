import { describe, expect, it } from 'vitest'
import { disponibles } from './banquero'
import { detectar } from './deteccion'
import { EJEMPLO_DETECCION as E } from './recorridos/deadlock'

describe('detección con los datos del recorrido', () => {
  const d = disponibles(E.total, E.asig)
  const r = detectar(E.asig, E.pet, d)

  it('D = T − suma de A', () => {
    expect(d).toEqual([0, 0, 1])
  })

  it('descarta a P4, que no tiene nada asignado', () => {
    expect(r.descartados).toEqual([3])
  })

  it('marca a P3 y después nadie más puede avanzar', () => {
    expect(r.marcados).toEqual([2])
    expect(r.vueltas).toHaveLength(2)
    expect(r.vueltas[0].revisados).toEqual([
      { proceso: 0, cumple: false },
      { proceso: 1, cumple: false },
      { proceso: 2, cumple: true },
    ])
    expect(r.vueltas[0].despues).toEqual([0, 0, 2])
    expect(r.vueltas[1].elegido).toBeNull()
  })

  it('P1 y P2 quedan sin marcar: están en deadlock', () => {
    expect(r.deadlock).toEqual([0, 1])
  })
})

describe('detección sin deadlock', () => {
  it('si cada uno libera lo que el siguiente pide, se marcan todos', () => {
    const r = detectar(
      [
        [1, 0],
        [0, 1],
      ],
      [
        [0, 1],
        [0, 0],
      ],
      [0, 0],
    )
    expect(r.marcados).toEqual([1, 0])
    expect(r.deadlock).toEqual([])
  })
})
