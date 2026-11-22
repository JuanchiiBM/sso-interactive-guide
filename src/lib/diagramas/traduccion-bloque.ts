/** Bloque ```traduccion: YAML con DL y DF de cada segmento → recorrido. Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoTraduccion, type SpecTraduccion } from './recorrido-traduccion'

export function renderTraduccion(codigo: string): string {
  const spec = parse(codigo) as SpecTraduccion
  for (const campo of [
    'titulo',
    'total',
    'bitsSegmento',
    'bitsOffset',
    'proceso',
    'direcciones',
  ] as const)
    if (spec?.[campo] == null) throw new Error(`Bloque traduccion: falta \`${campo}\``)
  return renderRecorrido(recorridoTraduccion(spec))
}
