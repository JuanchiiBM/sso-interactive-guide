// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import { satteri } from '@astrojs/markdown-satteri'
import { bloquesSVGPlugin } from './src/lib/markdown/bloques-svg.ts'

export default defineConfig({
  // TODO: reemplazar por el dominio final de Vercel
  site: 'https://sso-interactive-guide.vercel.app',
  devToolbar: { enabled: false },
  trailingSlash: 'ignore',
  markdown: {
    // ```grafo y ```diagrama se convierten en SVG en build (sin JS en el cliente)
    // @ts-expect-error el tipo del visitor de Sätteri es más estricto que el nuestro
    processor: satteri({ mdastPlugins: [bloquesSVGPlugin] }),
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
