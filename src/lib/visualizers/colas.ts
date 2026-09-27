/** Diagrama de colas del paso a paso (solo ejercicios de guía). Ver docs/brain/simuladores/Diagrama de Colas.md */
import { etiquetaHilo, type EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import type { Tick } from '@lib/simuladores/planificacion/tipos'
import { el, repintarAnimado, zona, type Ficha, type Zona } from './colas-dom'
import { renderColasHilos, zonasHilos } from './colas-hilos'

export interface ContextoColas {
  state: EstadoGantt
  tick: Tick
  /** Ficha de un hilo planificable (proceso, KLT simple o ULT) con su color del Gantt. */
  fichaHilo: (id: string) => Ficha
}

export function renderColas(root: HTMLElement, state: EstadoGantt): void {
  // con ULTs, el lienzo entero es el de colas-hilos.ts
  if (renderColasHilos(root, state)) return
  const { resultado, procesos, hasta } = state
  const tick = resultado.ticks[hasta ?? resultado.ticks.length - 1]
  if (!tick) return root.replaceChildren()
  const fichaHilo = (id: string): Ficha => ({
    clave: id,
    texto: id,
    color: Math.max(0, procesos.indexOf(id)),
    title: etiquetaHilo(resultado, id),
  })
  const ctx: ContextoColas = { state, tick, fichaHilo }

  const zonas = [...zonasBase(ctx), ...zonasHilos(ctx)]
  const fila = el('div', 'colas-diagrama')
  fila.setAttribute('aria-label', `Colas en t=${tick.t}`)
  fila.append(...zonas.map(zona))
  repintarAnimado(root, [fila])
}

/** Listos, CPU(s), E/S y cola de E/S: lo común a todo Gantt de planificación. */
function zonasBase({ state, tick, fichaHilo }: ContextoColas): Zona[] {
  const multi = state.resultado.procesadores > 1
  const cpus: Zona[] = tick.cpus.map((id, k) => ({
    titulo: multi ? `CPU ${k + 1}` : 'CPU',
    tipo: 'recurso',
    fichas: id ? [fichaHilo(id)] : [],
  }))
  return [
    { titulo: 'Listos', fichas: tick.listos.map(fichaHilo) },
    ...cpus,
    { titulo: 'E/S', tipo: 'recurso', fichas: tick.io.map(fichaHilo) },
    { titulo: 'Cola E/S', fichas: tick.colaIO.map(fichaHilo) },
  ]
}
