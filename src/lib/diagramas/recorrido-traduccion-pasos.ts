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

export interface SpecTraduccionPasos {
  sentido: 'pasos'
  titulo: string
  dl: number
  unidad?: 'hexa' | 'decimal'
  acceso?: 'lectura' | 'escritura' | 'ejecucion'
  esquemas: EsquemaPasos[]
}

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
  if (!spec.esquemas?.length) throw new Error('traduccion pasos: falta `esquemas`')
  const variantes = spec.esquemas.map((e, i) => ({
    nombre: e.nombre,
    slides: slidesEsquema(spec, e),
    id: `e${i}`,
  }))
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

function slidesEsquema(spec: SpecTraduccionPasos, e: EsquemaPasos): Slide[] {
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
