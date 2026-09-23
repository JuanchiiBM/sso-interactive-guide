import { $ } from '@lib/dom'

/** Drawer mobile: el sidebar ya está en el DOM, solo se desliza. */
export function initSidebar(): void {
  const sidebar = $<HTMLElement>('[data-sidebar]')
  const backdrop = $<HTMLElement>('[data-sidebar-backdrop]')
  if (!sidebar || !backdrop) return

  const setOpen = (open: boolean) => {
    sidebar.classList.toggle('-translate-x-full', !open)
    backdrop.classList.toggle('hidden', !open)
  }

  $('[data-sidebar-open]')?.addEventListener('click', () => setOpen(true))
  $('[data-sidebar-close]')?.addEventListener('click', () => setOpen(false))
  backdrop.addEventListener('click', () => setOpen(false))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false)
  })
}
