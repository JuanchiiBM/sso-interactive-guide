/** Dibujo de cada paso del bloque ```tlb (tableros tlb-B y tlb-1): camino de etapas, tablas y "Hasta acá". */
import type { Etapa } from './recorrido-tlb'
import { esc } from './svg'
import { rotuloProceso, type EntradaTlb, type PasoTlb, type SpecTlb } from './tlb'

export const X0 = 20
export const W = 760
const BX = X0 + 34 + 12 + 180 + 12
const FILA = 24
/** Mono a 12 px ≈ 7,2 px por carácter: las celdas miden su ancho por sus textos. */
const anchoMono = (t: string) => t.length * 7.2

export const txt = (x: number, y: number, t: string, clase = '') =>
  `<text class="rm-izq ${clase}" x="${x}" y="${y}">${esc(t)}</text>`

/** Corta en renglones de hasta `max` caracteres, por palabras. */
export function renglones(t: string, max: number): string[] {
  const r: string[] = []
  for (const palabra of t.split(' ')) {
    const ult = r.at(-1)
    if (ult != null && (ult + ' ' + palabra).length <= max) r[r.length - 1] = ult + ' ' + palabra
    else r.push(palabra)
  }
  return r
}

/** Caja con el dato en mono y el porqué debajo; devuelve su alto. */
export function caja(x: number, y: number, w: number, dato: string, porque: string, tono: string) {
  const lineas = renglones(porque, Math.floor((w - 24) / 6.4))
  const h = 32 + lineas.length * 15
  const svg =
    `<g class="tlb-caja tlb-${tono}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>` +
    txt(x + 12, y + 15, dato, 'tlb-dato') +
    lineas.map((l, i) => txt(x + 12, y + 34 + i * 15, l, 'tlb-porque')).join('') +
    `</g>`
  return { svg, h }
}

export function camino(etapas: Etapa[], y0: number) {
  let y = y0
  let svg = ''
  etapas.forEach((e, i) => {
    const c = caja(BX, y, W - BX, e.dato, e.porque, e.tono)
    const cx = X0 + 12
    const linea =
      i < etapas.length - 1
        ? `<line class="tlb-linea" x1="${cx}" x2="${cx}" y1="${y + 26}" y2="${y + c.h + 6}"/>`
        : ''
    svg +=
      `<g class="tlb-etapa tlb-${e.tono}">${linea}<circle cx="${cx}" cy="${y + 13}" r="12"/>` +
      `<text class="tlb-num" x="${cx}" y="${y + 13}">${i + 1}</text></g>` +
      txt(X0 + 46, y + 15, e.titulo, 'tlb-tit') +
      c.svg
    y += c.h + 6
  })
  return { svg, alto: y - y0 }
}

/** Tabla con bordes; `nueva` pinta esa fila en --ok. */
export function tabla(x: number, y: number, cols: string[], filas: string[][], nueva?: number) {
  const anchos = cols.map(
    (c, j) => Math.max(anchoMono(c), ...filas.map((f) => anchoMono(f[j] ?? ''))) + 20,
  )
  const xs = anchos.map((_, j) => x + anchos.slice(0, j).reduce((s, a) => s + a, 0))
  const fila = (yf: number, celdas: string[], clase: string) =>
    `<g class="${clase}">` +
    celdas
      .map(
        (c, j) =>
          `<rect class="tlb-celda" x="${xs[j]}" y="${yf}" width="${anchos[j]}" height="${FILA}"/>` +
          `<text x="${xs[j] + anchos[j] / 2}" y="${yf + FILA / 2}">${esc(c)}</text>`,
      )
      .join('') +
    `</g>`
  const svg =
    fila(y, cols, 'tlb-enc') +
    filas
      .map((f, i) => fila(y + FILA * (i + 1), f, i === nueva ? 'tlb-fila tlb-nueva' : 'tlb-fila'))
      .join('')
  return { svg, w: anchos.reduce((s, a) => s + a, 0), h: FILA * (filas.length + 1) }
}

export interface BloqueTabla {
  rotulo: string
  cols: string[]
  filas: string[][]
}

/** Tablas con su rótulo, una al lado de la otra; si no entran en el ancho, bajan. */
export function tablasEnFila(bloques: BloqueTabla[], y0: number) {
  let svg = ''
  let y = y0
  let x = X0
  let altoFila = 0
  for (const b of bloques) {
    const t = tabla(x, y + 20, b.cols, b.filas)
    if (x > X0 && x + t.w > W) {
      y += altoFila + 16
      x = X0
      altoFila = 0
    }
    svg += txt(x, y + 8, b.rotulo, 'tlb-etq') + tabla(x, y + 20, b.cols, b.filas).svg
    altoFila = Math.max(altoFila, 20 + t.h)
    x += t.w + 24
  }
  return { svg, y: y + altoFila + 16 }
}

const colsTlb = (spec: SpecTlb) =>
  spec.bitsPagina
    ? ['Pos.', 'Pág.', 'Frame', 'Proc.', 'ingreso']
    : ['Pos.', 'Pág.', 'Frame', 'ingreso (ref.)']
const filaTlb = (spec: SpecTlb, e: EntradaTlb, i: number, nueva: boolean) => {
  const ingreso = `${e.ingreso}${nueva ? ' (nueva)' : ''}`
  const base = [String(i), String(e.pagina), String(e.frame)]
  return spec.bitsPagina ? [...base, e.proceso, ingreso] : [...base, ingreso]
}

/** Etiqueta + tabla de la TLB y, al lado, "Hasta acá". */
function pie(
  spec: SpecTlb,
  y: number,
  rotulo: string,
  tlb: EntradaTlb[],
  nueva: number | undefined,
  hasta: string,
) {
  const filas = Array.from({ length: spec.entradas }, (_, i) =>
    tlb[i]
      ? filaTlb(spec, tlb[i], i, i === nueva)
      : [String(i), '—', '', ...(spec.bitsPagina ? ['', ''] : [''])],
  )
  const t = tabla(X0, y + 20, colsTlb(spec), filas, nueva)
  const hx = X0 + t.w + 24
  const svg =
    txt(X0, y + 8, rotulo, 'tlb-etq') +
    t.svg +
    txt(hx, y + 8, 'Hasta acá', 'tlb-etq') +
    txt(hx, y + 32, hasta, 'tlb-hasta')
  return { svg, alto: 20 + t.h, ancho: Math.max(hx + anchoMono(hasta), X0 + t.w) + 20 }
}

export function dibujoReferencia(spec: SpecTlb, x: PasoTlb, etapas: Etapa[], hasta: string) {
  const c = camino(etapas, 4)
  const rotulo =
    x.hit != null
      ? 'TLB después de este paso (sin cambios: FIFO no mira los hits)'
      : 'TLB después de este paso'
  const p = pie(spec, c.alto + 14, rotulo, x.tlb, x.hit == null ? x.pos : undefined, hasta)
  return { svg: c.svg + p.svg, alto: c.alto + 14 + p.alto + 4, ancho: Math.max(W, p.ancho) }
}

export function dibujoInicial(spec: SpecTlb, hasta: string) {
  let y = 4
  let svg = ''
  const bo = spec.bitsOffset ?? 0
  if (spec.bitsPagina) {
    const bp = spec.bitsPagina
    const bf = spec.bitsFrame ?? 0
    const pag = 2 ** bo
    const tam = pag % 1024 ? `${pag} B` : `${pag / 1024} KiB`
    const c = caja(
      X0,
      y,
      W - 2 * X0,
      `DL ${bp + bo} bits = página (${bp}) | offset (${bo}) · DF ${bf + bo} bits = frame (${bf}) | offset (${bo})`,
      `Página de ${tam} = 2^${bo} → ${bo} bits de offset. DF = frame × ${pag.toString(16).toUpperCase()}h + offset.`,
      'neutro',
    )
    svg += c.svg
    y += c.h + 16
  }
  const bloques: BloqueTabla[] = [
    {
      rotulo: `TLB (FIFO, ${spec.entradas} entradas)`,
      cols: colsTlb(spec),
      filas: Array.from({ length: spec.entradas }, (_, i) => {
        const e = spec.tlb?.[i]
        return e
          ? filaTlb(spec, e, i, false)
          : [String(i), '—', '', ...(spec.bitsPagina ? ['', ''] : [''])]
      }),
    },
    ...Object.entries(spec.procesos).map(([p, marcos]) => ({
      rotulo: spec.bitsPagina ? `Frames de ${p} (LRU local)` : `Frames (LRU)`,
      cols: ['Frame', 'Pág.', spec.bitsPagina ? 'acc' : 'ref.'],
      filas: marcos.map((m) => [
        String(m.frame),
        m.pagina != null ? String(m.pagina) : '— libre',
        m.pagina != null && m.acc != null ? String(m.acc) : '',
      ]),
    })),
  ]
  const fila = tablasEnFila(bloques, y)
  svg += fila.svg
  y = fila.y
  const refs = spec.referencias
    .map((r) =>
      typeof r === 'number'
        ? String(r)
        : r.dl != null
          ? `${rotuloProceso(r.proceso)} ${r.dl.toString(16).toUpperCase()}h${r.instante != null ? ` (${r.instante})` : ''}`
          : `${r.proceso} ${r.pagina}`,
    )
    .join(typeof spec.referencias[0] === 'number' ? ' ' : ' · ')
  svg += txt(X0, y + 8, spec.bitsPagina ? 'Referencias (instante)' : 'Referencias', 'tlb-etq')
  const lineas = renglones(refs, 96)
  lineas.forEach((l, i) => (svg += txt(X0, y + 30 + i * 18, l, 'tlb-hasta')))
  y += 30 + lineas.length * 18
  svg += txt(X0, y + 4, 'Hasta acá', 'tlb-etq') + txt(X0, y + 26, hasta, 'tlb-hasta')
  return { svg, alto: y + 36, ancho: W }
}
