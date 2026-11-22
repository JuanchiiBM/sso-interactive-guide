import { describe, expect, it } from 'vitest'
import { bloqueSVG } from './bloques-svg'

const yaml = `
titulo: Segmentos de B con Best Fit
total: 0x10000
algoritmo: mejor
tabla: B
inicial:
  - { nombre: A.S2, inicio: 0x0000, tam: 0x2000 }
  - { nombre: A.S0, inicio: 0x9000, tam: 0x2000 }
operaciones:
  - { carga: B.S0, tam: 0x4000 }
  - { libera: A }
`

describe('bloque ```memoria', () => {
  it('lee el YAML (con hexa) y dibuja el recorrido', () => {
    const html = bloqueSVG('memoria', yaml)!
    expect(html).toContain('data-recorrido')
    expect(html).toContain('Tabla de segmentos de B en este paso')
    expect(html).toContain('>10000h<')
  })

  it('un YAML sin título o con un error de datos rompe el build', () => {
    expect(() => bloqueSVG('memoria', yaml.replace(/titulo:.*\n/, ''))).toThrow(/titulo/)
    expect(() => bloqueSVG('memoria', yaml.replace('libera: A', 'libera: Z'))).toThrow(/Z/)
  })
})

describe('bloque ```traduccion', () => {
  const yamlT = `
titulo: Tabla de A
total: 0x10000
bitsSegmento: 2
bitsOffset: 14
proceso: A
direcciones:
  - { dl: 0x51FA, df: 0xE1FA, tam: 0x3000 }
  - { dl: 0x0A98, df: 0x9A98, tam: 0x2000 }
`
  it('lee el YAML y dibuja el recorrido', () => {
    const html = bloqueSVG('traduccion', yamlT)!
    expect(html).toContain('data-recorrido')
    expect(html).toContain('DF E1FAh')
  })

  it('un campo faltante rompe el build', () => {
    expect(() => bloqueSVG('traduccion', yamlT.replace(/bitsOffset:.*\n/, ''))).toThrow(
      /bitsOffset/,
    )
  })

  const yamlD = `
sentido: directo
titulo: Escrituras
bitsSegmento: 2
bitsOffset: 16
acceso: escritura
segmentos:
  - { seg: 0, base: 0x00000, largo: 0x0ABCD, permisos: r }
direcciones:
  - { dl: 0x0BEEF }
`
  it('con sentido directo dibuja los chequeos de la MMU', () => {
    const html = bloqueSVG('traduccion', yamlD)!
    expect(html).toContain('data-recorrido')
    expect(html).toContain('BEEFh ≥ ABCDh → segmentation fault')
  })

  it('en el directo, la tabla o un sentido desconocido rompen el build', () => {
    expect(() => bloqueSVG('traduccion', yamlD.replace(/segmentos:\n.*\n/, ''))).toThrow(
      /segmentos/,
    )
    expect(() => bloqueSVG('traduccion', yamlD.replace('directo', 'directa'))).toThrow(/sentido/)
  })

  it('en el directo, sin bits la dirección viene como (seg, desp)', () => {
    const yaml03 = `
sentido: directo
titulo: Ej. 3
unidad: decimal
segmentos:
  - { seg: 2, base: 90, largo: 100 }
direcciones:
  - { seg: 2, desp: 500 }
`
    expect(bloqueSVG('traduccion', yaml03)).toContain('500 ≥ 100 → segmentation fault')
  })

  const yamlB = `
sentido: busqueda
titulo: DF a DL
bitsSegmento: 1
bitsPagina: 3
bitsOffset: 12
bitsFrame: 4
procesos:
  - pid: PID1
    segmentos:
      - { seg: 1, paginas: { 0: 5 } }
direcciones:
  - { df: 0x5111 }
`
  it('con sentido busqueda encuentra el frame y arma la DL', () => {
    expect(bloqueSVG('traduccion', yamlB)).toContain('= 8111h')
    expect(() => bloqueSVG('traduccion', yamlB.replace(/bitsFrame:.*\n/, ''))).toThrow(/bitsFrame/)
  })
})

describe('bloque ```fat', () => {
  const yamlF = `
titulo: c) Byte 12000
tabla: { 3: Fin de Archivo, 5: 10, 6: 8, 8: 3, 10: 6 }
inicio: 5
bloque: 8192
byte: 12000
`
  it('sigue la cadena hasta el bloque del byte', () => {
    expect(bloqueSVG('fat', yamlF)).toContain('FAT[5] = 10 (lógico 1): 8192–16383 · ✓ está acá')
    expect(() => bloqueSVG('fat', yamlF.replace(/inicio:.*\n/, ''))).toThrow(/inicio/)
  })
})

describe('bloque ```inodo', () => {
  const yamlI = `titulo: Leer del byte 10500 al 544767
bloque: 1024
puntero: 4
punteros: { directos: 10, simples: 1, dobles: 1 }
bytes: [10500, 544767]
`
  it('arma el recorrido por los punteros', () => {
    const html = bloqueSVG('inodo', yamlI)!
    expect(html).toContain('data-recorrido')
    expect(html).toContain('se leen 10 (522–531)')
  })

  it('rompe el build si falta un dato', () => {
    expect(() => bloqueSVG('inodo', yamlI.replace(/puntero: 4\n/, ''))).toThrow(/falta `puntero`/)
  })

  it('el PIT (más ancho) lleva in-ancho para scrollear en pantalla chica', () => {
    expect(bloqueSVG('inodo', yamlI)).not.toContain('in-ancho')
    const pit = yamlI
      .replace('dobles: 1 }', 'dobles: 1, triples: 1 }')
      .replace('bytes: [10500, 544767]', 'bloques: [0, 70000]')
    expect(bloqueSVG('inodo', pit)).toContain('class="diagrama recorrido in-ancho"')
  })
})

describe('bloque ```links', () => {
  const yaml = `
titulo: Links de /etc/fixture.txt
inicial: [{ ruta: /etc/fixture.txt, inodo: 5 }]
operaciones:
  - { ln: /etc/fixture.txt, a: /var/h-fixture.txt }
  - { lns: /etc/fixture.txt, a: /temp/s-fixture.txt, inodo: 6 }
`
  it('lee el YAML (inodos numéricos) y dibuja el recorrido', () => {
    const html = bloqueSVG('links', yaml)!
    expect(html).toContain('data-recorrido')
    expect(html).toContain('Inodo 6 · soft link')
  })

  it('un campo faltante o una operación imposible rompen el build', () => {
    expect(() => bloqueSVG('links', yaml.replace(/titulo:.*\n/, ''))).toThrow(/titulo/)
    expect(() => bloqueSVG('links', yaml + '  - { rm: /etc/otro.txt }\n')).toThrow(/no existe/)
  })
})

describe('bloque ```locks', () => {
  const yamlL = `
titulo: Locks obligatorios compartidos
cerrojo: obligatorio
modo: compartido
archivo: { nombre: f, contenido: A }
procesos:
  - { nombre: P1, codigo: ["open(f, read)", "var = '-'", "lock(f)", "read(f, var)", "print(var)", "unlock(f)"] }
  - { nombre: P2, codigo: ["open(f, read)", "var = '-'", "read(f, var)", "print(var)"] }
`
  it('corre los turnos y dibuja el cerrojo', () => {
    const svg = bloqueSVG('locks', yamlL)!
    expect(svg).toContain('>Cerrojo de f (obligatorio)<')
    expect(svg).toContain('read(f, var)  ✗ sin lock')
  })

  it('rompe el build con un campo que falta o un tipo de cerrojo inventado', () => {
    expect(() => bloqueSVG('locks', yamlL.replace(/modo:.*\n/, ''))).toThrow(/modo/)
    expect(() =>
      bloqueSVG('locks', yamlL.replace('cerrojo: obligatorio', 'cerrojo: opcional')),
    ).toThrow(/opcional/)
  })
})
