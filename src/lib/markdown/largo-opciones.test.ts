/** La opción correcta no puede delatarse por ser claramente la más larga. Ver docs/brain/contenido/Formato de un Ejercicio.md */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const DIR = join(process.cwd(), 'src/content/ejercicios')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const MAX_RATIO = 1.15

type Pregunta = { enunciado: string; opciones: { texto: string }[]; correcta: number }

const largo = (t: string) => t.replace(/[*`_]/g, '').length

const preguntas = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f: string) => f.endsWith('.md'))
  .flatMap((f: string) => {
    const fm = readFileSync(join(DIR, f), 'utf8').match(FRONTMATTER)
    const lista: Pregunta[] = (fm && parse(fm[1])?.preguntas) || []
    return lista.map((p, i) => ({ archivo: f, i, p }))
  })

describe('largo de las opciones de multiple choice', () => {
  it('la correcta no supera en más de 15% a la distractora más larga', () => {
    const delatoras = preguntas.flatMap(({ archivo, i, p }) => {
      const largos = p.opciones.map((o) => largo(o.texto))
      const otras = Math.max(...largos.filter((_, j) => j !== p.correcta))
      const ratio = largos[p.correcta] / otras
      return ratio > MAX_RATIO ? [`${archivo} · pregunta ${i + 1} (×${ratio.toFixed(2)})`] : []
    })
    expect(delatoras).toEqual([])
  })

  it('la correcta no es la más larga mucho más seguido que al azar', () => {
    const masLarga = preguntas.filter(({ p }) => {
      const largos = p.opciones.map((o) => largo(o.texto))
      return largos.every((l, j) => j === p.correcta || l < largos[p.correcta])
    }).length
    expect(masLarga / preguntas.length).toBeLessThan(0.35)
  })
})
