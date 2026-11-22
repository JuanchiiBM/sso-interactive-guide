/** Simulación de la TLB (FIFO) con reemplazo local LRU por proceso. Ver brain: Resolución gráfica de la TLB. */
import { reemplazoConEstado, type InstanteUM } from './memoria'

export interface EntradaTlb {
  pagina: number
  frame: number
  proceso: string
  ingreso: number
}

/** Un frame asignado al proceso; sin `pagina`, libre. `acc` = instante de la última referencia. */
export interface FrameProceso {
  frame: number
  pagina?: number
  acc?: number
}

export interface RefTlb {
  proceso: string
  dl?: number
  pagina?: number
  instante?: number
}

export interface SpecTlb {
  titulo: string
  /** Sin bits, cada referencia ya es una página (ej-06): no hay DL ni DF. */
  bitsPagina?: number
  bitsOffset?: number
  bitsFrame?: number
  /** Capacidad de la TLB; `tlb` es su contenido inicial. */
  entradas: number
  tlb?: EntradaTlb[]
  procesos: Record<string, FrameProceso[]>
  /** Con un solo proceso, cada referencia puede ser solo la página. */
  referencias: (RefTlb | number)[]
}

export interface PasoTlb {
  proceso: string
  instante: number
  pagina: number
  dl?: number
  offset?: number
  /** Posición de la TLB que acertó, o null. */
  hit: number | null
  pf: boolean
  frame: number
  /** Frames del proceso que tenían página antes de esta referencia. */
  ocupados: number[]
  /** Frames del proceso antes del PF (para explicar LRU); solo si hubo víctima. */
  usos?: { pagina: number; acc: number }[]
  victima?: { pagina: number; frame: number; acc: number }
  /** En la TLB: la entrada que sale (null si había lugar) y la posición donde entra la nueva. */
  sale?: EntradaTlb | null
  pos?: number
  tlbAntes: EntradaTlb[]
  tlb: EntradaTlb[]
  df?: number
  hits: number
  accesosTP: number
  pfs: number
}

/** "A" → "PA", como en los enunciados; "P1" queda igual. */
export const rotuloProceso = (p: string) => (p.startsWith('P') ? p : `P${p}`)

export function simularTlb(spec: SpecTlb): PasoTlb[] {
  const nombres = Object.keys(spec.procesos)
  const bo = spec.bitsOffset ?? 0
  const refs = spec.referencias.map((r, i) => {
    const ref = typeof r === 'number' ? { proceso: nombres[0], pagina: r } : r
    if (typeof r === 'number' && nombres.length > 1)
      throw new Error(`tlb: la referencia ${r} no dice de qué proceso es`)
    const marcos = spec.procesos[ref.proceso]
    if (!marcos) throw new Error(`tlb: el proceso ${ref.proceso} no está en \`procesos\``)
    let pagina = ref.pagina
    if (ref.dl != null) {
      if (!spec.bitsPagina || !spec.bitsOffset)
        throw new Error('tlb: para cortar una DL faltan bitsPagina y bitsOffset')
      if (ref.dl >= 2 ** (spec.bitsPagina + bo))
        throw new Error(`tlb: ${ref.dl.toString(16)}h no entra en ${spec.bitsPagina + bo} bits`)
      pagina = Math.floor(ref.dl / 2 ** bo)
    }
    if (pagina == null) throw new Error(`tlb: la referencia ${i + 1} no tiene \`dl\` ni \`pagina\``)
    const offset = ref.dl != null ? ref.dl % 2 ** bo : undefined
    return { proceso: ref.proceso, dl: ref.dl, pagina, offset, instante: ref.instante ?? i + 1 }
  })

  // las víctimas salen de reemplazoConEstado, igual que la traza del ejercicio
  const lru: Record<string, InstanteUM[]> = {}
  for (const p of nombres) {
    const marcos = spec.procesos[p]
    const suyas = refs.filter((r) => r.proceso === p)
    let ultimo = Math.max(0, ...marcos.map((m) => m.acc ?? 0))
    for (const r of suyas) {
      if (r.instante <= ultimo)
        throw new Error(`tlb: el instante ${r.instante} de ${p} no es posterior a ${ultimo}`)
      ultimo = r.instante
    }
    const inicial = marcos.map((m) => ({
      marco: m.frame,
      pagina: m.pagina ?? null,
      u: false,
      m: false,
      ultimoUso: m.acc ?? 0,
    }))
    lru[p] = reemplazoConEstado(
      inicial,
      0,
      suyas.map((r) => ({ pagina: r.pagina, escritura: false })),
      'lru',
    )
  }

  const estado = Object.fromEntries(
    nombres.map((p) => [p, spec.procesos[p].map((m) => ({ ...m }))]),
  )
  const k = Object.fromEntries(nombres.map((p) => [p, 0]))
  let tlb = (spec.tlb ?? []).map((e) => ({ ...e }))
  if (tlb.length > spec.entradas) throw new Error('tlb: hay más entradas que `entradas`')
  let hits = 0
  let accesosTP = 0
  let pfs = 0

  return refs.map((r) => {
    const inst = lru[r.proceso][k[r.proceso]++]
    const marcos = estado[r.proceso]
    const tlbAntes = tlb.map((e) => ({ ...e }))
    const h = tlb.findIndex((e) => e.pagina === r.pagina && e.proceso === r.proceso)
    const i = inst.fallo ? inst.marco! : marcos.findIndex((m) => m.pagina === r.pagina)
    const frame = marcos[i].frame
    if (h >= 0 && (inst.fallo || tlb[h].frame !== frame))
      throw new Error(
        `tlb: la entrada ${r.pagina}/${tlb[h].frame}/${r.proceso} no coincide con la TP`,
      )

    const paso: PasoTlb = {
      ...r,
      hit: h >= 0 ? h : null,
      pf: inst.fallo,
      frame,
      ocupados: marcos.filter((m) => m.pagina != null).map((m) => m.frame),
      tlbAntes,
      tlb,
      hits,
      accesosTP,
      pfs,
    }
    if (inst.victima != null) {
      const v = marcos[i]
      paso.usos = marcos.map((m) => ({ pagina: m.pagina!, acc: m.acc ?? 0 }))
      paso.victima = { pagina: v.pagina!, frame, acc: v.acc ?? 0 }
    }
    marcos[i] = { frame, pagina: r.pagina, acc: r.instante }

    if (h >= 0) hits++
    else {
      accesosTP++
      const nueva = { pagina: r.pagina, frame, proceso: r.proceso, ingreso: r.instante }
      tlb = tlb.map((e) => ({ ...e }))
      if (tlb.length < spec.entradas) {
        paso.sale = null
        paso.pos = tlb.push(nueva) - 1
      } else {
        const ingresos = tlb.map((e) => e.ingreso)
        paso.pos = ingresos.indexOf(Math.min(...ingresos))
        paso.sale = tlb[paso.pos]
        tlb[paso.pos] = nueva
      }
    }
    const v = paso.victima
    if (v && tlb.some((e) => e.pagina === v.pagina && e.proceso === r.proceso))
      throw new Error(`tlb: la víctima ${v.pagina} de ${r.proceso} queda en la TLB (no soportado)`)
    if (inst.fallo) pfs++
    if (r.offset != null) paso.df = frame * 2 ** bo + r.offset
    return { ...paso, tlb, hits, accesosTP, pfs }
  })
}
