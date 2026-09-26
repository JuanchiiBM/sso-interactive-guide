/** Primitivas extra para los recorridos de Procesos y SO: nodos con subtítulo, aristas, carriles y tarjetas. */
import { esc } from './svg'

interface Opts {
  clase?: string
  el?: string
  oculto?: boolean
}

/** `data-el` y, si hace falta, `data-rc-oculto` justo después (el test genérico busca ese orden). */
export const atributosEl = ({ el, oculto }: Opts) =>
  (el ? ` data-el="${esc(el)}"` : '') + (el && oculto ? ' data-rc-oculto' : '')

const sub = (x: number, y: number, t: string, val?: string) =>
  `<text class="rp-sub" x="${x}" y="${y}"${val ? ` data-val="${esc(val)}"` : ''}>${esc(t)}</text>`

/** Caja con nombre arriba y una línea chica abajo (que puede cambiar por paso con `val`). */
export function nodo(
  x: number,
  y: number,
  w: number,
  h: number,
  nombre: string,
  linea: string,
  opts: Opts & { val?: string } = {},
) {
  return (
    `<g class="dg-nodo ${opts.clase ?? ''}"${atributosEl(opts)}>` +
    `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"/>` +
    `<text x="${x}" y="${y - 8}">${esc(nombre)}</text>` +
    sub(x, y + 10, linea, opts.val) +
    `</g>`
  )
}

/** Tarjeta con título y varias líneas (p. ej. un PCB o los registros de la CPU). */
export function tarjeta(
  x: number,
  y: number,
  w: number,
  h: number,
  titulo: string,
  lineas: { t: string; val?: string }[],
  opts: Opts = {},
) {
  const y0 = y - h / 2 + 16
  return (
    `<g class="dg-nodo rp-tarjeta ${opts.clase ?? ''}"${atributosEl(opts)}>` +
    `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"/>` +
    `<text x="${x}" y="${y0}">${esc(titulo)}</text>` +
    lineas.map((l, i) => sub(x, y0 + 19 + i * 16, l.t, l.val)).join('') +
    `</g>`
  )
}

/** Línea o flecha (con `punta`) que se puede resaltar, ocultar y rotular. */
export function arista(
  d: string,
  opts: Opts & { punta?: boolean; etiqueta?: string; lx?: number; ly?: number } = {},
) {
  const marca = opts.punta ? ' marker-end="url(#dg-punta)"' : ''
  const label = opts.etiqueta
    ? `<text class="dg-etiqueta" x="${opts.lx ?? 0}" y="${opts.ly ?? 0}">${esc(opts.etiqueta)}</text>`
    : ''
  return `<g class="dg-flecha ${opts.clase ?? ''}"${atributosEl(opts)}><path d="${d}"${marca}/>${label}</g>`
}

/** Bloque de tiempo dentro de un carril (x es el borde izquierdo). */
export function bloque(x: number, y: number, w: number, h: number, t: string, opts: Opts = {}) {
  return (
    `<g class="rp-bloque ${opts.clase ?? ''}"${atributosEl(opts)}>` +
    `<rect x="${x}" y="${y - h / 2}" width="${w}" height="${h}" rx="5"/>` +
    `<text x="${x + w / 2}" y="${y}">${esc(t)}</text></g>`
  )
}

/** Franja horizontal con su rótulo a la izquierda. */
export function carril(y: number, h: number, etiqueta: string, x0: number, x1: number) {
  return (
    `<g class="rp-carril"><rect x="${x0}" y="${y - h / 2}" width="${x1 - x0}" height="${h}" rx="6"/>` +
    `<text x="${x0 / 2}" y="${y}">${esc(etiqueta)}</text></g>`
  )
}

/** Rótulo chico con fondo (p. ej. "Z" de zombie). */
export function insignia(x: number, y: number, t: string, opts: Opts = {}) {
  const w = 10 + t.length * 8
  return (
    `<g class="rp-insignia ${opts.clase ?? ''}"${atributosEl(opts)}>` +
    `<rect x="${x - w / 2}" y="${y - 10}" width="${w}" height="20" rx="5"/>` +
    `<text x="${x}" y="${y}">${esc(t)}</text></g>`
  )
}
