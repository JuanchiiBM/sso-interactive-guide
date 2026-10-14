/** Recorridos de las resoluciones de la Guía de Ejercicios de Memoria (2016). */
import type { Recorrido } from '../recorrido'
import { recorridoReemplazo } from '../recorrido-reemplazo'

/** Guía Ej. 8 (Memoria virtual, Ej. 4): 8 páginas, 4 marcos, asignación fija y alcance local. */
export const REFS_GUIA_EJ8 = [0, 1, 7, 2, 3, 2, 7, 1, 0, 3, 0, 2, 3, 1]

export const recorridos: Record<string, Recorrido> = {
  'guia-mem-ej8': recorridoReemplazo({
    refs: REFS_GUIA_EJ8,
    marcos: 4,
    algoritmos: ['optimo', 'fifo', 'lru', 'clock'],
    titulo: 'Reemplazo con 4 marcos: Óptimo, FIFO, LRU y Clock',
  }),
}
