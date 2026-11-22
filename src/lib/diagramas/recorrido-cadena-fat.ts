/** Cadena FAT (```fat): entrada de directorio → bloques en orden → EOF, siguiendo la cadena hasta un byte. Ver brain: Resolución gráfica paso a paso. */
import type { Paso, Recorrido } from './recorrido'
import { esc, grupo, texto } from './svg'

export interface SpecCadenaFat {
  titulo: string
  /** Entrada → siguiente bloque, o EOF / FIN. */
  tabla: Record<number, number | string>
  inicio: number
  /** Tamaño de bloque en bytes. */
  bloque: number
  byte: number
}

const X0 = 20
const W_DIR = 166
const X_COL = X0 + W_DIR + 24
const COL = 92
const PASO_COL = 104
const CAJA = 64
const ALTO_CAJA = 56
const FILA = 124
const POR_FILA = Math.floor((740 - X_COL) / PASO_COL) + 1
const X_TABLA = 480
const LINEA = 20

const esFin = (v: number | string) => typeof v === 'string' && /^(eof|fin)/i.test(v.trim())

/** Bloques de la cadena desde `inicio` hasta la entrada con EOF. */
export function cadenaFat(tabla: SpecCadenaFat['tabla'], inicio: number): number[] {
  const cadena: number[] = []
  let n: number | string = inicio
  while (!esFin(n)) {
    const b: number = Number(n)
    if (!(b in tabla)) throw new Error(`fat: la entrada ${b} no está en la tabla`)
    if (cadena.includes(b)) throw new Error(`fat: la cadena vuelve al bloque ${b} (ciclo)`)
    if (cadena.length && b === 0)
      throw new Error(`fat: FAT[${cadena.at(-1)}] = 0 es un bloque libre`)
    cadena.push(b)
    n = tabla[b]
  }
  return cadena
}

/** Texto con tramos de distinta clase: [texto, clase?][]. */
const linea = (x: number, y: number, tramos: [string, string?][], clase = '') =>
  `<text class="rm-izq ${clase}" x="${x}" y="${y}">` +
  tramos.map(([t, c]) => (c ? `<tspan class="${c}">${esc(t)}</tspan>` : esc(t))).join('') +
  '</text>'

export function recorridoCadenaFat(spec: SpecCadenaFat): Recorrido {
  const { bloque: B, byte } = spec
  const cadena = cadenaFat(spec.tabla, spec.inicio)
  const meta = Math.floor(byte / B)
  if (meta >= cadena.length)
    throw new Error(
      `fat: el byte ${byte} cae en el lógico ${meta} y la cadena tiene ${cadena.length} bloques`,
    )
  const off = byte % B
  const rango = (k: number) => `${k * B}–${(k + 1) * B - 1}`
  const cociente = (Math.floor((byte / B) * 100) / 100).toString().replace('.', ',')
  const pasos = meta + 2

  const filas = Math.ceil(cadena.length / POR_FILA)
  const pos = (k: number) => ({
    x: X_COL + (k % POR_FILA) * PASO_COL,
    y: 10 + Math.floor(k / POR_FILA) * FILA,
  })
  const yCuenta = 10 + filas * FILA + 10

  // estado de la caja k cuando el foco está en `cur`
  const estado = (k: number, cur: number) =>
    k === cur ? 'fat-actual' : k < cur ? 'fat-visto' : 'fat-resto'

  const fotograma = (i: number) => {
    const cur = Math.min(i, meta)
    const dir =
      `<g class="fat-dir"><rect x="${X0}" y="${15}" width="${W_DIR}" height="46" rx="8"/>` +
      texto(X0 + 12, 29, 'Entrada de directorio', { clase: 'rm-izq fat-dir-tit' }) +
      linea(X0 + 12, 47, [['archivo · inicio '], [String(spec.inicio), 'fat-inicio']]) +
      '</g>' +
      texto(X_COL - 12, 38, '→', { clase: 'fat-flecha fat-flecha-on' })
    const cajas = cadena
      .map((n, k) => {
        const { x, y } = pos(k)
        const cx = x + COL / 2
        const est = estado(k, cur)
        const ultimo = k === cadena.length - 1
        const finFila = (k + 1) % POR_FILA === 0
        const sig = ultimo
          ? texto(x + COL + 6, y + ALTO_CAJA / 2, 'EOF', { clase: 'rm-izq fat-eof' })
          : finFila
            ? ''
            : texto(x + COL + 6, y + ALTO_CAJA / 2, '→', {
                clase: `fat-flecha${k < cur ? ' fat-flecha-on' : ''}`,
              })
        return (
          `<g class="fat-caja ${est}"><rect x="${cx - CAJA / 2}" y="${y}" width="${CAJA}" height="${ALTO_CAJA}" rx="6"/>` +
          texto(cx, y + 17, 'bloque', { clase: 'fat-caja-etq' }) +
          texto(cx, y + 36, String(n), { clase: 'fat-caja-n' }) +
          texto(cx, y + 70, `lógico ${k}`, { clase: 'fat-logico' }) +
          texto(cx, y + 84, rango(k), { clase: 'fat-rango' }) +
          '</g>' +
          sig
        )
      })
      .join('')
    const m = pos(meta)
    const marca =
      `<g class="fat-marca">` +
      texto(m.x + COL / 2, m.y + 100, '▲') +
      texto(m.x + COL / 2, m.y + 114, `byte ${byte} · offset ${off}`) +
      '</g>'

    const lineas = [
      texto(X0, yCuenta, 'Qué bloque del archivo tiene el byte', { clase: 'rm-izq rm-tabla-tit' }),
      linea(X0, yCuenta + LINEA, [
        [`${byte} / ${B} = ${cociente} → lógico `],
        [String(meta), 'fat-inicio'],
      ]),
      ...cadena.slice(0, cur + 1).map((n, k) => {
        const quien = k === 0 ? `bloque ${n}` : `FAT[${cadena[k - 1]}] = ${n}`
        const fin = k === meta ? '✓ está acá' : `${byte} > ${(k + 1) * B - 1} → seguir`
        const clase = k === meta ? 'fat-linea-ok' : k < cur ? 'fat-linea-pasada' : ''
        return linea(
          X0,
          yCuenta + LINEA * (k + 2),
          [[`${quien} (lógico ${k}): ${rango(k)} · ${fin}`]],
          clase,
        )
      }),
    ]
    if (i === pasos - 1)
      lineas.push(
        linea(
          X0,
          yCuenta + LINEA * (meta + 3),
          [[`leer el bloque ${cadena[meta]} → 1 bloque leído`]],
          'fat-linea-ok',
        ),
      )

    const completar: [string, string, number][] = [
      ['Bloque del FS', String(cadena[meta]), meta],
      ['Bloques leídos', '1', pasos - 1],
    ]
    const tabla =
      texto(X_TABLA, yCuenta, 'Lo que había que completar (en este paso)', {
        clase: 'rm-izq rm-tabla-tit',
      }) +
      completar
        .map(([etq, v, p], j) => {
          const y = yCuenta + LINEA * (j + 1)
          const clase = p === i ? 'fat-comp-ok' : p > i ? 'fat-comp-falta' : ''
          return (
            `<g class="fat-comp ${clase}">` +
            texto(X_TABLA, y, etq, { clase: 'rm-izq' }) +
            texto(X_TABLA + 150, y, p > i ? `— (paso ${p + 1})` : v, { clase: 'rm-izq' }) +
            '</g>'
          )
        })
        .join('')
    return dir + cajas + marca + lineas.join('') + tabla
  }

  const s = cadena[0]
  const hops = cadena.slice(1, meta + 1).map((n, k) => `**FAT[${cadena[k]}] = ${n}**`)
  const resto = cadena.slice(meta + 1)
  const noMirar = resto.length
    ? ` ${resto.length > 1 ? 'Los bloques' : 'El bloque'} ${resto.join(', ').replace(/, (\d+)$/, ' y $1')} no hace falta mirar${resto.length > 1 ? 'los' : 'lo'}.`
    : ''
  const pasosTxt: Paso[] = Array.from({ length: pasos }, (_, i) => {
    let titulo: string
    let txt: string
    if (i === pasos - 1) {
      titulo = `Leer el bloque ${cadena[meta]}`
      txt = `La FAT está en memoria: seguir la cadena no lee el disco. Del disco solo se lee el bloque **${cadena[meta]}**: **1 bloque leído**.`
    } else if (i === meta) {
      titulo = i === 0 ? `Bloque ${s}: está acá` : `FAT[${cadena[i - 1]}] = ${cadena[i]}: está acá`
      txt =
        `Cada bloque cubre ${B} bytes. El directorio da el **${s}** (bytes ${rango(0)})` +
        (meta === 0
          ? `: **el byte está en el bloque ${s}**.`
          : `; el byte ${byte} está más adelante, así que se sigue ${hops.join(' → ')}, que cubre ${rango(meta)}: **el byte está en el bloque ${cadena[meta]}**.`) +
        noMirar
    } else if (i === 0) {
      titulo = `Bloque ${s} (lógico 0): seguir`
      txt = `Cada bloque cubre ${B} bytes: ${byte} / ${B} = ${cociente}, así que el byte está en el bloque lógico **${meta}** del archivo. El directorio da el **${s}** (lógico 0, bytes ${rango(0)}): el byte está más adelante, así que se sigue la cadena.`
    } else {
      titulo = `FAT[${cadena[i - 1]}] = ${cadena[i]} (lógico ${i}): seguir`
      txt = `**FAT[${cadena[i - 1]}] = ${cadena[i]}** cubre ${rango(i)}: el byte ${byte} está más adelante, así que se sigue.`
    }
    return {
      titulo,
      texto: txt,
      mostrar: [`paso-${i}`],
      ocultar: Array.from({ length: pasos }, (_, j) => `paso-${j}`).filter((_, j) => j !== i),
    }
  })

  return {
    ancho: 760,
    alto: yCuenta + LINEA * (meta + 3) + 14,
    titulo: spec.titulo,
    cuerpo: pasosTxt.map((_, i) => grupo(`paso-${i}`, fotograma(i), { oculto: true })),
    pasos: pasosTxt,
  }
}
