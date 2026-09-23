/** Bootstrap global de cliente (JS plano, sin framework). Se carga una vez desde Layout.astro. */
import { toggleTheme } from '@lib/theme'
import { initSidebar } from '@lib/sidebar'
import { initMermaid } from '@lib/mermaid'
import { initAllSimuladores } from '@lib/simulador-page'

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element) || !target.closest('[data-theme-toggle]')) return
  event.preventDefault()
  toggleTheme()
})

initSidebar()
initMermaid()
initAllSimuladores()
