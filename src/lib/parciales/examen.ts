/** Controlador de un simulacro: Empezar, cronómetro y aviso al salir. Nada se persiste mientras se rinde. */
import { $, $$ } from '@lib/dom'
import type { ItemExamen } from '@lib/desafios/tipos'
import { crearMCExamen } from '@lib/desafios/multiple-choice'
import { crearSemaforosExamen } from '@lib/desafios/semaforos'
import { crearSimuladorExamen } from '@lib/simulador-page'
import { formatearTiempo } from './tiempo'

export interface ItemSimulacro {
  el: HTMLElement
  tipo: 'mc' | 'sem' | 'gantt'
  seccion: 'teoria' | 'practica'
  /** Índice del ejercicio de práctica al que pertenece (sus partes se reparten el peso). */
  ejercicio: number | null
  examen: ItemExamen
}

export function initSimulacro(): void {
  const raiz = $<HTMLElement>('[data-simulacro]')
  if (raiz) init(raiz)
}

function crearItem(el: HTMLElement): ItemSimulacro | null {
  const tipo = el.dataset.itemTipo as ItemSimulacro['tipo']
  const hijo = el.firstElementChild as HTMLElement
  const examen =
    tipo === 'mc'
      ? crearMCExamen(hijo)
      : tipo === 'sem'
        ? crearSemaforosExamen(hijo)
        : crearSimuladorExamen(hijo)
  if (!examen) return null
  const ejercicio = el.dataset.itemEjercicio
  return {
    el,
    tipo,
    seccion: el.dataset.itemSeccion as ItemSimulacro['seccion'],
    ejercicio: ejercicio == null ? null : Number(ejercicio),
    examen,
  }
}

function init(raiz: HTMLElement): void {
  const contenido = $<HTMLElement>('[data-simulacro-contenido]', raiz)!
  const reloj = $<HTMLElement>('[data-simulacro-reloj]', raiz)!
  const estado = $<HTMLElement>('[data-simulacro-estado]', raiz)!
  const boton = (accion: string) =>
    $<HTMLButtonElement>(`[data-simulacro-accion="${accion}"]`, raiz)!
  const empezar = boton('empezar')
  const cancelar = boton('cancelar')
  const confirmarCancelar = $<HTMLElement>('[data-simulacro-confirmar]', raiz)!

  let inicio = 0
  let tic = 0
  const avisarAlSalir = (e: BeforeUnloadEvent) => e.preventDefault()

  empezar.addEventListener('click', () => {
    empezar.hidden = true
    cancelar.hidden = false
    // se muestra antes de montar: CodeMirror y el Gantt miden el DOM
    contenido.hidden = false
    $$<HTMLElement>('[data-item]', contenido).map(crearItem)
    inicio = Date.now()
    tic = window.setInterval(() => (reloj.textContent = formatearTiempo(Date.now() - inicio)), 1000)
    estado.textContent = 'En curso. Si salís de la página, se pierde lo respondido.'
    window.addEventListener('beforeunload', avisarAlSalir)
  })

  raiz.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-simulacro-accion]')?.dataset
      .simulacroAccion
    if (accion === 'cancelar') {
      cancelar.hidden = true
      confirmarCancelar.hidden = false
    } else if (accion === 'seguir') {
      confirmarCancelar.hidden = true
      cancelar.hidden = false
    } else if (accion === 'cancelar-si') {
      window.clearInterval(tic)
      window.removeEventListener('beforeunload', avisarAlSalir)
      location.reload()
    }
  })
}
