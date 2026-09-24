/** Editor de código C (CodeMirror 6) con colores del tema y linter. Se importa lazy. */
import { basicSetup } from 'codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import { EditorState } from '@codemirror/state'
import { Decoration, EditorView, MatchDecorator, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

export interface ErrorLinea {
  linea: number
  mensaje: string
}

export interface EditorC {
  getValue: () => string
  setValue: (texto: string) => void
}

const resaltado = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.modifier], color: 'var(--code-kw)' },
  { tag: [t.typeName, t.standard(t.typeName)], color: 'var(--code-type)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: 'var(--code-fn)' },
  { tag: [t.string, t.character], color: 'var(--code-str)' },
  { tag: [t.number, t.bool], color: 'var(--code-num)' },
  { tag: [t.lineComment, t.blockComment], color: 'var(--code-com)', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--fg-soft)' },
])

// semaphore, wait, signal y TRUE no son C estándar: se resaltan aparte
const palabrasSO = new MatchDecorator({
  regexp: /\b(semaphore|wait|signal|TRUE)\b/g,
  decoration: (m) => Decoration.mark({ class: m[1] === 'TRUE' ? 'cm-so-const' : 'cm-so-kw' }),
})

const pluginSO = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = palabrasSO.createDeco(view)
    }
    update(u: ViewUpdate) {
      this.decorations = palabrasSO.updateDeco(u, this.decorations)
    }
  },
  { decorations: (v) => v.decorations },
)

const tema = EditorView.theme({
  '&': { backgroundColor: 'var(--surface)', color: 'var(--fg)', fontSize: '0.82rem' },
  '.cm-content': { fontFamily: 'var(--font-mono)', caretColor: 'var(--accent)', padding: '0.6rem 0' },
  '.cm-gutters': { backgroundColor: 'var(--surface-2)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'var(--hover)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--hover)', color: 'var(--fg)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--accent-soft) !important',
  },
  '.cm-cursor': { borderLeftColor: 'var(--accent)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent-soft)', outline: '1px solid var(--accent)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--surface-2)',
    border: '1px solid var(--line-strong)',
    color: 'var(--fg)',
  },
  '.cm-diagnostic-error': { borderLeftColor: 'var(--bad)' },
})

export function crearEditorC(
  host: HTMLElement,
  opts: { valor: string; alCambiar: (texto: string) => void; lint: (texto: string) => ErrorLinea[] },
): EditorC {
  const lintExt = linter(
    (view) => {
      const doc = view.state.doc
      const diagnosticos: Diagnostic[] = []
      for (const e of opts.lint(doc.toString())) {
        if (e.linea < 1 || e.linea > doc.lines) continue
        const l = doc.line(e.linea)
        const desde = l.from + (l.text.length - l.text.trimStart().length)
        diagnosticos.push({ from: desde, to: Math.max(l.to, desde), severity: 'error', message: e.mensaje })
      }
      return diagnosticos
    },
    { delay: 400 },
  )

  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: opts.valor,
      extensions: [
        basicSetup,
        cpp(),
        syntaxHighlighting(resaltado),
        pluginSO,
        tema,
        lintGutter(),
        lintExt,
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) opts.alCambiar(u.state.doc.toString())
        }),
      ],
    }),
  })

  return {
    getValue: () => view.state.doc.toString(),
    setValue: (texto) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: texto } }),
  }
}
