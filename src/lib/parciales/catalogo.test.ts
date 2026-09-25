import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  armarParciales,
  examenesDeEnunciado,
  examenesDeFuente,
  type EjercicioFuente,
} from './catalogo'

const DIR = 'src/content/ejercicios'
const ejercicios: EjercicioFuente[] = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const fm = parse(
      readFileSync(join(DIR, f), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1],
    )
    return {
      id: f.replace(/\\/g, '/').replace(/\.md$/, ''),
      data: { ...fm, preguntas: fm.preguntas ?? [] },
    }
  })
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

describe('citas de examen', () => {
  it('lee el prefijo de las preguntas, con uno o dos exámenes y aclaraciones', () => {
    expect(examenesDeEnunciado('(1P 1C2026 TM) ¿Qué…?')).toEqual(['1P 1C2026 TM'])
    expect(examenesDeEnunciado('(1R 2C2025, desarrollo 3) ¿…?')).toEqual(['1R 2C2025'])
    expect(examenesDeEnunciado('(1P 2C2025 TM, 1P 1C2026 TM) ¿…?')).toEqual([
      '1P 2C2025 TM',
      '1P 1C2026 TM',
    ])
    expect(examenesDeEnunciado('¿Sin cita?')).toEqual([])
  })

  it('lee la fuente de los ejercicios de parcial', () => {
    expect(examenesDeFuente('1° Parcial 1C2026 · TM')).toEqual(['1P 1C2026 TM'])
    expect(examenesDeFuente('1° Recuperatorio 2C2025')).toEqual(['1R 2C2025'])
    expect(examenesDeFuente('1° Parcial 1C2025 · TM y 1C2026 · TM')).toEqual([
      '1P 1C2025 TM',
      '1P 1C2026 TM',
    ])
    expect(examenesDeFuente('Guía de Ejercicios – Planificación (v.2C2026)')).toEqual([])
  })
})

describe('los 13 parciales del relevamiento', () => {
  it('son 13, en orden cronológico', () => {
    expect(parciales.map((p) => p.codigo)).toEqual([
      '1P 1C2024 TM',
      '1P 1C2024 TT',
      '1P 1C2025 TM',
      '1P 1C2025 TT',
      '1R 1C2025 TM',
      '1R 1C2025 TT',
      '1P 2C2025 TM',
      '1P 2C2025 TT',
      '1R 2C2025',
      '1P 1C2026 TM',
      '1P 1C2026 TT',
      '1R 1C2026 TM',
      '1R 1C2026 TT',
    ])
  })

  it('por ahora todos son del 1er parcial', () => {
    expect(parciales.every((p) => p.numero === 1)).toBe(true)
  })

  it('cada uno tiene teoría y práctica', () => {
    for (const p of parciales) {
      expect(p.teoria.length, p.codigo).toBeGreaterThan(0)
      expect(p.practica.length, p.codigo).toBeGreaterThan(0)
    }
  })

  it('ningún ejercicio de parcial ni pregunta de simulacro queda sin examen', () => {
    const enParciales = new Set(parciales.flatMap((p) => p.practica))
    const deParcial = ejercicios.filter(
      (e) => e.data.dificultad === 'parcial' && !e.id.includes('simulacro'),
    )
    expect(deParcial.filter((e) => !enParciales.has(e.id)).map((e) => e.id)).toEqual([])
    const teoria = new Set(
      parciales.flatMap((p) => p.teoria.map((t) => `${t.ejercicioId}#${t.indice}`)),
    )
    const preguntas = ejercicios
      .filter((e) => e.id.includes('simulacro'))
      .flatMap((e) => e.data.preguntas.map((_, i) => `${e.id}#${i}`))
    expect(preguntas.filter((q) => !teoria.has(q))).toEqual([])
  })

  it('lo que cita dos exámenes aparece en los dos', () => {
    const de = (codigo: string) => parciales.find((p) => p.codigo === codigo)!
    expect(de('1P 1C2025 TM').practica).toContain('hilos/ej-11')
    expect(de('1P 1C2026 TM').practica).toContain('hilos/ej-11')
  })

  it('la práctica va por tema: planificación, hilos, sincronización, deadlock', () => {
    const orden = (id: string) => TEMAS.indexOf(`parcial-1/${id.split('/')[0]}`)
    for (const p of parciales) {
      const temas = p.practica.map(orden)
      expect(temas, p.codigo).toEqual([...temas].sort((a, b) => a - b))
    }
  })
})
