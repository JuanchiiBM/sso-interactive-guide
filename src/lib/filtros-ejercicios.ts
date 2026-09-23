import { $, $$ } from '@lib/dom'

/** Filtros del listado de ejercicios: todo el HTML ya está renderizado, solo se oculta. */
export function initFiltrosEjercicios(): void {
  const barra = $<HTMLElement>('[data-filtros]')
  if (!barra) return

  const estado = { tema: '', simulador: '' }

  const aplicar = () => {
    let visibles = 0
    for (const grupo of $$<HTMLElement>('[data-grupo-tema]')) {
      let enGrupo = 0
      for (const card of $$<HTMLElement>('[data-ejercicio-card]', grupo)) {
        const ok =
          (!estado.tema || card.dataset.tema === estado.tema) &&
          (!estado.simulador || card.dataset.simulador === estado.simulador)
        card.parentElement!.hidden = !ok
        if (ok) enGrupo++
      }
      grupo.hidden = enGrupo === 0
      visibles += enGrupo
    }
    $('[data-sin-resultados]')?.classList.toggle('hidden', visibles > 0)
  }

  barra.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-filtro]')
    if (!btn) return
    const filtro = btn.dataset.filtro as keyof typeof estado
    if (filtro === 'tema') {
      estado.tema = btn.dataset.valor ?? ''
      for (const b of $$<HTMLButtonElement>('[data-filtro="tema"]', barra)) {
        b.setAttribute('aria-pressed', String(b === btn))
      }
    } else {
      const activo = btn.getAttribute('aria-pressed') !== 'true'
      estado.simulador = activo ? (btn.dataset.valor ?? '') : ''
      btn.setAttribute('aria-pressed', String(activo))
    }
    aplicar()
  })
}
