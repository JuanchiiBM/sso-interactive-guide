/** Entrada del alumno para un Gantt: una celda por (proceso, t); a lo sumo una por columna. */
import type { Step } from '@lib/playback'
import type { EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import {
  lineaEsperada,
  verificarLineaCPU,
  type LineaCPU,
} from '@lib/simuladores/planificacion/verificar'
import type { Desafio } from '@lib/desafios/tipos'

export function crearDesafioGantt(root: HTMLElement, pasos: Step<EstadoGantt>[]): Desafio {
  const { resultado, procesos } = pasos[0].state
  const esperada = lineaEsperada(resultado)
  const total = esperada.length
  let respuesta: LineaCPU = Array(total).fill(null)
  const celdas = new Map<string, HTMLButtonElement>()

  const grid = document.createElement('div')
  grid.className = 'gantt-grid'
  grid.style.gridTemplateColumns = `3rem repeat(${total}, minmax(1.5rem, 1fr))`

  procesos.forEach((id, i) => {
    const label = document.createElement('div')
    label.className = 'gantt-label'
    label.textContent = id
    grid.append(label)
    for (let t = 0; t < total; t++) {
      const celda = document.createElement('button')
      celda.type = 'button'
      celda.className = 'gantt-cell gantt-input'
      celda.style.setProperty('--c', `var(--p${(i % 8) + 1})`)
      celda.setAttribute('aria-label', `${id} en CPU en t=${t}`)
      celda.setAttribute('aria-pressed', 'false')
      celda.addEventListener('click', () => marcar(t, respuesta[t] === id ? null : id))
      celdas.set(`${id}:${t}`, celda)
      grid.append(celda)
    }
  })
  grid.append(document.createElement('div'))
  for (let t = 0; t < total; t++) {
    const n = document.createElement('div')
    n.className = 'gantt-tiempo'
    n.textContent = String(t)
    grid.append(n)
  }
  root.replaceChildren(grid)

  function marcar(t: number, id: string | null) {
    respuesta = respuesta.with(t, id)
    for (const p of procesos) {
      const celda = celdas.get(`${p}:${t}`)!
      celda.setAttribute('aria-pressed', String(p === id))
      celda.classList.remove('gantt-error')
    }
  }

  return {
    verificar() {
      const v = verificarLineaCPU(esperada, respuesta)
      if (v.primerError != null) {
        for (const p of procesos) celdas.get(`${p}:${v.primerError}`)!.classList.add('gantt-error')
      }
      return {
        ok: v.ok,
        mensaje: v.ok
          ? `¡Correcto! Los ${v.total} instantes coinciden.`
          : `${v.correctos} de ${v.total} instantes correctos. El primer error está en t=${v.primerError}.`,
      }
    },
    limpiar() {
      for (let t = 0; t < total; t++) marcar(t, null)
    },
  }
}
