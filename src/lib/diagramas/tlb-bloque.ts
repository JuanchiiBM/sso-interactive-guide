/** Bloque ```tlb: YAML → camino de cada referencia por la TLB. Ver brain: Resolución gráfica de la TLB. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoTlb } from './recorrido-tlb'
import type { SpecTlb } from './tlb'

export function renderTlb(codigo: string): string {
  const spec = (parse(codigo) ?? {}) as Record<string, unknown>
  for (const campo of ['titulo', 'entradas', 'procesos', 'referencias'])
    if (spec[campo] == null) throw new Error(`Bloque tlb: falta \`${campo}\``)
  if (spec.bitsPagina && (spec.bitsOffset == null || spec.bitsFrame == null))
    throw new Error('Bloque tlb: con bitsPagina van también bitsOffset y bitsFrame')
  return renderRecorrido(recorridoTlb(spec as unknown as SpecTlb))
}
