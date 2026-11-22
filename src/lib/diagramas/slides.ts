/** Slides de un recorrido (Metodología): chips de lo ya resuelto arriba y, abajo, tablas, chequeos y resultados. */
import type { Paso, Recorrido, Variante } from './recorrido'
import { grupo, texto } from './svg'

export const X0 = 20
export const ANCHO = 760
export const Y = 52 // debajo de los chips de lo ya resuelto

export interface Slide {
  titulo: string
  texto: string
  svg: string
  alto: number
}

/** Una pestaña por grupo (o ninguna si hay uno solo); cada slide es un fotograma que se muestra solo. */
export function recorridoDeSlides(
  titulo: string,
  grupos: { nombre: string; slides: Slide[] }[],
): Recorrido {
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
  const base = { ancho: ANCHO, alto, titulo, cuerpo }
  return variantes.length === 1
    ? { ...base, pasos: pasos(variantes[0]) }
    : {
        ...base,
        variantes: variantes.map((v): Variante => ({ nombre: v.nombre, pasos: pasos(v) })),
      }
}

/** Piezas de una slide: chips de lo ya resuelto arriba, y tablas, chequeos y resultados abajo. */
export function armador() {
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
    filas: { celdas: string[]; sel: boolean; foco?: number; tenue?: boolean }[],
  ) => {
    // cada columna mide lo que su texto más largo (encabezado o celda)
    const anchos = encab.map((h, j) =>
      Math.max(56, h.length * 9 + 24, ...filas.map((f) => (f.celdas[j] ?? '').length * 8.6 + 24)),
    )
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
              `<g class="${f.sel ? 'tr-fila-sel' : f.tenue === false ? 'tr-fila' : 'tr-fila-otra'}">` +
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

/** Bits en casillas; deja un hueco donde cambia de campo. `clases`: seg, pag, off o frame. */
export function filaBits(b: string, clases: string[], y: number): string {
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
