/** Bloque ```traduccion: YAML → recorrido inverso (DL y DF → base), directo (DL → DF) o búsqueda (DF → DL). Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoTraduccion, type SpecTraduccion } from './recorrido-traduccion'
import {
  recorridoTraduccionDirecta,
  type SpecTraduccionDirecta,
} from './recorrido-traduccion-directa'
import {
  recorridoTraduccionBusqueda,
  type SpecTraduccionBusqueda,
} from './recorrido-traduccion-busqueda'

const CAMPOS = {
  inversa: ['titulo', 'total', 'bitsSegmento', 'bitsOffset', 'proceso', 'direcciones'],
  directo: ['titulo', 'segmentos', 'direcciones'],
  busqueda: [
    'titulo',
    'bitsSegmento',
    'bitsPagina',
    'bitsOffset',
    'bitsFrame',
    'procesos',
    'direcciones',
  ],
} as const

export function renderTraduccion(codigo: string): string {
  const spec = (parse(codigo) ?? {}) as Record<string, unknown>
  const sentido = String(spec.sentido ?? 'inversa')
  if (!(sentido in CAMPOS))
    throw new Error(`Bloque traduccion: sentido "${sentido}" (inversa | directo | busqueda)`)
  for (const campo of CAMPOS[sentido as keyof typeof CAMPOS])
    if (spec[campo] == null) throw new Error(`Bloque traduccion: falta \`${campo}\``)
  return renderRecorrido(
    sentido === 'directo'
      ? recorridoTraduccionDirecta(spec as unknown as SpecTraduccionDirecta)
      : sentido === 'busqueda'
        ? recorridoTraduccionBusqueda(spec as unknown as SpecTraduccionBusqueda)
        : recorridoTraduccion(spec as unknown as SpecTraduccion),
  )
}
