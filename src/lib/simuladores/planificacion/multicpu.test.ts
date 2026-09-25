/** Los ejercicios del contenido con 2 CPUs: el desafío acepta todas las elecciones válidas de CPU. */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { simularPlanificacion } from './simular'
import { grillaEsperada, variantesPlanificacion } from './verificar'
import type { ConfigPlanificacion } from './tipos'

const DIR = 'src/content/ejercicios'
const casos = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.md'))
  .flatMap((f) => {
    const fm = parse(
      readFileSync(join(DIR, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1],
    )
    return (
      (fm.simulaciones ?? []) as (ConfigPlanificacion & { kind: string; etiqueta?: string })[]
    )
      .filter((s) => s.kind === 'planificacion' && (s.procesadores ?? 1) > 1)
      .map((s) => ({ id: `${f.replace(/\\/g, '/')} ${s.etiqueta ?? ''}`, config: s }))
  })

describe('ejercicios con 2 CPUs', () => {
  it('hay ejercicios con 2 CPUs cargados', () => {
    expect(casos.length).toBeGreaterThanOrEqual(3)
  })

  it.each(casos)(
    '$id: la primera variante es la resolución y todas terminan bien',
    ({ config }) => {
      const oficial = simularPlanificacion(config)
      const variantes = variantesPlanificacion(config)
      expect(variantes.length).toBeGreaterThanOrEqual(1)
      expect(grillaEsperada(variantes[0], variantes[0].hilos)).toEqual(
        grillaEsperada(oficial, oficial.hilos),
      )
      for (const v of variantes) {
        // mismas filas y todos los hilos terminan (ninguna elección rompe la simulación)
        expect(v.hilos).toEqual(oficial.hilos)
        expect(v.metricas.map((m) => m.id).sort()).toEqual(oficial.metricas.map((m) => m.id).sort())
      }
    },
  )
})
