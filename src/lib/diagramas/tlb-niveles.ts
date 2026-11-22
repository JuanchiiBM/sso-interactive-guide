/** TLB con paginación de dos niveles y bitmap de frames (tablero tlb-08, ej-08). Ver brain: Resolución gráfica de la TLB. */
import type { Etapa } from './recorrido-tlb'

export interface EntradaNiveles {
  pagina: number
  frame: number
  proceso: string
}

export interface SpecTlbNiveles {
  titulo: string
  /** Bits de 1.er y 2.º nivel. */
  niveles: [number, number]
  bitsOffset: number
  bitsFrame: number
  /** La TLB tiene lugar: si se llena, rompe el build (sin reemplazo). */
  entradas: number
  tlb?: EntradaNiveles[]
  /** Entrada de 1.er nivel → dirección de su tabla de 2.º nivel. */
  tp1: Record<number, number>
  tablas: Record<number, Record<number, { frame: number; p: 0 | 1 }>>
  /** Bits del bitmap desde el frame `desde`, donde está la flecha. */
  bitmap: { desde: number; bits: (0 | 1)[] }
  referencias: { proceso: string; dl: number }[]
}

export interface PasoNiveles {
  proceso: string
  dl: number
  pagina: number
  n1: number
  n2: number
  offset: number
  hit: boolean
  /** Entrada de otro proceso con la misma página (el miss que confunde). */
  otra?: EntradaNiveles
  tabla?: number
  pf: boolean
  frame: number
  df: number
  tlb: EntradaNiveles[]
  bits: (0 | 1)[]
  hits: number
  accesos: number
  pfs: number
}

export const hxd = (n: number, bits: number) =>
  n
    .toString(16)
    .toUpperCase()
    .padStart(Math.ceil(bits / 4), '0')

export function simularNiveles(spec: SpecTlbNiveles): PasoNiveles[] {
  const [b1, b2] = spec.niveles
  const bo = spec.bitsOffset
  let tlb = (spec.tlb ?? []).map((e) => ({ ...e }))
  const bits = [...spec.bitmap.bits]
  const tablas = structuredClone(spec.tablas)
  let hits = 0
  let accesos = 0
  let pfs = 0
  return spec.referencias.map((r) => {
    const pagina = Math.floor(r.dl / 2 ** bo)
    const n1 = Math.floor(pagina / 2 ** b2)
    const n2 = pagina % 2 ** b2
    if (n1 >= 2 ** b1) throw new Error(`tlb: ${hxd(r.dl, 0)}h no entra en ${b1 + b2 + bo} bits`)
    const offset = r.dl % 2 ** bo
    const e = tlb.find((t) => t.pagina === pagina && t.proceso === r.proceso)
    const paso = { proceso: r.proceso, dl: r.dl, pagina, n1, n2, offset, hit: !!e, pf: false }
    let frame: number
    let tabla: number | undefined
    if (e) {
      hits++
      frame = e.frame
    } else {
      tabla = spec.tp1[n1]
      if (tabla == null) throw new Error(`tlb: falta la entrada ${hxd(n1, b1)} en \`tp1\``)
      const fila = tablas[tabla]?.[n2]
      if (!fila) throw new Error(`tlb: falta TP2[${hxd(n2, b2)}] en la tabla ${hxd(tabla, 32)}h`)
      accesos += 2
      if (!fila.p) {
        const i = bits.indexOf(0)
        if (i < 0) throw new Error('tlb: el bitmap no tiene frames libres')
        bits[i] = 1
        Object.assign(fila, { frame: spec.bitmap.desde + i, p: 1 })
        paso.pf = true
        pfs++
      }
      frame = fila.frame
      if (tlb.length >= spec.entradas) throw new Error('tlb: la TLB se llenó (sin reemplazo)')
      tlb = [...tlb, { pagina, frame, proceso: r.proceso }]
    }
    const otra = tlb.find((t) => t.pagina === pagina && t.proceso !== r.proceso)
    return {
      ...paso,
      otra,
      tabla,
      frame,
      df: frame * 2 ** bo + offset,
      tlb,
      bits: [...bits],
      hits,
      accesos,
      pfs,
    }
  })
}

export function etapasNiveles(spec: SpecTlbNiveles, x: PasoNiveles): Etapa[] {
  const [b1, b2] = spec.niveles
  const { bitsOffset: bo, bitsFrame: bf } = spec
  const pag = hxd(x.pagina, b1 + b2)
  const fr = hxd(x.frame, bf)
  const r: Etapa[] = [
    {
      titulo: 'DL',
      dato: `${hxd(x.dl, b1 + b2 + bo)}h = ${hxd(x.n1, b1)} | ${hxd(x.n2, b2)} | ${hxd(x.offset, bo)}`,
      porque: `${b1} bits de 1.er nivel | ${b2} de 2.º nivel | ${bo} de offset → página ${pag}`,
      tono: 'neutro',
    },
  ]
  if (x.hit)
    r.push({
      titulo: 'TLB',
      dato: `hit: ${pag} → ${fr}, de ${x.proceso}`,
      porque: 'Es del mismo proceso: no se leen las tablas de páginas.',
      tono: 'ok',
    })
  else {
    r.push({
      titulo: 'TLB',
      dato: x.otra ? `miss: la ${pag} es de ${x.otra.proceso}` : `miss: no está la ${pag}`,
      porque: x.otra
        ? `Está ${pag} → ${hxd(x.otra.frame, bf)}, pero de ${x.otra.proceso}: no sirve para ${x.proceso}.`
        : `La TLB no tiene la ${pag} de ${x.proceso}.`,
      tono: 'mal',
    })
    r.push({
      titulo: 'TP 1.er nivel',
      dato: `TP1[${hxd(x.n1, b1)}] → ${hxd(x.tabla!, 32)}h`,
      porque: 'Acceso a memoria: dónde empieza la tabla de 2.º nivel.',
      tono: 'neutro',
    })
    r.push({
      titulo: 'TP 2.º nivel',
      dato: `TP2[${hxd(x.n2, b2)}] · presencia ${x.pf ? '0 → PF' : `1 → frame ${fr}`}`,
      porque: x.pf
        ? 'Acceso a memoria. La página no está cargada.'
        : 'Acceso a memoria. La página está cargada: no hay PF.',
      tono: x.pf ? 'mal' : 'neutro',
    })
    if (x.pf)
      r.push({
        titulo: 'Bitmap de frames',
        dato: `primer libre: ${fr}h (${x.frame})`,
        porque: `Asignación ascendente desde la flecha: el ${fr} está en 0, pasa a 1. Hay lugar: sin víctima.`,
        tono: 'aviso',
      })
    r.push({
      titulo: 'TLB',
      dato: `entra ${pag} → ${fr}, ${x.proceso}`,
      porque: 'La TLB tiene lugar: se agrega sin sacar ninguna.',
      tono: 'aviso',
    })
  }
  r.push({
    titulo: 'DF',
    dato: `${fr} | ${hxd(x.offset, bo)} → ${hxd(x.df, bf + bo)}h`,
    porque: `frame (${bf} bits) | offset (${bo} bits)`,
    tono: 'ok',
  })
  return r
}
