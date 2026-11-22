/** Bloque ```inodo: lectura de un rango por los punteros del inodo, un paso por puntero. Ver brain: Resolución gráfica paso a paso. */
import type { Paso, Recorrido } from './recorrido'
import {
  accesosPorPuntero,
  punterosPorBloque,
  totalBP,
  type AccesosPuntero,
  type Conformacion,
} from './filesystem'
import { grupo } from './svg'
import { dibujoPuntero, dibujoTotal, dibujoUbicar } from './recorrido-inodo-svg'

export interface SpecInodo {
  titulo: string
  /** Tamaño de bloque y de puntero, en bytes. */
  bloque: number
  puntero: number
  punteros: Conformacion
  /** Uno de los tres: rango de bytes, un byte o rango de bloques lógicos (base 0, inclusivo). */
  bytes?: [number, number]
  byte?: number
  bloques?: [number, number]
  /** Texto del autor para el paso Ubicar (p. ej. "el bloque 8 ya está en memoria"). */
  texto?: string
}

const NOMBRE = [
  '',
  'puntero indirecto simple',
  'puntero indirecto doble',
  'puntero indirecto triple',
]

/** Miles con punto desde 5 cifras (65.801), como en las justificaciones. */
export const num = (n: number) => (Math.abs(n) >= 10000 ? n.toLocaleString('es-AR') : String(n))

/** Cociente truncado a 2 decimales: 544767 / 1024 = 531,99 (redondeado daría 532). */
const cociente = (a: number, b: number) => {
  const q = Math.floor((a / b) * 100) / 100
  return q.toLocaleString('es-AR', { maximumFractionDigits: 2, useGrouping: q >= 10000 })
}

const tam = (b: number) => (b % 1024 ? `${b} B` : `${b / 1024} KiB`)
const rango = ([a, b]: [number, number]) => (a === b ? num(a) : `${num(a)} – ${num(b)}`)

/** Cómo se reparten n bloques en BP de `unidad` entradas, empezando en el desplazamiento `off`. */
export function reparto(off: number, n: number, unidad: number) {
  const primero = Math.min(n, unidad - (off % unidad))
  const k = 1 + Math.ceil((n - primero) / unidad)
  const ultimo = k === 1 ? primero : n - primero - (k - 2) * unidad
  const terminos: string[] = []
  const llenos = k - (primero < unidad ? 1 : 0) - (k > 1 && ultimo < unidad ? 1 : 0)
  if (primero < unidad) terminos.push(num(primero))
  if (llenos) terminos.push(llenos > 1 ? `${num(llenos)} × ${num(unidad)}` : num(unidad))
  if (k > 1 && ultimo < unidad) terminos.push(num(ultimo))
  return { k, primero, ultimo, expr: terminos.join(' + ') }
}

function datosDelRango(spec: SpecInodo): { primero: number; ultimo: number } {
  const formas = [spec.bytes, spec.byte, spec.bloques].filter((x) => x != null).length
  if (formas !== 1) throw new Error('inodo: va uno de `bytes`, `byte` o `bloques`')
  if (spec.bloque % spec.puntero)
    throw new Error(
      `inodo: el bloque (${spec.bloque}) no es múltiplo del puntero (${spec.puntero})`,
    )
  const [a, b] =
    spec.bloques ?? (spec.bytes ?? [spec.byte!, spec.byte!]).map((x) => Math.floor(x / spec.bloque))
  if (a > b) throw new Error(`inodo: el rango empieza después de terminar (${a} > ${b})`)
  return { primero: a, ultimo: b }
}

export function recorridoInodo(spec: SpecInodo): Recorrido {
  const { primero, ultimo } = datosDelRango(spec)
  const ppb = punterosPorBloque(spec.bloque, spec.puntero)
  let ps: AccesosPuntero[]
  try {
    ps = accesosPorPuntero(spec.punteros, spec.bloque, spec.puntero, primero, ultimo)
  } catch {
    throw new Error(`inodo: el bloque ${num(ultimo)} pasa el máximo del archivo`)
  }
  const ultimoLeido = ps.findLastIndex((p) => p.leidos)
  const pasosPunteros = ps.slice(0, ultimoLeido + 1)
  const leidos = pasosPunteros.filter((p) => p.leidos)
  const datos = ps.reduce((s, p) => s + p.datos, 0)
  const bp = ps.reduce((s, p) => s + totalBP(p), 0)

  const ubicar = () => {
    const ppbTxt = `Punteros por bloque: \`${tam(spec.bloque)} / ${spec.puntero} B =\` **${num(ppb)}**.`
    const [p0, p1] = [leidos[0], leidos.at(-1)!]
    const por =
      p0 === p1
        ? `todo por ${p0.nivel ? `el ${p0.rotulo}` : 'los PD'}`
        : `${p0.nivel ? `del ${p0.rotulo}` : 'de los PD'} al ${p1.rotulo}`
    const n = ultimo - primero + 1
    const cuenta = `${n > 1 ? `\`${num(ultimo)} − ${num(primero)} + 1 =\` ` : ''}**${num(n)} bloque${n > 1 ? 's' : ''} de datos**, ${por}.`
    const B = spec.bloque
    const enBloque = (x: number, k: number) =>
      `\`${num(x)} / ${B} = ${cociente(x, B)}\` → **${num(k)}**`
    let lee: string
    if (spec.byte != null)
      lee = `El byte ${num(spec.byte)} está en el bloque ${enBloque(spec.byte, primero)}. Se lee ${cuenta}`
    else if (spec.bytes)
      lee = `El byte ${num(spec.bytes[0])} está en el bloque ${enBloque(spec.bytes[0], primero)}, y el ${num(spec.bytes[1])} en ${enBloque(spec.bytes[1], ultimo)}. Se leen ${cuenta}`
    else lee = `Se leen los bloques lógicos **${rango([primero, ultimo])}**: ${cuenta}`
    return [ppbTxt, lee, spec.texto].filter(Boolean).join(' ')
  }

  const textoPuntero = (p: AccesosPuntero) => {
    const cubre = `**${rango([p.inicio, p.fin])}**`
    if (p.nivel === 0) {
      const base = `Los **${p.rotulo}** (punteros directos) apuntan a los bloques ${cubre}.`
      const lee = p.leidos
        ? `Se leen los bloques **${rango(p.leidos)}**: **${num(p.datos)}** de datos.`
        : `La lectura empieza en el ${num(primero)}: de los PD **no se lee ninguno**.`
      return `${base} ${lee} Un PD apunta directo al dato, así que nunca suma bloques de punteros.`
    }
    if (!p.leidos)
      return `El **${p.rotulo}** (${NOMBRE[p.nivel]}) cubre los bloques ${cubre}, antes de donde empieza la lectura: no se lee nada.`
    const [a, b] = p.leidos
    const cae = `Los bloques **${rango(p.leidos)}** caen en el **${p.rotulo}** (${NOMBRE[p.nivel]}).`
    const bpTxt = `Se leen **${p.bp.map(num).join(' + ')} bloque${totalBP(p) > 1 ? 's' : ''} de punteros**.`
    if (p.nivel === 1) {
      const usa = p.datos === ppb ? '**todas**' : `**${num(p.datos)}**`
      return `${cae} Su bloque de punteros tiene ${num(ppb)} entradas y se usan ${usa}: se leen **${num(p.datos)} bloques de datos** y **1 bloque de punteros**.`
    }
    const r = reparto(a - p.inicio, p.datos, ppb)
    const ult = p.bp.at(-1)!
    const hoja = p.nivel === 2 ? 'bloques de punteros simples' : `BP de ${p.nivel}.er nivel`
    let detalle: string
    if (r.k === 1) detalle = `Entran en un solo bloque de punteros de ${p.nivel}.º nivel`
    else if (r.k === 2 && p.nivel === 2) {
      const corte = a + r.primero
      detalle = `Son ${num(p.datos)} = ${r.expr}: el primer bloque de punteros simples cubre ${num(r.primero)} (${rango([a, corte - 1])}) y hace falta **un segundo** para los ${num(r.ultimo)} que quedan (${rango([corte, b])})`
    } else if (r.primero === ppb && r.ultimo === ppb)
      detalle = `Son ${num(p.datos)} = ${r.expr}: se usan **${num(r.k)}** ${hoja}, enteros`
    else
      detalle = `Son ${num(p.datos)} = ${r.expr}: hacen falta **${num(r.k)}** ${hoja}${r.ultimo < ppb ? ` (el último con ${num(r.ultimo)})` : ''}`
    if (p.nivel === 3) {
      const medio = p.bp[1]
      const techo = Math.ceil(ult / ppb) === medio ? `⌈${num(ult)} / ${num(ppb)}⌉ = ` : ''
      detalle += `, y a esos los apuntan ${techo}**${num(medio)}** BP de 2.º nivel`
    }
    return `${cae} ${detalle}. ${bpTxt}`
  }

  const pasos: Paso[] = [
    { titulo: 'Ubicar', texto: ubicar() },
    ...pasosPunteros.map((p) => ({ titulo: p.rotulo, texto: textoPuntero(p) })),
    {
      titulo: 'Total',
      texto: `Sumando los punteros: **${num(datos)} bloques de datos** + **${num(bp)} bloque${bp === 1 ? '' : 's'} de punteros** = **${num(datos + bp)} accesos**. El inodo ya estaba en memoria: no cuenta.`,
    },
  ].map((p, k, todos) => ({
    ...p,
    resaltar: [`paso-${k}`],
    mostrar: [`paso-${k}`],
    ocultar: todos.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
  }))

  const dibujos = [
    dibujoUbicar(ps, primero, ultimo, ppb),
    ...pasosPunteros.map((_, i) => dibujoPuntero(ps, i, ppb, primero)),
    dibujoTotal(ps),
  ]
  return {
    ancho: Math.max(760, ...dibujos.map((d) => d.ancho + 20)),
    alto: Math.max(...dibujos.map((d) => d.alto)) + 4,
    titulo: spec.titulo,
    cuerpo: dibujos.map((d, k) => grupo(`paso-${k}`, d.svg, { oculto: true, clase: 'in-paso' })),
    pasos,
  }
}
