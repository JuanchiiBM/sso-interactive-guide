/** Primitivas de los recorridos de imagen del proceso, interrupciones e hilos: secciones de memoria y paneles. */
import { esc } from './svg'

/** Franja de un bloque de memoria con su nombre arriba a la izquierda; sin `data-el`, nunca se atenúa. */
export function seccion(x: number, y: number, w: number, h: number, nombre: string, clase = '') {
  return (
    `<g class="ri-seccion ${clase}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/>` +
    `<text x="${x + 8}" y="${y + 13}">${esc(nombre)}</text></g>`
  )
}

/** Panel punteado con título que se puede resaltar (y ocultar) como un todo. */
export function panel(
  el: string,
  x: number,
  y: number,
  w: number,
  h: number,
  titulo: string,
  opts: { oculto?: boolean; clase?: string } = {},
) {
  const oculto = opts.oculto ? ' data-rc-oculto' : ''
  return (
    `<g class="dg-panel ri-panel ${opts.clase ?? ''}" data-el="${esc(el)}"${oculto}>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>` +
    `<text x="${x + 14}" y="${y + 16}">${esc(titulo)}</text></g>`
  )
}
