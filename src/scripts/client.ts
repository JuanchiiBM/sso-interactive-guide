/** Bootstrap global de cliente (JS plano, sin framework). Se carga una vez desde Layout.astro. */
import { toggleTheme } from '@lib/theme'
import { initSidebar } from '@lib/sidebar'
import { initAllSimuladores } from '@lib/simulador-page'
import { initMultipleChoice } from '@lib/desafios/multiple-choice'
import { initSemaforos } from '@lib/desafios/semaforos'
import { initProgreso } from '@lib/progreso'
import { initSimulacro } from '@lib/parciales/examen'
import { initRecorridos } from '@lib/recorridos'

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element) || !target.closest('[data-theme-toggle]')) return
  event.preventDefault()
  toggleTheme()
})

initSidebar()
initAllSimuladores()
initMultipleChoice()
initSemaforos()
initProgreso()
initSimulacro()
initRecorridos()
