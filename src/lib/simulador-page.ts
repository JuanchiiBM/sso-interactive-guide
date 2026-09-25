/**
 * Conecta cada [data-simulador] de la página: lee su config JSON, genera los pasos,
 * crea el playback y pinta el visualizador + controles.
 */
import { $, $$ } from '@lib/dom'
import { createPlayback, SPEED_LABELS, type Step } from '@lib/playback'
import { pasosPlanificacion, type EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import { renderGantt } from '@lib/visualizers/gantt'
import type { ConfigPlanificacion } from '@lib/simuladores/planificacion/tipos'
import { crearDesafioGantt, type DesafioGantt } from '@lib/desafios/gantt'
import { variantesPlanificacion } from '@lib/simuladores/planificacion/verificar'
import { pasosCodigo } from '@lib/simuladores/codigo/pasos'
import type { ConfigCodigo } from '@lib/simuladores/codigo/tipos'
import type { Desafio, ItemExamen } from '@lib/desafios/tipos'
import { estaResuelto, rutaActual } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'
import { porcentajeGantt, puntajeGantt } from '@lib/parciales/puntaje-gantt'

type Registro = {
  pasos: (config: never) => Step<unknown>[]
  render: (root: HTMLElement, state: never) => void
  /** Sin desafío, la resolución se muestra directo. */
  desafio?: (root: HTMLElement, pasos: never, config: never) => DesafioGantt
}

/** Un simulador por `kind` del schema. Agregar acá cada tipo nuevo. */
const SIMULADORES: Record<string, Registro> = {
  planificacion: {
    pasos: (c: ConfigPlanificacion) => pasosPlanificacion(c),
    render: (root, s: EstadoGantt) => renderGantt(root, s),
    desafio: (root, pasos: Step<EstadoGantt>[], c: ConfigPlanificacion) =>
      crearDesafioGantt(root, pasos, variantesPlanificacion(c).slice(1)),
  },
  codigo: {
    pasos: (c: ConfigCodigo) => pasosCodigo(c),
    render: (root, s: EstadoGantt) => renderGantt(root, s),
    desafio: (root, pasos: Step<EstadoGantt>[]) => crearDesafioGantt(root, pasos),
  },
}

export function initAllSimuladores(): void {
  $$<HTMLElement>('[data-simulador][data-sim-modo="practica"]').forEach((host, i) =>
    initSimulador(host, i),
  )
}

/** Gantt dentro de un simulacro: sin Verificar; al finalizar da el puntaje y revela el paso a paso. */
export function crearSimuladorExamen(host: HTMLElement): ItemExamen | null {
  const base = preparar(host)
  const grid = $<HTMLElement>('[data-desafio-grid]', host)
  if (!base?.sim.desafio || !grid) return null
  const { sim, pasos, config, resolucion } = base
  const desafio = sim.desafio!(grid, pasos as never, config as never)
  $('[data-desafio]', host)?.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-desafio-accion]')?.dataset
      .desafioAccion
    if (accion === 'limpiar') desafio.limpiar()
  })
  conectarPlayback(host, base)
  return {
    puntaje: async () => puntajeGantt(desafio.respuesta(), desafio.esperadas),
    revelar() {
      desafio.bloquear()
      $<HTMLElement>('[data-desafio-accion="limpiar"]', host)?.setAttribute('hidden', '')
      const p = porcentajeGantt(desafio.respuesta(), desafio.esperadas)
      const feedback = $<HTMLElement>('[data-desafio-feedback]', host)
      if (feedback) feedback.textContent = `${Math.round(p * 100)} % de celdas correctas.`
      if (resolucion) resolucion.hidden = false
    },
  }
}

/** Bloquea la resolución detrás del desafío hasta que el alumno acierte o se rinda. */
function initDesafio(host: HTMLElement, clave: string, crear: (root: HTMLElement) => Desafio) {
  const bloque = $<HTMLElement>('[data-desafio]', host)
  const grid = $<HTMLElement>('[data-desafio-grid]', host)
  const resolucion = $<HTMLElement>('[data-sim-resolucion]', host)
  const feedback = $<HTMLElement>('[data-desafio-feedback]', host)
  const boton = $<HTMLButtonElement>('[data-desafio-accion="resolucion"]', host)
  if (!bloque || !grid || !resolucion || !boton) return

  const desafio = crear(grid)
  const decir = (texto: string, color = 'var(--muted)') => {
    if (!feedback) return
    feedback.textContent = texto
    feedback.style.color = color
  }
  if (estaResuelto(clave)) decir('Ya lo resolviste antes. Podés volver a intentarlo.')

  const control = controlarResolucion({
    boton,
    clave,
    mostrar: () => (resolucion.hidden = false),
    ocultar: () => {
      resolucion.hidden = true
      desafio.limpiar()
      decir('')
    },
  })

  bloque.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-desafio-accion]')?.dataset
      .desafioAccion
    if (accion === 'verificar') {
      const { ok, mensaje } = desafio.verificar()
      decir(mensaje, ok ? 'var(--ok)' : 'var(--bad)')
      if (ok) control.acerto()
    } else if (accion === 'limpiar') {
      desafio.limpiar()
    }
  })
}

interface Preparado {
  config: { kind: string }
  sim: Registro
  pasos: Step<unknown>[]
  viz: HTMLElement
  resolucion: HTMLElement | null
}

/** Lee la config y genera los pasos; null si no hay simulador o falla la simulación. */
function preparar(host: HTMLElement): Preparado | null {
  const raw = $('script[data-simulador-config]', host)?.textContent
  const viz = $<HTMLElement>('[data-sim-viz]', host)
  if (!raw || !viz) return null

  const config = JSON.parse(raw) as { kind: string }
  const sim = SIMULADORES[config.kind]
  if (!sim) return null

  try {
    const pasos = sim.pasos(config as never)
    return { config, sim, pasos, viz, resolucion: $<HTMLElement>('[data-sim-resolucion]', host) }
  } catch (err) {
    viz.textContent = `No se pudo simular: ${(err as Error).message}`
    return null
  }
}

function initSimulador(host: HTMLElement, indice: number): void {
  const base = preparar(host)
  if (!base) return
  const { sim, pasos, config, resolucion } = base
  if (sim.desafio) {
    const crear = sim.desafio
    initDesafio(host, `${rutaActual()}#${indice}`, (root) =>
      crear(root, pasos as never, config as never),
    )
  } else {
    $('[data-desafio]', host)?.remove()
    if (resolucion) resolucion.hidden = false
  }
  conectarPlayback(host, base)
}

/** El paso a paso de la resolución: visualizador, controles, slider y atajos de teclado. */
function conectarPlayback(host: HTMLElement, { sim, pasos, viz }: Preparado): void {
  const playback = createPlayback(pasos)
  const texto = $<HTMLElement>('[data-sim-texto]', host)
  const contador = $<HTMLElement>('[data-sim-contador]', host)
  const slider = $<HTMLInputElement>('[data-sim-slider]', host)
  const playBtn = $<HTMLButtonElement>('[data-sim-play]', host)
  const speedLabel = $<HTMLElement>('[data-sim-speed-label]', host)

  if (slider) slider.max = String(pasos.length - 1)

  playback.subscribe((snap) => {
    if (!snap.step) return
    sim.render(viz, snap.step.state as never)
    if (texto) texto.textContent = snap.step.descripcion
    if (contador) contador.textContent = `${snap.current + 1} / ${snap.steps.length}`
    if (slider) slider.value = String(snap.current)
    if (playBtn) {
      playBtn.dataset.playing = String(snap.isPlaying)
      playBtn.setAttribute('aria-label', snap.isPlaying ? 'Pausar' : 'Reproducir')
    }
    if (speedLabel) speedLabel.textContent = SPEED_LABELS[snap.speed]
  })

  const acciones: Record<string, () => void> = {
    inicio: () => playback.goTo(0),
    atras: playback.backward,
    play: playback.togglePlay,
    adelante: playback.forward,
    fin: () => playback.goTo(pasos.length - 1),
    velocidad: () => playback.setSpeed((playback.getSnapshot().speed % 5) + 1),
  }
  host.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-sim-accion]')
    if (btn) acciones[btn.dataset.simAccion!]?.()
  })
  slider?.addEventListener('input', () => playback.goTo(Number(slider.value)))

  // Atajos solo con el simulador enfocado, para no pelear con el scroll de la página
  host.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return
    const map: Record<string, () => void> = {
      ArrowRight: playback.forward,
      ArrowLeft: playback.backward,
      ' ': playback.togglePlay,
    }
    const fn = map[e.key]
    if (!fn) return
    e.preventDefault()
    fn()
  })
}
