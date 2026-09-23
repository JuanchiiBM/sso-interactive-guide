/** Primitivas SVG compartidas por los diagramas fijos. Colores por clase CSS (ver diagramas.css). */

/** Tamaño en pantalla respecto del viewBox. */
const ESCALA = 1.2

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function caja(x: number, y: number, w: number, h: number, texto: string, clase = '') {
  const lineas = texto.split('\n')
  const y0 = y - ((lineas.length - 1) * 15) / 2
  const tspans = lineas
    .map((l, i) => `<tspan x="${x}" y="${y0 + i * 15}">${esc(l)}</tspan>`)
    .join('')
  return (
    `<g class="dg-nodo ${clase}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"/>` +
    `<text>${tspans}</text></g>`
  )
}

export function rombo(x: number, y: number, w: number, h: number, texto: string) {
  const d = `M${x},${y - h / 2} L${x + w / 2},${y} L${x},${y + h / 2} L${x - w / 2},${y} z`
  return `<g class="dg-nodo dg-decision"><path d="${d}"/><text><tspan x="${x}" y="${y}">${esc(texto)}</tspan></text></g>`
}

/** Flecha con etiqueta opcional ubicada en (lx, ly). */
export function flecha(d: string, etiqueta?: string, lx = 0, ly = 0, clase = '') {
  const label = etiqueta
    ? `<text class="dg-etiqueta" x="${lx}" y="${ly}">${esc(etiqueta)}</text>`
    : ''
  return `<g class="dg-flecha ${clase}"><path d="${d}" marker-end="url(#dg-punta)"/>${label}</g>`
}

export function marco(opts: { ancho: number; alto: number; titulo: string; cuerpo: string[] }) {
  return (
    `<figure class="diagrama">` +
    `<svg viewBox="0 0 ${opts.ancho} ${opts.alto}" width="${opts.ancho * ESCALA}" height="${opts.alto * ESCALA}" role="img" aria-label="${esc(opts.titulo)}">` +
    `<defs><marker id="dg-punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="dg-punta" d="M0,0 L10,5 L0,10 z"/></marker></defs>` +
    opts.cuerpo.join('') +
    `</svg></figure>`
  )
}
