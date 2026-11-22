/** Bloque ```fat: YAML con la tabla y el inicio → recorrido de la cadena (hasta un byte o completa). Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoCadenaFat, type SpecCadenaFat } from './recorrido-cadena-fat'

export function renderFat(codigo: string): string {
  const spec = parse(codigo) as SpecCadenaFat
  for (const campo of ['titulo', 'tabla', 'inicio', 'bloque'] as const)
    if (spec?.[campo] == null) throw new Error(`Bloque fat: falta \`${campo}\``)
  return renderRecorrido(recorridoCadenaFat(spec))
}
