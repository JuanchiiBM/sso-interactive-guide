/** Primitivas SVG de los recorridos de planificación e hilos: colas con casilleros y recuadros con un valor. */
import { esc, texto } from './svg'

/** Cola FIFO horizontal centrada en (x, y): el frente es el casillero de la derecha. */
export function cola(
  x: number,
  y: number,
  n: number,
  w: number,
  h: number,
  el: string,
  clase = '',
) {
  const x0 = x - (n * w) / 2
  const divisiones = Array.from({ length: n - 1 }, (_, i) => {
    const xi = x0 + (i + 1) * w
    return `<line class="rl-casilla" x1="${xi}" y1="${y - h / 2}" x2="${xi}" y2="${y + h / 2}"/>`
  }).join('')
  return (
    `<g class="dg-nodo rl-cola ${clase}" data-el="${esc(el)}">` +
    `<rect x="${x0}" y="${y - h / 2}" width="${n * w}" height="${h}" rx="8"/>${divisiones}</g>`
  )
}

/** Lugares de los casilleros de una cola: `<prefijo>-0` es el frente. */
export function casilleros(prefijo: string, x: number, y: number, n: number, w: number) {
  const derecha = x + (n * w) / 2
  return Object.fromEntries(
    Array.from({ length: n }, (_, i) => [`${prefijo}-${i}`, { x: derecha - (i + 0.5) * w, y }]),
  )
}

/** Recuadro resaltable con un texto que cambia por paso (`val`). */
export function recuadro(
  x: number,
  y: number,
  w: number,
  h: number,
  el: string,
  val: string,
  inicial: string,
  clase = '',
) {
  return (
    `<g class="dg-nodo ${clase}" data-el="${esc(el)}">` +
    `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"/>` +
    texto(x, y, inicial, { val }) +
    `</g>`
  )
}
