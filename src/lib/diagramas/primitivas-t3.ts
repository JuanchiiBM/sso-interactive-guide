/** Primitivas de la tanda 3 (procesos, planificación, hilos y sincronización): paneles con leyenda, celdas de Gantt y chips. */
import { esc, grupo, texto } from './svg'

/** Panel punteado con el título apoyado sobre el borde (como un fieldset); sin `el`, nunca se atenúa. */
export function panelLeyenda(
  x: number,
  y: number,
  w: number,
  h: number,
  titulo: string,
  opts: { el?: string; clase?: string } = {},
) {
  const el = opts.el ? ` data-el="${esc(opts.el)}"` : ''
  return (
    `<g class="dg-panel ${opts.clase ?? ''}"${el}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>` +
    `<text class="ri-leyenda" x="${x + 14}" y="${y}">${esc(titulo)}</text></g>`
  )
}

/** Celda de Gantt (x es el borde izquierdo) con los colores del Gantt del sitio (`ge-cpu`/`ge-io` + `ge-pN`). */
export function celda(
  el: string,
  x: number,
  y: number,
  w: number,
  h: number,
  clase: string,
  opts: { t?: string; oculto?: boolean } = {},
) {
  return grupo(
    el,
    `<rect class="${clase}" x="${x + 1}" y="${y - h / 2 + 1}" width="${w - 2}" height="${h - 2}" rx="3"/>` +
      (opts.t ? texto(x + w / 2, y, opts.t, { clase: 't3p-celda-texto' }) : ''),
    { oculto: opts.oculto, clase: 't3p-celda' },
  )
}

/** Números del eje de tiempo: `n + 1` marcas desde x0 cada `paso`. */
export const eje = (x0: number, y: number, paso: number, n: number) =>
  Array.from({ length: n + 1 }, (_, t) => texto(x0 + t * paso, y, String(t), { clase: 't3p-eje' }))

/** Ancho aproximado de un texto monoespaciado (0,6 em por carácter). */
export const anchoTexto = (t: string, px: number) => t.length * px * 0.6

/** Chip con un campo (x es el borde izquierdo); devuelve el HTML y dónde termina. */
export function chip(x: number, y: number, t: string, clase = ''): [string, number] {
  const w = Math.ceil(anchoTexto(t, 12)) + 14
  return [
    `<g class="t3p-chip ${clase}"><rect x="${x}" y="${y - 12}" width="${w}" height="24" rx="12"/>` +
      texto(x + w / 2, y, t) +
      `</g>`,
    x + w,
  ]
}
