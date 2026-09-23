import { $ } from '@lib/dom'

export type Theme = 'light' | 'dark'

export const THEME_COLORS: Record<Theme, string> = { light: '#ffffff', dark: '#0a0a0a' }

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
  $<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])
  window.dispatchEvent(new CustomEvent<Theme>('themechange', { detail: theme }))
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'light' ? 'dark' : 'light'
  setTheme(next)
  return next
}
