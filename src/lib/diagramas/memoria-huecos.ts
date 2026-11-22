/** Simulación de huecos para la resolución gráfica (```memoria): cargas con un algoritmo, liberar y compactar. */
import { ubicar, type AlgoritmoUbicacion, type Hueco } from './memoria'

export interface BloqueMem {
  nombre: string
  /** Por defecto, lo que está antes del primer punto del nombre (`B.S1` → `B`). */
  proceso: string
  inicio: number
  tam: number
}

export type OpMem =
  | {
      carga: string
      proceso?: string
      tam: number
      /** Movimientos de la compactación, si la carga no entra (los elige el autor). */
      compactar?: { mover: string; a: number }[]
      texto?: string
    }
  | { libera: string; texto?: string }

export interface SpecMemoria {
  total: number
  algoritmo: AlgoritmoUbicacion
  inicial: (Omit<BloqueMem, 'proceso'> & { proceso?: string })[]
  operaciones: OpMem[]
}

export type EstadoCandidato = 'elegido' | 'empate' | 'no-elegido' | 'no-entra'

export interface PasoMem {
  /** null en el estado inicial. */
  op: OpMem | null
  antes: BloqueMem[]
  despues: BloqueMem[]
  huecosAntes: Hueco[]
  candidatos: { hueco: Hueco; estado: EstadoCandidato }[]
  movidos: { nombre: string; de: number; a: number }[]
  nuevo: BloqueMem | null
  liberados: BloqueMem[]
}

const procesoDe = (nombre: string) => nombre.split('.')[0]
const ordenar = (bs: BloqueMem[]) => [...bs].sort((a, b) => a.inicio - b.inicio)

/** Lo libre entre los bloques; tira error si dos bloques se superponen o se salen de la memoria. */
export function huecosDe(total: number, bloques: BloqueMem[]): Hueco[] {
  const huecos: Hueco[] = []
  let dir = 0
  for (const b of ordenar(bloques)) {
    if (b.inicio < dir) throw new Error(`memoria: ${b.nombre} se superpone con otro bloque`)
    if (b.inicio > dir) huecos.push({ inicio: dir, tam: b.inicio - dir })
    dir = b.inicio + b.tam
  }
  if (dir > total) throw new Error('memoria: un bloque se sale de la memoria')
  if (dir < total) huecos.push({ inicio: dir, tam: total - dir })
  return huecos
}

function candidatos(huecos: Hueco[], tam: number, elegido: number, alg: AlgoritmoUbicacion) {
  const empata = (h: Hueco) => (alg === 'mejor' || alg === 'peor') && h.tam === huecos[elegido]?.tam
  return huecos.map((hueco, i) => ({
    hueco,
    estado: (hueco.tam < tam
      ? 'no-entra'
      : i === elegido
        ? 'elegido'
        : empata(hueco)
          ? 'empate'
          : 'no-elegido') as EstadoCandidato,
  }))
}

export function simularHuecos(spec: SpecMemoria): PasoMem[] {
  let bloques = ordenar(
    spec.inicial.map((b) => ({ ...b, proceso: b.proceso ?? procesoDe(b.nombre) })),
  )
  huecosDe(spec.total, bloques)
  const vacio = { candidatos: [], movidos: [], nuevo: null, liberados: [] }
  const pasos: PasoMem[] = [
    {
      op: null,
      antes: bloques,
      despues: bloques,
      huecosAntes: huecosDe(spec.total, bloques),
      ...vacio,
    },
  ]
  let ultima = 0 // fin de la última asignación (siguiente ajuste)

  for (const op of spec.operaciones) {
    const antes = bloques
    const huecosAntes = huecosDe(spec.total, antes)
    if ('libera' in op) {
      const liberados = antes.filter((b) => b.proceso === op.libera || b.nombre === op.libera)
      if (!liberados.length) throw new Error(`memoria: no hay nada que liberar de ${op.libera}`)
      bloques = antes.filter((b) => !liberados.includes(b))
      pasos.push({ op, antes, despues: bloques, huecosAntes, ...vacio, liberados })
      continue
    }
    let i = ubicar(huecosAntes, op.tam, spec.algoritmo, ultima)
    const cands = candidatos(huecosAntes, op.tam, i, spec.algoritmo)
    let movidos: PasoMem['movidos'] = []
    let huecos = huecosAntes
    if (i < 0) {
      if (!op.compactar) throw new Error(`memoria: ${op.carga} no entra y no hay compactación`)
      movidos = op.compactar.map(({ mover, a }) => {
        const b = bloques.find((x) => x.nombre === mover)
        if (!b) throw new Error(`memoria: no existe ${mover} para mover`)
        return { nombre: mover, de: b.inicio, a }
      })
      bloques = ordenar(
        bloques.map((b) => {
          const m = movidos.find((x) => x.nombre === b.nombre)
          return m ? { ...b, inicio: m.a } : b
        }),
      )
      try {
        huecos = huecosDe(spec.total, bloques)
      } catch {
        throw new Error(
          `memoria: mover ${movidos.map((m) => m.nombre).join(', ')} pisa otro segmento`,
        )
      }
      i = ubicar(huecos, op.tam, spec.algoritmo, ultima)
      if (i < 0) throw new Error(`memoria: ${op.carga} no entra ni después de compactar`)
    }
    const nuevo = {
      nombre: op.carga,
      proceso: op.proceso ?? procesoDe(op.carga),
      inicio: huecos[i].inicio,
      tam: op.tam,
    }
    bloques = ordenar([...bloques, nuevo])
    ultima = nuevo.inicio + nuevo.tam
    pasos.push({
      op,
      antes,
      despues: bloques,
      huecosAntes,
      candidatos: cands,
      movidos,
      nuevo,
      liberados: [],
    })
  }
  return pasos
}
