/** Diagramas fijos de la teoría, referenciados desde markdown con ```diagrama <id>. */
import { caja, flecha, marco, rombo, type Lienzo } from './svg'

const W = 112
const H = 40

/** Posición de cada estado del diagrama de 5 estados (la usa también su recorrido). */
export const ESTADOS = {
  new: { x: 70, y: 70 },
  ready: { x: 250, y: 70 },
  running: { x: 470, y: 70 },
  exit: { x: 650, y: 70 },
  blocked: { x: 360, y: 230 },
}
export const ANCHO_ESTADO = W
export const ALTO_ESTADO = H

export function lienzoEstadosProceso(): Lienzo {
  const { new: n, ready: r, running: run, exit: ex, blocked: bl } = ESTADOS
  return {
    ancho: 720,
    alto: 290,
    titulo: 'Diagrama de 5 estados de un proceso',
    cuerpo: [
      flecha(
        `M${n.x + W / 2},${n.y} L${r.x - W / 2 - 4},${r.y}`,
        'admitido',
        160,
        n.y - 14,
        '',
        'admitido',
      ),
      flecha(
        `M${r.x + 30},${r.y - H / 2} Q360,-5 ${run.x - 30},${run.y - H / 2 - 4}`,
        'dispatch',
        360,
        9,
        '',
        'dispatch',
      ),
      flecha(
        `M${run.x - 30},${run.y + H / 2} Q360,140 ${r.x + 30},${r.y + H / 2 + 4}`,
        'fin de quantum / desalojo',
        360,
        128,
        '',
        'desalojo',
      ),
      flecha(
        `M${run.x + W / 2},${run.y} L${ex.x - W / 2 - 4},${ex.y}`,
        'termina',
        560,
        run.y - 14,
        '',
        'termina',
      ),
      flecha(
        `M${run.x},${run.y + H / 2} L${bl.x + 40},${bl.y - H / 2 - 4}`,
        'espera un evento',
        520,
        170,
        '',
        'espera',
      ),
      flecha(
        `M${bl.x - 40},${bl.y - H / 2} L${r.x},${r.y + H / 2 + 4}`,
        'ocurre el evento',
        200,
        170,
        '',
        'evento',
      ),
      caja(n.x, n.y, W, H, 'New', 'dg-neutro', 'new'),
      caja(r.x, r.y, W, H, 'Ready', 'dg-listo', 'ready'),
      caja(run.x, run.y, W, H, 'Running', 'dg-activo', 'running'),
      caja(ex.x, ex.y, W, H, 'Exit', 'dg-neutro', 'exit'),
      caja(bl.x, bl.y, W, H, 'Blocked', 'dg-bloqueado', 'blocked'),
    ],
  }
}

const estadosProceso = () => marco(lienzoEstadosProceso())

function cicloInstruccion(): string {
  const y = 70
  const xs = [70, 210, 350]
  const dec = { x: 530, y }
  const man = { x: 530, y: 200 }
  return marco({
    ancho: 660,
    alto: 260,
    titulo: 'Ciclo de instrucción con etapa de interrupción',
    cuerpo: [
      flecha(`M${xs[0] + 50},${y} L${xs[1] - 54},${y}`),
      flecha(`M${xs[1] + 50},${y} L${xs[2] - 54},${y}`),
      flecha(`M${xs[2] + 50},${y} L${dec.x - 84},${y}`),
      flecha(
        `M${dec.x},${y - 28} C${dec.x},-10 ${xs[0]},-10 ${xs[0]},${y - H / 2 - 4}`,
        'no',
        300,
        18,
      ),
      flecha(`M${dec.x},${y + 28} L${man.x},${man.y - 24}`, 'sí', dec.x + 12, 135),
      flecha(
        `M${man.x - 110},${man.y} L${xs[0]} ${man.y} L${xs[0]},${y + H / 2 + 4}`,
        'vuelve a fetch',
        250,
        man.y - 8,
      ),
      caja(xs[0], y, 100, H, 'Fetch', 'dg-activo'),
      caja(xs[1], y, 100, H, 'Decode', 'dg-activo'),
      caja(xs[2], y, 100, H, 'Execute', 'dg-activo'),
      rombo(dec.x, dec.y, 164, 56, '¿Interrupción?'),
      caja(man.x, man.y, 220, 48, 'Guardar PC y PSW\nsaltar al manejador', 'dg-bloqueado'),
    ],
  })
}

function hilosUltKlt(): string {
  const panel = (x: number, w: number, titulo: string) =>
    `<g class="dg-panel"><rect x="${x}" y="30" width="${w}" height="150" rx="12"/>` +
    `<text x="${x + 14}" y="52">${titulo}</text></g>`
  const so = { x: 360, y: 280 }
  return marco({
    ancho: 720,
    alto: 330,
    titulo: 'ULT frente a KLT: qué hilos ve el planificador del SO',
    cuerpo: [
      `<text class="dg-zona" x="14" y="20">Espacio de usuario</text>`,
      `<line class="dg-separador" x1="0" y1="210" x2="720" y2="210"/>`,
      `<text class="dg-zona" x="14" y="232">Kernel</text>`,
      panel(20, 320, 'Proceso con ULT'),
      panel(380, 320, 'Proceso con KLT'),
      flecha('M180,112 L120,140'),
      flecha('M180,112 L240,140'),
      caja(180, 94, 170, 32, 'Biblioteca de hilos', 'dg-neutro'),
      caja(120, 156, 90, 30, 'ULT 1', 'dg-listo'),
      caja(240, 156, 90, 30, 'ULT 2', 'dg-listo'),
      caja(480, 130, 100, 34, 'KLT 1', 'dg-activo'),
      caja(600, 130, 100, 34, 'KLT 2', 'dg-activo'),
      flecha(`M${so.x - 90},${so.y - 10} L180,184`, 've un único hilo', 150, 250, 'dg-tenue'),
      flecha(`M${so.x + 60},${so.y - 20} L480,150`, 'planifica cada KLT', 610, 252),
      flecha(`M${so.x + 90},${so.y - 10} L600,150`),
      caja(so.x, so.y, 220, H, 'Planificador del SO', 'dg-neutro'),
    ],
  })
}

export const DIAGRAMAS: Record<string, () => string> = {
  'estados-proceso': estadosProceso,
  'ciclo-instruccion': cicloInstruccion,
  'hilos-ult-klt': hilosUltKlt,
}

export function renderDiagrama(id: string): string {
  const fn = DIAGRAMAS[id.trim()]
  if (!fn)
    throw new Error(
      `Diagrama desconocido: "${id}". Disponibles: ${Object.keys(DIAGRAMAS).join(', ')}`,
    )
  return fn()
}
