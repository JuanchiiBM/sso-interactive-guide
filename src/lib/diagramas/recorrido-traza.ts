/** Resolución de una traza a completar: la grilla de la cátedra que ya usan la teoría y la guía. */
import {
  normalizarPagina,
  NOMBRE_ALGORITMO,
  type AlgoritmoTraza,
  type Pagina,
  type TrazaSpec,
} from '../calculos/traza'
import type { Recorrido } from './recorrido'
import { recorridoReemplazo } from './recorrido-reemplazo'
import { recorridoReemplazoEstado } from './recorrido-reemplazo-estado'

export function recorridoTraza(spec: TrazaSpec, alg: AlgoritmoTraza): Recorrido {
  const titulo = `Traza con ${NOMBRE_ALGORITMO[alg]}, paso a paso`
  const desdeCero =
    spec.marcos.every((m, i) => m.pagina == null && m.marco === i) &&
    spec.referencias.every((r) => typeof r.pagina === 'number' && r.acceso === 'L')
  if (alg === 'optimo' || (desdeCero && alg !== 'clock-mejorado'))
    return recorridoReemplazo({
      refs: spec.referencias.map((r) => r.pagina as number),
      marcos: spec.marcos.length,
      algoritmos: [alg],
      titulo,
    })

  // como en trazaEsperada: cada rótulo pasa a un número y la grilla lo muestra con su texto
  const rotulos: string[] = []
  const id = (p: Pagina | null) => {
    if (normalizarPagina(p) == null) return null
    const k = rotulos.findIndex((r) => normalizarPagina(r) === normalizarPagina(p))
    return k >= 0 ? k : rotulos.push(String(p)) - 1
  }
  return recorridoReemplazoEstado({
    inicial: spec.marcos.map((m) => ({ ...m, pagina: id(m.pagina) })),
    puntero: spec.puntero,
    refs: spec.referencias.map((r) => ({ pagina: id(r.pagina), escritura: r.acceso === 'E' })),
    direcciones: spec.referencias.map((r) => r.etiqueta),
    algoritmos: [alg],
    titulo,
    rotulos,
  })
}
