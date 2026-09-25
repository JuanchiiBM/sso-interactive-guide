/** Tamaño de las secciones críticas: acciones que no tocan nada compartido pero quedan dentro de un mutex. */
import type { AccionSpec, EjercicioSemaforos, Instruccion, Programa } from './tipos'

/** Toca algo compartido: usa un recurso, cambia una variable global o toma/devuelve un recurso implícito. */
const tocaCompartido = (a: AccionSpec | undefined) =>
  !!a &&
  ((a.recursos?.length ?? 0) > 0 ||
    Object.keys(a.efecto ?? {}).length > 0 ||
    (a.adquiere?.length ?? 0) > 0 ||
    (a.libera?.length ?? 0) > 0)

const clave = (ins: Extract<Instruccion, { tipo: 'wait' | 'signal' }>) =>
  `${ins.sem.nombre}[${ins.sem.indice ?? ''}]`

/**
 * Cuenta, en cada proceso, las acciones que no tocan nada compartido y quedan entre un `wait(s)` y el
 * `signal(s)` siguiente **del mismo semáforo** (inicializado en 1). Un semáforo que el proceso espera
 * pero no libera (los de orden, como en CASA) no forma sección crítica.
 */
export function accionesDeMas(programa: Programa, ej: EjercicioSemaforos): number {
  const esMutex = (nombre: string) => {
    const decl = programa.semaforos[nombre]
    return !!decl && decl.valores.length > 0 && decl.valores.every((v) => v === 1)
  }
  let total = 0
  for (const proceso of programa.procesos) {
    const ins = proceso.instrucciones
    const dentro = new Set<number>()
    ins.forEach((w, i) => {
      if (w.tipo !== 'wait' || !esMutex(w.sem.nombre)) return
      const j = ins.findIndex((s, k) => k > i && s.tipo === 'signal' && clave(s) === clave(w))
      if (j < 0) return
      for (let k = i + 1; k < j; k++) if (ins[k].tipo === 'accion') dentro.add(k)
    })
    for (const k of dentro) {
      const a = ins[k] as Extract<Instruccion, { tipo: 'accion' }>
      const spec = ej.acciones[`${proceso.nombre}::${a.accion}`] ?? ej.acciones[a.accion]
      if (!tocaCompartido(spec)) total++
    }
  }
  return total
}
