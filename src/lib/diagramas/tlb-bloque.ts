/** Bloque ```tlb: YAML → camino de cada referencia por la TLB. Ver brain: Resolución gráfica de la TLB. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoTlb } from './recorrido-tlb'
import { recorridoTlbNiveles } from './recorrido-tlb-niveles'
import type { SpecTlb } from './tlb'
import type { SpecTlbNiveles } from './tlb-niveles'

export function renderTlb(codigo: string): string {
  const spec = (parse(codigo) ?? {}) as Record<string, unknown>
  const niveles = spec.niveles != null
  const campos = niveles
    ? ['titulo', 'entradas', 'bitsOffset', 'bitsFrame', 'tp1', 'tablas', 'bitmap', 'referencias']
    : ['titulo', 'entradas', 'procesos', 'referencias']
  for (const campo of campos)
    if (spec[campo] == null) throw new Error(`Bloque tlb: falta \`${campo}\``)
  if (niveles) return renderRecorrido(recorridoTlbNiveles(spec as unknown as SpecTlbNiveles))
  if (spec.bitsPagina && (spec.bitsOffset == null || spec.bitsFrame == null))
    throw new Error('Bloque tlb: con bitsPagina van también bitsOffset y bitsFrame')
  return renderRecorrido(recorridoTlb(spec as unknown as SpecTlb))
}
