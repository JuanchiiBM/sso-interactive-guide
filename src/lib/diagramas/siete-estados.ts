/** Dibujo del modelo de 7 estados con zonas RAM y disco; lo reusan los recorridos de Procesos y Planificación. */
import { caja, flecha, texto, type Lienzo } from './svg'

const W = 112
const H = 40
const HS = 44

/** Centro de cada estado (la ficha se ubica con `lugaresSieteEstados`). */
export const SIETE_ESTADOS = {
  new: { x: 70, y: 90 },
  ready: { x: 250, y: 90 },
  running: { x: 470, y: 90 },
  exit: { x: 650, y: 90 },
  blocked: { x: 470, y: 210 },
  'ready-susp': { x: 250, y: 340 },
  'blocked-susp': { x: 470, y: 340 },
}

/** Esquina superior derecha de cada estado; con `corrida`, la ficha se corre a la izquierda. */
export function lugaresSieteEstados(corrida = 0) {
  return Object.fromEntries(
    Object.entries(SIETE_ESTADOS).map(([k, { x, y }]) => {
      const h = k.endsWith('-susp') ? HS : H
      return [k, { x: x + W / 2 - 4 - corrida, y: y - h / 2 + 2 }]
    }),
  )
}

const zona = (y: number, h: number, nombre: string, clase: string) =>
  `<g class="re-zona ${clase}"><rect x="6" y="${y}" width="708" height="${h}" rx="12"/>` +
  `<text x="20" y="${y + 18}">${nombre}</text></g>`

export function lienzoSieteEstados(): Lienzo {
  const s = SIETE_ESTADOS
  const r = s.ready
  const b = s.blocked
  const rs = s['ready-susp']
  const bs = s['blocked-susp']
  return {
    ancho: 720,
    alto: 400,
    titulo: 'Modelo de 7 estados: memoria principal y disco',
    cuerpo: [
      zona(6, 258, 'Memoria principal', 're-zona-ram'),
      zona(282, 112, 'Disco (área de swap)', 're-zona-disco'),
      flecha(
        `M${s.new.x + W / 2},${r.y} L${r.x - W / 2 - 4},${r.y}`,
        'admitido',
        160,
        76,
        '',
        'admitido',
      ),
      flecha(
        `M${r.x + W / 2},${r.y - 8} L${s.running.x - W / 2 - 4},${r.y - 8}`,
        'dispatch',
        360,
        68,
        '',
        'dispatch',
      ),
      flecha(
        `M${s.running.x - W / 2},${r.y + 10} L${r.x + W / 2 + 4},${r.y + 10}`,
        'timeout / desalojo',
        375,
        122,
        '',
        'desalojo',
      ),
      flecha(
        `M${s.running.x + W / 2},${r.y} L${s.exit.x - W / 2 - 4},${r.y}`,
        'termina',
        560,
        76,
        '',
        'termina',
      ),
      flecha(
        `M${b.x},${r.y + H / 2} L${b.x},${b.y - H / 2 - 4}`,
        'espera un evento',
        540,
        150,
        '',
        'espera',
      ),
      flecha(
        `M${b.x - W / 2},${b.y} L${r.x + 30},${r.y + H / 2 + 4}`,
        'ocurre el evento',
        340,
        205,
        '',
        'evento',
      ),
      flecha(
        `M${r.x - 18},${r.y + H / 2} L${rs.x - 18},${rs.y - HS / 2 - 4}`,
        'swap out',
        190,
        273,
        '',
        'susp-ready',
      ),
      flecha(
        `M${rs.x + 18},${rs.y - HS / 2} L${r.x + 18},${r.y + H / 2 + 4}`,
        'swap in',
        310,
        273,
        '',
        'activar-ready',
      ),
      flecha(
        `M${b.x - 18},${b.y + H / 2} L${bs.x - 18},${bs.y - HS / 2 - 4}`,
        'swap out',
        410,
        273,
        '',
        'susp-blocked',
      ),
      flecha(
        `M${bs.x + 18},${bs.y - HS / 2} L${b.x + 18},${b.y + H / 2 + 4}`,
        'swap in',
        530,
        273,
        '',
        'activar-blocked',
      ),
      flecha(
        `M${bs.x - W / 2},${bs.y} L${rs.x + W / 2 + 4},${rs.y}`,
        'ocurre el evento',
        360,
        382,
        '',
        'evento-susp',
      ),
      flecha(
        `M${s.new.x},${s.new.y + H / 2} L${rs.x - W / 2 - 4},${rs.y}`,
        'sin memoria',
        62,
        215,
        '',
        'admitido-susp',
      ),
      caja(s.new.x, s.new.y, W, H, 'New', 'dg-neutro', 'new'),
      caja(r.x, r.y, W, H, 'Ready', 'dg-listo', 'ready'),
      caja(s.running.x, s.running.y, W, H, 'Running', 'dg-activo', 'running'),
      caja(s.exit.x, s.exit.y, W, H, 'Exit', 'dg-neutro', 'exit'),
      caja(b.x, b.y, W, H, 'Blocked', 'dg-bloqueado', 'blocked'),
      caja(rs.x, rs.y, W, HS, 'Ready/\nSuspended', 'dg-listo re-susp', 'ready-susp'),
      caja(bs.x, bs.y, W, HS, 'Blocked/\nSuspended', 'dg-bloqueado re-susp', 'blocked-susp'),
    ],
  }
}

/** Texto fijo arriba a la derecha de la zona de memoria (cambia por paso con `val`). */
export const datoSieteEstados = (val: string, inicial: string) =>
  texto(700, 24, inicial, { clase: 're-dato', val })
