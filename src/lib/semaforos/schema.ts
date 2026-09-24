import { z } from 'astro/zod'

const nombre = z.string().optional()

const testSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('exclusion'), recurso: z.string(), nombre }),
  z.object({ tipo: z.literal('concurrencia-max'), accion: z.string(), max: z.number(), nombre }),
  z.object({ tipo: z.literal('capacidad'), recurso: z.string(), max: z.number(), nombre }),
  z.object({ tipo: z.literal('capacidad-alcanzable'), recurso: z.string(), valor: z.number(), nombre }),
  z.object({ tipo: z.literal('concurrencia-alcanzable'), accion: z.string(), valor: z.number(), nombre }),
  z.object({ tipo: z.literal('secuencia'), acciones: z.array(z.string()).min(2), nombre }),
  z.object({
    tipo: z.literal('rango'),
    variable: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    nombre,
  }),
  z.object({ tipo: z.literal('sin-deadlock'), nombre }),
  z.object({ tipo: z.literal('sin-inanicion'), nombre }),
  z.object({ tipo: z.literal('todas-ejecutan'), nombre }),
  z.object({ tipo: z.literal('max-semaforos'), max: z.number(), nombre }),
])

/** Un desafío de semáforos (frontmatter `semaforos:`, uno por inciso). */
export const desafioSemaforosSchema = z.object({
  etiqueta: z.string().optional(),
  /** Aclaraciones del modelo para el alumno (markdown corto), ej. "Para verificar se usa M = 3". */
  nota: z.string().optional(),
  procesos: z
    .array(z.object({ nombre: z.string(), instancias: z.number().int().min(1).max(4), codigo: z.string() }))
    .min(1),
  acciones: z.record(
    z.string(),
    z.object({
      recursos: z.array(z.string()).optional(),
      efecto: z.record(z.string(), z.number()).optional(),
    }),
  ),
  variables: z.record(z.string(), z.number()).optional(),
  constantes: z.record(z.string(), z.number()).optional(),
  /** Declaraciones precargadas en la plantilla (ej. cuando hay que corregir un código dado). */
  inicial: z.string().optional(),
  tests: z.array(testSchema).min(1),
  /** Solución de referencia (se muestra al resolver). */
  solucion: z.string(),
  /** Justificación en markdown (tipos de semáforo, por qué ese orden, etc.). */
  justificacion: z.string(),
})

export type DesafioSemaforos = z.infer<typeof desafioSemaforosSchema>
