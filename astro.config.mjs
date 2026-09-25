// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import { satteri } from '@astrojs/markdown-satteri'
import { bloquesSVGPlugin } from './src/lib/markdown/bloques-svg.ts'
import { celdasACalcularPlugin } from './src/lib/markdown/celdas-a-calcular.ts'

export default defineConfig({
  // TODO: reemplazar por el dominio final de Vercel
  site: 'https://sso-interactive-guide.vercel.app',
  devToolbar: { enabled: false },
  trailingSlash: 'ignore',
  markdown: {
    // ```grafo y ```diagrama → SVG en build; celdas "(a calcular)" de tablas → input
    // @ts-expect-error el tipo del visitor de Sätteri es más estricto que el nuestro
    processor: satteri({ mdastPlugins: [bloquesSVGPlugin, celdasACalcularPlugin] }),
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  vite: {
    plugins: [tailwindcss()],
    // CodeMirror (~165 KB gzip) se carga lazy solo en páginas con editor de semáforos
    build: { chunkSizeWarningLimit: 600 },
  },
})
