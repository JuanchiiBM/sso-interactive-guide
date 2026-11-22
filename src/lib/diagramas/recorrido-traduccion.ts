/** Resolución gráfica de una traducción inversa (```traduccion): corte de bits, base = DF − offset y la barra. */
import type { Paso, Recorrido } from './recorrido'
import { grupo, texto } from './svg'

export interface SpecTraduccion {
  titulo: string
  total: number
  bitsSegmento: number
  bitsOffset: number
  proceso: string
  /** `tam` lo deduce el autor (dato, última dirección válida, fin de memoria) y lo explica en `texto`. */
  direcciones: { dl: number; df: number; tam: number; texto?: string }[]
}

const X0 = 20
const W = 720
const BARRA = 44

export function recorridoTraduccion(spec: SpecTraduccion): Recorrido {
  const hx = (n: number) => `${n.toString(16).toUpperCase().padStart(4, '0')}h`
  const kib = (n: number) => (n % 1024 === 0 ? `${n / 1024} KiB` : `${n} B`)
  const px = (v: number) => X0 + (v / spec.total) * W
  const bits = (n: number, k: number) => n.toString(2).padStart(k, '0')
  // agrupa de a 4 desde la derecha, como se escribe en la pizarra
  const nibbles = (b: string) => b.replace(/\B(?=(\d{4})+$)/g, ' ')

  const segs = spec.direcciones.map((d) => {
    const seg = d.dl >> spec.bitsOffset
    const off = d.dl & ((1 << spec.bitsOffset) - 1)
    const base = d.df - off
    if (base < 0 || base + d.tam > spec.total)
      throw new Error(`traduccion: la base de ${hx(d.dl)} (${base}) cae fuera de la memoria`)
    return { ...d, seg, off, base, nombre: `${spec.proceso}.S${seg}` }
  })
  const ordenados = [...segs].sort((a, b) => a.base - b.base)
  const huecos: { inicio: number; tam: number }[] = []
  let dir = 0
  for (const s of ordenados) {
    if (s.base < dir) throw new Error(`traduccion: ${s.nombre} se superpone con otro segmento`)
    if (s.base > dir) huecos.push({ inicio: dir, tam: s.base - dir })
    dir = s.base + s.tam
  }
  if (dir < spec.total) huecos.push({ inicio: dir, tam: spec.total - dir })
  const rango = (h: { inicio: number; tam: number }) =>
    `[${hx(h.inicio)}, ${hx(h.inicio + h.tam)}) ${kib(h.tam)}`

  const yBarra = 150
  const parte = (x0: number, w: number, clase: string, l1: string, l2: string) =>
    `<g class="rm-seg ${clase}"><rect x="${x0}" y="${yBarra}" width="${w}" height="${BARRA}" rx="3"/>` +
    (w < 40
      ? ''
      : texto(x0 + w / 2, yBarra + BARRA / 2 - 7, l1, { clase: 'rm-etq' }) +
        texto(x0 + w / 2, yBarra + BARRA / 2 + 9, l2, { clase: 'rm-etq rm-chica rm-sub' })) +
    '</g>'
  const barra = (hasta: number, final: boolean) => {
    const vistos = segs.slice(0, hasta + 1)
    const ocupados = vistos.map((s, k) =>
      parte(
        px(s.base),
        px(s.base + s.tam) - px(s.base),
        `rm-p1${k === hasta && !final ? ' rm-nuevo' : ''}`,
        s.nombre,
        hx(s.base),
      ),
    )
    const libres = final
      ? huecos.map((h) =>
          parte(
            px(h.inicio),
            px(h.inicio + h.tam) - px(h.inicio),
            'rm-hueco rm-rayado',
            'libre',
            kib(h.tam),
          ),
        )
      : []
    return [...libres, ...ocupados].join('')
  }

  const paso = (s: (typeof segs)[number], k: number) => {
    const b = bits(s.dl, spec.bitsSegmento + spec.bitsOffset)
    const cajaSeg = spec.bitsSegmento * 11 + 20
    const offTxt = nibbles(b.slice(spec.bitsSegmento))
    const cajaOff = offTxt.length * 9 + 20
    const corte =
      texto(
        X0,
        12,
        `1. Cortar la dirección lógica: ${spec.bitsSegmento} bits de segmento | ${spec.bitsOffset} bits de offset`,
        { clase: 'rm-izq rm-tabla-tit' },
      ) +
      `<g class="tr-bits-seg"><rect x="${X0}" y="24" width="${cajaSeg}" height="28" rx="4"/>` +
      texto(X0 + cajaSeg / 2, 38, b.slice(0, spec.bitsSegmento)) +
      `</g><g class="tr-bits-off"><rect x="${X0 + cajaSeg + 2}" y="24" width="${cajaOff}" height="28" rx="4"/>` +
      texto(X0 + cajaSeg + 2 + cajaOff / 2, 38, offTxt) +
      '</g>' +
      texto(X0 + cajaSeg + cajaOff + 16, 38, `→ segmento ${s.seg} · offset ${hx(s.off)}`, {
        clase: 'rm-izq',
      })
    const cuenta =
      texto(X0, 74, '2. La DF es base + offset, entonces base = DF − offset', {
        clase: 'rm-izq rm-tabla-tit',
      }) +
      texto(
        X0,
        96,
        `${hx(s.df)} − ${hx(s.off)} = ${hx(s.base)} · tamaño ${hx(s.tam)} (${kib(s.tam)})`,
        { clase: 'rm-izq tr-cuenta' },
      )
    const ubicar =
      texto(X0, 122, '3. Ubicarlo en la memoria', { clase: 'rm-izq rm-tabla-tit' }) +
      barra(k, false) +
      `<line class="tr-df" x1="${px(s.df)}" y1="${yBarra - 8}" x2="${px(s.df)}" y2="${yBarra + BARRA + 6}"/>` +
      texto(px(s.df), yBarra - 14, `DF ${hx(s.df)}`, { clase: 'tr-df-etq' })
    return grupo(`paso-${k}`, corte + cuenta + ubicar, { oculto: true })
  }

  const tabla = () => {
    const col = [X0, X0 + 80, X0 + 220]
    const filas = [...segs]
      .sort((a, b) => a.seg - b.seg)
      .map((s) => [String(s.seg), hx(s.base), hx(s.tam)])
    return grupo(
      `paso-${segs.length}`,
      texto(X0, 122, `Memoria de ${spec.proceso}`, { clase: 'rm-izq rm-tabla-tit' }) +
        barra(segs.length - 1, true) +
        texto(X0, 228, `Tabla de segmentos de ${spec.proceso}`, { clase: 'rm-izq rm-tabla-tit' }) +
        ['Seg', 'Base', 'Tamaño']
          .map((t, j) => texto(col[j] + 8, 248, t, { clase: 'rm-izq rm-enc' }))
          .join('') +
        filas
          .map(
            (f, i) =>
              `<g class="rm-fila">${f.map((c, j) => texto(col[j] + 8, 268 + i * 20, c, { clase: 'rm-izq' })).join('')}</g>`,
          )
          .join(''),
      { oculto: true },
    )
  }

  const ids = [...segs.map((_, k) => `paso-${k}`), `paso-${segs.length}`]
  const ver = (k: number) => ({
    resaltar: [ids[k]],
    mostrar: [ids[k]],
    ocultar: ids.filter((_, i) => i !== k),
  })
  const pasos: Paso[] = segs.map((s, k) => {
    const b = bits(s.dl, spec.bitsSegmento + spec.bitsOffset)
    const corte = `${b.slice(0, spec.bitsSegmento)} | ${nibbles(b.slice(spec.bitsSegmento))}`
    return {
      titulo: `DL ${hx(s.dl)} → DF ${hx(s.df)}`,
      texto: [
        `\`${hx(s.dl)}\` = \`${corte}\` → segmento **${s.seg}**, offset **${hx(s.off)}**. Base = DF − offset: ${hx(s.df)} − ${hx(s.off)} = **${hx(s.base)}**.`,
        s.texto,
      ]
        .filter(Boolean)
        .join(' '),
      ...ver(k),
    }
  })
  pasos.push({
    titulo: 'Tabla de segmentos',
    texto: `Con las bases y los tamaños queda la tabla de ${spec.proceso}. Huecos libres: ${huecos.map(rango).join(' y ')}.`,
    ...ver(segs.length),
  })
  const marcas = Array.from({ length: 9 }, (_, k) => (spec.total / 8) * k).map((v, k) =>
    texto(px(v), yBarra + BARRA + 18, hx(v), {
      clase: `rm-marca${k === 0 ? ' rm-izq' : k === 8 ? ' rm-der' : ''}`,
    }),
  )
  return {
    ancho: 760,
    alto: 268 + segs.length * 20 + 12,
    titulo: spec.titulo,
    cuerpo: [
      `<defs><pattern id="rm-rayas" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="rm-raya-fondo" width="8" height="8"/><line class="rm-raya" x1="0" y1="0" x2="0" y2="8"/></pattern></defs>`,
      ...segs.map(paso),
      tabla(),
      ...marcas,
    ],
    pasos,
  }
}
