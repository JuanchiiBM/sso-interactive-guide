/** Desafío de cálculo: resultados exactos (número, hexa o fault) que el alumno escribe y verifica. */

export const FAULT = 'fault'

export interface CampoCalculo {
  etiqueta: string
  /** Valor esperado, o `'fault'` si la operación tiene que fallar. */
  respuesta: number | string
  /** 16 = hexa: acepta `0FAFh`, `0x0FAF` o `faf`. */
  base?: 10 | 16
  unidad?: string
  /** Respuesta de texto (EOF, `—`, un nombre): se compara sin mayúsculas ni espacios. */
  texto?: boolean
  /** Otras respuestas que también valen (la cátedra acepta dos criterios). */
  alternativas?: (number | string)[]
}

export interface RespuestaAlumno {
  valor: string
  fault: boolean
}

/** Texto del alumno → número, o null si no es válido en esa base. */
export function leerNumero(texto: string, base: 10 | 16 = 10): number | null {
  const t = texto.trim().toLowerCase().replace(/\s+/g, '')
  if (base === 16) {
    const hexa = t.replace(/^0x/, '').replace(/h$/, '')
    return /^[0-9a-f]+$/.test(hexa) ? parseInt(hexa, 16) : null
  }
  const decimal = t.replace(',', '.')
  // `2^74`, `2**74` o `3*2^20`: los tamaños de FS y memoria se escriben como potencias
  const potencia = decimal.match(/^(?:(\d+(?:\.\d+)?)[*x·])?2(?:\^|\*\*)(\d+)$/)
  if (potencia) return Number(potencia[1] ?? 1) * 2 ** Number(potencia[2])
  return /^-?\d+(\.\d+)?$/.test(decimal) ? Number(decimal) : null
}

/** Valor esperado del campo; en hexa se lee como texto (YAML convierte `30000` a número decimal). */
export function esperado(campo: CampoCalculo): number | typeof FAULT {
  if (campo.respuesta === FAULT) return FAULT
  if (campo.texto) return NaN
  const valor = leerNumero(String(campo.respuesta), campo.base)
  if (valor == null)
    throw new Error(`Respuesta inválida en "${campo.etiqueta}": ${campo.respuesta}`)
  return valor
}

/** Texto comparable: sin mayúsculas, espacios ni variantes del guion. */
export const normalizarTexto = (t: string) =>
  t.trim().toLowerCase().replace(/\s+/g, '').replace(/[—–]/g, '-')

function coincide(campo: CampoCalculo, respuesta: number | string, r: RespuestaAlumno): boolean {
  if (respuesta === FAULT) return r.fault
  if (r.fault) return false
  const e = campo.texto ? null : leerNumero(String(respuesta), campo.base)
  if (e == null) return normalizarTexto(r.valor) === normalizarTexto(String(respuesta))
  const valor = leerNumero(r.valor, campo.base)
  return valor != null && Math.abs(valor - e) <= 1e-9 * Math.max(1, Math.abs(e))
}

export function campoCorrecto(campo: CampoCalculo, r: RespuestaAlumno): boolean {
  if (!campo.texto) esperado(campo) // una respuesta numérica ilegible rompe el build
  return [campo.respuesta, ...(campo.alternativas ?? [])].some((x) => coincide(campo, x, r))
}

/** Correcto solo si aciertan todos los campos; `correctos` queda para un modo pista o el puntaje. */
export function verificarCalculo(campos: CampoCalculo[], respuestas: RespuestaAlumno[]) {
  const aciertos = campos.map((c, i) =>
    campoCorrecto(c, respuestas[i] ?? { valor: '', fault: false }),
  )
  const correctos = aciertos.filter(Boolean).length
  return { ok: correctos === campos.length, correctos }
}

/** Puntaje en un simulacro: la fracción de campos bien (cada campo es un resultado independiente). */
export function puntajeCalculo(campos: CampoCalculo[], respuestas: RespuestaAlumno[]): number {
  return campos.length ? verificarCalculo(campos, respuestas).correctos / campos.length : 0
}
