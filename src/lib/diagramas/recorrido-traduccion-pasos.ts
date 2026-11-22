/** ```traduccion con `sentido: pasos`: una DL, una slide por paso de la receta y una pestaña por esquema (Metodología). */
import type { Paso, Recorrido, Variante } from './recorrido'
import { bits } from './recorrido-traduccion'
import type { SegmentoDirecto } from './recorrido-traduccion-directa'
import { grupo, texto } from './svg'

export interface EsquemaPasos {
  nombre: string
  /** Sin bitsSegmento es paginación pura; sin bitsPagina, segmentación pura. */
  bitsSegmento?: number
  bitsPagina?: number
  bitsOffset: number
  segmentos?: SegmentoDirecto[]
  /** Solo paginación pura: página → frame. */
  paginas?: Record<number, number>
}

/** DL → DF: la misma DL en cada esquema (una pestaña por esquema). */
export interface SpecDirectaPasos {
  sentido: 'pasos'
  titulo: string
  dl: number
  unidad?: 'hexa' | 'decimal'
  acceso?: 'lectura' | 'escritura' | 'ejecucion'
  esquemas: EsquemaPasos[]
}

/** DF → DL: cortar la DF, buscar el frame en todas las tablas y armar la DL. */
export interface SpecBusquedaPasos {
  sentido: 'pasos'
  titulo: string
  df: number
  bitsSegmento: number
  bitsPagina: number
  bitsOffset: number
  bitsFrame: number
  procesos: { pid: string; segmentos: { seg: number; paginas: Record<number, number> }[] }[]
}

/** Reconstruir un segmento: base desde "DL → DF" y tamaño desde "última válida" o "al final". */
export interface SpecReconstruirPasos {
  sentido: 'pasos'
  titulo: string
  bitsSegmento: number
  bitsOffset: number
  /** Tamaño de la memoria; hace falta para `alFinal`. */
  total?: number
  pistas: ({ dl: number; df: number } | { ultima: number } | { alFinal: true })[]
}

export type SpecTraduccionPasos = SpecDirectaPasos | SpecBusquedaPasos | SpecReconstruirPasos

const X0 = 20
const ANCHO = 760
const Y = 52 // debajo de los chips de lo ya resuelto
const LETRA = { lectura: 'r', escritura: 'w', ejecucion: 'x' }
const PIDE = { lectura: 'R', escritura: 'W', ejecucion: 'X' }
const VERBO = { lectura: 'Leer', escritura: 'Escribir', ejecucion: 'Ejecutar' }

interface Slide {
  titulo: string
  texto: string
  svg: string
  alto: number
}

export function recorridoTraduccionPasos(spec: SpecTraduccionPasos): Recorrido {
  const grupos: { nombre: string; slides: Slide[] }[] =
    'esquemas' in spec && spec.esquemas?.length
      ? spec.esquemas.map((e) => ({ nombre: e.nombre, slides: slidesEsquema(spec, e) }))
      : 'df' in spec
        ? [{ nombre: '', slides: slidesBusqueda(spec) }]
        : 'pistas' in spec
          ? [{ nombre: '', slides: slidesReconstruir(spec) }]
          : []
  if (!grupos.length)
    throw new Error('traduccion pasos: lleva `dl` y `esquemas`, `df` y `procesos`, o `pistas`')
  const variantes = grupos.map((g, i) => ({ ...g, id: `e${i}` }))
  const ids = variantes.flatMap((v) => v.slides.map((_, k) => `${v.id}-p${k}`))
  const alto = Math.max(...variantes.flatMap((v) => v.slides.map((s) => s.alto))) + 8
  const pasos = (v: (typeof variantes)[number]): Paso[] =>
    v.slides.map((s, k) => ({
      titulo: s.titulo,
      texto: s.texto,
      mostrar: [`${v.id}-p${k}`],
      ocultar: ids.filter((id) => id !== `${v.id}-p${k}`),
    }))
  const cuerpo = variantes.flatMap((v) =>
    v.slides.map((s, k) => grupo(`${v.id}-p${k}`, s.svg, { oculto: true })),
  )
  const base = { ancho: ANCHO, alto, titulo: spec.titulo, cuerpo }
  return variantes.length === 1
    ? { ...base, pasos: pasos(variantes[0]) }
    : {
        ...base,
        variantes: variantes.map((v): Variante => ({ nombre: v.nombre, pasos: pasos(v) })),
      }
}

/** Piezas de una slide: chips de lo ya resuelto arriba, y tablas, chequeos y resultados abajo. */
function armador() {
  const slides: Slide[] = []
  const hechos: { t: string; ok?: boolean }[] = []
  const chips = () => {
    let x = X0
    return hechos
      .map((h) => {
        const w = h.t.length * 6.8 + 16
        const g =
          `<g class="rm-chip${h.ok ? ' rm-chip-ok' : ''}"><rect x="${x}" y="8" width="${w}" height="22" rx="4"/>` +
          texto(x + w / 2, 19, h.t) +
          '</g>'
        x += w + 8
        return g
      })
      .join('')
  }
  const agregar = (titulo: string, txt: string, svg: string, alto: number) => {
    slides.push({
      titulo,
      texto: txt,
      svg: chips() + svg,
      alto: Y + alto,
    })
  }
  const tit = (y: number, t: string, x = X0) => texto(x, y, t, { clase: 'rm-izq rm-tabla-tit' })
  const tabla = (
    x: number,
    y: number,
    titulo: string,
    encab: string[],
    filas: { celdas: string[]; sel: boolean; foco?: number }[],
  ) => {
    const anchos = encab.map((h) => Math.max(56, h.length * 9 + 24))
    const xs = anchos.map((_, j) => x + anchos.slice(0, j).reduce((a, b) => a + b, 0))
    const w = anchos.reduce((a, b) => a + b, 0)
    return {
      svg:
        tit(y, titulo, x) +
        encab.map((h, j) => texto(xs[j] + 10, y + 22, h, { clase: 'rm-izq rm-enc' })).join('') +
        filas
          .map((f, i) => {
            const fy = y + 34 + i * 24
            return (
              `<g class="${f.sel ? 'tr-fila-sel' : 'tr-fila-otra'}">` +
              (f.sel ? `<rect x="${x}" y="${fy}" width="${w}" height="24" rx="3"/>` : '') +
              f.celdas
                .map((c, j) =>
                  texto(xs[j] + 10, fy + 12, c, {
                    clase: j === f.foco ? 'rm-izq tr-acento' : 'rm-izq',
                  }),
                )
                .join('') +
              '</g>'
            )
          })
          .join(''),
      alto: 34 + filas.length * 24,
      ancho: w,
    }
  }
  const chequeo = (x: number, y: number, ok: boolean, t: string) =>
    `<g class="tr-chk tr-chk-${ok ? 'ok' : 'mal'}"><rect x="${x}" y="${y}" width="${t.length * 8 + 48}" height="40" rx="6"/>` +
    texto(x + 18, y + 20, ok ? '✓' : '✗', { clase: 'tr-marca' }) +
    texto(x + 36, y + 20, t, { clase: 'rm-izq tr-chk-tit' }) +
    '</g>'
  const grande = (x: number, y: number, html: string) =>
    `<text class="rm-izq tr-grande" x="${x}" y="${y}">${html}</text>`

  return { slides, hechos, agregar, tit, tabla, chequeo, grande }
}

function slidesEsquema(spec: SpecDirectaPasos, e: EsquemaPasos): Slide[] {
  const bs = e.bitsSegmento ?? 0
  const bp = e.bitsPagina ?? 0
  const bo = e.bitsOffset
  const dec = spec.unidad === 'decimal'
  const total = bs + bp + bo
  const hx = (n: number, w: number) =>
    dec ? String(n) : `${n.toString(16).toUpperCase().padStart(w, '0')}h`
  const d = (n: number) => hx(n, Math.ceil(total / 4))
  const od = (n: number) => hx(n, Math.ceil((bp + bo) / 4))
  const o = (n: number) => hx(n, Math.ceil(bo / 4))
  const f1 = (n: number) => (dec ? String(n) : n.toString(16).toUpperCase())
  if (spec.dl < 0 || spec.dl >= 2 ** total)
    throw new Error(`traduccion pasos (${e.nombre}): ${d(spec.dl)} no entra en ${total} bits`)

  const seg = Math.floor(spec.dl / 2 ** (bp + bo))
  const desp = spec.dl % 2 ** (bp + bo)
  const pagina = Math.floor(desp / 2 ** bo)
  const off = desp % 2 ** bo
  const fila = bs ? e.segmentos?.find((s) => s.seg === seg) : undefined
  if (bs && !fila) throw new Error(`traduccion pasos (${e.nombre}): falta el segmento ${seg}`)
  if (bs && !bp && fila!.base == null)
    throw new Error(`traduccion pasos (${e.nombre}): al segmento ${seg} le falta \`base\``)
  const paginas = bp ? (bs ? fila!.paginas : e.paginas) : undefined
  if (bp && !paginas) throw new Error(`traduccion pasos (${e.nombre}): faltan las páginas`)

  const { slides, hechos, agregar, tit, tabla, chequeo, grande } = armador()

  // tabla de segmentos: base (pura), límite y permisos, con la fila del segmento marcada
  const tope = fila?.limite ?? fila?.largo
  const encSeg = [
    'Seg',
    ...(bp ? [] : ['Base']),
    ...(tope != null ? [fila!.limite != null ? 'Límite' : 'Largo'] : []),
    ...(fila?.permisos ? ['Permisos'] : []),
  ]
  const tablaSeg = (foco: string) =>
    tabla(
      X0,
      Y,
      'Tabla de segmentos',
      encSeg,
      (e.segmentos ?? []).map((s) => ({
        celdas: [
          String(s.seg),
          ...(bp ? [] : [d(s.base ?? 0)]),
          ...(tope != null
            ? [(s.limite ?? s.largo) != null ? od((s.limite ?? s.largo)!) : '—']
            : []),
          ...(fila?.permisos ? [s.permisos ?? '—'] : []),
        ],
        sel: s === fila,
        foco: s === fila ? encSeg.indexOf(foco) : undefined,
      })),
    )

  // 1. corte
  const campos = [
    ...(bs ? [{ n: bs, clase: 'seg' }] : []),
    ...(bp ? [{ n: bp, clase: 'pag' }] : []),
    { n: bo, clase: 'off' },
  ]
  const nombreDesp = bp ? 'offset' : 'desplazamiento'
  const valores = [
    ...(bs ? [`segmento ${seg}`] : []),
    ...(bp ? [`página ${pagina}`] : []),
    `${nombreDesp} ${bp ? o(off) : od(desp)}`,
  ]
  if (dec) {
    const lineas: string[] = []
    if (bs)
      lineas.push(
        `${spec.dl} = <tspan class="tr-val-seg">${seg}</tspan> × ${2 ** (bp + bo)} + <tspan class="tr-val">${desp}</tspan>`,
      )
    if (bp)
      lineas.push(
        `${desp} = <tspan class="tr-val-pag">${pagina}</tspan> × ${2 ** bo} + <tspan class="tr-val">${off}</tspan>`,
      )
    agregar(
      'Corte',
      bs
        ? `Cada segmento abarca 2^${bp + bo} = ${2 ** (bp + bo)}: ${spec.dl} div ${2 ** (bp + bo)} = **${seg}** y el resto, **${desp}**, es el desplazamiento.` +
            (bp
              ? ` Cada página mide ${2 ** bo}: ${desp} div ${2 ** bo} = página **${pagina}**, resto **${off}** = offset.`
              : '')
        : `Cada página mide 2^${bo} = ${2 ** bo}: ${spec.dl} div ${2 ** bo} = página **${pagina}** y el resto, **${off}**, es el offset.`,
      tit(Y, `Cortar ${spec.dl} dividiendo`) +
        lineas
          .map(
            (l, i) => `<text class="rm-izq tr-cuenta" x="${X0}" y="${Y + 30 + i * 26}">${l}</text>`,
          )
          .join(''),
      30 + lineas.length * 26,
    )
  } else {
    const b = bits(spec.dl, total)
    let cx = X0
    const celdas = [...b].map((v, i) => {
      const c = i < bs ? 'seg' : i < bs + bp ? 'pag' : 'off'
      if (i === bs || i === bs + bp) cx += 8
      const g =
        `<g class="tr-bit tr-bit-${c}"><rect x="${cx}" y="${Y + 14}" width="24" height="30" rx="4"/>` +
        texto(cx + 12, Y + 29, v) +
        '</g>'
      cx += 27
      return g
    })
    let vx = X0
    const etiquetas = valores
      .map((t, i) => {
        const clase =
          campos[i].clase === 'seg'
            ? 'tr-val-seg'
            : campos[i].clase === 'pag'
              ? 'tr-val-pag'
              : 'tr-val'
        const g = `<text class="rm-izq tr-corte" x="${vx}" y="${Y + 66}"><tspan class="${clase}">${t}</tspan></text>`
        vx += t.length * 7.4 + 24
        return g
      })
      .join('')
    const arriba = bs + bp
    const nDig = Math.ceil(arriba / 4)
    const hexa = spec.dl
      .toString(16)
      .toUpperCase()
      .padStart(Math.ceil(total / 4), '0')
    // "6 = 01|10": los bits de los primeros dígitos, partidos donde cambia de campo
    const cortes = [bs, bs + bp].filter((c, i, a) => c > 0 && c < nDig * 4 && a.indexOf(c) === i)
    let binario = b.slice(0, nDig * 4)
    for (const c of [...cortes].reverse()) binario = `${binario.slice(0, c)}|${binario.slice(c)}`
    const campoArriba = valores.slice(0, -1).join(', ')
    const textoCorte =
      arriba === 0
        ? ''
        : cortes.length === 0
          ? `Los ${arriba} bits de arriba son ${nDig === 1 ? 'el primer dígito entero' : `los primeros ${nDig} dígitos enteros`}: **${campoArriba}**, sin pasar nada a binario.`
          : `Solo ${nDig === 1 ? 'el primer dígito pasa' : `los primeros ${nDig} dígitos pasan`} a binario: ${hexa.slice(0, nDig)} = ${binario} → **${campoArriba}**` +
            (arriba % 4
              ? `, y los otros ${nDig * 4 - arriba} bits **siguen siendo ${nombreDesp}**.`
              : '.')
    agregar(
      'Corte',
      `${textoCorte} ${bp ? `El offset son ${bo} bits` : `El desplazamiento son ${bp + bo} bits`}: **${bp ? o(off) : od(desp)}**${bp && bo % 4 === 0 ? ' se copia' : ''}.`.trim(),
      tit(
        Y,
        `Cortar ${d(spec.dl)}: ${campos.map((c) => `${c.n} de ${c.clase === 'seg' ? 'segmento' : c.clase === 'pag' ? 'página' : nombreDesp}`).join(' | ')}`,
      ) +
        celdas.join('') +
        etiquetas,
      72,
    )
  }
  hechos.push(...valores.map((t) => ({ t })))

  // 2. límite y 3. permiso (solo con segmentos)
  if (fila && tope != null) {
    const conLimite = fila.limite != null
    const ok = conLimite ? desp <= tope : desp < tope
    const signo = conLimite ? (ok ? '≤' : '>') : ok ? '<' : '≥'
    const t = tablaSeg(conLimite ? 'Límite' : 'Largo')
    agregar(
      'Límite',
      ok
        ? `El desplazamiento${bp ? ' (página | offset)' : ''} es **${od(desp)} ${signo} ${od(tope)}**, ${conLimite ? 'el límite' : 'el largo'} del segmento ${seg}: está adentro.`
        : `El desplazamiento **${od(desp)}** ${signo} ${conLimite ? 'el límite' : 'el largo'} **${od(tope)}**: **segmentation fault**. No se sigue.`,
      t.svg + chequeo(X0 + t.ancho + 40, Y + 30, ok, `${od(desp)} ${signo} ${od(tope)}`),
      t.alto,
    )
    if (!ok) {
      return slides
    }
    hechos.push({ t: '✓ límite', ok: true })
  }
  if (fila?.permisos && spec.acceso) {
    const ok = fila.permisos.toLowerCase().includes(LETRA[spec.acceso])
    const t = tablaSeg('Permisos')
    agregar(
      'Permiso',
      ok
        ? `${VERBO[spec.acceso]} mira la **${PIDE[spec.acceso]}**: ${fila.permisos} la tiene.`
        : `${VERBO[spec.acceso]} mira la **${PIDE[spec.acceso]}** y ${fila.permisos} no la tiene: **fault por permiso**.`,
      t.svg + chequeo(X0 + t.ancho + 40, Y + 30, ok, `${spec.acceso} pide ${PIDE[spec.acceso]}`),
      t.alto,
    )
    if (!ok) {
      return slides
    }
    hechos.push({ t: '✓ permiso', ok: true })
  }

  // 4. tabla de páginas
  let frame: number | undefined
  if (bp) {
    frame = paginas![pagina]
    const t = tabla(
      X0,
      Y,
      bs ? `Tabla de páginas del segmento ${seg}` : 'Tabla de páginas',
      ['Pág', 'Frame'],
      Object.entries(paginas!)
        .map(([p, f]) => [+p, f] as const)
        .sort((a, b) => a[0] - b[0])
        .map(([p, f]) => ({ celdas: [String(p), f1(f)], sel: p === pagina, foco: 1 })),
    )
    agregar(
      'Tabla de páginas',
      frame == null
        ? `La página ${pagina} no tiene frame: **fault**.`
        : `Página = fila, frame = el valor de esa fila: la página ${pagina}${bs ? ` del segmento ${seg}` : ''} está en el frame **${f1(frame)}**.`,
      t.svg +
        (frame != null
          ? grande(
              X0 + t.ancho + 40,
              Y + 56,
              `pág ${pagina} → frame <tspan class="tr-acento">${f1(frame)}</tspan>`,
            )
          : chequeo(X0 + t.ancho + 40, Y + 30, false, `pág ${pagina} sin frame`)),
      t.alto,
    )
    if (frame == null) {
      return slides
    }
    hechos.length = 0
    hechos.push({ t: `frame ${f1(frame)}` }, { t: `offset ${o(off)}` })
  }

  // 5. DF
  const df = bp ? frame! * 2 ** bo + off : fila!.base! + desp
  const cuenta = bp
    ? dec
      ? `${frame} × ${2 ** bo} + ${off} = <tspan class="tr-acento">${df}</tspan>`
      : `${f1(frame!)} | ${o(off).replace(/h$/, '')} = <tspan class="tr-acento">${d(df)}</tspan>`
    : `${d(fila!.base!)} + ${od(desp)} = <tspan class="tr-acento">${d(df)}</tspan>`
  const tSeg = !bp ? tablaSeg('Base') : null
  const xDF = tSeg ? X0 + tSeg.ancho + 40 : X0
  const chipRes = `${d(spec.dl)} → ${d(df)}`
  agregar(
    'DF',
    bp
      ? dec
        ? `DF = frame × tamaño de página + offset = ${frame} × ${2 ** bo} + ${off} = **${df}**.`
        : `DF = frame | offset: se pega el frame adelante del offset. **${d(df)}** (${frame} × ${2 ** bo} + ${off} = ${df}).`
      : `Sin páginas, la DF sale de la base: DF = base + desplazamiento = ${d(fila!.base!)} + ${od(desp)} = **${d(df)}**.`,
    (tSeg?.svg ?? '') +
      tit(
        Y,
        bp
          ? dec
            ? 'DF = frame × tamaño + offset'
            : 'DF = frame | offset'
          : 'DF = base + desplazamiento',
        xDF,
      ) +
      grande(xDF, Y + 40, cuenta) +
      `<g class="rm-chip rm-chip-ok tr-chip-actual"><rect x="${xDF}" y="${Y + 62}" width="${chipRes.length * 6.8 + 16}" height="22" rx="4"/>` +
      texto(xDF + (chipRes.length * 6.8 + 16) / 2, Y + 73, chipRes) +
      '</g>',
    Math.max(tSeg?.alto ?? 0, 88),
  )
  return slides
}

/** Bits en casillas; deja un hueco donde cambia de campo. `clases`: seg, pag, off o frame. */
function filaBits(b: string, clases: string[], y: number): string {
  let x = X0
  return [...b]
    .map((v, i) => {
      if (i > 0 && clases[i] !== clases[i - 1]) x += 8
      const g =
        `<g class="tr-bit tr-bit-${clases[i]}"><rect x="${x}" y="${y}" width="24" height="30" rx="4"/>` +
        texto(x + 12, y + 15, v) +
        '</g>'
      x += 27
      return g
    })
    .join('')
}

const hexa = (n: number, b: number) =>
  `${n
    .toString(16)
    .toUpperCase()
    .padStart(Math.ceil(b / 4), '0')}h`

function slidesBusqueda(spec: SpecBusquedaPasos): Slide[] {
  const { bitsSegmento: bs, bitsPagina: bp, bitsOffset: bo, bitsFrame: bf } = spec
  const { slides, hechos, agregar, tit, tabla, grande } = armador()
  if (spec.df < 0 || spec.df >= 2 ** (bf + bo))
    throw new Error(`traduccion pasos: ${hexa(spec.df, bf + bo)} no entra en ${bf + bo} bits`)
  const frame = Math.floor(spec.df / 2 ** bo)
  const off = spec.df % 2 ** bo
  const F = frame.toString(16).toUpperCase()
  const b = bits(spec.df, bf + bo)
  agregar(
    'Corte de la DF',
    `La DF es | frame | offset |: ${bf} bits de frame y ${bo} de offset. ${hexa(spec.df, bf + bo)} → frame **${F}${frame > 9 ? ` = ${frame}` : ''}** y offset **${hexa(off, bo)}**, que se copia a la DL.`,
    tit(Y, `Cortar ${hexa(spec.df, bf + bo)}: ${bf} de frame | ${bo} de offset`) +
      filaBits(
        b,
        [...b].map((_, i) => (i < bf ? 'frame' : 'off')),
        Y + 14,
      ) +
      `<text class="rm-izq tr-corte" x="${X0}" y="${Y + 66}"><tspan class="tr-acento">frame ${F}</tspan>   <tspan class="tr-val">offset ${hexa(off, bo)}</tspan></text>`,
    72,
  )
  hechos.push({ t: `frame ${F}` }, { t: `offset ${hexa(off, bo)}` })

  const tablas = spec.procesos.flatMap((p) => p.segmentos.map((sg) => ({ pid: p.pid, ...sg })))
  const duenos = tablas.filter((t) => Object.values(t.paginas).includes(frame))
  if (duenos.length > 1)
    throw new Error(`traduccion pasos: el frame ${F} está en dos tablas; la DL no es única`)
  const dueno = duenos[0]
  const pagina = dueno ? +Object.entries(dueno.paginas).find(([, f]) => f === frame)![0] : -1
  let x = X0
  let alto = 0
  const svgTablas = tablas
    .map((t) => {
      const tb = tabla(
        x,
        Y,
        `${t.pid} · seg ${t.seg}`,
        ['Pág', 'Frame'],
        Object.entries(t.paginas).map(([pg, f]) => ({
          celdas: [pg, f.toString(16).toUpperCase()],
          sel: t === dueno && +pg === pagina,
          foco: 1,
        })),
      )
      x += tb.ancho + 24
      alto = Math.max(alto, tb.alto)
      return t === dueno ? tb.svg : `<g class="tr-caja-otra">${tb.svg}</g>`
    })
    .join('')
  agregar(
    'Buscar el frame',
    dueno
      ? `La tabla va de página a frame: para ir al revés se busca el ${F} en **todas** las tablas. Está en la de **${dueno.pid}**, segmento ${dueno.seg}, fila **${pagina}**.`
      : `El frame ${F} no está en ninguna tabla: está **libre**, no corresponde a ninguna DL.`,
    svgTablas,
    alto,
  )
  if (!dueno) return slides
  hechos.length = 0
  hechos.push(
    { t: dueno.pid },
    { t: `seg ${dueno.seg}` },
    { t: `pág ${pagina}` },
    { t: `offset ${hexa(off, bo)}` },
  )

  const total = bs + bp + bo
  const dl = (dueno.seg * 2 ** bp + pagina) * 2 ** bo + off
  const bl = bits(dl, total)
  agregar(
    'Armar la DL',
    `Se pegan segmento, página y offset: ${bits(dueno.seg, bs)} | ${bits(pagina, bp)} | ${hexa(off, bo)} → DL = **${hexa(dl, total)} del ${dueno.pid}**.`,
    tit(Y, `DL = ${bs} de segmento | ${bp} de página | ${bo} de offset`) +
      filaBits(
        bl,
        [...bl].map((_, i) => (i < bs ? 'seg' : i < bs + bp ? 'pag' : 'off')),
        Y + 14,
      ) +
      grande(
        X0,
        Y + 82,
        `DL = <tspan class="tr-acento">${hexa(dl, total)}</tspan> del ${dueno.pid}`,
      ),
    90,
  )
  return slides
}

function slidesReconstruir(spec: SpecReconstruirPasos): Slide[] {
  const { bitsSegmento: bs, bitsOffset: bo } = spec
  const { slides, hechos, agregar, tit, tabla, grande } = armador()
  const total = bs + bo
  const h = (n: number) => hexa(n, total)
  const corte = (dl: number) => {
    const b = bits(dl, total)
    return {
      seg: Math.floor(dl / 2 ** bo),
      off: dl % 2 ** bo,
      svg: filaBits(
        b,
        [...b].map((_, i) => (i < bs ? 'seg' : 'off')),
        Y + 14,
      ),
    }
  }
  let seg: number | undefined
  let base: number | undefined
  let tam: number | undefined
  const mismo = (n: number) => {
    if (seg != null && n !== seg)
      throw new Error(`traduccion pasos: las pistas hablan de los segmentos ${seg} y ${n}`)
    seg = n
  }
  for (const p of spec.pistas) {
    if ('df' in p) {
      const c = corte(p.dl)
      mismo(c.seg)
      agregar(
        'Corte',
        `La pista dice que ${h(p.dl)} → ${h(p.df)}. En segmentación pura la DL es | segmento | desplazamiento |: ${bs} y ${bo} bits. Segmento **${c.seg}**, desplazamiento **${h(c.off)}**.`,
        tit(Y, `Cortar ${h(p.dl)}: ${bs} de segmento | ${bo} de desplazamiento`) + c.svg,
        48,
      )
      hechos.push({ t: `seg ${c.seg}` }, { t: `desp ${h(c.off)}` })
      base = p.df - c.off
      agregar(
        'Base',
        `La MMU hace DF = base + desplazamiento; se despeja: base = ${h(p.df)} − ${h(c.off)} = **${h(base)}**.`,
        tit(Y, 'base = DF − desplazamiento') +
          grande(
            X0,
            Y + 40,
            `${h(p.df)} − ${h(c.off)} = <tspan class="tr-acento">${h(base)}</tspan>`,
          ),
        56,
      )
      hechos.length = 0
      hechos.push({ t: `seg ${c.seg}` }, { t: `base ${h(base)}` })
    } else if ('ultima' in p) {
      const c = corte(p.ultima)
      mismo(c.seg)
      tam = c.off + 1
      agregar(
        'Tamaño',
        `${h(p.ultima)} es la **última** dirección válida del segmento ${c.seg}: su desplazamiento ${h(c.off)} es el último byte. Como cuenta desde 0, tamaño = ${h(c.off)} + 1 = **${h(tam)}**.`,
        tit(Y, `Cortar ${h(p.ultima)} y sumar 1`) +
          c.svg +
          grande(X0, Y + 82, `${h(c.off)} + 1 = <tspan class="tr-acento">${h(tam)}</tspan>`),
        90,
      )
    } else {
      if (base == null || spec.total == null)
        throw new Error('traduccion pasos: `alFinal` necesita `total` y una pista de base antes')
      tam = spec.total - base
      agregar(
        'Tamaño',
        `Termina justo al final de la memoria (${h(spec.total)}): tamaño = ${h(spec.total)} − ${h(base)} = **${h(tam)}**.`,
        tit(Y, 'tamaño = fin de la memoria − base') +
          grande(
            X0,
            Y + 40,
            `${h(spec.total)} − ${h(base)} = <tspan class="tr-acento">${h(tam)}</tspan>`,
          ),
        56,
      )
    }
  }
  if (seg == null || base == null || tam == null)
    throw new Error('traduccion pasos: hacen falta una pista de base y una de tamaño')
  hechos.length = 0
  const t = tabla(
    X0,
    Y,
    'Tabla de segmentos',
    ['Seg', 'Base', 'Tamaño', 'Fin'],
    [{ celdas: [String(seg), h(base), h(tam), h(base + tam)], sel: true, foco: 2 }],
  )
  agregar(
    'Fila de la tabla',
    `Queda la fila del segmento ${seg}: base **${h(base)}** y tamaño **${h(tam)}**. El fin (${h(base + tam)}) es base + tamaño: no confundirlo con el tamaño.`,
    t.svg,
    t.alto,
  )
  return slides
}
