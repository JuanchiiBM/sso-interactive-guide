import { beforeEach, describe, expect, it } from 'vitest'
import type { Parcial } from './catalogo'
import { firmaParcial, guardarSiMejor, leerResultado, type ResultadoSimulacro } from './resultados'

class AlmacenFalso {
  datos = new Map<string, string>()
  getItem = (k: string) => this.datos.get(k) ?? null
  setItem = (k: string, v: string) => void this.datos.set(k, v)
}

const parcial: Parcial = {
  id: '1p-1c2026-tm',
  codigo: '1P 1C2026 TM',
  titulo: '1° Parcial 1C2026 · TM',
  teoria: [{ ejercicioId: 'planificacion/simulacro-1', indice: 3 }],
  practica: ['planificacion/ej-15', 'hilos/ej-11'],
}
const firma = firmaParcial(parcial)
const r = (nota: number, minutos: number): ResultadoSimulacro => ({
  nota,
  tiempoMs: minutos * 60_000,
  fecha: '2026-09-25T10:00:00.000Z',
  firma,
})

describe('resultados de simulacros', () => {
  let almacen: AlmacenFalso
  beforeEach(() => (almacen = new AlmacenFalso()))

  it('sin intento no hay resultado', () => {
    expect(leerResultado(parcial.id, firma, almacen)).toBeNull()
  })

  it('el primer intento se guarda', () => {
    expect(guardarSiMejor(parcial.id, r(6, 60), almacen)).toBe(true)
    expect(leerResultado(parcial.id, firma, almacen)).toEqual(r(6, 60))
  })

  it('una nota mejor pisa a la anterior aunque tarde más', () => {
    guardarSiMejor(parcial.id, r(6, 60), almacen)
    expect(guardarSiMejor(parcial.id, r(8, 120), almacen)).toBe(true)
    expect(leerResultado(parcial.id, firma, almacen)).toEqual(r(8, 120))
  })

  it('una nota peor no se guarda aunque sea más rápida', () => {
    guardarSiMejor(parcial.id, r(8, 120), almacen)
    expect(guardarSiMejor(parcial.id, r(7.5, 30), almacen)).toBe(false)
    expect(leerResultado(parcial.id, firma, almacen)?.nota).toBe(8)
  })

  it('con la misma nota queda la más rápida', () => {
    guardarSiMejor(parcial.id, r(8, 120), almacen)
    expect(guardarSiMejor(parcial.id, r(8, 90), almacen)).toBe(true)
    expect(guardarSiMejor(parcial.id, r(8, 100), almacen)).toBe(false)
    expect(leerResultado(parcial.id, firma, almacen)?.tiempoMs).toBe(90 * 60_000)
  })

  it('si cambia la composición del parcial, el resultado anterior deja de valer', () => {
    guardarSiMejor(parcial.id, r(9, 60), almacen)
    const otra = firmaParcial({ ...parcial, practica: [...parcial.practica, 'deadlock/ej-14'] })
    expect(otra).not.toBe(firma)
    expect(leerResultado(parcial.id, otra, almacen)).toBeNull()
    expect(guardarSiMejor(parcial.id, { ...r(4, 60), firma: otra }, almacen)).toBe(true)
  })

  it('sin localStorage no rompe', () => {
    expect(leerResultado(parcial.id, firma, null)).toBeNull()
    expect(guardarSiMejor(parcial.id, r(10, 1), null)).toBe(false)
    const roto = {
      getItem: () => '{no es json',
      setItem: () => {
        throw new Error('lleno')
      },
    }
    expect(leerResultado(parcial.id, firma, roto)).toBeNull()
    expect(guardarSiMejor(parcial.id, r(10, 1), roto)).toBe(false)
  })
})
