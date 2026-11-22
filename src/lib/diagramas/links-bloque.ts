/** Bloque ```links: YAML con el estado y las operaciones → recorrido. Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoLinks, type SpecLinks } from './recorrido-links'

export function renderLinks(codigo: string): string {
  const spec = parse(codigo) as SpecLinks
  for (const campo of ['titulo', 'inicial', 'operaciones'] as const)
    if (spec?.[campo] == null) throw new Error(`Bloque links: falta \`${campo}\``)
  // en YAML `inodo: 5` llega como número
  for (const x of [...spec.inicial, ...spec.operaciones])
    if ('inodo' in x) x.inodo = String(x.inodo)
  return renderRecorrido(recorridoLinks(spec))
}
