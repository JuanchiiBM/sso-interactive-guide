import { $, $$ } from '@lib/dom'

/** Filtro del listado de simulacros: Todos o solo los que no se rindieron (sin `data-banda`). */
export function initFiltrosSimulacros(): void {
  const barra = $<HTMLElement>('[data-filtros]')
  if (!barra) return
  barra.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-filtro]')
    if (!btn) return
    for (const b of $$<HTMLButtonElement>('[data-filtro]', barra))
      b.setAttribute('aria-pressed', String(b === btn))
    const pendientes = btn.dataset.filtro === 'pendiente'
    let visibles = 0
    for (const card of $$<HTMLElement>('[data-simulacro-card]')) {
      const ok = !pendientes || !card.hasAttribute('data-banda')
      card.parentElement!.hidden = !ok
      if (ok) visibles++
    }
    $<HTMLElement>('[data-sin-resultados]')!.hidden = visibles > 0
  })
}
