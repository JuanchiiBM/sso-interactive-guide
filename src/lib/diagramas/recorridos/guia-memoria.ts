/** Recorridos de las resoluciones de la Guía de Ejercicios de Memoria (2016). */
import type { Recorrido } from '../recorrido'
import type { MarcoEstado, RefAcceso } from '../memoria'
import { recorridoReemplazo } from '../recorrido-reemplazo'
import { recorridoReemplazoEstado } from '../recorrido-reemplazo-estado'

/** Guía Ej. 8 (Memoria virtual, Ej. 4): 8 páginas, 4 marcos, asignación fija y alcance local. */
export const REFS_GUIA_EJ8 = [0, 1, 7, 2, 3, 2, 7, 1, 0, 3, 0, 2, 3, 1]

/** Guía Ej. 9 (Memoria virtual, Ej. 5): marcos 1, 3, 5 y 8 con el puntero en el 8 (libre). */
export const INICIAL_GUIA_EJ9: MarcoEstado[] = [
  { marco: 1, pagina: 14, u: true, m: true, ultimoUso: 28 },
  { marco: 3, pagina: 17, u: true, m: false, ultimoUso: 3 },
  { marco: 5, pagina: 19, u: true, m: true, ultimoUso: 15 },
  { marco: 8, pagina: null, u: false, m: false, ultimoUso: -1 },
]

/** Páginas de 8 KB; 172100 cae en la página 21 y el proceso (159 KB) tiene 0–19: inválida. */
export const ACCESOS_GUIA_EJ9 = [
  { dir: 100, escritura: false },
  { dir: 122950, escritura: true },
  { dir: 98306, escritura: false },
  { dir: 139264, escritura: true },
  { dir: 122880, escritura: false },
  { dir: 155650, escritura: true },
  { dir: 172100, escritura: false },
  { dir: 100, escritura: false },
]
const PAGINAS_PROCESO = Math.ceil(159 / 8)

export const REFS_GUIA_EJ9: RefAcceso[] = ACCESOS_GUIA_EJ9.map(({ dir, escritura }) => {
  const pagina = Math.floor(dir / 8192)
  return { pagina: pagina < PAGINAS_PROCESO ? pagina : null, escritura }
})

export const recorridos: Record<string, Recorrido> = {
  'guia-mem-ej8': recorridoReemplazo({
    refs: REFS_GUIA_EJ8,
    marcos: 4,
    algoritmos: ['optimo', 'fifo', 'lru', 'clock'],
    titulo: 'Reemplazo con 4 frames: Óptimo, FIFO, LRU y Clock',
  }),
  'guia-mem-ej9': recorridoReemplazoEstado({
    inicial: INICIAL_GUIA_EJ9,
    puntero: 3,
    refs: REFS_GUIA_EJ9,
    direcciones: ACCESOS_GUIA_EJ9.map((a) => String(a.dir)),
    algoritmos: ['lru', 'clock-mejorado'],
    titulo: 'LRU y Clock mejorado desde el estado dado, con lecturas y escrituras',
  }),
}
