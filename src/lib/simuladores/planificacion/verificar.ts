import { simularPlanificacion } from './simular'
import { FILA_SO, type ConfigPlanificacion, type ResultadoPlanificacion } from './tipos'

/** Lo que el alumno marca en cada celda (proceso, t). 'cpu' = CPU 1 (o el único), 'cpu2' = CPU 2. */
export type Marca = 'cpu' | 'cpu2' | 'io' | null
/** marcas[proceso][t] */
export type GrillaGantt = Record<string, Marca[]>

export interface ErrorCelda {
  proceso: string
  t: number
  esperado: Marca
  marcado: Marca
}

export interface Veredicto {
  ok: boolean
  correctos: number
  total: number
  /** Primer error en orden temporal; null si no hay errores. */
  primerError: ErrorCelda | null
}

/** Solo cuenta como E/S el uso efectivo del dispositivo (no la espera en su cola). */
/** Con overhead de interrupciones suma la fila "SO" (una marca por instante: la de menor CPU). */
export function grillaEsperada(r: ResultadoPlanificacion, procesos: string[]): GrillaGantt {
  const filaSO = r.ticks.map((tick): Marca => {
    const k = tick.so?.indexOf(true) ?? -1
    return k < 0 ? null : k === 0 ? 'cpu' : 'cpu2'
  })
  return Object.fromEntries([
    ...procesos.map((id) => [
      id,
      r.ticks.map((tick): Marca => {
        const k = tick.cpus.indexOf(id)
        if (k >= 0) return k === 0 ? 'cpu' : 'cpu2'
        return tick.io.includes(id) ? 'io' : null
      }),
    ]),
    ...(r.so ? [[FILA_SO, filaSO]] : []),
  ])
}

/** Todos los Gantts válidos cuando hay 2+ CPUs libres a la vez (cuál toma primero es arbitrario). */
export function variantesPlanificacion(
  config: ConfigPlanificacion,
  max = 64,
): ResultadoPlanificacion[] {
  const vistas = new Set<string>()
  const variantes: ResultadoPlanificacion[] = []
  const pendientes: boolean[][] = [[]]
  for (let corridas = 0; pendientes.length && corridas < max; corridas++) {
    const prefijo = pendientes.shift()!
    const r = simularPlanificacion(config, { invertirCpus: (d) => prefijo[d] ?? false })
    const firma = JSON.stringify(grillaEsperada(r, r.hilos))
    if (!vistas.has(firma)) {
      vistas.add(firma)
      variantes.push(r)
    }
    for (let d = prefijo.length; d < (r.decisionesCpu ?? 0); d++) {
      pendientes.push([...prefijo, ...Array<boolean>(d - prefijo.length).fill(false), true])
    }
  }
  return variantes
}

/** Completa con celdas vacías hasta `total` instantes (las variantes pueden terminar en distinto t). */
export const extenderGrilla = (g: GrillaGantt, total: number): GrillaGantt =>
  Object.fromEntries(
    Object.entries(g).map(([p, m]) => [p, [...m, ...Array<Marca>(total - m.length).fill(null)]]),
  )

/** Columnas vacías de más en la grilla del desafío: que su largo no delate cuándo termina el Gantt. */
export const COLUMNAS_EXTRA = 5

/** Grillas válidas (la de la resolución primero) extendidas al ancho del desafío: la más larga + margen. */
export function grillasDesafio(
  resultados: ResultadoPlanificacion[],
  procesos: string[],
): { total: number; esperadas: GrillaGantt[] } {
  const total = Math.max(...resultados.map((r) => r.ticks.length)) + COLUMNAS_EXTRA
  const esperadas = resultados.map((r) => extenderGrilla(grillaEsperada(r, procesos), total))
  return { total, esperadas }
}

export function verificarGantt(esperada: GrillaGantt, respuesta: GrillaGantt): Veredicto {
  const procesos = Object.keys(esperada)
  const ticks = esperada[procesos[0]]?.length ?? 0
  let correctos = 0
  let primerError: ErrorCelda | null = null
  for (let t = 0; t < ticks; t++) {
    for (const proceso of procesos) {
      const esperado = esperada[proceso][t]
      const marcado = respuesta[proceso]?.[t] ?? null
      if (esperado === marcado) correctos++
      else primerError ??= { proceso, t, esperado, marcado }
    }
  }
  return { ok: primerError == null, correctos, total: ticks * procesos.length, primerError }
}
