/** Dibujo de cada paso del bloque ```inodo (tablero inodo-A): inodo, bloque del puntero y BP de 2.º nivel. */
import type { AccesosPuntero } from './filesystem'
import { esc } from './svg'

export const X0 = 20
const FILA = 24
const SEP = 4
const ORD = ['', '1.er', '2.º', '3.er']

const n = (x: number) => (Math.abs(x) >= 10000 ? x.toLocaleString('es-AR') : String(x))
const r = (a: number, b: number) => (a === b ? n(a) : `${n(a)}–${n(b)}`)
/** Ancho aproximado de un texto en la mono de los diagramas. */
const ancho = (t: string, px = 12) => t.length * px * 0.6

const txt = (x: number, y: number, t: string, clase = '') =>
  `<text class="rm-izq ${clase}" x="${x}" y="${y}">${t}</text>`
const rect = (x: number, y: number, w: number, h: number, clase: string, rx = 4) =>
  `<rect class="${clase}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`
const curva = (x1: number, y1: number, x2: number, y2: number) => {
  const xm = (x1 + x2) / 2
  return `<path class="in-flecha" d="M ${x1} ${y1} C ${xm} ${y1}, ${xm} ${y2}, ${x2} ${y2}"/>`
}
const insignia = (t: string, clase: string) => ` <tspan class="${clase}">${t}</tspan>`

export type EstadoPuntero = 'actual' | 'hecho' | 'nada' | 'normal'

/** Columna del inodo; devuelve el SVG, su ancho y el centro de cada fila. */
export function inodo(ps: AccesosPuntero[], estados: EstadoPuntero[], y0 = 0) {
  const filas = ps.map(
    (p, i) => `${p.rotulo} · ${r(p.inicio, p.fin)}${estados[i] === 'hecho' ? ' ✓' : ''}`,
  )
  const w = Math.max(150, Math.max(...filas.map((f) => ancho(f))) + 28)
  const yFila = (i: number) => y0 + 22 + 6 + i * (FILA + SEP)
  const alto = 12 + ps.length * (FILA + SEP) - SEP
  const svg =
    txt(X0, y0 + 8, 'Inodo (en memoria)', 'in-etq') +
    rect(X0, y0 + 22, w, alto, 'in-inodo', 6) +
    filas
      .map(
        (f, i) =>
          `<g class="in-ptr in-ptr-${estados[i]}">${rect(X0 + 6, yFila(i), w - 12, FILA, '')}${txt(X0 + 14, yFila(i) + FILA / 2, esc(f))}</g>`,
      )
      .join('')
  return { svg, w, alto: 22 + alto, centro: (i: number) => yFila(i) + FILA / 2 }
}

/** Caja de un bloque (BP o los BD de los PD) con la barra de cuánto se lee; crece con sus textos. */
function caja(
  x: number,
  y: number,
  minW: number,
  o: {
    titulo: string
    linea?: string
    total: number
    desde: number
    hasta: number
    pie: string
    bd?: boolean
  },
) {
  const w = Math.max(minW, ...[o.titulo + ' BP', o.linea ?? '', o.pie].map((t) => ancho(t) + 20))
  const yb = y + (o.linea ? 40 : 24)
  const h = yb - y + 26
  const bw = w - 16
  const leidos = o.hasta - o.desde + 1
  const barra =
    leidos === o.total
      ? rect(x + 8, yb, bw, 8, 'in-barra-ok', 3)
      : rect(x + 8, yb, bw, 8, 'in-barra', 3) +
        (leidos > 0
          ? rect(
              x + 8 + (o.desde / o.total) * bw,
              yb,
              Math.max(2, (leidos / o.total) * bw),
              8,
              'in-barra-ok',
              3,
            )
          : '')
  const svg =
    `<g class="${o.bd ? 'in-caja-bd' : 'in-caja-bp'}">` +
    rect(x, y, w, h, 'in-caja', 6) +
    txt(x + 8, y + 12, esc(o.titulo) + (o.bd ? '' : insignia('BP', 'in-bp'))) +
    (o.linea ? txt(x + 8, y + 28, esc(o.linea), 'in-gris') : '') +
    barra +
    txt(x + 8, yb + 17, esc(o.pie), leidos > 0 ? 'in-ok' : 'in-muted') +
    '</g>'
  return { svg, w, h }
}

const pie = (total: number, a: number, b: number, nada: string) =>
  b < a
    ? nada
    : b - a + 1 === total
      ? `se leen los ${n(total)}`
      : `se leen ${n(b - a + 1)} (${r(a, b)})`

/** Lista de entradas usadas: todas si son pocas; si no, primera, "…" y última. */
function compactar<T>(items: T[]): (T | number)[] {
  return items.length <= 3 ? items : [items[0], items.length - 2, items.at(-1)!]
}

/** Paso de un puntero: inodo con el puntero marcado y lo que se lee por él. */
export function dibujoPuntero(ps: AccesosPuntero[], k: number, ppb: number, primero: number) {
  const ultimoLeido = ps.findLastIndex((p) => p.leidos)
  const estados = ps.map((p, i): EstadoPuntero =>
    i === k
      ? 'actual'
      : i < k
        ? p.leidos
          ? 'hecho'
          : 'nada'
        : i > ultimoLeido
          ? 'nada'
          : 'normal',
  )
  const ino = inodo(ps, estados)
  const p = ps[k]
  const [a, b] = p.leidos ?? [p.fin + 1, p.fin]
  const x2 = X0 + ino.w + 60
  const yCaja = 22
  let svg = ino.svg
  let alto = ino.alto

  if (p.nivel <= 1) {
    const total = p.fin - p.inicio + 1
    const bd = p.nivel === 0
    svg +=
      txt(
        x2,
        8,
        bd
          ? `Bloques de los PD${insignia('BD', 'in-bd')}`
          : `Bloque del ${esc(p.rotulo)}${insignia('BP', 'in-bp')}`,
        'in-etq',
      ) + curva(X0 + ino.w, ino.centro(k), x2, yCaja + 28)
    const c = caja(x2, yCaja, 230, {
      titulo: bd ? `${p.rotulo} → bloques ${r(p.inicio, p.fin)}` : p.rotulo,
      linea: bd ? undefined : `${n(ppb)} punteros → bloques ${r(p.inicio, p.fin)}`,
      total,
      desde: a - p.inicio,
      hasta: b - p.inicio,
      pie: pie(total, a, b, `no se lee ninguno (empieza en el ${n(primero)})`),
      bd,
    })
    svg += c.svg
    return { svg, alto: Math.max(alto, yCaja + c.h), ancho: x2 + c.w }
  }

  // Indirecto doble: entradas del BP de 1.er nivel y los BP de 2.º nivel que se leen
  const alc = ppb ** (p.nivel - 1)
  const e0 = Math.floor((a - p.inicio) / alc)
  const e1 = Math.floor((b - p.inicio) / alc)
  const cubre = (i: number) =>
    [p.inicio + i * alc, Math.min(p.inicio + (i + 1) * alc - 1, p.fin)] as const
  type Fila = { t: string; usada?: number }
  const filas: Fila[] = [
    ...(e0 > 0 ? [{ t: `[${e0 > 1 ? `0..${e0 - 1}` : 0}] sin usar` }] : []),
    ...compactar(Array.from({ length: e1 - e0 + 1 }, (_, j) => e0 + j)).map((e, j, lista) =>
      j === 1 && lista.length === 3 && e1 - e0 + 1 > 3
        ? { t: `… [${e0 + 1}..${e1 - 1}]` }
        : { t: `[${e}] → ${r(...cubre(e as number))}`, usada: e as number },
    ),
    ...(e1 < ppb - 1
      ? [{ t: `[${e1 + 1 < ppb - 1 ? `${e1 + 1}..${ppb - 1}` : ppb - 1}] sin usar` }]
      : []),
  ]
  const w2 = Math.max(170, Math.max(...filas.map((f) => ancho(f.t))) + 28)
  const yFila = (i: number) => yCaja + 6 + i * (FILA + SEP)
  const altoLista = 12 + filas.length * (FILA + SEP) - SEP
  svg +=
    txt(x2, 8, `Bloque del ${esc(p.rotulo)}${insignia('BP', 'in-bp')}`, 'in-etq') +
    curva(X0 + ino.w, ino.centro(k), x2, yCaja + altoLista / 2) +
    `<g class="in-caja-bp">${rect(x2, yCaja, w2, altoLista, 'in-caja', 6)}</g>` +
    filas
      .map(
        (f, i) =>
          `<g class="${f.usada != null ? 'in-entrada' : 'in-sin-usar'}">${f.usada != null ? rect(x2 + 6, yFila(i), w2 - 12, FILA, '') : ''}${txt(x2 + 14, yFila(i) + FILA / 2, esc(f.t))}</g>`,
      )
      .join('')
  alto = Math.max(alto, yCaja + altoLista)

  // Columna de los BP de 2.º nivel: primero, "… N más, enteros" y último
  const x3 = x2 + w2 + 60
  const usadas = filas.map((f, i) => ({ ...f, i })).filter((f) => f.usada != null)
  const cajas = usadas.map((f, j) => {
    const [c0, c1] = cubre(f.usada!)
    const [l0, l1] = [Math.max(a, c0), Math.min(b, c1)]
    return {
      titulo: `${p.rotulo} · ${ORD[2]} nivel #${n(f.usada!)}`,
      linea: `${j === 0 ? `${n(ppb)} punteros → ` : ''}bloques ${r(c0, c1)}`,
      total: c1 - c0 + 1,
      desde: l0 - c0,
      hasta: l1 - c0,
      pie: pie(c1 - c0 + 1, l0, l1, ''),
    }
  })
  const w3 = Math.max(...cajas.map((o) => caja(0, 0, 170, o).w))
  let y = yCaja
  usadas.forEach((f, j) => {
    if (j === 1 && e1 - e0 + 1 > 3) {
      svg += txt(x3 + 8, y + 8, `… ${n(e1 - e0 - 1)} más, enteros`, 'in-gris')
      y += 26
    }
    const c = caja(x3, y, w3, cajas[j])
    svg += curva(x2 + w2, yFila(f.i) + FILA / 2, x3, y + 20) + c.svg
    y += c.h + 14
  })
  return { svg, alto: Math.max(alto, y - 14), ancho: x3 + w3 }
}
