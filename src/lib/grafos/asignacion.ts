/**
 * Grafo de asignación de recursos → SVG estático (se usa en build, sin DOM).
 * Formato del bloque y decisiones de layout: docs/brain/contenido/Bloques SVG grafo y diagrama.md
 */

export interface GrafoAsignacion {
  procesos: string[]
  recursos: { id: string; instancias: number }[]
  /** Recurso → proceso = asignación; proceso → recurso = solicitud. */
  aristas: { desde: string; hasta: string; tipo: 'asignacion' | 'solicitud' }[]
  resaltarCiclo: boolean
}

export function parsearGrafo(fuente: string): GrafoAsignacion {
  const procesos: string[] = []
  const recursos: GrafoAsignacion['recursos'] = []
  const aristas: GrafoAsignacion['aristas'] = []
  let resaltarCiclo = false

  for (const cruda of fuente.split('\n')) {
    const linea = cruda.replace(/#.*/, '').trim()
    if (!linea) continue
    const [clave, resto] = linea.split(/:(.*)/s).map((s) => s?.trim())
    if (clave === 'procesos' && resto) {
      procesos.push(...resto.split(/[\s,]+/).filter(Boolean))
    } else if (clave === 'recursos' && resto) {
      for (const r of resto.split(/[\s,]+/).filter(Boolean)) {
        const [id, n] = r.split(/[×x*=]/)
        recursos.push({ id, instancias: Math.max(1, Number(n) || 1) })
      }
    } else if (linea === 'resaltar-ciclo') {
      resaltarCiclo = true
    } else {
      const m = linea.match(/^(\S+)\s*->\s*(\S+)$/)
      if (!m) throw new Error(`Línea inválida en grafo: "${linea}"`)
      aristas.push({ desde: m[1], hasta: m[2], tipo: 'asignacion' })
    }
  }

  const esRecurso = new Set(recursos.map((r) => r.id))
  const esProceso = new Set(procesos)
  for (const a of aristas) {
    if (esRecurso.has(a.desde) && esProceso.has(a.hasta)) a.tipo = 'asignacion'
    else if (esProceso.has(a.desde) && esRecurso.has(a.hasta)) a.tipo = 'solicitud'
    else throw new Error(`Arista ${a.desde} -> ${a.hasta}: debe unir un proceso y un recurso`)
  }
  return { procesos, recursos, aristas, resaltarCiclo }
}

/** Aristas que pertenecen a algún ciclo dirigido (DFS por componente). */
export function aristasEnCiclo(g: GrafoAsignacion): Set<number> {
  const ady = new Map<string, number[]>()
  g.aristas.forEach((a, i) => ady.set(a.desde, [...(ady.get(a.desde) ?? []), i]))
  const enCiclo = new Set<number>()
  const alcanza = (desde: string, objetivo: string, vistos = new Set<string>()): boolean => {
    if (desde === objetivo) return true
    if (vistos.has(desde)) return false
    vistos.add(desde)
    return (ady.get(desde) ?? []).some((i) => alcanza(g.aristas[i].hasta, objetivo, vistos))
  }
  g.aristas.forEach((a, i) => {
    if (alcanza(a.hasta, a.desde)) enCiclo.add(i)
  })
  return enCiclo
}

const SEP = 130
const MARGEN_X = 50
const Y_PROC = 50
const Y_REC = 190
const R_PROC = 24
const LADO_REC = 50
/** Tamaño en pantalla respecto del viewBox. */
const ESCALA = 1.4

type Pos = { x: number; y: number; forma: 'circulo' | 'cuadrado' }

/** Procesos arriba, recursos abajo; los recursos se ordenan por baricentro para cruzar menos. */
function layout(g: GrafoAsignacion) {
  const ancho = Math.max(g.procesos.length, g.recursos.length, 2)
  const offset = (n: number) => ((ancho - n) * SEP) / 2
  const pos = new Map<string, Pos>()
  g.procesos.forEach((p, i) =>
    pos.set(p, { x: MARGEN_X + offset(g.procesos.length) + i * SEP, y: Y_PROC, forma: 'circulo' }),
  )
  const idxProc = new Map(g.procesos.map((p, i) => [p, i]))
  const baricentro = (r: string) => {
    const vecinos = g.aristas
      .filter((a) => a.desde === r || a.hasta === r)
      .map((a) => idxProc.get(a.desde === r ? a.hasta : a.desde)!)
    return vecinos.length ? vecinos.reduce((s, v) => s + v, 0) / vecinos.length : Infinity
  }
  const ordenados = g.recursos
    .map((r, i) => ({ r, b: baricentro(r.id), i }))
    .sort((a, b) => a.b - b.b || a.i - b.i)
  ordenados.forEach(({ r }, i) =>
    pos.set(r.id, {
      x: MARGEN_X + offset(g.recursos.length) + i * SEP,
      y: Y_REC,
      forma: 'cuadrado',
    }),
  )
  return { pos, width: MARGEN_X * 2 + (ancho - 1) * SEP, height: Y_REC + 60 }
}

/** Punto del borde de `n` en dirección a (tx, ty). */
function borde(n: Pos, tx: number, ty: number, extra = 0) {
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

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function grafoAsignacionSVG(g: GrafoAsignacion): string {
  const { pos, width, height } = layout(g)
  const ciclo = g.resaltarCiclo ? aristasEnCiclo(g) : new Set<number>()
  const partes: string[] = []

  // aristas opuestas entre el mismo par (P→R y R→P) se curvan para no superponerse
  const pares = new Set(g.aristas.map((a) => `${a.desde}|${a.hasta}`))
  g.aristas.forEach((a, i) => {
    const A = pos.get(a.desde)!
    const B = pos.get(a.hasta)!
    const curva = pares.has(`${a.hasta}|${a.desde}`) ? 28 : 0
    const mx = (A.x + B.x) / 2
    const my = (A.y + B.y) / 2
    const len = Math.hypot(B.x - A.x, B.y - A.y) || 1
    const cx = mx + (-(B.y - A.y) / len) * curva
    const cy = my + ((B.x - A.x) / len) * curva
    const p1 = borde(A, cx, cy)
    const p2 = borde(B, cx, cy, 5)
    const clase = `grafo-arista grafo-${a.tipo}${ciclo.has(i) ? ' grafo-ciclo' : ''}`
    const marker = ciclo.has(i) ? 'flecha-ciclo' : `flecha-${a.tipo}`
    const d = curva
      ? `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
      : `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
    partes.push(`<path class="${clase}" d="${d}" marker-end="url(#${marker})"/>`)
  })

  for (const p of g.procesos) {
    const { x, y } = pos.get(p)!
    partes.push(
      `<g class="grafo-proceso"><circle cx="${x}" cy="${y}" r="${R_PROC}"/>` +
        `<text x="${x}" y="${y}">${esc(p)}</text></g>`,
    )
  }
  for (const r of g.recursos) {
    const { x, y } = pos.get(r.id)!
    const h = LADO_REC / 2
    const puntos = Array.from({ length: r.instancias }, (_, k) => {
      const px = x - ((r.instancias - 1) * 9) / 2 + k * 9
      return `<circle class="grafo-instancia" cx="${px}" cy="${y + 12}" r="3"/>`
    }).join('')
    partes.push(
      `<g class="grafo-recurso"><rect x="${x - h}" y="${y - h}" width="${LADO_REC}" height="${LADO_REC}" rx="8"/>` +
        `<text x="${x}" y="${y - 6}">${esc(r.id)}</text>${puntos}</g>`,
    )
  }

  const flecha = (id: string) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="${id}" d="M0,0 L10,5 L0,10 z"/></marker>`
  const resumen = g.aristas
    .map((a) => `${a.desde} ${a.tipo === 'asignacion' ? 'asignado a' : 'solicita'} ${a.hasta}`)
    .join('; ')

  return (
    `<figure class="grafo-asignacion">` +
    `<svg viewBox="0 0 ${width} ${height}" width="${width * ESCALA}" height="${height * ESCALA}" role="img" aria-label="Grafo de asignación: ${esc(resumen)}">` +
    `<defs>${flecha('flecha-asignacion')}${flecha('flecha-solicitud')}${flecha('flecha-ciclo')}</defs>` +
    partes.join('') +
    `</svg>` +
    `<figcaption><span class="grafo-ley grafo-ley-asignacion">asignación</span>` +
    `<span class="grafo-ley grafo-ley-solicitud">solicitud</span>` +
    `<span class="grafo-ley grafo-ley-instancia">instancia</span></figcaption>` +
    `</figure>`
  )
}

export const renderGrafo = (fuente: string) => grafoAsignacionSVG(parsearGrafo(fuente))
