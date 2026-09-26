/** Recorridos del tema Planificación. */
import { bandeja, casilleros, cola } from '../primitivas-planificacion'
import type { Recorrido } from '../recorrido'
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

export const recorridos: Record<string, Recorrido> = {
  'vrr-cola-auxiliar': vrr,
  'tipos-planificadores': tiposPlanificadores,
  'desempate-catedra': desempate,
  'feedback-multinivel': feedback,
}
