/** Bloque ```gantt: corre el simulador en build y dibuja el Gantt resuelto (solo CPU y E/S, como en el examen). */
import { parse } from 'yaml'
import { etiquetaHilo } from '../simuladores/planificacion/pasos'
import { simularPlanificacion } from '../simuladores/planificacion/simular'
import type { ConfigPlanificacion } from '../simuladores/planificacion/tipos'
import { esc } from './svg'

const CELDA = 22
const FILA = 26
const ESCALA = 1.2

export function renderGanttEstatico(fuente: string): string {
  const config = parse(fuente) as ConfigPlanificacion & { titulo?: string }
  const r = simularPlanificacion(config)
  const filas = r.hilos.map((id) => ({ id, etiqueta: etiquetaHilo(r, id) }))
  const anchoEtiqueta = Math.max(...filas.map((f) => f.etiqueta.length)) * 8 + 16
  const ancho = anchoEtiqueta + r.ticks.length * CELDA + 4
  const alto = filas.length * FILA + 24
  const multi = r.procesadores > 1

  const cuerpo: string[] = []
  filas.forEach((f, i) => {
    const y = i * FILA
    cuerpo.push(
      `<text class="ge-etiqueta" x="${anchoEtiqueta - 10}" y="${y + CELDA / 2}">${esc(f.etiqueta)}</text>`,
    )
    for (const tick of r.ticks) {
      const x = anchoEtiqueta + tick.t * CELDA
      const estado = tick.estados[f.id]
      const clase =
        estado === 'ejecutando' ? 'ge-cpu' : estado === 'bloqueado' ? 'ge-io' : 'ge-vacia'
      cuerpo.push(
        `<rect class="${clase} ge-p${(i % 8) + 1}" x="${x + 1}" y="${y + 1}" width="${CELDA - 2}" height="${CELDA - 2}" rx="3"/>`,
      )
      const k = tick.cpus.indexOf(f.id)
      if (multi && k >= 0) {
        cuerpo.push(
          `<text class="ge-cpu-n" x="${x + CELDA / 2}" y="${y + CELDA / 2}">${k + 1}</text>`,
        )
      }
    }
  })
  for (let t = 0; t <= r.ticks.length; t++) {
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
