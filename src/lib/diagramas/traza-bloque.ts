/** Bloque ```traza: la grilla de reemplazo desde un estado dado (la de los ejercicios), para un ejemplo. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoReemplazoEstado } from './recorrido-reemplazo-estado'

interface SpecTraza {
  titulo: string
  algoritmo: 'lru' | 'clock-mejorado' | 'fifo' | 'clock'
  puntero?: number
  marcos: { marco: number; pagina?: string | null; u?: boolean; m?: boolean; uso?: number }[]
  referencias: { pagina: string; acceso?: 'L' | 'E' }[]
}

const ALGORITMOS = ['lru', 'clock-mejorado', 'fifo', 'clock']

export function renderTraza(codigo: string): string {
  const spec = (parse(codigo) ?? {}) as SpecTraza
  if (!ALGORITMOS.includes(spec.algoritmo))
    throw new Error(`Bloque traza: algoritmo "${spec.algoritmo}" (${ALGORITMOS.join(' | ')})`)
  if (!spec.titulo || !spec.marcos || !spec.referencias)
    throw new Error('Bloque traza: faltan titulo, marcos o referencias')
  // cada rótulo (A0, P2p1) pasa a un número; la grilla lo muestra con su texto
  const rotulos: string[] = []
  const id = (p?: string | null) =>
    p == null ? null : rotulos.includes(p) ? rotulos.indexOf(p) : rotulos.push(p) - 1
  return renderRecorrido(
    recorridoReemplazoEstado({
      inicial: spec.marcos.map((m) => ({
        marco: m.marco,
        pagina: id(m.pagina),
        u: !!m.u,
        m: !!m.m,
        ultimoUso: m.uso ?? -1,
      })),
      puntero: spec.puntero ?? 0,
      refs: spec.referencias.map((r) => ({ pagina: id(r.pagina), escritura: r.acceso === 'E' })),
      direcciones: spec.referencias.map((r) => `${r.pagina} (${r.acceso ?? 'L'})`),
      algoritmos: [spec.algoritmo],
      titulo: spec.titulo,
      rotulos,
    }),
  )
}
