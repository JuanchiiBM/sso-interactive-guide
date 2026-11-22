import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import {
  recorridoTraduccionDirecta,
  type SpecTraduccionDirecta,
} from './recorrido-traduccion-directa'

// Memoria Real ej-04: escribir en 4 direcciones de 18 bits con segmentación y protección
const ej04: SpecTraduccionDirecta = {
  sentido: 'directo',
  titulo: 'Escrituras con segmentación y protección',
  bitsSegmento: 2,
  bitsOffset: 16,
  acceso: 'escritura',
  segmentos: [
    { seg: 0, base: 0x00000, largo: 0x0abcd, permisos: 'r' },
    { seg: 1, base: 0x1b000, largo: 0x007ff, permisos: 'x' },
    { seg: 2, base: 0x1b800, largo: 0x00fff, permisos: 'rw' },
    { seg: 3, base: 0x30000, largo: 0x01234, permisos: 'rw' },
  ],
  direcciones: [
    { dl: 0x20000 },
    { dl: 0x10000 },
    { dl: 0x0beef, texto: 'Texto del autor.' },
    { dl: 0x00ace },
  ],
}

const r = recorridoTraduccionDirecta(ej04)
const html = renderRecorrido(r)
const pasos = r.pasos!
// fotograma de un paso: lo que hay dentro de su grupo
const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]

describe('recorridoTraduccionDirecta (DL → DF con límite y permiso)', () => {
  it('un paso por dirección, con su resultado en el título', () => {
    expect(pasos.map((p) => p.titulo)).toEqual([
      '20000h → 1B800h',
      '10000h → Fault (permiso)',
      '0BEEFh → Fault (límite)',
      '00ACEh → Fault (permiso)',
    ])
  })

  it('1. corta la dirección bit a bit, con los de segmento aparte', () => {
    const f = frame(2)
    expect(f).toContain('1. Cortar 0BEEFh: 2 bits de segmento | 16 de desplazamiento')
    expect(f.match(/class="tr-bit tr-bit-seg"/g)).toHaveLength(2)
    expect(f.match(/class="tr-bit tr-bit-off"/g)).toHaveLength(16)
    expect(f).toMatch(/segmento <tspan[^>]*>0<\/tspan>/)
    expect(f).toMatch(/desplazamiento <tspan[^>]*>BEEFh<\/tspan>/)
  })

  it('2. marca la fila del segmento y el dato que falla', () => {
    const f = frame(2)
    expect(f).toContain('2. Buscar la fila del segmento 0')
    expect(f).toContain('>Protección<')
    expect(f.match(/tr-fila-sel/g)).toHaveLength(1)
    expect(f).toMatch(/class="rm-izq tr-mal"[^>]*>0ABCDh</)
    expect(frame(1)).toMatch(/class="rm-izq tr-mal"[^>]*>Exec only</)
  })

  it('3. el límite falla primero y lo que sigue no se llega', () => {
    const f = frame(2)
    expect(f).toContain('3. Chequeos de la MMU, en orden')
    expect(f).toContain('BEEFh ≥ ABCDh → segmentation fault')
    expect(f).toContain('no se llega (además es Read only)')
    expect(f).toContain('DF = base + desplazamiento (no se calcula)')
    expect(f.indexOf('desplazamiento &lt; largo')).toBeLessThan(
      f.indexOf('modo de acceso permitido'),
    )
  })

  it('3. con el permiso en falta, el límite pasa y el permiso corta', () => {
    const f = frame(1)
    expect(f).toContain('0000h &lt; 07FFh')
    expect(f).toContain('escribir en un segmento Exec only → fault por permiso')
    expect(f).not.toContain('además')
  })

  it('3. si pasa todo, calcula la DF', () => {
    const f = frame(0)
    expect(f).toContain('0000h &lt; 0FFFh')
    expect(f).toContain('Read write permite escribir')
    expect(f).toContain('1B800h + 0000h = 1B800h')
  })

  it('chips: resueltos hasta el paso, el actual marcado y el resto con "?"', () => {
    const f = frame(2)
    expect(f).toMatch(/rm-chip-ok[^"]*"[^]*?20000h → 1B800h/)
    expect(f).toMatch(/rm-chip-mal tr-chip-pasado"[^]*?10000h → Fault \(permiso\)/)
    expect(f).toMatch(/rm-chip-mal tr-chip-actual"[^]*?0BEEFh → Fault \(límite\)/)
    expect(f).toMatch(/tr-chip-pendiente"[^]*?00ACEh → \?/)
  })

  it('el texto dice por qué falla o qué da, y suma el del autor', () => {
    expect(pasos[2].texto).toBe(
      'El primer chequeo ya falla: el desplazamiento **BEEFh** no es menor que el largo **ABCDh**, así que la MMU corta con **segmentation fault** sin mirar el permiso. Texto del autor.',
    )
    expect(pasos[1].texto).toContain('el segmento 1 es **Exec only**')
    expect(pasos[1].texto).toContain('**fault por permiso**')
    expect(pasos[0].texto).toContain('DF = 1B800h + 0000h = **1B800h**')
  })

  it('un dato inconsistente rompe el build', () => {
    const con = (d: Partial<SpecTraduccionDirecta>) => () =>
      recorridoTraduccionDirecta({ ...ej04, ...d })
    expect(con({ direcciones: [{ dl: 0x40000 }] })).toThrow(/18 bits/)
    expect(con({ segmentos: ej04.segmentos.slice(1) })).toThrow(/segmento 0/)
    expect(con({ segmentos: [{ seg: 0, base: 0, largo: 1, permisos: 'rz' }] })).toThrow(/permisos/)
  })
})

// Memoria Real ej-03: la dirección viene como (segmento, desplazamiento), en decimal y sin protección
const ej03: SpecTraduccionDirecta = {
  sentido: 'directo',
  titulo: 'Direcciones físicas con tabla de segmentos',
  unidad: 'decimal',
  segmentos: [
    { seg: 0, base: 219, largo: 600 },
    { seg: 1, base: 2300, largo: 14 },
    { seg: 2, base: 90, largo: 100 },
    { seg: 3, base: 1327, largo: 580 },
  ],
  direcciones: [
    { seg: 0, desp: 430 },
    { seg: 1, desp: 10 },
    { seg: 2, desp: 500 },
  ],
}

describe('recorridoTraduccionDirecta (ya cortada, decimal, sin protección)', () => {
  const r3 = recorridoTraduccionDirecta(ej03)
  const html3 = renderRecorrido(r3)
  const frame3 = (k: number) => html3.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]

  it('títulos y chips con la dirección como par', () => {
    expect(r3.pasos!.map((p) => p.titulo)).toEqual([
      '(0, 430) → 649',
      '(1, 10) → 2310',
      '(2, 500) → Fault (límite)',
    ])
    expect(frame3(2)).toContain('(0, 430) → 649')
  })

  it('no corta bits: la dirección ya viene cortada', () => {
    const f = frame3(2)
    expect(f).toContain('1. La dirección lógica ya viene cortada: segmento 2 · desplazamiento 500')
    expect(f).not.toContain('tr-bit')
  })

  it('sin acceso no hay columna de protección ni chequeo de permiso', () => {
    const f = frame3(2)
    expect(f).not.toContain('Protección')
    expect(f).not.toContain('modo de acceso')
    expect(f).toContain('500 ≥ 100 → segmentation fault')
    expect(frame3(0)).toContain('219 + 430 = 649')
    expect(r3.pasos![2].texto).toBe(
      'El primer chequeo ya falla: el desplazamiento **500** no es menor que el largo **100**, así que la MMU corta con **segmentation fault**.',
    )
  })

  it('una dirección sin dl ni (seg, desp) rompe el build', () => {
    expect(() =>
      recorridoTraduccionDirecta({ ...ej03, direcciones: [{ seg: 0 } as never] }),
    ).toThrow(/dl/)
  })
})

describe('recorridoTraduccionDirecta con límite (última dirección válida, ≤)', () => {
  const conLimite = (limite: number) =>
    recorridoTraduccionDirecta({
      ...ej04,
      segmentos: [{ seg: 0, base: 0, limite, permisos: 'rw' }],
      direcciones: [{ dl: 0x0beef }],
    })

  it('compara con ≤ y la tabla dice Límite', () => {
    const html = renderRecorrido(conLimite(0xbeee))
    expect(html).toContain('>Límite<')
    expect(html).toContain('desplazamiento ≤ límite')
    expect(html).toContain('BEEFh &gt; BEEEh → segmentation fault')
    expect(conLimite(0xbeee).pasos![0].texto).toContain(
      'el desplazamiento **BEEFh** supera el límite **BEEEh**',
    )
  })

  it('el desplazamiento igual al límite es válido', () => {
    expect(conLimite(0xbeef).pasos![0].titulo).toBe('0BEEFh → 0BEEFh')
  })

  it('un segmento con largo y límite, o sin ninguno, rompe el build', () => {
    const con = (s: object) => () =>
      recorridoTraduccionDirecta({ ...ej04, segmentos: [{ seg: 0, base: 0, ...s }] })
    expect(con({ largo: 1, limite: 1 })).toThrow(/largo.*limite/)
    expect(con({})).toThrow(/largo.*limite/)
  })
})

const fotograma = (html: string, k: number) =>
  html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]

// Memoria Real ej-06: segmentación paginada en hexa, sin límite ni tipo de acceso
const ej06: SpecTraduccionDirecta = {
  sentido: 'directo',
  titulo: 'Segmentación paginada de P1',
  bitsSegmento: 2,
  bitsPagina: 6,
  bitsOffset: 8,
  segmentos: [
    { seg: 0, nombre: 'Code', permisos: 'RX', paginas: { 0: 3, 1: 18, 2: 7 } },
    { seg: 1, nombre: 'Data', permisos: 'RW', paginas: { 0: 11, 1: 17 } },
    { seg: 2, nombre: 'Stack', permisos: 'RW', paginas: { 0: 9 } },
    { seg: 3, nombre: 'Heap', permisos: 'RW', paginas: { 0: 10, 1: 21, 2: 24 } },
  ],
  direcciones: [{ dl: 0x02ab }, { dl: 0xc110 }, { dl: 0x8013 }, { dl: 0x01fa }],
}

describe('recorridoTraduccionDirecta paginada en hexa (ej-06)', () => {
  const r6 = recorridoTraduccionDirecta(ej06)
  const html6 = renderRecorrido(r6)

  it('DF = frame | offset para cada dirección', () => {
    expect(r6.pasos!.map((p) => p.titulo)).toEqual([
      '02ABh → 07ABh',
      'C110h → 1510h',
      '8013h → 0913h',
      '01FAh → 12FAh',
    ])
  })

  it('1. corta en segmento | página | offset', () => {
    const f = fotograma(html6, 1)
    expect(f).toContain('1. Cortar C110h: 2 bits de segmento | 6 de página | 8 de offset')
    expect(f.match(/tr-bit tr-bit-seg"/g)).toHaveLength(2)
    expect(f.match(/tr-bit tr-bit-pag"/g)).toHaveLength(6)
    expect(f.match(/tr-bit tr-bit-off"/g)).toHaveLength(8)
    expect(f).toMatch(/segmento <tspan[^>]*>3 \(Heap\)<\/tspan>/)
    expect(f).toMatch(/página <tspan[^>]*>1<\/tspan>/)
  })

  it('2. sin límite ni acceso no hay tabla de segmentos: va la de páginas con permisos', () => {
    const f = fotograma(html6, 1)
    expect(f).not.toContain('Buscar la fila')
    expect(f).toContain('2. Tabla de páginas del segmento 3 (Heap)')
    expect(f).toContain('>Permisos<')
    expect(f).toMatch(/class="rm-izq tr-acento"[^>]*>21</)
  })

  it('3. chequeos: la página tiene frame y la DF se arma pegando', () => {
    const f = fotograma(html6, 1)
    expect(f).toContain('3. Chequeos de la MMU, en orden')
    expect(f).toContain('página 1 → frame 21 = 15h')
    expect(f).toContain('15h | 10h = 1510h')
    expect(r6.pasos![1].texto).toBe(
      'La página **1** del segmento 3 (Heap) está en el frame **21 = 15h**. Las páginas son de 256 B, así que el offset son los dos últimos dígitos hexa y la DF se arma pegando frame y offset: **1510h**.',
    )
  })

  it('una página sin frame da Fault (página)', () => {
    const r = recorridoTraduccionDirecta({ ...ej06, direcciones: [{ dl: 0x8100 }] })
    expect(r.pasos![0].titulo).toBe('8100h → Fault (página)')
    expect(renderRecorrido(r)).toContain('la página 1 no tiene frame → fault')
  })

  it('datos inconsistentes rompen el build', () => {
    const { bitsPagina: _, ...sinBits } = ej06
    expect(() => recorridoTraduccionDirecta(sinBits)).toThrow(/bitsPagina/)
    expect(() =>
      recorridoTraduccionDirecta({ ...ej06, segmentos: [{ seg: 0, paginas: { 64: 1 } }] }),
    ).toThrow(/6 bits/)
    expect(() =>
      recorridoTraduccionDirecta({ ...ej06, segmentos: [{ seg: 0, permisos: 'RX' }] }),
    ).toThrow(/paginas/)
  })
})

// Memoria Real ej-09: segmentación paginada en decimal, con límite y permiso de ejecución
const ej09: SpecTraduccionDirecta = {
  sentido: 'directo',
  titulo: 'Referencias para ejecución',
  bitsSegmento: 3,
  bitsPagina: 7,
  bitsOffset: 10,
  unidad: 'decimal',
  acceso: 'ejecucion',
  segmentos: [
    { seg: 0, limite: 15483, permisos: 'RW-', paginas: { 3: 12, 4: 5, 5: 7, 6: 4, 7: 43, 8: 11 } },
    {
      seg: 1,
      limite: 10295,
      permisos: 'RWX',
      paginas: { 0: 22, 1: 21, 2: 42, 3: 10, 4: 9, 5: 33 },
    },
    {
      seg: 2,
      limite: 20480,
      permisos: 'R-X',
      paginas: { 7: 31, 8: 35, 9: 2, 10: 0, 11: 6, 12: 23 },
    },
    {
      seg: 3,
      limite: 12285,
      permisos: 'R-X',
      paginas: { 4: 45, 5: 41, 6: 39, 7: 18, 8: 19, 9: 24 },
    },
  ],
  direcciones: [{ dl: 135145 }, { dl: 405707 }, { dl: 270340 }, { dl: 6032 }],
}

describe('recorridoTraduccionDirecta paginada en decimal (ej-09)', () => {
  const r9 = recorridoTraduccionDirecta(ej09)
  const html9 = renderRecorrido(r9)

  it('resultados de las cuatro referencias', () => {
    expect(r9.pasos!.map((p) => p.titulo)).toEqual([
      '135145 → 11241',
      '405707 → Fault (límite)',
      '270340 → 35844',
      '6032 → Fault (permiso)',
    ])
  })

  it('1. corta dividiendo', () => {
    const f = fotograma(html9, 0)
    expect(f).toContain(
      '1. Cortar 135145 dividiendo: cada segmento abarca 2^17 = 131072 y cada página 1024',
    )
    expect(f).toMatch(/135145 = <tspan[^>]*>1<\/tspan> × 131072 \+ <tspan[^>]*>4073<\/tspan>/)
    expect(f).toMatch(/4073 = <tspan[^>]*>3<\/tspan> × 1024 \+ <tspan[^>]*>1001<\/tspan>/)
    expect(f).not.toContain('tr-bit')
  })

  it('2. y 3. las dos tablas; 4. los cuatro chequeos', () => {
    const f = fotograma(html9, 0)
    expect(f).toContain('2. Buscar la fila del segmento 1')
    expect(f).toContain('>Límite<')
    expect(f).toContain('3. Tabla de páginas del segmento 1')
    expect(f).toContain('4. Chequeos de la MMU, en orden')
    expect(f).toContain('4073 ≤ 10295')
    expect(f).toContain('RWX permite ejecutar')
    expect(f).toContain('página 3 → frame 10')
    expect(f).toContain('10 × 1024 + 1001 = 11241')
    expect(r9.pasos![0].texto).toBe(
      'Pasa el límite (**4073 ≤ 10295**) y el segmento 1 es **RWX**, que permite ejecutar. La página **3** del segmento 1 está en el frame **10**: DF = 10 × 1024 + 1001 = **11241**.',
    )
  })

  it('con fault de límite, la tabla de páginas no se mira', () => {
    const f = fotograma(html9, 1)
    expect(f).toContain('12491 &gt; 12285 → segmentation fault')
    expect(f).toContain('tr-tabla-no')
    expect(f.match(/no se llega/g)).toHaveLength(2)
  })

  it('con fault de permiso, dice por qué', () => {
    expect(fotograma(html9, 3)).toContain('ejecutar en un segmento RW- → fault por permiso')
    expect(r9.pasos![3].texto).toContain('el segmento 0 es **RW-**: no permite ejecutar')
  })
})
