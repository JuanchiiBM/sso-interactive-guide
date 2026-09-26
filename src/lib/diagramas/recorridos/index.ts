/** Registro de recorridos paso a paso (```recorrido <id>): junta el `recorridos` que exporta cada archivo de tema. */
import { renderRecorrido, type Recorrido } from '../recorrido'

const temas = import.meta.glob<{ recorridos: Record<string, Recorrido> }>(
  ['./*.ts', '!./index.ts', '!./*.test.ts'],
  { eager: true },
)

export const RECORRIDOS: Record<string, Recorrido> = {}
for (const [archivo, { recorridos }] of Object.entries(temas))
  for (const [id, r] of Object.entries(recorridos)) {
    if (RECORRIDOS[id]) throw new Error(`Recorrido "${id}" repetido (${archivo})`)
    RECORRIDOS[id] = r
  }

export function renderRecorridoPorId(id: string): string {
  const r = RECORRIDOS[id.trim()]
  if (!r)
    throw new Error(
      `Recorrido desconocido: "${id}". Disponibles: ${Object.keys(RECORRIDOS).join(', ')}`,
    )
  return renderRecorrido(r)
}
