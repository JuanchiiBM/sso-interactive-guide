/** Entrada del alumno para un Gantt: click = CPU (una por instante), click derecho = E/S. */
import type { Step } from '@lib/playback'
import type { EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import {
  grillaEsperada,
  verificarGantt,
  type GrillaGantt,
  type Marca,
} from '@lib/simuladores/planificacion/verificar'
import type { Desafio } from '@lib/desafios/tipos'

const NOMBRE: Record<'cpu' | 'io', string> = { cpu: 'CPU', io: 'E/S' }

export function crearDesafioGantt(root: HTMLElement, pasos: Step<EstadoGantt>[]): Desafio {
  const { resultado, procesos } = pasos[0].state
  const esperada = grillaEsperada(resultado, procesos)
  const total = resultado.ticks.length
  const respuesta: GrillaGantt = Object.fromEntries(
    procesos.map((p) => [p, Array(total).fill(null)]),
  )
  const celdas = new Map<string, HTMLButtonElement>()
  let pincel: 'cpu' | 'io' = 'cpu'

  const pinceles = document.createElement('div')
  pinceles.className = 'flex items-center gap-1 mb-2 text-xs'
  pinceles.setAttribute('role', 'group')
  pinceles.setAttribute('aria-label', 'Qué marca el click')
  for (const tipo of ['cpu', 'io'] as const) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'desafio-pincel'
    b.dataset.pincel = tipo
    b.textContent = tipo === 'cpu' ? 'Click: CPU' : 'Click: E/S'
    b.setAttribute('aria-pressed', String(tipo === pincel))
    b.addEventListener('click', () => {
      pincel = tipo
      for (const x of pinceles.children) {
        x.setAttribute('aria-pressed', String((x as HTMLElement).dataset.pincel === tipo))
      }
    })
    pinceles.append(b)
  }
  const ayuda = document.createElement('span')
  ayuda.className = 'ml-2 text-muted'
  ayuda.textContent = 'Click derecho siempre marca E/S.'
  pinceles.append(ayuda)

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
      celda.setAttribute('aria-label', `${id}, t=${t}`)
      celda.addEventListener('click', () => alternar(id, t, pincel))
      celda.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        alternar(id, t, 'io')
      })
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
  root.replaceChildren(pinceles, grid)

  function alternar(id: string, t: number, tipo: 'cpu' | 'io') {
    const nueva: Marca = respuesta[id][t] === tipo ? null : tipo
    // la CPU es una sola: marcar CPU en un proceso la saca de los demás en ese instante
    if (nueva === 'cpu') {
      for (const p of procesos) if (p !== id && respuesta[p][t] === 'cpu') set(p, t, null)
    }
    set(id, t, nueva)
  }

  function set(id: string, t: number, marca: Marca) {
    respuesta[id][t] = marca
    const celda = celdas.get(`${id}:${t}`)!
    celda.dataset.marca = marca ?? ''
    celda.setAttribute('aria-label', `${id}, t=${t}${marca ? `: ${NOMBRE[marca]}` : ''}`)
  }

  return {
    verificar() {
      // decisión de UX: no se indica dónde está el error, solo si el Gantt es correcto
      const { ok } = verificarGantt(esperada, respuesta)
      return ok
        ? { ok, mensaje: '¡Correcto! El Gantt coincide.' }
        : { ok, mensaje: 'Hay errores en el Gantt. Revisalo y volvé a verificar.' }
    },
    limpiar() {
      for (const p of procesos) for (let t = 0; t < total; t++) set(p, t, null)
    },
  }
}
