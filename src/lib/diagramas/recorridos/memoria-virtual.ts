/** Recorridos del tema Memoria virtual. Los números salen de memoria.ts (testeado). */
import { clockMejorado, conjuntoTrabajo, type MarcoUM } from '../memoria'
import { celdaM, encabezados, rotulo, tablaM } from '../primitivas-memoria'
import { arista, nodo } from '../primitivas-procesos'
import { panelLeyenda } from '../primitivas-t3'
import type { Paso, Recorrido } from '../recorrido'
import { recorridoReemplazo } from '../recorrido-reemplazo'
import { grupo, texto } from '../svg'

export const REFS_CLASE = [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2]
export const REFS_BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]

// ── Atención de un page fault (los 6 pasos de la cátedra) ──

const pageFault: Recorrido = {
  ancho: 720,
  alto: 330,
  titulo: 'Atención de un fallo de página, del Load que falla a la reejecución',
  cuerpo: [
    nodo(95, 70, 150, 54, 'Proceso P1', 'ejecuta  Load M', { el: 'proc', val: 'proc-v' }),
    nodo(330, 70, 170, 54, 'Tabla de páginas', 'pág 2 → P = 0', { el: 'tp', val: 'tp-v' }),
    nodo(590, 70, 170, 54, 'Sistema operativo', 'esperando', { el: 'so', val: 'so-v' }),
    nodo(590, 262, 170, 54, 'Disco (área de swap)', 'pág 2 guardada', {
      el: 'disco',
      val: 'disco-v',
    }),
    panelLeyenda(250, 196, 170, 112, 'Memoria principal'),
    celdaM('marco-7', 270, 216, 130, 26, 'marco 7 · otra'),
    celdaM('marco-8', 270, 248, 130, 26, 'marco 8 · libre'),
    celdaM('marco-9', 270, 280, 130, 26, 'marco 9 · otra'),
    nodo(95, 230, 150, 54, 'Estado de P1', 'Running', { el: 'estado', val: 'estado-v' }),
    arista('M170,70 L242,70', {
      el: 'f-ref',
      punta: true,
      etiqueta: 'referencia',
      lx: 206,
      ly: 58,
    }),
    arista('M415,62 L502,62', {
      el: 'f-pf',
      punta: true,
      oculto: true,
      etiqueta: 'page fault',
      lx: 458,
      ly: 50,
    }),
    arista('M590,97 L590,232', {
      el: 'f-pide',
      punta: true,
      oculto: true,
      etiqueta: 'pide la página (E/S)',
      lx: 650,
      ly: 170,
    }),
    arista('M505,262 L405,262', {
      el: 'f-carga',
      punta: true,
      oculto: true,
      etiqueta: 'carga',
      lx: 455,
      ly: 252,
    }),
    arista('M560,235 L560,100', {
      el: 'f-irq',
      punta: true,
      oculto: true,
      etiqueta: 'interrupción',
      lx: 520,
      ly: 170,
    }),
    arista('M502,82 L417,82', {
      el: 'f-act',
      punta: true,
      oculto: true,
      etiqueta: 'actualiza',
      lx: 458,
      ly: 100,
    }),
  ],
  pasos: [
    {
      titulo: 'Se referencia memoria.',
      texto:
        'P1 ejecuta `Load M`, que cae en la página 2. La MMU mira la tabla de páginas: el **bit de presencia está en 0**, así que la página no está en RAM.',
      resaltar: ['proc', 'f-ref', 'tp'],
      clases: { tp: 'rc-mal' },
    },
    {
      titulo: 'Interrupción por fallo de página.',
      texto:
        'La MMU lanza el **page fault** (una excepción de tipo fallo) y el SO toma el control. **Bloquea a P1**; mientras tanto otro proceso puede usar la CPU.',
      resaltar: ['tp', 'f-pf', 'so', 'estado'],
      mostrar: ['f-pf'],
      valores: { 'so-v': 'atiende el PF', 'estado-v': 'Blocked', 'proc-v': 'detenido' },
      clases: { estado: 'rc-aviso' },
    },
    {
      titulo: 'Solicita la página.',
      texto:
        'El SO decide en qué marco ponerla (acá hay uno libre, el 8) y pide la página al disco: es una **E/S**, la parte lenta.',
      resaltar: ['so', 'f-pide', 'disco', 'marco-8'],
      ocultar: ['f-pf'],
      mostrar: ['f-pide'],
      valores: { 'so-v': 'elige el marco 8', 'disco-v': 'leyendo pág 2…' },
    },
    {
      titulo: 'Se carga y avisa.',
      texto:
        'La página queda en el marco 8 y el disco produce una **interrupción** de fin de E/S para que el SO retome el control.',
      resaltar: ['disco', 'f-carga', 'marco-8', 'f-irq', 'so'],
      ocultar: ['f-pide'],
      mostrar: ['f-carga', 'f-irq'],
      valores: { 'marco-8': 'marco 8 · pág 2', 'disco-v': 'terminó', 'so-v': 'retoma el control' },
      clases: { 'marco-8': 'rc-ok' },
    },
    {
      titulo: 'El SO atiende la interrupción.',
      texto:
        'Actualiza la tabla de páginas (página 2 → marco 8, **P = 1**) y **desbloquea** a P1, que pasa a Ready. Todavía no ejecuta.',
      resaltar: ['so', 'f-act', 'tp', 'estado'],
      ocultar: ['f-carga', 'f-irq'],
      mostrar: ['f-act'],
      valores: {
        'tp-v': 'pág 2 → marco 8 · P = 1',
        'estado-v': 'Ready',
        'so-v': 'actualizó la tabla',
      },
      clases: { tp: 'rc-ok', estado: '' },
    },
    {
      titulo: 'Se reejecuta la instrucción.',
      texto:
        'Cuando el planificador le vuelve a dar la CPU, P1 ejecuta **otra vez** el `Load M` que falló. Ahora la página está: son los 2 accesos a memoria de siempre.',
      resaltar: ['proc', 'f-ref', 'tp', 'marco-8', 'estado'],
      ocultar: ['f-act'],
      valores: { 'proc-v': 'reejecuta  Load M', 'estado-v': 'Running', 'so-v': 'esperando' },
      clases: { estado: 'rc-ok' },
    },
  ],
}

// ── Los tres casos de una referencia: acierto, PF con marco libre, PF con víctima modificada ──

const TP_INICIAL = [
  ['5', '1', '1'],
  ['14', '0', '0'],
  ['3', '0', '0'],
  ['1', '1', '1'],
  ['13', '0', '0'],
  ['9', '0', '0'],
]
const TP_X = 70
const TP_Y = 104
const valoresTP = (filas: string[][]) =>
  Object.fromEntries(filas.flatMap((f, i) => f.map((v, j) => [`tp-${i}-${j}`, v])))

const contadores = (mem: number, disco: number) => ({
  'c-mem': `accesos a memoria: ${mem}`,
  'c-disco': `accesos a disco: ${disco}`,
})

const casosTabla: Recorrido = {
  ancho: 720,
  alto: 340,
  titulo: 'Tabla de páginas con bit de presencia y de modificado: los tres casos de una referencia',
  cuerpo: [
    texto(30, 30, 'DL', { clase: 'rm-rotulo' }),
    celdaM('dl', 40, 16, 120, 28, '(3, 214)'),
    texto(140, 80, 'Tabla de páginas', { clase: 'rs-titulo' }),
    encabezados(TP_X, 96, 60, ['marco', 'P', 'M']),
    ...TP_INICIAL.map((_, i) => rotulo(TP_X - 8, TP_Y + i * 30 + 14, `pág ${i}`)),
    tablaM('tp', TP_X, TP_Y, 60, 30, TP_INICIAL),
    panelLeyenda(300, 70, 170, 220, 'Memoria real'),
    celdaM('mr-1', 320, 92, 130, 28, 'marco 1 · pág 3'),
    celdaM('mr-5', 320, 126, 130, 28, 'marco 5 · pág 0'),
    celdaM('mr-8', 320, 160, 130, 28, 'marco 8 · libre'),
    texto(385, 214, 'los demás marcos', { clase: 'rm-nota' }),
    texto(385, 230, 'son de otros procesos', { clase: 'rm-nota' }),
    panelLeyenda(510, 70, 190, 220, 'Memoria virtual (disco)'),
    celdaM('mv-0', 530, 110, 150, 28, 'pág 0 (vieja)'),
    celdaM('mv-2', 530, 160, 150, 28, 'pág 2'),
    texto(360, 316, '', { val: 'c-mem', clase: 'rm-resumen' }),
    texto(560, 316, '', { val: 'c-disco', clase: 'rm-resumen' }),
  ],
  variantes: [
    {
      nombre: 'Acierto',
      pasos: [
        {
          titulo: 'DL (3, 214).',
          texto: 'La dirección lógica dice página 3, desplazamiento 214.',
          resaltar: ['dl'],
          valores: {
            dl: '(3, 214)',
            ...valoresTP(TP_INICIAL),
            ...contadores(0, 0),
            'mr-8': 'marco 8 · libre',
          },
        },
        {
          titulo: 'Lee la tabla.',
          texto:
            'La fila 3 tiene **P = 1**: la página está en el marco 1. Leer la tabla, que está en RAM, ya es un acceso a memoria.',
          resaltar: ['tp-3-0', 'tp-3-1', 'tp-3-2'],
          clases: { 'tp-3-1': 'rc-ok' },
          valores: contadores(1, 0),
        },
        {
          titulo: 'Accede al dato.',
          texto:
            'La DF es (1, 214): el desplazamiento se copia tal cual. **2 accesos a memoria** y ninguno a disco: es el caso normal.',
          resaltar: ['tp-3-0', 'mr-1'],
          clases: { 'mr-1': 'rc-ok' },
          valores: contadores(2, 0),
        },
      ],
    },
    {
      nombre: 'PF con marco libre',
      pasos: [
        {
          titulo: 'DL (2, 57).',
          texto: 'Página 2, desplazamiento 57.',
          resaltar: ['dl'],
          valores: {
            dl: '(2, 57)',
            ...valoresTP(TP_INICIAL),
            ...contadores(0, 0),
            'mr-8': 'marco 8 · libre',
          },
        },
        {
          titulo: 'P = 0: page fault.',
          texto:
            'La fila 2 dice marco 3, pero con **P = 0 ese número no vale** (es lo que quedó de antes). La página está en disco: page fault.',
          resaltar: ['tp-2-0', 'tp-2-1', 'tp-2-2'],
          clases: { 'tp-2-0': 'rc-mal', 'tp-2-1': 'rc-mal' },
          valores: contadores(1, 0),
        },
        {
          titulo: 'Trae la página.',
          texto:
            'Hay un marco libre, el 8: el SO lee la página 2 del disco ahí. **Un acceso a disco.**',
          resaltar: ['mv-2', 'mr-8'],
          valores: { 'mr-8': 'marco 8 · pág 2', ...contadores(2, 1) },
          clases: { 'mr-8': 'rc-ok' },
        },
        {
          titulo: 'Actualiza la tabla.',
          texto: 'La fila 2 pasa a marco 8 con P = 1 (otro acceso a memoria, para escribirla).',
          resaltar: ['tp-2-0', 'tp-2-1', 'tp-2-2'],
          valores: { 'tp-2-0': '8', 'tp-2-1': '1', ...contadores(3, 1) },
          clases: { 'tp-2-0': 'rc-ok', 'tp-2-1': 'rc-ok' },
        },
        {
          titulo: 'Reejecuta.',
          texto:
            'Se vuelve a ejecutar la instrucción: DF (8, 57), con los 2 accesos de un acierto.',
          resaltar: ['tp-2-0', 'mr-8'],
          valores: contadores(5, 1),
        },
      ],
    },
    {
      nombre: 'PF sin marco libre',
      pasos: [
        {
          titulo: 'DL (2, 57), sin lugar.',
          texto:
            'Otra vez la página 2 con P = 0, pero ahora **no hay marcos libres**: hay que sacar una página del proceso.',
          resaltar: ['dl', 'tp-2-1', 'mr-8'],
          valores: {
            dl: '(2, 57)',
            ...valoresTP(TP_INICIAL),
            ...contadores(1, 0),
            'mr-8': 'marco 8 · ocupado',
          },
          clases: { 'tp-2-1': 'rc-mal' },
        },
        {
          titulo: 'Víctima modificada.',
          texto:
            'El algoritmo de reemplazo elige la página 0 (marco 5). Tiene **M = 1**: su copia en disco está vieja, así que primero hay que **escribirla**. Primer acceso a disco.',
          resaltar: ['tp-0-0', 'tp-0-1', 'tp-0-2', 'mr-5', 'mv-0'],
          clases: { 'tp-0-2': 'rc-aviso', 'mv-0': 'rc-aviso' },
          valores: { 'mv-0': 'pág 0 (actualizada)', ...contadores(1, 1) },
        },
        {
          titulo: 'Lee la página 2.',
          texto:
            'Ahora sí, lee la página 2 del disco en el marco 5. **Segundo acceso a disco**: escritura + lectura.',
          resaltar: ['mv-2', 'mr-5'],
          valores: { 'mr-5': 'marco 5 · pág 2', ...contadores(1, 2) },
          clases: { 'mr-5': 'rc-ok', 'mv-0': '' },
        },
        {
          titulo: 'Actualiza la tabla.',
          texto:
            'La página 0 queda con P = 0; la 2 pasa a marco 5 con P = 1 y M = 0 (recién leída, todavía igual al disco).',
          resaltar: ['tp-0-1', 'tp-2-0', 'tp-2-1', 'tp-2-2'],
          valores: {
            'tp-0-1': '0',
            'tp-0-2': '0',
            'tp-2-0': '5',
            'tp-2-1': '1',
            ...contadores(2, 2),
          },
          clases: { 'tp-0-2': '', 'tp-2-0': 'rc-ok', 'tp-2-1': 'rc-ok' },
        },
        {
          titulo: 'Si la víctima no estaba modificada…',
          texto:
            '…alcanzaba con poner su P en 0: la copia del disco ya estaba al día. Por eso conviene una víctima con **M = 0**: ahorra una escritura.',
          resaltar: ['tp-0-2', 'mv-0'],
        },
      ],
    },
  ],
}

// ── TLB: acierto y fallo ──

const tlb: Recorrido = {
  ancho: 720,
  alto: 310,
  titulo: 'Traducción con TLB: acierto y fallo',
  cuerpo: [
    texto(30, 34, 'DL', { clase: 'rm-rotulo' }),
    celdaM('dl', 40, 20, 120, 28, '(3, 0x1F0)'),
    panelLeyenda(200, 16, 180, 140, 'TLB (en la MMU)'),
    encabezados(225, 48, 65, ['pág', 'marco']),
    tablaM('tlb', 225, 56, 65, 26, [
      ['3', '1'],
      ['7', '4'],
      ['0', '5'],
    ]),
    panelLeyenda(430, 16, 270, 200, 'Memoria principal'),
    texto(490, 48, 'tabla de páginas', { clase: 'rs-titulo' }),
    encabezados(455, 66, 65, ['pág', 'marco']),
    tablaM('tp', 455, 74, 65, 24, [
      ['2', '6'],
      ['3', '1'],
      ['4', '9'],
    ]),
    celdaM('dato', 600, 120, 90, 28, 'dato'),
    nodo(110, 250, 170, 50, 'Dirección física', '—', { el: 'df', val: 'df-v' }),
    arista('M160,34 L198,48', { el: 'f-tlb', punta: true }),
    arista('M380,110 L452,110', {
      el: 'f-tp',
      punta: true,
      oculto: true,
      etiqueta: 'miss',
      lx: 416,
      ly: 100,
    }),
    arista('M290,160 L180,222', {
      el: 'f-hit',
      punta: true,
      oculto: true,
      etiqueta: 'marco',
      lx: 250,
      ly: 200,
    }),
    texto(560, 290, '', { val: 'c-mem', clase: 'rm-resumen' }),
  ],
  variantes: [
    {
      nombre: 'Acierto (hit)',
      pasos: [
        {
          titulo: 'DL (3, 0x1F0).',
          texto: 'Antes de ir a la tabla de páginas, la MMU busca la página 3 en la TLB.',
          resaltar: ['dl', 'f-tlb'],
          valores: { dl: '(3, 0x1F0)', 'df-v': '—', 'c-mem': 'accesos a memoria: 0' },
        },
        {
          titulo: 'Búsqueda por contenido.',
          texto:
            'La TLB no se indexa: compara la página con **todas** las entradas a la vez. La 3 está, con el marco 1: **TLB hit**, sin acceso a memoria.',
          resaltar: ['tlb-0-0', 'tlb-0-1', 'f-hit', 'df'],
          mostrar: ['f-hit'],
          clases: { 'tlb-0-0': 'rc-ok', 'tlb-0-1': 'rc-ok' },
          valores: { 'df-v': '(1, 0x1F0)' },
        },
        {
          titulo: 'Un solo acceso.',
          texto:
            'Con la DF se lee el dato: **1 acceso a memoria** en lugar de 2. Esa es toda la ganancia de la TLB.',
          resaltar: ['df', 'dato'],
          valores: { 'c-mem': 'accesos a memoria: 1' },
          clases: { dato: 'rc-ok' },
        },
      ],
    },
    {
      nombre: 'Fallo (miss)',
      pasos: [
        {
          titulo: 'DL (2, 0x1F0).',
          texto: 'Ahora la página 2. La MMU la busca primero en la TLB.',
          resaltar: ['dl', 'f-tlb'],
          valores: { dl: '(2, 0x1F0)', 'df-v': '—', 'c-mem': 'accesos a memoria: 0' },
        },
        {
          titulo: 'TLB miss.',
          texto:
            'No hay entrada para la 2. El tiempo de buscar en la TLB se perdió: hay que ir a la tabla de páginas.',
          resaltar: ['tlb-0-0', 'tlb-1-0', 'tlb-2-0', 'f-tp'],
          mostrar: ['f-tp'],
          clases: { 'tlb-0-0': 'rc-mal', 'tlb-1-0': 'rc-mal', 'tlb-2-0': 'rc-mal' },
        },
        {
          titulo: 'Tabla de páginas.',
          texto:
            'Lee la tabla en RAM (1 acceso): página 2 → marco 6. Si tuviera P = 0 acá recién aparecería el **page fault**.',
          resaltar: ['tp-0-0', 'tp-0-1'],
          clases: {
            'tp-0-0': 'rc-ok',
            'tp-0-1': 'rc-ok',
            'tlb-0-0': '',
            'tlb-1-0': '',
            'tlb-2-0': '',
          },
          valores: { 'c-mem': 'accesos a memoria: 1' },
        },
        {
          titulo: 'Carga la entrada en la TLB.',
          texto:
            'Guarda la traducción (2 → 6) en la TLB, reemplazando una entrada vieja: la próxima referencia a la página 2 va a ser un hit.',
          resaltar: ['tlb-2-0', 'tlb-2-1'],
          valores: { 'tlb-2-0': '2', 'tlb-2-1': '6' },
          clases: { 'tlb-2-0': 'rc-ok', 'tlb-2-1': 'rc-ok' },
        },
        {
          titulo: 'Accede al dato.',
          texto:
            'DF (6, 0x1F0): **2 accesos a memoria**, igual que sin TLB, más el tiempo perdido en la TLB.',
          resaltar: ['df', 'dato', 'f-hit'],
          mostrar: ['f-hit'],
          valores: { 'df-v': '(6, 0x1F0)', 'c-mem': 'accesos a memoria: 2' },
          clases: { dato: 'rc-ok' },
        },
      ],
    },
  ],
}

// ── Paginación jerárquica (dos niveles) ──

const jerarquica: Recorrido = {
  ancho: 720,
  alto: 300,
  titulo: 'Paginación jerárquica: la tabla externa apunta a pedazos de la tabla de páginas',
  cuerpo: [
    texto(30, 34, 'DL', { clase: 'rm-rotulo' }),
    celdaM('dl-1', 40, 20, 110, 28, '10 bits: 2'),
    celdaM('dl-2', 150, 20, 120, 28, '42 bits: 5'),
    celdaM('dl-3', 270, 20, 110, 28, '12 bits: 0x0A4'),
    panelLeyenda(30, 90, 170, 190, 'Tabla externa'),
    tablaM('ext', 60, 116, 110, 26, [
      ['0 → tabla A'],
      ['1 → tabla B'],
      ['2 → tabla C'],
      ['3 → (en disco)'],
    ]),
    panelLeyenda(250, 90, 190, 190, 'Tabla de páginas C'),
    tablaM('int', 280, 116, 130, 26, [
      ['4 → marco 100'],
      ['5 → marco 708'],
      ['6 → marco 929'],
      ['7 → P = 0'],
    ]),
    panelLeyenda(490, 90, 210, 190, 'Memoria real'),
    celdaM('marco', 520, 150, 150, 32, 'marco 708'),
    celdaM('dato', 520, 196, 150, 32, 'dato (+0x0A4)'),
    arista('M95,48 L95,112', { el: 'f-1', punta: true }),
    arista('M170,181 L248,181', { el: 'f-2', punta: true, oculto: true }),
    arista('M410,155 L518,165', { el: 'f-3', punta: true, oculto: true }),
    texto(360, 292, '', { val: 'c-mem', clase: 'rm-resumen' }),
  ],
  pasos: [
    {
      titulo: 'La DL tiene tres campos.',
      texto:
        'Con páginas de 4 KiB y direcciones de 64 bits, el número de página (52 bits) se parte en dos: 10 bits para la tabla externa y 42 para la de páginas.',
      resaltar: ['dl-1', 'dl-2', 'dl-3'],
      valores: { 'c-mem': 'accesos a memoria: 0' },
    },
    {
      titulo: 'Tabla externa.',
      texto:
        'Con los primeros 10 bits (2) se lee la tabla externa, que **siempre está en RAM**: dice dónde está el pedazo C de la tabla de páginas.',
      resaltar: ['dl-1', 'f-1', 'ext-2-0'],
      clases: { 'ext-2-0': 'rc-ok' },
      valores: { 'c-mem': 'accesos a memoria: 1' },
    },
    {
      titulo: 'Tabla de páginas.',
      texto:
        'Con los 42 bits siguientes (5) se lee la entrada de ese pedazo: marco 708. Si el pedazo estuviera en disco, habría **un page fault solo por la tabla**.',
      resaltar: ['dl-2', 'f-2', 'int-1-0', 'ext-2-0'],
      mostrar: ['f-2'],
      clases: { 'int-1-0': 'rc-ok' },
      valores: { 'c-mem': 'accesos a memoria: 2' },
    },
    {
      titulo: 'El dato.',
      texto:
        'Marco 708 + desplazamiento 0x0A4. Con dos niveles son **3 accesos a memoria**: niveles + 1. Lo que se gana es que de la tabla solo están en RAM los pedazos que se usan.',
      resaltar: ['dl-3', 'f-3', 'marco', 'dato'],
      mostrar: ['f-3'],
      clases: { dato: 'rc-ok' },
      valores: { 'c-mem': 'accesos a memoria: 3 (niveles + 1)' },
    },
  ],
}

// ── Tabla de páginas invertida: búsqueda secuencial y con hash ──

const INVERTIDA = [
  ['1', 'P2', '–'],
  ['2', 'P2', '4'],
  ['3', 'P1', '–'],
  ['0', 'P1', '–'],
  ['2', 'P5', '–'],
  ['4', 'P1', '–'],
  ['1', 'P1', '–'],
  ['0', 'P3', '–'],
]
const invertida: Recorrido = {
  ancho: 720,
  alto: 330,
  titulo: 'Tabla de páginas invertida: buscar (página 2, P5)',
  cuerpo: [
    texto(30, 34, 'Busca', { clase: 'rm-rotulo' }),
    celdaM('busca', 40, 20, 150, 28, '(pág 2, P5)'),
    nodo(110, 120, 150, 50, 'Hash', 'h(2, P5) = 1', { el: 'hash', val: 'hash-v', oculto: true }),
    texto(330, 64, 'una entrada por marco', { clase: 'rm-nota' }),
    encabezados(300, 82, 70, ['pág', 'PID', 'PTR']),
    ...INVERTIDA.map((_, i) => rotulo(292, 104 + i * 26, `marco ${i}`)),
    tablaM('inv', 300, 90, 70, 26, INVERTIDA),
    nodo(600, 160, 170, 50, 'Dirección física', '—', { el: 'df', val: 'df-v' }),
    arista('M186,120 L298,118', { el: 'f-h', punta: true, oculto: true }),
    arista('M512,128 C560,150 560,190 512,207', {
      el: 'f-ptr',
      punta: true,
      oculto: true,
      etiqueta: 'PTR',
      lx: 568,
      ly: 170,
    }),
  ],
  variantes: [
    {
      nombre: 'Búsqueda secuencial',
      pasos: [
        {
          titulo: 'Se busca el par.',
          texto:
            'La tabla tiene **una entrada por marco**, para todos los procesos. No se puede indexar por página: hay que buscar el par (página, PID).',
          resaltar: ['busca'],
          valores: { 'df-v': '—' },
        },
        {
          titulo: 'Marco 0.',
          texto: 'Página 1: no es.',
          resaltar: ['inv-0-0', 'inv-0-1'],
          clases: { 'inv-0-0': 'rc-mal' },
        },
        {
          titulo: 'Marco 1.',
          texto: 'La página coincide (2), pero es de **P2**: hay que comparar también el PID.',
          resaltar: ['inv-1-0', 'inv-1-1'],
          clases: { 'inv-0-0': '', 'inv-1-0': 'rc-ok', 'inv-1-1': 'rc-mal' },
        },
        {
          titulo: 'Marcos 2 y 3.',
          texto: 'Páginas 3 y 0: no son.',
          resaltar: ['inv-2-0', 'inv-3-0'],
          clases: { 'inv-1-0': '', 'inv-1-1': '', 'inv-2-0': 'rc-mal', 'inv-3-0': 'rc-mal' },
        },
        {
          titulo: 'Marco 4: está.',
          texto:
            'Página 2 de P5. **El índice donde aparece es el número de marco**: DF = (4, desplazamiento). Si llegara al final sin encontrarla, sería page fault.',
          resaltar: ['inv-4-0', 'inv-4-1', 'df'],
          clases: { 'inv-2-0': '', 'inv-3-0': '', 'inv-4-0': 'rc-ok', 'inv-4-1': 'rc-ok' },
          valores: { 'df-v': '(4, desplazamiento)' },
        },
      ],
    },
    {
      nombre: 'Con hash y colisión',
      pasos: [
        {
          titulo: 'Hash del par.',
          texto:
            'En lugar de recorrer, una función de hash sobre (página, PID) da directamente una entrada: la 1.',
          resaltar: ['busca', 'hash', 'f-h'],
          mostrar: ['hash', 'f-h'],
          valores: { 'df-v': '—' },
        },
        {
          titulo: 'Colisión.',
          texto:
            'En la entrada 1 está (2, P2): otro par dio el mismo hash. La columna **PTR** encadena las colisiones: apunta a la 4.',
          resaltar: ['inv-1-0', 'inv-1-1', 'inv-1-2', 'f-ptr'],
          mostrar: ['f-ptr'],
          clases: { 'inv-1-1': 'rc-mal', 'inv-1-2': 'rc-aviso' },
        },
        {
          titulo: 'Sigue la cadena.',
          texto:
            'En la 4 está (2, P5): marco 4. Si la cadena terminara en NULL sin encontrarla, sería **page fault**.',
          resaltar: ['inv-4-0', 'inv-4-1', 'df'],
          clases: { 'inv-1-1': '', 'inv-1-2': '', 'inv-4-0': 'rc-ok', 'inv-4-1': 'rc-ok' },
          valores: { 'df-v': '(4, desplazamiento)' },
        },
      ],
    },
  ],
}

// ── Clock mejorado sobre una rueda de 4 marcos ──

const CM_ESTADO: MarcoUM[] = [
  { pagina: 2, u: true, m: true },
  { pagina: 3, u: true, m: false },
  { pagina: 6, u: false, m: true },
  { pagina: 8, u: true, m: true },
]
const RUEDA = [
  { x: 200, y: 64 },
  { x: 330, y: 170 },
  { x: 200, y: 276 },
  { x: 70, y: 170 },
]
const um = (m: MarcoUM) => `U=${+m.u} M=${+m.m}`

function clockMejoradoRecorrido(): Recorrido {
  const { victima, visitas, marcos: despues } = clockMejorado(CM_ESTADO, 0)
  const cuerpo = [
    `<circle class="rm-eje" cx="200" cy="170" r="106" fill="none"/>`,
    ...CM_ESTADO.map((m, i) =>
      nodo(RUEDA[i].x, RUEDA[i].y, 120, 46, `marco ${i} · pág ${m.pagina}`, um(m), {
        el: `rm-${i}`,
        val: `um-${i}`,
      }),
    ),
    texto(200, 170, 'pasada —', { val: 'pasada', clase: 'rs-titulo' }),
    panelLeyenda(440, 30, 260, 210, 'Tabla de páginas'),
    encabezados(470, 62, 44, ['pág', 'marco', 'U', 'M', 'P']),
    tablaM('tp', 470, 70, 44, 28, [
      ['2', '0', '1', '1', '1'],
      ['3', '1', '1', '0', '1'],
      ['6', '2', '0', '1', '1'],
      ['7', '–', '–', '–', '0'],
      ['8', '3', '1', '1', '1'],
    ]),
    texto(570, 270, 'se pide la pág 7 para leer', { clase: 'rm-nota' }),
  ]
  const filaTP = (pag: number) => [2, 3, 6, 7, 8].indexOf(pag)
  const pasos: Paso[] = [
    {
      titulo: 'Se pide la página 7.',
      texto:
        'Es para **leer** una variable. No está en memoria y no hay marcos libres: hay que elegir víctima. El puntero está en el marco 0.',
      resaltar: ['tp-3-0', 'tp-3-4'],
      fichas: { ptr: 'r0' },
      clases: { 'tp-3-4': 'rc-mal' },
    },
    {
      titulo: 'Pasada 1: busca (0, 0).',
      texto:
        'Recorre los 4 marcos buscando uno **ni usado ni modificado**, sin tocar ningún bit. No hay: el marco 2 tiene U = 0 pero M = 1.',
      resaltar: CM_ESTADO.map((_, i) => `rm-${i}`),
      valores: { pasada: 'pasada 1: (0,0)' },
      clases: { 'tp-3-4': '' },
    },
  ]
  for (const v of visitas.filter((x) => x.pasada === 2)) {
    const m = CM_ESTADO[v.marco]
    const fila = filaTP(m.pagina)
    pasos.push(
      v.elegido
        ? {
            titulo: `Marco ${v.marco}: víctima.`,
            texto: `La página ${m.pagina} tiene (0, 1): no se usó hace rato, aunque está modificada. **Es la víctima**; como M = 1, antes hay que escribirla en disco.`,
            resaltar: [`rm-${v.marco}`, `tp-${fila}-2`, `tp-${fila}-3`],
            fichas: { ptr: `r${v.marco}` },
            clases: { [`rm-${v.marco}`]: 'rc-mal' },
          }
        : {
            titulo: `Pasada 2, marco ${v.marco}.`,
            texto: `Busca (0, 1). La página ${m.pagina} tiene ${um(m)}: no es, y al pasar le **baja el bit de uso** a 0.`,
            resaltar: [`rm-${v.marco}`, `tp-${fila}-2`],
            fichas: { ptr: `r${v.marco}` },
            valores: {
              pasada: 'pasada 2: (0,1)',
              [`um-${v.marco}`]: um(despues[v.marco]),
              [`tp-${fila}-2`]: '0',
            },
            clases: { [`tp-${fila}-2`]: 'rc-aviso' },
          },
    )
  }
  const fv = filaTP(CM_ESTADO[victima].pagina)
  pasos.push({
    titulo: 'Entra la página 7.',
    texto: `La 6 queda con P = 0 y la 7 entra al marco ${victima} con **U = 1 y M = 0** (es una lectura). El puntero pasa al marco siguiente.`,
    resaltar: [`rm-${victima}`, 'tp-3-1', 'tp-3-2', 'tp-3-3', 'tp-3-4', `tp-${fv}-4`],
    fichas: { ptr: `r${(victima + 1) % RUEDA.length}` },
    valores: {
      pasada: 'listo',
      [`um-${victima}`]: 'pág 7 · U=1 M=0',
      'tp-3-1': String(victima),
      'tp-3-2': '1',
      'tp-3-3': '0',
      'tp-3-4': '1',
      [`tp-${fv}-1`]: '–',
      [`tp-${fv}-4`]: '0',
    },
    clases: { [`rm-${victima}`]: 'rc-ok', 'tp-3-4': 'rc-ok' },
  })
  return {
    ancho: 720,
    alto: 330,
    titulo: 'Clock mejorado: elegir víctima mirando el bit de uso y el de modificado',
    cuerpo,
    fichas: { ptr: '▲' },
    lugares: Object.fromEntries(RUEDA.map((p, i) => [`r${i}`, { x: p.x - 68, y: p.y - 26 }])),
    pasos,
  }
}

// ── Copy-on-write ──

const cow: Recorrido = {
  ancho: 720,
  alto: 300,
  titulo: 'Copia durante la escritura (copy-on-write) después de un fork()',
  cuerpo: [
    panelLeyenda(30, 40, 160, 200, 'Tabla de P1 (padre)'),
    celdaM('p1-a', 60, 76, 100, 30, 'pág A'),
    celdaM('p1-b', 60, 126, 100, 30, 'pág B'),
    celdaM('p1-c', 60, 176, 100, 30, 'pág C'),
    panelLeyenda(280, 20, 160, 270, 'Memoria física'),
    celdaM('fa', 310, 56, 100, 34, 'A'),
    celdaM('fb', 310, 112, 100, 34, 'B'),
    celdaM('fc', 310, 168, 100, 34, 'C'),
    celdaM('fc2', 310, 232, 100, 34, 'copia de C', { oculto: true }),
    panelLeyenda(530, 40, 160, 200, 'Tabla de P2 (hijo)'),
    celdaM('p2-a', 560, 76, 100, 30, 'pág A'),
    celdaM('p2-b', 560, 126, 100, 30, 'pág B'),
    celdaM('p2-c', 560, 176, 100, 30, 'pág C'),
    arista('M160,91 L308,73', { el: 'a1', punta: true }),
    arista('M160,141 L308,129', { el: 'b1', punta: true }),
    arista('M160,191 L308,185', { el: 'c1', punta: true, oculto: true }),
    arista('M160,196 L308,247', { el: 'c1n', punta: true, oculto: true }),
    arista('M560,91 L412,73', { el: 'a2', punta: true }),
    arista('M560,141 L412,129', { el: 'b2', punta: true }),
    arista('M560,191 L412,185', { el: 'c2', punta: true }),
    texto(360, 296, '', { val: 'nota', clase: 'rm-nota' }),
  ],
  pasos: [
    {
      titulo: 'fork().',
      texto:
        'El hijo es un duplicado del padre, pero en lugar de copiar toda la memoria, las dos tablas apuntan a **los mismos marcos**, marcados como solo lectura.',
      resaltar: ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'fa', 'fb', 'fc'],
      mostrar: ['c1'],
      valores: { nota: 'nada se copió todavía' },
    },
    {
      titulo: 'Mientras solo leen…',
      texto:
        '…comparten todo. Crear el proceso fue rápido y no gastó marcos: es la compartición que permite la paginación.',
      resaltar: ['fa', 'fb', 'fc'],
    },
    {
      titulo: 'P1 escribe en C.',
      texto:
        'La página está protegida contra escritura: salta una excepción y el SO ve que es copy-on-write. **Recién ahora copia C** a un marco nuevo.',
      resaltar: ['p1-c', 'fc', 'fc2'],
      mostrar: ['fc2'],
      clases: { 'p1-c': 'rc-aviso', fc2: 'rc-ok' },
      valores: { nota: 'se copia solo la página que se escribe' },
    },
    {
      titulo: 'Re-apunta y sigue.',
      texto:
        'La entrada C de P1 pasa a la copia, ahora escribible; P2 sigue con la C original. **A y B siguen compartidas.**',
      resaltar: [
        'c1n',
        'fc2',
        'c2',
        'fc',
        'a1',
        'a2',
        'b1',
        'b2',
        'fa',
        'fb',
        'p1-a',
        'p1-b',
        'p1-c',
        'p2-a',
        'p2-b',
        'p2-c',
      ],
      mostrar: ['c1n'],
      ocultar: ['c1'],
      clases: { 'p1-c': '' },
      valores: { nota: 'A y B: una sola copia para los dos' },
    },
  ],
}

// ── Thrashing: la curva de uso de CPU y el círculo vicioso ──

const CURVA = 'M50,240 C110,200 150,90 210,78 C250,72 270,80 290,110 C315,150 330,215 360,240'
const thrashing: Recorrido = {
  ancho: 720,
  alto: 300,
  titulo: 'Thrashing: el uso de CPU cae al subir el grado de multiprogramación',
  cuerpo: [
    `<line class="rm-eje" x1="50" y1="250" x2="380" y2="250"/><line class="rm-eje" x1="50" y1="250" x2="50" y2="40"/>`,
    texto(215, 276, 'grado de multiprogramación →', { clase: 'rm-nota' }),
    texto(36, 30, '% CPU', { clase: 'rm-nota' }),
    `<path class="rm-curva" d="${CURVA}"/>`,
    grupo(
      'zona',
      `<rect class="rm-frag" x="300" y="44" width="80" height="204" rx="6"/>` +
        texto(340, 60, 'thrashing', { clase: 'rm-nota' }),
      {
        oculto: true,
      },
    ),
    nodo(545, 46, 230, 40, '1. Más procesos en memoria', 'menos marcos para cada uno', {
      el: 'c1',
    }),
    nodo(545, 116, 230, 40, '2. Más fallos de página', 'todos esperan al disco', { el: 'c2' }),
    nodo(545, 186, 230, 40, '3. Baja el uso de CPU', 'los procesos están bloqueados', { el: 'c3' }),
    nodo(545, 256, 230, 40, '4. Se suben más procesos', 'para aprovechar la CPU…', { el: 'c4' }),
    arista('M545,68 L545,92', { el: 'a12', punta: true }),
    arista('M545,138 L545,162', { el: 'a23', punta: true }),
    arista('M545,208 L545,232', { el: 'a34', punta: true }),
    arista('M662,256 C705,200 705,100 662,46', { el: 'a41', punta: true }),
  ],
  fichas: { cpu: '●' },
  lugares: {
    bajo: { x: 80, y: 220 },
    sube: { x: 150, y: 120 },
    pico: { x: 225, y: 76 },
    cae: { x: 320, y: 168 },
  },
  pasos: [
    {
      titulo: 'Pocos procesos.',
      texto:
        'Con poca multiprogramación la CPU queda ociosa cada vez que el único proceso hace E/S.',
      resaltar: [],
      fichas: { cpu: 'bajo' },
    },
    {
      titulo: 'Más procesos, más CPU.',
      texto:
        'Mientras uno espera, otro ejecuta: subir el grado de multiprogramación aprovecha mejor la CPU.',
      fichas: { cpu: 'sube' },
    },
    {
      titulo: 'El techo.',
      texto:
        'Llega un punto en que los marcos ya no alcanzan para la **localidad** de cada proceso.',
      fichas: { cpu: 'pico' },
    },
    {
      titulo: 'El círculo vicioso.',
      texto:
        'Con menos marcos por proceso hay más fallos de página; todos se bloquean esperando al disco y la CPU queda libre.',
      resaltar: ['c1', 'a12', 'c2', 'a23', 'c3'],
      fichas: { cpu: 'cae' },
      mostrar: ['zona'],
    },
    {
      titulo: 'Y empeora.',
      texto:
        'Si el SO ve poca CPU y **sube** el grado de multiprogramación, agrava el problema. Se pasa más tiempo paginando que ejecutando: eso es thrashing.',
      resaltar: ['c3', 'a34', 'c4', 'a41', 'c1', 'zona'],
    },
    {
      titulo: 'La salida.',
      texto:
        'Hay que **bajar** el grado de multiprogramación (suspender procesos) o darle a cada proceso los marcos de su conjunto de trabajo.',
      resaltar: ['zona'],
      fichas: { cpu: 'pico' },
    },
  ],
}

// ── Conjunto de trabajo W(t, Δ) ──

const DELTA = 4
const T_WS = [3, 5, 7, 9, 11]
const workingSet: Recorrido = {
  ancho: 720,
  alto: 170,
  titulo: `Conjunto de trabajo con una ventana de Δ = ${DELTA} referencias`,
  cuerpo: [
    rotulo(104, 54, 'Ref.'),
    ...REFS_CLASE.map(
      (r, j) =>
        texto(116 + j * 44 + 22, 22, String(j + 1), { clase: 'rm-marca' }) +
        celdaM(`w-${j}`, 116 + j * 44, 40, 44, 28, String(r)),
    ),
    texto(360, 110, '', { val: 'ws', clase: 'rm-resumen' }),
    texto(360, 140, '', { val: 'ws-nota', clase: 'rm-nota' }),
  ],
  pasos: T_WS.map((t, k) => {
    const w = conjuntoTrabajo(REFS_CLASE, t, DELTA)
    const ventana = Array.from({ length: DELTA }, (_, i) => t - i).filter((j) => j >= 0)
    return {
      titulo: `t = ${t + 1}.`,
      texto:
        k === 0
          ? `La ventana mira las últimas ${DELTA} referencias. Las páginas distintas que aparecen son el conjunto de trabajo: **${w.length} marcos** alcanzan para no fallar en ese tramo.`
          : `La ventana avanza: W = {${w.join(', ')}}, ${w.length} páginas.` +
            (k === T_WS.length - 1
              ? ' El tamaño de W va cambiando: con él se decide cuántos marcos darle al proceso.'
              : ''),
      resaltar: ventana.map((j) => `w-${j}`),
      valores: {
        ws: `W(${t + 1}, ${DELTA}) = {${w.join(', ')}}`,
        'ws-nota': `ventana: refs ${Math.max(1, t - DELTA + 2)} a ${t + 1}`,
      },
    }
  }),
}

export const recorridos: Record<string, Recorrido> = {
  'page-fault': pageFault,
  'casos-tabla-paginas': casosTabla,
  'paginacion-jerarquica': jerarquica,
  'tabla-invertida': invertida,
  tlb,
  'reemplazo-paginas': recorridoReemplazo({
    refs: REFS_CLASE,
    marcos: 3,
    algoritmos: ['optimo', 'fifo', 'lru', 'clock'],
    titulo: 'Algoritmos de reemplazo con 3 marcos y la secuencia de la clase',
  }),
  'belady-3': recorridoReemplazo({
    refs: REFS_BELADY,
    marcos: 3,
    algoritmos: ['fifo'],
    titulo: 'FIFO con 3 marcos',
  }),
  'belady-4': recorridoReemplazo({
    refs: REFS_BELADY,
    marcos: 4,
    algoritmos: ['fifo'],
    titulo: 'FIFO con 4 marcos',
  }),
  'clock-mejorado': clockMejoradoRecorrido(),
  'copy-on-write': cow,
  thrashing,
  'working-set': workingSet,
}
