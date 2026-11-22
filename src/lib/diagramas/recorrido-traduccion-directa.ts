/** Traducción directa (```traduccion con `sentido: directo`): corte de bits, fila de la tabla y chequeos de la MMU. */
import type { Paso, Recorrido } from './recorrido'
import { bits, nibbles } from './recorrido-traduccion'
import { grupo, texto } from './svg'

export interface SegmentoDirecto {
  seg: number
  base: number
  /** `largo` se compara con < y `limite` (última dirección válida) con ≤: uno de los dos. */
  largo?: number
  limite?: number
  /** Letras r, w, x: `r` → Read only, `x` → Exec only, `rw` → Read write. */
  permisos?: string
}

export interface SpecTraduccionDirecta {
  sentido: 'directo'
  titulo: string
  /** Sin bits, cada dirección viene ya cortada como `{ seg, desp }`. */
  bitsSegmento?: number
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

export function recorridoTraduccionDirecta(spec: SpecTraduccionDirecta): Recorrido {
  const bs = spec.bitsSegmento ?? 0
  const bo = spec.bitsOffset ?? 0
  const hx = (n: number, w: number) =>
    spec.unidad === 'decimal' ? String(n) : `${n.toString(16).toUpperCase().padStart(w, '0')}h`
  const d = (n: number) => hx(n, Math.ceil((bs + bo) / 4))
  const o = (n: number) => hx(n, Math.ceil(bo / 4))
  const acceso = spec.acceso
  const verbo = acceso && VERBO[acceso]

  for (const s of spec.segmentos)
    if (s.permisos != null && !/^[rwx]+$/.test(s.permisos))
      throw new Error(`traduccion: permisos "${s.permisos}" del segmento ${s.seg} (letras r, w, x)`)
  for (const s of spec.segmentos)
    if ((s.largo == null) === (s.limite == null))
      throw new Error(
        `traduccion: el segmento ${s.seg} lleva \`largo\` o \`limite\`, uno de los dos`,
      )
  const conLimite = spec.segmentos.some((s) => s.limite != null)
  const tope = (s: SegmentoDirecto) => (s.limite ?? s.largo)!
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
    s.permisos ? (ETIQUETA[s.permisos] ?? s.permisos.toUpperCase()) : '—'

  const dirs = spec.direcciones.map((x) => {
    const { dl } = x
    if (dl == null && (x.seg == null || x.desp == null))
      throw new Error('traduccion: cada dirección lleva `dl` o `{ seg, desp }`')
    if (dl != null && (!spec.bitsSegmento || !spec.bitsOffset))
      throw new Error(`traduccion: para cortar ${d(dl)} faltan bitsSegmento y bitsOffset`)
    if (dl != null && (dl < 0 || dl >= 2 ** (bs + bo)))
      throw new Error(`traduccion: ${d(dl)} no entra en ${bs + bo} bits`)
    const seg = dl != null ? dl >> bo : x.seg!
    const desp = dl != null ? dl & (2 ** bo - 1) : x.desp!
    const nombre = dl != null ? d(dl) : `(${seg}, ${o(desp)})`
    const fila = spec.segmentos.find((s) => s.seg === seg)
    if (!fila) throw new Error(`traduccion: falta el segmento ${seg} en la tabla (${nombre})`)
    const limiteOk = fila.limite != null ? desp <= fila.limite : desp < fila.largo!
    const permisoOk = !acceso || (fila.permisos ?? '').includes(LETRA[acceso])
    const fault = !limiteOk ? 'límite' : !permisoOk ? 'permiso' : null
    const df = fila.base + desp
    return { ...x, dl, nombre, seg, desp, fila, limiteOk, permisoOk, fault, df }
  })
  type Dir = (typeof dirs)[number]
  const resultado = (x: Dir) => (x.fault ? `Fault (${x.fault})` : d(x.df))

  const corte = (x: Dir) => {
    if (x.dl == null)
      return texto(
        X0,
        12,
        `1. La dirección lógica ya viene cortada: segmento ${x.seg} · desplazamiento ${o(x.desp)}`,
        { clase: 'rm-izq rm-tabla-tit' },
      )
    const b = bits(x.dl, bs + bo)
    let cx = X0
    const celdas = [...b].map((v, i) => {
      if (i === bs || (i > bs && (bs + bo - i) % 4 === 0)) cx += 8
      const g =
        `<g class="tr-bit tr-bit-${i < bs ? 'seg' : 'off'}"><rect x="${cx}" y="24" width="22" height="28" rx="4"/>` +
        texto(cx + 11, 38, v) +
        '</g>'
      cx += 25
      return g
    })
    return (
      texto(X0, 12, `1. Cortar ${d(x.dl)}: ${bs} bits de segmento | ${bo} de desplazamiento`, {
        clase: 'rm-izq rm-tabla-tit',
      }) +
      celdas.join('') +
      `<text class="rm-izq tr-corte" x="${X0}" y="70">segmento <tspan class="tr-val-seg">${x.seg}</tspan></text>` +
      `<text class="rm-izq tr-corte" x="${X0 + 120}" y="70">desplazamiento <tspan class="tr-val">${o(x.desp)}</tspan></text>`
    )
  }

  const y2 = dirs.some((x) => x.dl != null) ? 100 : 40
  const tit = conLimite ? 'Límite' : 'Largo'
  const columnas = acceso ? ['Seg', 'Base', tit, 'Protección'] : ['Seg', 'Base', tit]
  const anchos = [40, 76, 76, 100]
  const xs = anchos.map((_, j) => X0 + anchos.slice(0, j).reduce((a, b) => a + b, 0))
  const anchoTabla = xs[columnas.length - 1] + anchos[columnas.length - 1] - X0
  const tabla = (x: Dir) =>
    texto(X0, y2, `2. Buscar la fila del segmento ${x.seg}`, { clase: 'rm-izq rm-tabla-tit' }) +
    columnas.map((t, j) => texto(xs[j] + 10, y2 + 22, t, { clase: 'rm-izq rm-enc' })).join('') +
    spec.segmentos
      .map((s, i) => {
        const y = y2 + 34 + i * 24
        const sel = s === x.fila
        const celdas = [String(s.seg), d(s.base), d(tope(s)), etiqueta(s)].slice(0, columnas.length)
        const mal = sel && x.fault === 'límite' ? 2 : sel && x.fault === 'permiso' ? 3 : -1
        return (
          `<g class="${sel ? 'tr-fila-sel' : 'tr-fila-otra'}">` +
          (sel ? `<rect x="${X0}" y="${y}" width="${anchoTabla}" height="24" rx="3"/>` : '') +
          celdas
            .map((c, j) =>
              texto(xs[j] + 10, y + 12, c, { clase: j === mal ? 'rm-izq tr-mal' : 'rm-izq' }),
            )
            .join('') +
          '</g>'
        )
      })
      .join('')

  const xc = X0 + 310
  const chequeo = (i: number, estado: 'ok' | 'mal' | 'no', titulo: string, detalle?: string) => {
    const y = y2 + 12 + i * 48
    return (
      `<g class="tr-chk tr-chk-${estado}"><rect x="${xc}" y="${y}" width="${W - 310}" height="40" rx="6"/>` +
      texto(xc + 16, y + 20, estado === 'ok' ? '✓' : estado === 'mal' ? '✗' : '–', {
        clase: 'tr-marca',
      }) +
      (detalle
        ? texto(xc + 32, y + 12, titulo, { clase: 'rm-izq tr-chk-tit' }) +
          texto(xc + 32, y + 29, detalle, { clase: 'rm-izq tr-det' })
        : texto(xc + 32, y + 20, titulo, { clase: 'rm-izq tr-chk-tit' })) +
      '</g>'
    )
  }
  const nChequeos = acceso ? 3 : 2
  const chequeos = (x: Dir) => {
    const l = tope(x.fila)
    const c = cmp(x.fila)
    const out = [
      x.limiteOk
        ? chequeo(0, 'ok', c.tit, `${o(x.desp)} ${c.ok} ${o(l)}`)
        : chequeo(0, 'mal', c.tit, `${o(x.desp)} ${c.mal} ${o(l)} → segmentation fault`),
    ]
    if (acceso) {
      const t = 'modo de acceso permitido'
      out.push(
        !x.limiteOk
          ? chequeo(
              1,
              'no',
              t,
              `no se llega${x.permisoOk ? '' : ` (además es ${etiqueta(x.fila)})`}`,
            )
          : x.permisoOk
            ? chequeo(1, 'ok', t, `${etiqueta(x.fila)} permite ${verbo}`)
            : chequeo(
                1,
                'mal',
                t,
                `${verbo} en un segmento ${etiqueta(x.fila)} → fault por permiso`,
              ),
      )
    }
    out.push(
      x.fault
        ? chequeo(nChequeos - 1, 'no', 'DF = base + desplazamiento (no se calcula)')
        : chequeo(
            nChequeos - 1,
            'ok',
            'DF = base + desplazamiento',
            `${d(x.fila.base)} + ${o(x.desp)} = ${d(x.df)}`,
          ),
    )
    return (
      texto(xc, y2, '3. Chequeos de la MMU, en orden', { clase: 'rm-izq rm-tabla-tit' }) +
      out.join('')
    )
  }

  const yChips = Math.max(y2 + 34 + spec.segmentos.length * 24, y2 + 12 + nChequeos * 48) + 16
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

  const pasos: Paso[] = dirs.map((x, k) => {
    const l = tope(x.fila)
    const c = cmp(x.fila)
    const et = etiqueta(x.fila)
    const porque =
      x.fault === 'límite'
        ? `El primer chequeo ya falla: el desplazamiento **${o(x.desp)}** ${c.no} ${c.dato} **${o(l)}**, así que la MMU corta con **segmentation fault**${acceso ? ' sin mirar el permiso' : ''}.`
        : x.fault === 'permiso'
          ? `El desplazamiento **${o(x.desp)}** entra en ${c.dato} **${o(l)}**, pero el segmento ${x.seg} es **${et}**: no permite ${verbo}, así que la MMU corta con **fault por permiso**.`
          : acceso
            ? `Pasa los dos chequeos: ${o(x.desp)} ${c.ok} ${o(l)} y el segmento ${x.seg} es **${et}**, que permite ${verbo}. DF = ${d(x.fila.base)} + ${o(x.desp)} = **${d(x.df)}**.`
            : `El desplazamiento ${o(x.desp)} entra en ${c.dato} ${o(l)}: DF = ${d(x.fila.base)} + ${o(x.desp)} = **${d(x.df)}**.`
    return {
      titulo: `${x.nombre} → ${resultado(x)}`,
      texto: [porque, x.texto].filter(Boolean).join(' '),
      resaltar: [`paso-${k}`],
      mostrar: [`paso-${k}`],
      ocultar: dirs.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
    }
  })

  return {
    ancho: 760,
    alto: yChips + filasChips * (CHIP + 6) + 4,
    titulo: spec.titulo,
    cuerpo: dirs.map((x, k) =>
      grupo(
        `paso-${k}`,
        corte(x) + tabla(x) + chequeos(x) + chipsPorPaso[k].map((c) => c.g).join(''),
        { oculto: true },
      ),
    ),
    pasos,
  }
}
