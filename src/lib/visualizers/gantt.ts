/** Diagrama de Gantt en DOM plano. Se repinta completo en cada paso (grids chicos). */
import {
  columnaEtiquetas,
  etiquetaHilo,
  type EstadoGantt,
} from '@lib/simuladores/planificacion/pasos'
import type { EstadoProceso } from '@lib/simuladores/planificacion/tipos'

const colorProceso = (i: number) => `var(--p${(i % 8) + 1})`

const CELDA: Partial<Record<EstadoProceso, { clase: string; label: string }>> = {
  ejecutando: { clase: 'gantt-cpu', label: 'CPU' },
  listo: { clase: 'gantt-listo', label: 'Listo' },
  bloqueado: { clase: 'gantt-io', label: 'E/S' },
  'espera-io': { clase: 'gantt-espera-io', label: 'Esperando dispositivo' },
  'espera-admision': { clase: 'gantt-admision', label: 'En New (sin admitir)' },
  suspendido: { clase: 'gantt-suspendido', label: 'Suspendido (fuera de memoria)' },
  'espera-so': { clase: 'gantt-espera-so', label: 'Esperando que el SO atienda su interrupción' },
}
/** Solo aparecen en la leyenda si algún hilo pasó por ese estado. */
const OPCIONALES: EstadoProceso[] = ['espera-admision', 'suspendido', 'espera-so']
const COLOR_SO = 'var(--fg-soft)'

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

export function renderGantt(root: HTMLElement, state: EstadoGantt): void {
  const { resultado, procesos, hasta } = state
  const limite = hasta ?? resultado.ticks.length - 1
  const tickActual = hasta != null ? resultado.ticks[hasta] : null
  const multi = resultado.procesadores > 1
  const color = (id: string) => colorProceso(Math.max(0, procesos.indexOf(id)))

  const grid = el('div', 'gantt-grid')
  const etiqueta = (id: string) => etiquetaHilo(resultado, id)
  grid.style.gridTemplateColumns = `${columnaEtiquetas(resultado)} repeat(${resultado.ticks.length}, minmax(1.5rem, 1fr))`
  grid.setAttribute('role', 'table')
  grid.setAttribute('aria-label', 'Diagrama de Gantt')

  // con varios CPUs, una fila por procesador arriba de las de procesos
  for (let k = 0; multi && k < resultado.procesadores; k++) {
    grid.append(el('div', 'gantt-label', `CPU ${k + 1}`))
    for (const tick of resultado.ticks) {
      const id = tick.cpus[k]
      const celda = el('div', 'gantt-cell')
      if (tick.t <= limite && tick.so?.[k]) {
        celda.classList.add('gantt-cpu')
        celda.style.setProperty('--c', COLOR_SO)
        celda.textContent = 'SO'
        celda.title = `CPU ${k + 1} · t=${tick.t}: el SO atiende una interrupción`
      } else if (tick.t <= limite && id) {
        celda.classList.add('gantt-cpu')
        celda.style.setProperty('--c', color(id))
        celda.textContent = id
        celda.title = `CPU ${k + 1} · t=${tick.t}: ${etiqueta(id)}`
      }
      if (tick.t === hasta) celda.classList.add('gantt-actual')
      grid.append(celda)
    }
  }

  procesos.forEach((id, i) => {
    grid.append(el('div', 'gantt-label pr-2', etiqueta(id)))
    for (const tick of resultado.ticks) {
      const celda = el('div', 'gantt-cell')
      if (tick.t <= limite) {
        const estado = tick.estados[id]
        const meta = CELDA[estado]
        if (meta) {
          celda.classList.add(meta.clase)
          const k = tick.cpus.indexOf(id)
          if (multi && k >= 0) celda.textContent = String(k + 1)
          const sentencia = tick.sentencias?.[id] ? ` (${tick.sentencias[id]})` : ''
          celda.title = `${etiqueta(id)} · t=${tick.t}: ${etiquetaEstado(state, estado)}${multi && k >= 0 ? ` ${k + 1}` : ''}${sentencia}`
        }
        celda.style.setProperty('--c', colorProceso(i))
      }
      if (tick.t === hasta) celda.classList.add('gantt-actual')
      grid.append(celda)
    }
  })

  // fila del SO: CPU que usa para atender interrupciones
  if (resultado.so) {
    grid.append(el('div', 'gantt-label pr-2', 'SO'))
    for (const tick of resultado.ticks) {
      const celda = el('div', 'gantt-cell')
      const k = tick.so?.indexOf(true) ?? -1
      if (tick.t <= limite && k >= 0) {
        celda.classList.add('gantt-cpu')
        celda.style.setProperty('--c', COLOR_SO)
        if (multi) celda.textContent = String(k + 1)
        celda.title = `SO · t=${tick.t}: atiende una interrupción${multi ? ` en la CPU ${k + 1}` : ''}`
      }
      if (tick.t === hasta) celda.classList.add('gantt-actual')
      grid.append(celda)
    }
  }

  grid.append(el('div'))
  for (const tick of resultado.ticks) grid.append(el('div', 'gantt-tiempo', String(tick.t)))

  const panel = el('div', 'flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-soft')
  if (tickActual) {
    tickActual.cpus.forEach((id, k) =>
      panel.append(
        chip(multi ? `CPU ${k + 1}` : 'CPU', tickActual.so?.[k] ? 'SO (interrupción)' : id ? etiqueta(id) : '—'),
      ),
    )
    // con ULTs: quantum que le queda a cada KLT en CPU y la decisión de cada biblioteca
    tickActual.quantum?.forEach((q, k) => {
      const id = tickActual.cpus[k]
      if (q != null && id) panel.append(chip(`Quantum ${resultado.kltDe?.[id] ?? id}`, String(q)))
    })
    for (const b of tickActual.bibliotecas ?? []) {
      const cola = b.listos.length ? ` (cola: ${b.listos.join(' → ')})` : ''
      panel.append(chip(`Biblioteca ${b.klt}`, `${b.elegido ?? '—'}${cola}`))
    }
    if (tickActual.colas) {
      for (const c of tickActual.colas) panel.append(chip(c.nombre, c.procesos.join(' → ') || '∅'))
    } else {
      const nombre = tickActual.bibliotecas ? 'Listos (SO)' : 'Listos'
      panel.append(chip(nombre, tickActual.listos.join(' → ') || '∅'))
    }
    if (tickActual.dispositivos) {
      for (const d of tickActual.dispositivos) {
        const cola = d.cola.length ? ` (cola: ${d.cola.join(' → ')})` : ''
        panel.append(chip(d.nombre, `${d.usando ?? '—'}${cola}`))
      }
    } else if (tickActual.sincro) {
      const id = tickActual.cpu
      if (id && tickActual.sentencias?.[id])
        panel.append(chip('Ejecuta', tickActual.sentencias[id]))
      panel.append(chip('Bloqueados', tickActual.io.join(', ') || '—'))
      for (const s of tickActual.sincro) {
        const duenos = s.duenos?.length ? ` · de ${s.duenos.join(', ')}` : ''
        const cola = s.cola.length ? ` (cola: ${s.cola.join(' → ')})` : ''
        panel.append(chip(s.nombre, `${s.valor}${duenos}${cola}`))
      }
    } else {
      panel.append(chip('E/S', tickActual.io.join(', ') || '—'))
      if (tickActual.colaIO.length) panel.append(chip('Cola E/S', tickActual.colaIO.join(' → ')))
    }
    if (tickActual.nuevos) panel.append(chip('New', tickActual.nuevos.join(' → ') || '∅'))
    if (tickActual.suspendidos)
      panel.append(chip('Suspendidos', tickActual.suspendidos.join(', ') || '∅'))
  }

  const scroller = el('div', 'overflow-x-auto pb-2')
  scroller.append(grid)
  root.replaceChildren(scroller, panel, leyenda(state))
  if (hasta == null) root.append(tablaMetricas(state))
}

function chip(label: string, value: string): HTMLElement {
  const c = el('span')
  c.append(el('span', 'text-muted mr-1.5', label), el('span', 'font-mono text-fg', value))
  return c
}

/** En el Gantt de código "bloqueado" es en un semáforo, recurso o sleep, no E/S. */
function etiquetaEstado({ resultado }: EstadoGantt, estado: EstadoProceso): string {
  if (estado === 'bloqueado' && resultado.bloqueoSincro) return 'Bloqueado'
  return CELDA[estado]?.label ?? estado
}

function leyenda(state: EstadoGantt): HTMLElement {
  const { resultado } = state
  const box = el('div', 'flex flex-wrap gap-4 text-[11px] text-muted')
  const usados = new Set(resultado.ticks.flatMap((t) => Object.values(t.estados)))
  for (const [estado, meta] of Object.entries(CELDA)) {
    const opcional = OPCIONALES.includes(estado as EstadoProceso) || resultado.bloqueoSincro
    if (opcional && !usados.has(estado as EstadoProceso)) continue
    const item = el('span', 'inline-flex items-center gap-1.5')
    const muestra = el('span', `gantt-cell ${meta!.clase} inline-block size-3`)
    muestra.style.setProperty('--c', 'var(--muted)')
    item.append(muestra, etiquetaEstado(state, estado as EstadoProceso))
    box.append(item)
  }
  if (resultado.so) {
    const item = el('span', 'inline-flex items-center gap-1.5')
    const muestra = el('span', 'gantt-cell gantt-cpu inline-block size-3')
    muestra.style.setProperty('--c', COLOR_SO)
    item.append(muestra, 'SO (atiende interrupciones)')
    box.append(item)
  }
  return box
}

function tablaMetricas({ resultado }: EstadoGantt): HTMLElement {
  const tabla = el('table', 'metricas-tabla')
  const head = el('tr')
  for (const h of ['Proceso', 'Llegada', 'Fin', 'Retorno', 'Espera', 'Respuesta']) {
    head.append(el('th', '', h))
  }
  tabla.append(head)
  for (const m of resultado.metricas) {
    const row = el('tr')
    const id = etiquetaHilo(resultado, m.id)
    for (const v of [id, m.llegada, m.finalizacion, m.retorno, m.espera, m.respuesta]) {
      row.append(el('td', '', String(v)))
    }
    tabla.append(row)
  }
  return tabla
}
