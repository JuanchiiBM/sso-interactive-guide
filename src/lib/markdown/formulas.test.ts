/** Evita notación LaTeX cruda en el contenido: no hay renderer de math, se ve literal (issue #8). */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const DIR = join(process.cwd(), 'src/content')
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
// campos de frontmatter que son código C/pseudocódigo, no markdown
const CAMPOS_CODIGO = new Set(['codigo', 'solucion', 'acciones', 'tests'])

const LATEX: [string, RegExp][] = [
  ['subíndice/superíndice con llaves', /[_^]\{/],
  [
    'comando LaTeX',
    /\\(alpha|beta|lambda|mu|sigma|cdot|times|frac|sqrt|sum|leq?|geq?|to|rightarrow)\b/,
  ],
  ['math entre $', /\$[^$\s][^$\n]*[^$\s]\$/],
  ['subíndice con guion bajo (T_i, R_1)', /(?<![\w\\])[A-Za-z]_(?:[a-z]|\d+)(?![\w(])/],
]

/** Saca bloques de código y código inline: ahí `_{` o `x_i` son legítimos. */
const sinCodigo = (md: string) =>
  md.replace(/^( *)(```|~~~)[^\n]*\n[\s\S]*?^\1\2[^\S\n]*$/gm, '').replace(/(`+)[\s\S]*?\1/g, '')

function textos(valor: unknown, clave = ''): string[] {
  if (CAMPOS_CODIGO.has(clave)) return []
  if (typeof valor === 'string') return [valor]
  if (Array.isArray(valor)) return valor.flatMap((v) => textos(v))
  if (valor && typeof valor === 'object')
    return Object.entries(valor).flatMap(([k, v]) => textos(v, k))
  return []
}

const archivos = readdirSync(DIR, { recursive: true, encoding: 'utf8' })
  .filter((f: string) => f.endsWith('.md'))
  .map((f: string) => {
    const fuente = readFileSync(join(DIR, f), 'utf8')
    const fm = fuente.match(FRONTMATTER)
    const cuerpo = fm ? fuente.slice(fm[0].length) : fuente
    return {
      f: f.replace(/\\/g, '/'),
      partes: [cuerpo, ...(fm ? textos(parse(fm[1])) : [])].map(sinCodigo),
    }
  })

describe('notación de fórmulas en el contenido', () => {
  it('recorre temas y ejercicios', () => {
    expect(archivos.some(({ f }) => f.startsWith('temas/'))).toBe(true)
    expect(archivos.some(({ f }) => f.startsWith('ejercicios/'))).toBe(true)
  })

  it('el filtro no confunde código ni identificadores con LaTeX', () => {
    const ok = sinCodigo('```c\nx_{0} = t_i;\n```\n`T_i` y **agarrar_mate** y _nota_')
    expect(LATEX.filter(([, re]) => re.test(ok))).toEqual([])
    expect(LATEX.some(([, re]) => re.test('**T_i = T\\_{i-1} · α**'))).toBe(true)
  })

  it('no hay LaTeX crudo fuera de bloques de código (usar <sub>/<sup>)', () => {
    const hallazgos = archivos.flatMap(({ f, partes }) =>
      partes.flatMap((texto) =>
        LATEX.filter(([, re]) => re.test(texto)).map(
          ([nombre, re]) => `${f}: ${nombre} → ${texto.match(re)![0]}`,
        ),
      ),
    )
    expect(hallazgos).toEqual([])
  })
})
