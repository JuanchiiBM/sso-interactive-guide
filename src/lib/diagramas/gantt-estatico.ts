/** Bloque ```gantt: dibuja un Gantt (solo CPU y E/S, como en el examen) desde una config del simulador o filas dadas. */
import { parse } from 'yaml'
import { etiquetaHilo } from '../simuladores/planificacion/pasos'
import { simularPlanificacion } from '../simuladores/planificacion/simular'
import type { ConfigPlanificacion } from '../simuladores/planificacion/tipos'
import { esc } from './svg'

const CELDA = 22
const FILA = 26
const ESCALA = 1.2

/** 'cpu' | 'io' | null, o el número de CPU (1, 2) con varios procesadores. */
type Celda = 'cpu' | 'io' | number | null
interface Fila {
  etiqueta: string
  celdas: Celda[]
}

/** `filas: { K1: "CCEEE...CC" }` → C = CPU, E = E/S, 1/2 = CPU n, cualquier otro = nada. */
function filasDadas(filas: Record<string, string>): Fila[] {
  return Object.entries(filas).map(([etiqueta, s]) => ({
    etiqueta,
    celdas: [...s].map((c) => (c === 'C' ? 'cpu' : c === 'E' ? 'io' : /[1-9]/.test(c) ? Number(c) : null)),
  }))
}

function filasSimuladas(config: ConfigPlanificacion): Fila[] {
  const r = simularPlanificacion(config)
  const multi = r.procesadores > 1
  return r.hilos.map((id) => ({
    etiqueta: etiquetaHilo(r, id),
    celdas: r.ticks.map((tick): Celda => {
      const k = tick.cpus.indexOf(id)
      if (k >= 0) return multi ? k + 1 : 'cpu'
      return tick.estados[id] === 'bloqueado' ? 'io' : null
    }),
  }))
}

export function renderGanttEstatico(fuente: string): string {
  const config = parse(fuente) as ConfigPlanificacion & { titulo?: string; filas?: Record<string, string> }
  const filas = config.filas ? filasDadas(config.filas) : filasSimuladas(config)
  const largo = Math.max(...filas.map((f) => f.celdas.length))
  const anchoEtiqueta = Math.max(...filas.map((f) => f.etiqueta.length)) * 8 + 16
  const ancho = anchoEtiqueta + largo * CELDA + 4
  const alto = filas.length * FILA + 24

  const cuerpo: string[] = []
  filas.forEach((f, i) => {
    const y = i * FILA
    cuerpo.push(
      `<text class="ge-etiqueta" x="${anchoEtiqueta - 10}" y="${y + CELDA / 2}">${esc(f.etiqueta)}</text>`,
    )
    for (let t = 0; t < largo; t++) {
      const x = anchoEtiqueta + t * CELDA
      const c = f.celdas[t] ?? null
      const clase = c === 'io' ? 'ge-io' : c == null ? 'ge-vacia' : 'ge-cpu'
      cuerpo.push(
        `<rect class="${clase} ge-p${(i % 8) + 1}" x="${x + 1}" y="${y + 1}" width="${CELDA - 2}" height="${CELDA - 2}" rx="3"/>`,
      )
      if (typeof c === 'number') {
        cuerpo.push(`<text class="ge-cpu-n" x="${x + CELDA / 2}" y="${y + CELDA / 2}">${c}</text>`)
      }
    }
  })
  for (let t = 0; t <= largo; t++) {
    cuerpo.push(
      `<text class="ge-eje" x="${anchoEtiqueta + t * CELDA}" y="${filas.length * FILA + 8}">${t}</text>`,
    )
  }

  const titulo = config.titulo ?? 'Diagrama de Gantt'
  return (
    `<figure class="diagrama gantt-estatico">` +
    `<svg viewBox="0 0 ${ancho} ${alto}" width="${ancho * ESCALA}" height="${alto * ESCALA}" role="img" aria-label="${esc(titulo)}">` +
    cuerpo.join('') +
    `</svg>` +
    `<figcaption><span class="ge-ref ge-cpu"></span> CPU <span class="ge-ref ge-io"></span> E/S</figcaption>` +
    `</figure>`
  )
}
