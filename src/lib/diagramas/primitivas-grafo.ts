/** Primitivas del grafo de asignación paso a paso: misma notación que ```grafo (lib/grafos/asignacion.ts). */
import { grupo, texto } from './svg'

export const R_PROC = 24
export const LADO_REC = 50

export type Nodo = { x: number; y: number; forma: 'circulo' | 'cuadrado' }

/** Punto del borde de `n` hacia (tx, ty). Copia mínima de `borde` de asignacion.ts (no exportado). */
function borde(n: Nodo, tx: number, ty: number, extra = 0) {
  const dx = tx - n.x
  const dy = ty - n.y
  const len = Math.hypot(dx, dy) || 1
  if (n.forma === 'circulo') {
    const r = R_PROC + extra
    return { x: n.x + (dx / len) * r, y: n.y + (dy / len) * r }
  }
  const h = LADO_REC / 2 + extra
  const t = Math.min(h / Math.abs(dx || 1e-9), h / Math.abs(dy || 1e-9))
  return { x: n.x + dx * t, y: n.y + dy * t }
}

const f = (n: number) => n.toFixed(1)

export const proceso = (el: string, n: Nodo, nombre: string, opts: { oculto?: boolean } = {}) =>
  grupo(el, `<circle cx="${n.x}" cy="${n.y}" r="${R_PROC}"/>` + texto(n.x, n.y, nombre), {
    clase: 'rd-proceso',
    oculto: opts.oculto,
  })

export const recurso = (el: string, n: Nodo, nombre: string) =>
  grupo(
    el,
    `<rect x="${n.x - LADO_REC / 2}" y="${n.y - LADO_REC / 2}" width="${LADO_REC}" height="${LADO_REC}" rx="8"/>` +
      texto(n.x, n.y - 6, nombre),
    { clase: 'rd-recurso' },
  )

/** Puntos de las instancias de un recurso; va aparte del recurso para poder cambiar la cantidad por pestaña. */
export const instancias = (el: string, n: Nodo, cantidad: number) =>
  grupo(
    el,
    Array.from(
      { length: cantidad },
      (_, k) => `<circle cx="${n.x - ((cantidad - 1) * 9) / 2 + k * 9}" cy="${n.y + 12}" r="3"/>`,
    ).join(''),
    { oculto: true, clase: 'rd-instancia' },
  )

/** Arista recto → punta; la punta es un `<path>` propio porque el cliente reescribe los `marker-end`. */
export function arista(el: string, desde: Nodo, hasta: Nodo, tipo: 'asignacion' | 'solicitud') {
  const a = borde(desde, hasta.x, hasta.y)
  const b = borde(hasta, desde.x, desde.y, 2)
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const base = { x: b.x - ux * 10, y: b.y - uy * 10 }
  const punta =
    `M${f(b.x)},${f(b.y)} L${f(base.x - uy * 5)},${f(base.y + ux * 5)} ` +
    `L${f(base.x + uy * 5)},${f(base.y - ux * 5)} z`
  return grupo(
    el,
    `<path class="rd-linea" d="M${f(a.x)},${f(a.y)} L${f(base.x)},${f(base.y)}"/>` +
      `<path class="rd-punta" d="${punta}"/>`,
    { oculto: true, clase: `rd-arista rd-${tipo}` },
  )
}

/** Referencias de la notación (el recorrido no tiene el figcaption del ```grafo). */
export const leyenda = (x: number, y: number) =>
  `<g class="rd-leyenda">` +
  `<path class="rd-ley-asignacion" d="M${x},${y} h24"/>` +
  texto(x + 32, y, 'asignación (recurso → proceso)', { clase: 'rs-nota rs-izq' }) +
  `<path class="rd-ley-solicitud" d="M${x},${y + 20} h24"/>` +
  texto(x + 32, y + 20, 'solicitud (proceso → recurso)', { clase: 'rs-nota rs-izq' }) +
  `<circle class="rd-ley-instancia" cx="${x + 12}" cy="${y + 40}" r="3"/>` +
  texto(x + 32, y + 40, 'instancia', { clase: 'rs-nota rs-izq' }) +
  `</g>`
