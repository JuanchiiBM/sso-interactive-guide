/** Recorridos del tema Planificación. */
import { casilleros, cola } from '../primitivas-planificacion'
import type { Recorrido } from '../recorrido'
import { caja, flecha, texto } from '../svg'

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

export const recorridos: Record<string, Recorrido> = {
  'vrr-cola-auxiliar': vrr,
}
