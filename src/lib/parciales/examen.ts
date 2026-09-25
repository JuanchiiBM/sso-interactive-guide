/** Controlador de un simulacro: Empezar, cronómetro, Finalizar y corrección. Solo se persiste el resultado final. */
import { $, $$ } from '@lib/dom'
import type { ItemExamen } from '@lib/desafios/tipos'
import { crearMCExamen } from '@lib/desafios/multiple-choice'
import { crearSemaforosExamen } from '@lib/desafios/semaforos'
import { crearSimuladorExamen } from '@lib/simulador-page'
import { banda, formatearNota, notaDeItems, type PuntajeItem } from './nota'
import { guardarSiMejor, leerResultado } from './resultados'
import { formatearTiempo } from './tiempo'

export interface ItemSimulacro extends PuntajeItem {
  el: HTMLElement
  tipo: 'mc' | 'sem' | 'gantt'
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
    puntaje: 0,
    examen,
  }
}

const sinResponder = (items: ItemSimulacro[]) =>
  items.filter((i) => i.tipo === 'mc' && !$('input[type="radio"]:checked', i.el)).length

function init(raiz: HTMLElement): void {
  const id = raiz.dataset.simulacroId!
  const firma = raiz.dataset.simulacroFirma!
  const contenido = $<HTMLElement>('[data-simulacro-contenido]', raiz)!
  const reloj = $<HTMLElement>('[data-simulacro-reloj]', raiz)!
  const estado = $<HTMLElement>('[data-simulacro-estado]', raiz)!
  const empezar = $<HTMLButtonElement>('[data-simulacro-accion="empezar"]', raiz)!
  const acciones = $<HTMLElement>('[data-simulacro-acciones]', raiz)!
  const confirmar = (cual: string) => $<HTMLElement>(`[data-simulacro-confirmar="${cual}"]`, raiz)!
  const mejor = $<HTMLElement>('[data-simulacro-mejor]', raiz)!
  const resultado = $<HTMLElement>('[data-simulacro-resultado]', raiz)!

  const previo = leerResultado(id, firma)
  if (previo) {
    mejor.textContent = `Tu mejor resultado: ${formatearNota(previo.nota)} en ${formatearTiempo(previo.tiempoMs)}.`
    mejor.hidden = false
  }

  let items: ItemSimulacro[] = []
  let inicio = 0
  let tic = 0
  const avisarAlSalir = (e: BeforeUnloadEvent) => e.preventDefault()
  const mostrarAcciones = () => {
    confirmar('finalizar').hidden = true
    confirmar('cancelar').hidden = true
    acciones.hidden = false
  }

  empezar.addEventListener('click', () => {
    empezar.hidden = true
    acciones.hidden = false
    // se muestra antes de montar: CodeMirror y el Gantt miden el DOM
    contenido.hidden = false
    items = $$<HTMLElement>('[data-item]', contenido)
      .map(crearItem)
      .filter((i): i is ItemSimulacro => i != null)
    inicio = Date.now()
    tic = window.setInterval(() => (reloj.textContent = formatearTiempo(Date.now() - inicio)), 1000)
    estado.textContent = 'En curso. Si salís de la página, se pierde lo respondido.'
    window.addEventListener('beforeunload', avisarAlSalir)
  })

  async function finalizar() {
    const tiempoMs = Date.now() - inicio
    window.clearInterval(tic)
    window.removeEventListener('beforeunload', avisarAlSalir)
    reloj.textContent = formatearTiempo(tiempoMs)
    confirmar('finalizar').hidden = true
    // en secuencia: cada semáforo explora sus intercalaciones y conviene ver el avance
    for (const [n, item] of items.entries()) {
      estado.textContent = `Corrigiendo… ${n + 1}/${items.length}`
      item.puntaje = await item.examen.puntaje()
    }
    for (const item of items) item.examen.revelar()
    for (const link of $$<HTMLElement>('[data-simulacro-revelar]', contenido)) link.hidden = false

    const { nota } = notaDeItems(items)
    const guardado = guardarSiMejor(id, { nota, tiempoMs, fecha: new Date().toISOString(), firma })
    estado.textContent = 'Finalizado.'
    resultado.dataset.banda = banda(nota)
    $<HTMLElement>('[data-simulacro-nota]', resultado)!.textContent = formatearNota(nota)
    $<HTMLElement>('[data-simulacro-detalle]', resultado)!.textContent =
      `En ${formatearTiempo(tiempoMs)}. ` +
      (guardado
        ? previo
          ? '¡Mejoraste tu resultado anterior!'
          : 'Quedó guardado como tu resultado.'
        : `Tu mejor sigue siendo ${formatearNota(previo!.nota)} en ${formatearTiempo(previo!.tiempoMs)}.`) +
      ' Abajo están las resoluciones.'
    mejor.hidden = true
    resultado.hidden = false
    resultado.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  raiz.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-simulacro-accion]')?.dataset
      .simulacroAccion
    if (accion === 'finalizar') {
      const n = sinResponder(items)
      $<HTMLElement>('[data-simulacro-confirmar-texto]', raiz)!.textContent =
        (n === 1 ? 'Te queda una pregunta sin responder. ' : '') +
        (n > 1 ? `Te quedan ${n} preguntas sin responder. ` : '') +
        '¿Finalizar? Después no se pueden cambiar las respuestas.'
      acciones.hidden = true
      confirmar('finalizar').hidden = false
    } else if (accion === 'cancelar') {
      acciones.hidden = true
      confirmar('cancelar').hidden = false
    } else if (accion === 'seguir') {
      mostrarAcciones()
    } else if (accion === 'finalizar-si') {
      void finalizar()
    } else if (accion === 'cancelar-si' || accion === 'de-nuevo') {
      window.clearInterval(tic)
      window.removeEventListener('beforeunload', avisarAlSalir)
      window.scrollTo(0, 0)
      location.reload()
    }
  })
}
