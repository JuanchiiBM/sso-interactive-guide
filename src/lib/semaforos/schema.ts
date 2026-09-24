import { z } from 'astro/zod'

const nombre = z.string().optional()
/** Texto del motivo cuando el test falla (si no, se arma uno genérico). */
const motivo = z.string().optional()

const testSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('exclusion'), recurso: z.string(), nombre, motivo }),
  z.object({ tipo: z.literal('concurrencia-max'), accion: z.string(), max: z.number(), nombre, motivo }),
  z.object({ tipo: z.literal('capacidad'), recurso: z.string(), max: z.number(), nombre, motivo }),
  z.object({ tipo: z.literal('capacidad-alcanzable'), recurso: z.string(), valor: z.number(), nombre, motivo }),
  z.object({ tipo: z.literal('concurrencia-alcanzable'), accion: z.string(), valor: z.number(), nombre, motivo }),
  z.object({ tipo: z.literal('secuencia'), acciones: z.array(z.string()).min(2), nombre, motivo }),
  z.object({ tipo: z.literal('orden-instancias'), accion: z.string(), proceso: z.string(), nombre, motivo }),
  z.object({
    tipo: z.literal('rango'),
    variable: z.string(),
    min: z.number().optional(),
    max: z.number().optional(),
    nombre,
    motivo,
  }),
  z.object({ tipo: z.literal('sin-deadlock'), nombre, motivo }),
  z.object({ tipo: z.literal('sin-inanicion'), nombre, motivo }),
  z.object({ tipo: z.literal('todas-ejecutan'), nombre, motivo }),
  z.object({ tipo: z.literal('max-semaforos'), max: z.number(), nombre, motivo }),
])

const accionSchema = z.object({
  recursos: z.array(z.string()).optional(),
  efecto: z.record(z.string(), z.number()).optional(),
  asigna: z
    .object({
      variables: z.array(z.string()).min(1),
      valores: z.number().int().min(1),
      distintos: z.boolean().optional(),
    })
    .optional(),
  adquiere: z.array(z.string()).optional(),
  libera: z.array(z.string()).optional(),
})

/** Un desafío de semáforos (frontmatter `semaforos:`, uno por inciso). */
export const desafioSemaforosSchema = z.object({
  etiqueta: z.string().optional(),
  /** Aclaraciones del modelo para el alumno (markdown corto), ej. "Para verificar se usa M = 3". */
  nota: z.string().optional(),
  procesos: z
    .array(z.object({ nombre: z.string(), instancias: z.number().int().min(1).max(5), codigo: z.string() }))
    .min(1),
  acciones: z.record(z.string(), accionSchema),
  variables: z.record(z.string(), z.number()).optional(),
  modulos: z.record(z.string(), z.number()).optional(),
  locales: z.array(z.string()).optional(),
  funciones: z
    .record(
      z.string(),
      z.object({ variable: z.string(), mas: z.number().optional(), modulo: z.number().optional() }),
    )
    .optional(),
  recursosImplicitos: z
    .record(z.string(), z.object({ cantidad: z.number().int().min(1), instancias: z.number().int().min(1) }))
    .optional(),
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
