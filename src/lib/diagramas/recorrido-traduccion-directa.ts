/** Traducción directa (```traduccion con `sentido: directo`): corte, tablas y chequeos de la MMU. Pura o paginada. */
import type { Paso, Recorrido } from './recorrido'
import { bits } from './recorrido-traduccion'
import { grupo, texto } from './svg'

export interface SegmentoDirecto {
  seg: number
  /** Se muestra al lado del número: "segmento 3 (Heap)". */
  nombre?: string
  /** Solo sin paginación. */
  base?: number
  /** `largo` se compara con < y `limite` (última dirección válida) con ≤. Sin paginación, uno de los dos. */
  largo?: number
  limite?: number
  /** `r` → Read only, `x` → Exec only, `rw` → Read write; en mayúsculas o con guiones (`RW-`) se muestra tal cual. */
  permisos?: string
  /** Con paginación: página → frame (puede ser parcial). */
  paginas?: Record<number, number>
}

export interface SpecTraduccionDirecta {
  sentido: 'directo'
  titulo: string
  /** Sin bits, cada dirección viene ya cortada como `{ seg, desp }`. */
  bitsSegmento?: number
  /** Con bitsPagina es segmentación paginada y bitsOffset es el offset dentro de la página. */
  bitsPagina?: number
  bitsOffset?: number
  unidad?: 'hexa' | 'decimal'
  /** Sin acceso no hay chequeo de permiso. */
  acceso?: 'lectura' | 'escritura' | 'ejecucion'
  segmentos: SegmentoDirecto[]
  direcciones: { dl?: number; seg?: number; desp?: number; texto?: string }[]
}

const X0 = 20
const W = 720
const CHIP = 22
const ETIQUETA: Record<string, string> = {
  r: 'Read only',
  w: 'Write only',
  x: 'Exec only',
  rw: 'Read write',
  rx: 'Read exec',
  rwx: 'Read write exec',
}
const LETRA = { lectura: 'r', escritura: 'w', ejecucion: 'x' }
const VERBO = { lectura: 'leer', escritura: 'escribir', ejecucion: 'ejecutar' }
const DIGITOS = [
  '',
  'el último dígito hexa',
  'los dos últimos dígitos hexa',
  'los tres últimos dígitos hexa',
]

type Estado = 'ok' | 'mal' | 'no'
type Fault = 'límite' | 'permiso' | 'página'

export function recorridoTraduccionDirecta(spec: SpecTraduccionDirecta): Recorrido {
  const bs = spec.bitsSegmento ?? 0
  const bp = spec.bitsPagina ?? 0
  const bo = spec.bitsOffset ?? 0
  const pag = bp > 0
  const dec = spec.unidad === 'decimal'
  const hx = (n: number, w: number) =>
    dec ? String(n) : `${n.toString(16).toUpperCase().padStart(w, '0')}h`
  const d = (n: number) => hx(n, Math.ceil((bs + bp + bo) / 4))
  const od = (n: number) => hx(n, Math.ceil((bp + bo) / 4))
  const o = (n: number) => hx(n, Math.ceil(bo / 4))
  const fr = (n: number) => (dec ? String(n) : `${n} = ${hx(n, 1)}`)
  const tamPag = 2 ** bo
  const acceso = spec.acceso
  const verbo = acceso && VERBO[acceso]

  for (const s of spec.segmentos) {
    if (!pag && s.paginas)
      throw new Error(`traduccion: el segmento ${s.seg} tiene \`paginas\` pero falta bitsPagina`)
    if (s.permisos != null && !/^[rwx-]+$/i.test(s.permisos))
      throw new Error(`traduccion: permisos "${s.permisos}" del segmento ${s.seg} (letras r, w, x)`)
    if (s.largo != null && s.limite != null)
      throw new Error(`traduccion: el segmento ${s.seg} lleva \`largo\` o \`limite\`, no los dos`)
    if (!pag && s.largo == null && s.limite == null)
      throw new Error(
        `traduccion: el segmento ${s.seg} lleva \`largo\` o \`limite\`, uno de los dos`,
      )
    if (!pag && s.base == null)
      throw new Error(`traduccion: al segmento ${s.seg} le falta \`base\``)
    if (pag && !s.paginas) throw new Error(`traduccion: al segmento ${s.seg} le falta \`paginas\``)
    for (const p of Object.keys(s.paginas ?? {}))
      if (+p >= 2 ** bp)
        throw new Error(`traduccion: la página ${p} del segmento ${s.seg} no entra en ${bp} bits`)
  }
  const conTope = spec.segmentos.some((s) => s.limite != null || s.largo != null)
  const conLimite = spec.segmentos.some((s) => s.limite != null)
  const tope = (s: SegmentoDirecto) => s.limite ?? s.largo
  // textos del chequeo según la cátedra dé el largo o la última dirección válida
  const cmp = (s: SegmentoDirecto) =>
    s.limite != null
      ? { tit: 'desplazamiento ≤ límite', ok: '≤', mal: '>', dato: 'el límite', no: 'supera' }
      : {
          tit: 'desplazamiento < largo',
          ok: '<',
          mal: '≥',
          dato: 'el largo',
          no: 'no es menor que',
        }
  const etiqueta = (s: SegmentoDirecto) =>
    !s.permisos
      ? '—'
      : /[A-Z-]/.test(s.permisos)
        ? s.permisos
        : (ETIQUETA[s.permisos] ?? s.permisos.toUpperCase())
  const conSeg = (s: number) => {
    const n = spec.segmentos.find((x) => x.seg === s)?.nombre
    return n ? `${s} (${n})` : String(s)
  }

  const dirs = spec.direcciones.map((x) => {
    const { dl } = x
    if (dl == null && (x.seg == null || x.desp == null))
      throw new Error('traduccion: cada dirección lleva `dl` o `{ seg, desp }`')
    if (dl != null && (!spec.bitsSegmento || !spec.bitsOffset))
      throw new Error(`traduccion: para cortar ${d(dl)} faltan bitsSegmento y bitsOffset`)
    if (dl != null && (dl < 0 || dl >= 2 ** (bs + bp + bo)))
      throw new Error(`traduccion: ${d(dl)} no entra en ${bs + bp + bo} bits`)
    const seg = dl != null ? Math.floor(dl / 2 ** (bp + bo)) : x.seg!
    const desp = dl != null ? dl % 2 ** (bp + bo) : x.desp!
    const nombre = dl != null ? d(dl) : `(${seg}, ${od(desp)})`
    const fila = spec.segmentos.find((s) => s.seg === seg)
    if (!fila) throw new Error(`traduccion: falta el segmento ${seg} en la tabla (${nombre})`)
    const pagina = Math.floor(desp / tamPag)
    const off = desp % tamPag
    const frame = fila.paginas?.[pagina]
    const limiteOk =
      fila.limite != null ? desp <= fila.limite : fila.largo != null ? desp < fila.largo : true
    const permisoOk = !acceso || (fila.permisos ?? '').toLowerCase().includes(LETRA[acceso])
    const paginaOk = !pag || frame != null
    const fault: Fault | null = !limiteOk
      ? 'límite'
      : !permisoOk
        ? 'permiso'
        : !paginaOk
          ? 'página'
          : null
    const df = pag ? frame! * tamPag + off : fila.base! + desp
    return { ...x, dl, nombre, seg, desp, pagina, off, frame, fila, limiteOk, permisoOk, fault, df }
  })
  type Dir = (typeof dirs)[number]
  const resultado = (x: Dir) => (x.fault ? `Fault (${x.fault})` : d(x.df))

  const titulo = (y: number, t: string, x = X0) => texto(x, y, t, { clase: 'rm-izq rm-tabla-tit' })
  const valor = (x: number, y: number, rotulo: string, v: string, clase: string) =>
    `<text class="rm-izq tr-corte" x="${x}" y="${y}">${rotulo} <tspan class="${clase}">${v}</tspan></text>`

  // 1. corte: bits en hexa, división en decimal, o ya cortada
  const corte = (x: Dir) => {
    if (x.dl == null)
      return titulo(
        12,
        `1. La dirección lógica ya viene cortada: segmento ${x.seg} · desplazamiento ${od(x.desp)}`,
      )
    const valores = (y: number) =>
      pag
        ? valor(X0, y, 'segmento', conSeg(x.seg), 'tr-val-seg') +
          (dec ? valor(X0 + 150, y, 'desplazamiento', od(x.desp), 'tr-val') : '') +
          valor(X0 + (dec ? 330 : 150), y, 'página', String(x.pagina), 'tr-val-pag') +
          valor(X0 + (dec ? 450 : 270), y, 'offset', o(x.off), 'tr-val')
        : valor(X0, y, 'segmento', String(x.seg), 'tr-val-seg') +
          valor(X0 + 120, y, 'desplazamiento', od(x.desp), 'tr-val')
    if (dec) {
      const n = 2 ** (bp + bo)
      const linea = (y: number, a: string, q: string, qc: string, m: number, r: string) =>
        `<text class="rm-izq tr-cuenta" x="${X0}" y="${y}">${a} = <tspan class="${qc}">${q}</tspan> × ${m} + <tspan class="tr-val">${r}</tspan></text>`
      return (
        titulo(
          12,
          `1. Cortar ${x.dl} dividiendo: cada segmento abarca 2^${bp + bo} = ${n}` +
            (pag ? ` y cada página ${tamPag}` : ''),
        ) +
        linea(34, String(x.dl), String(x.seg), 'tr-val-seg', n, String(x.desp)) +
        (pag
          ? linea(56, String(x.desp), String(x.pagina), 'tr-val-pag', tamPag, String(x.off))
          : '') +
        valores(pag ? 84 : 62)
      )
    }
    const b = bits(x.dl, bs + bp + bo)
    let cx = X0
    const celdas = [...b].map((v, i) => {
      const tipo = i < bs ? 'seg' : i < bs + bp ? 'pag' : 'off'
      if (i === bs || i === bs + bp || (i > bs + bp && (bs + bp + bo - i) % 4 === 0)) cx += 8
      const g =
        `<g class="tr-bit tr-bit-${tipo}"><rect x="${cx}" y="24" width="22" height="28" rx="4"/>` +
        texto(cx + 11, 38, v) +
        '</g>'
      cx += 25
      return g
    })
    return (
      titulo(
        12,
        pag
          ? `1. Cortar ${d(x.dl)}: ${bs} bits de segmento | ${bp} de página | ${bo} de offset`
          : `1. Cortar ${d(x.dl)}: ${bs} bits de segmento | ${bo} de desplazamiento`,
      ) +
      celdas.join('') +
      valores(70)
    )
  }

  const y2 = !dirs.some((x) => x.dl != null) ? 40 : dec && pag ? 114 : dec ? 92 : 100
  const tabla = (
    y: number,
    tit: string,
    encab: string[],
    anchos: number[],
    filas: { celdas: string[]; sel: boolean; mal?: number; acento?: number }[],
    apagada: boolean,
  ) => {
    const xs = anchos.map((_, j) => X0 + anchos.slice(0, j).reduce((a, b) => a + b, 0))
    const ancho = anchos.reduce((a, b) => a + b, 0)
    return (
      `<g class="${apagada ? 'tr-tabla-no' : ''}">` +
      titulo(y, tit) +
      encab.map((t, j) => texto(xs[j] + 10, y + 22, t, { clase: 'rm-izq rm-enc' })).join('') +
      filas
        .map((f, i) => {
          const fy = y + 34 + i * 24
          const sel = f.sel && !apagada
          return (
            `<g class="${sel ? 'tr-fila-sel' : 'tr-fila-otra'}">` +
            (sel ? `<rect x="${X0}" y="${fy}" width="${ancho}" height="24" rx="3"/>` : '') +
            f.celdas
              .map((c, j) =>
                texto(xs[j] + 10, fy + 12, c, {
                  clase:
                    j === f.mal ? 'rm-izq tr-mal' : j === f.acento ? 'rm-izq tr-acento' : 'rm-izq',
                }),
              )
              .join('') +
            '</g>'
          )
        })
        .join('') +
      '</g>'
    )
  }

  // la tabla de segmentos se muestra si hay algo que mirar en ella (base, límite o permiso)
  const tablaSeg = !pag || conTope || !!acceso
  const encSeg = [
    'Seg',
    ...(pag ? [] : ['Base']),
    ...(conTope ? [conLimite ? 'Límite' : 'Largo'] : []),
    ...(acceso ? [pag ? 'Permisos' : 'Protección'] : []),
  ]
  const anchosSeg = encSeg.map((t) => ({ Seg: 40, Protección: 100, Permisos: 84 })[t] ?? 76)
  const ySegFin = tablaSeg ? y2 + 34 + spec.segmentos.length * 24 : y2 - 24
  const yPag = ySegFin + 24
  const nTablaPag = tablaSeg ? 3 : 2
  const tablas = (x: Dir) => {
    const iTope = encSeg.findIndex((t) => t === 'Largo' || t === 'Límite')
    const iPerm = encSeg.findIndex((t) => t === 'Protección' || t === 'Permisos')
    const seg = !tablaSeg
      ? ''
      : tabla(
          y2,
          `2. Buscar la fila del segmento ${x.seg}`,
          encSeg,
          anchosSeg,
          spec.segmentos.map((s) => {
            const sel = s === x.fila
            return {
              celdas: [
                String(s.seg),
                ...(pag ? [] : [d(s.base!)]),
                ...(conTope ? [tope(s) != null ? d(tope(s)!) : '—'] : []),
                ...(acceso ? [etiqueta(s)] : []),
              ],
              sel,
              mal: sel && x.fault === 'límite' ? iTope : sel && x.fault === 'permiso' ? iPerm : -1,
            }
          }),
          false,
        )
    if (!pag) return seg
    const conPerm = !tablaSeg && x.fila.permisos != null
    const entradas = Object.entries(x.fila.paginas!).map(([p, f]) => [+p, f] as const)
    return (
      seg +
      tabla(
        yPag,
        `${nTablaPag}. Tabla de páginas del segmento ${conSeg(x.seg)}`,
        ['Pág', 'Frame', ...(conPerm ? ['Permisos'] : [])],
        [44, 64, 84],
        entradas
          .sort((a, b) => a[0] - b[0])
          .map(([p, f]) => ({
            celdas: [String(p), String(f), ...(conPerm ? [etiqueta(x.fila)] : [])],
            sel: p === x.pagina,
            acento: p === x.pagina ? 1 : -1,
          })),
        x.fault === 'límite' || x.fault === 'permiso',
      )
    )
  }
  const filasPag = Math.max(0, ...spec.segmentos.map((s) => Object.keys(s.paginas ?? {}).length))
  const yIzqFin = pag ? yPag + 34 + filasPag * 24 : ySegFin

  const xc = X0 + 310
  const chequeo = (i: number, estado: Estado, tit: string, detalle?: string) => {
    const y = y2 + 12 + i * 48
    return (
      `<g class="tr-chk tr-chk-${estado}"><rect x="${xc}" y="${y}" width="${W - 310}" height="40" rx="6"/>` +
      texto(xc + 16, y + 20, estado === 'ok' ? '✓' : estado === 'mal' ? '✗' : '–', {
        clase: 'tr-marca',
      }) +
      (detalle
        ? texto(xc + 32, y + 12, tit, { clase: 'rm-izq tr-chk-tit' }) +
          texto(xc + 32, y + 29, detalle, { clase: 'rm-izq tr-det' })
        : texto(xc + 32, y + 20, tit, { clase: 'rm-izq tr-chk-tit' })) +
      '</g>'
    )
  }
  const nChequeos = (conTope ? 1 : 0) + (acceso ? 1 : 0) + (pag ? 1 : 0) + 1
  const chequeos = (x: Dir) => {
    // [estado, título, detalle] en el orden de la MMU; lo que viene después de un fallo no se llega
    const lista: [boolean, string, string, string][] = []
    if (conTope && tope(x.fila) != null) {
      const c = cmp(x.fila)
      const l = od(tope(x.fila)!)
      lista.push([
        x.limiteOk,
        c.tit,
        `${od(x.desp)} ${c.ok} ${l}`,
        `${od(x.desp)} ${c.mal} ${l} → segmentation fault`,
      ])
    }
    if (acceso) {
      const et = etiqueta(x.fila)
      lista.push([
        x.permisoOk,
        'modo de acceso permitido',
        `${et} permite ${verbo}`,
        `${verbo} en un segmento ${et} → fault por permiso`,
      ])
    }
    if (pag)
      lista.push([
        x.frame != null,
        'la página tiene frame',
        `página ${x.pagina} → frame ${x.frame != null ? fr(x.frame) : ''}`,
        `la página ${x.pagina} no tiene frame → fault`,
      ])
    const tituloDF = pag
      ? dec
        ? 'DF = frame × tamaño de página + offset'
        : 'DF = frame | offset'
      : 'DF = base + desplazamiento'
    const cuentaDF = pag
      ? dec
        ? `${x.frame} × ${tamPag} + ${x.off} = ${x.df}`
        : `${hx(x.frame ?? 0, 1)} | ${o(x.off)} = ${d(x.df)}`
      : `${d(x.fila.base ?? 0)} + ${od(x.desp)} = ${d(x.df)}`
    let fallo = false
    const out = lista.map(([ok, tit, siOk, siMal], i) => {
      if (fallo) {
        // "además" solo para el permiso que también habría fallado
        const ademas =
          tit === 'modo de acceso permitido' && !ok ? ` (además es ${etiqueta(x.fila)})` : ''
        return chequeo(i, 'no', tit, `no se llega${ademas}`)
      }
      if (!ok) fallo = true
      return chequeo(i, ok ? 'ok' : 'mal', tit, ok ? siOk : siMal)
    })
    out.push(
      x.fault
        ? chequeo(lista.length, 'no', `${tituloDF} (no se calcula)`)
        : chequeo(lista.length, 'ok', tituloDF, cuentaDF),
    )
    return titulo(y2, `${pag ? nTablaPag + 1 : 3}. Chequeos de la MMU, en orden`, xc) + out.join('')
  }

  const yChips = Math.max(yIzqFin, y2 + 12 + nChequeos * 48) + 16
  const chips = (k: number) => {
    let cx = X0
    let fila = 0
    return dirs.map((x, i) => {
      const t = `${x.nombre} → ${i <= k ? resultado(x) : '?'}`
      const clase =
        i > k
          ? 'tr-chip-pendiente'
          : `rm-chip-${x.fault ? 'mal' : 'ok'}${i === k ? ' tr-chip-actual' : ' tr-chip-pasado'}`
      const w = t.length * 6.6 + 16
      if (cx + w > X0 + W && cx > X0) {
        cx = X0
        fila++
      }
      const y = yChips + fila * (CHIP + 6)
      const g =
        `<g class="rm-chip ${clase}"><rect x="${cx}" y="${y}" width="${w}" height="${CHIP}" rx="4"/>` +
        texto(cx + w / 2, y + CHIP / 2, t) +
        '</g>'
      cx += w + 8
      return { g, fila }
    })
  }
  const chipsPorPaso = dirs.map((_, k) => chips(k))
  const filasChips = Math.max(...chipsPorPaso.map((c) => c.at(-1)!.fila + 1))

  const porque = (x: Dir) => {
    const et = etiqueta(x.fila)
    const t = tope(x.fila)
    const c = cmp(x.fila)
    if (x.fault === 'límite')
      return `El primer chequeo ya falla: el desplazamiento **${od(x.desp)}** ${c.no} ${c.dato} **${od(t!)}**, así que la MMU corta con **segmentation fault**${acceso ? ' sin mirar el permiso' : pag ? ' sin mirar la tabla de páginas' : ''}.`
    if (x.fault === 'permiso')
      return `${t != null ? `El desplazamiento **${od(x.desp)}** entra en ${c.dato} **${od(t)}**, pero el` : 'El'} segmento ${x.seg} es **${et}**: no permite ${verbo}, así que la MMU corta con **fault por permiso**.`
    if (x.fault === 'página')
      return `La página **${x.pagina}** del segmento ${conSeg(x.seg)} no tiene frame asignado, así que la MMU corta con un **fault**.`
    if (!pag)
      return acceso
        ? `Pasa los dos chequeos: ${od(x.desp)} ${c.ok} ${od(t!)} y el segmento ${x.seg} es **${et}**, que permite ${verbo}. DF = ${d(x.fila.base!)} + ${od(x.desp)} = **${d(x.df)}**.`
        : `El desplazamiento ${od(x.desp)} entra en ${c.dato} ${od(t!)}: DF = ${d(x.fila.base!)} + ${od(x.desp)} = **${d(x.df)}**.`
    const previos = [
      t != null ? `el límite (**${od(x.desp)} ${c.ok} ${od(t)}**)` : '',
      acceso ? `el segmento ${x.seg} es **${et}**, que permite ${verbo}` : '',
    ].filter(Boolean)
    const pasa = previos.length
      ? `${t != null ? 'Pasa ' : ''}${previos.join(' y ')}. `.replace(/^el segmento/, 'El segmento')
      : ''
    const donde = `La página **${x.pagina}** del segmento ${conSeg(x.seg)} está en el frame **${fr(x.frame!)}**`
    if (dec) return `${pasa}${donde}: DF = ${x.frame} × ${tamPag} + ${x.off} = **${x.df}**.`
    const cola =
      bo % 4 === 0 && bo <= 12
        ? `. Las páginas son de ${tamPag} B, así que el offset son ${DIGITOS[bo / 4]} y la DF se arma pegando frame y offset: **${d(x.df)}**.`
        : `: DF = ${hx(x.frame!, 1)} | ${o(x.off)} = **${d(x.df)}**.`
    return `${pasa}${donde}${cola}`
  }

  const pasos: Paso[] = dirs.map((x, k) => ({
    titulo: `${x.nombre} → ${resultado(x)}`,
    texto: [porque(x), x.texto].filter(Boolean).join(' '),
    resaltar: [`paso-${k}`],
    mostrar: [`paso-${k}`],
    ocultar: dirs.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
  }))

  return {
    ancho: 760,
    alto: yChips + filasChips * (CHIP + 6) + 4,
    titulo: spec.titulo,
    cuerpo: dirs.map((x, k) =>
      grupo(
        `paso-${k}`,
        corte(x) + tablas(x) + chequeos(x) + chipsPorPaso[k].map((c) => c.g).join(''),
        { oculto: true },
      ),
    ),
    pasos,
  }
}
