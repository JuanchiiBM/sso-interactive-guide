/** Los parciales reales como simulacros: cada uno junta la teoría y la práctica cargadas de ese examen. */

export interface EjercicioFuente {
  id: string
  data: {
    /** En el build es una referencia de la colección; en los tests, el id suelto. */
    tema: string | { id: string }
    fuente: { guia: string; numero: string | number }
    dificultad: string
    preguntas: { enunciado: string }[]
  }
}

/** Una pregunta de teoría: la `indice` del simulacro `ejercicioId`. */
export interface ItemTeoria {
  ejercicioId: string
  indice: number
}

export interface Parcial {
  /** `1p-1c2026-tm`: también es el slug de la página. */
  id: string
  /** `1P 1C2026 TM`, como lo citan las preguntas. */
  codigo: string
  /** `1° Parcial 1C2026 · TM`, como lo citan los ejercicios. */
  titulo: string
  teoria: ItemTeoria[]
  /** Ids de los ejercicios de parcial de ese examen (cada uno entra completo). */
  practica: string[]
}

const RE_CITA = /\b(1[PR]) (\dC\d{4})(?: (TM|TT))?/g

/** Exámenes que cita el prefijo `(1P 2C2025 TM, 1P 1C2026 TM) …` de una pregunta de simulacro. */
export function examenesDeEnunciado(enunciado: string): string[] {
  const prefijo = enunciado.match(/^\(([^)]*)\)/)?.[1] ?? ''
  return [...prefijo.matchAll(RE_CITA)].map((m) => [m[1], m[2], m[3]].filter(Boolean).join(' '))
}

/** Exámenes de una fuente `1° Parcial 1C2025 · TM y 1C2026 · TM` (el tipo vale para todos). */
export function examenesDeFuente(guia: string): string[] {
  const tipo = /Recuperatorio/.test(guia) ? '1R' : /Parcial/.test(guia) ? '1P' : null
  if (!tipo) return []
  return [...guia.matchAll(/(\dC\d{4})(?: · (TM|TT))?/g)].map((m) =>
    [tipo, m[1], m[2]].filter(Boolean).join(' '),
  )
}

const tituloDe = (codigo: string) => {
  const [tipo, cuatri, turno] = codigo.split(' ')
  const nombre = tipo === '1R' ? '1° Recuperatorio' : '1° Parcial'
  return `${nombre} ${cuatri}${turno ? ` · ${turno}` : ''}`
}

/** Orden cronológico: año, cuatrimestre, parcial antes que recuperatorio, TM antes que TT. */
const claveOrden = (codigo: string) => {
  const [tipo, cuatri, turno = ''] = codigo.split(' ')
  return `${cuatri.slice(2)}${cuatri[0]}${tipo}${turno}`
}

const temaDe = (e: EjercicioFuente) =>
  typeof e.data.tema === 'string' ? e.data.tema : e.data.tema.id
const esSimulacro = (e: EjercicioFuente) => /\/simulacro(-\d+)?$/.test(e.id)

/**
 * Arma un parcial por cada examen citado. Teoría y práctica van en el orden de `ordenTemas`
 * (y dentro de un tema, por el orden de los simulacros o el número de ejercicio).
 */
export function armarParciales(ejercicios: EjercicioFuente[], ordenTemas: string[]): Parcial[] {
  const posTema = (e: EjercicioFuente) => {
    const i = ordenTemas.indexOf(temaDe(e))
    return i < 0 ? ordenTemas.length : i
  }
  const ordenados = [...ejercicios].sort(
    (a, b) =>
      posTema(a) - posTema(b) ||
      String(a.data.fuente.numero).localeCompare(String(b.data.fuente.numero), 'es', {
        numeric: true,
      }),
  )
  const parciales = new Map<string, Parcial>()
  const parcial = (codigo: string) => {
    let p = parciales.get(codigo)
    if (!p) {
      p = {
        id: codigo.toLowerCase().replace(/ /g, '-'),
        codigo,
        titulo: tituloDe(codigo),
        teoria: [],
        practica: [],
      }
      parciales.set(codigo, p)
    }
    return p
  }

  for (const e of ordenados) {
    if (esSimulacro(e)) {
      e.data.preguntas.forEach((q, indice) => {
        for (const codigo of examenesDeEnunciado(q.enunciado)) {
          parcial(codigo).teoria.push({ ejercicioId: e.id, indice })
        }
      })
    } else if (e.data.dificultad === 'parcial') {
      for (const codigo of examenesDeFuente(e.data.fuente.guia)) parcial(codigo).practica.push(e.id)
    }
  }
  return [...parciales.values()].sort((a, b) =>
    claveOrden(a.codigo).localeCompare(claveOrden(b.codigo)),
  )
}
