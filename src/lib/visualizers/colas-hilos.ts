/** Diagrama de colas con ULT sobre KLT: Ready de KLTs, CPU "KLT · ULT", E/S y una tarjeta por biblioteca. Ver brain: Diagrama de Colas. */
import { $, $$ } from '@lib/dom'
import { bandeja, casilleros, cola, recuadro } from '@lib/diagramas/primitivas-planificacion'
import { panelLeyenda } from '@lib/diagramas/primitivas-t3'
import { esc, flecha, lienzo, texto } from '@lib/diagramas/svg'
import { etiquetaHilo, type EstadoGantt } from '@lib/simuladores/planificacion/pasos'
import type { ResultadoPlanificacion, Tick } from '@lib/simuladores/planificacion/tipos'

type Punto = [number, number]
type Modo = 'directa' | 'wrapper' | 'jacketing'
type EstadoKlt =
  | { tipo: 'running' | 'ready' | 'fin' | 'nuevo' | 'sin-listos' | 'fuera' }
  | { tipo: 'bloqueado'; ult: string }

interface Plano {
  resultado: ResultadoPlanificacion
  fig: HTMLElement
  lugares: Record<string, { x: number; y: number }>
  /** KLTs con ULTs (los que tienen biblioteca), en orden de aparición. */
  klts: string[]
  ultsDe: Record<string, string[]>
  modo: Record<string, Modo | undefined>
  conQuantum: boolean
}

const planos = new WeakMap<HTMLElement, Plano>()
const CLASES = ['rc-ok', 'rc-mal', 'rc-aviso']
const PAR = 15

/** Dibuja el lienzo de hilos si el Gantt tiene ULTs; devuelve false para que `renderColas` siga con el general. */
export function renderColasHilos(root: HTMLElement, state: EstadoGantt): boolean {
  const { resultado, hasta } = state
  if (!soportado(resultado)) return false
  const i = hasta ?? resultado.ticks.length - 1
  const tick = resultado.ticks[i]
  if (!tick) return false

  let plano = planos.get(root)
  if (!plano || plano.resultado !== resultado || plano.fig.parentNode !== root) {
    plano = armar(resultado, state.procesos)
    planos.set(root, plano)
    root.replaceChildren(plano.fig)
    requestAnimationFrame(() => plano!.fig.classList.add('rc-animar'))
  }
  pintar(plano, tick, hasta == null ? null : (resultado.ticks[i - 1] ?? vacio(tick)))
  return true
}

/** New, suspendidos, varias colas, dispositivos u overhead del SO: los dibuja el lienzo general. */
function soportado(r: ResultadoPlanificacion): boolean {
  if (!r.kltDe || r.so) return false
  return r.ticks.every(
    (t) => t.bibliotecas && !t.colas && !t.dispositivos && !t.nuevos && !t.suspendidos,
  )
}

const vacio = (t: Tick): Tick => ({
  ...t,
  cpus: t.cpus.map(() => null),
  io: [],
  colaIO: [],
  listos: [],
  quantum: undefined,
  bibliotecas: [],
  estados: {},
})

const enIO = (t: Tick, id: string) =>
  t.io.includes(id) || t.colaIO.includes(id) || t.estados[id] === 'espera-so'

/** El modo de E/S no viaja en el resultado: se deduce de lo que hace la biblioteca al bloquearse un ULT. */
function deducirModo(r: ResultadoPlanificacion, klt: string, ults: string[]): Modo | undefined {
  let modo: Modo | undefined
  for (const t of r.ticks) {
    const b = t.bibliotecas!.find((x) => x.klt === klt)
    const bloqueado = ults.find((u) => enIO(t, u))
    if (!b || !bloqueado) continue
    if (ults.some((u) => t.cpus.includes(u)) || t.listos.includes(klt)) return 'jacketing'
    modo ??= b.elegido === bloqueado ? 'directa' : 'wrapper'
  }
  return modo
}

function estadoKlt(p: Plano, t: Tick, klt: string): EstadoKlt {
  const ults = p.ultsDe[klt]
  if (ults.some((u) => t.cpus.includes(u))) return { tipo: 'running' }
  if (t.listos.includes(klt)) return { tipo: 'ready' }
  if (ults.every((u) => t.estados[u] === 'fin')) return { tipo: 'fin' }
  if (ults.every((u) => t.estados[u] === 'nuevo')) return { tipo: 'nuevo' }
  const ult = ults.find((u) => enIO(t, u))
  if (ult) return p.modo[klt] === 'jacketing' ? { tipo: 'sin-listos' } : { tipo: 'bloqueado', ult }
  return { tipo: 'fuera' }
}

// ── Geometría (viewBox de 720 de ancho, como los recorridos de teoría) ──
const CPU_X = 480
const CPU_W = 160
const READY_FRENTE = 340
const CIO_FRENTE = 420
const DEV_X0 = 440
const CARD_W = 345
const CARD_H = 104

function armar(r: ResultadoPlanificacion, procesos: string[]): Plano {
  const kltDe = r.kltDe!
  const klts = [...new Set(r.ticks.flatMap((t) => t.bibliotecas!.map((b) => b.klt)))]
  const ultsDe = Object.fromEntries(
    klts.map((k) => [k, r.hilos.filter((h) => kltDe[h] === k)]),
  ) as Record<string, string[]>
  const maximo = (f: (t: Tick) => number, min: number) => Math.max(min, ...r.ticks.map(f))
  const nCpu = r.procesadores
  const nReady = maximo((t) => t.listos.length, 3)
  const nCio = maximo((t) => t.colaIO.length, 2)
  const nIo = maximo((t) => t.io.length, 1)
  const conQuantum = r.ticks.some((t) => t.quantum?.some((q) => q != null))
  const modo = Object.fromEntries(klts.map((k) => [k, deducirModo(r, k, ultsDe[k])]))
  const hayJacketing = klts.some((k) => modo[k] === 'jacketing')

  const cpuY = (k: number) => 70 + k * 60
  const readyY = (cpuY(0) + cpuY(nCpu - 1)) / 2
  const soAbajo = cpuY(nCpu - 1) + 25
  const ioY = soAbajo + 85
  const wR = Math.min(60, 240 / nReady)
  const readyAtras = READY_FRENTE - nReady * wR
  const cioAtras = CIO_FRENTE - nCio * 64
  const devW = 100 + nIo * 64
  const devDer = DEV_X0 + devW
  const cardsY = ioY + 42 + 40

  const lugares: Plano['lugares'] = {
    ...casilleros('listos', READY_FRENTE - (nReady * wR) / 2, readyY, nReady, wR),
    ...casilleros('cio', CIO_FRENTE - nCio * 32, ioY, nCio, 64),
  }
  for (let k = 0; k < nCpu; k++) lugares[`cpu-${k}`] = { x: CPU_X + 40, y: cpuY(k) }
  for (let i = 0; i < nIo; i++) lugares[`io-${i}`] = { x: DEV_X0 + 102 + i * 64, y: ioY }

  const cuerpo: string[] = [
    texto(READY_FRENTE - (nReady * wR) / 2, readyY - 36, 'Ready del SO (KLTs)', {
      clase: 're-nota',
    }),
    texto(READY_FRENTE - 14, readyY + 34, 'frente', { clase: 're-nota' }),
    `<text class="ch-t" x="712" y="12" data-val="t">t = 0</text>`,
  ]
  // sin quantum (FIFO, SJF…) la flecha de fin de quantum no aplica
  if (conQuantum)
    cuerpo.push(
      flecha(
        `M${CPU_X},${cpuY(0) - 25} L${CPU_X},18 L${readyAtras + 14},18 L${readyAtras + 14},${readyY - 24}`,
        'fin de quantum: al final de Ready',
        (CPU_X + readyAtras) / 2,
        8,
        '',
        'fin-q',
      ),
    )
  cuerpo.push(
    flecha(
      `M${CPU_X},${soAbajo} L${CPU_X},${ioY - 45} L${cioAtras + 22},${ioY - 45} L${cioAtras + 22},${ioY - 21}`,
      'pide E/S',
      (CPU_X + cioAtras) / 2,
      ioY - 57,
      '',
      'pide-io',
    ),
    flecha(`M${CIO_FRENTE + 2},${ioY} L${DEV_X0 - 4},${ioY}`),
    flecha(
      `M${devDer},${ioY} L${devDer + 24},${ioY} L${devDer + 24},${ioY + 42} L60,${ioY + 42} L60,${readyY} L${readyAtras - 4},${readyY}`,
      'fin de E/S: el KLT vuelve a Ready',
      250,
      ioY + 54,
      '',
      'fin-io',
    ),
    cola(READY_FRENTE - (nReady * wR) / 2, readyY, nReady, wR, 46, 'listos', 'dg-listo'),
    texto(CIO_FRENTE - nCio * 32, ioY - 32, 'cola de E/S', { clase: 're-nota' }),
    cola(CIO_FRENTE - nCio * 32, ioY, nCio, 64, 40, 'cola-io', 'dg-bloqueado'),
    bandeja(DEV_X0 + devW / 2, ioY, devW, 44, 'E/S', 'io', 'dg-bloqueado'),
  )
  // baja hasta la tarjeta de más a la derecha (con una sola, va centrada)
  const bajaX = Math.min(devDer - 30, (klts.length === 1 ? (720 + CARD_W) / 2 : 710) - 40)
  if (hayJacketing)
    cuerpo.push(
      flecha(
        `M${devDer - 30},${ioY + 22} L${devDer - 30},${cardsY - 12} L${bajaX},${cardsY - 12} L${bajaX},${cardsY - 4}`,
        'jacketing: a su biblioteca',
        devDer - 124,
        ioY + 57,
        '',
        'fin-io-bib',
      ),
    )
  for (let k = 0; k < nCpu; k++) {
    const y = cpuY(k)
    cuerpo.push(
      flecha(
        `M${READY_FRENTE + 2},${readyY} L${CPU_X - CPU_W / 2 - 4},${y}`,
        undefined,
        0,
        0,
        '',
        `dispatch-${k}`,
      ),
      bandeja(CPU_X, y, CPU_W, 50, nCpu > 1 ? `CPU ${k + 1}` : 'CPU', `cpu-${k}`, 'dg-activo'),
    )
    if (conQuantum) cuerpo.push(recuadro(640, y, 130, 34, `q-${k}`, `q-${k}`, 'q: —'))
  }

  const filas = Math.ceil(klts.length / 2)
  klts.forEach((klt, i) => {
    const solo = klts.length === 1
    const x0 = solo ? (720 - CARD_W) / 2 : 10 + (i % 2) * (CARD_W + 10)
    const y0 = cardsY + Math.floor(i / 2) * (CARD_H + 18)
    const nB = Math.max(
      2,
      ...r.ticks.map((t) => t.bibliotecas!.find((b) => b.klt === klt)?.listos.length ?? 0),
    )
    const wB = Math.min(44, 176 / nB)
    const y1 = y0 + 42
    const y2 = y0 + 82
    const qx = x0 + 16 + (nB * wB) / 2
    const qDer = x0 + 16 + nB * wB
    const ex = qDer + 30 + 50
    const modoTxt = modo[klt]
      ? ` · E/S ${modo[klt] === 'directa' ? 'syscall directa' : modo[klt]}`
      : ''
    Object.assign(lugares, casilleros(`bib-${klt}`, qx, y1, nB, wB), {
      [`eleg-${klt}`]: { x: ex, y: y1 },
      [`casa-${klt}`]: { x: x0 + 30, y: y2 },
    })
    const estW = CARD_W - 66
    cuerpo.push(
      panelLeyenda(x0, y0, CARD_W, CARD_H, `KLT ${klt} · su biblioteca${modoTxt}`, {
        el: `card-${klt}`,
      }),
      texto(x0 + 16, y0 + 16, 'ULTs listos', { clase: 're-nota re-izq' }),
      texto(ex, y0 + 16, 'elegido', { clase: 're-nota' }),
      cola(qx, y1, nB, wB, 36, `bibq-${klt}`, 'dg-listo'),
      flecha(`M${qDer + 2},${y1} L${ex - 54},${y1}`, undefined, 0, 0, '', `elige-${klt}`),
      recuadro(ex, y1, 100, 36, `eleg-${klt}`, `eleg-${klt}`, '—', 'dg-activo'),
      recuadro(x0 + 54 + estW / 2, y2, estW, 30, `estado-${klt}`, `estado-${klt}`, ''),
    )
  })
  const alto = cardsY + filas * (CARD_H + 18) - 6

  const color = (id: string) => `var(--p${(Math.max(0, procesos.indexOf(id)) % 8) + 1})`
  const fichas = [
    ...klts.map(
      (k) =>
        `<g class="rc-ficha ch-klt rc-fuera" data-ch-ficha="klt:${esc(k)}"><rect x="-13" y="-11" width="26" height="22" rx="6"/><text>${esc(k)}</text></g>`,
    ),
    ...r.hilos.map(
      (h) =>
        `<g class="rc-ficha ch-ficha rc-fuera" data-ch-ficha="${esc(h)}" style="--c: ${color(h)}"><title>${esc(etiquetaHilo(r, h))}</title><circle r="13"/><text>${esc(h)}</text></g>`,
    ),
  ].join('')

  const fig = document.createElement('figure')
  fig.className = 'diagrama recorrido rc-activo colas-hilos'
  fig.innerHTML =
    lienzo({ ancho: 720, alto, titulo: 'Colas', cuerpo }, fichas) +
    `<figcaption class="ch-leyenda"><span><i class="ch-ley-klt"></i>KLT: lo planifica el SO</span>` +
    `<span><i class="ch-ley-hilo"></i>hilo (ULT o KLT simple), con el color de su fila del Gantt</span></figcaption>`
  return { resultado: r, fig, lugares, klts, ultsDe, modo, conQuantum }
}

/** Posición de cada ficha en este tick; las que no aparecen se ocultan (sin llegar o terminadas). */
function ubicar(p: Plano, t: Tick, estados: Record<string, EstadoKlt>): Map<string, Punto> {
  const pos = new Map<string, Punto>()
  const kltDe = p.resultado.kltDe!
  const poner = (lugar: string, hilo: string, conKlt: boolean) => {
    const l = p.lugares[lugar]
    if (!l) return
    const klt = kltDe[hilo]
    if (klt && conKlt) {
      pos.set(`klt:${klt}`, [l.x - PAR, l.y])
      pos.set(hilo, [l.x + PAR, l.y])
    } else pos.set(hilo, [l.x, l.y])
  }
  t.listos.forEach((id, i) => {
    const l = p.lugares[`listos-${i}`]
    if (l) pos.set(p.ultsDe[id] ? `klt:${id}` : id, [l.x, l.y])
  })
  t.cpus.forEach((id, k) => id && poner(`cpu-${k}`, id, true))
  // en E/S el KLT va pegado a su ULT solo si quedó bloqueado entero (directa o wrapper)
  const entero = (h: string) => estados[kltDe[h]]?.tipo === 'bloqueado'
  t.io.forEach((h, i) => poner(`io-${i}`, h, entero(h)))
  t.colaIO.forEach((h, i) => poner(`cio-${i}`, h, entero(h)))
  for (const b of t.bibliotecas!) {
    if (b.elegido && !pos.has(b.elegido)) poner(`eleg-${b.klt}`, b.elegido, false)
    b.listos.forEach((u, i) => pos.has(u) || poner(`bib-${b.klt}-${i}`, u, false))
    const e = estados[b.klt].tipo
    if (!pos.has(`klt:${b.klt}`) && e !== 'fin' && e !== 'nuevo') {
      const casa = p.lugares[`casa-${b.klt}`]
      pos.set(`klt:${b.klt}`, [casa.x, casa.y])
    }
  }
  return pos
}

const TEXTO_ESTADO: Record<EstadoKlt['tipo'], string> = {
  running: 'Running',
  ready: 'Ready: espera en la cola del SO',
  fin: 'terminó: no le quedan ULTs',
  nuevo: 'todavía no llegó',
  'sin-listos': 'sin ULTs listos: dejó la CPU',
  bloqueado: 'Blocked entero',
  fuera: 'fuera de la CPU',
}
const CLASE_ESTADO: Partial<Record<EstadoKlt['tipo'], string>> = {
  running: 'rc-ok',
  bloqueado: 'rc-mal',
  'sin-listos': 'rc-aviso',
}

function pintar(p: Plano, t: Tick, prev: Tick | null): void {
  const { fig, resultado: r } = p
  const svg = $<SVGSVGElement>('svg', fig)!
  const kltDe = r.kltDe!
  const estados = Object.fromEntries(p.klts.map((k) => [k, estadoKlt(p, t, k)]))
  const pos = ubicar(p, t, estados)
  const val: Record<string, string> = { t: `t = ${t.t}` }
  const clase: Record<string, string> = {}
  const on = new Set<string>()
  const cambio = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b)

  t.cpus.forEach((id, k) => {
    const q = t.quantum?.[k]
    val[`q-${k}`] = id && q != null ? `q de ${kltDe[id] ?? id}: ${q}` : 'q: —'
  })
  for (const b of t.bibliotecas!) {
    const e = estados[b.klt]
    const donde = !b.elegido
      ? '—'
      : t.cpus.includes(b.elegido)
        ? 'en CPU'
        : enIO(t, b.elegido)
          ? 'en E/S'
          : ''
    val[`eleg-${b.klt}`] = donde && b.elegido ? `${b.elegido} ${donde}` : donde
    val[`estado-${b.klt}`] =
      `${b.klt}: ${TEXTO_ESTADO[e.tipo]}${e.tipo === 'bloqueado' ? ` (E/S de ${e.ult})` : ''}`
    if (CLASE_ESTADO[e.tipo]) clase[`estado-${b.klt}`] = CLASE_ESTADO[e.tipo]!
    if (e.tipo === 'bloqueado') {
      clase[`card-${b.klt}`] = 'rc-mal'
      // sus ULTs listos no pueden ejecutar: la biblioteca solo corre con el KLT en CPU
      if (b.listos.length) clase[`bibq-${b.klt}`] = 'rc-aviso'
    }
  }

  if (prev) {
    const quien = (h: string) => kltDe[h] ?? h
    const sigueEnSO = (h: string) =>
      t.listos.includes(quien(h)) || t.cpus.some((c) => c && quien(c) === quien(h))
    t.cpus.forEach((id, k) => {
      // vence el quantum aunque el SO lo vuelva a elegir enseguida
      const antes = prev.cpus[k]
      if (antes && prev.quantum?.[k] === 1 && sigueEnSO(antes))
        on.add('fin-q').add('listos').add(`cpu-${k}`).add(`q-${k}`)
      if (id === antes) return
      on.add(`cpu-${k}`).add(`q-${k}`)
      // cambiar de ULT dentro del mismo KLT no es un dispatch del SO
      if (id && (!antes || quien(id) !== quien(antes))) on.add(`dispatch-${k}`)
    })
    for (const h of prev.cpus) {
      if (!h || t.cpus.includes(h)) continue
      if (enIO(t, h)) on.add('pide-io').add(t.io.includes(h) ? 'io' : 'cola-io')
      else if (t.listos.includes(quien(h)) && !prev.listos.includes(quien(h)))
        on.add('fin-q').add('listos')
    }
    for (const h of prev.io) {
      if (enIO(t, h) || t.estados[h] === 'fin') continue
      const k = kltDe[h]
      const vuelve = t.listos.includes(k ?? h) || t.cpus.some((c) => c && quien(c) === (k ?? h))
      const estaba =
        prev.listos.includes(k ?? h) || prev.cpus.some((c) => c && quien(c) === (k ?? h))
      if (k && p.modo[k] === 'jacketing') on.add('fin-io-bib').add(`bibq-${k}`)
      if (vuelve && !estaba) on.add('fin-io').add('listos')
    }
    if (cambio(prev.listos, t.listos)) on.add('listos')
    if (cambio(prev.io, t.io)) on.add('io')
    if (cambio(prev.colaIO, t.colaIO)) on.add('cola-io')
    for (const b of t.bibliotecas!) {
      const a = prev.bibliotecas?.find((x) => x.klt === b.klt)
      const k = b.klt
      if (cambio(a, b) || cambio(estadoKlt(p, prev, k), estados[k]))
        on.add(`card-${k}`).add(`bibq-${k}`).add(`eleg-${k}`).add(`estado-${k}`)
      if (b.elegido && a?.elegido !== b.elegido) on.add(`elige-${k}`)
    }
    if (!on.size) t.cpus.forEach((id, k) => id && on.add(`cpu-${k}`).add(`q-${k}`))
  }

  fig.toggleAttribute('data-rc-foco', on.size > 0)
  for (const el of $$<SVGElement>('[data-el]', svg)) {
    const id = el.dataset.el!
    el.classList.toggle('rc-on', on.has(id))
    el.classList.remove(...CLASES)
    if (clase[id]) el.classList.add(clase[id])
    for (const path of $$<SVGPathElement>('path[marker-end*="dg-punta"]', el))
      path.setAttribute('marker-end', `url(#${on.has(id) ? 'dg-punta-on' : 'dg-punta'})`)
  }
  for (const el of $$<SVGElement>('[data-val]', svg)) el.textContent = val[el.dataset.val!] ?? ''

  for (const f of $$<SVGGElement>('[data-ch-ficha]', svg)) {
    const lugar = pos.get(f.dataset.chFicha!)
    // una ficha que recién aparece se ubica sin animar (si no, vuela desde el origen)
    const aparece = !!lugar && (f.classList.contains('rc-fuera') || !f.style.transform)
    if (aparece) f.classList.add('rc-salto')
    f.classList.toggle('rc-fuera', !lugar)
    if (lugar) f.style.transform = `translate(${lugar[0]}px, ${lugar[1]}px)`
    if (aparece) {
      f.getBoundingClientRect()
      requestAnimationFrame(() => f.classList.remove('rc-salto'))
    }
  }
  svg.setAttribute('aria-label', resumen(p, t))
}

/** Lo mismo en texto, para lectores de pantalla. */
function resumen(p: Plano, t: Tick): string {
  const r = p.resultado
  const cpus = t.cpus.map(
    (id, k) => `CPU${t.cpus.length > 1 ? ` ${k + 1}` : ''}: ${id ? etiquetaHilo(r, id) : 'libre'}`,
  )
  const libs = t.bibliotecas!.map(
    (b) =>
      `biblioteca de ${b.klt}: elegido ${b.elegido ?? 'ninguno'}, cola ${b.listos.join(', ') || 'vacía'}`,
  )
  return [
    `t=${t.t}`,
    ...cpus,
    `Ready: ${t.listos.join(', ') || 'vacía'}`,
    `E/S: ${t.io.join(', ') || 'libre'}`,
    `cola de E/S: ${t.colaIO.join(', ') || 'vacía'}`,
    ...libs,
  ].join('. ')
}
