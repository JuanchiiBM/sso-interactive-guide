/** Entrada del alumno para un Gantt: click = CPU (una por instante y CPU), click derecho = E/S. Fila "SO": solo CPU. */
import type { Step } from '@lib/playback'
import {
  columnaEtiquetas,
  etiquetaHilo,
  type EstadoGantt,
} from '@lib/simuladores/planificacion/pasos'
import {
  grillaEsperada,
  verificarGantt,
  type GrillaGantt,
  type Marca,
} from '@lib/simuladores/planificacion/verificar'
import type { Desafio } from '@lib/desafios/tipos'
import { FILA_SO } from '@lib/simuladores/planificacion/tipos'

type Pincel = Exclude<Marca, null>

export function crearDesafioGantt(root: HTMLElement, pasos: Step<EstadoGantt>[]): Desafio {
  const { resultado } = pasos[0].state
  const esperada = grillaEsperada(resultado, pasos[0].state.procesos)
  const procesos = Object.keys(esperada)
  const etiqueta = (id: string) => (id === FILA_SO ? 'SO' : etiquetaHilo(resultado, id))
  const total = resultado.ticks.length
  const multi = resultado.procesadores > 1
  // en el Gantt de código el click derecho marca bloqueado (semáforo, recurso o sleep)
  const io = resultado.bloqueoSincro ? 'Bloqueado' : 'E/S'
  const nombre: Record<Pincel, string> = multi
    ? { cpu: 'CPU 1', cpu2: 'CPU 2', io }
    : { cpu: 'CPU', cpu2: 'CPU 2', io }
  const tipos: Pincel[] = multi ? ['cpu', 'cpu2', 'io'] : ['cpu', 'io']
  const respuesta: GrillaGantt = Object.fromEntries(
    procesos.map((p) => [p, Array(total).fill(null)]),
  )
  const celdas = new Map<string, HTMLButtonElement>()
  let pincel: Pincel = 'cpu'

  const pinceles = document.createElement('div')
  pinceles.className = 'flex items-center gap-1 mb-2 text-xs'
  pinceles.setAttribute('role', 'group')
  pinceles.setAttribute('aria-label', 'Qué marca el click')
  for (const tipo of tipos) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'desafio-pincel'
    b.dataset.pincel = tipo
    b.textContent = `Click: ${nombre[tipo]}`
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
  ayuda.textContent = `Click derecho siempre marca ${io}.${resultado.so ? ' En la fila SO marcá la CPU que usa el SO para atender cada interrupción.' : ''}`
  pinceles.append(ayuda)

  const grid = document.createElement('div')
  grid.className = 'gantt-grid'
  grid.style.gridTemplateColumns = `${columnaEtiquetas(resultado)} repeat(${total}, minmax(1.5rem, 1fr))`

  procesos.forEach((id, i) => {
    const label = document.createElement('div')
    label.className = 'gantt-label pr-2'
    label.textContent = etiqueta(id)
    grid.append(label)
    for (let t = 0; t < total; t++) {
      const celda = document.createElement('button')
      celda.type = 'button'
      celda.className = 'gantt-cell gantt-input'
      celda.style.setProperty('--c', id === FILA_SO ? 'var(--fg-soft)' : `var(--p${(i % 8) + 1})`)
      celda.setAttribute('aria-label', `${etiqueta(id)}, t=${t}`)
      // el SO no hace E/S: en su fila solo cuentan los pinceles de CPU
      celda.addEventListener('click', () => {
        if (id !== FILA_SO || pincel !== 'io') alternar(id, t, pincel)
      })
      celda.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        if (id !== FILA_SO) alternar(id, t, 'io')
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

  function alternar(id: string, t: number, tipo: Pincel) {
    const nueva: Marca = respuesta[id][t] === tipo ? null : tipo
    // cada CPU atiende a uno solo: marcarla en un proceso la saca de los demás en ese instante
    if (nueva && nueva !== 'io') {
      for (const p of procesos) if (p !== id && respuesta[p][t] === nueva) set(p, t, null)
    }
    set(id, t, nueva)
  }

  function set(id: string, t: number, marca: Marca) {
    respuesta[id][t] = marca
    const celda = celdas.get(`${id}:${t}`)!
    celda.dataset.marca = marca ?? ''
    celda.textContent = multi && marca === 'cpu' ? '1' : multi && marca === 'cpu2' ? '2' : ''
    celda.setAttribute(
      'aria-label',
      `${etiqueta(id)}, t=${t}${marca ? `: ${nombre[marca]}` : ''}`,
    )
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
