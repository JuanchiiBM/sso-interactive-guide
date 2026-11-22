/** Deducir el algoritmo de reemplazo: víctima real (por la DF) contra la de cada algoritmo. Ver brain: Resolución gráfica de la TLB. */
import { reemplazoConEstado } from './memoria'

export type AlgDeducir = 'fifo' | 'lru' | 'clock' | 'clock-mejorado'

export interface MarcoDeducir {
  frame: number
  proceso?: string
  pagina: number
  /** Última referencia (TUR, REF, TS…) y carga. */
  tur?: number
  tc?: number
  u?: 0 | 1
  m?: 0 | 1
}

export interface SpecDeducir {
  titulo: string
  bitsOffset: number
  bitsDL: number
  bitsDF: number
  /** En el orden en que los recorre el puntero. */
  marcos: MarcoDeducir[]
  referencias: { proceso?: string; dl: number; df: number; acceso?: 'L' | 'E' }[]
  algoritmos: AlgDeducir[]
  /** Frame donde arranca el puntero; sin él, se prueban todas las posiciones. */
  puntero?: number
  /** Nombre de la columna de última referencia en el enunciado. */
  uso?: string
}

export interface RefReal {
  proceso?: string
  pagina: number
  frame: number
  /** null = la página ya estaba (acierto). */
  victima: number | null
}

export interface ResultadoAlg {
  alg: AlgDeducir
  coincide: boolean
  /** Frame inicial del puntero que mejor ajusta; null en LRU o FIFO por TC. */
  puntero: number | null
  /** Da lo mismo dónde arranque el puntero. */
  cualquiera: boolean
  /** Frame que saca en cada referencia (null = acierto), hasta el primer desvío inclusive. */
  victimas: (number | null)[]
  /** Índice de la primera referencia que no coincide, o -1. */
  desvio: number
}

export const rotulo = (proceso: string | undefined, pagina: number) => `${proceso ?? ''}${pagina}`

export function realDe(spec: SpecDeducir): RefReal[] {
  const marcos = spec.marcos.map((m) => ({ ...m }))
  return spec.referencias.map((r) => {
    const pagina = Math.floor(r.dl / 2 ** spec.bitsOffset)
    const frame = Math.floor(r.df / 2 ** spec.bitsOffset)
    const i = marcos.findIndex((m) => m.frame === frame)
    if (i < 0) throw new Error(`deducir: el frame ${frame} no está en \`marcos\``)
    const ya = marcos.findIndex((m) => m.pagina === pagina && m.proceso === r.proceso)
    if (ya >= 0 && ya !== i)
      throw new Error(
        `deducir: ${rotulo(r.proceso, pagina)} estaba en el frame ${marcos[ya].frame}, no en el ${frame}`,
      )
    const victima = ya >= 0 ? null : frame
    marcos[i] = { ...marcos[i], proceso: r.proceso, pagina }
    return { proceso: r.proceso, pagina, frame, victima }
  })
}

function simular(spec: SpecDeducir, alg: AlgDeducir, inicio: number): (number | null)[] {
  const clave = (p: string | undefined, n: number) => rotulo(p, n)
  const ids: string[] = []
  const id = (k: string) => (ids.includes(k) ? ids.indexOf(k) : ids.push(k) - 1)
  const inicial = spec.marcos.map((m) => ({
    marco: m.frame,
    pagina: id(clave(m.proceso, m.pagina)),
    u: !!m.u,
    m: !!m.m,
    ultimoUso: m.tur ?? 0,
  }))
  const refs = spec.referencias.map((r) => ({
    pagina: id(clave(r.proceso, Math.floor(r.dl / 2 ** spec.bitsOffset))),
    escritura: r.acceso === 'E',
  }))
  return reemplazoConEstado(inicial, inicio, refs, alg).map((x) =>
    x.fallo ? spec.marcos[x.marco!].frame : null,
  )
}

export function deducir(spec: SpecDeducir): { real: RefReal[]; algoritmos: ResultadoAlg[] } {
  const real = realDe(spec)
  const n = spec.marcos.length
  const conTc = spec.marcos.every((m) => m.tc != null)
  const algoritmos = spec.algoritmos.map((alg) => {
    let inicios: number[]
    if (alg === 'lru') inicios = [0]
    else if (alg === 'fifo' && conTc) {
      if (real.length > 1) throw new Error('deducir: FIFO por TC solo con una referencia')
      const tcs = spec.marcos.map((m) => m.tc!)
      inicios = [tcs.indexOf(Math.min(...tcs))]
    } else if (spec.puntero != null) {
      const i = spec.marcos.findIndex((m) => m.frame === spec.puntero)
      if (i < 0) throw new Error(`deducir: el puntero ${spec.puntero} no es un frame de \`marcos\``)
      inicios = [i]
    } else inicios = Array.from({ length: n }, (_, i) => i)

    const corridas = inicios.map((inicio) => {
      const v = simular(spec, alg, inicio)
      const desvio = v.findIndex((f, k) => f !== real[k].victima)
      return { inicio, v, desvio, largo: desvio < 0 ? v.length : desvio }
    })
    const mejor = corridas.reduce((a, b) => (b.largo > a.largo ? b : a))
    const misma = corridas.every((c) => c.v.join() === mejor.v.join())
    const conPuntero = alg !== 'lru' && !(alg === 'fifo' && conTc)
    return {
      alg,
      coincide: mejor.desvio < 0,
      puntero: conPuntero ? spec.marcos[mejor.inicio].frame : null,
      cualquiera: conPuntero && misma,
      victimas: mejor.desvio < 0 ? mejor.v : mejor.v.slice(0, mejor.desvio + 1),
      desvio: mejor.desvio,
    }
  })
  return { real, algoritmos }
}
