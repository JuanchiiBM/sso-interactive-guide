import { $, $$ } from '@lib/dom'

/** Filtros del listado de simulacros: por parcial (1ro, 2do) y solo los no rendidos (sin `data-banda`). */
export function initFiltrosSimulacros(): void {
  const barra = $<HTMLElement>('[data-filtros]')
  if (!barra) return
  const estado = { parcial: '', pendiente: false }

  const aplicar = () => {
    let visibles = 0
    for (const grupo of $$<HTMLElement>('[data-grupo-parcial]')) {
      let enGrupo = 0
      for (const card of $$<HTMLElement>('[data-simulacro-card]', grupo)) {
        const ok =
          (!estado.parcial || grupo.dataset.grupoParcial === estado.parcial) &&
          (!estado.pendiente || !card.hasAttribute('data-banda'))
        card.parentElement!.hidden = !ok
        if (ok) enGrupo++
      }
      grupo.hidden = enGrupo === 0
      visibles += enGrupo
    }
    const vacio = $<HTMLElement>('[data-sin-resultados]')!
    const hayDelParcial = !estado.parcial || !!$(`[data-grupo-parcial="${estado.parcial}"]`)
    vacio.textContent = !hayDelParcial
      ? `Todavía no hay simulacros del ${estado.parcial === '2' ? '2do' : '1er'} parcial.`
      : 'Ya rendiste todos los simulacros de este filtro.'
    vacio.hidden = visibles > 0
  }

  barra.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-filtro]')
    if (!btn) return
    if (btn.dataset.filtro === 'parcial') {
      estado.parcial = btn.dataset.valor ?? ''
      for (const b of $$<HTMLButtonElement>('[data-filtro="parcial"]', barra))
        b.setAttribute('aria-pressed', String(b === btn))
    } else {
      estado.pendiente = btn.getAttribute('aria-pressed') !== 'true'
      btn.setAttribute('aria-pressed', String(estado.pendiente))
    }
    aplicar()
  })
}
