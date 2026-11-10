import { describe, expect, it } from 'vitest'
import { camposDe, camposDeTabla } from './tabla'

const tabla = {
  columnas: ['Página', 'Frame', 'P'],
  filas: [
    ['10', { respuesta: 2 }, { respuesta: 1 }],
    ['21', { respuesta: '—', texto: true }, 0],
  ],
}

describe('camposDeTabla', () => {
  it('saca los campos en orden de lectura, con etiqueta fila · columna', () => {
    expect(camposDeTabla(tabla)).toEqual([
      { etiqueta: '10 · Frame', respuesta: 2 },
      { etiqueta: '10 · P', respuesta: 1 },
      { etiqueta: '21 · Frame', respuesta: '—', texto: true },
    ])
  })

  it('camposDe acepta campos o tabla', () => {
    expect(camposDe({ tabla })).toHaveLength(3)
    expect(camposDe({ campos: [{ etiqueta: 'a', respuesta: 1 }] })).toHaveLength(1)
  })
})
