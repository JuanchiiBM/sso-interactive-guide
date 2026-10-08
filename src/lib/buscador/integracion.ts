/** Integración de Astro: al terminar el build, Pagefind indexa el HTML de dist/ (ver brain: Buscador). */
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import * as pagefind from 'pagefind'

export function buscador(): AstroIntegration {
  return {
    name: 'buscador-pagefind',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const salida = fileURLToPath(dir)
        const { index, errors } = await pagefind.createIndex({
          forceLanguage: 'es',
          // los diagramas repiten como texto suelto lo que ya explica la prosa
          excludeSelectors: ['figure', 'svg', 'script'],
        })
        if (!index) throw new Error(`pagefind: ${errors.join(', ')}`)
        const { page_count } = await index.addDirectory({ path: salida })
        await index.writeFiles({ outputPath: `${salida}pagefind` })
        await pagefind.close()
        logger.info(`índice de búsqueda: ${page_count} páginas`)
      },
    },
  }
}
