/** Render lazy de bloques mermaid: solo descarga la librería si la página tiene diagramas. */
import { $$ } from '@lib/dom'
import { getTheme } from '@lib/theme'

// Con excludeLangs, Astro deja el bloque como <pre><code class="language-mermaid">
const SELECTOR = 'pre > code.language-mermaid'

export function initMermaid(): void {
  const blocks = $$<HTMLElement>(SELECTOR).map((code) => {
    const host = document.createElement('div')
    host.className = 'mermaid-diagrama'
    host.dataset.mermaidSrc = code.textContent ?? ''
    code.parentElement!.replaceWith(host)
    return host
  })
  if (blocks.length === 0) return

  const render = async () => {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, theme: getTheme() === 'light' ? 'default' : 'dark' })
    for (const block of blocks) {
      block.removeAttribute('data-processed')
      block.textContent = block.dataset.mermaidSrc ?? ''
    }
    await mermaid.run({ nodes: blocks })
  }

  void render()
  window.addEventListener('themechange', () => void render())
}
