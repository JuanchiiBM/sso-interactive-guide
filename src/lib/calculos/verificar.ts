/** Desafío de cálculo: resultados exactos (número, hexa o fault) que el alumno escribe y verifica. */

export const FAULT = 'fault'

export interface CampoCalculo {
  etiqueta: string
  /** Valor esperado, o `'fault'` si la operación tiene que fallar. */
  respuesta: number | string
  /** 16 = hexa: acepta `0FAFh`, `0x0FAF` o `faf`. */
  base?: 10 | 16
  unidad?: string
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
  return /^-?\d+(\.\d+)?$/.test(decimal) ? Number(decimal) : null
}

/** Valor esperado del campo; en hexa se lee como texto (YAML convierte `30000` a número decimal). */
export function esperado(campo: CampoCalculo): number | typeof FAULT {
  if (campo.respuesta === FAULT) return FAULT
  const valor = leerNumero(String(campo.respuesta), campo.base)
  if (valor == null)
    throw new Error(`Respuesta inválida en "${campo.etiqueta}": ${campo.respuesta}`)
  return valor
}

export function campoCorrecto(campo: CampoCalculo, r: RespuestaAlumno): boolean {
  const e = esperado(campo)
  if (e === FAULT) return r.fault
  if (r.fault) return false
  const valor = leerNumero(r.valor, campo.base)
  return valor != null && Math.abs(valor - e) < 1e-9
}

/** Correcto solo si aciertan todos los campos; `correctos` queda para un modo pista o el puntaje. */
export function verificarCalculo(campos: CampoCalculo[], respuestas: RespuestaAlumno[]) {
  const aciertos = campos.map((c, i) =>
    campoCorrecto(c, respuestas[i] ?? { valor: '', fault: false }),
  )
  const correctos = aciertos.filter(Boolean).length
  return { ok: correctos === campos.length, correctos }
}
