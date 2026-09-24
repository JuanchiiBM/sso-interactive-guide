/**
 * Conecta cada [data-simulador] de la página: lee su config JSON, genera los pasos,
 * crea el playback y pinta el visualizador + controles.
 */
import { $, $$ } from '@lib/dom'
import { createPlayback, SPEED_LABELS, type Step } from '@lib/playback'
import { pasosPlanificacion, type EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import { renderGantt } from '@lib/visualizers/gantt'
import type { ConfigPlanificacion } from '@lib/simuladores/planificacion/tipos'
import { crearDesafioGantt } from '@lib/desafios/gantt'
import { pasosCodigo } from '@lib/simuladores/codigo/pasos'
import type { ConfigCodigo } from '@lib/simuladores/codigo/tipos'
import type { Desafio } from '@lib/desafios/tipos'
import { estaResuelto } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'

type Registro = {
  pasos: (config: never) => Step<unknown>[]
  render: (root: HTMLElement, state: never) => void
  /** Sin desafío, la resolución se muestra directo. */
  desafio?: (root: HTMLElement, pasos: never) => Desafio
}

/** Un simulador por `kind` del schema. Agregar acá cada tipo nuevo. */
const SIMULADORES: Record<string, Registro> = {
  planificacion: {
    pasos: (c: ConfigPlanificacion) => pasosPlanificacion(c),
    render: (root, s: EstadoGantt) => renderGantt(root, s),
    desafio: (root, pasos: Step<EstadoGantt>[]) => crearDesafioGantt(root, pasos),
  },
  codigo: {
    pasos: (c: ConfigCodigo) => pasosCodigo(c),
    render: (root, s: EstadoGantt) => renderGantt(root, s),
    desafio: (root, pasos: Step<EstadoGantt>[]) => crearDesafioGantt(root, pasos),
  },
}

export function initAllSimuladores(): void {
  $$<HTMLElement>('[data-simulador]').forEach((host, i) => initSimulador(host, i))
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

function initSimulador(host: HTMLElement, indice: number): void {
  const raw = $('script[data-simulador-config]', host)?.textContent
  const viz = $<HTMLElement>('[data-sim-viz]', host)
  if (!raw || !viz) return

  const config = JSON.parse(raw) as { kind: string }
  const sim = SIMULADORES[config.kind]
  if (!sim) return

  let pasos: Step<unknown>[]
  try {
    pasos = sim.pasos(config as never)
  } catch (err) {
    viz.textContent = `No se pudo simular: ${(err as Error).message}`
    return
  }

  const resolucion = $<HTMLElement>('[data-sim-resolucion]', host)
  if (sim.desafio) {
    const crear = sim.desafio
    initDesafio(host, `${location.pathname}#${indice}`, (root) => crear(root, pasos as never))
  } else {
    $('[data-desafio]', host)?.remove()
    if (resolucion) resolucion.hidden = false
  }

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
