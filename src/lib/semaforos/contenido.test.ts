/** Valida los desafíos cargados en los .md: la solución pasa y el código sin sincronizar no. */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { verificarSemaforos } from './explorar'
import { plantilla } from './parser'
import type { EjercicioSemaforos } from './tipos'

const DIR = join(process.cwd(), 'src/content/ejercicios')

// frontmatter = entre dos líneas que son exactamente '---' (las tablas markdown también tienen ---)
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/

const desafios = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f: string) => f.endsWith('.md'))
  .flatMap((f: string) => {
    const fm = parse(readFileSync(join(DIR, f), 'utf8').match(FRONTMATTER)![1])
    const lista = (fm.semaforos ?? []) as (EjercicioSemaforos & {
      solucion: string
      etiqueta?: string
    })[]
    return lista.map((d, i) => ({
      id: `${f.replace(/\\/g, '/')}${d.etiqueta ? ` (${d.etiqueta})` : ` #${i}`}`,
      d,
    }))
  })

describe('desafíos de semáforos del contenido', { timeout: 30_000 }, () => {
  it('hay desafíos cargados', () => {
    expect(desafios.length).toBeGreaterThan(0)
  })

  it('las soluciones usan la sintaxis actual (void función)', () => {
    const viejas = desafios
      .filter(({ d }) => /^\s*proceso\s+.+:\s*$/m.test(d.solucion))
      .map((x) => x.id)
    expect(viejas).toEqual([])
  })

  for (const { id, d } of desafios) {
    it(`${id}: la solución de referencia pasa todos los tests`, () => {
      const r = verificarSemaforos(d.solucion, d)
      expect(r.errores).toEqual([])
      expect(r.tests.filter((t) => !t.ok).map((t) => t.nombre)).toEqual([])
    })

    it(`${id}: el código sin sincronizar no pasa`, () => {
      expect(verificarSemaforos(plantilla(d), d).ok).toBe(false)
    })
  }
})

describe('multiple choice del contenido', () => {
  const preguntas = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
    .filter((f: string) => f.endsWith('.md'))
    .flatMap((f: string) => {
      const fm = parse(readFileSync(join(DIR, f), 'utf8').match(FRONTMATTER)![1])
      return ((fm.preguntas ?? []) as { opciones: { texto: string }[]; correcta: number }[]).map(
        (p) => ({ f, p }),
      )
    })

  // por largo, la correcta tiene que caer parejo en los 4 lugares: si no, "la más larga" o
  // "la segunda más corta" se vuelven trucos para acertar sin saber
  it('el largo de la correcta no la delata (lugar por largo repartido)', () => {
    const cuatro = preguntas.filter(({ p }) => p.opciones.length === 4)
    const lugares = [0, 0, 0, 0]
    for (const { p } of cuatro) {
      const largos = p.opciones.map((o) => o.texto.length)
      lugares[[...largos].sort((a, b) => a - b).indexOf(largos[p.correcta])]++
    }
    const proporciones = lugares.map((n) => Math.round((n / cuatro.length) * 100))
    for (const pct of proporciones) {
      expect(pct, `lugar por largo de la correcta (%): ${proporciones.join(' / ')}`).toBeGreaterThanOrEqual(15)
      expect(pct, `lugar por largo de la correcta (%): ${proporciones.join(' / ')}`).toBeLessThanOrEqual(35)
    }
  })

  it('la posición de la correcta varía', () => {
    const posiciones = new Set(preguntas.map(({ p }) => p.correcta))
    expect(posiciones.size).toBeGreaterThanOrEqual(3)
  })
})
