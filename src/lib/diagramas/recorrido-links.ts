/** Recorrido de links (```links): directorio → inodos, un fotograma por operación. Diseño links-A + M1. */
import type { Paso, Recorrido } from './recorrido'
import { abre, simularLinks, type InodoLinks, type PasoLinks, type SpecLinksSim } from './links'
import { grupo, texto } from './svg'

export interface SpecLinks extends SpecLinksSim {
  titulo: string
}

const ANCHO = 820
const DX = 10
const DW = 262
const CAB = 28
const FILA = 38
const CX = 490
const CW = 300

const altoInodo = (i: InodoLinks) => (i.tipo === 'soft' ? 112 : 86)

const nombreOp = (p: PasoLinks) => {
  const op = p.op
  if (!op) return 'inicial'
  if ('rm' in op)
    return `rm ${op.rm
      .split('/')
      .pop()!
      .replace(/\.[^.]*$/, '')}`
  return 'ln' in op ? 'ln' : 'ln -s'
}

const tituloOp = (p: PasoLinks) => {
  const op = p.op
  if (!op) return 'Estado inicial'
  if ('rm' in op) return `rm ${op.rm}`
  return 'ln' in op ? `ln ${op.ln} ${op.a}` : `ln -s ${op.lns} ${op.a}`
}

/** Texto del paso, generado del estado (el de rm sigue al tablero links-A). */
function explicar(p: PasoLinks): string {
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
    t = `Un hard link no crea un archivo: suma la entrada **${e.nombre}** → ${i.id} en \`${e.dir}\` y el contador de ${i.id} pasa de ${i.antes} a **${i.contador}**. Los bloques de datos son los mismos.`
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
    t = `Borrar **${e.nombre}** quita **esa entrada** y baja el contador de ${i.id} de ${i.antes} a **${i.contador}**.`
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
  const pasos = simularLinks(spec)
  const ultimo = pasos.at(-1)!

  // Cajas de directorio: en el orden declarado o en el que aparecen; las filas no cambian entre pasos.
  const dirs = spec.volumenes
    ? spec.volumenes.flatMap((v) => v.directorios)
    : [...new Set(ultimo.entradas.map((e) => e.dir))]
  const filas = new Map<string, number>()
  let yd = 20
  const cajas = dirs.map((d) => {
    const es = ultimo.entradas.filter((e) => e.dir === d)
    const y0 = yd
    es.forEach((e, k) => filas.set(e.ruta, y0 + CAB + k * FILA + FILA / 2))
    yd += CAB + Math.max(1, es.length) * FILA + 18
    return { d, y0, alto: CAB + Math.max(1, es.length) * FILA }
  })

  // Tarjetas de inodo: a la altura de sus entradas, empujadas para no pisarse.
  const yIno = new Map<string, number>()
  let piso = 20
  for (const i of [...ultimo.inodos]
    .map((i) => {
      const rs = ultimo.entradas.filter((e) => e.inodo === i.id).map((e) => filas.get(e.ruta)!)
      return { i, ideal: rs.reduce((a, b) => a + b, 0) / rs.length - altoInodo(i) / 2 }
    })
    .sort((a, b) => a.ideal - b.ideal)) {
    const y0 = Math.max(piso, i.ideal)
    yIno.set(i.i.id, y0)
    piso = y0 + altoInodo(i.i) + 24
  }
  const altoDibujo = Math.max(yd - 18, piso - 24) + 16

  const flecha = (x1: number, y1: number, x2: number, y2: number, clase: string, punta = true) =>
    `<g class="${clase}"><path d="M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}"/>` +
    (punta
      ? `<path class="lk-punta" d="M ${x2 - 9} ${y2 - 6} L ${x2} ${y2} L ${x2 - 9} ${y2 + 6}"/>`
      : '') +
    '</g>'

  const dibujo = (p: PasoLinks) => {
    const vive = (r: string) => p.entradas.some((e) => e.ruta === r && !e.borrada)
    let svg = cajas
      .map(
        (c) =>
          `<g class="lk-dir"><rect x="${DX}" y="${c.y0}" width="${DW}" height="${c.alto}" rx="8"/>` +
          `<line x1="${DX}" y1="${c.y0 + CAB}" x2="${DX + DW}" y2="${c.y0 + CAB}"/>` +
          texto(DX + 12, c.y0 + CAB / 2, `directorio ${c.d}`, { clase: 'rm-izq lk-dir-tit' }) +
          '</g>',
      )
      .join('')
    const entrantes = new Map<string, number>()
    const flechas: [string, string, number, boolean][] = []
    for (const e of p.entradas) {
      const y = filas.get(e.ruta)!
      const clase =
        e.borrada === 'ahora'
          ? 'lk-fila lk-fila-borrada'
          : e.borrada
            ? 'lk-fila lk-fila-antes'
            : 'lk-fila'
      svg +=
        `<g class="${clase}">` +
        (e.borrada === 'ahora'
          ? `<rect x="${DX + 1}" y="${y - FILA / 2}" width="${DW - 2}" height="${FILA}"/>`
          : '') +
        texto(DX + 12, y, e.nombre, { clase: 'rm-izq' }) +
        texto(DX + DW - 12, y, `→ ${e.inodo}`, { clase: 'rm-der' }) +
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
        DX + DW,
        filas.get(ruta)!,
        CX,
        ty,
        borrada ? 'lk-flecha lk-flecha-borrada' : 'lk-flecha',
        !borrada,
      )
    }

    for (const i of p.inodos) {
      const y0 = yIno.get(i.id)!
      const h = altoInodo(i)
      const sel = p.afectado === i.id
      const cambio = i.antes !== i.contador && p.op != null
      const clase = `lk-inodo${sel ? ' lk-inodo-sel' : ''}${i.liberado ? ' lk-inodo-libre' : ''}`
      const cont = cambio && i.antes > 0 ? `${i.antes} → ${i.contador}` : String(i.contador)
      svg +=
        `<g class="${clase}"><rect x="${CX}" y="${y0}" width="${CW}" height="${h}" rx="8"/>` +
        texto(
          CX + 12,
          y0 + 20,
          `Inodo ${i.id} · ${i.tipo === 'soft' ? 'soft link' : 'archivo regular'}`,
          {
            clase: 'rm-izq lk-ino-tit',
          },
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
          `<text class="rm-izq" x="${CX + 12}" y="${y0 + 44}">contador de hard links: <tspan class="${cambio ? 'lk-cambio' : ''}">${cont}</tspan></text>` +
          texto(CX + 12, y0 + 66, bloques, { clase: 'rm-izq lk-sub' })
      } else {
        const nota = !cambio ? ' (no cambia)' : i.antes === 0 ? ' (su propia entrada)' : ''
        const ok = vive(i.destino!)
        svg +=
          `<text class="rm-izq" x="${CX + 12}" y="${y0 + 44}">contador: <tspan class="${cambio && i.antes > 0 ? 'lk-cambio' : ''}">${cont}</tspan>${nota}</text>` +
          `<g class="${ok ? 'lk-bloque' : 'lk-bloque lk-bloque-mal'}"><rect x="${CX + 12}" y="${y0 + 58}" width="${CW - 24}" height="42" rx="4"/>` +
          texto(CX + 20, y0 + 70, `bloque: "${i.destino}"`, { clase: 'rm-izq' }) +
          texto(CX + 20, y0 + 88, ok ? '✓ existe' : '✗ ya no existe', { clase: 'rm-izq' }) +
          '</g>'
        const yr = filas.get(i.destino!)
        if (yr != null && !i.liberado) {
          const sy = y0 + 79
          svg +=
            `<g class="lk-flecha-soft"><path d="M ${CX - 2} ${sy} C ${CX - 90} ${sy}, ${DX + DW + 90} ${yr + 9}, ${DX + DW + 4} ${yr + 9}"/>` +
            `<path class="lk-punta" d="M ${DX + DW + 13} ${yr + 3} L ${DX + DW + 4} ${yr + 9} L ${DX + DW + 13} ${yr + 15}"/>` +
            texto(CX - 6, sy + 20, `${i.id} apunta por ruta`, { clase: 'rm-der lk-soft-etq' }) +
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
  const resumen = texto(ANCHO - 10, yPasos, `Pasos: ${pasos.map(nombreOp).join(' · ')}`, {
    clase: 'rm-der lk-pasos',
  })

  const recPasos: Paso[] = pasos.map((p, k) => ({
    titulo: tituloOp(p),
    texto: explicar(p),
    resaltar: [`paso-${k}`],
    mostrar: [`paso-${k}`],
    ocultar: pasos.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
  }))

  return {
    ancho: ANCHO,
    alto: yPasos + 14,
    titulo: spec.titulo,
    cuerpo: [
      ...pasos.map((p, k) => grupo(`paso-${k}`, dibujo(p) + tabla(p), { oculto: true })),
      resumen,
    ],
    pasos: recPasos,
  }
}
