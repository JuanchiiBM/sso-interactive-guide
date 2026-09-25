/** Mejor resultado de cada simulacro en este navegador (solo se guarda al finalizar). */
import type { Parcial } from './catalogo'

const PREFIJO = 'so:simulacro:'

export interface ResultadoSimulacro {
  nota: number
  tiempoMs: number
  /** ISO. */
  fecha: string
  /** Composición del parcial cuando se rindió: si cambia el contenido, el resultado deja de valer. */
  firma: string
}

type Almacen = Pick<Storage, 'getItem' | 'setItem'>

const almacenPorDefecto = (): Almacen | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** Huella de los ítems del parcial (no hace falta que sea criptográfica: solo detecta cambios). */
export function firmaParcial(p: Parcial): string {
  const texto = [...p.teoria.map((t) => `${t.ejercicioId}#${t.indice}`), ...p.practica].join('|')
  let h = 0
  for (let i = 0; i < texto.length; i++) h = (Math.imul(h, 31) + texto.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function leerResultado(
  id: string,
  firma: string,
  almacen: Almacen | null = almacenPorDefecto(),
): ResultadoSimulacro | null {
  try {
    const crudo = almacen?.getItem(PREFIJO + id)
    if (!crudo) return null
    const r = JSON.parse(crudo) as ResultadoSimulacro
    return r.firma === firma ? r : null
  } catch {
    return null
  }
}

/** Mejor = mayor nota; con la misma nota, menos tiempo. */
const esMejor = (nuevo: ResultadoSimulacro, previo: ResultadoSimulacro | null) =>
  !previo ||
  nuevo.nota > previo.nota ||
  (nuevo.nota === previo.nota && nuevo.tiempoMs < previo.tiempoMs)

/** Guarda el resultado solo si mejora al que había. Devuelve si lo guardó. */
export function guardarSiMejor(
  id: string,
  nuevo: ResultadoSimulacro,
  almacen: Almacen | null = almacenPorDefecto(),
): boolean {
  if (!esMejor(nuevo, leerResultado(id, nuevo.firma, almacen))) return false
  try {
    almacen?.setItem(PREFIJO + id, JSON.stringify(nuevo))
    return !!almacen
  } catch {
    return false
  }
}
