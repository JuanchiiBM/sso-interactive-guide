/** Bloques de código que se convierten en SVG en build: ```grafo, ```diagrama <id> y ```gantt. */
import { renderGrafo } from '../grafos/asignacion'
import { renderDiagrama } from '../diagramas/index'
import { renderGanttEstatico } from '../diagramas/gantt-estatico'

/** Devuelve el SVG del bloque, o null si el lenguaje no es uno de los nuestros. */
export function bloqueSVG(lang: string | null | undefined, codigo: string): string | null {
  const [tipo, ...args] = (lang ?? '').trim().split(/\s+/)
  if (tipo === 'grafo') return renderGrafo(codigo)
  if (tipo === 'diagrama') return renderDiagrama(args[0] ?? codigo)
  if (tipo === 'gantt') return renderGanttEstatico(codigo)
  return null
}

interface NodoCode {
  type: 'code'
  lang?: string | null
  meta?: string | null
  value: string
}

interface Contexto {
  replaceNode: (nodo: unknown, reemplazo: { type: 'html'; value: string }) => void
}

/** Plugin mdast de Sätteri (el procesador de markdown por defecto de Astro 7). */
export const bloquesSVGPlugin = {
  name: 'bloques-svg',
  code(nodo: NodoCode, ctx: Contexto) {
    const lang = [nodo.lang, nodo.meta].filter(Boolean).join(' ')
    const svg = bloqueSVG(lang, nodo.value)
    if (svg != null) ctx.replaceNode(nodo, { type: 'html', value: svg })
  },
}
