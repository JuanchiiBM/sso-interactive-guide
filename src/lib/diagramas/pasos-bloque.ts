/** Bloque ```pasos: un ejemplo de la Metodología como slides (campos, tabla, chequeo y resultado). Ver brain. */
import { parse } from 'yaml'
import { renderRecorrido, type Recorrido } from './recorrido'
import { X0, Y, armador, recorridoDeSlides, type Slide } from './slides'
import { esc, texto } from './svg'

export interface PasoYaml {
  titulo: string
  texto: string
  /** Chips que quedan arriba en los pasos siguientes (un ✓ adelante lo pinta de verde). */
  resultado?: string | string[]
  /** Borra los chips acumulados antes de este paso. */
  limpiar?: boolean
  /** Barra de campos de una dirección: cada uno con su cantidad de bits. */
  campos?: { nombre: string; bits: number | string; tipo?: 'seg' | 'pag' | 'off' | 'frame' }[]
  tabla?: {
    titulo?: string
    columnas: string[]
    filas: (string | number)[][]
    /** Filas marcadas (índice desde 0); con marca, las otras quedan tenues. */
    marca?: number | number[]
    /** Columna en acento dentro de la fila marcada. */
    foco?: number
  }
  chequeo?: { ok: boolean; texto: string }
  /** Resultado grande; `**x**` va en acento. */
  grande?: string
}

export interface SpecPasos {
  titulo: string
  pasos?: PasoYaml[]
  variantes?: { nombre: string; pasos: PasoYaml[] }[]
}

const acento = (t: string) =>
  esc(t).replace(/\*\*([^*]+)\*\*/g, '<tspan class="tr-acento">$1</tspan>')

function slides(pasos: PasoYaml[], contexto: string): Slide[] {
  const a = armador()
  for (const [i, p] of pasos.entries()) {
    if (!p.titulo || !p.texto) throw new Error(`${contexto}, paso ${i + 1}: falta titulo o texto`)
    if (p.limpiar) a.hechos.length = 0
    let izq = 0
    let alto = 0
    let svg = ''
    if (p.campos) {
      let x = X0
      for (const c of p.campos) {
        const n = typeof c.bits === 'number' ? c.bits : 4
        const w = Math.max(70, n * 14, c.nombre.length * 8 + 20)
        svg +=
          `<g class="tr-bit tr-bit-${c.tipo ?? 'off'}"><rect x="${x}" y="${Y}" width="${w}" height="44" rx="4"/>` +
          texto(x + w / 2, Y + 15, c.nombre) +
          texto(x + w / 2, Y + 32, `${c.bits} bits`) +
          '</g>'
        x += w + 6
      }
      izq = x - X0
      alto = 54
    }
    if (p.tabla) {
      const marca = [p.tabla.marca ?? []].flat()
      const t = a.tabla(
        X0,
        Y + alto + (alto ? 14 : 0),
        p.tabla.titulo ?? '',
        p.tabla.columnas,
        p.tabla.filas.map((f, j) => ({
          celdas: f.map(String),
          sel: marca.includes(j),
          tenue: marca.length > 0 && !marca.includes(j),
          foco: marca.includes(j) ? p.tabla!.foco : undefined,
        })),
      )
      svg += t.svg
      izq = Math.max(izq, t.ancho)
      alto += (alto ? 14 : 0) + t.alto
    }
    // chequeo y resultado: a la derecha si hay tabla o campos, si no arriba de todo
    const xd = izq ? X0 + izq + 36 : X0
    let yd = Y
    if (p.chequeo) {
      svg += a.chequeo(xd, yd, p.chequeo.ok, p.chequeo.texto)
      yd += 52
    }
    if (p.grande) {
      svg += `<text class="rm-izq tr-grande" x="${xd}" y="${yd + 22}">${acento(p.grande)}</text>`
      yd += 40
    }
    a.agregar(p.titulo, p.texto, svg, Math.max(alto, yd - Y))
    for (const r of [p.resultado ?? []].flat()) a.hechos.push({ t: r, ok: r.startsWith('✓') })
  }
  return a.slides
}

export function recorridoPasos(spec: SpecPasos): Recorrido {
  if (!spec.titulo) throw new Error('Bloque pasos: falta `titulo`')
  const grupos = spec.variantes
    ? spec.variantes.map((v) => ({ nombre: v.nombre, slides: slides(v.pasos, v.nombre) }))
    : [{ nombre: '', slides: slides(spec.pasos ?? [], spec.titulo) }]
  if (!grupos.every((g) => g.slides.length))
    throw new Error(`Bloque pasos (${spec.titulo}): lleva \`pasos\` o \`variantes\``)
  return recorridoDeSlides(spec.titulo, grupos)
}

export const renderPasos = (codigo: string) =>
  renderRecorrido(recorridoPasos((parse(codigo) ?? {}) as SpecPasos))
