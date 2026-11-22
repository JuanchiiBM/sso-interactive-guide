/** Bloque ```deducir: YAML → decodificar la referencia y comparar algoritmos. Ver brain: Resolución gráfica de la TLB. */
import { parse } from 'yaml'
import type { SpecDeducir } from './deducir'
import { renderRecorrido } from './recorrido'
import { recorridoDeducir } from './recorrido-deducir'

const ALGS = ['fifo', 'lru', 'clock', 'clock-mejorado']

export function renderDeducir(codigo: string): string {
  const spec = (parse(codigo) ?? {}) as Record<string, unknown>
  for (const campo of [
    'titulo',
    'bitsOffset',
    'bitsDL',
    'bitsDF',
    'marcos',
    'referencias',
    'algoritmos',
  ])
    if (spec[campo] == null) throw new Error(`Bloque deducir: falta \`${campo}\``)
  for (const a of spec.algoritmos as string[])
    if (!ALGS.includes(a))
      throw new Error(`Bloque deducir: algoritmo "${a}" (van ${ALGS.join(', ')})`)
  const r = recorridoDeducir(spec as unknown as SpecDeducir)
  const html = renderRecorrido(r)
  // tabla ancha: en pantalla chica scrollea en vez de achicarse (como el inodo)
  return r.ancho > 760
    ? html.replace('class="diagrama recorrido"', 'class="diagrama recorrido in-ancho"')
    : html
}
