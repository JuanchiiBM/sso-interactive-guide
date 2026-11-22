import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoDeducir } from './recorrido-deducir'
import { ej11, ej16, ej18 } from './deducir.ejemplos'

const html = (s: typeof ej18) => renderRecorrido(recorridoDeducir(s))

describe('recorridoDeducir', () => {
  it('ej-18: celdas, tarjetas y respuesta del tablero tlb-D', () => {
    const h = html(ej18)
    for (const t of [
      'B2 ← víctima real',
      'sale (menor TC)',
      'sale (menor TUR)',
      'sale (U=0, 1.º)',
      'sale (0,0)',
      '¿Coincide con B2?',
      'FIFO: no.',
      'LRU y Clock.',
    ])
      expect(h).toContain(t)
    const r = recorridoDeducir(ej18)
    expect(r.pasos!.map((p) => p.titulo)).toEqual(['Decodificar', 'Comparar algoritmos'])
    expect(h).toContain('00BB1233h = 00B | B1233')
    expect(h).toContain('14B1233h = 14 | B1233')
  })

  it('ej-18: los porqués salen del estado', () => {
    const textos = renderRecorrido(recorridoDeducir(ej18))
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
    expect(textos).toContain('Saca la cargada hace más tiempo: A0 (TC 50), no B2 (TC 100).')
    expect(textos).toContain('La de menor TUR es B2 (100).')
    expect(textos).toContain('B2 tiene U = 0; con el puntero en el frame 20 es la primera que')
    expect(textos).toContain('La 1.ª vuelta busca (0,0) y A0 lo es: la elige antes que')
  })

  it('ej-11: Clock mejorado por la única M = 0, sea cual sea el puntero', () => {
    const textos = html(ej11)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
    expect(textos).toContain('sale (menor REF)')
    expect(textos).toContain('sale (única M = 0)')
    expect(textos).toContain('3.ª: la 6 es la única (0,0). Pasa sea cual sea el puntero.')
    expect(textos).toContain('Respuesta: Clock mejorado.')
  })

  it('ej-16: víctimas en secuencia, desvíos y la traza de Clock', () => {
    const textos = html(ej16)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
    expect(textos).toContain('F4 · PB3')
    expect(textos).toContain('Clock: sí, con el puntero en el frame 4.')
    expect(textos).toContain(
      'Saca F4 (U = 0); baja U de 5, 6 y 7 y saca F0; baja U de 1 a 4 y saca F5.',
    )
    expect(textos).toContain(
      'Acierta las dos primeras, pero en la 3.ª saca PC2 (TS 95, frame 7), no el frame 5.',
    )
    expect(textos).toContain('Respuesta: Clock, con el puntero arrancando en el frame 4.')
  })
})
