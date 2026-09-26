/** Primitivas SVG compartidas por los diagramas fijos. Colores por clase CSS (ver diagramas.css). */

/** Tamaño en pantalla respecto del viewBox. */
const ESCALA = 1.2

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** `data-el` para que un recorrido paso a paso pueda resaltar el elemento. */
const dataEl = (el?: string) => (el ? ` data-el="${esc(el)}"` : '')

/** Agrupa elementos bajo un `data-el`; con `oculto`, el recorrido lo muestra recién cuando un paso lo pide. */
export function grupo(
  el: string,
  contenido: string,
  opts: { oculto?: boolean; clase?: string } = {},
) {
  const oculto = opts.oculto ? ' data-rc-oculto' : ''
  return `<g class="${opts.clase ?? ''}" data-el="${esc(el)}"${oculto}>${contenido}</g>`
}

/** Texto suelto; con `val`, un recorrido puede cambiarlo por paso (`valores`). */
export function texto(
  x: number,
  y: number,
  t: string,
  opts: { clase?: string; val?: string } = {},
) {
  const val = opts.val ? ` data-val="${esc(opts.val)}"` : ''
  return `<text class="${opts.clase ?? ''}" x="${x}" y="${y}"${val}>${esc(t)}</text>`
}

export function caja(
  x: number,
  y: number,
  w: number,
  h: number,
  texto: string,
  clase = '',
  el?: string,
) {
  const lineas = texto.split('\n')
  const y0 = y - ((lineas.length - 1) * 15) / 2
  const tspans = lineas
    .map((l, i) => `<tspan x="${x}" y="${y0 + i * 15}">${esc(l)}</tspan>`)
    .join('')
  return (
    `<g class="dg-nodo ${clase}"${dataEl(el)}><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"/>` +
    `<text>${tspans}</text></g>`
  )
}

export function rombo(x: number, y: number, w: number, h: number, texto: string) {
  const d = `M${x},${y - h / 2} L${x + w / 2},${y} L${x},${y + h / 2} L${x - w / 2},${y} z`
  return `<g class="dg-nodo dg-decision"><path d="${d}"/><text><tspan x="${x}" y="${y}">${esc(texto)}</tspan></text></g>`
}

/** Flecha con etiqueta opcional ubicada en (lx, ly). */
export function flecha(d: string, etiqueta?: string, lx = 0, ly = 0, clase = '', el?: string) {
  const label = etiqueta
    ? `<text class="dg-etiqueta" x="${lx}" y="${ly}">${esc(etiqueta)}</text>`
    : ''
  return `<g class="dg-flecha ${clase}"${dataEl(el)}><path d="${d}" marker-end="url(#dg-punta)"/>${label}</g>`
}

export interface Lienzo {
  ancho: number
  alto: number
  titulo: string
  cuerpo: string[]
}

export const marco = (opts: Lienzo) => `<figure class="diagrama">${lienzo(opts)}</figure>`

export function lienzo(opts: Lienzo, extra = '') {
  return (
    `<svg viewBox="0 0 ${opts.ancho} ${opts.alto}" width="${opts.ancho * ESCALA}" height="${opts.alto * ESCALA}" role="img" aria-label="${esc(opts.titulo)}">` +
    `<defs><marker id="dg-punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-punta" d="M0,0 L10,5 L0,10 z"/></marker>` +
    `<marker id="dg-punta-on" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-punta-on" d="M0,0 L10,5 L0,10 z"/></marker></defs>` +
    opts.cuerpo.join('') +
    extra +
    `</svg>`
  )
}
