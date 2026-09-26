/** Primitivas SVG de los recorridos de sincronización y deadlock: código con cursor, celdas y carteles. */
import { grupo, texto } from './svg'

export const ALTO_LINEA = 26
const ALTO_RENGLON = ALTO_LINEA - 4

export const rect = (x: number, y: number, w: number, h: number, rx = 6) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`

/** Columna de código: cada línea es el `data-el` `${id}-${i}`; con `cambiable`, también su `data-val`. */
export function codigo(
  id: string,
  x: number,
  y: number,
  w: number,
  lineas: string[],
  cambiable = false,
) {
  return lineas
    .map((l, i) => {
      const y0 = y + i * ALTO_LINEA
      const val = cambiable ? `${id}-${i}` : undefined
      return grupo(
        `${id}-${i}`,
        rect(x, y0, w, ALTO_RENGLON, 5) +
          texto(x + 8, y0 + ALTO_RENGLON / 2, l, { clase: 'rs-codigo', val }),
        { clase: 'rs-linea' },
      )
    })
    .join('')
}

/** Lugar del cursor (una ficha) a la izquierda de cada línea de `codigo`. */
export const lugaresCodigo = (id: string, x: number, y: number, n: number) =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => [
      `${id}-${i}`,
      { x: x - 16, y: y + i * ALTO_LINEA + ALTO_RENGLON / 2 },
    ]),
  )

/** Recuadro con un valor que cambia por paso (variable, semáforo, celda). */
export function valor(
  el: string,
  x: number,
  y: number,
  w: number,
  h: number,
  t: string,
  opts: { val?: string; clase?: string } = {},
) {
  return grupo(el, rect(x, y, w, h) + texto(x + w / 2, y + h / 2, t, { val: opts.val ?? el }), {
    clase: `rs-caja ${opts.clase ?? ''}`,
  })
}

/** Fila de celdas (una matriz se arma con varias): un `data-el` para la fila y un `data-val` por celda. */
export function fila(
  el: string,
  x: number,
  y: number,
  celda: number,
  alto: number,
  vals: string[],
) {
  const celdas = vals.map(
    (v, j) =>
      rect(x + j * celda, y, celda, alto, 0) +
      texto(x + j * celda + celda / 2, y + alto / 2, v, { val: `${el}-${j}` }),
  )
  return grupo(el, celdas.join(''), { clase: 'rs-fila' })
}

/** Cartel oculto que aparece con `mostrar`; su texto se puede cambiar con `valores[el]`. */
export const cartel = (el: string, x: number, y: number, w: number, h: number, t: string) =>
  grupo(el, rect(x - w / 2, y - h / 2, w, h, 8) + texto(x, y, t, { val: el }), {
    oculto: true,
    clase: 'rs-cartel',
  })
