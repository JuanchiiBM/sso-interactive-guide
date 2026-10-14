import { describe, expect, it } from 'vitest'
import { campoCorrecto, esperado, leerNumero, verificarCalculo } from './verificar'

const r = (valor: string, fault = false) => ({ valor, fault })

describe('leerNumero', () => {
  it('decimal con coma o punto', () => {
    expect(leerNumero('649')).toBe(649)
    expect(leerNumero(' 0,5 ')).toBe(0.5)
    expect(leerNumero('0.5')).toBe(0.5)
  })

  it('rechaza texto que no es número', () => {
    expect(leerNumero('')).toBeNull()
    expect(leerNumero('SF')).toBeNull()
    expect(leerNumero('12a')).toBeNull()
  })

  it('hexa con sufijo h, prefijo 0x, minúsculas y ceros a la izquierda', () => {
    for (const t of ['0FAFh', '0x0FAF', 'faf', '00FAF', 'FAF H'])
      expect(leerNumero(t, 16)).toBe(0xfaf)
    expect(leerNumero('0FAG', 16)).toBeNull()
  })
})

describe('esperado', () => {
  it('lee la respuesta hexa como texto aunque YAML la haya convertido en número', () => {
    expect(esperado({ etiqueta: 'base', respuesta: 30000, base: 16 })).toBe(0x30000)
  })

  it('falla en build si la respuesta no es válida', () => {
    expect(() => esperado({ etiqueta: 'x', respuesta: 'doce' })).toThrow(/Respuesta inválida/)
  })
})

describe('campoCorrecto', () => {
  const fault = { etiqueta: '(2, 500)', respuesta: 'fault' }
  const numero = { etiqueta: '(0, 430)', respuesta: 649 }

  it('un fault se responde solo con el botón Fault', () => {
    expect(campoCorrecto(fault, r('', true))).toBe(true)
    expect(campoCorrecto(fault, r('590'))).toBe(false)
  })

  it('marcar Fault donde va un número es incorrecto aunque el número esté bien', () => {
    expect(campoCorrecto(numero, r('649', true))).toBe(false)
    expect(campoCorrecto(numero, r('649'))).toBe(true)
    expect(campoCorrecto(numero, r('648'))).toBe(false)
  })
})

describe('verificarCalculo', () => {
  const campos = [
    { etiqueta: 'a', respuesta: 649 },
    { etiqueta: 'b', respuesta: '0FAF', base: 16 as const },
    { etiqueta: 'c', respuesta: 'fault' },
  ]

  it('correcto solo si aciertan todos', () => {
    expect(verificarCalculo(campos, [r('649'), r('fafh'), r('', true)])).toEqual({
      ok: true,
      correctos: 3,
    })
    expect(verificarCalculo(campos, [r('649'), r('faf'), r('')])).toEqual({
      ok: false,
      correctos: 2,
    })
  })

  it('campos sin responder cuentan como error', () => {
    expect(verificarCalculo(campos, [])).toEqual({ ok: false, correctos: 0 })
  })
})
