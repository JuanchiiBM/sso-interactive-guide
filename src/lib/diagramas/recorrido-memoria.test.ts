import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoMemoria, type SpecRecorridoMemoria } from './recorrido-memoria'

const ej10: SpecRecorridoMemoria = {
  titulo: 'Segmentos de B con Best Fit',
  unidad: 'hexa',
  tabla: 'B',
  total: 0x10000,
  algoritmo: 'mejor',
  inicial: [
    { nombre: 'A.S2', inicio: 0x0000, tam: 0x2000 },
    { nombre: 'A.S0', inicio: 0x9000, tam: 0x2000 },
    { nombre: 'A.S1', inicio: 0xd000, tam: 0x3000 },
  ],
  operaciones: [
    { carga: 'B.S0', tam: 0x4000 },
    { carga: 'B.S1', tam: 0x2000 },
    { carga: 'B.S2', tam: 0x3000 },
    { libera: 'A' },
    {
      carga: 'B.S3',
      tam: 0x4000,
      compactar: [{ mover: 'B.S1', a: 0x0000 }],
      texto: '¿Por qué B.S1 y no B.S2? Mover B.S2 deja **dos huecos**.',
    },
  ],
}

const r = recorridoMemoria(ej10)
const html = renderRecorrido(r)
const pasos = r.pasos!

describe('recorridoMemoria', () => {
  it('un paso por estado (inicial + cada operación), cada uno con su fotograma', () => {
    expect(pasos).toHaveLength(6)
    pasos.forEach((p, i) => {
      expect(p.mostrar).toContain(`paso-${i}`)
      expect(p.ocultar).toEqual(pasos.map((_, k) => `paso-${k}`).filter((_, k) => k !== i))
      expect(html).toMatch(new RegExp(`data-el="paso-${i}"[^>]*data-rc-oculto`))
    })
  })

  it('títulos y textos explican el porqué', () => {
    expect(pasos.map((p) => p.titulo)).toEqual([
      'Estado inicial',
      'B.S0 (16 KiB)',
      'B.S1 (8 KiB)',
      'B.S2 (12 KiB)',
      'A termina',
      'B.S3 (16 KiB)',
    ])
    expect(pasos[2].texto).toContain('Best Fit elige el más chico donde entra')
    expect(pasos[2].texto).toContain('**B000h**')
    expect(pasos[5].texto).toContain('fragmentación externa')
    expect(pasos[5].texto).toContain('Mover B.S2 deja **dos huecos**')
  })

  it('chips de huecos candidatos con rango, tamaño y estado', () => {
    expect(html).toContain('[0000h, 2000h) 8 KiB ✗ no entra')
    expect(html).toContain('[B000h, D000h) 8 KiB ✓ elegido')
    expect(html).toContain('[6000h, 9000h) 12 KiB · entra, pero Best Fit no lo elige')
    expect(html).toContain('total libre 28 KiB ≥ 16 KiB → compactar')
  })

  it('barras antes y después con marcas en hexa y la flecha del movimiento', () => {
    expect(html).toContain('>Antes<')
    expect(html).toContain('>Después<')
    expect(html).toContain('>0000h<')
    expect(html).toContain('>10000h<')
    expect(html).toContain('B.S1: base B000h → 0000h')
    expect(html).toContain('rm-mov')
    expect(html).toContain('rm-nuevo')
    expect(html).not.toContain('rm-rejilla')
  })

  it('tabla de segmentos del proceso en cada paso', () => {
    expect(html).toContain('Tabla de segmentos de B en este paso')
    expect(html).toContain('0000h ← B000h')
    expect(html).toContain('9000h (nuevo)')
    expect(html).toContain('3000h (12 KiB)')
  })
})

describe('recorridoMemoria en decimal', () => {
  const html07 = renderRecorrido(
    recorridoMemoria({
      titulo: 'Best Fit',
      unidad: 'decimal',
      tabla: 'P1',
      total: 65536,
      algoritmo: 'mejor',
      inicial: [
        { nombre: 'P1.S0', inicio: 0, tam: 8192 },
        { nombre: 'P1.S2', inicio: 12288, tam: 14336 },
        { nombre: 'P2.S1', inicio: 28672, tam: 6144 },
        { nombre: 'P1.S1', inicio: 34816, tam: 8192 },
        { nombre: 'P2.S2', inicio: 49152, tam: 6144 },
        { nombre: 'P2.S0', inicio: 59392, tam: 6144 },
      ],
      operaciones: [{ carga: 'P1.S3', tam: 4096 }],
    }),
  )

  it('direcciones y tamaños en bytes, y el empate se marca', () => {
    expect(html07).toContain('[8192, 12288) 4096 B ✓ elegido')
    expect(html07).toContain('[55296, 59392) 4096 B ✓ también vale (empate)')
    expect(html07).toContain('8192 (nuevo)')
  })
})

describe('recorridoMemoria en KiB y en bloques', () => {
  const kib = renderRecorrido(
    recorridoMemoria({
      titulo: 'Particiones',
      unidad: 'KiB',
      total: 16384,
      algoritmo: 'primer',
      inicial: [
        { nombre: 'P1', inicio: 0, tam: 8192 },
        { nombre: 'P2', inicio: 9216, tam: 4096 },
      ],
      operaciones: [{ carga: 'P3', tam: 512 }],
    }),
  )
  const bloques = renderRecorrido(
    recorridoMemoria({
      titulo: 'Disco',
      unidad: 'bloques',
      total: 32,
      algoritmo: 'primer',
      inicial: [
        { nombre: 'X', inicio: 0, tam: 4 },
        { nombre: 'notas', inicio: 15, tam: 3 },
      ],
      operaciones: [{ carga: 'Y', tam: 1 }],
    }),
  )

  it('KiB: los números del enunciado, y MiB cuando da justo', () => {
    expect(kib).toContain('[8192, 9216) 1 MiB ✓ elegido')
    expect(kib).toContain('[13312, 16384) 3 MiB')
    expect(kib).toContain('>16384<')
    expect(kib).toContain('P3 (512 KiB)')
  })

  it('bloques: rango inclusivo bajo cada nombre, rejilla y marcas cada 4', () => {
    expect(bloques).toContain('>15–17<')
    expect(bloques).toContain('>0–3<')
    expect(bloques).toContain('[4, 15) 11 bloques ✓ elegido')
    expect(bloques).toContain('Y (1 bloque)')
    expect(bloques).toContain('rm-rejilla')
    expect(bloques).toContain('>28<')
  })
})

describe('recorridoMemoria: agrandar', () => {
  const r37 = recorridoMemoria({
    titulo: 'P2 crece',
    unidad: 'KiB',
    total: 16384,
    algoritmo: 'primer',
    inicial: [
      { nombre: 'P1', inicio: 0, tam: 8192 },
      { nombre: 'P2', inicio: 9216, tam: 4096 },
      { nombre: 'P3', inicio: 14336, tam: 2048 },
    ],
    operaciones: [
      { agranda: 'P2', tam: 1538, etiqueta: 'lo leído', compactar: [{ mover: 'P2', a: 8192 }] },
    ],
  })
  const html37 = renderRecorrido(r37)
  const r07 = recorridoMemoria({
    titulo: 'notas crece',
    unidad: 'bloques',
    total: 32,
    algoritmo: 'primer',
    inicial: [
      { nombre: 'X', inicio: 0, tam: 4 },
      { nombre: 'Y', inicio: 6, tam: 9 },
      { nombre: 'notas', inicio: 15, tam: 3 },
      { nombre: 'Z', inicio: 21, tam: 6 },
    ],
    operaciones: [
      {
        agranda: 'notas',
        tam: 8,
        titulo: 'extender notas 8 bloques',
        compactar: [{ mover: 'Z', a: 26 }],
      },
    ],
  })
  const html07 = renderRecorrido(r07)

  it('chips: el hueco de atrás, los que no están al lado y el total', () => {
    expect(html37).toContain('después de P2: [13312, 14336) 1 MiB ✗ faltan 514 KiB')
    expect(html37).toContain('[8192, 9216) 1 MiB ✗ no está al lado')
    expect(html37).toContain('total libre 2 MiB ≥ 1538 KiB → compactar')
    expect(html07).toContain('después de notas: [18, 21) 3 bloques ✗ faltan 5 bloques')
  })

  it('título y texto generados (o el título del autor)', () => {
    const p = r37.pasos![1]
    expect(p.titulo).toBe('P2 crece 1538 KiB')
    expect(p.texto).toBe(
      '**P2 crece 1538 KiB** (4096 → 5634 KiB). El hueco de al lado mide 1 MiB: no alcanza. Libres hay 2 MiB en 2 huecos: fragmentación externa → hay que **compactar**. Se mueve P2 (9216 → 8192) y crece ahí. Sobran **510 KiB**.',
    )
    expect(r07.pasos![1].titulo).toBe('extender notas 8 bloques')
    expect(r07.pasos![1].texto).toContain('Se mueve Z (21 → 26) y crece ahí. Encaja justo.')
  })

  it('después: la parte nueva aparte, con su rótulo, y la flecha del bloque movido', () => {
    expect(html37).toContain('>+1538 KiB<')
    expect(html37).toContain('>lo leído<')
    expect(html37).toContain('P2: base 9216 → 8192')
    expect(html07).toContain('>+8<')
    expect(html07).toContain('>18–25<')
    expect(html07).toContain('>15–17<')
    expect(html07).toContain('>26–31<')
  })
})

describe('recorridoMemoria: otras tablas', () => {
  const base37 = {
    titulo: 'P2 crece',
    unidad: 'KiB' as const,
    total: 16384,
    algoritmo: 'primer' as const,
    inicial: [
      { nombre: 'P1', inicio: 0, tam: 8192 },
      { nombre: 'P2', inicio: 9216, tam: 4096 },
      { nombre: 'P3', inicio: 14336, tam: 2048 },
    ],
    operaciones: [{ agranda: 'P2', tam: 1538, compactar: [{ mover: 'P2', a: 8192 }] }],
  }

  it('particiones: en orden de dirección, con huecos intercalados', () => {
    const h = renderRecorrido(recorridoMemoria({ ...base37, tabla: 'particiones' }))
    expect(h).toContain('Particiones en este paso (KiB)')
    expect(h).toMatch(/>Partición<.*>Base<.*>Tamaño</)
    expect(h).toMatch(
      />P2<[^]*>8192 ← 9216<[^]*>5634 ← 4096<[^]*>Hueco<[^]*>13826<[^]*>510<[^]*>P3</,
    )
  })

  it('todos: los segmentos de cada proceso', () => {
    const h = renderRecorrido(
      recorridoMemoria({
        titulo: 'C',
        unidad: 'KiB',
        tabla: 'todos',
        total: 1024,
        algoritmo: 'primer',
        inicial: [
          { nombre: 'PA.S0', inicio: 0, tam: 256 },
          { nombre: 'PB.S0', inicio: 384, tam: 128 },
        ],
        operaciones: [{ carga: 'PC.S0', tam: 100 }],
      }),
    )
    expect(h).toContain('Tablas de segmentos en este paso (KiB)')
    expect(h).toMatch(/>Proceso<.*>Seg<.*>Base<.*>Tamaño</)
    expect(h).toMatch(/>PC<[^<]*<[^]*?>0<[^]*?>256 \(nuevo\)</)
  })

  it('directorio: archivos con inicio y bloques, y los libres al final', () => {
    const h = renderRecorrido(
      recorridoMemoria({
        titulo: 'notas',
        unidad: 'bloques',
        tabla: 'directorio',
        total: 32,
        algoritmo: 'primer',
        inicial: [
          { nombre: 'notas', inicio: 15, tam: 3 },
          { nombre: 'Z', inicio: 21, tam: 6 },
        ],
        operaciones: [{ agranda: 'notas', tam: 8, compactar: [{ mover: 'Z', a: 26 }] }],
      }),
    )
    expect(h).toContain('Directorio (contigua) en este paso')
    expect(h).toMatch(/>Archivo<.*>Inicio<.*>Bloques</)
    expect(h).toContain('>11 ← 3<')
    expect(h).toContain('>26 ← 21<')
    expect(h).toContain('>Libres<')
  })
})

describe('recorridoMemoria: varios segmentos juntos', () => {
  const r = recorridoMemoria({
    titulo: 'C',
    unidad: 'KiB',
    tabla: 'todos',
    total: 1024,
    algoritmo: 'primer',
    inicial: [
      { nombre: 'PA.S0', inicio: 0, tam: 256 },
      { nombre: 'PB.S0', inicio: 384, tam: 128 },
      { nombre: 'PB.S1', inicio: 576, tam: 128 },
      { nombre: 'PA.S1', inicio: 768, tam: 256 },
    ],
    operaciones: [
      {
        carga: 'PC',
        segmentos: [
          { nombre: 'PC.S0', tam: 100 },
          { nombre: 'PC.S1', tam: 100 },
        ],
        compactar: [{ mover: 'PB.S1', a: 256 }],
      },
    ],
  })
  const html = renderRecorrido(r)

  it('chips: el hueco que admite uno solo en ámbar y el total del grupo', () => {
    expect(html).toContain('[256, 384) 128 KiB · entra uno solo')
    expect(html).toContain('[512, 576) 64 KiB ✗ no entra')
    expect(html).toContain('total libre 256 KiB ≥ 200 KiB → compactar')
  })

  it('título, texto y los dos segmentos nuevos en barra y tabla', () => {
    expect(r.pasos![1].titulo).toBe('PC (2 × 100 KiB)')
    expect(r.pasos![1].texto).toBe(
      '**PC pide dos segmentos de 100 KiB.** El hueco de 128 KiB admite uno solo y el otro no entra en ninguno (64 KiB y 64 KiB), aunque hay 256 KiB libres: fragmentación externa. Se compacta moviendo **un solo segmento**: PB.S1 pasa a 256 y los huecos se juntan en uno de 256 KiB, donde van PC.S0 en **512** y PC.S1 en **612**.',
    )
    expect(html).toContain('>512 (nuevo)<')
    expect(html).toContain('>612 (nuevo)<')
    expect(html).toContain('PB.S1: base 576 → 256')
    expect(html.match(/rm-p\d rm-nuevo/g)?.length).toBe(2)
  })
})

describe('recorridoMemoria: marca', () => {
  const r37 = recorridoMemoria({
    titulo: 'P2 crece',
    unidad: 'KiB',
    tabla: 'particiones',
    total: 16384,
    algoritmo: 'primer',
    inicial: [
      { nombre: 'P1', inicio: 0, tam: 8192 },
      { nombre: 'P2', inicio: 9216, tam: 4096 },
      { nombre: 'P3', inicio: 14336, tam: 2048 },
    ],
    operaciones: [
      { agranda: 'P2', tam: 1538, etiqueta: 'lo leído', compactar: [{ mover: 'P2', a: 8192 }] },
      {
        marca: 'P2',
        dl: 4096,
        df: 'DF 12288 KiB = 12.582.912',
        titulo: 'dónde empieza lo leído',
        texto: 'Lo leído va **al final**.',
        chips: [{ neutro: 'DL 4096 KiB (fin del P2 original)' }, { ok: 'DF = 8192 + 4096' }],
        completar: [
          ['Nueva base de P2', '8192 KiB'],
          ['DF del primer byte leído', '12582912 bytes', 'ok'],
        ],
      },
    ],
  })
  const html = renderRecorrido(r37)
  const marca = html.slice(html.indexOf('data-el="paso-2"'))

  it('título y texto del autor; chips del autor', () => {
    expect(r37.pasos![2]).toMatchObject({
      titulo: 'dónde empieza lo leído',
      texto: 'Lo leído va **al final**.',
    })
    expect(marca).toContain('rm-chip-neutro')
    expect(marca).toContain('>DL 4096 KiB (fin del P2 original)<')
    expect(marca).toContain('>DF = 8192 + 4096<')
  })

  it('barra del paso anterior, línea de la DF y regla de DL bajo el proceso', () => {
    expect(marca).not.toContain('>Antes<')
    expect(marca).toContain('>Memoria (KiB)<')
    expect(marca).toContain('>+1538 KiB<')
    expect(marca).toContain('rm-pin')
    expect(marca).toContain('>DF 12288 KiB = 12.582.912<')
    expect(marca).toContain('>Direcciones lógicas de P2<')
    expect(marca).toMatch(/>DL 0<[^]*>DL 4096<[^]*>5634</)
  })

  it('con `completar`, la tabla de lo que había que completar', () => {
    expect(marca).toContain('>Lo que había que completar<')
    expect(marca).toMatch(/rm-fila-ok[^>]*>[^]*?>DF del primer byte leído</)
  })

  it('sin `completar`, la tabla normal con el bloque marcado en verde', () => {
    const h = renderRecorrido(
      recorridoMemoria({
        titulo: 'Condiciones',
        unidad: 'MiB',
        tabla: 'particiones',
        total: 1024,
        algoritmo: 'primer',
        inicial: [{ nombre: 'P0', inicio: 0, tam: 500 }],
        operaciones: [
          {
            marca: 'P0',
            dl: 256,
            dlRotulo: 'DL 0FFFFFFFh',
            regla: '(base 0: DL = DF)',
            titulo: 'condición 1',
            texto: 'x',
          },
        ],
      }),
    )
    expect(h).toContain('rm-marcado')
    expect(h).toContain('>Direcciones lógicas de P0 (base 0: DL = DF)<')
    expect(h).toContain('>DL 0FFFFFFFh<')
    expect(h).toContain('>DF 256<')
    expect(h).toMatch(/rm-fila-ok[^>]*>[^]*?>P0</)
  })
})
