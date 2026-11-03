/** Recorridos del tema FAT y UFS: cadena de clusters, byte N por los punteros del inodo y links. */
import { celdaM } from '../primitivas-memoria'
import { arista, nodo } from '../primitivas-procesos'
import { panelLeyenda } from '../primitivas-t3'
import type { Paso, Recorrido, Variante } from '../recorrido'
import { texto } from '../svg'

// ── FAT: el directorio /home y la tabla de la PPT (clusters de 1 KiB) ──

const FAT_INICIAL = ['LIBRE', 'LIBRE', 'LIBRE', 'FIN', '9', '4', 'FIN', '6', 'ERROR', 'FIN']
const DIR = [
  { el: 'la', tipo: 'a', nombre: 'lala.txt', cl: '7', tam: '2000 B' },
  { el: 'tp', tipo: 'a', nombre: 'tp.c', cl: '5', tam: '3000 B' },
  { el: 'ut', tipo: 'd', nombre: 'utnso', cl: '3', tam: '0 B' },
]
const COLS = [
  { k: 'tipo', x: 28, w: 30, t: 'tipo' },
  { k: 'nombre', x: 60, w: 100, t: 'nombre' },
  { k: 'cl', x: 162, w: 50, t: '1er cl.' },
  { k: 'tam', x: 214, w: 74, t: 'tamaño' },
] as const

const reinicio = () => ({
  ...Object.fromEntries(FAT_INICIAL.map((v, i) => [`f${i}`, v])),
  ...Object.fromEntries(FAT_INICIAL.map((_, i) => [`c${i}`, String(i)])),
  'tp-tam': '3000 B',
  cad: '',
})

/** Un paso por cluster de la cadena: lo lee y mira su entrada en la FAT. */
function cadena(nombre: string, abrev: string, clusters: number[]): Paso[] {
  return clusters.map((c, k) => {
    const sig = FAT_INICIAL[c]
    const ultimo = sig === 'FIN'
    return {
      titulo: `Cluster ${c}.`,
      texto: ultimo
        ? `Se lee el cluster ${c}. \`FAT[${c}] = FIN\`: es el último cluster de ${nombre}.`
        : `Se lee el cluster ${c} (parte ${k + 1} del archivo). Para saber dónde sigue se consulta \`FAT[${c}] = ${sig}\`.`,
      resaltar: [`c${c}`, `f${c}`],
      clases: { [`c${c}`]: 'rc-ok', [`f${c}`]: ultimo ? 'rc-aviso' : 'rc-ok' },
      valores: {
        [`c${c}`]: `${c} · ${abrev} ${k + 1}`,
        cad: `${nombre}: ${clusters.slice(0, k + 1).join(' → ')}${ultimo ? ' → FIN' : ' → …'}`,
      },
    }
  })
}

function cadenaFat(): Recorrido {
  const lala: Variante = {
    nombre: 'lala.txt',
    pasos: [
      {
        titulo: 'La entrada de directorio.',
        texto:
          'De la ubicación, lo único que guarda la entrada de lala.txt es el **primer cluster**: el 7. El resto de la cadena está en la FAT.',
        resaltar: ['la-nombre', 'la-cl', 'la-tam'],
        valores: reinicio(),
      },
      ...cadena('lala.txt', 'lala', [7, 6]),
      {
        titulo: 'Control con el tamaño.',
        texto:
          '2000 B con clusters de 1 KiB son 2 clusters, como dio la cadena. El último usa 976 B: los 48 B que sobran son fragmentación interna.',
        resaltar: ['la-tam', 'c7', 'c6'],
      },
    ],
  }
  const tp: Variante = {
    nombre: 'tp.c',
    pasos: [
      {
        titulo: 'La entrada de directorio.',
        texto: 'tp.c empieza en el cluster 5 y mide 3000 B: van a ser 3 clusters.',
        resaltar: ['tp-nombre', 'tp-cl', 'tp-tam'],
        valores: reinicio(),
      },
      ...cadena('tp.c', 'tp', [5, 4, 9]),
      {
        titulo: 'Los clusters no tienen orden.',
        texto:
          'La cadena va para atrás y salta: 5 → 4 → 9. El 8 está marcado **ERROR** (dañado): ningún archivo lo usa.',
        resaltar: ['f8', 'c8'],
        clases: { f8: 'rc-mal' },
      },
    ],
  }
  const agrandar: Variante = {
    nombre: 'Agrandar tp.c',
    pasos: [
      {
        titulo: 'Hace falta un cluster más.',
        texto: 'Se escriben 1000 B al final de tp.c (5 → 4 → 9) y ya no entran en el cluster 9.',
        resaltar: ['tp-nombre', 'f5', 'f4', 'f9'],
        valores: { ...reinicio(), cad: 'tp.c: 5 → 4 → 9 → FIN' },
      },
      {
        titulo: 'Buscar uno libre.',
        texto:
          'FAT no tiene bitmap ni lista de libres: hay que **recorrer la tabla** buscando una entrada LIBRE. Supongamos que toma la 2.',
        resaltar: ['f0', 'f1', 'f2'],
        clases: { f0: 'rc-aviso', f1: 'rc-aviso', f2: 'rc-ok' },
      },
      {
        titulo: 'Encadenarlo.',
        texto:
          '`FAT[9]` pasa de FIN a 2 y `FAT[2]` pasa de LIBRE a FIN. Se actualizan también las copias de la FAT.',
        resaltar: ['f9', 'f2', 'c2'],
        clases: { f0: '', f1: '', f9: 'rc-ok' },
        valores: { f9: '2', f2: 'FIN', c2: '2 · tp 4', cad: 'tp.c: 5 → 4 → 9 → 2 → FIN' },
      },
      {
        titulo: 'Actualizar el tamaño.',
        texto:
          'No hay FCB: el tamaño vive en la **entrada de directorio**, así que se reescribe ahí (y la fecha de modificación).',
        resaltar: ['tp-tam'],
        clases: { 'tp-tam': 'rc-ok' },
        valores: { 'tp-tam': '4000 B' },
      },
    ],
  }
  return {
    ancho: 720,
    alto: 320,
    titulo: 'FAT: seguir la cadena de clusters desde la entrada de directorio',
    cuerpo: [
      panelLeyenda(16, 24, 286, 130, '/home'),
      ...COLS.map((c) => texto(c.x + c.w / 2, 58, c.t, { clase: 'rm-enc' })),
      ...DIR.flatMap((f, i) =>
        COLS.map((c) => celdaM(`${f.el}-${c.k}`, c.x, 66 + i * 26, c.w, 24, f[c.k])),
      ),
      texto(160, 186, 'clusters de 1 KiB', { clase: 'rm-nota' }),
      texto(397, 30, 'tabla FAT', { clase: 'rm-enc' }),
      ...FAT_INICIAL.flatMap((v, i) => [
        `<text class="rm-rotulo" x="352" y="${53 + i * 25}">${i}</text>`,
        celdaM(`f${i}`, 358, 40 + i * 25, 80, 23, v),
      ]),
      panelLeyenda(470, 24, 236, 200, 'Clusters de datos'),
      ...FAT_INICIAL.map((_, i) =>
        celdaM(`c${i}`, 484 + (i % 2) * 108, 44 + Math.floor(i / 2) * 35, 100, 28, String(i)),
      ),
      texto(588, 262, '', { val: 'cad', clase: 'rm-resumen' }),
    ],
    variantes: [lala, tp, agrandar],
  }
}

// ── UFS: qué puntero del inodo resuelve el byte N y cuántos accesos cuesta ──

const BLOQUE = 1024
const POR_BLOQUE = BLOQUE / 4
const PD = 4
const PUNTEROS = ['PD 0', 'PD 1', 'PD 2', 'PD 3', 'IS', 'ID', 'IT']

/** Bloque lógico, puntero del inodo y entrada a leer en cada nivel de indirección. */
function ubicarByte(n: number) {
  const bloque = Math.floor(n / BLOQUE)
  const offset = n % BLOQUE
  if (bloque < PD) return { bloque, offset, puntero: bloque, desde: 0, entradas: [] as number[] }
  let r = bloque - PD
  let desde = PD
  for (let nivel = 1; nivel <= 3; nivel++) {
    const cubre = POR_BLOQUE ** nivel
    if (r < cubre) {
      const entradas = Array.from(
        { length: nivel },
        (_, k) => Math.floor(r / POR_BLOQUE ** (nivel - 1 - k)) % POR_BLOQUE,
      )
      return { bloque, offset, puntero: PD + nivel - 1, desde, entradas }
    }
    r -= cubre
    desde += cubre
  }
  throw new Error(`byte ${n} fuera del archivo máximo`)
}

const RANGO = [
  'los PD cubren los bloques 0 a 3',
  'el IS cubre del 4 al 259 (256 bloques)',
  'el ID cubre del 260 al 65795 (256² bloques)',
  'el IT cubre del 65796 en adelante (256³ bloques)',
]

function varianteByte(nombre: string, n: number): Variante {
  const u = ubicarByte(n)
  const niveles = u.entradas.length
  const acc = (k: number) => `accesos a disco: ${k}`
  const pasos: Paso[] = [
    {
      titulo: `Byte ${n}.`,
      texto: `Bloque lógico = \`${n} div 1024 = ${u.bloque}\` y desplazamiento = \`${n} mod 1024 = ${u.offset}\`. Los bloques se numeran desde 0.`,
      valores: {
        calc: `byte ${n} → bloque lógico ${u.bloque}, desplazamiento ${u.offset}`,
        acc: acc(0),
        'n1-v': 'nivel 1',
        'n2-v': 'nivel 2',
        'n3-v': 'nivel 3',
        'dato-v': '',
      },
    },
    {
      titulo: '¿Qué puntero?',
      texto:
        niveles === 0
          ? `Como ${RANGO[0]}, lo resuelve el **${PUNTEROS[u.puntero]}** del inodo. El inodo ya está en memoria (archivo abierto): no cuenta como acceso.`
          : `Como ${RANGO[niveles]}, toca el **${PUNTEROS[u.puntero]}**. Dentro de su zona es el bloque \`${u.bloque} − ${u.desde} = ${u.bloque - u.desde}\`.`,
      resaltar: [`p${u.puntero}`],
      clases: { [`p${u.puntero}`]: 'rc-aviso' },
      mostrar: niveles === 0 ? [] : [`a-p${u.puntero}-n1`],
    },
  ]
  u.entradas.forEach((e, k) => {
    const resto = niveles - 1 - k
    const cuenta =
      resto === 0
        ? `\`${u.bloque - u.desde} mod 256 = ${e}\``
        : `\`${u.bloque - u.desde} div ${resto === 1 ? '256' : '256²'}${k > 0 ? ' mod 256' : ''} = ${e}\``
    pasos.push({
      titulo: `Bloque de punteros, nivel ${k + 1}.`,
      texto: `Se lee (acceso ${k + 1}) y se toma la entrada ${cuenta}, que apunta ${resto === 0 ? 'al bloque de datos' : `al bloque de punteros de nivel ${k + 2}`}.`,
      resaltar: [`n${k + 1}`, k === 0 ? `a-p${u.puntero}-n1` : `a-n${k}-n${k + 1}`],
      mostrar: resto === 0 ? [] : [`a-n${k + 1}-n${k + 2}`],
      clases: { [`n${k + 1}`]: 'rc-ok' },
      valores: { [`n${k + 1}-v`]: `nivel ${k + 1} · entrada ${e}`, acc: acc(k + 1) },
    })
  })
  const flechaDato = niveles === 0 ? `a-pd${u.puntero}-dato` : `a-n${niveles}-dato`
  pasos.push({
    titulo: 'El bloque de datos.',
    texto: `Se lee el bloque de datos (acceso ${niveles + 1}) y el byte está en el desplazamiento ${u.offset}. Total: **${niveles + 1} ${niveles ? 'accesos' : 'acceso'}** a disco.`,
    resaltar: ['dato', flechaDato],
    mostrar: [flechaDato],
    clases: { dato: 'rc-ok' },
    valores: { 'dato-v': `byte ${u.offset}`, acc: acc(niveles + 1) },
  })
  return { nombre, pasos }
}

function byteInodo(): Recorrido {
  const filaY = (k: number) => 76 + k * 28
  return {
    ancho: 720,
    alto: 320,
    titulo: 'UFS: qué puntero del inodo lleva al byte N y cuántos accesos cuesta',
    cuerpo: [
      texto(360, 22, '', { val: 'calc', clase: 'rm-resumen' }),
      panelLeyenda(16, 48, 140, 236, 'Inodo'),
      ...PUNTEROS.map((p, k) => celdaM(`p${k}`, 30, filaY(k) - 12, 112, 24, p)),
      nodo(280, 120, 120, 56, 'Punteros', 'nivel 1', { el: 'n1', val: 'n1-v' }),
      nodo(430, 120, 120, 56, 'Punteros', 'nivel 2', { el: 'n2', val: 'n2-v' }),
      nodo(580, 120, 120, 56, 'Punteros', 'nivel 3', { el: 'n3', val: 'n3-v' }),
      nodo(400, 250, 160, 50, 'Bloque de datos', '', { el: 'dato', val: 'dato-v' }),
      ...[4, 5, 6].map((k) =>
        arista(`M142,${filaY(k)} C160,${filaY(k)} 190,120 212,120`, {
          el: `a-p${k}-n1`,
          punta: true,
          oculto: true,
        }),
      ),
      arista('M340,120 L366,120', { el: 'a-n1-n2', punta: true, oculto: true }),
      arista('M490,120 L516,120', { el: 'a-n2-n3', punta: true, oculto: true }),
      ...[0, 1, 2, 3].map((k) =>
        arista(`M142,${filaY(k)} C220,${filaY(k)} 260,250 316,250`, {
          el: `a-pd${k}-dato`,
          punta: true,
          oculto: true,
        }),
      ),
      arista('M290,148 L350,224', { el: 'a-n1-dato', punta: true, oculto: true }),
      arista('M430,148 L410,222', { el: 'a-n2-dato', punta: true, oculto: true }),
      arista('M570,148 L465,224', { el: 'a-n3-dato', punta: true, oculto: true }),
      texto(630, 214, '4 PD + IS + ID + IT', { clase: 'rm-nota' }),
      texto(630, 232, 'bloque 1 KiB, puntero 4 B', { clase: 'rm-nota' }),
      texto(630, 250, '256 punteros por bloque', { clase: 'rm-nota' }),
      texto(400, 306, '', { val: 'acc', clase: 'rm-resumen' }),
    ],
    variantes: [
      varianteByte('Directo', 3000),
      varianteByte('Indirecto simple', 10000),
      varianteByte('Indirecto doble', 300000),
      varianteByte('Indirecto triple', 70000000),
    ],
  }
}

// ── Hard link vs soft link: el ejemplo /home/utnso/tp.c (inodo 20) de la PPT ──

const FILA = 26
const HOME_Y = 64

function links(): Recorrido {
  const fila = (el: string, y: number, nombre: string, inodo: string, oculto = false) =>
    celdaM(`${el}-n`, 36, y, 120, FILA - 2, nombre, { oculto }) +
    celdaM(`${el}-i`, 158, y, 60, FILA - 2, inodo, { oculto })
  const situacion: Paso = {
    titulo: 'Situación inicial.',
    texto:
      'La entrada `tp.c` de /home/utnso apunta al **inodo 20**, que tiene los atributos y los punteros a los bloques. Su contador de hard links vale 1.',
    resaltar: ['tp-n', 'tp-i', 'f-tp', 'i20'],
    valores: { 'i20-v': 'Reg · contador HL = 1' },
  }
  const soft: Variante = {
    nombre: 'Soft link',
    pasos: [
      situacion,
      {
        titulo: 'ln -s: un archivo nuevo.',
        texto:
          'Se crea **otro** archivo, de tipo symbolic link, con su propio inodo (el 33). La entrada `tp_v2.c` de /usr apunta a ese inodo.',
        resaltar: ['us-n', 'us-i', 'f-soft', 'i33'],
        mostrar: ['us-n', 'us-i', 'f-soft', 'i33'],
        valores: { 'us-i': '33' },
      },
      {
        titulo: 'Su dato es una ruta.',
        texto:
          'El primer puntero directo del inodo 33 apunta a un bloque que guarda `/home/utnso/tp.c`. El contador del inodo 20 **no cambia**.',
        resaltar: ['i33', 'f-blq', 'ruta'],
        mostrar: ['f-blq', 'ruta'],
      },
      {
        titulo: 'Abrir tp_v2.c.',
        texto:
          'Se lee el inodo 33, se lee el bloque con la ruta y se resuelve esa ruta desde la raíz hasta llegar al inodo 20: una lectura más que con un hard link.',
        resaltar: ['us-n', 'i33', 'ruta', 'f-resuelve', 'tp-n', 'i20'],
        mostrar: ['f-resuelve'],
      },
      {
        titulo: 'Borrar tp.c.',
        texto:
          'Se borra la entrada y el contador del 20 queda en 0: se liberan el inodo y sus bloques. El soft link sigue existiendo pero su ruta **no lleva a nada**.',
        resaltar: ['tp-n', 'i20', 'ruta'],
        valores: { 'tp-n': '(borrada)', 'tp-i': '', 'i20-v': 'liberado (HL = 0)' },
        clases: { 'tp-n': 'rc-mal', i20: 'rc-mal', ruta: 'rc-mal' },
      },
    ],
  }
  const hard: Variante = {
    nombre: 'Hard link',
    pasos: [
      situacion,
      {
        titulo: 'ln: otra entrada, el mismo inodo.',
        texto:
          'No se crea ningún archivo: solo una entrada `tp_v2.c` en /usr con el **mismo** número de inodo, el 20.',
        resaltar: ['us-n', 'us-i', 'f-hard', 'i20'],
        mostrar: ['us-n', 'us-i', 'f-hard'],
        valores: { 'us-i': '20' },
      },
      {
        titulo: 'El contador sube a 2.',
        texto:
          'El inodo no sabe **cuáles** entradas lo apuntan, solo **cuántas**. Ninguna de las dos es "la original": las dos valen lo mismo.',
        resaltar: ['i20'],
        valores: { 'i20-v': 'Reg · contador HL = 2' },
      },
      {
        titulo: 'Borrar tp.c.',
        texto:
          'Se borra la entrada y el contador baja a 1. Como no llegó a 0, el inodo y los bloques quedan: `tp_v2.c` sigue funcionando.',
        resaltar: ['tp-n', 'i20', 'us-n'],
        valores: { 'tp-n': '(borrada)', 'tp-i': '', 'i20-v': 'Reg · contador HL = 1' },
        clases: { 'tp-n': 'rc-mal', i20: 'rc-ok', 'us-n': 'rc-ok' },
      },
      {
        titulo: 'Borrar tp_v2.c.',
        texto:
          'Ahora el contador llega a 0: recién ahí se liberan el inodo 20 y sus bloques de datos.',
        resaltar: ['us-n', 'i20', 'datos'],
        valores: { 'us-n': '(borrada)', 'us-i': '', 'i20-v': 'liberado (HL = 0)' },
        clases: { 'us-n': 'rc-mal', i20: 'rc-mal', datos: 'rc-mal' },
      },
    ],
  }
  return {
    ancho: 720,
    alto: 300,
    titulo: 'Hard link y soft link: qué pasa al borrar el original',
    cuerpo: [
      panelLeyenda(24, 22, 210, 130, '/home/utnso'),
      texto(96, HOME_Y - 8, 'nombre', { clase: 'rm-enc' }),
      texto(188, HOME_Y - 8, 'inodo', { clase: 'rm-enc' }),
      fila('la', HOME_Y, 'lala.txt', '10'),
      fila('tp', HOME_Y + FILA, 'tp.c', '20'),
      fila('ut', HOME_Y + 2 * FILA, 'utnso', '25'),
      panelLeyenda(24, 196, 210, 70, '/usr'),
      fila('us', 220, 'tp_v2.c', '', true),
      nodo(420, 82, 170, 56, 'Inodo 20', '', { el: 'i20', val: 'i20-v' }),
      nodo(630, 82, 140, 56, 'Bloques', 'de tp.c', { el: 'datos' }),
      nodo(420, 232, 170, 56, 'Inodo 33', 'SL · contador HL = 1', { el: 'i33', oculto: true }),
      nodo(630, 232, 150, 56, 'Bloque de datos', '/home/utnso/tp.c', { el: 'ruta', oculto: true }),
      arista(`M218,${HOME_Y + FILA + 12} L333,82`, { el: 'f-tp', punta: true }),
      arista('M505,82 L558,82', { punta: true }),
      arista('M218,232 L333,232', { el: 'f-soft', punta: true, oculto: true }),
      arista('M218,232 L340,104', { el: 'f-hard', punta: true, oculto: true }),
      arista('M505,232 L553,232', { el: 'f-blq', punta: true, oculto: true }),
      arista('M630,204 C630,170 300,175 160,155', {
        el: 'f-resuelve',
        punta: true,
        oculto: true,
        etiqueta: 'resuelve la ruta',
        lx: 470,
        ly: 154,
      }),
    ],
    variantes: [soft, hard],
  }
}

export const recorridos: Record<string, Recorrido> = {
  'cadena-fat': cadenaFat(),
  'byte-inodo': byteInodo(),
  'hard-soft-link': links(),
}
