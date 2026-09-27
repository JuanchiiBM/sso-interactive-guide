/** Diagrama de colas del paso a paso (solo ejercicios de guía). Ver docs/brain/simuladores/Diagrama de Colas.md */
import { $ } from '@lib/dom'
import { etiquetaHilo, type EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import type {
  ConfigPlanificacion,
  ResultadoPlanificacion,
  Tick,
} from '@lib/simuladores/planificacion/tipos'
import { esc, lienzo, texto } from '@lib/diagramas/svg'
import { moverFichas, type Ficha, type FichaUbicada } from './colas-dom'
import { renderColasHilos } from './colas-hilos'
import { quantumPorTick, rafagaRestante, type QuantumCpu } from './colas-derivar'

export interface ContextoColas {
  state: EstadoGantt
  tick: Tick
  /** Ficha de un hilo planificable (proceso, KLT simple o ULT) con su color del Gantt. */
  fichaHilo: (id: string) => Ficha
  /** Config del simulador (para quantum, algoritmo, etc.); falta si el host no la pasa. */
  config?: ConfigPlanificacion
}

// ── Medidas (unidades del viewBox) ──
const CW = 44 // ancho de un casillero
const CH = 40 // alto de una cola
const M = 16 // margen
const LBL = 20 // lugar para el rótulo arriba de una cola
const PASO = CH + LBL + 12 // distancia vertical entre colas apiladas
const CPU_W = 176
const CPU_H = 56
const DISP_W = 136 // dispositivos en celular
const FICHA = 30 // separación entre fichas dentro de una caja
const TOPE = 6 // casilleros máximos; el resto se muestra como "+n"
const ANCHO_COMPACTO = 600 // px del contenedor por debajo de los cuales se apila todo
const letras = (s: string, px = 13) => s.length * px * 0.6

// ── Modelo: lo que hay que dibujar, estable para toda la traza ──
interface ColaM {
  el: string
  titulo: string
  clase: string
  cap: number
}
interface DispM {
  nombre: string
  capCola: number
  capUso: number
}
interface Modelo {
  r: ResultadoPlanificacion
  colas: ColaM[]
  nuevo: number
  susp: number
  cpus: number
  disps: DispM[]
  /** Nombre del dispositivo genérico (sin nombre) dentro de `disps`, si lo hay. */
  generico: string | null
  vuelve: { largo: string; corto: string } | null
  quantum: (QuantumCpu | null)[][]
  finOrden: Map<string, number>
  grado?: number
}

const GENERICO = 'E/S'
const CLASES_COLA = ['dg-listo', 'rl-aux', 're-cola-baja']
const max = (xs: number[], min = 0) => Math.max(min, ...xs)

function modelar(state: EstadoGantt, config?: ConfigPlanificacion): Modelo {
  const r = state.resultado
  const ticks = r.ticks
  const conColas = ticks[0]?.colas
  const vrr = config?.algoritmo === 'vrr'
  const soReady = ticks.some((t) => t.bibliotecas) ? 'Ready (SO)' : 'Ready'
  const colas: ColaM[] = conColas
    ? conColas.map((c, i) => ({
        el: `cola-${i}`,
        titulo: vrr && i === 0 ? 'Auxiliar (prioridad)' : c.nombre,
        clase: vrr ? (i === 0 ? 'rl-aux' : 'dg-listo') : CLASES_COLA[Math.min(i, 2)],
        cap: capDe(
          ticks.map((t) => t.colas?.[i]?.procesos.length ?? 0),
          3,
        ),
      }))
    : [
        {
          el: 'cola-0',
          titulo: soReady,
          clase: 'dg-listo',
          cap: capDe(
            ticks.map((t) => t.listos.length),
            3,
          ),
        },
      ]
  if (vrr) colas[1].titulo = 'Principal'

  // dispositivos nombrados en orden de aparición; lo que no cae en ninguno va al genérico
  const nombres: string[] = []
  for (const t of ticks)
    for (const d of t.dispositivos ?? []) if (!nombres.includes(d.nombre)) nombres.push(d.nombre)
  const disps: DispM[] = nombres.map((nombre) => ({
    nombre,
    capCola: capDe(
      ticks.map((t) => t.dispositivos?.find((d) => d.nombre === nombre)?.cola.length ?? 0),
      2,
    ),
    capUso: 1,
  }))
  const sueltos = ticks.map((t) => genericoDe(t))
  const hayGenerico = !nombres.length || sueltos.some((s) => s.uso.length || s.cola.length)
  if (hayGenerico && ticks.some((t) => t.io.length || t.colaIO.length))
    disps.push({
      nombre: GENERICO,
      capCola: capDe(
        sueltos.map((s) => s.cola.length),
        2,
      ),
      capUso: Math.min(
        TOPE,
        max(
          sueltos.map((s) => s.uso.length),
          1,
        ),
      ),
    })

  const finOrden = new Map(
    [...r.metricas]
      .sort((a, b) => a.finalizacion - b.finalizacion || a.id.localeCompare(b.id))
      .map((m, i) => [m.id, i] as const),
  )
  const hayNew = ticks.some((t) => t.nuevos)
  const haySusp = ticks.some((t) => t.suspendidos)

  return {
    r,
    colas,
    nuevo: hayNew
      ? capDe(
          ticks.map((t) => t.nuevos?.length ?? 0),
          2,
        )
      : 0,
    susp: haySusp
      ? capDe(
          ticks.map((t) => t.suspendidos?.length ?? 0),
          2,
        )
      : 0,
    cpus: r.procesadores,
    disps,
    generico: disps.some((d) => d.nombre === GENERICO) ? GENERICO : null,
    vuelve: etiquetaVuelta(config),
    quantum: config
      ? quantumPorTick(config, r)
      : ticks.map((t) => t.quantum?.map(() => null) ?? []),
    finOrden,
    grado: config?.multiprogramacion,
  }
}

const capDe = (largos: number[], min: number) => Math.min(TOPE, max(largos, min))

/** Lo que usa o espera E/S sin dispositivo nombrado. */
function genericoDe(t: Tick): { uso: string[]; cola: string[] } {
  const usando = new Set(t.dispositivos?.map((d) => d.usando).filter(Boolean))
  const esperan = new Set(t.dispositivos?.flatMap((d) => d.cola))
  return {
    uso: t.io.filter((id) => !usando.has(id)),
    cola: t.colaIO.filter((id) => !esperan.has(id)),
  }
}

function etiquetaVuelta(config?: ConfigPlanificacion): Modelo['vuelve'] {
  const alg = config?.algoritmo
  if (alg === 'rr' || alg === 'vrr')
    return { largo: 'fin de quantum: al final de su cola', corto: 'fin de quantum' }
  if (alg === 'srt' || alg === 'prioridades-desalojo')
    return { largo: 'desalojo: al final de Ready', corto: 'desalojo' }
  if (alg === 'multinivel' || alg === 'feedback') {
    const rr = config?.colas?.some((c) => c.algoritmo === 'rr')
    const desalojo = config?.desalojoEntreColas !== false
    const que = [rr && 'fin de quantum', desalojo && 'desalojo'].filter(Boolean).join(' o ')
    return que ? { largo: `${que}: al final de su cola`, corto: 'vuelve a su cola' } : null
  }
  return null
}

// ── Geometría ──
interface ColaG {
  el: string
  titulo: string
  clase: string
  x0: number
  y: number
  cap: number
}
interface CajaG {
  el: string
  titulo: string
  clase: string
  cx: number
  cy: number
  w: number
  h: number
  cap: number
}
interface FlechaG {
  el: string
  d: string
  etiqueta?: string
  lx?: number
  ly?: number
  punta?: boolean
  /** Etiqueta alineada a la izquierda de `lx` (si no, centrada). */
  izq?: boolean
}
interface Geo {
  ancho: number
  alto: number
  colas: ColaG[]
  nuevo?: ColaG
  susp?: ColaG
  cpus: CajaG[]
  fin: CajaG
  disps: { cola: ColaG; caja: CajaG }[]
  flechas: FlechaG[]
  /** Dónde va el "t = n" (arriba a la derecha). */
  reloj: { x: number; y: number }
  /** Promedios del paso final: bajo Fin (centrados) o bajo el reloj (alineados a la derecha). */
  metricas: { x: number; y: number; clase: string }
}

const derecha = (c: ColaG) => c.x0 + c.cap * CW
const izq = (c: CajaG) => c.cx - c.w / 2
const der = (c: CajaG) => c.cx + c.w / 2
const arriba = (c: CajaG) => c.cy - c.h / 2
const abajo = (c: CajaG) => c.cy + c.h / 2
const anchoCaja = (nombre: string, cap: number, min = CPU_W) =>
  Math.max(min, 26 + letras(nombre) + cap * FICHA + 12)

function cajaFin(m: Modelo, cx: number, cy: number): CajaG {
  const n = Math.max(1, m.finOrden.size)
  const cols = Math.min(n, 2)
  const filas = Math.ceil(n / cols)
  return {
    el: 'fin',
    titulo: 'Fin',
    clase: '',
    cx,
    cy,
    w: cols * FICHA + 16,
    h: filas * FICHA + 16,
    cap: n,
  }
}

/** Escritorio: New → Ready → CPU → Fin en una fila; los dispositivos debajo (como el recorrido). */
function disponerAncho(m: Modelo): Geo {
  const f: FlechaG[] = []
  const top = 34
  // con 2 CPUs apiladas, se baja todo para que la de arriba no se salga del lienzo
  const altoCpus = (m.cpus - 1) * (CPU_H + 22) + CPU_H
  const y0 = Math.max(
    top + LBL + CH / 2,
    top + 10 + altoCpus / 2 - ((m.colas.length - 1) * PASO) / 2,
  )
  const ys = m.colas.map((_, i) => y0 + i * PASO)
  const medio = (ys[0] + ys[ys.length - 1]) / 2
  let x = M
  let nuevo: ColaG | undefined
  let susp: ColaG | undefined
  const izqCol = Math.max(m.nuevo, m.susp) * CW
  if (m.nuevo) nuevo = { el: 'new', titulo: rotuloNew(m), clase: '', x0: x, y: ys[0], cap: m.nuevo }
  if (m.susp)
    susp = {
      el: 'susp',
      titulo: 'Suspendidos',
      clase: '',
      x0: x,
      y: ys[0] + (m.nuevo ? PASO : 0),
      cap: m.susp,
    }
  if (izqCol) x += izqCol + 64
  const busX = x
  x += 22
  const readyW = max(m.colas.map((c) => c.cap)) * CW
  const readyR = x + readyW
  const colas = m.colas.map((c, i) => ({ ...c, x0: readyR - c.cap * CW, y: ys[i] }))

  const cpuL = readyR + 64
  const cpuPaso = CPU_H + 22
  const cpus: CajaG[] = Array.from({ length: m.cpus }, (_, k) => ({
    el: `cpu-${k}`,
    titulo: m.cpus > 1 ? `CPU ${k + 1}` : 'CPU',
    clase: 'dg-activo',
    cx: cpuL + CPU_W / 2,
    cy: medio + (k - (m.cpus - 1) / 2) * cpuPaso,
    w: CPU_W,
    h: CPU_H,
    cap: 1,
  }))
  const cpu0 = cpus[0]
  const cpuN = cpus[cpus.length - 1]
  const fin = cajaFin(m, 0, cpu0.cy)
  fin.cy = Math.max(cpu0.cy, top + 12 + fin.h / 2)
  fin.cx = der(cpu0) + 56 + fin.w / 2
  const finR = Math.max(der(fin), fin.cx + 64)

  // Ready: entradas desde el bus, dispatch a cada CPU
  colas.forEach((c, i) => {
    f.push({ el: `entra-${i}`, d: `M${busX},${c.y} L${c.x0},${c.y}`, punta: true })
    cpus.forEach((p, k) =>
      f.push({ el: `disp-${i}-${k}`, d: `M${readyR},${c.y} L${izq(p)},${p.cy}`, punta: true }),
    )
  })
  if (colas.length > 1) f.push({ el: 'bus', d: `M${busX},${ys[0]} L${busX},${ys[ys.length - 1]}` })
  if (nuevo)
    f.push({
      el: 'admision',
      d: `M${derecha(nuevo)},${nuevo.y} L${busX},${nuevo.y}`,
      etiqueta: 'admisión',
      lx: (derecha(nuevo) + busX) / 2,
      ly: nuevo.y - 12,
    })
  if (m.vuelve) {
    const sx = cpu0.cx - 30
    f.push({
      el: 'vuelve',
      d: `M${sx},${arriba(cpu0)} L${sx},24 L${busX},24 L${busX},${ys[0]}`,
      etiqueta: m.vuelve.largo,
      lx: (sx + busX) / 2,
      ly: 11,
    })
  }
  cpus.forEach((p, k) =>
    f.push({ el: `termina-${k}`, d: `M${der(p)},${p.cy} L${izq(fin)},${fin.cy}`, punta: true }),
  )

  let fondo = Math.max(
    ys[ys.length - 1] + CH / 2,
    abajo(cpuN),
    abajo(fin) + 30,
    susp ? susp.y + CH / 2 : 0,
  )
  const disps: Geo['disps'] = []
  if (m.disps.length) {
    const yBus = fondo + 22
    const y0 = yBus + 16 + LBL + CH / 2
    const colaW = max(m.disps.map((d) => d.capCola)) * CW
    const colaR = readyR
    const devBus = colaR - colaW - 22
    const cx = cpu0.cx
    m.disps.forEach((d, j) => {
      const y = y0 + j * PASO
      const cola: ColaG = {
        el: `dcola-${j}`,
        titulo: `cola de ${d.nombre}`,
        clase: 'dg-bloqueado',
        x0: colaR - d.capCola * CW,
        y,
        cap: d.capCola,
      }
      const w = anchoCaja(d.nombre, d.capUso)
      const caja: CajaG = {
        el: `disp-${j}`,
        titulo: d.nombre,
        clase: 'dg-bloqueado',
        cx: cx - CPU_W / 2 + w / 2,
        cy: y,
        w,
        h: 48,
        cap: d.capUso,
      }
      disps.push({ cola, caja })
    })
    const outX = max(disps.map((d) => der(d.caja))) + 22
    const yUlt = disps[disps.length - 1].cola.y
    const yFondo = yUlt + CH / 2 + 22
    const sx = cpuN.cx - 30
    f.push({
      el: 'pide-io',
      d: `M${sx},${abajo(cpuN)} L${sx},${yBus} L${devBus},${yBus} L${devBus},${yUlt}`,
      etiqueta: 'pide E/S',
      lx: (sx + devBus) / 2,
      ly: yBus - 9,
    })
    disps.forEach(({ cola, caja }, j) => {
      f.push({ el: `a-disp-${j}`, d: `M${devBus},${cola.y} L${cola.x0},${cola.y}`, punta: true })
      f.push({
        el: `usa-${j}`,
        d: `M${derecha(cola)},${cola.y} L${izq(caja)},${caja.cy}`,
        punta: true,
      })
      f.push({ el: `sale-${j}`, d: `M${der(caja)},${caja.cy} L${outX},${caja.cy}` })
    })
    f.push({
      el: 'fin-io',
      d: `M${outX},${disps[0].caja.cy} L${outX},${yFondo} L${busX},${yFondo} L${busX},${ys[ys.length - 1]}`,
      etiqueta: 'fin de E/S: al final de su cola',
      lx: (outX + busX) / 2,
      ly: yFondo + 12,
    })
    fondo = yFondo + 24
  }
  const ancho = Math.max(finR, ...disps.map((d) => der(d.caja) + 22)) + M
  return {
    ancho,
    alto: fondo + M,
    colas,
    nuevo,
    susp,
    cpus,
    fin,
    disps,
    flechas: f,
    reloj: { x: ancho - M, y: 12 },
    metricas: { x: fin.cx, y: abajo(fin) + 13, clase: 'colas-centro' },
  }
}

/** Celular: Ready arriba, CPU(s) y Fin debajo, después los dispositivos; el bus de vuelta a la izquierda. */
function disponerCompacto(m: Modelo): Geo {
  const f: FlechaG[] = []
  const busX = M + 6
  const x0 = busX + 22
  let y = M + 6
  let nuevo: ColaG | undefined
  let susp: ColaG | undefined
  if (m.nuevo) {
    nuevo = { el: 'new', titulo: rotuloNew(m), clase: '', x0, y: y + LBL + CH / 2, cap: m.nuevo }
    y = nuevo.y + CH / 2 + 18
  }
  if (m.susp) {
    susp = { el: 'susp', titulo: 'Suspendidos', clase: '', x0, y: y + LBL + CH / 2, cap: m.susp }
    y = susp.y + CH / 2 + 18
  }
  const readyW = max(m.colas.map((c) => c.cap)) * CW
  const readyR = x0 + readyW
  const colas = m.colas.map((c, i) => ({
    ...c,
    x0: readyR - c.cap * CW,
    y: y + LBL + CH / 2 + i * PASO,
  }))
  const ys = colas.map((c) => c.y)
  const yUltCola = ys[ys.length - 1]

  const cpuR = readyR + 40
  const yCpu0 = yUltCola + CH / 2 + 40 + CPU_H / 2
  const cpus: CajaG[] = Array.from({ length: m.cpus }, (_, k) => ({
    el: `cpu-${k}`,
    titulo: m.cpus > 1 ? `CPU ${k + 1}` : 'CPU',
    clase: 'dg-activo',
    cx: cpuR - CPU_W / 2,
    cy: yCpu0 + k * (CPU_H + 18),
    w: CPU_W,
    h: CPU_H,
    cap: 1,
  }))
  const cpu0 = cpus[0]
  const cpuN = cpus[cpus.length - 1]
  const fin = cajaFin(m, 0, cpu0.cy)
  fin.cx = cpuR + 36 + fin.w / 2
  fin.cy = arriba(cpu0) + fin.h / 2

  const bajada = readyR + 16
  colas.forEach((c, i) => {
    f.push({ el: `entra-${i}`, d: `M${busX},${c.y} L${c.x0},${c.y}`, punta: true })
    cpus.forEach((p, k) => {
      const d =
        k === 0
          ? `M${readyR},${c.y} L${bajada},${c.y} L${bajada},${arriba(p)}`
          : `M${readyR},${c.y} L${cpuR + 14},${c.y} L${cpuR + 14},${p.cy} L${cpuR},${p.cy}`
      f.push({ el: `disp-${i}-${k}`, d, punta: true })
    })
  })
  if (nuevo) {
    const sx = derecha(nuevo) + 12
    const yb = nuevo.y + CH / 2 + 9
    f.push({
      el: 'admision',
      d: `M${derecha(nuevo)},${nuevo.y} L${sx},${nuevo.y} L${sx},${yb} L${busX},${yb}`,
      etiqueta: 'admisión',
      lx: sx + 34,
      ly: nuevo.y,
    })
  }
  const yGap = arriba(cpu0) - 16
  if (m.vuelve) {
    const sx = izq(cpu0) + 26
    f.push({
      el: 'vuelve',
      d: `M${sx},${arriba(cpu0)} L${sx},${yGap} L${busX},${yGap}`,
      etiqueta: m.vuelve.corto,
      lx: sx + 6,
      ly: yGap - 9,
      izq: true,
    })
  }
  f.push({
    el: 'termina-0',
    d: `M${cpuR},${cpu0.cy - 12} L${izq(fin)},${cpu0.cy - 12}`,
    punta: true,
  })
  cpus.slice(1).forEach((p, k) =>
    f.push({
      el: `termina-${k + 1}`,
      d: `M${cpuR},${p.cy - 14} L${izq(fin) - 8},${p.cy - 14} L${izq(fin) - 8},${abajo(fin)}`,
      punta: true,
    }),
  )

  let fondo = Math.max(abajo(cpuN), abajo(fin) + 30)
  let anchoMin = der(fin) + M
  const disps: Geo['disps'] = []
  let yBajo = fondo
  if (m.disps.length) {
    const yBus = fondo + 18
    const y0 = yBus + 14 + LBL + CH / 2
    const colaW = max(m.disps.map((d) => d.capCola)) * CW
    const cajaW = max(m.disps.map((d) => anchoCaja(d.nombre, d.capUso, DISP_W)))
    const devBus = x0
    const colaR = devBus + 14 + colaW
    m.disps.forEach((d, j) => {
      const y = y0 + j * PASO
      const cola: ColaG = {
        el: `dcola-${j}`,
        titulo: `cola de ${d.nombre}`,
        clase: 'dg-bloqueado',
        x0: colaR - d.capCola * CW,
        y,
        cap: d.capCola,
      }
      const w = anchoCaja(d.nombre, d.capUso, DISP_W)
      const caja: CajaG = {
        el: `disp-${j}`,
        titulo: d.nombre,
        clase: 'dg-bloqueado',
        cx: colaR + 20 + w / 2,
        cy: y,
        w,
        h: 48,
        cap: d.capUso,
      }
      disps.push({ cola, caja })
    })
    const outX = colaR + 20 + cajaW + 14
    const yUlt = disps[disps.length - 1].cola.y
    yBajo = yUlt + CH / 2 + 20
    const sx = izq(cpuN) + 26
    f.push({
      el: 'pide-io',
      d: `M${sx},${abajo(cpuN)} L${sx},${yBus} L${devBus},${yBus} L${devBus},${yUlt}`,
      etiqueta: 'pide E/S',
      lx: sx + 6,
      ly: yBus - 9,
      izq: true,
    })
    disps.forEach(({ cola, caja }, j) => {
      f.push({ el: `a-disp-${j}`, d: `M${devBus},${cola.y} L${cola.x0},${cola.y}`, punta: true })
      f.push({
        el: `usa-${j}`,
        d: `M${derecha(cola)},${cola.y} L${izq(caja)},${caja.cy}`,
        punta: true,
      })
      f.push({ el: `sale-${j}`, d: `M${der(caja)},${caja.cy} L${outX},${caja.cy}` })
    })
    f.push({
      el: 'fin-io',
      d: `M${outX},${disps[0].caja.cy} L${outX},${yBajo} L${busX},${yBajo} L${busX},${yUltCola}`,
      etiqueta: 'fin de E/S',
      lx: (outX + busX) / 2,
      ly: yBajo + 12,
    })
    anchoMin = Math.max(anchoMin, outX + M)
    fondo = yBajo + 24
  }
  // el bus de vuelta a Ready corre por la izquierda de todo
  const busTop = ys[0]
  const busBot = m.disps.length ? yBajo : m.vuelve ? yGap : yUltCola
  if (busBot > busTop || nuevo)
    f.push({ el: 'bus', d: `M${busX},${nuevo ? nuevo.y + CH / 2 + 9 : busTop} L${busX},${busBot}` })

  const ancho = anchoMin
  return {
    ancho,
    alto: fondo + M,
    colas,
    nuevo,
    susp,
    cpus,
    fin,
    disps,
    flechas: f,
    reloj: { x: ancho - M, y: M },
    metricas: { x: ancho - M, y: M + 16, clase: 'colas-der' },
  }
}

const rotuloNew = (m: Modelo) => (m.grado ? `New (grado ${m.grado})` : 'New')

// ── Dibujo ──
function dibujarCola(c: ColaG, on: Set<string>, pie?: string, extra = 0) {
  const w = c.cap * CW
  const divisiones = Array.from({ length: c.cap - 1 }, (_, i) => {
    const xi = c.x0 + (i + 1) * CW
    return `<line class="rl-casilla" x1="${xi}" y1="${c.y - CH / 2}" x2="${xi}" y2="${c.y + CH / 2}"/>`
  }).join('')
  const mas = extra > 0 ? texto(c.x0 + CW / 2, c.y, `+${extra}`, { clase: 're-nota' }) : ''
  return (
    `<g class="dg-nodo rl-cola ${c.clase}${on.has(c.el) ? ' rc-on' : ''}" data-el="${esc(c.el)}">` +
    `<rect x="${c.x0}" y="${c.y - CH / 2}" width="${w}" height="${CH}" rx="8"/>${divisiones}${mas}` +
    texto(c.x0, c.y - CH / 2 - 10, c.titulo, { clase: 'colas-rotulo' }) +
    (pie ? texto(c.x0 + w, c.y + CH / 2 + 11, pie, { clase: 'colas-pie colas-der' }) : '') +
    `</g>`
  )
}

function dibujarCaja(c: CajaG, on: Set<string>, pie?: string, contenido = '') {
  const x = izq(c)
  const conPie = pie != null && c.el !== 'fin'
  return (
    `<g class="dg-nodo ${c.clase}${on.has(c.el) ? ' rc-on' : ''}" data-el="${esc(c.el)}">` +
    `<rect x="${x}" y="${arriba(c)}" width="${c.w}" height="${c.h}" rx="10"/>` +
    (c.el === 'fin'
      ? texto(c.cx, arriba(c) - 10, c.titulo, { clase: 'colas-rotulo colas-centro' })
      : texto(x + 12, conPie && pie ? c.cy - 9 : c.cy, c.titulo, { clase: 'colas-nombre' })) +
    (conPie && pie ? texto(x + 12, c.cy + 11, pie, { clase: 'colas-pie' }) : '') +
    contenido +
    `</g>`
  )
}

function flechaSvg(fl: FlechaG, on: Set<string>) {
  const activa = on.has(fl.el)
  const punta = fl.punta ? ` marker-end="url(#${activa ? 'dg-punta-on' : 'dg-punta'})"` : ''
  const label =
    fl.etiqueta != null
      ? `<text class="dg-etiqueta${fl.izq ? ' colas-izq' : ''}" x="${fl.lx}" y="${fl.ly}">${esc(fl.etiqueta)}</text>`
      : ''
  return `<g class="dg-flecha${activa ? ' rc-on' : ''}" data-el="${esc(fl.el)}"><path d="${fl.d}"${punta}/>${label}</g>`
}

/** Dónde está cada hilo en un tick: zona (`data-el`) y posición. `null` = fuera del diagrama. */
interface Lugar {
  zona: string
  x: number
  y: number
}
const enCola = (c: ColaG, i: number): Lugar => ({
  zona: c.el,
  x: c.x0 + c.cap * CW - (Math.min(i, c.cap - 1) + 0.5) * CW,
  y: c.y,
})
const enCaja = (c: CajaG, i: number): Lugar => ({ zona: c.el, x: der(c) - 24 - i * FICHA, y: c.cy })

function lugares(m: Modelo, g: Geo, tick: Tick | null): Map<string, Lugar> {
  const out = new Map<string, Lugar>()
  const poner = (id: string | null, l: Lugar) => {
    if (id && !out.has(id)) out.set(id, l)
  }
  if (!tick) {
    // paso final: todos terminados
    for (const [id, i] of m.finOrden) poner(id, enFin(g.fin, i))
    return out
  }
  tick.cpus.forEach((id, k) => {
    if (!tick.so?.[k]) poner(id, enCaja(g.cpus[k], 0))
  })
  const listas = tick.colas?.map((c) => c.procesos) ?? [tick.listos]
  listas.forEach((ids, i) => ids.forEach((id, j) => poner(id, enCola(g.colas[i], j))))
  tick.nuevos?.forEach((id, j) => g.nuevo && poner(id, enCola(g.nuevo, j)))
  tick.suspendidos?.forEach((id, j) => g.susp && poner(id, enCola(g.susp, j)))
  m.disps.forEach((d, j) => {
    const geo = g.disps[j]
    if (d.nombre === GENERICO && m.generico) {
      const s = genericoDe(tick)
      s.uso.forEach((id, i) => poner(id, enCaja(geo.caja, Math.min(i, geo.caja.cap - 1))))
      s.cola.forEach((id, i) => poner(id, enCola(geo.cola, i)))
      return
    }
    const e = tick.dispositivos?.find((x) => x.nombre === d.nombre)
    if (!e) return
    poner(e.usando, enCaja(geo.caja, 0))
    e.cola.forEach((id, i) => poner(id, enCola(geo.cola, i)))
  })
  for (const [id, estado] of Object.entries(tick.estados))
    if (estado === 'fin') poner(id, enFin(g.fin, m.finOrden.get(id) ?? 0))
  return out
}

function enFin(c: CajaG, i: number): Lugar {
  const cols = Math.min(c.cap, 2)
  return {
    zona: 'fin',
    x: izq(c) + 8 + FICHA / 2 + (i % cols) * FICHA,
    y: arriba(c) + 8 + FICHA / 2 + Math.floor(i / cols) * FICHA,
  }
}

/** Qué se resalta por un movimiento de zona a zona: la zona destino y el camino que recorrió. */
function camino(de: string | undefined, a: string): string[] {
  const out = [a]
  const cola = a.match(/^cola-(\d+)$/)
  const cpu = a.match(/^cpu-(\d+)$/)
  const deCpu = de?.match(/^cpu-(\d+)$/)
  const deDisp = de?.match(/^(?:disp|dcola)-(\d+)$/)
  if (deDisp && (cola || cpu)) out.push(`sale-${deDisp[1]}`, 'fin-io', 'bus')
  if (de === 'new') out.push('admision', 'bus')
  if (cola) {
    out.push(`entra-${cola[1]}`)
    if (deCpu) out.push('vuelve', 'bus')
  }
  if (cpu) {
    const desde = de?.match(/^cola-(\d+)$/)
    if (desde) out.push(`disp-${desde[1]}-${cpu[1]}`)
  }
  const disp = a.match(/^(disp|dcola)-(\d+)$/)
  if (disp && deCpu) out.push('pide-io', `a-disp-${disp[2]}`)
  if (disp?.[1] === 'disp' && de !== a) out.push(`usa-${disp[2]}`)
  if (a === 'fin' && deCpu) out.push(`termina-${deCpu[1]}`)
  return out
}

// ── Render ──
interface Montado {
  modelo: Modelo
  compacto: boolean
  geo: Geo
  fondo: SVGGElement
  capa: SVGGElement
}
const modelos = new WeakMap<ResultadoPlanificacion, Modelo>()
const montados = new WeakMap<HTMLElement, Montado>()
const ultimo = new WeakMap<HTMLElement, { state: EstadoGantt; config?: ConfigPlanificacion }>()
const observados = new WeakSet<HTMLElement>()

function contexto(state: EstadoGantt, tick: Tick, config?: ConfigPlanificacion): ContextoColas {
  const { resultado, procesos } = state
  const fichaHilo = (id: string): Ficha => {
    const i = procesos.indexOf(id)
    return {
      clave: id,
      texto: id,
      color: Math.max(0, i),
      css: i < 0 ? 'var(--muted)' : undefined,
      title: etiquetaHilo(resultado, id),
    }
  }
  return { state, tick, fichaHilo, config }
}

const esCompacto = (root: HTMLElement) => (root.clientWidth || window.innerWidth) < ANCHO_COMPACTO

export function renderColas(
  root: HTMLElement,
  state: EstadoGantt,
  config?: ConfigPlanificacion,
): void {
  // con ULTs, el lienzo entero es el de colas-hilos.ts
  if (renderColasHilos(root, state)) return
  const { resultado, hasta } = state
  if (!resultado.ticks.length) return root.replaceChildren()
  ultimo.set(root, { state, config })
  observar(root)

  let modelo = modelos.get(resultado)
  if (!modelo) {
    modelo = modelar(state, config)
    modelos.set(resultado, modelo)
  }
  const compacto = esCompacto(root)
  let mont = montados.get(root)
  if (!mont?.fondo.isConnected || mont.modelo !== modelo || mont.compacto !== compacto) {
    mont = montar(root, modelo, compacto)
    montados.set(root, mont)
  }
  const { geo, fondo, capa } = mont
  const tick = hasta == null ? null : resultado.ticks[hasta]
  const tickRef = tick ?? resultado.ticks[resultado.ticks.length - 1]
  const previo = hasta == null ? tickRef : hasta > 0 ? resultado.ticks[hasta - 1] : undefined
  const ctx = contexto(state, tickRef, config)

  // posiciones de ahora y de antes → qué se movió y por dónde
  const ahora = lugares(modelo, geo, tick)
  const antes = previo ? lugares(modelo, geo, previo) : new Map<string, Lugar>()
  const on = new Set<string>()
  const movidos = new Set<string>()
  for (const [id, l] of ahora) {
    const zonaAntes = antes.get(id)?.zona
    if (zonaAntes === l.zona) continue
    movidos.add(id)
    for (const e of camino(zonaAntes, l.zona)) on.add(e)
  }

  fondo.innerHTML = dibujarFondo(modelo, geo, on, tick, hasta)
  const figura = root.firstElementChild as HTMLElement
  figura.toggleAttribute('data-rc-foco', on.size > 0)
  const svg = $<SVGSVGElement>('svg', root)!
  svg.setAttribute('aria-label', hasta == null ? 'Colas al terminar' : `Colas en t=${hasta}`)
  $<SVGTextElement>('[data-reloj]', root)!.textContent =
    hasta == null ? `fin · t = ${resultado.fin}` : `t = ${hasta}`

  const ubicadas: FichaUbicada[] = []
  for (const [id, l] of ahora) {
    const ficha = ctx.fichaHilo(id)
    const met = hasta == null ? resultado.metricas.find((x) => x.id === id) : undefined
    if (met) ficha.title = `${ficha.title}: retorno ${met.retorno}, espera ${met.espera}`
    ubicadas.push({ ficha, x: l.x, y: l.y, mueve: movidos.has(id) && hasta != null })
  }
  moverFichas(capa, ubicadas)
}

function dibujarFondo(m: Modelo, g: Geo, on: Set<string>, tick: Tick | null, hasta: number | null) {
  const r = m.r
  const partes: string[] = g.flechas.map((fl) => flechaSvg(fl, on))
  const listas = tick ? (tick.colas?.map((c) => c.procesos) ?? [tick.listos]) : []
  g.colas.forEach((c, i) =>
    partes.push(dibujarCola(c, on, undefined, (listas[i]?.length ?? 0) - c.cap)),
  )
  partes.push(
    texto(derecha(g.colas[0]) + 5, g.colas[0].y - 11, 'frente', { clase: 're-nota colas-izq' }),
  )
  if (g.nuevo)
    partes.push(dibujarCola(g.nuevo, on, undefined, (tick?.nuevos?.length ?? 0) - g.nuevo.cap))
  if (g.susp) partes.push(dibujarCola(g.susp, on))

  g.cpus.forEach((c, k) => {
    const id = tick?.cpus[k] ?? null
    let pie: string | undefined
    let contenido = ''
    if (tick?.so?.[k]) {
      pie = 'atiende una interrupción'
      contenido = texto(der(c) - 24, c.cy, 'SO', { clase: 'colas-nombre colas-centro' })
    } else if (id && hasta != null) {
      const q = m.quantum[hasta]?.[k] ?? null
      const qHilos = tick?.quantum?.[k]
      const partesPie = [`restan ${rafagaRestante(r, hasta, id, 'ejecutando')}`]
      if (q) partesPie.push(`Q ${q.restante}/${q.limite}`)
      else if (qHilos != null) partesPie.push(`Q ${qHilos}`)
      pie = partesPie.join(' · ')
    } else if (hasta != null) pie = 'ociosa'
    partes.push(dibujarCaja(c, on, pie, contenido))
  })

  const pieFin =
    hasta == null
      ? [`retorno prom. ${fmt(r.promedioRetorno)}`, `espera prom. ${fmt(r.promedioEspera)}`]
      : []
  partes.push(dibujarCaja(g.fin, on))
  pieFin.forEach((t, i) =>
    partes.push(
      texto(g.metricas.x, g.metricas.y + i * 14, t, { clase: `colas-pie ${g.metricas.clase}` }),
    ),
  )

  m.disps.forEach((d, j) => {
    const { cola, caja } = g.disps[j]
    let usando: string[] = []
    let enEspera = 0
    if (tick) {
      if (d.nombre === GENERICO && m.generico) {
        const s = genericoDe(tick)
        usando = s.uso
        enEspera = s.cola.length
      } else {
        const e = tick.dispositivos?.find((x) => x.nombre === d.nombre)
        usando = e?.usando ? [e.usando] : []
        enEspera = e?.cola.length ?? 0
      }
    }
    const pie =
      hasta != null && usando.length === 1
        ? `restan ${rafagaRestante(r, hasta, usando[0], 'bloqueado')}`
        : hasta != null && !usando.length
          ? 'libre'
          : undefined
    partes.push(dibujarCola(cola, on, undefined, enEspera - cola.cap))
    partes.push(dibujarCaja(caja, on, pie))
  })

  return partes.join('')
}

function montar(root: HTMLElement, modelo: Modelo, compacto: boolean): Montado {
  const geo = compacto ? disponerCompacto(modelo) : disponerAncho(modelo)
  const figura = document.createElement('figure')
  figura.className = `diagrama recorrido rc-activo colas-fig${compacto ? ' colas-compacto' : ''}`
  figura.innerHTML = lienzo(
    {
      ancho: geo.ancho,
      alto: geo.alto,
      titulo: 'Diagrama de colas',
      cuerpo: ['<g data-fondo></g>'],
    },
    `<text class="colas-reloj" data-reloj x="${geo.reloj.x}" y="${geo.reloj.y}"></text><g data-fichas></g>`,
  )
  root.replaceChildren(figura)
  requestAnimationFrame(() => figura.classList.add('rc-animar'))
  return {
    modelo,
    compacto,
    geo,
    fondo: $<SVGGElement>('[data-fondo]', figura)!,
    capa: $<SVGGElement>('[data-fichas]', figura)!,
  }
}

/** Al cruzar el ancho de corte (rotar el celular, mostrar la resolución) se vuelve a disponer. */
function observar(root: HTMLElement) {
  if (observados.has(root) || typeof ResizeObserver === 'undefined') return
  observados.add(root)
  new ResizeObserver(() => {
    const mont = montados.get(root)
    const u = ultimo.get(root)
    if (mont && u && root.clientWidth && mont.compacto !== esCompacto(root))
      renderColas(root, u.state, u.config)
  }).observe(root)
}

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
