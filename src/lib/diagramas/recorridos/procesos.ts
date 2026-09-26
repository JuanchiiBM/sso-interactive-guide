/** Recorridos del tema Procesos. */
import { ALTO_ESTADO, ANCHO_ESTADO, ESTADOS, lienzoEstadosProceso } from '../index'
import { arista, bloque, carril, insignia, nodo, tarjeta } from '../primitivas-procesos'
import type { Recorrido } from '../recorrido'
import { texto } from '../svg'

// la ficha va en la esquina superior derecha de cada estado
const lugares = Object.fromEntries(
  Object.entries(ESTADOS).map(([k, { x, y }]) => [
    k,
    { x: x + ANCHO_ESTADO / 2 - 4, y: y - ALTO_ESTADO / 2 + 2 },
  ]),
)

const estadosProceso: Recorrido = {
  ...lienzoEstadosProceso(),
  titulo: 'Un proceso recorriendo el diagrama de 5 estados',
  fichas: { p1: 'P1' },
  lugares,
  pasos: [
    {
      titulo: 'New.',
      texto: 'El SO crea P1: le asigna un PID y arma su PCB. Todavía no compite por la CPU.',
      resaltar: ['new'],
      fichas: { p1: 'new' },
    },
    {
      titulo: 'Admitido.',
      texto: 'El planificador de largo plazo lo admite y P1 entra a la cola de listos.',
      resaltar: ['admitido', 'ready'],
      fichas: { p1: 'ready' },
    },
    {
      titulo: 'Dispatch.',
      texto: 'El planificador de corto plazo lo elige: P1 pasa a usar la CPU.',
      resaltar: ['dispatch', 'running'],
      fichas: { p1: 'running' },
    },
    {
      titulo: 'Fin de quantum.',
      texto:
        'Llega la interrupción de clock y el SO lo desaloja. Vuelve a **Ready**: no espera nada, solo le falta la CPU.',
      resaltar: ['desalojo', 'ready'],
      fichas: { p1: 'ready' },
    },
    {
      titulo: 'Dispatch otra vez.',
      texto: 'Le vuelve a tocar la CPU.',
      resaltar: ['dispatch', 'running'],
      fichas: { p1: 'running' },
    },
    {
      titulo: 'Espera un evento.',
      texto:
        'Hace una syscall bloqueante, por ejemplo un `read` de disco. Queda en Blocked hasta que termine la E/S.',
      resaltar: ['espera', 'blocked'],
      fichas: { p1: 'blocked' },
    },
    {
      titulo: 'Ocurre el evento.',
      texto:
        'Termina la E/S y una interrupción avisa al SO. P1 pasa a **Ready**, no a Running: Blocked → Running no existe.',
      resaltar: ['evento', 'ready'],
      fichas: { p1: 'ready' },
    },
    {
      titulo: 'Dispatch.',
      texto: 'Lo eligen de nuevo y sigue desde donde quedó.',
      resaltar: ['dispatch', 'running'],
      fichas: { p1: 'running' },
    },
    {
      titulo: 'Termina.',
      texto:
        'Hace `exit`. Se liberan sus recursos, pero el PCB queda con el valor de retorno hasta que el padre lo lea.',
      resaltar: ['termina', 'exit'],
      fichas: { p1: 'exit' },
    },
  ],
}

// ── Árbol de procesos: huérfano y zombie ──
const NW = 128
const NH = 44
const ARBOL = {
  init: { x: 470, y: 40 },
  a: { x: 260, y: 125 },
  b: { x: 140, y: 215 },
  c: { x: 380, y: 215 },
  d: { x: 140, y: 305 },
}
type NodoArbol = keyof typeof ARBOL
const ramaArbol = (de: NodoArbol, a: NodoArbol, extra: Parameters<typeof arista>[1] = {}) => {
  const p = ARBOL[de]
  const h = ARBOL[a]
  return arista(`M${p.x},${p.y + NH / 2} L${h.x},${h.y - NH / 2}`, {
    el: `e-${de}-${a}`,
    oculto: true,
    ...extra,
  })
}
const nodoArbol = (k: NodoArbol, nombre: string, linea: string, oculto = true) =>
  nodo(ARBOL[k].x, ARBOL[k].y, NW, NH, nombre, linea, { el: k, oculto, val: `pid-${k}` })
const zombie = (k: NodoArbol) =>
  insignia(ARBOL[k].x + NW / 2 + 16, ARBOL[k].y, 'Z', { el: `z-${k}`, oculto: true })

const arbolProcesos: Recorrido = {
  ancho: 720,
  alto: 340,
  titulo: 'Árbol de procesos: un huérfano adoptado por init y un zombie',
  cuerpo: [
    ramaArbol('init', 'a', { oculto: false }),
    ramaArbol('a', 'b'),
    ramaArbol('a', 'c'),
    ramaArbol('b', 'd'),
    // D se reconecta a init (no al abuelo A)
    arista(`M${ARBOL.init.x},${ARBOL.init.y + NH / 2} L170,${ARBOL.d.y - NH / 2}`, {
      el: 'e-init-d',
      oculto: true,
      clase: 'rp-adopcion',
      etiqueta: 'adopción',
      lx: 252,
      ly: 256,
    }),
    nodoArbol('init', 'init', 'PID 1', false),
    nodoArbol('a', 'A', 'PID 10 · PPID 1', false),
    nodoArbol('b', 'B', 'PID 11 · PPID 10'),
    nodoArbol('c', 'C', 'PID 12 · PPID 10'),
    nodoArbol('d', 'D', 'PID 13 · PPID 11'),
    zombie('b'),
    zombie('c'),
    `<g data-el="wait" data-rc-oculto>${texto(128, 125, 'wait()', { clase: 'rp-nota', val: 'wait' })}</g>`,
  ],
  pasos: [
    {
      titulo: 'init crea a A.',
      texto:
        '`init` (PID 1) es el primer proceso y el ancestro de todos. Hace `fork` y nace A, con PPID 1.',
      resaltar: ['init', 'a', 'e-init-a'],
    },
    {
      titulo: 'A hace fork dos veces.',
      texto:
        'Nacen B y C, los dos con PPID 10. Un padre puede tener **N** hijos: no es un árbol binario.',
      resaltar: ['a', 'b', 'c', 'e-a-b', 'e-a-c'],
      mostrar: ['b', 'c', 'e-a-b', 'e-a-c'],
    },
    {
      titulo: 'B hace fork.',
      texto: 'Nace D, hijo de B: su PPID es 11. A es su abuelo.',
      resaltar: ['b', 'd', 'e-b-d'],
      mostrar: ['d', 'e-b-d'],
    },
    {
      titulo: 'Muere B: D queda huérfano.',
      texto:
        'D **sigue ejecutando** y lo adopta `init` (o un subreaper, si hay), no el abuelo A: su PPID pasa a 1. B queda zombie hasta que A lo recoja.',
      resaltar: ['b', 'z-b', 'd', 'e-init-d', 'init'],
      clases: { b: 'rc-aviso' },
      mostrar: ['z-b', 'e-init-d'],
      ocultar: ['e-b-d'],
      valores: { 'pid-d': 'PID 13 · PPID 1' },
    },
    {
      titulo: 'A hace wait y recoge a B.',
      texto:
        '`wait()` le entrega a A el valor de retorno de B. Recién ahí el SO libera el PCB de B y desaparece de la tabla.',
      resaltar: ['a', 'wait'],
      mostrar: ['wait'],
      ocultar: ['b', 'z-b', 'e-a-b'],
      valores: { wait: 'wait() → B' },
    },
    {
      titulo: 'C termina y queda zombie.',
      texto:
        'C hace `exit`: se liberan sus recursos, pero el PCB queda con el valor de retorno. Como A todavía no hizo `wait`, C queda **zombie** (Z).',
      resaltar: ['c', 'z-c'],
      clases: { c: 'rc-aviso' },
      mostrar: ['z-c'],
      ocultar: ['wait'],
    },
    {
      titulo: 'A hace wait y recoge a C.',
      texto: 'Ahora sí se libera el PCB de C. Quedan `init`, A y D, que ahora es hijo de `init`.',
      resaltar: ['a', 'wait', 'init', 'd'],
      mostrar: ['wait'],
      ocultar: ['c', 'z-c', 'e-a-c'],
      valores: { wait: 'wait() → C' },
    },
  ],
}

// ── fork(); fork(); ──
const FW = 140
const FH = 46
const FORK = {
  p: { x: 520, y: 50 },
  h1: { x: 420, y: 150 },
  h2: { x: 640, y: 150 },
  h3: { x: 420, y: 250 },
}
type NodoFork = keyof typeof FORK
const LINEAS_Y = [80, 115, 150]
// cada proceso tiene su propio PC: una columna de fichas por proceso al costado del código
const COLUMNA: Record<NodoFork, number> = { p: 34, h1: 62, h2: 90, h3: 118 }
const lugaresFork = Object.fromEntries(
  Object.entries(COLUMNA).flatMap(([k, x]) => LINEAS_Y.map((y, i) => [`${k}-l${i + 1}`, { x, y }])),
)
const nodoFork = (k: NodoFork, nombre: string, linea: string) =>
  nodo(FORK[k].x, FORK[k].y, FW, FH, nombre, linea, {
    clase: 'dg-activo',
    el: k,
    oculto: k !== 'p',
    val: `ret-${k}`,
  })
const ramaFork = (de: NodoFork, a: NodoFork, etiqueta: string, lx: number, ly: number) =>
  arista(`M${FORK[de].x},${FORK[de].y + FH / 2} L${FORK[a].x},${FORK[a].y - FH / 2}`, {
    el: `e-${a}`,
    oculto: true,
    etiqueta,
    lx,
    ly,
  })

const forkFork: Recorrido = {
  ancho: 720,
  alto: 310,
  titulo: 'fork(); fork(); — el árbol de procesos crece llamada a llamada',
  cuerpo: [
    `<g class="dg-panel"><rect x="16" y="30" width="284" height="140" rx="12"/><text x="30" y="48">código · cada ficha es un PC</text></g>`,
    ...['fork();', 'fork();', 'printf("hola\\n");'].map((l, i) =>
      texto(140, LINEAS_Y[i], l, { clase: 'rp-codigo' }),
    ),
    texto(158, 192, 'procesos: 1', { val: 'procesos' }),
    `<g class="rp-salida" data-el="salida" data-rc-oculto><rect x="16" y="208" width="284" height="92" rx="8"/>` +
      `<text class="dg-zona" x="30" y="224">salida</text>` +
      [0, 1, 2, 3].map((i) => texto(158, 232 + i * 17, 'hola')).join('') +
      `</g>`,
    ramaFork('p', 'h1', '1.º fork', 440, 92),
    ramaFork('p', 'h2', '2.º fork', 600, 92),
    ramaFork('h1', 'h3', '2.º fork', 462, 200),
    nodoFork('p', 'P · PID 100', 'todavía sin fork'),
    nodoFork('h1', 'H1 · PID 101', ''),
    nodoFork('h2', 'H2 · PID 102', ''),
    nodoFork('h3', 'H3 · PID 103', ''),
  ],
  fichas: { p: 'P', h1: 'H1', h2: 'H2', h3: 'H3' },
  lugares: lugaresFork,
  pasos: [
    {
      titulo: 'Un solo proceso.',
      texto: 'P arranca y su PC apunta a la línea 1. Hay **1** proceso.',
      resaltar: ['p'],
      fichas: { p: 'p-l1' },
    },
    {
      titulo: 'Primer fork.',
      texto:
        'P hace `fork` y nace H1: una copia con el mismo código y el PC en la **línea 2**. A P le devuelve el PID del hijo (101); a H1, **0**.',
      resaltar: ['p', 'h1', 'e-h1'],
      mostrar: ['h1', 'e-h1'],
      fichas: { p: 'p-l2', h1: 'h1-l2' },
      valores: { 'ret-p': '1.º → 101', 'ret-h1': '1.º → 0', procesos: 'procesos: 2' },
    },
    {
      titulo: 'Segundo fork, en P.',
      texto:
        'P ejecuta la línea 2 y nace H2, que arranca en la línea 3: ya pasó los dos `fork`, así que no crea a nadie más.',
      resaltar: ['p', 'h2', 'e-h2'],
      mostrar: ['h2', 'e-h2'],
      fichas: { p: 'p-l3', h2: 'h2-l3' },
      valores: { 'ret-p': '1.º → 101 · 2.º → 102', 'ret-h2': '2.º → 0', procesos: 'procesos: 3' },
    },
    {
      titulo: 'Segundo fork, en H1.',
      texto:
        'H1 también tiene la línea 2 por delante: hace su `fork` y nace H3. Qué fork corre primero, el de P o el de H1, lo decide el planificador.',
      resaltar: ['h1', 'h3', 'e-h3'],
      mostrar: ['h3', 'e-h3'],
      fichas: { h1: 'h1-l3', h3: 'h3-l3' },
      valores: { 'ret-h1': '1.º → 0 · 2.º → 103', 'ret-h3': '2.º → 0', procesos: 'procesos: 4' },
    },
    {
      titulo: 'printf.',
      texto:
        'Los 4 procesos llegan a la línea 3, así que "hola" se imprime **4 veces**. Con n `fork()` seguidos quedan 2ⁿ procesos.',
      resaltar: ['p', 'h1', 'h2', 'h3', 'salida'],
      mostrar: ['salida'],
    },
  ],
}

// ── Cambio de proceso: carriles P1 / SO / P2 en el tiempo, y los PCB ──
const CARRIL = { x0: 80, x1: 710, p1: 50, so: 100, p2: 150 }
const corte = (el: string, x: number, etiqueta: string) =>
  arista(`M${x},26 L${x},174`, { el, oculto: true, clase: 'rp-corte', etiqueta, lx: x, ly: 14 })

const cambioProceso: Recorrido = {
  ancho: 720,
  alto: 405,
  titulo: 'Cambio de proceso: de P1 a P2 pasando por el SO',
  cuerpo: [
    carril(CARRIL.p1, 40, 'P1', CARRIL.x0, CARRIL.x1),
    carril(CARRIL.so, 40, 'SO', CARRIL.x0, CARRIL.x1),
    carril(CARRIL.p2, 40, 'P2', CARRIL.x0, CARRIL.x1),
    bloque(82, CARRIL.p1, 178, 30, 'P1 ejecuta', { clase: 'rp-p1', el: 'p1-run' }),
    bloque(264, CARRIL.so, 88, 30, 'guarda', { clase: 'rp-so', el: 'so-guarda', oculto: true }),
    bloque(356, CARRIL.so, 88, 30, 'planifica', { clase: 'rp-so', el: 'so-planif', oculto: true }),
    bloque(448, CARRIL.so, 88, 30, 'carga', { clase: 'rp-so', el: 'so-carga', oculto: true }),
    bloque(540, CARRIL.p2, 168, 30, 'P2 ejecuta', { clase: 'rp-p2', el: 'p2-run', oculto: true }),
    corte('ms1', 262, 'clock → modo kernel'),
    corte('ms2', 538, 'modo usuario'),
    `<g data-el="overhead" data-rc-oculto>${texto(400, 190, 'overhead: ninguna aplicación avanza', { clase: 'rp-nota' })}</g>`,
    arista('M270,262 L214,262', {
      el: 'f-guarda',
      oculto: true,
      punta: true,
      etiqueta: 'guarda',
      lx: 242,
      ly: 246,
    }),
    arista('M510,262 L454,262', {
      el: 'f-carga',
      oculto: true,
      punta: true,
      etiqueta: 'carga',
      lx: 482,
      ly: 246,
    }),
    tarjeta(
      120,
      262,
      180,
      72,
      'PCB1',
      [
        { t: 'estado: Running', val: 'pcb1-estado' },
        { t: 'PC guardado: —', val: 'pcb1-pc' },
      ],
      { el: 'pcb1' },
    ),
    tarjeta(
      360,
      262,
      180,
      72,
      'Registros de la CPU',
      [
        { t: 'PC = 0x1A4 (de P1)', val: 'cpu-pc' },
        { t: 'PSW: modo usuario', val: 'cpu-modo' },
      ],
      { el: 'cpu', clase: 'dg-activo' },
    ),
    tarjeta(
      600,
      262,
      180,
      72,
      'PCB2',
      [
        { t: 'estado: Ready', val: 'pcb2-estado' },
        { t: 'PC guardado: 0x3F0', val: 'pcb2-pc' },
      ],
      { el: 'pcb2' },
    ),
    `<g data-el="syscall" data-rc-oculto>` +
      `<text class="dg-zona" x="14" y="324">En cambio, una syscall que no bloquea:</text>` +
      carril(352, 26, 'P1', CARRIL.x0, CARRIL.x1) +
      carril(382, 26, 'SO', CARRIL.x0, CARRIL.x1) +
      bloque(82, 352, 218, 20, 'P1 ejecuta', { clase: 'rp-p1' }) +
      bloque(304, 382, 76, 20, 'syscall', { clase: 'rp-so' }) +
      bloque(384, 352, 196, 20, 'P1 sigue', { clase: 'rp-p1' }) +
      texto(646, 382, 'sin process switch', { clase: 'rp-nota' }) +
      `</g>`,
  ],
  pasos: [
    {
      titulo: 'P1 ejecuta.',
      texto:
        'P1 está en Running, en modo usuario: sus registros están cargados en la CPU. Su PCB todavía no tiene ese contexto.',
      resaltar: ['p1-run', 'cpu', 'pcb1'],
    },
    {
      titulo: 'Interrupción de clock.',
      texto:
        'Vence el quantum: el hardware pasa a **modo kernel** y salta al manejador del SO. Es un mode switch; todavía no cambió el proceso.',
      resaltar: ['ms1', 'cpu'],
      mostrar: ['ms1'],
      valores: { 'cpu-modo': 'PSW: modo kernel' },
    },
    {
      titulo: 'Guarda el contexto en el PCB1.',
      texto:
        'El SO copia los registros de la CPU (PC, PSW y los demás) al PCB1, para que P1 pueda seguir después justo donde quedó.',
      resaltar: ['so-guarda', 'f-guarda', 'cpu', 'pcb1'],
      mostrar: ['so-guarda', 'f-guarda'],
      valores: { 'pcb1-pc': 'PC guardado: 0x1A4' },
    },
    {
      titulo: 'P1 pasa a Ready.',
      texto:
        'Actualiza su estado y lo pone en la cola de listos: no espera ningún evento, solo le sacaron la CPU.',
      resaltar: ['so-guarda', 'pcb1'],
      valores: { 'pcb1-estado': 'estado: Ready' },
    },
    {
      titulo: 'El planificador elige a P2.',
      texto: 'El planificador de corto plazo mira la cola de listos y elige a P2.',
      resaltar: ['so-planif', 'pcb2'],
      mostrar: ['so-planif'],
    },
    {
      titulo: 'Carga el contexto de P2.',
      texto:
        'Copia a la CPU los registros guardados en el PCB2: ahora el PC apunta a donde P2 había quedado.',
      resaltar: ['so-carga', 'f-carga', 'cpu', 'pcb2'],
      mostrar: ['so-carga', 'f-carga'],
      valores: { 'cpu-pc': 'PC = 0x3F0 (de P2)', 'pcb2-estado': 'estado: Running' },
    },
    {
      titulo: 'Vuelve a modo usuario y ejecuta P2.',
      texto:
        'Otro mode switch, ahora a usuario, y corre P2. Todo el tramo del SO fue **overhead**: ninguna aplicación avanzó.',
      resaltar: ['ms2', 'p2-run', 'so-guarda', 'so-planif', 'so-carga', 'overhead', 'cpu'],
      mostrar: ['ms2', 'p2-run', 'overhead'],
      valores: { 'cpu-modo': 'PSW: modo usuario' },
    },
    {
      titulo: 'Contraste: una syscall que no bloquea.',
      texto:
        'También hay dos mode switch (a kernel y de vuelta), pero sigue el **mismo** proceso: hay cambio de contexto sin **process switch**.',
      resaltar: ['syscall'],
      mostrar: ['syscall'],
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'estados-proceso': estadosProceso,
  'arbol-procesos': arbolProcesos,
  'fork-fork': forkFork,
  'cambio-proceso': cambioProceso,
}
