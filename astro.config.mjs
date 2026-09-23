// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // TODO: reemplazar por el dominio final de Vercel
  site: 'https://sso-interactive-guide.vercel.app',
  devToolbar: { enabled: false },
  trailingSlash: 'ignore',
  markdown: {
    // mermaid se renderiza en el cliente (src/lib/mermaid.ts), shiki no lo toca
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  vite: {
    plugins: [tailwindcss()],
    // mermaid se carga lazy y solo en páginas con diagramas; su chunk grande es esperado
    build: { chunkSizeWarningLimit: 1600 },
  },
})
