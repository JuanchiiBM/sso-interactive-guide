/** Primitivas del diagrama de colas: fichas redondas en SVG que persisten entre pasos y se animan. */
import { esc } from '@lib/diagramas/svg'

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

export const colorProceso = (i: number) => `var(--p${(i % 8) + 1})`

export interface Ficha {
  /** Clave estable entre pasos: la misma clave se anima de una zona a otra. */
  clave: string
  texto: string
  /** Índice de color (el mismo que la fila del Gantt). */
  color: number
  /** Color CSS explícito (p. ej. `var(--muted)` para un KLT sin fila); le gana a `color`. */
  css?: string
  title?: string
}

export const SVG_NS = 'http://www.w3.org/2000/svg'
export const RADIO_FICHA = 13

/** Ficha ubicada en coordenadas del viewBox; `mueve` la marca con un aro (cambió de lugar). */
export interface FichaUbicada {
  ficha: Ficha
  x: number
  y: number
  mueve?: boolean
}

/** Markup de una ficha suelta (para dibujos estáticos); las animadas usan `moverFichas`. */
export const fichaSvg = (f: Ficha, x: number, y: number) =>
  `<g class="rc-ficha" style="--c:${f.css ?? colorProceso(f.color)}" transform="translate(${x} ${y})">` +
  `<circle r="${RADIO_FICHA}"/><text>${esc(f.texto)}</text></g>`

/**
 * Deja en `capa` una ficha por clave en su lugar: las que ya estaban se deslizan (transición CSS de
 * `transform`), las nuevas aparecen sin volar y las que no están se desvanecen.
 */
export function moverFichas(capa: SVGGElement, ubicadas: FichaUbicada[]): void {
  const previas = new Map<string, SVGGElement>()
  for (const g of Array.from(capa.children) as SVGGElement[]) previas.set(g.dataset.ficha!, g)
  const vistas = new Set<string>()
  for (const { ficha, x, y, mueve } of ubicadas) {
    vistas.add(ficha.clave)
    let g = previas.get(ficha.clave)
    const aparece = !g || g.classList.contains('rc-fuera')
    if (!g) {
      g = document.createElementNS(SVG_NS, 'g') as SVGGElement
      g.dataset.ficha = ficha.clave
      g.append(document.createElementNS(SVG_NS, 'circle'), document.createElementNS(SVG_NS, 'text'))
      g.append(document.createElementNS(SVG_NS, 'title'))
      g.firstElementChild!.setAttribute('r', String(RADIO_FICHA))
      capa.append(g)
    }
    g.setAttribute('class', `rc-ficha${mueve ? ' colas-mueve' : ''}`)
    g.style.setProperty('--c', ficha.css ?? colorProceso(ficha.color))
    g.children[1].textContent = ficha.texto
    g.children[2].textContent = ficha.title ?? ficha.texto
    if (aparece) g.classList.add('rc-salto')
    g.style.transform = `translate(${x}px, ${y}px)`
    if (aparece) {
      g.getBoundingClientRect()
      const nodo = g
      requestAnimationFrame(() => nodo.classList.remove('rc-salto'))
    }
  }
  for (const [clave, g] of previas) if (!vistas.has(clave)) g.classList.add('rc-fuera')
}
