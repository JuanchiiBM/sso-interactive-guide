/** Dibujo del bloque ```deducir: decodificar (camino) y comparar (tabla, tarjetas, respuesta). */
import { camino, renglones, tabla, txt, W, X0 } from './recorrido-tlb-svg'
import type { Etapa } from './recorrido-tlb'
import { esc } from './svg'

export interface Celda {
  t: string
  /** Clase de la celda (ded-si, ded-no, ded-fuerte…) y de toda la fila. */
  c?: string
  fila?: string
  span?: number
}
export interface Tarjeta {
  ok: boolean
  titulo: string
  texto: string
}

const FILA = 26
const anchoMono = (t: string) => t.length * 7.2

export function dibujoDecodificar(etapas: Etapa[]) {
  const c = camino(etapas, 4)
  return { svg: c.svg, alto: c.alto + 8, ancho: W }
}

/** Tabla con clase por celda; estira las columnas hasta el ancho del recorrido. */
function tablaCeldas(y: number, cols: string[], filas: Celda[][]) {
  const base = cols.map(
    (c, j) =>
      Math.max(
        anchoMono(c),
        ...filas.map((f) => (f.length === cols.length ? anchoMono(f[j].t) : 0)),
      ) + 16,
  )
  const total = base.reduce((s, a) => s + a, 0)
  const extra = Math.max(0, W - 2 * X0 - total) / cols.length
  const anchos = base.map((a) => a + extra)
  const xs = anchos.map((_, j) => X0 + anchos.slice(0, j).reduce((s, a) => s + a, 0))
  const celdas = (yf: number, fila: Celda[], enc = false) => {
    let j = 0
    return fila
      .map((c) => {
        const span = c.span ?? 1
        const w = anchos.slice(j, j + span).reduce((s, a) => s + a, 0)
        const x = xs[j]
        j += span
        const derecha = c.c?.includes('ded-pregunta')
        return (
          `<g class="${enc ? 'tlb-enc' : ''} ${c.fila ?? ''} ${c.c ?? ''}"><rect class="tlb-celda" x="${x}" y="${yf}" width="${w}" height="${FILA}"/>` +
          `<text ${derecha ? 'class="ded-der" ' : ''}x="${derecha ? x + w - 10 : x + w / 2}" y="${yf + FILA / 2}">${esc(c.t)}</text></g>`
        )
      })
      .join('')
  }
  const svg =
    celdas(
      y,
      cols.map((t) => ({ t })),
      true,
    ) + filas.map((f, i) => celdas(y + FILA * (i + 1), f)).join('')
  return { svg, h: FILA * (filas.length + 1), w: anchos.reduce((s, a) => s + a, 0) }
}

function tarjetas(ts: Tarjeta[], y0: number, ancho: number) {
  const w = (ancho - 10) / 2
  let y = y0
  let svg = ''
  for (let i = 0; i < ts.length; i += 2) {
    const par = ts
      .slice(i, i + 2)
      .map((t) => ({ t, lineas: renglones(`${t.titulo} ${t.texto}`, Math.floor((w - 20) / 6.4)) }))
    const h = 16 + Math.max(...par.map((p) => p.lineas.length)) * 17
    par.forEach(({ t, lineas }, k) => {
      const x = X0 + k * (w + 10)
      const clase = t.ok ? 'ded-si' : 'ded-no'
      const [primera, ...resto] = lineas
      const cola = primera.slice(t.titulo.length)
      svg +=
        `<g class="ded-tarjeta ${clase}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>` +
        `<text class="rm-izq ded-txt" x="${x + 10}" y="${y + 16}"><tspan class="ded-tit">${esc(t.titulo)}</tspan>${esc(cola)}</text>` +
        resto.map((l, j) => txt(x + 10, y + 33 + j * 17, l, 'ded-txt')).join('') +
        `</g>`
    })
    y += h + 10
  }
  return { svg, alto: y - y0 }
}

export function dibujoComparar(
  t: { cols: string[]; filas: Celda[][]; previa?: { cols: string[]; filas: string[][] } },
  ts: Tarjeta[],
  respuesta: string,
) {
  let y = 4
  let svg = ''
  if (t.previa) {
    const p = tabla(X0, y + 20, t.previa.cols, t.previa.filas)
    svg += txt(X0, y + 8, 'Frames antes de las referencias', 'tlb-etq') + p.svg
    y += 20 + p.h + 16
  }
  const tc = tablaCeldas(y, t.cols, t.filas)
  svg += tc.svg
  y += tc.h + 16
  const c = tarjetas(ts, y, Math.max(W - 2 * X0, tc.w))
  svg += c.svg
  y += c.alto + 8
  const [rotulo, ...resto] = respuesta.split(': ')
  svg += `<text class="rm-izq ded-resp" x="${X0}" y="${y + 6}">${esc(rotulo)}: <tspan class="ded-tit">${esc(resto.join(': '))}</tspan></text>`
  return { svg, alto: y + 20, ancho: Math.max(W, tc.w + 2 * X0) }
}
