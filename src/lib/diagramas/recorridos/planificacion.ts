/** Recorridos del tema Planificación. */
import { simularPlanificacion } from '../../simuladores/planificacion/simular'
import type { ConfigPlanificacion } from '../../simuladores/planificacion/tipos'
import { bandeja, casilleros, cola, recuadro } from '../primitivas-planificacion'
import { arista } from '../primitivas-procesos'
import { celda, eje } from '../primitivas-t3'
import type { Paso, Recorrido } from '../recorrido'
import { datoSieteEstados, lienzoSieteEstados } from '../siete-estados'
import { caja, flecha, oculto, texto } from '../svg'

// colas de 3 casilleros de 64 de ancho; el frente queda a la derecha, del lado de la CPU
const LISTOS = { x: 190, y: 80 }
const AUX = { x: 190, y: 200 }
const dato = (y: number, t: string, val?: string) => texto(594, y, t, { clase: 'rl-dato', val })

const vrr: Recorrido = {
  ancho: 720,
  alto: 300,
  titulo: 'Virtual Round Robin: la cola auxiliar y el quantum restante q*',
  cuerpo: [
    texto(160, 46, 'Listos (cola común)'),
    texto(160, 166, 'Auxiliar (prioridad)'),
    texto(150, 240, 'sale con q* = Q − usado', { clase: 'dg-etiqueta' }),
    texto(150, 118, 'sale con Q completo', { clase: 'dg-etiqueta' }),
    flecha('M30,80 L92,80', 'nuevos', 56, 64),
    flecha('M288,80 L403,100', 'dispatch', 346, 76, '', 'disp-comun'),
    flecha('M288,200 L403,122', 'va primero', 350, 176, '', 'disp-aux'),
    flecha('M470,137 L470,232', 'pide E/S', 510, 186, '', 'io'),
    flecha('M383,262 L250,262 L250,224', 'fin de E/S', 318, 254, '', 'fin-io'),
    flecha('M470,83 L470,26 L260,26 L260,56', 'fin de quantum', 365, 14, '', 'fin-q'),
    cola(LISTOS.x, LISTOS.y, 3, 64, 44, 'listos', 'dg-listo'),
    cola(AUX.x, AUX.y, 3, 64, 44, 'aux', 'rl-aux'),
    caja(470, 110, 130, 50, 'CPU', 'dg-activo', 'cpu'),
    caja(470, 262, 170, 56, 'Bloqueados\n(E/S)', 'dg-bloqueado', 'bloq'),
    `<g class="dg-panel"><rect x="575" y="60" width="135" height="140" rx="12"/>` +
      `<text x="589" y="82">Q = 3</text></g>`,
    dato(110, 'ejecuta: —', 'ejec'),
    dato(134, 'le queda: —', 'resta'),
    dato(158, 'P1 usó: 0', 'usado'),
    dato(182, 'q* de P1: —', 'qstar'),
  ],
  fichas: { p1: 'P1', p2: 'P2' },
  lugares: {
    ...casilleros('listos', LISTOS.x, LISTOS.y, 3, 64),
    ...casilleros('aux', AUX.x, AUX.y, 3, 64),
    cpu: { x: 506, y: 110 },
    bloq: { x: 530, y: 262 },
  },
  pasos: [
    {
      titulo: 'Arranque.',
      texto:
        'P1 es I/O bound y P2 es CPU bound; los dos esperan en la cola común, P1 primero. El quantum es Q = 3.',
      resaltar: ['listos'],
      fichas: { p1: 'listos-0', p2: 'listos-1' },
    },
    {
      titulo: 'P1 ejecuta.',
      texto:
        'La auxiliar está vacía, así que el planificador toma el primero de la común: P1 sale con el Q completo.',
      resaltar: ['disp-comun', 'cpu'],
      fichas: { p1: 'cpu', p2: 'listos-0' },
      valores: { ejec: 'ejecuta: P1', resta: 'le queda: 3' },
    },
    {
      titulo: 'P1 pide E/S.',
      texto:
        'Usó 1 de sus 3 u.t. y se bloquea sin agotar el quantum. En RR perdería lo que le sobró; **VRR se acuerda** de cuánto usó.',
      resaltar: ['io', 'bloq'],
      fichas: { p1: 'bloq' },
      valores: { ejec: 'ejecuta: —', resta: 'le queda: —', usado: 'P1 usó: 1' },
    },
    {
      titulo: 'P2 ejecuta.',
      texto: 'La auxiliar sigue vacía: sale P2 de la común, también con Q = 3.',
      resaltar: ['disp-comun', 'cpu'],
      fichas: { p2: 'cpu' },
      valores: { ejec: 'ejecuta: P2', resta: 'le queda: 3' },
    },
    {
      titulo: 'Termina la E/S de P1.',
      texto:
        'Como no había agotado el quantum, va a la **Auxiliar** con q* = Q − usado = 3 − 1 = 2. P2 no se desaloja: llegar a la auxiliar no interrumpe al que ejecuta.',
      resaltar: ['fin-io', 'aux'],
      fichas: { p1: 'aux-0' },
      valores: { resta: 'le queda: 1', qstar: 'q* de P1: 2' },
      clases: { aux: 'rc-ok' },
    },
    {
      titulo: 'P2 agota el quantum.',
      texto:
        'La interrupción de clock lo desaloja y vuelve al final de la **común**: no viene de una E/S, así que la auxiliar no le corresponde.',
      resaltar: ['fin-q', 'listos'],
      fichas: { p2: 'listos-0' },
      valores: { ejec: 'ejecuta: —', resta: 'le queda: —' },
    },
    {
      titulo: 'La auxiliar va primero.',
      texto:
        'Hay procesos en las dos colas y el planificador atiende antes la **Auxiliar**: ejecuta P1, pero solo con q* = 2, no con 3.',
      resaltar: ['disp-aux', 'aux', 'cpu'],
      fichas: { p1: 'cpu' },
      valores: { ejec: 'ejecuta: P1', resta: 'le queda: 2' },
      clases: { aux: '' },
    },
    {
      titulo: 'P1 agota su q*.',
      texto:
        'Ya usó 1 + 2 = 3, todo su quantum: va al final de la **común**, detrás de P2, no a la auxiliar. Cuando lo vuelvan a elegir de ahí arranca con Q = 3 completo.',
      resaltar: ['fin-q', 'listos'],
      fichas: { p1: 'listos-1' },
      valores: {
        ejec: 'ejecuta: —',
        resta: 'le queda: —',
        usado: 'P1 usó: 3',
        qstar: 'q* de P1: —',
      },
    },
  ],
}

// ── Tipos de planificadores sobre el modelo de 7 estados ──
const tiposPlanificadores: Recorrido = {
  ...lienzoSieteEstados(),
  titulo: 'Qué transiciones maneja cada planificador',
  cuerpo: [...lienzoSieteEstados().cuerpo, datoSieteEstados('plan', 'tres planificadores')],
  pasos: [
    {
      titulo: 'Tres planificadores.',
      texto:
        'Cada flecha del modelo de 7 estados la dispara alguien. Tres planificadores se reparten las decisiones, y cada uno trabaja a una escala de tiempo distinta.',
    },
    {
      titulo: 'Largo plazo: admisión.',
      texto:
        'Decide a quién se **admite**: New → Ready, o New → Ready/Suspended si no hay memoria, y libera al que termina. Admitir sube el grado de multiprogramación y finalizar lo baja.',
      resaltar: ['new', 'admitido', 'admitido-susp', 'ready', 'ready-susp', 'termina', 'exit'],
      valores: { plan: 'largo plazo · se ejecuta poco' },
    },
    {
      titulo: 'Mediano plazo: swapping.',
      texto:
        'Suspende (swap out) para liberar RAM y activa (swap in) cuando vuelve a haber lugar: son las 4 flechas entre memoria y disco. Swap out baja el grado de multiprogramación y swap in lo sube.',
      resaltar: [
        'susp-ready',
        'activar-ready',
        'susp-blocked',
        'activar-blocked',
        'ready-susp',
        'blocked-susp',
      ],
      valores: { plan: 'mediano plazo · cuando falta memoria' },
    },
    {
      titulo: 'Corto plazo: quién usa la CPU.',
      texto:
        'Elige cuál de los de Ready ejecuta (dispatch) y lo saca por fin de quantum o desalojo. Interviene en cada interrupción o syscall, así que es **el que más se ejecuta** y no cambia el grado de multiprogramación.',
      resaltar: ['dispatch', 'desalojo', 'ready', 'running'],
      valores: { plan: 'corto plazo · el más frecuente' },
    },
    {
      titulo: 'Lo que no decide ningún planificador.',
      texto:
        'Bloquearse lo provoca el propio proceso con una syscall bloqueante, y desbloquearse, la interrupción que avisa que ocurrió el evento. Por eso esas flechas no son de ningún planificador.',
      resaltar: ['espera', 'evento', 'evento-susp'],
      valores: { plan: 'eventos, no decisiones' },
    },
  ],
}

// ── Desempate de la cátedra: llegadas simultáneas a Listos ──
const FUENTE_W = 170
const LISTOS_D = { x: 530, y: 150 }
const nota = (x: number, y: number, t: string) => texto(x, y, t, { clase: 're-nota' })

const desempate: Recorrido = {
  ancho: 720,
  alto: 290,
  titulo: 'Llegadas simultáneas a Listos: el orden de la cátedra',
  cuerpo: [
    texto(LISTOS_D.x, 112, 'Listos (el frente es la derecha)'),
    flecha('M195,60 L350,60 L350,138 L398,138', 'interrupción de clock', 268, 46, '', 'f-clock'),
    flecha('M195,150 L398,150', 'fin de E/S', 290, 138, '', 'f-io'),
    flecha('M195,240 L350,240 L350,162 L398,162', 'syscall de creación', 268, 226, '', 'f-nuevo'),
    oculto(
      flecha('M662,150 L694,150 L694,14 L110,14 L110,31', 'dispatch', 420, 14, '', 'dispatch'),
    ),
    bandeja(110, 60, FUENTE_W, 50, 'CPU', 'cpu', 'dg-activo'),
    bandeja(110, 150, FUENTE_W, 50, 'Bloqueados', 'bloq', 'dg-bloqueado'),
    bandeja(110, 240, FUENTE_W, 50, 'New', 'new', 'dg-neutro'),
    cola(LISTOS_D.x, LISTOS_D.y, 4, 64, 48, 'listos', 'dg-listo'),
    ...['1º', '2º', '3º', '4º'].map((t, i) => nota(626 - i * 64, 188, t)),
    texto(LISTOS_D.x, 240, 'instante t: ¿en qué orden entran?', {
      clase: 're-dato-centro',
      val: 'motivo',
    }),
  ],
  fichas: { a: 'A', b: 'B', c: 'C', d: 'D' },
  lugares: {
    ...casilleros('listos', LISTOS_D.x, LISTOS_D.y, 4, 64),
    cpu: { x: 164, y: 60 },
    bloq: { x: 164, y: 150 },
    'new-c': { x: 144, y: 240 },
    'new-d': { x: 174, y: 240 },
  },
  pasos: [
    {
      titulo: 'Tres motivos en el mismo instante.',
      texto:
        'En t a A se le vence el quantum, B termina su E/S y se crean C y D. Todos van a la cola de Listos, pero entran de a uno: ¿en qué orden?',
      fichas: { a: 'cpu', b: 'bloq', c: 'new-c', d: 'new-d' },
    },
    {
      titulo: '1º: interrupción de clock.',
      texto:
        'A viene de la **interrupción de clock** (fin de quantum) y entra primero: las interrupciones se atienden antes que las syscalls, y entre ellas manda la de clock.',
      resaltar: ['f-clock', 'cpu', 'listos'],
      fichas: { a: 'listos-0' },
      valores: { motivo: 'A: interrupción de clock' },
    },
    {
      titulo: '2º: fin de evento.',
      texto:
        'B viene de la **interrupción por fin de E/S**. También es una interrupción, pero va después de la de clock.',
      resaltar: ['f-io', 'bloq', 'listos'],
      fichas: { b: 'listos-1' },
      valores: { motivo: 'B: interrupción de fin de E/S' },
    },
    {
      titulo: '3º: syscall de creación.',
      texto:
        'C y D llegan por una **syscall** de creación de proceso, que se atiende después de las interrupciones: van al final.',
      resaltar: ['f-nuevo', 'new', 'listos'],
      fichas: { c: 'listos-2', d: 'listos-3' },
      valores: { motivo: 'C y D: syscall de creación' },
    },
    {
      titulo: 'Empate por el mismo motivo.',
      texto:
        'C y D llegaron juntos y por lo mismo, así que sigue el empate: gana el **nombre que va antes en orden ascendente** (en los parciales, "en orden numérico"). C queda antes que D.',
      resaltar: ['listos'],
      valores: { motivo: 'mismo motivo: C antes que D' },
    },
    {
      titulo: 'El frente toma la CPU.',
      texto:
        'En una cola FIFO (FIFO, RR) el de corto plazo toma el frente: **A vuelve a ejecutar**, aunque recién lo desalojaron. Por eso el orden de llegada cambia el Gantt.',
      resaltar: ['dispatch', 'cpu', 'listos'],
      fichas: { a: 'cpu', b: 'listos-0', c: 'listos-1', d: 'listos-2' },
      valores: { motivo: 'quedan en cola: B, C, D' },
      mostrar: ['dispatch'],
    },
  ],
}

// ── Multinivel con retroalimentación: 3 colas, Q = 2 / 4 / 8 ──
const COLAS_FB = [70, 160, 250]
const CPU_FB = { x: 520, y: 160 }
const colaFb = (i: number, clase: string) => cola(260, COLAS_FB[i], 3, 64, 44, `c${i}`, clase)
const datoFb = (y: number, t: string, val: string) =>
  texto(CPU_FB.x, y, t, { clase: 're-dato-centro', val })

const feedback: Recorrido = {
  ancho: 720,
  alto: 340,
  titulo: 'Colas multinivel con retroalimentación: Q = 2, 4 y 8',
  cuerpo: [
    texto(164, 36, 'Cola 0 · Q = 2 · más prioridad', { clase: 're-izq' }),
    texto(164, 126, 'Cola 1 · Q = 4', { clase: 're-izq' }),
    texto(164, 216, 'Cola 2 · Q = 8 · menos prioridad', { clase: 're-izq' }),
    flecha('M40,70 L160,70', 'nuevo', 86, 56, '', 'nuevo'),
    flecha(`M356,70 L${CPU_FB.x - 59},146`, undefined, 0, 0, '', 'd0'),
    flecha(`M356,160 L${CPU_FB.x - 59},160`, 'dispatch', 410, 148, '', 'd1'),
    flecha(`M356,250 L${CPU_FB.x - 59},174`, undefined, 0, 0, '', 'd2'),
    flecha(
      'M560,188 L560,320 L110,320 L110,160 L160,160',
      'agota Q = 2: baja',
      250,
      332,
      '',
      'baja1',
    ),
    flecha(
      'M490,188 L490,300 L130,300 L130,250 L160,250',
      'agota Q = 4: baja',
      420,
      289,
      '',
      'baja2',
    ),
    flecha(`M${CPU_FB.x + 55},160 L616,160`, undefined, 0, 0, '', 'io'),
    colaFb(0, 'dg-listo'),
    colaFb(1, 'rl-aux'),
    colaFb(2, 're-cola-baja'),
    caja(CPU_FB.x, CPU_FB.y, 110, 56, 'CPU', 'dg-activo', 'cpu'),
    caja(665, 160, 90, 44, 'Bloqueado', 'dg-bloqueado', 'bloq'),
    datoFb(98, 'ejecuta: —', 'ejec'),
    datoFb(116, 'quantum restante: —', 'resta'),
  ],
  fichas: { p1: 'P1', p2: 'P2' },
  lugares: {
    ...casilleros('c0', 260, COLAS_FB[0], 3, 64),
    ...casilleros('c1', 260, COLAS_FB[1], 3, 64),
    ...casilleros('c2', 260, COLAS_FB[2], 3, 64),
    cpu: { x: CPU_FB.x + 34, y: CPU_FB.y },
    bloq: { x: 706, y: 140 },
  },
  pasos: [
    {
      titulo: 'Entra P1.',
      texto:
        'Todo proceso nuevo entra a la **cola 0**, la de mayor prioridad y quantum más chico. Todavía no se sabe si es CPU bound o I/O bound.',
      resaltar: ['nuevo', 'c0'],
      fichas: { p1: 'c0-0' },
    },
    {
      titulo: 'Ejecuta con Q = 2.',
      texto: 'Es el único listo: el planificador lo toma de la cola 0 con su quantum de 2.',
      resaltar: ['d0', 'cpu'],
      fichas: { p1: 'cpu' },
      valores: { ejec: 'ejecuta: P1 (cola 0)', resta: 'quantum restante: 2' },
    },
    {
      titulo: 'Agota el quantum y baja.',
      texto:
        'Usó las 2 u.t. sin terminar ni bloquearse: parece CPU bound, así que **baja a la cola 1**, con menos prioridad pero Q = 4.',
      resaltar: ['baja1', 'c1'],
      fichas: { p1: 'c1-0' },
      valores: { ejec: 'ejecuta: —', resta: 'quantum restante: —' },
    },
    {
      titulo: 'Ejecuta de la cola 1.',
      texto: 'La cola 0 está vacía, así que se atiende la 1: P1 sale con Q = 4.',
      resaltar: ['d1', 'cpu'],
      fichas: { p1: 'cpu' },
      valores: { ejec: 'ejecuta: P1 (cola 1)', resta: 'quantum restante: 4' },
    },
    {
      titulo: 'Lo vuelve a agotar.',
      texto:
        'Otra vez usa todo el quantum y **baja a la cola 2**, la última. De ahí ya no baja: si agota Q = 8, vuelve al final de la misma.',
      resaltar: ['baja2', 'c2'],
      fichas: { p1: 'c2-0' },
      valores: { ejec: 'ejecuta: —', resta: 'quantum restante: —' },
    },
    {
      titulo: 'Ejecuta de la cola 2.',
      texto: 'Las colas 0 y 1 están vacías: P1 ejecuta con Q = 8.',
      resaltar: ['d2', 'cpu'],
      fichas: { p1: 'cpu' },
      valores: { ejec: 'ejecuta: P1 (cola 2)', resta: 'quantum restante: 8' },
    },
    {
      titulo: 'Llega P2.',
      texto:
        'Llega un proceso nuevo cuando P1 lleva 3 de sus 8 u.t. Como todo nuevo, entra a la cola 0, que tiene más prioridad que la de P1.',
      resaltar: ['nuevo', 'c0', 'cpu'],
      fichas: { p2: 'c0-0' },
      valores: { resta: 'quantum restante: 5' },
    },
    {
      titulo: 'Desalojo entre colas.',
      texto:
        'Con desalojo entre colas, P2 le saca la CPU a P1, que vuelve al final de la **cola 2** sin bajar porque no agotó el quantum. Si el enunciado dice sin desalojo, P2 espera a que P1 suelte la CPU.',
      resaltar: ['d0', 'cpu', 'c2'],
      fichas: { p1: 'c2-0', p2: 'cpu' },
      valores: { ejec: 'ejecuta: P2 (cola 0)', resta: 'quantum restante: 2' },
    },
    {
      titulo: 'Se bloquea antes del quantum.',
      texto:
        'P2 usa 1 de sus 2 u.t. y pide E/S: como **no agotó** el quantum, no baja y al volver de la E/S entra otra vez a la cola 0. Mientras, P1 retoma la CPU con Q = 8.',
      resaltar: ['io', 'bloq', 'd2', 'cpu'],
      fichas: { p1: 'cpu', p2: 'bloq' },
      valores: { ejec: 'ejecuta: P1 (cola 2)', resta: 'quantum restante: 8' },
    },
  ],
}

// ── Round Robin con q chico y q grande: el Gantt sale del simulador ──
const PROCESOS_RR = [
  { id: 'A', llegada: 0, rafagas: [3] },
  { id: 'B', llegada: 0, rafagas: [1, 2, 1] },
  { id: 'C', llegada: 0, rafagas: [2] },
]
export const configRoundRobin = (quantum: number): ConfigPlanificacion => ({
  algoritmo: 'rr',
  quantum,
  procesos: PROCESOS_RR,
})
const FILAS_RR: Record<string, number> = { A: 206, B: 236, C: 266 }
const CELDA_X = 80
const CELDA_W = 70
const COLA_RR = { x: 190, y: 84 }
const simRR = (q: number) => simularPlanificacion(configRoundRobin(q))

/** Celdas de CPU y E/S de cada tick, ocultas hasta que su paso las muestre. */
function celdasRR(q: number) {
  return simRR(q).ticks.flatMap((t) => {
    const x = CELDA_X + t.t * CELDA_W
    const color = (id: string) => `ge-p${Object.keys(FILAS_RR).indexOf(id) + 1}`
    return [
      ...(t.cpu
        ? [
            celda(`c${q}-${t.t}`, x, FILAS_RR[t.cpu], CELDA_W, 26, `ge-cpu ${color(t.cpu)}`, {
              oculto: true,
            }),
          ]
        : []),
      ...t.io.map((id) =>
        celda(`e${q}-${t.t}`, x, FILAS_RR[id], CELDA_W, 26, `ge-io ${color(id)}`, { oculto: true }),
      ),
    ]
  })
}

interface TramoRR {
  /** Último tick que muestra el paso (-1: antes de arrancar). */
  hasta: number
  titulo: string
  texto: string
  resaltar?: string[]
  fin?: boolean
}

/** Pasos de una pestaña: celdas, fichas y contador salen de la simulación con ese quantum. */
function pasosRR(q: number, tramos: TramoRR[]): Paso[] {
  const { ticks } = simRR(q)
  let desde = 0
  return tramos.map((tr, i) => {
    const nuevos = ticks.slice(desde, tr.hasta + 1)
    desde = Math.max(desde, tr.hasta + 1)
    const celdas = nuevos.flatMap((t) => [
      ...(t.cpu ? [`c${q}-${t.t}`] : []),
      ...(t.io.length ? [`e${q}-${t.t}`] : []),
    ])
    const hasta = ticks.slice(0, Math.max(tr.hasta, 0) + 1)
    const cambios = hasta.filter(
      (t, k) => k > 0 && t.cpu && hasta[k - 1].cpu && t.cpu !== hasta[k - 1].cpu,
    ).length
    const fichas: Record<string, string | null> = { a: null, b: null, c: null }
    const tk = ticks[Math.max(tr.hasta, 0)]
    const cola = tr.hasta < 0 ? [tk.cpu!, ...tk.listos] : tk.listos
    if (!tr.fin) {
      cola.forEach((id, k) => (fichas[id.toLowerCase()] = `listos-${k}`))
      if (tr.hasta >= 0 && tk.cpu) fichas[tk.cpu.toLowerCase()] = 'cpu'
      tk.io.forEach((id) => (fichas[id.toLowerCase()] = 'io'))
    }
    const todas = ticks.flatMap((t) => [`c${q}-${t.t}`, ...(t.io.length ? [`e${q}-${t.t}`] : [])])
    return {
      titulo: tr.titulo,
      texto: tr.texto,
      resaltar: [...(tr.fin ? todas : celdas), ...(tr.resaltar ?? []), 'cambios'],
      fichas,
      mostrar: celdas,
      valores: {
        cambios: `cambios de contexto: ${cambios}`,
        ...(i === 0 ? { q: `q = ${q}` } : {}),
      },
    }
  })
}

const INICIO_RR = (q: number, porque: string): TramoRR => ({
  hasta: -1,
  titulo: `Tres procesos en t = 0, q = ${q}.`,
  texto: `A, B y C llegan juntos y por el mismo motivo, así que entran a Listos en orden alfabético. ${porque}`,
  resaltar: ['listos'],
})

const roundRobin: Recorrido = {
  ancho: 720,
  alto: 348,
  titulo: 'Round Robin con quantum chico y con quantum grande: el mismo set de procesos',
  cuerpo: [
    texto(50, COLA_RR.y, 'Listos'),
    texto(250, 52, 'frente', { clase: 're-nota' }),
    flecha('M400,59 L400,26 L130,26 L130,58', 'fin de quantum', 265, 14, '', 'fin-q'),
    flecha('M620,109 L620,140 L130,140 L130,110', 'fin de E/S', 370, 152, '', 'fin-io'),
    flecha('M282,84 L322,84', undefined, 0, 0, '', 'dispatch'),
    flecha('M475,84 L543,84', 'pide E/S', 509, 68, '', 'pide-io'),
    cola(COLA_RR.x, COLA_RR.y, 3, 60, 44, 'listos', 'dg-listo'),
    bandeja(400, 84, 150, 50, 'CPU', 'cpu', 'dg-activo'),
    bandeja(620, 84, 150, 50, 'E/S', 'io', 'dg-bloqueado'),
    texto(400, 124, 'q = ?', { clase: 're-nota', val: 'q' }),
    texto(325, 176, 'ráfagas: A = 3 · B = 1, E/S 2, 1 · C = 2', { clase: 're-nota' }),
    ...Object.entries(FILAS_RR).map(([id, y]) => texto(50, y, id)),
    ...Array.from({ length: 7 }, (_, t) =>
      Object.values(FILAS_RR).map(
        (y) =>
          `<rect class="ge-vacia" x="${CELDA_X + t * CELDA_W + 1}" y="${y - 12}" width="${CELDA_W - 2}" height="24" rx="3"/>`,
      ),
    ).flat(),
    ...celdasRR(1),
    ...celdasRR(3),
    ...eje(CELDA_X, 292, CELDA_W, 7),
    `<rect class="ge-cpu t3p-ref" x="612" y="208" width="18" height="18" rx="3"/>`,
    texto(660, 217, 'CPU'),
    `<rect class="ge-io t3p-ref" x="612" y="238" width="18" height="18" rx="3"/>`,
    texto(660, 247, 'E/S'),
    recuadro(325, 326, 280, 32, 'cambios', 'cambios', 'cambios de contexto: 0'),
  ],
  fichas: { a: 'A', b: 'B', c: 'C' },
  lugares: {
    ...casilleros('listos', COLA_RR.x, COLA_RR.y, 3, 60),
    cpu: { x: 440, y: 84 },
    io: { x: 660, y: 84 },
  },
  variantes: [
    {
      nombre: 'q = 1 (chico)',
      pasos: pasosRR(1, [
        INICIO_RR(1, 'B hace 1 u.t. de CPU, 2 de E/S y 1 más de CPU.'),
        {
          hasta: 0,
          titulo: 'Ejecuta A.',
          texto:
            'Toma la CPU con q = 1: a la u.t. la interrupción de clock lo corta, aunque le quedan 2.',
          resaltar: ['dispatch', 'cpu'],
        },
        {
          hasta: 1,
          titulo: 'A al final, entra B.',
          texto:
            'A vuelve al **final** de Listos, detrás de C. B toma la CPU y en esa u.t. termina su primera ráfaga.',
          resaltar: ['fin-q', 'listos', 'cpu'],
        },
        {
          hasta: 2,
          titulo: 'B se bloquea, entra C.',
          texto:
            'B pide E/S y deja la CPU: ahí no hubo interrupción de clock, se fue solo. Ejecuta C.',
          resaltar: ['pide-io', 'io', 'cpu'],
        },
        {
          hasta: 3,
          titulo: 'C al final, vuelve A.',
          texto: 'A C también se le vence el quantum y va detrás de A, que retoma la CPU.',
          resaltar: ['fin-q', 'listos', 'cpu'],
        },
        {
          hasta: 4,
          titulo: 'Dos llegan juntos.',
          texto:
            'En t = 4 a A se le vence el quantum y B termina su E/S: entra primero A (clock) y después B (fin de E/S), como pide el desempate de la cátedra. Ejecuta C, que estaba adelante.',
          resaltar: ['fin-q', 'fin-io', 'listos', 'cpu'],
        },
        {
          hasta: 5,
          titulo: 'C termina, ejecuta A.',
          texto: 'C completó sus 2 u.t. A hace la última de las suyas.',
          resaltar: ['dispatch', 'cpu'],
        },
        {
          hasta: 6,
          titulo: 'A termina, ejecuta B.',
          texto: 'B hace su última ráfaga y termina en t = 7.',
          resaltar: ['dispatch', 'cpu'],
        },
        {
          hasta: 6,
          fin: true,
          titulo: '6 cambios en 7 u.t.',
          texto:
            'Hay un cambio de contexto casi en cada u.t.: con q chico **el overhead es alto**, a cambio de que todos arranquen enseguida.',
          resaltar: ['cambios'],
        },
      ]),
    },
    {
      nombre: 'q = 3 (grande)',
      pasos: pasosRR(3, [
        INICIO_RR(3, 'q = 3 es tan grande como la ráfaga de CPU más larga, la de A.'),
        {
          hasta: 2,
          titulo: 'A ejecuta de corrido.',
          texto: 'Su ráfaga de 3 entra en el quantum: termina sin que el clock lo corte.',
          resaltar: ['dispatch', 'cpu'],
        },
        {
          hasta: 3,
          titulo: 'B usa 1 de 3 y se bloquea.',
          texto:
            'Pide E/S antes de agotar el quantum: **lo que le sobró (2) se pierde**, no lo guarda para la vuelta.',
          resaltar: ['cpu', 'pide-io'],
        },
        {
          hasta: 5,
          titulo: 'C ejecuta de corrido.',
          texto: 'Mientras B hace su E/S, C usa sus 2 u.t. y termina.',
          resaltar: ['dispatch', 'cpu', 'io'],
        },
        {
          hasta: 6,
          titulo: 'B vuelve con q entero.',
          texto:
            'Termina su E/S en t = 6 y arranca con un quantum nuevo de 3, aunque solo necesita 1.',
          resaltar: ['fin-io', 'cpu'],
        },
        {
          hasta: 6,
          fin: true,
          titulo: '3 cambios: igual que FIFO.',
          texto:
            'Ningún quantum llegó a vencer: con q ≥ la ráfaga más larga, RR da **el mismo Gantt que FIFO**. Hay menos cambios de contexto, pero el último en la cola espera más.',
          resaltar: ['cambios'],
        },
      ]),
    },
  ],
}

// ── Modelo de colas: Ready, CPU y una cola por dispositivo ──
const COLA_R = { x: 220, y: 80 }
const DISP = { disco: 190, impr: 260 }

const colasDispositivos: Recorrido = {
  ancho: 720,
  alto: 326,
  titulo: 'La cola de Ready, la CPU y una cola por cada dispositivo de E/S',
  cuerpo: [
    texto(52, COLA_R.y, 'Ready'),
    texto(310, 48, 'frente', { clase: 're-nota' }),
    flecha(
      'M470,55 L470,24 L130,24 L130,56',
      'fin de quantum: al final de Ready',
      300,
      12,
      '',
      'fin-q',
    ),
    flecha('M342,80 L398,80', undefined, 0, 0, '', 'dispatch'),
    arista('M470,105 L470,140 L215,140 L215,190', {
      el: 'pide-io',
      etiqueta: 'pide E/S',
      lx: 340,
      ly: 128,
    }),
    arista('M215,190 L248,190', { el: 'a-disco', punta: true }),
    arista('M215,190 L215,260 L248,260', { el: 'a-impr', punta: true }),
    arista('M595,190 L630,190', { el: 'sal-disco' }),
    arista('M595,260 L630,260', { el: 'sal-impr' }),
    flecha(
      'M630,190 L630,300 L130,300 L130,105',
      'fin de E/S: al final de Ready',
      380,
      312,
      '',
      'fin-io',
    ),
    cola(COLA_R.x, COLA_R.y, 4, 60, 46, 'listos', 'dg-listo'),
    bandeja(470, 80, 140, 50, 'CPU', 'cpu', 'dg-activo'),
    texto(340, 160, 'cola del disco', { clase: 're-nota' }),
    cola(340, DISP.disco, 3, 60, 40, 'cola-disco', 'dg-bloqueado'),
    bandeja(520, DISP.disco, 150, 44, 'Disco', 'disco', 'dg-bloqueado'),
    texto(340, 230, 'cola de la impresora', { clase: 're-nota' }),
    cola(340, DISP.impr, 3, 60, 40, 'cola-impr', 'dg-bloqueado'),
    bandeja(520, DISP.impr, 150, 44, 'Impresora', 'impr', 'dg-bloqueado'),
  ],
  fichas: { p1: 'P1', p2: 'P2', p3: 'P3', p4: 'P4' },
  lugares: {
    ...casilleros('listos', COLA_R.x, COLA_R.y, 4, 60),
    ...casilleros('disco', 340, DISP.disco, 3, 60),
    cpu: { x: 510, y: 80 },
    'usa-disco': { x: 560, y: DISP.disco },
    'usa-impr': { x: 564, y: DISP.impr },
  },
  pasos: [
    {
      titulo: 'Arranque.',
      texto:
        'P1, P2 y P3 esperan la CPU en la cola de Ready; P4 está usando el disco. Cada recurso tiene **su propia cola**.',
      resaltar: ['listos', 'disco'],
      fichas: { p1: 'listos-0', p2: 'listos-1', p3: 'listos-2', p4: 'usa-disco' },
    },
    {
      titulo: 'Dispatch.',
      texto: 'El planificador de corto plazo toma el frente de Ready: P1 pasa a la CPU.',
      resaltar: ['dispatch', 'cpu', 'listos'],
      fichas: { p1: 'cpu', p2: 'listos-0', p3: 'listos-1' },
    },
    {
      titulo: 'P1 pide el disco.',
      texto:
        'Hace una syscall de E/S y deja la CPU. El disco está ocupado con P4, así que P1 espera en la **cola del disco**, no en Ready.',
      resaltar: ['pide-io', 'a-disco', 'cola-disco'],
      fichas: { p1: 'disco-0' },
    },
    {
      titulo: 'La CPU no queda ociosa.',
      texto: 'Con P1 bloqueado se despacha el siguiente de Ready: P2.',
      resaltar: ['dispatch', 'cpu', 'listos'],
      fichas: { p2: 'cpu', p3: 'listos-0' },
    },
    {
      titulo: 'P2 agota su quantum.',
      texto:
        'La interrupción de clock lo desaloja y vuelve al **final** de Ready: sigue listo, no espera nada.',
      resaltar: ['fin-q', 'listos'],
      fichas: { p2: 'listos-1' },
    },
    {
      titulo: 'Ejecuta P3.',
      texto: 'Sale el frente de Ready, que ahora es P3.',
      resaltar: ['dispatch', 'cpu', 'listos'],
      fichas: { p3: 'cpu', p2: 'listos-0' },
    },
    {
      titulo: 'Termina la E/S de P4.',
      texto:
        'La interrupción del disco lo devuelve al final de Ready. El disco atiende su cola en **FIFO**: ahora toma a P1.',
      resaltar: ['sal-disco', 'fin-io', 'listos', 'disco', 'cola-disco'],
      fichas: { p4: 'listos-1', p1: 'usa-disco' },
    },
    {
      titulo: 'P3 pide la impresora.',
      texto:
        'Es otro dispositivo, con su propia cola; como está libre, P3 la usa enseguida sin esperar.',
      resaltar: ['pide-io', 'a-impr', 'impr'],
      fichas: { p3: 'usa-impr' },
    },
    {
      titulo: 'Y otra vez dispatch.',
      texto:
        'La CPU se libera y sale P2. En todo momento un proceso está en **una sola cola**: la de Ready o la de un dispositivo.',
      resaltar: ['dispatch', 'cpu', 'listos'],
      fichas: { p2: 'cpu', p4: 'listos-0' },
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'vrr-cola-auxiliar': vrr,
  'tipos-planificadores': tiposPlanificadores,
  'desempate-catedra': desempate,
  'feedback-multinivel': feedback,
  'rr-quantum': roundRobin,
  'colas-dispositivos': colasDispositivos,
}
