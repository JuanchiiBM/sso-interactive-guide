import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { cadenaFat, recorridoCadenaFat, type SpecCadenaFat } from './recorrido-cadena-fat'

// FAT y UFS ej-24 c): FAT32 con bloques de 8 KiB, el byte 12000 del archivo que empieza en el 5
const tabla = {
  0: 0,
  1: 0,
  2: 4,
  3: 'Fin de Archivo',
  4: 7,
  5: 10,
  6: 8,
  7: 'EOF',
  8: 3,
  9: 0,
  10: 6,
  11: 0,
}
const ej24: SpecCadenaFat = { titulo: 'c) Byte 12000', tabla, inicio: 5, bloque: 8192, byte: 12000 }

const r = recorridoCadenaFat(ej24)
const html = renderRecorrido(r)
const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]

describe('cadenaFat', () => {
  it('sigue la tabla desde el inicio hasta EOF / Fin de Archivo', () => {
    expect(cadenaFat(tabla, 5)).toEqual([5, 10, 6, 8, 3])
    expect(cadenaFat(tabla, 2)).toEqual([2, 4, 7])
  })

  it('rompe el build con una tabla que no cierra', () => {
    expect(() => cadenaFat({ 1: 2 }, 1)).toThrow('la entrada 2 no está en la tabla')
    expect(() => cadenaFat({ 1: 2, 2: 1 }, 1)).toThrow('ciclo')
    expect(() => cadenaFat({ 1: 0, 0: 'EOF' }, 1)).toThrow('libre')
  })
})

describe('recorridoCadenaFat hasta un byte (ej-24 c)', () => {
  it('un paso por bloque hasta el del byte y uno para leerlo', () => {
    expect(r.pasos!.map((p) => p.titulo)).toEqual([
      'Bloque 5 (lógico 0): seguir',
      'FAT[5] = 10: está acá',
      'Leer el bloque 10',
    ])
  })

  it('cajas en orden de la cadena, con lógico y rango, hasta EOF', () => {
    const f = frame(1)
    expect(f).toContain('archivo · inicio <tspan class="fat-inicio">5</tspan>')
    expect(
      f
        .match(/>bloque<\/text><text class="fat-caja-n"[^>]*>(\d+)</g)!
        .map((m) => m.match(/(\d+)<$/)![1]),
    ).toEqual(['5', '10', '6', '8', '3'])
    expect(f).toContain('>lógico 1<')
    expect(f).toContain('>8192–16383<')
    expect(f).toContain('>EOF<')
  })

  it('el bloque del paso en ok, los pasados en accent y los que faltan atenuados', () => {
    expect(frame(1).match(/fat-caja (fat-\w+)/g)).toEqual([
      'fat-caja fat-visto',
      'fat-caja fat-actual',
      'fat-caja fat-resto',
      'fat-caja fat-resto',
      'fat-caja fat-resto',
    ])
    expect(frame(0).match(/fat-caja fat-actual/g)).toHaveLength(1)
    expect(frame(2).match(/fat-caja (fat-\w+)/g)![1]).toBe('fat-caja fat-actual')
  })

  it('marca byte y offset bajo la caja donde cae', () => {
    const f = frame(0)
    expect(f).toContain('byte 12000 · offset 3808')
    const xCaja = f.match(/<text class="fat-caja-n" x="([\d.]+)"[^>]*>10</)![1]
    const xMarca = f.match(/<text class="" x="([\d.]+)"[^>]*>byte 12000/)![1]
    expect(xMarca).toBe(xCaja)
  })

  it('cuenta escrita: división, seguir y está acá', () => {
    const f = frame(1)
    expect(f).toContain('12000 / 8192 = 1,46 → lógico <tspan class="fat-inicio">1</tspan>')
    expect(f).toContain('bloque 5 (lógico 0): 0–8191 · 12000 &gt; 8191 → seguir')
    expect(f).toContain('FAT[5] = 10 (lógico 1): 8192–16383 · ✓ está acá')
    expect(frame(0)).not.toContain('FAT[5] = 10 (lógico 1)')
    expect(frame(2)).toContain('leer el bloque 10 → 1 bloque leído')
  })

  it('lo que había que completar, con el campo del paso', () => {
    expect(frame(0)).toContain('— (paso 2)')
    expect(frame(1)).toMatch(/fat-comp fat-comp-ok"><text[^>]*>Bloque del FS<\/text><text[^>]*>10</)
    expect(frame(1)).toContain('— (paso 3)')
    expect(frame(2)).toMatch(/fat-comp fat-comp-ok"><text[^>]*>Bloques leídos<\/text><text[^>]*>1</)
  })

  it('texto del paso del tablero', () => {
    expect(r.pasos![1].texto).toBe(
      'Cada bloque cubre 8192 bytes. El directorio da el **5** (bytes 0–8191); el byte 12000 está más adelante, así que se sigue **FAT[5] = 10**, que cubre 8192–16383: **el byte está en el bloque 10**. Los bloques 6, 8 y 3 no hace falta mirarlos.',
    )
  })

  it('byte en el primer bloque: está acá y leer', () => {
    const p = recorridoCadenaFat({ ...ej24, byte: 100 }).pasos!
    expect(p.map((x) => x.titulo)).toEqual(['Bloque 5: está acá', 'Leer el bloque 5'])
  })

  it('rompe el build si el byte queda después de la cadena', () => {
    expect(() => recorridoCadenaFat({ ...ej24, byte: 5 * 8192 })).toThrow(
      'la cadena tiene 5 bloques',
    )
  })
})
