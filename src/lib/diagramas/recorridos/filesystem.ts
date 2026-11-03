/** Recorridos del tema Filesystem: métodos de asignación y tablas de archivos abiertos (ejemplos de la PPT de la cátedra). */
import { celdaM, encabezados } from '../primitivas-memoria'
import { arista } from '../primitivas-procesos'
import { panelLeyenda } from '../primitivas-t3'
import type { Paso, Recorrido, Variante } from '../recorrido'
import { texto } from '../svg'

// ── Métodos de asignación: el mismo volumen de 12 bloques, tres formas de ubicar main.c ──

const N_BLOQUES = 12
const OTROS = [0, 6, 10, 11]
const BW = 56
const BX = 24
const BY = 150

/** Contenido de cada bloque del volumen: los de main.c según el método, el resto libre u "otro". */
function volumen(main: Record<number, string>): Record<string, string> {
  const v: Record<string, string> = {}
  for (let i = 0; i < N_BLOQUES; i++) v[`b${i}`] = OTROS.includes(i) ? 'otro' : (main[i] ?? '')
  return v
}

const todos = (bloques: number[], clase: string) =>
  Object.fromEntries(bloques.map((b) => [`b${b}`, clase]))

function asignacion(): Recorrido {
  const inicio = (fcb: string[], main: Record<number, string>): Partial<Paso> => ({
    valores: {
      ...volumen(main),
      fcb1: fcb[0],
      fcb2: fcb[1],
      fcb3: fcb[2] ?? '',
      lect: '',
    },
  })
  const contigua: Variante = {
    nombre: 'Contigua',
    pasos: [
      {
        titulo: 'El FCB guarda inicio y cantidad.',
        texto:
          'main.c ocupa 4 bloques seguidos desde el 2. Con el bloque inicial y la cantidad alcanza para ubicar todo el archivo.',
        resaltar: ['fcb', 'b2', 'b3', 'b4', 'b5'],
        ...inicio(['main.c', 'bloque inicial: 2', 'cantidad: 4'], {
          2: 'A1',
          3: 'A2',
          4: 'A3',
          5: 'A4',
        }),
      },
      {
        titulo: 'Acceso directo al bloque A3.',
        texto:
          'Es una cuenta: `inicio + 2 = 4`. Se lee **solo** el bloque 4. Sirve igual de bien para acceso secuencial y directo.',
        resaltar: ['b4'],
        clases: { b4: 'rc-ok' },
        valores: { lect: 'lecturas para llegar a A3: 1' },
      },
      {
        titulo: 'Quiere crecer un bloque.',
        texto:
          'El siguiente, el 6, es de otro archivo. No se puede agrandar en el lugar: habría que mover el archivo entero a otro hueco.',
        resaltar: ['b5', 'b6'],
        clases: { b4: '', b6: 'rc-mal' },
        valores: { lect: '' },
      },
      {
        titulo: 'Fragmentación externa.',
        texto:
          'Hay 4 bloques libres (1, 7, 8 y 9), pero no hay 4 **contiguos**: un archivo de 4 bloques no entra aunque sobre espacio.',
        resaltar: ['b1', 'b7', 'b8', 'b9'],
        clases: { b6: '', ...todos([1, 7, 8, 9], 'rc-aviso') },
      },
    ],
  }
  const encadenada: Variante = {
    nombre: 'Encadenada',
    pasos: [
      {
        titulo: 'El FCB guarda inicio y fin.',
        texto:
          'Los bloques están en cualquier lugar. Cada uno guarda, al final, el número del siguiente: 3 → 7 → 9 → 1.',
        resaltar: ['fcb', 'b3', 'b7', 'b9', 'b1'],
        ...inicio(['main.c', 'bloque inicial: 3', 'bloque final: 1'], {
          3: 'A1→7',
          7: 'A2→9',
          9: 'A3→1',
          1: 'A4 fin',
        }),
      },
      {
        titulo: 'Acceso al bloque A3.',
        texto:
          'No hay cuenta posible: hay que leer A1 para saber que sigue el 7, y A2 para saber que sigue el 9. **3 lecturas**: malo para acceso directo.',
        resaltar: ['b3', 'b7', 'b9'],
        clases: { b3: 'rc-aviso', b7: 'rc-aviso', b9: 'rc-ok' },
        valores: { lect: 'lecturas para llegar a A3: 3' },
      },
      {
        titulo: 'Crecer es fácil.',
        texto:
          'Sirve **cualquier** bloque libre, por ejemplo el 4: el 1 pasa a apuntarlo y el FCB cambia el bloque final. No hay fragmentación externa.',
        resaltar: ['b1', 'b4', 'fcb'],
        clases: { b3: '', b7: '', b9: '', b4: 'rc-ok' },
        valores: { b1: 'A4→4', b4: 'A5 fin', fcb3: 'bloque final: 4', lect: '' },
      },
      {
        titulo: 'Se rompe el bloque 7.',
        texto:
          'Se pierde ese bloque **y la referencia a todos los que siguen**: 9, 1 y 4 quedan inalcanzables aunque estén sanos.',
        resaltar: ['b7', 'b9', 'b1', 'b4'],
        clases: { b4: 'rc-aviso', b7: 'rc-mal', b9: 'rc-aviso', b1: 'rc-aviso' },
      },
    ],
  }
  const indexada: Variante = {
    nombre: 'Indexada',
    pasos: [
      {
        titulo: 'El FCB guarda un índice.',
        texto:
          'Una entrada por bloque del archivo, en orden: A1 está en el 2, A2 en el 5, A3 en el 7 y A4 en el 8.',
        resaltar: ['fcb', 'b2', 'b5', 'b7', 'b8'],
        ...inicio(['main.c', 'índice: 2, 5, 7, 8'], { 2: 'A1', 5: 'A2', 7: 'A3', 8: 'A4' }),
      },
      {
        titulo: 'Acceso directo al bloque A3.',
        texto:
          'La tercera entrada del índice dice 7: se lee directo ese bloque, sin pasar por los anteriores.',
        resaltar: ['fcb', 'b7'],
        clases: { b7: 'rc-ok' },
        valores: { lect: 'lecturas para llegar a A3: 1' },
      },
      {
        titulo: 'Crecer.',
        texto:
          'Se toma cualquier libre (el 9) y se agrega al índice. El límite es el tamaño del índice: tiene una cantidad fija de entradas.',
        resaltar: ['fcb', 'b9'],
        clases: { b7: '', b9: 'rc-ok' },
        valores: { b9: 'A5', fcb2: 'índice: 2, 5, 7, 8, 9', lect: '' },
      },
      {
        titulo: 'Se rompe el bloque 5.',
        texto:
          'Se pierde **solo** ese bloque: el resto sigue en el índice. Pero si lo que se pierde es el índice, se pierde el archivo entero.',
        resaltar: ['b5', 'fcb'],
        clases: { b9: '', b5: 'rc-mal', fcb: 'rc-aviso' },
      },
    ],
  }
  return {
    ancho: 720,
    alto: 270,
    titulo: 'Métodos de asignación: contigua, encadenada e indexada',
    cuerpo: [
      panelLeyenda(24, 30, 300, 86, 'FCB', { el: 'fcb' }),
      texto(174, 58, '', { val: 'fcb1', clase: 'rm-resumen' }),
      texto(174, 80, '', { val: 'fcb2', clase: 'rm-mono' }),
      texto(174, 100, '', { val: 'fcb3', clase: 'rm-mono' }),
      texto(530, 64, 'Volumen de 12 bloques', { clase: 'rm-resumen' }),
      texto(530, 86, '"otro": bloques de otros archivos', { clase: 'rm-nota' }),
      encabezados(
        BX,
        BY - 8,
        BW,
        Array.from({ length: N_BLOQUES }, (_, i) => String(i)),
      ),
      ...Array.from({ length: N_BLOQUES }, (_, i) =>
        celdaM(`b${i}`, BX + i * BW + 2, BY, BW - 4, 44, OTROS.includes(i) ? 'otro' : '', {
          clase: OTROS.includes(i) ? 'rm-ref' : '',
        }),
      ),
      texto(360, 236, '', { val: 'lect', clase: 'rm-resumen' }),
    ],
    variantes: [contigua, encadenada, indexada],
  }
}

// ── Tablas de archivos abiertos: dos procesos con el mismo archivo ──

const COLS_P = [
  { k: 'arch', x: 28, w: 90, t: 'archivo' },
  { k: 'modo', x: 120, w: 50, t: 'modo' },
  { k: 'ptr', x: 172, w: 70, t: 'puntero' },
]
const COLS_G = [
  { k: 'nom', x: 340, w: 100, t: 'nombre' },
  { k: 'perm', x: 442, w: 60, t: 'permisos' },
  { k: 'cont', x: 504, w: 70, t: 'aperturas' },
  { k: 'lock', x: 576, w: 116, t: 'locks' },
]

function tablaProceso(p: string, y: number) {
  return [
    panelLeyenda(16, y, 236, 90, `Tabla del proceso ${p.toUpperCase()}`),
    ...COLS_P.map((c) => texto(c.x + c.w / 2, y + 32, c.t, { clase: 'rm-enc' })),
    ...COLS_P.map((c) => celdaM(`${p}-${c.k}`, c.x, y + 40, c.w, 24, '', { oculto: true })),
  ]
}

function abiertos(): Recorrido {
  const filaA = ['a-arch', 'a-modo', 'a-ptr']
  const filaB = ['b-arch', 'b-modo', 'b-ptr']
  const global = COLS_G.map((c) => `g-${c.k}`)
  return {
    ancho: 720,
    alto: 300,
    titulo: 'Tabla global y tablas por proceso de archivos abiertos',
    cuerpo: [
      ...tablaProceso('a', 40),
      ...tablaProceso('b', 180),
      panelLeyenda(326, 56, 380, 100, 'Tabla global (una en el sistema)'),
      ...COLS_G.map((c) => texto(c.x + c.w / 2, 88, c.t, { clase: 'rm-enc' })),
      ...COLS_G.map((c) => celdaM(`g-${c.k}`, c.x, 96, c.w, 24, '', { oculto: true })),
      arista('M244,92 L336,106', { el: 'f-a', punta: true, oculto: true }),
      arista('M244,232 L336,118', { el: 'f-b', punta: true, oculto: true }),
      texto(516, 220, '', { val: 'nota', clase: 'rm-resumen' }),
    ],
    pasos: [
      {
        titulo: 'A abre notas.txt para leer.',
        texto:
          'El SO verifica los permisos para el modo R. Como nadie lo tenía abierto, crea la entrada **global** (aperturas = 1) y una en la tabla de A con su puntero en 0.',
        resaltar: [...filaA, ...global, 'f-a'],
        mostrar: [...filaA, ...global, 'f-a'],
        valores: {
          'a-arch': 'notas.txt',
          'a-modo': 'R',
          'a-ptr': '0',
          'g-nom': 'notas.txt',
          'g-perm': 'rw-',
          'g-cont': '1',
          'g-lock': '—',
          nota: '',
        },
      },
      {
        titulo: 'B abre el mismo archivo para escribir.',
        texto:
          'Ya está en la tabla global: no se crea otra entrada, solo sube el contador a 2. B tiene **su propia** entrada, con modo W y puntero en 0.',
        resaltar: [...filaB, 'g-cont', 'f-b'],
        mostrar: [...filaB, 'f-b'],
        valores: { 'b-arch': 'notas.txt', 'b-modo': 'W', 'b-ptr': '0', 'g-cont': '2' },
      },
      {
        titulo: 'A lee 100 bytes.',
        texto:
          'Acceso secuencial: el SO avanza el puntero **de A** hasta 100. El de B no se mueve, porque el puntero vive en la tabla de cada proceso.',
        resaltar: ['a-ptr', 'b-ptr'],
        clases: { 'a-ptr': 'rc-ok' },
        valores: { 'a-ptr': '100' },
      },
      {
        titulo: 'B toma un lock exclusivo.',
        texto:
          'Sobre los bytes 0 a 99, para escribirlos. El lock se anota en la tabla **global**, porque lo tiene que ver cualquier proceso que use el archivo.',
        resaltar: ['g-lock', ...filaB],
        clases: { 'a-ptr': '', 'g-lock': 'rc-aviso' },
        valores: { 'g-lock': 'B: excl. 0–99' },
      },
      {
        titulo: 'A cierra el archivo.',
        texto:
          'Se borra la entrada de la tabla de A y el contador baja a 1. La entrada global sigue: B todavía lo usa.',
        resaltar: ['g-cont'],
        ocultar: [...filaA, 'f-a'],
        valores: { 'g-cont': '1' },
      },
      {
        titulo: 'B cierra el archivo.',
        texto:
          'Se liberan su lock y su entrada. El contador llega a 0: recién ahí se borra la entrada de la tabla global.',
        ocultar: [...filaB, 'f-b', ...global],
        clases: { 'g-lock': '' },
        valores: { nota: 'notas.txt ya no está abierto' },
      },
    ],
  }
}

export const recorridos: Record<string, Recorrido> = {
  'metodos-asignacion': asignacion(),
  'archivos-abiertos': abiertos(),
}
