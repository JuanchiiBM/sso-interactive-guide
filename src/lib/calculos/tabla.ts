/** Tabla a completar: un cálculo cuyas celdas son datos fijos o campos (tabla de páginas, FAT, trazas). */
import type { CampoCalculo } from './verificar'

export type CeldaCampo = Omit<CampoCalculo, 'etiqueta'>
export type Celda = string | number | CeldaCampo

export interface TablaCalculo {
  columnas: string[]
  filas: Celda[][]
}

export const esCampo = (c: Celda): c is CeldaCampo => typeof c === 'object'

/** Los campos de la tabla en orden de lectura; la etiqueta es `fila · columna` (la fila, por su 1ra celda). */
export function camposDeTabla({ columnas, filas }: TablaCalculo): CampoCalculo[] {
  return filas.flatMap((fila) =>
    fila.flatMap((celda, j) =>
      esCampo(celda)
        ? [{ ...celda, etiqueta: `${esCampo(fila[0]) ? '' : `${fila[0]} · `}${columnas[j] ?? ''}` }]
        : [],
    ),
  )
}

/** Los campos de un cálculo, venga con `campos` o con `tabla`. */
export const camposDe = (c: { campos?: CampoCalculo[]; tabla?: TablaCalculo }) =>
  c.tabla ? camposDeTabla(c.tabla) : (c.campos ?? [])
