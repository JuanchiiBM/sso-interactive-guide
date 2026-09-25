/** Celdas de tabla "(a calcular)" en enunciados → campo para que el alumno anote el valor. */

/** Número con decimales opcionales, con coma o punto (atributo `pattern` del input). */
export const PATRON_DECIMAL = '-?[0-9]+([.,][0-9]+)?'

/** true si el texto de la celda es exactamente "(a calcular)" (ignora mayúsculas y espacios). */
export function esCeldaACalcular(texto: string): boolean {
  return /^\(\s*a\s+calcular\s*\)$/i.test(texto.trim())
}

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** HTML del campo; `etiqueta` es el nombre accesible (p. ej. "Est. CPU de A"). */
export function campoACalcular(etiqueta: string): string {
  return (
    `<input type="text" class="campo-a-calcular" inputmode="decimal" autocomplete="off" ` +
    `spellcheck="false" pattern="${PATRON_DECIMAL}" placeholder="?" ` +
    `aria-label="${escapar(etiqueta)}" title="A calcular">`
  )
}

/** Etiqueta "columna de fila"; si el encabezado se repite (p. ej. dos "Est. CPU"), lo numera. */
export function etiquetaCampo(encabezados: string[], indice: number, fila: string): string {
  const cols = encabezados.map((e) => e.trim())
  let c = cols[indice] ?? ''
  if (c && cols.filter((e) => e === c).length > 1) {
    c += ` (${cols.slice(0, indice + 1).filter((e) => e === c).length})`
  }
  const f = fila.trim()
  if (c && f) return `${c} de ${f}`
  return c || f || 'Valor a calcular'
}

type Nodo = { type: string; children?: Nodo[] }

interface Contexto {
  textContent: (nodo: Nodo) => string
  parent: (nodo: Nodo) => Nodo | undefined
  indexOf: (nodo: Nodo) => number | undefined
  setProperty: (nodo: Nodo, clave: 'children', valor: Nodo[]) => void
}

/** Plugin mdast de Sätteri: reemplaza el contenido de la celda por el input. */
export const celdasACalcularPlugin = {
  name: 'celdas-a-calcular',
  tableCell(celda: Nodo, ctx: Contexto) {
    if (!esCeldaACalcular(ctx.textContent(celda))) return
    const fila = ctx.parent(celda)
    const tabla = fila && ctx.parent(fila)
    const i = ctx.indexOf(celda) ?? -1
    const encabezados = (tabla?.children?.[0]?.children ?? []).map((c) => ctx.textContent(c))
    const primera = fila?.children?.[0]
    const etiqueta = etiquetaCampo(encabezados, i, primera && i > 0 ? ctx.textContent(primera) : '')
    ctx.setProperty(celda, 'children', [{ type: 'html', value: campoACalcular(etiqueta) } as Nodo])
  },
}
