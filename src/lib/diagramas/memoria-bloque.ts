/** Bloque ```memoria: YAML con el estado y los pedidos → recorrido de la barra. Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoMemoria, type SpecRecorridoMemoria } from './recorrido-memoria'

export function renderMemoria(codigo: string): string {
  const spec = parse(codigo) as SpecRecorridoMemoria
  for (const campo of ['titulo', 'total', 'algoritmo', 'inicial', 'operaciones'] as const)
    if (spec?.[campo] == null) throw new Error(`Bloque memoria: falta \`${campo}\``)
  return renderRecorrido(recorridoMemoria(spec))
}
