/** Algoritmos de memoria, puros: arman los números de los recorridos de Memoria real y virtual. */

// ── Reemplazo de páginas (convenciones de la cátedra: ver brain, Algoritmos de Memoria) ──

export type AlgoritmoReemplazo = 'optimo' | 'fifo' | 'lru' | 'clock'

export interface Instante {
  ref: number
  /** Página en cada marco después de la referencia (null = vacío). */
  marcos: (number | null)[]
  /** Bit de uso de cada marco (solo clock). */
  uso: boolean[]
  /** Marco al que apunta el puntero después de la referencia (FIFO y clock). */
  puntero: number | null
  fallo: boolean
  /** Marco donde entró la página (null si fue acierto). */
  marco: number | null
  /** Página que salió (null si había marco libre o fue acierto). */
  victima: number | null
}

export function reemplazo(refs: number[], n: number, alg: AlgoritmoReemplazo): Instante[] {
  const marcos: (number | null)[] = Array(n).fill(null)
  const uso: boolean[] = Array(n).fill(false)
  const ultimoUso: number[] = Array(n).fill(-1)
  let puntero = 0

  return refs.map((ref, t) => {
    const ya = marcos.indexOf(ref)
    if (ya >= 0) {
      uso[ya] = true
      ultimoUso[ya] = t
      return foto(ref, false, null, null)
    }
    let marco = marcos.indexOf(null)
    let victima: number | null = null
    if (marco < 0) {
      marco = elegirVictima(t)
      victima = marcos[marco]
    }
    marcos[marco] = ref
    uso[marco] = true
    ultimoUso[marco] = t
    if (alg === 'fifo' || alg === 'clock') puntero = (marco + 1) % n
    return foto(ref, true, marco, victima)
  })

  function elegirVictima(t: number): number {
    if (alg === 'fifo') return puntero
    if (alg === 'lru') return ultimoUso.indexOf(Math.min(...ultimoUso))
    if (alg === 'optimo') {
      // la que se usa más lejos (o nunca); ante empate, el primer marco
      const proximo = marcos.map((p) => {
        const i = refs.indexOf(p!, t + 1)
        return i < 0 ? Infinity : i
      })
      return proximo.indexOf(Math.max(...proximo))
    }
    while (uso[puntero]) {
      uso[puntero] = false
      puntero = (puntero + 1) % n
    }
    return puntero
  }

  function foto(ref: number, fallo: boolean, marco: number | null, victima: number | null) {
    const conPuntero = alg === 'fifo' || alg === 'clock'
    return {
      ref,
      marcos: [...marcos],
      uso: alg === 'clock' ? [...uso] : uso.map(() => false),
      puntero: conPuntero ? puntero : null,
      fallo,
      marco,
      victima,
    }
  }
}

export const fallos = (inst: Instante[]) => inst.filter((i) => i.fallo).length

// ── Clock mejorado (U, M) sobre un estado dado ──

export interface MarcoUM {
  pagina: number
  u: boolean
  m: boolean
}

export interface VisitaClock {
  /** 1 = busca (0,0) sin tocar bits; 2 = busca (0,1) y baja U a su paso. */
  pasada: 1 | 2
  marco: number
  elegido: boolean
  /** En la pasada 2, si le bajó el bit de uso. */
  bajaU: boolean
}

/** Recorre como la cátedra: pasada 1, pasada 2, y si hace falta otra vez 1 y 2. */
export function clockMejorado(estado: MarcoUM[], puntero: number) {
  const marcos = estado.map((m) => ({ ...m }))
  const visitas: VisitaClock[] = []
  for (let vuelta = 0; vuelta < 2; vuelta++) {
    for (const pasada of [1, 2] as const) {
      for (let k = 0; k < marcos.length; k++) {
        const i = (puntero + k) % marcos.length
        const { u, m } = marcos[i]
        const elegido = !u && m === (pasada === 2)
        const bajaU = pasada === 2 && !elegido && u
        if (bajaU) marcos[i].u = false
        visitas.push({ pasada, marco: i, elegido, bajaU })
        if (elegido) return { victima: i, visitas, marcos }
      }
    }
  }
  throw new Error('clock mejorado: no encontró víctima')
}

// ── Buddy system ──

export interface Bloque {
  inicio: number
  tam: number
  proceso: string | null
  /** Tamaño pedido (para ver la fragmentación interna). */
  pedido?: number
}

export type OpBuddy = { carga: string; tam: number } | { descarga: string }

const potencia = (x: number) => 2 ** Math.ceil(Math.log2(x))

/** Estado de los bloques (ordenados por dirección) después de cada operación. */
export function buddy(total: number, ops: OpBuddy[]): Bloque[][] {
  let bloques: Bloque[] = [{ inicio: 0, tam: total, proceso: null }]
  return ops.map((op) => {
    if ('carga' in op) {
      const tam = potencia(op.tam)
      const libres = bloques.filter((b) => !b.proceso && b.tam >= tam)
      if (!libres.length) throw new Error(`buddy: ${op.carga} no entra`)
      const b = libres.reduce((a, c) => (c.tam < a.tam ? c : a))
      while (b.tam > tam) {
        b.tam /= 2
        bloques.push({ inicio: b.inicio + b.tam, tam: b.tam, proceso: null })
      }
      b.proceso = op.carga
      b.pedido = op.tam
    } else {
      const b = bloques.find((x) => x.proceso === op.descarga)!
      b.proceso = null
      delete b.pedido
      let actual = b
      for (;;) {
        const inicioCompa = actual.inicio ^ actual.tam
        const compa = bloques.find(
          (x) => x.inicio === inicioCompa && x.tam === actual.tam && !x.proceso,
        )
        if (!compa) break
        bloques = bloques.filter((x) => x !== compa && x !== actual)
        actual = {
          inicio: Math.min(actual.inicio, compa.inicio),
          tam: actual.tam * 2,
          proceso: null,
        }
        bloques.push(actual)
      }
    }
    bloques.sort((a, c) => a.inicio - c.inicio)
    return bloques.map((x) => ({ ...x }))
  })
}

// ── Particionamiento dinámico: algoritmos de ubicación ──

export type AlgoritmoUbicacion = 'primer' | 'siguiente' | 'mejor' | 'peor'

export interface Hueco {
  inicio: number
  tam: number
}

/** Índice del hueco elegido (o -1). `desde` es la dirección de la última asignación (siguiente ajuste). */
export function ubicar(huecos: Hueco[], tam: number, alg: AlgoritmoUbicacion, desde = 0): number {
  const sirven = huecos.map((h, i) => ({ h, i })).filter(({ h }) => h.tam >= tam)
  if (!sirven.length) return -1
  if (alg === 'primer') return sirven[0].i
  if (alg === 'siguiente') return (sirven.find(({ h }) => h.inicio >= desde) ?? sirven[0]).i
  const cmp = alg === 'mejor' ? (a: number, b: number) => a < b : (a: number, b: number) => a > b
  return sirven.reduce((a, c) => (cmp(c.h.tam, a.h.tam) ? c : a)).i
}

export interface Particion {
  inicio: number
  tam: number
  /** null = hueco. */
  proceso: string | null
}

export type OpDinamica = { carga: string; tam: number } | { descarga: string } | { compactar: true }

/** Particionamiento dinámico: el estado después de cada operación (una carga que no entra lanza error). */
export function particionamientoDinamico(
  total: number,
  ops: OpDinamica[],
  alg: AlgoritmoUbicacion = 'primer',
): Particion[][] {
  let parts: Particion[] = [{ inicio: 0, tam: total, proceso: null }]
  let ultima = 0
  const huecos = () => parts.filter((p) => !p.proceso)
  return ops.map((op) => {
    if ('carga' in op) {
      const hs = huecos()
      const i = ubicar(hs, op.tam, alg, ultima)
      if (i < 0) throw new Error(`dinámico: ${op.carga} no entra`)
      const h = hs[i]
      const nuevo = { inicio: h.inicio, tam: op.tam, proceso: op.carga }
      const resto = h.tam - op.tam
      parts.splice(
        parts.indexOf(h),
        1,
        nuevo,
        ...(resto ? [{ inicio: h.inicio + op.tam, tam: resto, proceso: null }] : []),
      )
      ultima = nuevo.inicio + nuevo.tam
    } else if ('descarga' in op) {
      parts.find((p) => p.proceso === op.descarga)!.proceso = null
    } else {
      let dir = 0
      const procesos = parts
        .filter((p) => p.proceso)
        .map((p) => ({ ...p, inicio: (dir += p.tam) - p.tam }))
      parts = [...procesos, { inicio: dir, tam: total - dir, proceso: null }]
    }
    // huecos contiguos se juntan en uno
    parts = parts.reduce<Particion[]>((acc, p) => {
      const prev = acc[acc.length - 1]
      if (prev && !prev.proceso && !p.proceso) prev.tam += p.tam
      else acc.push({ ...p })
      return acc
    }, [])
    return parts.filter((p) => p.tam > 0).map((p) => ({ ...p }))
  })
}

/** Hay fragmentación externa si la suma de los huecos alcanza pero ninguno solo. */
export function fragmentacionExterna(parts: Particion[], tam: number) {
  const hs = parts.filter((p) => !p.proceso)
  return hs.reduce((s, h) => s + h.tam, 0) >= tam && hs.every((h) => h.tam < tam)
}

// ── Traducción y working set ──

/** Paginación: DL → (página, offset) → DF, con páginas de `2^bitsOffset` bytes. */
export function traducirPaginacion(dl: number, bitsOffset: number, tabla: number[]) {
  const tam = 2 ** bitsOffset
  const pagina = Math.floor(dl / tam)
  const offset = dl % tam
  const marco = tabla[pagina]
  return { pagina, offset, marco, df: marco * tam + offset }
}

/** Conjunto de trabajo W(t, Δ): las páginas distintas de las últimas Δ referencias hasta t (inclusive). */
export const conjuntoTrabajo = (refs: number[], t: number, delta: number) =>
  [...new Set(refs.slice(Math.max(0, t - delta + 1), t + 1))].sort((a, b) => a - b)
