/** Markdown de frontmatter (justificaciones) → HTML en build, con los mismos bloques SVG del sitio. */
import { Marked } from 'marked'
import { bloqueSVG } from '@lib/markdown/bloques-svg'

const md = new Marked({
  renderer: {
    code({ text, lang }) {
      return bloqueSVG(lang, text) ?? false
    },
  },
})

export const markdownAHtml = (fuente: string) => md.parse(fuente) as Promise<string>

/** Variante inline (sin `<p>`), para textos cortos como las opciones de un multiple choice. */
export const markdownInlineAHtml = (fuente: string) => md.parseInline(fuente) as Promise<string>
