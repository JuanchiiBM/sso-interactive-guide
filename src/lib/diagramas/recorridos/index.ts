/** Registro de recorridos paso a paso, referenciados desde markdown con ```recorrido <id>. */
import { renderRecorrido, type Recorrido } from '../recorrido'
import { estadosProceso } from './procesos'

export const RECORRIDOS: Record<string, Recorrido> = {
  'estados-proceso': estadosProceso,
}

export function renderRecorridoPorId(id: string): string {
  const r = RECORRIDOS[id.trim()]
  if (!r)
    throw new Error(
      `Recorrido desconocido: "${id}". Disponibles: ${Object.keys(RECORRIDOS).join(', ')}`,
    )
  return renderRecorrido(r)
}
