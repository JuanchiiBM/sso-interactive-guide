import { describe, expect, it } from 'vitest'
import { aristasEnCiclo, parsearGrafo, renderGrafo } from './asignacion'

const DEADLOCK = `
procesos: P1, P2, P3
recursos: R1, R2, R3
R1 -> P1
P1 -> R2
R2 -> P2
P2 -> R1
R3 -> P3
`

describe('parsearGrafo', () => {
  it('deduce el tipo de arista por la dirección', () => {
    const g = parsearGrafo('procesos: P1\nrecursos: R1=2\nR1 -> P1\nP1 -> R1')
    expect(g.recursos).toEqual([{ id: 'R1', instancias: 2 }])
    expect(g.aristas.map((a) => a.tipo)).toEqual(['asignacion', 'solicitud'])
  })

  it('rechaza aristas entre dos procesos', () => {
    expect(() => parsearGrafo('procesos: P1 P2\nP1 -> P2')).toThrow(/proceso y un recurso/)
  })
})

describe('aristasEnCiclo', () => {
  it('encuentra el ciclo P1-R2-P2-R1 y deja afuera a P3', () => {
    expect([...aristasEnCiclo(parsearGrafo(DEADLOCK))].sort()).toEqual([0, 1, 2, 3])
  })

  it('una cadena abierta no es ciclo', () => {
    const g = parsearGrafo('procesos: P1 P2\nrecursos: R1 R2\nR1 -> P1\nP1 -> R2\nR2 -> P2')
    expect(aristasEnCiclo(g).size).toBe(0)
  })
})

describe('renderGrafo', () => {
  it('genera un SVG accesible con un nodo por proceso y recurso', () => {
    const svg = renderGrafo(DEADLOCK)
    expect(svg.match(/class="grafo-proceso"/g)).toHaveLength(3)
    expect(svg.match(/class="grafo-recurso"/g)).toHaveLength(3)
    expect(svg).toContain('aria-label="Grafo de asignación: R1 asignado a P1')
  })
})
