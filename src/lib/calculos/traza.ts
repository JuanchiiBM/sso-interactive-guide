/** Traza de reemplazo a completar: la grilla de la cátedra (frames × referencias) con U, M, PF y disco. */
import {
  reemplazo,
  reemplazoConEstado,
  type AlgoritmoReemplazo,
  type MarcoEstado,
} from '@lib/diagramas/memoria'

export type AlgoritmoTraza = AlgoritmoReemplazo | 'clock-mejorado'

export type Resultado = 'acierto' | 'pf' | 'invalida'

/** Página: un número, o un rótulo con el proceso (`A3`) en el reemplazo global. */
export type Pagina = number | string

export interface ReferenciaTraza {
  etiqueta: string
  /** null = dirección fuera del proceso (inválida). */
  pagina: Pagina | null
  acceso: 'L' | 'E'
}

export interface MarcoTraza extends Omit<MarcoEstado, 'pagina'> {
  pagina: Pagina | null
}

export interface TrazaSpec {
  marcos: MarcoTraza[]
  /** Posición (no número de frame) del puntero inicial. */
  puntero: number
  referencias: ReferenciaTraza[]
  algoritmos: AlgoritmoTraza[]
  /** Muestra "Inválida" en todas las columnas (si solo estuviera donde va, la regalaría). */
  invalida: boolean
}

/** Qué marca el alumno en cada algoritmo: LRU no usa U ni puntero. */
export interface Marcar {
  /** H: el frame donde la referencia fue un acierto. */
  h: boolean
  u: boolean
  m: boolean
  puntero: boolean
  disco: boolean
}

export interface ColumnaTraza {
  /** Rótulo tal como se muestra (se compara con `normalizarPagina`); null = frame libre. */
  paginas: (string | null)[]
  h: boolean[]
  u: boolean[]
  m: boolean[]
  puntero: number | null
  resultado: Resultado | null
  disco: boolean
}

export const NOMBRE_ALGORITMO: Record<AlgoritmoTraza, string> = {
  optimo: 'Óptimo',
  fifo: 'FIFO',
  lru: 'LRU',
  clock: 'Clock',
  'clock-mejorado': 'Clock mejorado',
}

/** Frontmatter crudo → spec, con los mismos atajos que el schema (para tests que leen el YAML). */
export function trazaDesdeYaml(t: Record<string, unknown>): TrazaSpec {
  const marcos =
    typeof t.marcos === 'number'
      ? Array.from({ length: t.marcos }, (_, i) => ({ marco: i }))
      : (t.marcos as object[])
  return {
    marcos: marcos.map((m) => ({ pagina: null, u: false, m: false, ultimoUso: -1, ...m })),
    puntero: (t.puntero as number) ?? 0,
    referencias: (t.referencias as unknown[]).map((r) =>
      typeof r === 'number'
        ? { etiqueta: String(r), pagina: r, acceso: 'L' }
        : { acceso: 'L', ...(r as object) },
    ),
    algoritmos: t.algoritmos,
    invalida: !!t.invalida,
  } as TrazaSpec
}

/** `a 3`, `A3` y `a3` son la misma página. */
export const normalizarPagina = (p: Pagina | null | undefined) =>
  p == null || String(p).trim() === '' ? null : String(p).replace(/\s+/g, '').toUpperCase()

export const paginasConTexto = (spec: TrazaSpec) =>
  [...spec.marcos.map((x) => x.pagina), ...spec.referencias.map((r) => r.pagina)].some(
    (p) => typeof p === 'string',
  )

export function marcarDe(alg: AlgoritmoTraza, spec: TrazaSpec): Marcar {
  const m = spec.referencias.some((r) => r.acceso === 'E') || spec.marcos.some((x) => x.m)
  const clock = alg === 'clock' || alg === 'clock-mejorado'
  return { h: true, u: clock, m, puntero: clock, disco: m }
}

export function columnaInicial(spec: TrazaSpec): ColumnaTraza {
  return {
    paginas: spec.marcos.map((x) => (x.pagina == null ? null : String(x.pagina))),
    h: spec.marcos.map(() => false),
    u: spec.marcos.map((x) => x.u),
    m: spec.marcos.map((x) => x.m),
    puntero: spec.puntero,
    resultado: null,
    disco: false,
  }
}

/** La traza correcta de un algoritmo, una columna por referencia. */
export function trazaEsperada(spec: TrazaSpec, alg: AlgoritmoTraza): ColumnaTraza[] {
  // los algoritmos trabajan con números: cada rótulo pasa a un índice y vuelve al final
  const claves: string[] = []
  const rotulos: string[] = []
  const id = (p: Pagina | null) => {
    const clave = normalizarPagina(p)
    if (clave == null) return null
    if (!claves.includes(clave)) {
      claves.push(clave)
      rotulos.push(String(p))
    }
    return claves.indexOf(clave)
  }
  const marcos = spec.marcos.map((x) => ({ ...x, pagina: id(x.pagina) }))
  const refs = spec.referencias.map((r) => ({ pagina: id(r.pagina), escritura: r.acceso === 'E' }))
  const rotulo = (p: number | null) => (p == null ? null : rotulos[p])
  if (alg === 'optimo') return optimo(marcos, refs, rotulo)

  return reemplazoConEstado(marcos, spec.puntero, refs, alg).map((i) => ({
    paginas: i.paginas.map(rotulo),
    h: i.paginas.map((p) => !i.fallo && !i.invalida && p === i.ref.pagina),
    u: i.u,
    m: i.m,
    puntero: alg === 'lru' ? null : i.puntero,
    resultado: i.invalida ? 'invalida' : i.fallo ? 'pf' : 'acierto',
    disco: i.escrita,
  }))
}

/** Óptimo mira el futuro: solo desde frames vacíos y sin direcciones inválidas. */
function optimo(
  marcos: MarcoEstado[],
  refs: { pagina: number | null }[],
  rotulo: (p: number | null) => string | null,
): ColumnaTraza[] {
  if (marcos.some((x) => x.pagina != null) || refs.some((r) => r.pagina == null))
    throw new Error('Traza Óptimo: necesita frames vacíos y referencias válidas')
  return reemplazo(
    refs.map((r) => r.pagina!),
    marcos.length,
    'optimo',
  ).map((i) => ({
    paginas: i.marcos.map(rotulo),
    h: i.marcos.map((p) => !i.fallo && p === i.ref),
    u: i.uso,
    m: i.marcos.map(() => false),
    puntero: null,
    resultado: i.fallo ? 'pf' : 'acierto',
    disco: false,
  }))
}

/** Compara solo lo que el algoritmo pide marcar; los bits de un frame vacío no cuentan. */
export function columnaCorrecta(e: ColumnaTraza, r: ColumnaTraza, marcar: Marcar): boolean {
  return (
    (e.resultado ?? 'acierto') === (r.resultado ?? 'acierto') &&
    e.paginas.every((p, i) => normalizarPagina(p) === normalizarPagina(r.paginas[i])) &&
    e.paginas.every(
      (p, i) =>
        p == null ||
        ((!marcar.h || e.h[i] === r.h[i]) &&
          (!marcar.u || e.u[i] === r.u[i]) &&
          (!marcar.m || e.m[i] === r.m[i])),
    ) &&
    (!marcar.puntero || e.puntero === r.puntero) &&
    (!marcar.disco || e.disco === r.disco)
  )
}

/** Correcta solo si todas las columnas de todos los algoritmos coinciden; `correctas` queda para el puntaje. */
export function verificarTraza(
  esperadas: ColumnaTraza[][],
  respuestas: ColumnaTraza[][],
  marcar: Marcar[],
) {
  const total = esperadas.reduce((s, cols) => s + cols.length, 0)
  const correctas = esperadas.reduce(
    (s, cols, a) =>
      s +
      cols.filter((e, k) => respuestas[a]?.[k] && columnaCorrecta(e, respuestas[a][k], marcar[a]))
        .length,
    0,
  )
  return { ok: correctas === total, correctas, total }
}
