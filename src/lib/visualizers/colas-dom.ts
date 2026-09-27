/** Primitivas del diagrama de colas: zonas con fichas y animación FLIP entre pasos. */

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
  title?: string
}

export function ficha({ clave, texto, color, title }: Ficha): HTMLElement {
  const f = el('span', 'colas-ficha', texto)
  f.dataset.ficha = clave
  f.style.setProperty('--c', colorProceso(color))
  if (title) f.title = title
  return f
}

export interface Zona {
  titulo: string
  fichas: Ficha[]
  /** `cola` muestra el orden con flechas (el primero, a la izquierda). */
  tipo?: 'cola' | 'recurso'
  /** Texto chico al pie (quantum, dispositivo, etc.). */
  pie?: string
  /** Para agrupar zonas en filas (`so`, `io`, …) desde quien compone. */
  grupo?: string
}

export function zona({ titulo, fichas, tipo = 'cola', pie }: Zona): HTMLElement {
  const z = el('div', `colas-zona colas-${tipo}`)
  z.append(el('div', 'colas-titulo', titulo))
  const cuerpo = el('div', 'colas-cuerpo')
  if (!fichas.length) cuerpo.append(el('span', 'colas-vacia', tipo === 'cola' ? '∅' : 'libre'))
  fichas.forEach((f, i) => {
    if (i > 0 && tipo === 'cola') cuerpo.append(el('span', 'colas-flecha', '←'))
    cuerpo.append(ficha(f))
  })
  z.append(cuerpo)
  if (pie) z.append(el('div', 'colas-pie', pie))
  return z
}

/** Repinta `root` con `nuevo` y anima las fichas que cambiaron de lugar (FLIP). */
export function repintarAnimado(root: HTMLElement, nuevo: HTMLElement[]): void {
  const antes = new Map<string, DOMRect>()
  root.querySelectorAll<HTMLElement>('[data-ficha]').forEach((f) => {
    antes.set(f.dataset.ficha!, f.getBoundingClientRect())
  })
  root.replaceChildren(...nuevo)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  root.querySelectorAll<HTMLElement>('[data-ficha]').forEach((f) => {
    const previo = antes.get(f.dataset.ficha!)
    if (!previo) {
      f.animate([{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1 }], { duration: 220 })
      return
    }
    const ahora = f.getBoundingClientRect()
    const dx = previo.left - ahora.left
    const dy = previo.top - ahora.top
    if (!dx && !dy) return
    f.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: 320,
      easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
    })
  })
}
