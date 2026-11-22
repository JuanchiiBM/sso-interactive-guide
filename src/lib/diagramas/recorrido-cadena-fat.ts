/** Cadena FAT (```fat): entrada de directorio → bloques en orden → EOF, hasta un byte o la cadena completa. Ver brain: Resolución gráfica paso a paso. */
import type { Paso, Recorrido } from './recorrido'
import { esc, grupo, texto } from './svg'

export interface SpecCadenaFat {
  titulo: string
  /** Entrada → siguiente bloque, o EOF / FIN. */
  tabla: Record<number, number | string>
  inicio: number
  /** Tamaño de bloque en bytes. */
  bloque: number
  /** Sin byte se recorre la cadena completa. */
  byte?: number
  /** Número del primer bloque lógico (ej-46 cuenta desde 1). */
  desde?: number
  /** Qué completaba el alumno en la cadena completa: los bloques en orden o las entradas de la FAT. */
  completar?: 'bloques' | 'fat'
  /** Contenido de cada bloque (ej-30): va bajo la caja y se arma el del archivo. */
  contenido?: Record<number, string>
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
const ORDINAL = ['1.er', '2.º', '3.er', '4.º', '5.º', '6.º', '7.º', '8.º', '9.º', '10.º']

const esFin = (v: number | string) => typeof v === 'string' && /^(eof|fin)/i.test(v.trim())
const bytes = (n: number) => (n % 1024 ? `${n} B` : `${n / 1024} KiB`)

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

type Tramos = [string, string?][]

/** Texto con tramos de distinta clase. */
const linea = (x: number, y: number, tramos: Tramos, clase = '') =>
  `<text class="rm-izq ${clase}" x="${x}" y="${y}">` +
  tramos.map(([t, c]) => (c ? `<tspan class="${c}">${esc(t)}</tspan>` : esc(t))).join('') +
  '</text>'

/** Lo que cambia entre "hasta un byte" y "cadena completa". */
interface Modo {
  foco: (i: number) => number
  marca: string
  tituloCuenta: string
  cuenta: (i: number) => [Tramos, string][]
  completar: [string, string, number][]
  textos: { titulo: string; texto: string }[]
}

export function recorridoCadenaFat(spec: SpecCadenaFat): Recorrido {
  const B = spec.bloque
  const cadena = cadenaFat(spec.tabla, spec.inicio)
  const n = cadena.length
  const L = (k: number) => k + (spec.desde ?? 0)
  const rango = (k: number) => `${k * B}–${(k + 1) * B - 1}`
  const pos = (k: number) => ({
    x: X_COL + (k % POR_FILA) * PASO_COL,
    y: 10 + Math.floor(k / POR_FILA) * FILA,
  })
  const yCuenta = 10 + Math.ceil(n / POR_FILA) * FILA + 10

  function modoByte(byte: number): Modo {
    const meta = Math.floor(byte / B)
    if (meta >= n)
      throw new Error(
        `fat: el byte ${byte} cae en el lógico ${meta} y la cadena tiene ${n} bloques`,
      )
    const cociente = (Math.floor((byte / B) * 100) / 100).toString().replace('.', ',')
    const pasos = meta + 2
    const m = pos(meta)
    const s = cadena[0]
    const hops = cadena.slice(1, meta + 1).map((b, k) => `**FAT[${cadena[k]}] = ${b}**`)
    const resto = cadena.slice(meta + 1)
    const noMirar = resto.length
      ? ` ${resto.length > 1 ? 'Los bloques' : 'El bloque'} ${resto.join(', ').replace(/, (\d+)$/, ' y $1')} no hace falta mirar${resto.length > 1 ? 'los' : 'lo'}.`
      : ''
    const textos = Array.from({ length: pasos }, (_, i) => {
      if (i === pasos - 1)
        return {
          titulo: `Leer el bloque ${cadena[meta]}`,
          texto: `La FAT está en memoria: seguir la cadena no lee el disco. Del disco solo se lee el bloque **${cadena[meta]}**: **1 bloque leído**.`,
        }
      if (i === meta)
        return {
          titulo:
            i === 0 ? `Bloque ${s}: está acá` : `FAT[${cadena[i - 1]}] = ${cadena[i]}: está acá`,
          texto:
            `Cada bloque cubre ${B} bytes. El directorio da el **${s}** (bytes ${rango(0)})` +
            (meta === 0
              ? `: **el byte está en el bloque ${s}**.`
              : `; el byte ${byte} está más adelante, así que se sigue ${hops.join(' → ')}, que cubre ${rango(meta)}: **el byte está en el bloque ${cadena[meta]}**.`) +
            noMirar,
        }
      if (i === 0)
        return {
          titulo: `Bloque ${s} (lógico ${L(0)}): seguir`,
          texto: `Cada bloque cubre ${B} bytes: ${byte} / ${B} = ${cociente}, así que el byte está en el bloque lógico **${L(meta)}** del archivo. El directorio da el **${s}** (lógico ${L(0)}, bytes ${rango(0)}): el byte está más adelante, así que se sigue la cadena.`,
        }
      return {
        titulo: `FAT[${cadena[i - 1]}] = ${cadena[i]} (lógico ${L(i)}): seguir`,
        texto: `**FAT[${cadena[i - 1]}] = ${cadena[i]}** cubre ${rango(i)}: el byte ${byte} está más adelante, así que se sigue.`,
      }
    })
    return {
      foco: (i) => Math.min(i, meta),
      marca:
        `<g class="fat-marca">` +
        texto(m.x + COL / 2, m.y + 100, '▲') +
        texto(m.x + COL / 2, m.y + 114, `byte ${byte} · offset ${byte % B}`) +
        '</g>',
      tituloCuenta: 'Qué bloque del archivo tiene el byte',
      cuenta: (i) => {
        const cur = Math.min(i, meta)
        const out: [Tramos, string][] = [
          [[[`${byte} / ${B} = ${cociente} → lógico `], [String(L(meta)), 'fat-inicio']], ''],
          ...cadena.slice(0, cur + 1).map((b, k): [Tramos, string] => {
            const quien = k === 0 ? `bloque ${b}` : `FAT[${cadena[k - 1]}] = ${b}`
            const fin = k === meta ? '✓ está acá' : `${byte} > ${(k + 1) * B - 1} → seguir`
            const clase = k === meta ? 'fat-linea-ok' : k < cur ? 'fat-linea-pasada' : ''
            return [[[`${quien} (lógico ${L(k)}): ${rango(k)} · ${fin}`]], clase]
          }),
        ]
        if (i === pasos - 1)
          out.push([[[`leer el bloque ${cadena[meta]} → 1 bloque leído`]], 'fat-linea-ok'])
        return out
      },
      completar: [
        ['Bloque del FS', String(cadena[meta]), meta],
        ['Bloques leídos', '1', pasos - 1],
      ],
      textos,
    }
  }

  function modoCadena(): Modo {
    const sig = (k: number) => String(k < n - 1 ? cadena[k + 1] : spec.tabla[cadena[k]])
    const total = `${n} bloque${n > 1 ? 's' : ''} × ${B} B = ${bytes(n * B)} asignados`
    const cont = spec.contenido
    for (const b of cont ? cadena : [])
      if (cont![b] == null) throw new Error(`fat: falta el contenido del bloque ${b}`)
    const leido = (i: number) =>
      cadena
        .slice(0, i + 1)
        .map((b) => cont![b])
        .join('')
    const aporta = (k: number) =>
      !cont
        ? ''
        : k === n - 1
          ? ` El contenido es \`${leido(k)}\`.`
          : ` Aporta \`${cont[cadena[k]]}\`.`
    return {
      foco: (i) => i,
      marca: '',
      tituloCuenta: 'Seguir la cadena hasta EOF',
      cuenta: (i) => {
        const out = cadena
          .slice(0, i + 1)
          .map((b, k): [Tramos, string] => [
            [
              [
                `lógico ${L(k)}: bloque ${b} · FAT[${b}] = ${sig(k)} → ${k < n - 1 ? 'seguir' : 'fin'}`,
              ],
            ],
            k < i ? 'fat-linea-pasada' : k === n - 1 ? 'fat-linea-ok' : '',
          ])
        if (spec.contenido) out.push([[['contenido: '], [leido(i), 'fat-inicio']], ''])
        if (i === n - 1) out.push([[[total]], 'fat-linea-ok'])
        return out
      },
      completar: spec.contenido
        ? [
            ['Primer cluster', String(cadena[0]), 0],
            ['Contenido', leido(n - 1), n - 1],
          ]
        : cadena.map((b, k) =>
            spec.completar === 'fat'
              ? [`FAT[${b}]`, sig(k), k]
              : [`${ORDINAL[k] ?? `${k + 1}.º`} bloque`, String(b), k],
          ),
      textos: cadena.map((b, k) =>
        k === n - 1
          ? {
              titulo: `FAT[${b}] = ${sig(k)}: fin`,
              texto: `El lógico ${L(k)} es el bloque **${b}** y **FAT[${b}] = ${sig(k)}**: es el último. Son **${total}**.${aporta(k)}`,
            }
          : {
              titulo: `${k === 0 ? `Bloque ${b}` : `FAT[${cadena[k - 1]}] = ${b}`} (lógico ${L(k)}): seguir`,
              texto:
                (k === 0
                  ? `El directorio da el primer bloque: **${b}** (lógico ${L(0)}). Cada entrada de la FAT dice cuál sigue: `
                  : `El lógico ${L(k)} es el bloque **${b}**; `) +
                `**FAT[${b}] = ${sig(k)}** → se sigue.${aporta(k)}`,
            },
      ),
    }
  }

  const modo = spec.byte == null ? modoCadena() : modoByte(spec.byte)

  // estado de la caja k cuando el foco está en `cur`
  const estado = (k: number, cur: number) =>
    k === cur ? 'fat-actual' : k < cur ? 'fat-visto' : 'fat-resto'

  const fotograma = (i: number) => {
    const cur = modo.foco(i)
    const dir =
      `<g class="fat-dir"><rect x="${X0}" y="${15}" width="${W_DIR}" height="46" rx="8"/>` +
      texto(X0 + 12, 29, 'Entrada de directorio', { clase: 'rm-izq fat-dir-tit' }) +
      linea(X0 + 12, 47, [['archivo · inicio '], [String(spec.inicio), 'fat-inicio']]) +
      '</g>' +
      texto(X_COL - 12, 38, '→', { clase: 'fat-flecha fat-flecha-on' })
    const cajas = cadena
      .map((b, k) => {
        const { x, y } = pos(k)
        const cx = x + COL / 2
        const sig =
          k === n - 1
            ? texto(x + COL + 6, y + ALTO_CAJA / 2, 'EOF', { clase: 'rm-izq fat-eof' })
            : (k + 1) % POR_FILA === 0
              ? ''
              : texto(x + COL + 6, y + ALTO_CAJA / 2, '→', {
                  clase: `fat-flecha${k < cur ? ' fat-flecha-on' : ''}`,
                })
        return (
          `<g class="fat-caja ${estado(k, cur)}"><rect x="${cx - CAJA / 2}" y="${y}" width="${CAJA}" height="${ALTO_CAJA}" rx="6"/>` +
          texto(cx, y + 17, 'bloque', { clase: 'fat-caja-etq' }) +
          texto(cx, y + 36, String(b), { clase: 'fat-caja-n' }) +
          texto(cx, y + 70, `lógico ${L(k)}`, { clase: 'fat-logico' }) +
          texto(cx, y + 84, rango(k), { clase: 'fat-rango' }) +
          (spec.contenido
            ? texto(cx, y + 100, spec.contenido[b], { clase: 'fat-contenido' })
            : '') +
          '</g>' +
          sig
        )
      })
      .join('')
    const cuenta =
      texto(X0, yCuenta, modo.tituloCuenta, { clase: 'rm-izq rm-tabla-tit' }) +
      modo
        .cuenta(i)
        .map(([tramos, clase], j) => linea(X0, yCuenta + LINEA * (j + 1), tramos, clase))
        .join('')
    const tabla =
      texto(X_TABLA, yCuenta, 'Lo que había que completar (en este paso)', {
        clase: 'rm-izq rm-tabla-tit',
      }) +
      modo.completar
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
    return dir + cajas + modo.marca + cuenta + tabla
  }

  const pasos: Paso[] = modo.textos.map((t, i) => ({
    ...t,
    mostrar: [`paso-${i}`],
    ocultar: modo.textos.map((_, j) => `paso-${j}`).filter((_, j) => j !== i),
  }))
  const renglones = Math.max(...pasos.map((_, i) => modo.cuenta(i).length), modo.completar.length)

  return {
    ancho: 760,
    alto: yCuenta + LINEA * renglones + 24,
    titulo: spec.titulo,
    cuerpo: pasos.map((_, i) => grupo(`paso-${i}`, fotograma(i), { oculto: true })),
    pasos,
  }
}
