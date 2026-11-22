import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoInodo, reparto, type SpecInodo } from './recorrido-inodo'

// fat-ufs ej-47: 10 PD + PIS + PID, bloques de 1 KiB, punteros de 4 B
const ej47: SpecInodo = {
  titulo: 'Leer del byte 10500 al 544767',
  bloque: 1024,
  puntero: 4,
  punteros: { directos: 10, simples: 1, dobles: 1 },
  bytes: [10500, 544767],
}
// fat-ufs ej-38: archivo de 2 GiB con 10 PD, 3 PIS, 2 PID y 1 PIT, punteros de 8 B
const ej38: SpecInodo = {
  titulo: 'Leer el archivo de 2 GiB',
  bloque: 1024,
  puntero: 8,
  punteros: { directos: 10, simples: 3, dobles: 2, triples: 1 },
  bloques: [0, 2 ** 21 - 1],
}
const textos = (s: SpecInodo) => recorridoInodo(s).pasos!.map((p) => p.texto)

describe('recorridoInodo: pasos y textos', () => {
  it('ej-47: Ubicar, un paso por puntero y Total', () => {
    expect(recorridoInodo(ej47).pasos!.map((p) => p.titulo)).toEqual([
      'Ubicar',
      '10 PD',
      'PIS',
      'PID',
      'Total',
    ])
    const [ubicar, pd, pis, pid, total] = textos(ej47)
    expect(ubicar).toBe(
      'Punteros por bloque: `1 KiB / 4 B =` **256**. El byte 10.500 está en el bloque `10.500 / 1024 = 10,25` → **10**, y el 544.767 en `544.767 / 1024 = 531,99` → **531**. Se leen `531 − 10 + 1 =` **522 bloques de datos**, del PIS al PID.',
    )
    expect(pd).toBe(
      'Los **10 PD** (punteros directos) apuntan a los bloques **0 – 9**. La lectura empieza en el 10: de los PD **no se lee ninguno**. Un PD apunta directo al dato, así que nunca suma bloques de punteros.',
    )
    expect(pis).toBe(
      'Los bloques **10 – 265** caen en el **PIS** (puntero indirecto simple). Su bloque de punteros tiene 256 entradas y se usan **todas**: se leen **256 bloques de datos** y **1 bloque de punteros**.',
    )
    expect(pid).toBe(
      'Los bloques **266 – 531** caen en el **PID** (puntero indirecto doble). Son 266 = 256 + 10: el primer bloque de punteros simples cubre 256 (266 – 521) y hace falta **un segundo** para los 10 que quedan (522 – 531). Se leen **1 + 2 bloques de punteros**.',
    )
    expect(total).toBe(
      'Sumando los punteros: **522 bloques de datos** + **4 bloques de punteros** = **526 accesos**. El inodo ya estaba en memoria: no cuenta.',
    )
  })

  it('ej-38: el PIT con 1 + 126 + 16.125 y miles con punto', () => {
    const r = recorridoInodo(ej38)
    expect(r.pasos!).toHaveLength(9)
    expect(r.pasos![7].texto).toBe(
      'Los bloques **33.162 – 2.097.151** caen en el **PIT** (puntero indirecto triple). Son 2.063.990 = 16.124 × 128 + 118: hacen falta **16.125** BP de 3.er nivel (el último con 118), y a esos los apuntan ⌈16.125 / 128⌉ = **126** BP de 2.º nivel. Se leen **1 + 126 + 16.125 bloques de punteros**.',
    )
    expect(r.pasos![8].texto).toContain(
      '**2.097.152 bloques de datos** + **16.513 bloques de punteros**',
    )
    expect(r.pasos![0].texto).toContain(
      'Se leen los bloques lógicos **0 – 2.097.151**: `2.097.151 − 0 + 1 =` **2.097.152 bloques de datos**, de los PD al PIT.',
    )
  })

  it('ej-16 a): un solo byte; los punteros antes del rango no leen nada', () => {
    const t = textos({
      titulo: 'Byte 16777227',
      bloque: 4096,
      puntero: 8,
      punteros: { directos: 12, simples: 1, dobles: 1, triples: 1 },
      byte: 16777227,
    })
    expect(t).toHaveLength(5) // Ubicar, PD, PIS, PID, Total: el PIT no se recorre
    expect(t[0]).toContain('`16.777.227 / 4096 = 4096` → **4096**')
    expect(t[0]).toContain('Se lee **1 bloque de datos**, todo por el PID.')
    expect(t[2]).toBe(
      'El **PIS** (puntero indirecto simple) cubre los bloques **12 – 523**, antes de donde empieza la lectura: no se lee nada.',
    )
    expect(t[3]).toContain(
      'Entran en un solo bloque de punteros de 2.º nivel. Se leen **1 + 1 bloques de punteros**.',
    )
  })

  it('ej-42: PIS desde la mitad, PID 1 entero y PID 2 con el último a medias', () => {
    const t = textos({
      titulo: 'ej-42',
      bloque: 8192,
      puntero: 8,
      punteros: { directos: 12, simples: 1, dobles: 2 },
      bytes: [6553600, 8631975936],
    })
    expect(t[0]).toContain('`6.553.600 / 8192 = 800` → **800**')
    expect(t[2]).toContain('se usan **236**')
    expect(t[3]).toContain(
      'Son 1.048.576 = 1024 × 1024: se usan **1024** bloques de punteros simples, enteros.',
    )
    expect(t[4]).toContain(
      'Son 4097 = 4 × 1024 + 1: hacen falta **5** bloques de punteros simples (el último con 1).',
    )
  })

  it('texto del autor en Ubicar', () => {
    const t = textos({
      ...ej47,
      bytes: undefined,
      bloques: [9, 20],
      texto: 'El bloque 8 ya está en memoria.',
    })
    expect(t[0]).toMatch(
      /\*\*9 – 20\*\*: `20 − 9 \+ 1 =` \*\*12 bloques de datos\*\*, de los PD al PIS\. El bloque 8 ya está en memoria\.$/,
    )
  })

  it('rompe el build con un rango mal dado', () => {
    expect(() => recorridoInodo({ ...ej47, byte: 3 })).toThrow(/uno de/)
    expect(() => recorridoInodo({ ...ej47, bytes: [2048, 0] })).toThrow(/empieza después/)
    expect(() => recorridoInodo({ ...ej47, bytes: [0, 70000 * 1024] })).toThrow(
      /máximo del archivo/,
    )
    expect(() => recorridoInodo({ ...ej47, puntero: 3 })).toThrow(/múltiplo/)
  })

  it('reparto: cómo se arma la suma de bloques por BP', () => {
    expect(reparto(256, 266, 256)).toMatchObject({
      k: 2,
      primero: 256,
      ultimo: 10,
      expr: '256 + 10',
    })
    expect(reparto(5, 300, 256)).toMatchObject({ k: 2, primero: 251, ultimo: 49, expr: '251 + 49' })
    expect(reparto(0, 512, 256).expr).toBe('2 × 256')
  })
})

describe('recorridoInodo: dibujo de cada puntero (tablero inodo-A)', () => {
  const html = renderRecorrido(recorridoInodo(ej47))
  const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]
  const textosDe = (f: string) =>
    [...f.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''))

  it('PID (paso 4): inodo, BP con sus entradas y los dos BP de 2.º nivel', () => {
    const t = textosDe(frame(3))
    expect(t).toEqual(
      expect.arrayContaining([
        'Inodo (en memoria)',
        '10 PD · 0–9',
        'PIS · 10–265 ✓',
        'PID · 266–65.801',
        'Bloque del PID BP',
        '[0] → 266–521',
        '[1] → 522–777',
        '[2..255] sin usar',
        'PID · 2.º nivel #0 BP',
        '256 punteros → bloques 266–521',
        'se leen los 256',
        'PID · 2.º nivel #1 BP',
        'bloques 522–777',
        'se leen 10 (522–531)',
      ]),
    )
    expect(frame(3)).toMatch(/in-ptr-nada[^]*10 PD/)
    expect(frame(3)).toMatch(/in-ptr-hecho[^]*PIS/)
    expect(frame(3)).toMatch(/in-ptr-actual[^]*PID/)
  })

  it('PD y PIS (pasos 2 y 3): la caja de BD sin leer y el BP entero', () => {
    expect(textosDe(frame(1))).toEqual(
      expect.arrayContaining([
        'Bloques de los PD BD',
        '10 PD → bloques 0–9',
        'no se lee ninguno (empieza en el 10)',
      ]),
    )
    expect(textosDe(frame(2))).toEqual(
      expect.arrayContaining([
        'Bloque del PIS BP',
        '256 punteros → bloques 10–265',
        'se leen los 256',
      ]),
    )
  })

  it('muchos BP: primero, "…" y último (ej-42, PID 1 con 1024)', () => {
    const r = recorridoInodo({
      titulo: 'ej-42',
      bloque: 8192,
      puntero: 8,
      punteros: { directos: 12, simples: 1, dobles: 2 },
      bytes: [6553600, 8631975936],
    })
    const h = renderRecorrido(r)
    const f = h.split('data-el="paso-3"')[1].split('data-el="paso-')[0]
    const t = textosDe(f)
    expect(t).toEqual(
      expect.arrayContaining([
        '[0] → 1036–2059',
        '… [1..1022]',
        '[1023] → 1.048.588–1.049.611',
        '… 1022 más, enteros',
      ]),
    )
    expect(t.filter((x) => x.includes('2.º nivel #'))).toEqual([
      'PID 1 · 2.º nivel #0 BP',
      'PID 1 · 2.º nivel #1023 BP',
    ])
    expect(r.ancho).toBeGreaterThanOrEqual(760)
  })
})
