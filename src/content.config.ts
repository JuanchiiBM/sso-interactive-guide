import { defineCollection, reference } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { desafioSemaforosSchema } from './lib/semaforos/schema'

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
    algoritmo: z.enum([
      'fifo',
      'sjf',
      'srt',
      'rr',
      'prioridades',
      'prioridades-desalojo',
      'hrrn',
      'vrr',
      'multinivel',
      'feedback',
    ]),
    quantum: z.number().positive().optional(),
    /** Default true: un único dispositivo de E/S con cola FIFO (convención de la cátedra). */
    ioUnica: z.boolean().optional(),
    /** Máximo de procesos admitidos (listos + ejecutando + bloqueados); el resto espera en New. */
    multiprogramacion: z.number().int().positive().optional(),
    /** SJF/SRT con estimación: T_i = α·T_{i-1} + (1−α)·R_{i-1}. */
    alfa: z.number().min(0).max(1).optional(),
    /** Qué pondera α: 'estimacion' (fórmula de la guía, default) o 'real' (varios parciales). */
    alfaSobre: z.enum(['estimacion', 'real']).optional(),
    /** Multinivel / feedback: colas de mayor a menor prioridad. */
    colas: z
      .array(
        z.object({
          algoritmo: z.enum([
            'fifo',
            'sjf',
            'srt',
            'rr',
            'prioridades',
            'prioridades-desalojo',
            'hrrn',
          ]),
          quantum: z.number().positive().optional(),
        }),
      )
      .optional(),
    desalojoEntreColas: z.boolean().optional(),
    /** Feedback: al volver de E/S va a la primera cola o a la misma (default). */
    trasIO: z.enum(['primera', 'misma']).optional(),
    procesadores: z.number().int().min(1).max(2).optional(),
    afinidad: z.boolean().optional(),
    procesos: z
      .array(
        procesoSchema.extend({
          /** Dispositivo de cada ráfaga de E/S, en orden. */
          dispositivos: z.array(z.string()).optional(),
          /** Multinivel: cola fija (1 = mayor prioridad). */
          cola: z.number().int().positive().optional(),
          estimacionInicial: z.number().nonnegative().optional(),
          estimacionAnterior: z.number().nonnegative().optional(),
          rafagaAnterior: z.number().nonnegative().optional(),
        }),
      )
      .min(1),
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
    /** 'parcial' = ejercicio tomado de un examen (más exigente que los de guía). */
    dificultad: z.enum(['facil', 'media', 'dificil', 'parcial']).default('media'),
    tags: z.array(z.string()).default([]),
    /** Resoluciones paso a paso generadas por simulador (una por inciso). */
    simulaciones: z.array(simulacionSchema).default([]),
    /** Desafíos de código con semáforos (uno por inciso). */
    semaforos: z.array(desafioSemaforosSchema).default([]),
    /** Multiple choice por inciso; la justificación (markdown) se ve recién al acertar. */
    preguntas: z
      .array(
        z
          .object({
            enunciado: z.string(),
            opciones: z
              .array(z.object({ texto: z.string(), explicacion: z.string().optional() }))
              .min(2),
            correcta: z.number().int().nonnegative(),
            justificacion: z.string(),
          })
          .refine((p) => p.correcta < p.opciones.length, 'correcta fuera de rango'),
      )
      .default([]),
  }),
})

export const collections = { temas, ejercicios }
