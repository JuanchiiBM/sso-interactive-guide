/** Primitivas de los dibujos de Sistemas operativos: cruces de modo con "trap" y recuadros con leyenda. */
import { atributosEl, insignia } from './primitivas-procesos'
import { esc } from './svg'

/** Flecha resaltable; con `trap`, lleva la insignia "trap" donde cruza la línea de modo. */
export function cruce(
  el: string,
  d: string,
  opts: { trap?: [number, number]; etiqueta?: string; lx?: number; ly?: number } = {},
) {
  const label = opts.etiqueta
    ? `<text class="dg-etiqueta" x="${opts.lx ?? 0}" y="${opts.ly ?? 0}">${esc(opts.etiqueta)}</text>`
    : ''
  const trap = opts.trap ? insignia(opts.trap[0], opts.trap[1], 'trap') : ''
  return (
    `<g class="dg-flecha"${atributosEl({ el })}><path d="${d}" marker-end="url(#dg-punta)"/>` +
    `${trap}${label}</g>`
  )
}

/** Recuadro con el título apoyado sobre el borde, como la leyenda de un fieldset. */
export function recuadroTitulado(
  x: number,
  y: number,
  w: number,
  h: number,
  titulo: string,
  opts: { clase?: string; el?: string; lx?: number } = {},
) {
  return (
    `<g class="t3s-recuadro ${opts.clase ?? ''}"${atributosEl({ el: opts.el })}>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>` +
    `<text class="t3s-leyenda" x="${opts.lx ?? x + 14}" y="${y}">${esc(titulo)}</text></g>`
  )
}
