/** Bloque ```inodo: YAML → recorrido por los punteros del inodo. Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoInodo, type SpecInodo } from './recorrido-inodo'

export function renderInodo(codigo: string): string {
  const spec = (parse(codigo) ?? {}) as Record<string, unknown>
  for (const campo of ['titulo', 'bloque', 'puntero', 'punteros'])
    if (spec[campo] == null) throw new Error(`Bloque inodo: falta \`${campo}\``)
  return renderRecorrido(recorridoInodo(spec as unknown as SpecInodo))
}
