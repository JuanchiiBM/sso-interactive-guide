/** Diagrama de Gantt en DOM plano. Se repinta completo en cada paso (grids chicos). */
import type { EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import type { EstadoProceso } from '@lib/simuladores/planificacion/tipos'

const colorProceso = (i: number) => `var(--p${(i % 8) + 1})`

const CELDA: Partial<Record<EstadoProceso, { clase: string; label: string }>> = {
  ejecutando: { clase: 'gantt-cpu', label: 'CPU' },
  listo: { clase: 'gantt-listo', label: 'Listo' },
  bloqueado: { clase: 'gantt-io', label: 'E/S' },
  'espera-io': { clase: 'gantt-espera-io', label: 'Esperando dispositivo' },
}

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

  const grid = el('div', 'gantt-grid')
  grid.style.gridTemplateColumns = `3rem repeat(${resultado.ticks.length}, minmax(1.5rem, 1fr))`
  grid.setAttribute('role', 'table')
  grid.setAttribute('aria-label', 'Diagrama de Gantt')

  procesos.forEach((id, i) => {
    grid.append(el('div', 'gantt-label', id))
    for (const tick of resultado.ticks) {
      const celda = el('div', 'gantt-cell')
      if (tick.t <= limite) {
        const estado = tick.estados[id]
        const meta = CELDA[estado]
        if (meta) {
          celda.classList.add(meta.clase)
          celda.title = `${id} · t=${tick.t}: ${meta.label}`
        }
        celda.style.setProperty('--c', colorProceso(i))
      }
      if (tick.t === hasta) celda.classList.add('gantt-actual')
      grid.append(celda)
    }
  })

  grid.append(el('div'))
  for (const tick of resultado.ticks) grid.append(el('div', 'gantt-tiempo', String(tick.t)))

  const panel = el('div', 'flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-soft')
  if (tickActual) {
    panel.append(
      chip('CPU', tickActual.cpu ?? '—'),
      chip('Listos', tickActual.listos.join(' → ') || '∅'),
      chip('E/S', tickActual.io.join(', ') || '—'),
    )
    if (tickActual.colaIO.length) panel.append(chip('Cola E/S', tickActual.colaIO.join(' → ')))
  }

  const scroller = el('div', 'overflow-x-auto pb-2')
  scroller.append(grid)
  root.replaceChildren(scroller, panel, leyenda())
  if (hasta == null) root.append(tablaMetricas(state))
}

function chip(label: string, value: string): HTMLElement {
  const c = el('span')
  c.append(el('span', 'text-muted mr-1.5', label), el('span', 'font-mono text-fg', value))
  return c
}

function leyenda(): HTMLElement {
  const box = el('div', 'flex flex-wrap gap-4 text-[11px] text-muted')
  for (const meta of Object.values(CELDA)) {
    const item = el('span', 'inline-flex items-center gap-1.5')
    const muestra = el('span', `gantt-cell ${meta!.clase} inline-block size-3`)
    muestra.style.setProperty('--c', 'var(--muted)')
    item.append(muestra, meta!.label)
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
    for (const v of [m.id, m.llegada, m.finalizacion, m.retorno, m.espera, m.respuesta]) {
      row.append(el('td', '', String(v)))
    }
    tabla.append(row)
  }
  return tabla
}
