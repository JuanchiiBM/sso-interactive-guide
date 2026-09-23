import { defineCollection, reference } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const temas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/temas' }),
  schema: z.object({
    titulo: z.string(),
    parcial: z.union([z.literal(1), z.literal(2)]),
    orden: z.number(),
    resumen: z.string(),
    aliases: z.array(z.string()).default([]),
  }),
})

const procesoSchema = z.object({
  id: z.string(),
  llegada: z.number().nonnegative(),
  /** Ráfagas alternadas: CPU, E/S, CPU, E/S, ... (empieza y termina en CPU). */
  rafagas: z.array(z.number().positive()).min(1),
  prioridad: z.number().optional(),
})

export const simulacionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('planificacion'),
    /** Inciso que resuelve, ej. "a. Con desalojo". */
    etiqueta: z.string().optional(),
    algoritmo: z.enum(['fifo', 'sjf', 'srt', 'rr', 'prioridades', 'prioridades-desalojo', 'hrrn']),
    quantum: z.number().positive().optional(),
    /** Default true: un único dispositivo de E/S con cola FIFO (convención de la cátedra). */
    ioUnica: z.boolean().optional(),
    procesos: z.array(procesoSchema).min(1),
  }),
])

const ejercicios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ejercicios' }),
  schema: z.object({
    titulo: z.string(),
    tema: reference('temas'),
    fuente: z.object({
      guia: z.string(),
      numero: z.union([z.string(), z.number()]),
    }),
    tipo: z.enum(['teorico', 'practico', 'codigo', 'verdadero-falso', 'multiple-choice']),
    dificultad: z.enum(['facil', 'media', 'dificil']).default('media'),
    tags: z.array(z.string()).default([]),
    /** Resoluciones paso a paso generadas por simulador (una por inciso). */
    simulaciones: z.array(simulacionSchema).default([]),
  }),
})

export const collections = { temas, ejercicios }
