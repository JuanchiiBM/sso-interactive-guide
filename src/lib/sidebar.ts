import { $ } from '@lib/dom'

const CLAVE = 'so:sidebar-oculto'
const ESCRITORIO = '(min-width: 48rem)' // md de Tailwind

/** Mobile: drawer que se desliza. Escritorio: el mismo botón la esconde y se recuerda. */
export function initSidebar(): void {
  const sidebar = $<HTMLElement>('[data-sidebar]')
  const backdrop = $<HTMLElement>('[data-sidebar-backdrop]')
  const boton = $<HTMLElement>('[data-sidebar-open]')
  if (!sidebar || !backdrop) return
  const html = document.documentElement
  const escritorio = matchMedia(ESCRITORIO)
  const sincronizar = () =>
    boton?.setAttribute(
      'aria-expanded',
      String(escritorio.matches && !html.hasAttribute('data-sidebar-oculto')),
    )

  const setOpen = (open: boolean) => {
    sidebar.classList.toggle('-translate-x-full', !open)
    backdrop.classList.toggle('hidden', !open)
    boton?.setAttribute('aria-expanded', String(open))
  }

  sincronizar()
  escritorio.addEventListener('change', sincronizar)
  boton?.addEventListener('click', () => {
    if (!escritorio.matches) return setOpen(true)
    const oculto = html.toggleAttribute('data-sidebar-oculto')
    try {
      localStorage.setItem(CLAVE, oculto ? '1' : '0')
    } catch {}
    sincronizar()
  })
  $('[data-sidebar-close]')?.addEventListener('click', () => setOpen(false))
  backdrop.addEventListener('click', () => setOpen(false))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false)
  })
}
