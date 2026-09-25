/** Rendir cada simulacro con las resoluciones de referencia tiene que dar 10: todo el camino, del catálogo a la nota. */
import { readdirSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { pasosCodigo } from '@lib/simuladores/codigo/pasos'
import type { ConfigCodigo } from '@lib/simuladores/codigo/tipos'
import { pasosPlanificacion } from '@lib/simuladores/planificacion/pasos'
import type { ConfigPlanificacion } from '@lib/simuladores/planificacion/tipos'
import { grillaEsperada, variantesPlanificacion } from '@lib/simuladores/planificacion/verificar'
import type { EjercicioSemaforos } from '@lib/semaforos/tipos'
import { armarParciales } from './catalogo'
import { notaDeItems, type PuntajeItem } from './nota'
import { puntajeGantt } from './puntaje-gantt'
import { puntajeSemaforos } from './puntaje-semaforos'

type Pregunta = { opciones: unknown[]; correcta: number }
type Simulacion = { kind: 'planificacion' | 'codigo' }
interface Frontmatter {
  tema: string
  fuente: { guia: string; numero: string | number }
  dificultad: string
  preguntas: (Pregunta & { enunciado: string })[]
  semaforos: (EjercicioSemaforos & { solucion: string })[]
  simulaciones: Simulacion[]
}

const DIR = 'src/content/ejercicios'
const ejercicios = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const fm = parse(
      readFileSync(join(DIR, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1],
    )
    const data: Frontmatter = {
      ...fm,
      preguntas: fm.preguntas ?? [],
      semaforos: fm.semaforos ?? [],
      simulaciones: fm.simulaciones ?? [],
    }
    return { id: f.split(sep).join('/').replace(/\.md$/, ''), data }
  })
const porId = new Map(ejercicios.map((e) => [e.id, e]))
const TEMAS = [
  'arquitectura',
  'sistemas-operativos',
  'procesos',
  'planificacion',
  'hilos',
  'sincronizacion',
  'deadlock',
].map((t) => `parcial-1/${t}`)
const parciales = armarParciales(ejercicios, TEMAS)

/** Elegir la opción correcta: 1 si `correcta` apunta a una opción que existe. */
const mc = (p: Pregunta) => (p.correcta >= 0 && p.correcta < p.opciones.length ? 1 : 0)

/** Marcar la grilla de la resolución (y cada variante válida con 2 CPUs) contra todas las válidas. */
function gantt(sim: Simulacion): number {
  const [primero] =
    sim.kind === 'planificacion'
      ? pasosPlanificacion(sim as unknown as ConfigPlanificacion)
      : pasosCodigo(sim as unknown as ConfigCodigo)
  const { resultado, procesos } = primero.state
  const alternativas =
    sim.kind === 'planificacion'
      ? variantesPlanificacion(sim as unknown as ConfigPlanificacion).slice(1)
      : []
  const esperadas = [resultado, ...alternativas].map((r) => grillaEsperada(r, procesos))
  return Math.min(...esperadas.map((e) => puntajeGantt(e, esperadas)))
}

describe('la resolución de referencia saca 10 en cada simulacro', { timeout: 120_000 }, () => {
  it('están los 13 parciales', () => {
    expect(parciales).toHaveLength(13)
  })

  it.each(parciales.map((p) => ({ titulo: p.titulo, parcial: p })))('$titulo', ({ parcial }) => {
    const items: PuntajeItem[] = parcial.teoria.map(({ ejercicioId, indice }) => ({
      seccion: 'teoria',
      ejercicio: null,
      puntaje: mc(porId.get(ejercicioId)!.data.preguntas[indice]),
    }))
    parcial.practica.forEach((id, k) => {
      const { preguntas, semaforos, simulaciones } = porId.get(id)!.data
      const partes = [
        ...preguntas.map(mc),
        ...semaforos.map((d) => puntajeSemaforos(d.solucion, d).puntaje),
        ...simulaciones.map(gantt),
      ]
      expect(partes.length, `${id} no tiene partes interactivas`).toBeGreaterThan(0)
      for (const puntaje of partes) items.push({ seccion: 'practica', ejercicio: k, puntaje })
    })
    const puntajes = items.map((i) => i.puntaje)
    expect(
      puntajes.every((p) => p === 1),
      JSON.stringify(puntajes),
    ).toBe(true)
    expect(notaDeItems(items)).toEqual({ exacta: 10, nota: 10 })
  })
})
