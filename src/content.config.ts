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

/** KLT con ULTs: el SO lo planifica; adentro, su biblioteca elige el ULT. */
const kltSchema = z.object({
  id: z.string(),
  /** Algoritmo de la biblioteca (default fifo). `srt` = "SJF con desalojo". */
  biblioteca: z
    .enum(['fifo', 'sjf', 'srt', 'rr', 'prioridades', 'prioridades-desalojo'])
    .optional(),
  /** Solo con `biblioteca: rr`. */
  quantumBiblioteca: z.number().positive().optional(),
  /** E/S de un ULT: directa | wrapper (default: sin jacketing) | jacketing. */
  modoIO: z.enum(['directa', 'wrapper', 'jacketing']).optional(),
  prioridad: z.number().optional(),
  cola: z.number().int().positive().optional(),
  /** Proceso al que pertenece (grado de multiprogramación por proceso). */
  proceso: z.string().optional(),
  /** ULTs; los que llegan juntos entran a la biblioteca en este orden. */
  hilos: z.array(procesoSchema).min(1),
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
    /** Con grado lleno, un proceso nuevo de mayor prioridad entra suspendiendo al peor en Ready. */
    suspensionPorPrioridad: z.boolean().optional(),
    /** u.t. de CPU del SO por cada interrupción de fin de E/S (fila "SO" en el Gantt). */
    overheadInterrupcion: z.number().int().nonnegative().optional(),
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
    /** Procesos (o KLTs simples) y KLTs con ULTs (`hilos`). */
    procesos: z
      .array(
        z.union([
          kltSchema,
          procesoSchema.extend({
            /** Dispositivo de cada ráfaga de E/S, en orden. */
            dispositivos: z.array(z.string()).optional(),
            /** Multinivel: cola fija (1 = mayor prioridad). */
            cola: z.number().int().positive().optional(),
            estimacionInicial: z.number().nonnegative().optional(),
            estimacionAnterior: z.number().nonnegative().optional(),
            rafagaAnterior: z.number().nonnegative().optional(),
            /** Proceso al que pertenece este KLT (grado de multiprogramación por proceso). */
            proceso: z.string().optional(),
          }),
        ]),
      )
      .min(1),
  }),
  /** Gantt de código: sentencias con duración + semáforos/recursos (ver brain). */
  z.object({
    kind: z.literal('codigo'),
    etiqueta: z.string().optional(),
    algoritmo: z.enum(['fifo', 'rr', 'prioridades', 'prioridades-desalojo']),
    quantum: z.number().positive().optional(),
    duracion: z.number().int().nonnegative().optional(),
    atomicas: z.boolean().optional(),
    semaforos: z.record(z.string(), z.number().int().nonnegative()).optional(),
    recursos: z.record(z.string(), z.number().int().positive()).optional(),
    detector: z.object({ sentencia: z.string() }).optional(),
    hasta: z.number().int().positive().optional(),
    hastaQueTerminen: z.array(z.string()).optional(),
    procesos: z
      .array(
        z.object({
          id: z.string(),
          llegada: z.number().int().nonnegative(),
          prioridad: z.number().optional(),
          codigo: z.string(),
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
