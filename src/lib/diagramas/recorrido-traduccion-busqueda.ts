/** Inversa con búsqueda (```traduccion con `sentido: busqueda`): DF → frame → tabla de páginas que lo tiene → DL. */
import type { Paso, Recorrido } from './recorrido'
import { bits } from './recorrido-traduccion'
import { grupo, texto } from './svg'

export interface SpecTraduccionBusqueda {
  sentido: 'busqueda'
  titulo: string
  bitsSegmento: number
  bitsPagina: number
  bitsOffset: number
  bitsFrame: number
  procesos: {
    pid: string
    segmentos: { seg: number; nombre?: string; paginas: Record<number, number> }[]
  }[]
  direcciones: { df: number; texto?: string }[]
}

const X0 = 20
const W = 720
const CHIP = 22
const CAJA = 128

export function recorridoTraduccionBusqueda(spec: SpecTraduccionBusqueda): Recorrido {
  const { bitsSegmento: bs, bitsPagina: bp, bitsOffset: bo, bitsFrame: bf } = spec
  const hx = (n: number, w: number) => `${n.toString(16).toUpperCase().padStart(w, '0')}h`
  const dfx = (n: number) => hx(n, Math.ceil((bf + bo) / 4))
  const dlx = (n: number) => hx(n, Math.ceil((bs + bp + bo) / 4))
  const o = (n: number) => hx(n, Math.ceil(bo / 4))

  const tablas = spec.procesos.flatMap((p) =>
    p.segmentos.map((s) => {
      if (s.seg >= 2 ** bs)
        throw new Error(`traduccion: el segmento ${s.seg} no entra en ${bs} bits`)
      const filas = Object.entries(s.paginas)
        .map(([pg, f]) => [+pg, f] as const)
        .sort((a, b) => a[0] - b[0])
      for (const [pg] of filas)
        if (pg >= 2 ** bp)
          throw new Error(`traduccion: la página ${pg} de ${p.pid} no entra en ${bp} bits`)
      const titulo = `${p.pid} · Seg ${s.seg}${s.nombre ? ` (${s.nombre})` : ''}`
      return { pid: p.pid, seg: s.seg, titulo, filas }
    }),
  )

  const dirs = spec.direcciones.map((x) => {
    if (x.df < 0 || x.df >= 2 ** (bf + bo))
      throw new Error(`traduccion: ${dfx(x.df)} no entra en ${bf + bo} bits`)
    const frame = Math.floor(x.df / 2 ** bo)
    const off = x.df % 2 ** bo
    const hallados = tablas.flatMap((t) =>
      t.filas.filter(([, f]) => f === frame).map(([pg]) => ({ t, pg })),
    )
    if (hallados.length > 1)
      throw new Error(
        `traduccion: el frame ${frame} aparece en varias tablas (${hallados.map((h) => h.t.titulo).join(', ')}): la DL no es única`,
      )
    const h = hallados[0]
    const dl = h ? (h.t.seg * 2 ** bp + h.pg) * 2 ** bo + off : null
    return { ...x, frame, off, h, dl }
  })
  type Dir = (typeof dirs)[number]
  const resultado = (x: Dir) => (x.h ? `${x.h.t.pid} · ${dlx(x.dl!)}` : 'libre')

  const celdas = (n: number, grupos: [number, string][], y: number) => {
    const total = grupos.reduce((a, [k]) => a + k, 0)
    const b = bits(n, total)
    const cortes = grupos.map((_, j) => grupos.slice(0, j).reduce((a, [k]) => a + k, 0))
    let cx = X0
    const out = [...b].map((v, i) => {
      const j = cortes.findLastIndex((c) => c <= i)
      const ultimo = j === grupos.length - 1
      if (i > 0 && (cortes.includes(i) || (ultimo && (total - i) % 4 === 0))) cx += 8
      const g =
        `<g class="tr-bit tr-bit-${grupos[j][1]}"><rect x="${cx}" y="${y}" width="22" height="28" rx="4"/>` +
        texto(cx + 11, y + 14, v) +
        '</g>'
      cx += 25
      return g
    })
    return { svg: out.join(''), fin: cx }
  }
  const valor = (x: number, y: number, rotulo: string, v: string, clase: string) =>
    `<text class="rm-izq tr-corte" x="${x}" y="${y}">${rotulo} <tspan class="${clase}">${v}</tspan></text>`
  const titulo = (y: number, t: string) => texto(X0, y, t, { clase: 'rm-izq rm-tabla-tit' })

  const porFila = Math.max(1, Math.floor((W + 12) / (CAJA + 12)))
  const filasMax = Math.max(...tablas.map((t) => t.filas.length))
  const altoCaja = 46 + filasMax * 22 + 6
  const filasCajas = Math.ceil(tablas.length / porFila)
  const yCajas = 112
  const yHallado = yCajas + filasCajas * (altoCaja + 12) + 8
  const yArmar = yHallado + 34

  const paso = (x: Dir) => {
    const corte = celdas(
      x.df,
      [
        [bf, 'frame'],
        [bo, 'off'],
      ],
      24,
    )
    const cajas = tablas
      .map((t, i) => {
        const bx = X0 + (i % porFila) * (CAJA + 12)
        const by = yCajas + Math.floor(i / porFila) * (altoCaja + 12)
        const sel = x.h?.t === t
        return (
          `<g class="tr-caja ${sel ? 'tr-caja-sel' : 'tr-caja-otra'}"><rect x="${bx}" y="${by}" width="${CAJA}" height="${altoCaja}" rx="8"/>` +
          texto(bx + 10, by + 14, t.titulo, { clase: 'rm-izq tr-caja-tit' }) +
          texto(bx + 10, by + 34, 'Pág', { clase: 'rm-izq rm-enc' }) +
          texto(bx + 54, by + 34, 'Frame', { clase: 'rm-izq rm-enc' }) +
          t.filas
            .map(([pg, f], k) => {
              const fy = by + 46 + k * 22
              const es = sel && pg === x.h!.pg
              return (
                `<g class="${es ? 'tr-fila-sel' : 'tr-fila-otra'}">` +
                (es
                  ? `<rect x="${bx + 4}" y="${fy}" width="${CAJA - 8}" height="22" rx="3"/>`
                  : '') +
                texto(bx + 10, fy + 11, String(pg), { clase: 'rm-izq' }) +
                texto(bx + 54, fy + 11, String(f), { clase: es ? 'rm-izq tr-acento' : 'rm-izq' }) +
                '</g>'
              )
            })
            .join('') +
          '</g>'
        )
      })
      .join('')
    const hallado = x.h
      ? `<text class="rm-izq tr-corte" x="${X0}" y="${yHallado}">Está en <tspan class="tr-val">${x.h.t.pid}</tspan>, segmento <tspan class="tr-val-seg">${x.h.t.seg}</tspan>, página <tspan class="tr-val-pag">${x.h.pg}</tspan>. Si no aparece en ninguna tabla, el frame está libre.</text>`
      : `<text class="rm-izq tr-corte" x="${X0}" y="${yHallado}">No aparece en ninguna tabla: el frame <tspan class="tr-val">${x.frame}</tspan> está libre.</text>`
    let armar = titulo(
      yArmar,
      `3. Armar la DL: ${bs} bit${bs > 1 ? 's' : ''} de segmento | ${bp} de página | ${bo} de offset`,
    )
    if (x.h) {
      const dl = celdas(
        x.dl!,
        [
          [bs, 'seg'],
          [bp, 'pag'],
          [bo, 'off'],
        ],
        yArmar + 12,
      )
      armar +=
        dl.svg + texto(dl.fin + 14, yArmar + 26, `= ${dlx(x.dl!)}`, { clase: 'rm-izq tr-dl-res' })
    } else
      armar += texto(X0, yArmar + 26, 'no se arma: el frame no es de ningún proceso', {
        clase: 'rm-izq tr-det',
      })
    return (
      titulo(12, `1. Cortar la DF ${dfx(x.df)}: ${bf} bits de frame | ${bo} de offset`) +
      corte.svg +
      valor(X0, 70, 'frame', String(x.frame), 'tr-acento') +
      valor(X0 + 120, 70, 'offset', o(x.off), 'tr-val') +
      titulo(100, `2. Buscar el frame ${x.frame} en las tablas de páginas`) +
      cajas +
      hallado +
      armar
    )
  }

  const yChips = yArmar + 58
  const chips = (k: number) => {
    let cx = X0
    let fila = 0
    return dirs.map((x, i) => {
      const t = `${dfx(x.df)} → ${i <= k ? resultado(x) : '?'}`
      const clase =
        i > k
          ? 'tr-chip-pendiente'
          : `rm-chip-${x.h ? 'ok' : 'aviso'}${i === k ? ' tr-chip-actual' : ' tr-chip-pasado'}`
      const w = t.length * 6.6 + 16
      if (cx + w > X0 + W && cx > X0) {
        cx = X0
        fila++
      }
      const y = yChips + fila * (CHIP + 6)
      cx += w + 8
      return {
        fila,
        g:
          `<g class="rm-chip ${clase}"><rect x="${cx - w - 8}" y="${y}" width="${w}" height="${CHIP}" rx="4"/>` +
          texto(cx - w - 8 + w / 2, y + CHIP / 2, t) +
          '</g>',
      }
    })
  }
  const chipsPorPaso = dirs.map((_, k) => chips(k))
  const filasChips = Math.max(...chipsPorPaso.map((c) => c.at(-1)!.fila + 1))

  const pasos: Paso[] = dirs.map((x, k) => ({
    titulo: `${dfx(x.df)} → ${resultado(x)}`,
    texto: [
      x.h
        ? `El frame **${x.frame}** es la página ${x.h.pg} del segmento ${x.h.t.seg} de **${x.h.t.pid}**. El offset no cambia al traducir, así que la DL es segmento ${x.h.t.seg} | página ${bits(x.h.pg, bp)} | offset ${o(x.off)} = **${dlx(x.dl!)}**.`
        : `El frame **${x.frame}** no aparece en ninguna tabla de páginas: está **libre** y ninguna dirección lógica lo usa.`,
      x.texto,
    ]
      .filter(Boolean)
      .join(' '),
    resaltar: [`paso-${k}`],
    mostrar: [`paso-${k}`],
    ocultar: dirs.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
  }))

  return {
    ancho: 760,
    alto: yChips + filasChips * (CHIP + 6) + 4,
    titulo: spec.titulo,
    cuerpo: dirs.map((x, k) =>
      grupo(`paso-${k}`, paso(x) + chipsPorPaso[k].map((c) => c.g).join(''), { oculto: true }),
    ),
    pasos,
  }
}
