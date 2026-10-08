/** Primitivas de los recorridos de memoria: barra de memoria con segmentos y celdas de tabla. */
import { esc, grupo, texto } from './svg'

export interface Segmento {
  inicio: number
  tam: number
  etiqueta: string
  /** `rm-so`, `rm-hueco`, `rm-p1`… `rm-p8`; con `rm-frag`, la parte sin usar de un bloque. */
  clase: string
  /** Lo que usa de verdad el proceso (el resto del bloque se pinta como fragmentación interna). */
  usado?: number
}

/** Barra horizontal de memoria: cada segmento ocupa su proporción de `total`; un fotograma por `el`. */
export function barraMemoria(
  el: string,
  x: number,
  y: number,
  w: number,
  h: number,
  total: number,
  segmentos: Segmento[],
  opts: { oculto?: boolean; marcas?: boolean } = {},
) {
  const px = (v: number) => x + (v / total) * w
  const partes = segmentos.map((s) => {
    const x0 = px(s.inicio)
    const ancho = px(s.inicio + s.tam) - x0
    const usado = s.usado != null ? (s.usado / s.tam) * ancho : ancho
    const frag =
      s.usado != null && s.usado < s.tam
        ? `<rect class="rm-frag" x="${x0 + usado}" y="${y}" width="${ancho - usado}" height="${h}"/>`
        : ''
    const chica = ancho < 46 ? ' rm-chica' : ''
    return (
      `<g class="rm-seg ${s.clase}"><rect x="${x0}" y="${y}" width="${ancho}" height="${h}"/>${frag}` +
      texto(x0 + ancho / 2, y + h / 2, s.etiqueta, { clase: `rm-etq${chica}` }) +
      `</g>`
    )
  })
  const marcas = opts.marcas
    ? [...new Set(segmentos.flatMap((s) => [s.inicio, s.inicio + s.tam]))].map((v) =>
        texto(px(v), y + h + 13, String(v), { clase: 'rm-marca' }),
      )
    : []
  return grupo(el, partes.join('') + marcas.join(''), { oculto: opts.oculto, clase: 'rm-barra' })
}

/** Celda con texto cambiable (`data-val` = el): para tablas de páginas, grillas y registros. */
export function celdaM(
  el: string,
  x: number,
  y: number,
  w: number,
  h: number,
  t: string,
  opts: { clase?: string; oculto?: boolean } = {},
) {
  return grupo(
    el,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>` +
      texto(x + w / 2, y + h / 2, t, { val: el }),
    { clase: `rm-celda ${opts.clase ?? ''}`, oculto: opts.oculto },
  )
}

/** Encabezados de columnas centrados sobre celdas de ancho `w` (texto fijo, nunca se atenúa). */
export const encabezados = (x: number, y: number, w: number, titulos: string[]) =>
  titulos.map((t, j) => texto(x + j * w + w / 2, y, t, { clase: 'rm-enc' })).join('')

/** Tabla de valores: filas × columnas de `celdaM` con ids `${id}-${fila}-${col}`. */
export function tablaM(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  filas: string[][],
  opts: { clase?: string } = {},
) {
  return filas
    .flatMap((f, i) =>
      f.map((t, j) => celdaM(`${id}-${i}-${j}`, x + j * w, y + i * h, w, h, t, opts)),
    )
    .join('')
}

/** Nombre de una fila/columna a la izquierda (texto fijo). */
export const rotulo = (x: number, y: number, t: string) =>
  `<text class="rm-rotulo" x="${x}" y="${y}">${esc(t)}</text>`
