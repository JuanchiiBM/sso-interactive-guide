/** Recorridos del tema Memoria real. Los estados de memoria salen de memoria.ts (testeado). */
import {
  buddy,
  particionamientoDinamico,
  traducirPaginacion,
  ubicar,
  type AlgoritmoUbicacion,
  type Bloque,
  type OpDinamica,
  type Particion,
} from '../memoria'
import {
  barraMemoria,
  celdaM,
  encabezados,
  rotulo,
  tablaM,
  type Segmento,
} from '../primitivas-memoria'
import { arista, nodo } from '../primitivas-procesos'
import { panelLeyenda } from '../primitivas-t3'
import type { Paso, Recorrido, Variante } from '../recorrido'
import { grupo, rombo, texto } from '../svg'

const COLOR: Record<string, string> = {
  P1: 'rm-p1',
  P2: 'rm-p2',
  P3: 'rm-p3',
  P4: 'rm-p4',
  P5: 'rm-p5',
  P6: 'rm-p6',
}
const hex = (n: number) => `0x${n.toString(16).toUpperCase()}`
const decision = (el: string, x: number, y: number, w: number, h: number, t: string) =>
  grupo(el, rombo(x, y, w, h, t), { clase: 'ri-rombo' })

// ── Address binding: compilación, carga y ejecución ──

const ETAPAS = [
  { el: 'c', x: 90, nombre: 'programa.c' },
  { el: 'o', x: 270, nombre: 'programa.o' },
  { el: 'exe', x: 450, nombre: 'programa.exe' },
  { el: 'mem', x: 630, nombre: 'Memoria' },
]

function binding(): Recorrido {
  const fuente: Paso = {
    titulo: 'El fuente.',
    texto:
      '`int a = 15;` termina siendo algo como `mov 15, a`. La pregunta es **cuándo** se decide la dirección de memoria de `a`.',
    resaltar: ['c'],
    valores: {
      'c-v': 'int a = 15;',
      'o-v': '',
      'exe-v': '',
      'mem-v': '',
      'cpu-v': '',
      'mmu-v': '',
      'df-v': '',
    },
  }
  const v = (o: string, exe: string, mem: string) => ({ o, exe, mem })
  const variante = (
    nombre: string,
    refs: ReturnType<typeof v>,
    textos: string[],
    extra: Paso[] = [],
  ): Variante => ({
    nombre,
    pasos: [
      fuente,
      {
        titulo: 'Compila.',
        texto: textos[0],
        resaltar: ['f-comp', 'o'],
        valores: { 'o-v': refs.o },
      },
      {
        titulo: 'Enlaza.',
        texto: textos[1],
        resaltar: ['f-enl', 'exe'],
        valores: { 'exe-v': refs.exe },
      },
      {
        titulo: 'Carga.',
        texto: textos[2],
        resaltar: ['f-carga', 'mem'],
        valores: { 'mem-v': refs.mem },
      },
      ...extra,
    ],
  })
  return {
    ancho: 720,
    alto: 270,
    titulo: 'Address binding: cuándo se resuelve la dirección de una variable',
    cuerpo: [
      ...ETAPAS.map((e) => nodo(e.x, 70, 156, 56, e.nombre, '', { el: e.el, val: `${e.el}-v` })),
      arista('M168,70 L190,70', {
        el: 'f-comp',
        punta: true,
        etiqueta: 'compila',
        lx: 180,
        ly: 32,
      }),
      arista('M348,70 L370,70', { el: 'f-enl', punta: true, etiqueta: 'enlaza', lx: 360, ly: 32 }),
      arista('M528,70 L550,70', { el: 'f-carga', punta: true, etiqueta: 'carga', lx: 540, ly: 32 }),
      grupo(
        'mmu',
        nodo(150, 205, 150, 50, 'CPU', '', { val: 'cpu-v' }) +
          nodo(360, 205, 170, 50, 'MMU', '', { val: 'mmu-v' }) +
          nodo(570, 205, 150, 50, 'Memoria física', '', { val: 'df-v' }) +
          arista('M226,205 L273,205', { punta: true, etiqueta: 'lógica', lx: 250, ly: 194 }) +
          arista('M446,205 L493,205', { punta: true, etiqueta: 'física', lx: 470, ly: 194 }),
        { oculto: true },
      ),
    ],
    variantes: [
      variante('En compilación', v('mov 15, 0x1234', 'mov 15, 0x1234', 'mov 15, 0x1234'), [
        'El compilador ya elige la dirección: `a` es `0x1234` para siempre.',
        'El ejecutable sale con la dirección absoluta adentro.',
        'Hay que cargarlo **justo** en ese lugar. Dos instancias del programa se pisarían, y reubicarlo obliga a recompilar.',
      ]),
      variante('En carga', v('mov 15, inicio+34', 'mov 15, inicio+34', 'mov 15, 0x1234'), [
        'El compilador deja una dirección **relativa**: `inicio + 34`.',
        'El enlazador la mantiene relativa.',
        'El cargador sabe que lo pone en `0x1200` y la resuelve: `0x1234`. Ya se pueden correr varias instancias, pero si el proceso se suspende tiene que volver al mismo lugar.',
      ]),
      variante(
        'En ejecución',
        v('mov 15, inicio+34', 'mov 15, inicio+34', 'mov 15, inicio+34'),
        [
          'Dirección relativa: `inicio + 34`.',
          'Sigue relativa.',
          'Se carga **sin resolverla**: hasta en memoria la instrucción dice `inicio + 34`.',
        ],
        [
          {
            titulo: 'La MMU traduce en cada acceso.',
            texto:
              'La CPU emite la dirección lógica 34; la MMU le suma el registro de reubicación (1200) y sale la física 1234. Es lo que se usa hoy: para mover el proceso alcanza con cambiar el registro.',
            resaltar: ['mmu'],
            mostrar: ['mmu'],
            valores: {
              'cpu-v': 'emite 34',
              'mmu-v': '34 + 1200 (reubicación)',
              'df-v': 'accede a 1234',
            },
          },
        ],
      ),
    ],
  }
}

// ── Protección con registros base y límite ──

const BASE = 300040
const LIMITE = 120900
const MAPA: [number, number, string, string][] = [
  [0, 256000, 'SO', 'rm-so'],
  [256000, 300040, 'otro', 'rm-p2'],
  [BASE, BASE + LIMITE, 'proceso', 'rm-p1'],
  [BASE + LIMITE, 880000, 'otro', 'rm-p3'],
  [880000, 1024000, 'libre', 'rm-hueco'],
]

function proteccion(): Recorrido {
  const variante = (nombre: string, dir: number): Variante => {
    const pasaBase = dir >= BASE
    const pasaLimite = dir < BASE + LIMITE
    const pasos: Paso[] = [
      {
        titulo: `La CPU emite ${dir}.`,
        texto: `Base = ${BASE} y límite = ${LIMITE}: el proceso ocupa de ${BASE} a ${BASE + LIMITE}. Los registros los cargó el SO al darle la CPU.`,
        resaltar: ['cpu', 'regs'],
        valores: { 'cpu-v': `dirección ${dir}` },
        clases: { r1: '', r2: '', irq: '', mem: '' },
      },
      {
        titulo: '¿Es ≥ base?',
        texto: pasaBase
          ? `${dir} ≥ ${BASE}: sí. Falta la otra punta.`
          : `${dir} < ${BASE}: **no**. Es memoria de otro (acá, del SO): el hardware lanza una interrupción.`,
        resaltar: ['r1', pasaBase ? 'f-si1' : 'f-no1', ...(pasaBase ? [] : ['irq'])],
        clases: { r1: pasaBase ? 'rc-ok' : 'rc-mal', ...(pasaBase ? {} : { irq: 'rc-mal' }) },
      },
    ]
    if (pasaBase)
      pasos.push({
        titulo: '¿Es < base + límite?',
        texto: pasaLimite
          ? `${dir} < ${BASE + LIMITE}: sí. La dirección es del proceso y se accede a memoria.`
          : `${dir} ≥ ${BASE + LIMITE}: **no**, se pasó del final. Interrupción: el SO decide qué hacer, normalmente terminar el proceso.`,
        resaltar: ['r2', pasaLimite ? 'f-si2' : 'f-no2', pasaLimite ? 'mem' : 'irq'],
        clases: {
          r2: pasaLimite ? 'rc-ok' : 'rc-mal',
          [pasaLimite ? 'mem' : 'irq']: pasaLimite ? 'rc-ok' : 'rc-mal',
        },
      })
    return { nombre, pasos }
  }
  const y = (v: number) => 20 + (v / 1024000) * 290
  return {
    ancho: 720,
    alto: 330,
    titulo: 'Protección con registros base y límite',
    cuerpo: [
      nodo(90, 60, 150, 50, 'CPU', '', { el: 'cpu', val: 'cpu-v' }),
      grupo(
        'regs',
        `<rect x="20" y="104" width="150" height="50" rx="3"/>` +
          texto(95, 120, `base = ${BASE}`) +
          texto(95, 140, `límite = ${LIMITE}`),
        { clase: 'rm-celda' },
      ),
      decision('r1', 290, 60, 150, 70, '¿≥ base?'),
      decision('r2', 290, 190, 170, 70, '¿< base + límite?'),
      nodo(470, 190, 110, 46, 'Memoria', '', { el: 'mem' }),
      nodo(150, 280, 170, 46, 'Interrupción', 'el SO decide', { el: 'irq' }),
      arista('M165,60 L213,60', { punta: true }),
      arista('M290,95 L290,153', { el: 'f-si1', punta: true, etiqueta: 'sí', lx: 302, ly: 125 }),
      arista('M220,80 C180,140 160,200 150,255', {
        el: 'f-no1',
        punta: true,
        etiqueta: 'no',
        lx: 192,
        ly: 150,
      }),
      arista('M375,190 L413,190', { el: 'f-si2', punta: true, etiqueta: 'sí', lx: 394, ly: 180 }),
      arista('M290,225 L230,262', { el: 'f-no2', punta: true, etiqueta: 'no', lx: 270, ly: 254 }),
      ...MAPA.map(
        ([a, b, t, c]) =>
          `<g class="rm-seg ${c}"><rect x="580" y="${y(a)}" width="120" height="${y(b) - y(a)}"/>` +
          texto(640, (y(a) + y(b)) / 2, t, { clase: 'rm-etq rm-chica' }) +
          `</g>`,
      ),
      texto(572, y(BASE) + 4, String(BASE), { clase: 'rm-marca rs-cola' }),
      texto(572, y(BASE + LIMITE) + 4, String(BASE + LIMITE), { clase: 'rm-marca rs-cola' }),
    ],
    variantes: [
      variante('Dirección válida', 350000),
      variante('Se pasa del límite', 430000),
      variante('Debajo de la base', 250000),
    ],
  }
}

// ── Particionamiento fijo ──

const segs = (
  parts: { inicio: number; tam: number; proceso: string | null; usado?: number }[],
): Segmento[] =>
  parts.map((p) => ({
    inicio: p.inicio,
    tam: p.tam,
    etiqueta: p.proceso ? `${p.proceso} · ${p.usado ?? p.tam}` : `${p.tam}`,
    clase: p.proceso ? (COLOR[p.proceso] ?? 'rm-p7') : 'rm-hueco',
    usado: p.usado,
  }))

function fijo(): Recorrido {
  const SO = { inicio: 0, tam: 8, etiqueta: 'SO', clase: 'rm-so' }
  const base = [
    { inicio: 8, tam: 4, proceso: 'P2', usado: 3 },
    { inicio: 12, tam: 6, proceso: 'P3', usado: 5 },
    { inicio: 18, tam: 8, proceso: 'P4', usado: 8 },
    { inicio: 26, tam: 10, proceso: null as string | null },
    { inicio: 36, tam: 12, proceso: null as string | null },
  ]
  const conP1 = base.map((p) => (p.inicio === 26 ? { ...p, proceso: 'P1', usado: 4 } : p))
  const barra = (el: string, parts: typeof base, oculto = true) =>
    barraMemoria(el, 30, 70, 660, 50, 48, [SO, ...segs(parts)], { oculto, marcas: true })
  return {
    ancho: 720,
    alto: 200,
    titulo: 'Particionamiento fijo: particiones de 4, 6, 8, 10 y 12 MB',
    cuerpo: [
      barra('antes', base),
      barra('despues', conP1),
      texto(360, 40, '', { val: 'llega', clase: 'rm-resumen' }),
      texto(360, 170, '', { val: 'nota', clase: 'rm-nota' }),
    ],
    pasos: [
      {
        titulo: 'Particiones fijas.',
        texto:
          'La memoria se partió una vez y para siempre. Cada proceso entra **entero** en una partición, así que el grado de multiprogramación es 5, el número de particiones.',
        resaltar: ['antes'],
        mostrar: ['antes'],
        valores: {
          llega: 'P2, P3 y P4 ya están; quedan libres la de 10 y la de 12',
          nota: 'tabla del SO: partición → libre / ocupada',
        },
      },
      {
        titulo: 'Llega P1, de 4 MB.',
        texto:
          'Se busca la partición **más chica donde entre**. La de 4 está ocupada, así que va a la de 10 (con una sola cola de procesos).',
        resaltar: ['antes'],
        valores: { llega: 'llega P1 (4 MB) → la más chica libre es la de 10' },
      },
      {
        titulo: 'Fragmentación interna.',
        texto:
          'P1 usa 4 MB y los otros **6 MB de la partición quedan sin usar**, pero nadie más los puede usar. Esa pérdida adentro de una partición es la fragmentación interna.',
        resaltar: ['despues'],
        mostrar: ['despues'],
        ocultar: ['antes'],
        valores: {
          llega: 'P1 en la de 10: sobran 6 MB adentro',
          nota: 'en rojo: lo asignado que no se usa',
        },
      },
      {
        titulo: 'Llega P5, de 14 MB.',
        texto:
          'No entra en ninguna: la más grande es de 12. Un proceso más grande que la partición más grande **no puede ejecutar nunca** con este esquema.',
        resaltar: ['despues'],
        valores: { llega: 'llega P5 (14 MB): no entra en ninguna partición' },
      },
    ],
  }
}

// ── Particionamiento dinámico: la secuencia de la clase, fragmentación externa y compactación ──

const OPS_DINAMICO: OpDinamica[] = [
  { carga: 'P1', tam: 10 },
  { carga: 'P2', tam: 12 },
  { carga: 'P3', tam: 6 },
  { descarga: 'P2' },
  { carga: 'P4', tam: 6 },
  { descarga: 'P1' },
  { carga: 'P5', tam: 8 },
  { carga: 'P1', tam: 10 },
  { compactar: true },
  { carga: 'P6', tam: 8 },
]
const tablaHuecos = (p: Particion[]) =>
  'huecos (inicio, tamaño): ' +
  (p
    .filter((x) => !x.proceso)
    .map((h) => `(${h.inicio}, ${h.tam})`)
    .join(' ') || 'ninguno')

function dinamico(): Recorrido {
  const estados = particionamientoDinamico(40, OPS_DINAMICO)
  const frames = estados.map((e, i) =>
    barraMemoria(`f${i}`, 30, 70, 660, 50, 40, segs(e), { oculto: true, marcas: true }),
  )
  const huecosP6 = estados[7].filter((p) => !p.proceso)
  const px = (v: number) => 30 + (v / 40) * 660
  const sel = huecosP6.map((h, k) =>
    grupo(
      `sel-${k}`,
      `<rect x="${px(h.inicio) - 3}" y="66" width="${px(h.inicio + h.tam) - px(h.inicio) + 6}" height="58" rx="5"/>`,
      {
        oculto: true,
        clase: 'rm-sel',
      },
    ),
  )
  const paso = (i: number, titulo: string, txt: string, extra: Partial<Paso> = {}): Paso => ({
    titulo,
    texto: txt,
    resaltar: [`f${i}`, ...(extra.mostrar ?? [])],
    mostrar: [`f${i}`, ...(extra.mostrar ?? [])],
    ocultar: [
      ...estados.map((_, k) => `f${k}`).filter((k) => k !== `f${i}`),
      ...(extra.ocultar ?? []),
    ],
    valores: { huecos: tablaHuecos(estados[i]), ...extra.valores },
  })
  const selIds = sel.map((_, k) => `sel-${k}`)
  return {
    ancho: 720,
    alto: 200,
    titulo: 'Particionamiento dinámico con primer ajuste: 40 MB para procesos',
    cuerpo: [
      ...frames,
      ...sel,
      texto(360, 40, '', { val: 'evento', clase: 'rm-resumen' }),
      texto(360, 170, '', { val: 'huecos', clase: 'rm-nota rm-mono' }),
    ],
    pasos: [
      paso(
        2,
        'Cargas.',
        'Entran P1 (10), P2 (12) y P3 (6). Cada uno recibe **exactamente** lo que pide: no hay fragmentación interna.',
        {
          valores: { evento: 'se cargan P1, P2 y P3' },
        },
      ),
      paso(
        3,
        'Sale P2.',
        'Deja un **hueco** de 12 MB en el medio. El SO lleva una tabla de huecos además de la de procesos.',
        {
          valores: { evento: 'se descarga P2' },
        },
      ),
      paso(4, 'Entra P4 (6).', 'Va al primer hueco donde entra, el de 12, y quedan 6 MB sueltos.', {
        valores: { evento: 'se carga P4' },
      }),
      paso(5, 'Sale P1.', 'Otro hueco, de 10 MB, al principio.', {
        valores: { evento: 'se descarga P1' },
      }),
      paso(6, 'Entra P5 (8).', 'Primer ajuste: el hueco de 10 del principio. Sobran 2 MB.', {
        valores: { evento: 'se carga P5' },
      }),
      paso(
        7,
        'Vuelve P1 (10).',
        'No entra en los de 2 ni de 6: va al del final, y sobran otros 2.',
        { valores: { evento: 'se carga P1' } },
      ),
      paso(
        7,
        'Llega P6, de 8 MB.',
        'Hay **10 MB libres** (2 + 6 + 2) pero ningún hueco de 8: no entra. Eso es **fragmentación externa**: hay lugar, pero no contiguo.',
        { mostrar: selIds, valores: { evento: 'P6 (8 MB) no entra: Σ huecos = 10 ≥ 8' } },
      ),
      paso(
        8,
        'Compactación.',
        'El SO mueve todos los procesos hacia el principio y junta los huecos en uno de 10. Es muy caro: mientras tanto los procesos no pueden ejecutar.',
        {
          ocultar: selIds,
          valores: { evento: 'compactación: un solo hueco de 10 MB' },
        },
      ),
      paso(
        9,
        'Ahora sí, P6.',
        'Entra en el hueco de 10 y sobran 2. Sin compactar, el riesgo es que la memoria quede llena de huecos chicos.',
        {
          valores: { evento: 'se carga P6' },
        },
      ),
    ],
  }
}

// ── Algoritmos de ubicación ──

const MEM_UBIC: Particion[] = [
  { inicio: 0, tam: 8, proceso: null },
  { inicio: 8, tam: 6, proceso: 'P1' },
  { inicio: 14, tam: 12, proceso: null },
  { inicio: 26, tam: 4, proceso: 'P2' },
  { inicio: 30, tam: 6, proceso: null },
  { inicio: 36, tam: 4, proceso: 'P3' },
  { inicio: 40, tam: 10, proceso: null },
]
const PEDIDO = 6
const ULTIMA = 40

function ubicacion(): Recorrido {
  const huecos = MEM_UBIC.filter((p) => !p.proceso)
  const px = (v: number) => 30 + (v / 50) * 660
  const colocar = (i: number): Particion[] =>
    MEM_UBIC.flatMap((p) => {
      if (p !== huecos[i]) return [p]
      const resto = p.tam - PEDIDO
      return [
        { inicio: p.inicio, tam: PEDIDO, proceso: 'P4' },
        ...(resto ? [{ inicio: p.inicio + PEDIDO, tam: resto, proceso: null }] : []),
      ]
    })
  const algs: [AlgoritmoUbicacion, string, (i: number) => string][] = [
    [
      'primer',
      'Primer ajuste',
      () => 'Recorre desde el comienzo de la memoria y se queda con el **primero** donde entra.',
    ],
    [
      'siguiente',
      'Siguiente ajuste',
      () =>
        `Igual que el primero, pero arranca desde la **última asignación** (P3 se cargó hasta ${ULTIMA}).`,
    ],
    ['mejor', 'Mejor ajuste', () => 'Mira **todos** los huecos y elige el más chico donde entra.'],
    ['peor', 'Peor ajuste', () => 'Mira **todos** los huecos y elige el más grande.'],
  ]
  const comentario: Record<AlgoritmoUbicacion, (resto: number) => string> = {
    primer: (r) => `Sobra un hueco de ${r} MB. Es simple y rápido, y suele andar bien.`,
    siguiente: (r) => `Sobra un hueco de ${r} MB. Reparte las asignaciones por toda la memoria.`,
    mejor: (r) =>
      `Entra justo (sobran ${r} MB). Según el resumen de la cátedra es el que **peor fragmentación externa** genera: deja huecos tan chicos que no sirven.`,
    peor: (r) =>
      `Sobran ${r} MB, un hueco que todavía sirve. Por eso el resumen dice que es el que **menos fragmentación externa** genera.`,
  }
  const cuerpo = [
    barraMemoria('antes', 30, 80, 660, 50, 50, segs(MEM_UBIC), { oculto: true, marcas: true }),
    ...huecos.map((_, i) =>
      barraMemoria(`despues-${i}`, 30, 80, 660, 50, 50, segs(colocar(i)), {
        oculto: true,
        marcas: true,
      }),
    ),
    ...huecos.map((h, k) =>
      grupo(
        `sel-${k}`,
        `<rect x="${px(h.inicio) - 3}" y="76" width="${px(h.inicio + h.tam) - px(h.inicio) + 6}" height="58" rx="5"/>`,
        {
          oculto: true,
          clase: 'rm-sel',
        },
      ),
    ),
    grupo('ultima', texto(px(ULTIMA), 64, '▼ última asignación', { clase: 'rm-puntero' }), {
      oculto: true,
    }),
    texto(360, 36, `llega P4, de ${PEDIDO} MB`, { clase: 'rm-resumen' }),
    texto(360, 180, `huecos: ${huecos.map((h) => `${h.tam} MB en ${h.inicio}`).join(' · ')}`, {
      clase: 'rm-nota',
    }),
  ]
  return {
    ancho: 720,
    alto: 200,
    titulo: `Algoritmos de ubicación: dónde poner un proceso de ${PEDIDO} MB`,
    cuerpo,
    variantes: algs.map(([alg, nombre, criterio]) => {
      const i = ubicar(huecos, PEDIDO, alg, ULTIMA)
      const h = huecos[i]
      return {
        nombre,
        pasos: [
          {
            titulo: 'Cuatro huecos.',
            texto: `Hay huecos de ${huecos.map((x) => x.tam).join(', ')} MB y P4 entra en cualquiera. ${criterio(i)}`,
            resaltar: ['antes', ...(alg === 'siguiente' ? ['ultima'] : [])],
            mostrar: ['antes', ...(alg === 'siguiente' ? ['ultima'] : [])],
            ocultar: huecos.map((_, k) => `despues-${k}`),
          },
          {
            titulo: `Elige el de ${h.tam} MB.`,
            texto: `${nombre}: el hueco de ${h.tam} MB que empieza en ${h.inicio}.`,
            resaltar: ['antes', `sel-${i}`],
            mostrar: [`sel-${i}`],
          },
          {
            titulo: 'Resultado.',
            texto: comentario[alg](h.tam - PEDIDO),
            resaltar: [`despues-${i}`],
            mostrar: [`despues-${i}`],
            ocultar: ['antes', `sel-${i}`, 'ultima'],
          },
        ],
      }
    }),
  }
}

// ── Buddy system ──

const OPS_BUDDY = [
  { carga: 'P1', tam: 200 },
  { carga: 'P2', tam: 100 },
  { carga: 'P3', tam: 400 },
  { carga: 'P4', tam: 64 },
  { descarga: 'P2' },
  { descarga: 'P1' },
  { descarga: 'P4' },
]

function buddyRecorrido(): Recorrido {
  const estados: Bloque[][] = [[{ inicio: 0, tam: 1024, proceso: null }], ...buddy(1024, OPS_BUDDY)]
  const seg = (b: Bloque): Segmento => ({
    inicio: b.inicio,
    tam: b.tam,
    etiqueta: b.proceso ? (b.tam >= 128 ? `${b.proceso} · ${b.pedido}` : b.proceso) : `${b.tam}`,
    clase: b.proceso ? COLOR[b.proceso] : 'rm-hueco',
    usado: b.pedido,
  })
  const frames = estados.map((e, i) =>
    barraMemoria(`f${i}`, 30, 80, 660, 56, 1024, e.map(seg), { oculto: true, marcas: true }),
  )
  const textos: [string, string][] = [
    [
      '1024 MB libres.',
      'Un solo bloque. Todo se asigna en potencias de 2: el pedido se **redondea** a la potencia siguiente.',
    ],
    [
      'P1 pide 200 → 256.',
      'Se parte 1024 en dos compañeros de 512, y uno de 512 en dos de 256. P1 queda en un 256: 56 MB de **fragmentación interna**.',
    ],
    ['P2 pide 100 → 128.', 'Se parte el otro 256 en dos de 128. Sobran 28 MB adentro del bloque.'],
    ['P3 pide 400 → 512.', 'Hay un 512 libre entero: entra sin partir nada (112 MB sin usar).'],
    [
      'P4 pide 64 → 64.',
      'El 128 libre se parte en dos de 64. 64 es potencia de 2: no desperdicia nada.',
    ],
    ['Sale P2.', 'Su compañero (el 128 de al lado) está partido y ocupado: **no se une**.'],
    ['Sale P1.', 'Su compañero es el 256 de al lado, que no está entero libre: tampoco se une.'],
    [
      'Sale P4.',
      'Ahora sí: 64 + 64 → 128, + 128 → 256, + 256 → 512. Los **compañeros** (los que salieron de la misma división) se consolidan en cascada.',
    ],
  ]
  return {
    ancho: 720,
    alto: 190,
    titulo: 'Buddy system sobre 1024 MB',
    cuerpo: [
      ...frames,
      texto(360, 170, 'en rojo: fragmentación interna (lo redondeado que no se usa)', {
        clase: 'rm-nota',
      }),
    ],
    pasos: textos.map(([titulo, txt], i) => ({
      titulo,
      texto: txt,
      resaltar: [`f${i}`],
      mostrar: [`f${i}`],
      ocultar: estados.map((_, k) => `f${k}`).filter((k) => k !== `f${i}`),
    })),
  }
}

// ── Traducción en segmentación ──

const SEGMENTOS = [
  ['0', '0xB000', '0xCFFF', 'R'],
  ['1', '0x4090', '0x8000', 'RX'],
  ['2', '0x000A', '0x10FF', 'RW'],
  ['3', '0x2000', '0x2FFF', 'RW'],
]

function segmentacion(): Recorrido {
  const variante = (nombre: string, seg: number, off: number, op: 'lee' | 'escribe'): Variante => {
    const inicio = parseInt(SEGMENTOS[seg][1], 16)
    const limite = parseInt(SEGMENTOS[seg][2], 16)
    const df = inicio + off
    const dentro = df <= limite
    const permiso = op === 'lee' ? 'R' : 'W'
    const puede = SEGMENTOS[seg][3].includes(permiso)
    const fila = [0, 1, 2, 3].map((j) => `ts-${seg}-${j}`)
    return {
      nombre,
      pasos: [
        {
          titulo: `DL (${seg}, ${hex(off)}).`,
          texto: `Segmento ${seg} y desplazamiento ${hex(off)}; la instrucción **${op}**. Los segmentos son las partes del proceso que ve el programador.`,
          resaltar: ['dl-s', 'dl-o'],
          valores: { 'dl-s': `seg ${seg}`, 'dl-o': hex(off), 'suma-v': '', 'cmp-v': '' },
          clases: Object.fromEntries([
            ...SEGMENTOS.flatMap((_, i) => [0, 1, 2, 3].map((j) => [`ts-${i}-${j}`, ''])),
            ['cmp', ''],
            ['mem', ''],
            ['irq', ''],
          ]),
        },
        {
          titulo: 'Tabla de segmentos.',
          texto: `Fila ${seg}: empieza en ${SEGMENTOS[seg][1]} y termina en ${SEGMENTOS[seg][2]} (la columna límite es la **dirección final**, no el tamaño). Leer la tabla es un acceso a memoria.`,
          resaltar: fila,
        },
        {
          titulo: 'Inicio + desplazamiento.',
          texto: `${SEGMENTOS[seg][1]} + ${hex(off)} = **${hex(df)}**. En segmentación no se concatena: se suma.`,
          resaltar: ['dl-o', `ts-${seg}-1`, 'suma'],
          valores: { 'suma-v': `${SEGMENTOS[seg][1]} + ${hex(off)} = ${hex(df)}` },
        },
        dentro && puede
          ? {
              titulo: 'Válida.',
              texto: `${hex(df)} ≤ ${SEGMENTOS[seg][2]} y el segmento permite ${op === 'lee' ? 'leer' : 'escribir'}: se accede a memoria (segundo acceso).`,
              resaltar: ['cmp', 'mem', `ts-${seg}-2`, `ts-${seg}-3`],
              valores: { 'cmp-v': `${hex(df)} ≤ ${SEGMENTOS[seg][2]} · ${SEGMENTOS[seg][3]}` },
              clases: { cmp: 'rc-ok', mem: 'rc-ok' },
            }
          : !dentro
            ? {
                titulo: 'Segmentation fault.',
                texto: `${hex(df)} > ${SEGMENTOS[seg][2]}: se pasó del final del segmento. La MMU lanza una interrupción y el SO normalmente termina el proceso.`,
                resaltar: ['cmp', 'irq', `ts-${seg}-2`],
                valores: { 'cmp-v': `${hex(df)} > ${SEGMENTOS[seg][2]}` },
                clases: { cmp: 'rc-mal', irq: 'rc-mal', [`ts-${seg}-2`]: 'rc-mal' },
              }
            : {
                titulo: 'Violación de permisos.',
                texto: `La dirección está adentro (${hex(df)} ≤ ${SEGMENTOS[seg][2]}), pero el segmento ${seg} es ${SEGMENTOS[seg][3]}: **no se puede escribir** el código. También es una interrupción.`,
                resaltar: ['cmp', 'irq', `ts-${seg}-3`],
                valores: { 'cmp-v': `adentro, pero sin permiso ${permiso}` },
                clases: { cmp: 'rc-mal', irq: 'rc-mal', [`ts-${seg}-3`]: 'rc-mal' },
              },
      ],
    }
  }
  return {
    ancho: 720,
    alto: 320,
    titulo: 'Traducción de direcciones con segmentación',
    cuerpo: [
      texto(30, 34, 'DL', { clase: 'rm-rotulo' }),
      celdaM('dl-s', 40, 20, 90, 28, 'seg 3'),
      celdaM('dl-o', 130, 20, 90, 28, '0x50A'),
      texto(180, 82, 'Tabla de segmentos', { clase: 'rs-titulo' }),
      encabezados(40, 100, 72, ['seg', 'inicio', 'límite', 'permisos']),
      tablaM('ts', 40, 108, 72, 30, SEGMENTOS),
      nodo(520, 60, 260, 50, 'Sumador', '', { el: 'suma', val: 'suma-v' }),
      nodo(520, 160, 260, 50, '¿DF ≤ límite? ¿hay permiso?', '', { el: 'cmp', val: 'cmp-v' }),
      nodo(450, 270, 120, 46, 'Memoria', 'accede', { el: 'mem' }),
      nodo(620, 270, 150, 46, 'Interrupción', 'segfault / protección', { el: 'irq' }),
      arista('M520,85 L520,133', { punta: true }),
      arista('M490,185 L460,245', { punta: true, etiqueta: 'sí', lx: 462, ly: 214 }),
      arista('M550,185 L600,245', { punta: true, etiqueta: 'no', lx: 590, ly: 214 }),
    ],
    variantes: [
      variante('Válida', 3, 0x50a, 'lee'),
      variante('Se pasa del límite', 3, 0x100b, 'lee'),
      variante('Sin permiso', 1, 0x20, 'escribe'),
    ],
  }
}

// ── Traducción en paginación (en hexa, binario y decimal) ──

const TABLA_PAG = [6, 11, 9, 1, 14, 4, 3, 7]
const DL_PAG = 0x2a50

function paginacion(): Recorrido {
  const t = traducirPaginacion(DL_PAG, 12, TABLA_PAG)
  const bin = (n: number, bits: number) =>
    n
      .toString(2)
      .padStart(bits, '0')
      .replace(/(\d{4})(?=\d)/g, '$1 ')
  return {
    ancho: 720,
    alto: 330,
    titulo: 'Traducción con paginación: páginas de 4096 bytes y 16 páginas por proceso',
    cuerpo: [
      texto(30, 34, 'DL', { clase: 'rm-rotulo' }),
      celdaM('dl', 40, 20, 110, 28, hex(DL_PAG)),
      celdaM('dl-p', 220, 20, 70, 28, bin(t.pagina, 4)),
      celdaM('dl-o', 290, 20, 160, 28, bin(t.offset, 12)),
      texto(255, 62, '4 bits', { clase: 'rm-nota' }),
      texto(370, 62, '12 bits', { clase: 'rm-nota' }),
      texto(110, 96, 'Tabla de páginas', { clase: 'rs-titulo' }),
      encabezados(60, 112, 70, ['pág', 'marco']),
      tablaM(
        'tp',
        60,
        120,
        70,
        24,
        TABLA_PAG.map((m, i) => [String(i), String(m)]),
      ),
      texto(270, 214, 'DF', { clase: 'rm-rotulo' }),
      celdaM('df-m', 280, 200, 70, 28, ''),
      celdaM('df-o', 350, 200, 160, 28, ''),
      celdaM('df', 560, 200, 110, 28, ''),
      texto(500, 280, '', { val: 'cuenta', clase: 'rm-resumen rm-mono' }),
      arista('M150,34 L218,34', { punta: true }),
      arista('M370,48 L410,198', {
        el: 'f-off',
        punta: true,
        oculto: true,
        etiqueta: 'se copia',
        lx: 430,
        ly: 130,
      }),
      arista('M200,180 L278,212', { el: 'f-marco', punta: true, oculto: true }),
    ],
    pasos: [
      {
        titulo: `DL ${hex(DL_PAG)}.`,
        texto:
          'Con páginas de 4096 bytes (`2^12`) el desplazamiento usa 12 bits; con 16 páginas (`2^4`), la página usa 4. La DL tiene 16 bits.',
        resaltar: ['dl'],
      },
      {
        titulo: 'En binario.',
        texto: `Los 4 bits de la izquierda son la **página** (${t.pagina}) y los 12 de la derecha el **desplazamiento** (${hex(t.offset)}).`,
        resaltar: ['dl-p', 'dl-o'],
      },
      {
        titulo: 'Tabla de páginas.',
        texto: `La página ${t.pagina} está en el marco **${t.marco}**. Es el primer acceso a memoria.`,
        resaltar: ['dl-p', `tp-${t.pagina}-0`, `tp-${t.pagina}-1`, 'f-marco'],
        mostrar: ['f-marco'],
        clases: { [`tp-${t.pagina}-1`]: 'rc-ok' },
      },
      {
        titulo: 'Se arma la DF.',
        texto: `Se cambia la página por el marco y el desplazamiento **se copia tal cual**: ${bin(t.marco, 4)} | ${bin(t.offset, 12)} = ${hex(t.df)}.`,
        resaltar: ['df-m', 'df-o', 'df', 'f-off'],
        mostrar: ['f-off'],
        valores: { 'df-m': bin(t.marco, 4), 'df-o': bin(t.offset, 12), df: hex(t.df) },
      },
      {
        titulo: 'En decimal.',
        texto: `DL = ${t.pagina} × 4096 + ${t.offset} = ${DL_PAG}; DF = ${t.marco} × 4096 + ${t.offset} = ${t.df}. Si la DL viene en decimal: DL / tamaño de página da la página y el **resto** es el desplazamiento.`,
        resaltar: ['df', 'dl'],
        valores: { cuenta: `${t.marco} × 4096 + ${t.offset} = ${t.df}` },
      },
    ],
  }
}

// ── Segmentación paginada ──

const segPaginada: Recorrido = {
  ancho: 720,
  alto: 300,
  titulo: 'Segmentación paginada: una tabla de páginas por segmento',
  cuerpo: [
    texto(30, 34, 'DL', { clase: 'rm-rotulo' }),
    celdaM('dl-s', 40, 20, 80, 28, 'seg 1'),
    celdaM('dl-p', 120, 20, 80, 28, 'pág 2'),
    celdaM('dl-o', 200, 20, 90, 28, '0x0F0'),
    panelLeyenda(30, 90, 200, 150, 'Tabla de segmentos'),
    tablaM('ts', 50, 116, 160, 30, [
      ['0 → TP del seg 0'],
      ['1 → TP del seg 1'],
      ['2 → TP del seg 2'],
    ]),
    panelLeyenda(280, 90, 180, 150, 'TP del segmento 1'),
    tablaM('tp', 300, 116, 140, 30, [['0 → marco 7'], ['1 → marco 5'], ['2 → marco 9']]),
    panelLeyenda(510, 90, 190, 150, 'Memoria real'),
    celdaM('marco', 530, 130, 150, 32, 'marco 9'),
    celdaM('dato', 530, 176, 150, 32, 'dato (+0x0F0)'),
    arista('M80,48 L80,112', { el: 'f-1', punta: true }),
    arista('M210,161 L298,180', { el: 'f-2', punta: true, oculto: true }),
    arista('M440,191 L528,150', { el: 'f-3', punta: true, oculto: true }),
    texto(360, 280, '', { val: 'c-mem', clase: 'rm-resumen' }),
  ],
  pasos: [
    {
      titulo: 'Tres campos.',
      texto:
        'Primero se divide el proceso en segmentos (código, pila, datos…) y después **cada segmento se pagina**. La DL es (segmento, página, desplazamiento).',
      resaltar: ['dl-s', 'dl-p', 'dl-o'],
      valores: { 'c-mem': 'accesos a memoria: 0' },
    },
    {
      titulo: 'Tabla de segmentos.',
      texto: 'La entrada del segmento 1 no apunta a datos sino a **su tabla de páginas**.',
      resaltar: ['dl-s', 'f-1', 'ts-1-0'],
      clases: { 'ts-1-0': 'rc-ok' },
      valores: { 'c-mem': 'accesos a memoria: 1' },
    },
    {
      titulo: 'Tabla de páginas del segmento.',
      texto: 'La página 2 del segmento 1 está en el marco 9.',
      resaltar: ['dl-p', 'f-2', 'tp-2-0'],
      mostrar: ['f-2'],
      clases: { 'tp-2-0': 'rc-ok' },
      valores: { 'c-mem': 'accesos a memoria: 2' },
    },
    {
      titulo: 'El dato.',
      texto:
        'DF = (9, 0x0F0): **3 accesos a memoria**. A cambio, no hay fragmentación externa y los permisos se ponen por segmento; la interna queda en la última página de cada segmento.',
      resaltar: ['dl-o', 'f-3', 'marco', 'dato'],
      mostrar: ['f-3'],
      clases: { dato: 'rc-ok' },
      valores: { 'c-mem': 'accesos a memoria: 3' },
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'binding-direcciones': binding(),
  'proteccion-base-limite': proteccion(),
  'particionamiento-fijo': fijo(),
  'particionamiento-dinamico': dinamico(),
  'algoritmos-ubicacion': ubicacion(),
  'buddy-system': buddyRecorrido(),
  'traduccion-segmentacion': segmentacion(),
  'traduccion-paginacion': paginacion(),
  'segmentacion-paginada': segPaginada,
}
