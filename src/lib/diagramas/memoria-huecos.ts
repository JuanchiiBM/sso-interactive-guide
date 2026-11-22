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
  | {
      /** Proceso que carga varios segmentos pegados, en el orden dado. */
      carga: string
      segmentos: { nombre: string; tam: number }[]
      compactar?: { mover: string; a: number }[]
      texto?: string
    }
  | { libera: string; texto?: string }
  | {
      /** Paso sin cambios: marca la DF de una DL del bloque (línea arriba, regla de DL abajo). */
      marca: string
      dl: number
      titulo: string
      texto: string
      df?: string
      dlRotulo?: string
      /** Se agrega al título de la regla ("Direcciones lógicas de P0 …"). */
      regla?: string
      rotulo?: string
      chips?: Partial<Record<'ok' | 'mal' | 'aviso' | 'neutro', string>>[]
      /** Filas [campo, valor, 'ok'?] de "Lo que había que completar" (en vez de la tabla). */
      completar?: string[][]
    }
  | {
      /** El bloque crece al final; si atrás no alcanza, compacta (como `carga`). */
      agranda: string
      tam: number
      /** Rótulo de la parte nueva en la barra (por defecto, su base). */
      etiqueta?: string
      titulo?: string
      compactar?: { mover: string; a: number }[]
      texto?: string
    }

export interface SpecMemoria {
  total: number
  algoritmo: AlgoritmoUbicacion
  inicial: (Omit<BloqueMem, 'proceso'> & { proceso?: string })[]
  operaciones: OpMem[]
}

export type EstadoCandidato =
  'elegido' | 'empate' | 'no-elegido' | 'no-entra' | 'no-al-lado' | 'entra-uno'

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
  /** Parte nueva de un bloque que crece. */
  crece?: { nombre: string; inicio: number; tam: number }
  /** Segmentos cargados juntos (en vez de `nuevo`). */
  juntos?: BloqueMem[]
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

function compactar(bloques: BloqueMem[], movs: { mover: string; a: number }[], total: number) {
  const movidos = movs.map(({ mover, a }) => {
    const b = bloques.find((x) => x.nombre === mover)
    if (!b) throw new Error(`memoria: no existe ${mover} para mover`)
    return { nombre: mover, de: b.inicio, a }
  })
  const nuevos = ordenar(
    bloques.map((b) => {
      const m = movidos.find((x) => x.nombre === b.nombre)
      return m ? { ...b, inicio: m.a } : b
    }),
  )
  try {
    return { movidos, bloques: nuevos, huecos: huecosDe(total, nuevos) }
  } catch {
    throw new Error(`memoria: mover ${movidos.map((m) => m.nombre).join(', ')} pisa otro segmento`)
  }
}

const atras = (huecos: Hueco[], b: BloqueMem) => huecos.find((h) => h.inicio === b.inicio + b.tam)

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
    if ('marca' in op) {
      const b = antes.find((x) => x.nombre === op.marca)
      if (!b) throw new Error(`memoria: no existe ${op.marca} para marcar`)
      if (op.dl < 0 || op.dl > b.tam)
        throw new Error(`memoria: la DL ${op.dl} está fuera de ${op.marca}`)
      pasos.push({ op, antes, despues: antes, huecosAntes, ...vacio })
      continue
    }
    if ('agranda' in op) {
      const b = antes.find((x) => x.nombre === op.agranda)
      if (!b) throw new Error(`memoria: no existe ${op.agranda} para agrandar`)
      const lugar = atras(huecosAntes, b)
      const alcanza = (lugar?.tam ?? 0) >= op.tam
      const cands = huecosAntes.map((hueco) => ({
        hueco,
        estado: (hueco !== lugar
          ? 'no-al-lado'
          : alcanza
            ? 'elegido'
            : 'no-entra') as EstadoCandidato,
      }))
      let movidos: PasoMem['movidos'] = []
      let actual = b
      if (!alcanza) {
        if (!op.compactar) throw new Error(`memoria: ${op.agranda} no crece y no hay compactación`)
        const c = compactar(antes, op.compactar, spec.total)
        movidos = c.movidos
        actual = c.bloques.find((x) => x.nombre === b.nombre)!
        if ((atras(c.huecos, actual)?.tam ?? 0) < op.tam)
          throw new Error(`memoria: ${op.agranda} no crece ni después de compactar`)
        bloques = c.bloques
      }
      const crece = { nombre: b.nombre, inicio: actual.inicio + actual.tam, tam: op.tam }
      bloques = bloques.map((x) => (x === actual ? { ...x, tam: x.tam + op.tam } : x))
      pasos.push({
        op,
        antes,
        despues: bloques,
        huecosAntes,
        ...vacio,
        candidatos: cands,
        movidos,
        crece,
      })
      continue
    }
    if ('segmentos' in op) {
      const total = op.segmentos.reduce((s, x) => s + x.tam, 0)
      const menor = Math.min(...op.segmentos.map((x) => x.tam))
      let i = ubicar(huecosAntes, total, spec.algoritmo, ultima)
      const cands = candidatos(huecosAntes, total, i, spec.algoritmo).map((c) =>
        c.estado === 'no-entra' && c.hueco.tam >= menor
          ? { ...c, estado: 'entra-uno' as const }
          : c,
      )
      let movidos: PasoMem['movidos'] = []
      let huecos = huecosAntes
      if (i < 0) {
        if (!op.compactar) throw new Error(`memoria: ${op.carga} no entra y no hay compactación`)
        ;({ movidos, bloques, huecos } = compactar(bloques, op.compactar, spec.total))
        i = ubicar(huecos, total, spec.algoritmo, ultima)
        if (i < 0) throw new Error(`memoria: ${op.carga} no entra ni después de compactar`)
      }
      let dir = huecos[i].inicio
      const juntos = op.segmentos.map((x) => {
        const b = { nombre: x.nombre, proceso: op.carga, inicio: dir, tam: x.tam }
        dir += x.tam
        return b
      })
      bloques = ordenar([...bloques, ...juntos])
      ultima = dir
      pasos.push({
        op,
        antes,
        despues: bloques,
        huecosAntes,
        ...vacio,
        candidatos: cands,
        movidos,
        juntos,
      })
      continue
    }
    let i = ubicar(huecosAntes, op.tam, spec.algoritmo, ultima)
    const cands = candidatos(huecosAntes, op.tam, i, spec.algoritmo)
    let movidos: PasoMem['movidos'] = []
    let huecos = huecosAntes
    if (i < 0) {
      if (!op.compactar) throw new Error(`memoria: ${op.carga} no entra y no hay compactación`)
      ;({ movidos, bloques, huecos } = compactar(bloques, op.compactar, spec.total))
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
