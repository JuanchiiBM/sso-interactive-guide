/** Recorrido de links (```links): directorio → inodos, un fotograma por operación. Diseño links-A + M1. */
import type { Paso, Recorrido, Variante } from './recorrido'
import {
  abre,
  simularLinks,
  type InodoLinks,
  type OpLinks,
  type PasoLinks,
  type SpecLinksSim,
} from './links'
import { grupo, texto } from './svg'

export interface SpecLinks extends SpecLinksSim {
  titulo: string
  /** Una pestaña por escenario: las operaciones comunes y después las suyas. */
  escenarios?: { nombre: string; operaciones: OpLinks[] }[]
}

const ANCHO = 820
const DX = 10
const CAB = 28
const FILA = 38
// directorio | hueco de las flechas | tarjeta (con dos volúmenes, más angostos)
const GEO_UNO = { dw: 262, gap: 218, cw: 300 }
const GEO_VOLS = { dw: 190, gap: 90, cw: 294 }

const altoInodo = (i: InodoLinks) => (i.tipo === 'soft' ? 112 : 86)

// "rm informe" como en el tablero; la ruta entera si otro archivo se llama igual
const nombreOp = (p: PasoLinks, rutas: string[]) => {
  const op = p.op
  if (!op) return 'inicial'
  if ('rm' in op) {
    const base = op.rm.split('/').pop()!
    const repetido = rutas.filter((r) => r.split('/').pop() === base).length > 1
    return `rm ${repetido ? op.rm : base.replace(/\.[^.]*$/, '')}`
  }
  return 'ln' in op ? 'ln' : 'ln -s'
}

const tituloOp = (p: PasoLinks) => {
  const op = p.op
  if (!op) return 'Estado inicial'
  if ('rm' in op) return `rm ${op.rm}`
  return 'ln' in op ? `ln ${op.ln} ${op.a}` : `ln -s ${op.lns} ${op.a}`
}

// "de I" con letras (links-A), "del inodo 5" con números (M1)
const de = (id: string) => (/^\d+$/.test(id) ? `del inodo ${id}` : `de ${id}`)

/** Texto del paso, generado del estado (el de rm sigue al tablero links-A). */
function explicar(p: PasoLinks, varios: boolean): string {
  const op = p.op
  const ino = (id: string) => p.inodos.find((i) => i.id === id)!
  const vivas = (id: string) => p.entradas.filter((e) => e.inodo === id && !e.borrada)
  const y = (xs: string[]) =>
    xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : xs[0]
  if (!op)
    return p.inodos
      .map((i) => {
        const es = vivas(i.id).map((e) => `\`${e.ruta}\``)
        return `${y(es)} ${es.length > 1 ? 'son entradas que apuntan' : 'es una entrada que apunta'} al inodo **${i.id}**, un archivo regular con contador de hard links **${i.contador}**.`
      })
      .join(' ')
  let t: string
  if ('ln' in op) {
    const e = p.entradas.find((x) => x.ruta === op.a)!
    const i = ino(e.inodo)
    t = `Un hard link no crea un archivo: suma la entrada **${e.nombre}** → ${i.id} en \`${e.dir}\` y el contador ${de(i.id)} pasa de ${i.antes} a **${i.contador}**. Los bloques de datos son los mismos.`
  } else if ('lns' in op) {
    const dest = p.entradas.find((x) => x.ruta === op.lns && !x.borrada)
    const cont = dest
      ? ` El contador de ${dest.inodo} no cambia (sigue en **${ino(dest.inodo).contador}**).`
      : ''
    t = `Un soft link es un archivo nuevo: ocupa el inodo **${op.inodo}**, de tipo soft link, y su bloque guarda la ruta \`${op.lns}\`.${cont}`
  } else {
    const e = p.entradas.find((x) => x.ruta === op.rm)!
    const i = ino(e.inodo)
    const quien = (r: { ruta: string; dir: string; nombre: string }) =>
      r.dir === e.dir ? `**${r.nombre}**` : `**${r.ruta}**`
    t = `Borrar **${e.nombre}** quita **esa entrada**${varios ? ` de ${e.dir}` : ''} y baja el contador ${de(i.id)} de ${i.antes} a **${i.contador}**.`
    if (i.contador > 0) {
      const otras = vivas(i.id).map(quien)
      t += ` Como no llegó a 0, el inodo y sus bloques siguen: ${y(otras)} ${otras.length > 1 ? 'abren' : 'abre'} el mismo contenido.`
    } else
      t +=
        i.tipo === 'soft'
          ? ` Llegó a 0: se liberan el inodo del link y el bloque con la ruta; \`${i.destino}\` no cambia.`
          : ` Llegó a 0: el SO libera el inodo y sus bloques de datos.`
    for (const s of p.inodos.filter((s) => s.tipo === 'soft' && s.destino === op.rm))
      for (const se of vivas(s.id))
        t += ` ${quien(se)} guarda la ruta \`${op.rm}\`, que ya no existe: queda **colgado**.`
  }
  return op.texto ? `${t} ${op.texto}` : t
}

export function recorridoLinks(spec: SpecLinks): Recorrido {
  const escenarios = spec.escenarios?.length
    ? spec.escenarios.map((e) => ({
        nombre: e.nombre,
        pasos: simularLinks({ ...spec, operaciones: [...spec.operaciones, ...e.operaciones] }),
      }))
    : [{ nombre: '', pasos: simularLinks(spec) }]
  // Todo lo que aparece en algún escenario, para que el dibujo no cambie de lugar entre pestañas.
  const finales = escenarios.map((e) => e.pasos.at(-1)!)
  const unicos = <T>(xs: T[], clave: (x: T) => string) => [
    ...new Map(xs.map((x) => [clave(x), x])).values(),
  ]
  const ultimo = {
    entradas: unicos(
      finales.flatMap((f) => f.entradas),
      (e) => e.ruta,
    ),
    inodos: unicos(
      finales.flatMap((f) => f.inodos),
      (i) => i.id,
    ),
  }

  // Una columna por volumen (directorios apilados | tarjetas de inodo); las filas no cambian entre pasos.
  const vols = spec.volumenes ?? [
    { nombre: '', directorios: [...new Set(ultimo.entradas.map((e) => e.dir))] },
  ]
  const g0 = vols.length > 1 ? GEO_VOLS : GEO_UNO
  // la caja crece si un título o una entrada no entra (≈ 7.2 px por carácter a 12 px, 7.8 a 13 px)
  const dw = Math.max(
    g0.dw,
    ...vols.flatMap((v) => v.directorios).map((d) => (11 + d.length) * 7.2 + 24),
    ...ultimo.entradas.map((e) => (e.nombre.length + e.inodo.length + 2) * 7.8 + 40),
  )
  const gap = vols.length > 1 ? g0.gap : Math.max(120, g0.gap - (dw - g0.dw))
  const g = { dw, gap, cw: g0.cw }
  const col = g.dw + g.gap + g.cw
  const y0Vol = vols.length > 1 ? 54 : 20
  const ancho =
    vols.length > 1 ? vols.length * col + (vols.length - 1) * 40 + 20 : Math.max(ANCHO, col + 20)
  const xs0 = new Map(vols.map((v, k) => [v.nombre, DX + k * (col + 40)]))
  const dx = (vol: string) => xs0.get(vol)!
  const cx = (vol: string) => dx(vol) + g.dw + g.gap

  const filas = new Map<string, number>()
  const cajas: { d: string; vol: string; y0: number; alto: number }[] = []
  const yIno = new Map<string, number>()
  let alto = 0
  for (const v of vols) {
    let yd = y0Vol
    for (const d of v.directorios) {
      const es = ultimo.entradas.filter((e) => e.dir === d)
      es.forEach((e, k) => filas.set(e.ruta, yd + CAB + k * FILA + FILA / 2))
      cajas.push({ d, vol: v.nombre, y0: yd, alto: CAB + Math.max(1, es.length) * FILA })
      yd += CAB + Math.max(1, es.length) * FILA + 18
    }
    // Tarjetas de inodo: a la altura de sus entradas, empujadas para no pisarse.
    let piso = y0Vol
    for (const i of ultimo.inodos
      .filter((i) => i.volumen === v.nombre)
      .map((i) => {
        const rs = ultimo.entradas.filter((e) => e.inodo === i.id).map((e) => filas.get(e.ruta)!)
        return { i, ideal: rs.reduce((a, b) => a + b, 0) / rs.length - altoInodo(i) / 2 }
      })
      .sort((a, b) => a.ideal - b.ideal)) {
      const y0 = Math.max(piso, i.ideal)
      yIno.set(i.i.id, y0)
      piso = y0 + altoInodo(i.i) + 24
    }
    alto = Math.max(alto, yd - 18, piso - 24)
  }
  const altoDibujo = alto + 16
  const media = g.gap / 2

  const flecha = (x1: number, y1: number, x2: number, y2: number, clase: string, punta = true) =>
    `<g class="${clase}"><path d="M ${x1} ${y1} C ${x1 + media} ${y1}, ${x2 - media} ${y2}, ${x2} ${y2}"/>` +
    (punta
      ? `<path class="lk-punta" d="M ${x2 - 9} ${y2 - 6} L ${x2} ${y2} L ${x2 - 9} ${y2 + 6}"/>`
      : '') +
    '</g>'

  const dibujo = (p: PasoLinks) => {
    const vive = (r: string) => p.entradas.some((e) => e.ruta === r && !e.borrada)
    let svg =
      vols.length > 1
        ? vols
            .map((v) => texto(dx(v.nombre), 16, `Volumen ${v.nombre}`, { clase: 'rm-izq lk-vol' }))
            .join('')
        : ''
    svg += cajas
      .map((c) => {
        const x = dx(c.vol)
        return (
          `<g class="lk-dir"><rect x="${x}" y="${c.y0}" width="${g.dw}" height="${c.alto}" rx="8"/>` +
          `<line x1="${x}" y1="${c.y0 + CAB}" x2="${x + g.dw}" y2="${c.y0 + CAB}"/>` +
          texto(x + 12, c.y0 + CAB / 2, `directorio ${c.d}`, { clase: 'rm-izq lk-dir-tit' }) +
          '</g>'
        )
      })
      .join('')
    const entrantes = new Map<string, number>()
    const flechas: [string, string, number, boolean][] = []
    for (const e of p.entradas) {
      const y = filas.get(e.ruta)!
      const x = dx(e.volumen)
      const clase =
        e.borrada === 'ahora'
          ? 'lk-fila lk-fila-borrada'
          : e.borrada
            ? 'lk-fila lk-fila-antes'
            : 'lk-fila'
      svg +=
        `<g class="${clase}">` +
        (e.borrada === 'ahora'
          ? `<rect x="${x + 1}" y="${y - FILA / 2}" width="${g.dw - 2}" height="${FILA}"/>`
          : '') +
        texto(x + 12, y, e.nombre, { clase: 'rm-izq' }) +
        texto(x + g.dw - 12, y, `→ ${e.inodo}`, { clase: 'rm-der' }) +
        '</g>'
      if (e.borrada === 'antes') continue
      const k = entrantes.get(e.inodo) ?? 0
      entrantes.set(e.inodo, k + 1)
      flechas.push([e.ruta, e.inodo, k, e.borrada === 'ahora'])
    }
    for (const [ruta, id, k, borrada] of flechas) {
      const i = p.inodos.find((x) => x.id === id)!
      const n = entrantes.get(id)!
      const y0 = yIno.get(id)!
      const ty = i.tipo === 'soft' ? y0 + 22 + k * 14 : y0 + (altoInodo(i) * (k + 1)) / (n + 1)
      svg += flecha(
        dx(i.volumen) + g.dw,
        filas.get(ruta)!,
        cx(i.volumen),
        ty,
        borrada ? 'lk-flecha lk-flecha-borrada' : 'lk-flecha',
        !borrada,
      )
    }

    for (const i of p.inodos) {
      const y0 = yIno.get(i.id)!
      const x = cx(i.volumen)
      const h = altoInodo(i)
      const sel = p.afectado === i.id
      const cambio = i.antes !== i.contador && p.op != null
      const clase = `lk-inodo${sel ? ' lk-inodo-sel' : ''}${i.liberado ? ' lk-inodo-libre' : ''}`
      const cont = cambio && i.antes > 0 ? `${i.antes} → ${i.contador}` : String(i.contador)
      svg +=
        `<g class="${clase}"><rect x="${x}" y="${y0}" width="${g.cw}" height="${h}" rx="8"/>` +
        texto(
          x + 12,
          y0 + 20,
          `Inodo ${i.id} · ${i.tipo === 'soft' ? 'soft link' : 'archivo regular'}`,
          { clase: 'rm-izq lk-ino-tit' },
        )
      if (i.tipo === 'regular') {
        const bloques = i.liberado
          ? 'Bloques de datos: se liberan (el contador llegó a 0)'
          : i.contador < i.antes
            ? 'Bloques de datos: siguen (el contador no llegó a 0)'
            : i.contador > i.antes && p.op
              ? 'Bloques de datos: los mismos (no se copia nada)'
              : 'Bloques de datos: el contenido del archivo'
        svg +=
          `<text class="rm-izq" x="${x + 12}" y="${y0 + 44}">contador de hard links: <tspan class="${cambio ? 'lk-cambio' : ''}">${cont}</tspan></text>` +
          texto(x + 12, y0 + 66, bloques, { clase: 'rm-izq lk-sub' })
      } else {
        const nota = !cambio ? ' (no cambia)' : i.antes === 0 ? ' (su propia entrada)' : ''
        const ok = vive(i.destino!)
        svg +=
          `<text class="rm-izq" x="${x + 12}" y="${y0 + 44}">contador: <tspan class="${cambio && i.antes > 0 ? 'lk-cambio' : ''}">${cont}</tspan>${nota}</text>` +
          `<g class="${ok ? 'lk-bloque' : 'lk-bloque lk-bloque-mal'}"><rect x="${x + 12}" y="${y0 + 58}" width="${g.cw - 24}" height="42" rx="4"/>` +
          texto(x + 20, y0 + 70, `bloque: "${i.destino}"`, { clase: 'rm-izq' }) +
          texto(x + 20, y0 + 88, ok ? '✓ existe' : '✗ ya no existe', { clase: 'rm-izq' }) +
          '</g>'
        const dest = ultimo.entradas.find((e) => e.ruta === i.destino)
        if (dest && !i.liberado) {
          const sy = y0 + 79
          const yr = filas.get(dest.ruta)! + 9
          const xe = dx(dest.volumen) + g.dw + 4
          // de otro volumen: sube al carril de arriba y baja junto a la entrada
          const d =
            dest.volumen === i.volumen
              ? `M ${x - 2} ${sy} C ${x - 90} ${sy}, ${xe + 90} ${yr}, ${xe} ${yr}`
              : `M ${x - 2} ${sy} L ${x - 26} ${sy} L ${x - 26} ${y0Vol - 12} L ${xe + 26} ${y0Vol - 12} L ${xe + 26} ${yr} L ${xe} ${yr}`
          svg +=
            `<g class="lk-flecha-soft"><path d="${d}"/>` +
            `<path class="lk-punta" d="M ${xe + 9} ${yr - 6} L ${xe} ${yr} L ${xe + 9} ${yr + 6}"/>` +
            texto(x - 6, sy + 20, `${i.id} apunta por ruta`, { clase: 'rm-der lk-soft-etq' }) +
            '</g>'
        }
      }
      svg += '</g>'
    }
    return svg
  }

  // Tabla Ruta | Tipo | Inodo | ¿Abre el contenido?, con todas las rutas que existieron.
  const yT = altoDibujo + 10
  const xs = [DX, DX + 200, DX + 310, DX + 380]
  const tabla = (p: PasoLinks) => {
    const enc =
      ['Ruta', 'Tipo', 'Inodo', '¿Abre el contenido?']
        .map((t, j) => texto(xs[j] + 10, yT + 12, t, { clase: 'rm-izq lk-th' }))
        .join('') +
      `<line class="lk-linea" x1="${DX}" y1="${yT + 24}" x2="${DX + 560}" y2="${yT + 24}"/>`
    return (
      enc +
      p.entradas
        .map((e, k) => {
          const fy = yT + 24 + k * 24
          const a = abre(p, e.ruta)
          const celdas = e.borrada ? [e.ruta, '—', '—', a] : [e.ruta, e.tipo, e.inodo, a]
          const claseA = a === 'sí' ? 'lk-si' : a === 'no: colgado' ? 'lk-no' : ''
          return (
            `<g class="${e.borrada ? 'lk-tr lk-tr-no' : 'lk-tr'}">` +
            celdas
              .map((c, j) =>
                texto(xs[j] + 10, fy + 12, c, {
                  clase: `rm-izq${j === 0 && e.borrada ? ' lk-tachado' : ''}${j === 3 ? ` ${claseA}` : ''}`,
                }),
              )
              .join('') +
            `<line class="lk-linea" x1="${DX}" y1="${fy + 24}" x2="${DX + 560}" y2="${fy + 24}"/></g>`
          )
        })
        .join('')
    )
  }
  const yPasos = yT + 24 + ultimo.entradas.length * 24 + 26
  const rutas = ultimo.entradas.map((e) => e.ruta)
  const cuerpo: string[] = []
  const variantes: Variante[] = escenarios.map(({ nombre, pasos }, j) => {
    const id = (k: number) => (escenarios.length > 1 ? `e${j}-paso-${k}` : `paso-${k}`)
    const resumen = texto(
      ancho - 10,
      yPasos,
      `Pasos: ${pasos.map((p) => nombreOp(p, rutas)).join(' · ')}`,
      {
        clase: 'rm-der lk-pasos',
      },
    )
    pasos.forEach((p, k) =>
      cuerpo.push(grupo(id(k), dibujo(p) + tabla(p) + resumen, { oculto: true })),
    )
    return {
      nombre,
      pasos: pasos.map((p, k): Paso => ({
        titulo: tituloOp(p),
        texto: explicar(p, cajas.length > 1),
        resaltar: [id(k)],
        mostrar: [id(k)],
        ocultar: pasos.map((_, i) => id(i)).filter((_, i) => i !== k),
      })),
    }
  })

  return {
    ancho,
    alto: yPasos + 14,
    titulo: spec.titulo,
    cuerpo,
    ...(variantes.length > 1 ? { variantes } : { pasos: variantes[0].pasos }),
  }
}
