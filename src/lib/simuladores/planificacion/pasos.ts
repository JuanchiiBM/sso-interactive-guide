import type { Step } from '@lib/playback'
import { simularPlanificacion } from './simular'
import type { ConfigPlanificacion, ResultadoPlanificacion } from './tipos'

export interface EstadoGantt {
  resultado: ResultadoPlanificacion
  /** Filas del Gantt: hilos planificables (procesos, KLTs simples o ULTs). */
  procesos: string[]
  /** Último tick visible; `null` = paso final con métricas. */
  hasta: number | null
}

export function pasosPlanificacion(config: ConfigPlanificacion): Step<EstadoGantt>[] {
  const resultado = simularPlanificacion(config)
  const procesos = resultado.hilos

  const pasos: Step<EstadoGantt>[] = resultado.ticks.map((tick) => ({
    state: { resultado, procesos, hasta: tick.t },
    descripcion: `t=${tick.t}: ${tick.eventos.join(' ') || sigue(tick.cpus)}`,
  }))

  pasos.push({
    state: { resultado, procesos, hasta: null },
    descripcion: `Fin en t=${resultado.fin}. Retorno promedio ${fmt(resultado.promedioRetorno)} · Espera promedio ${fmt(resultado.promedioEspera)}.`,
  })
  return pasos
}

/** "KA · UA1" para un ULT; el id solo para procesos y KLTs simples. */
export const etiquetaHilo = (r: ResultadoPlanificacion, id: string): string =>
  r.kltDe?.[id] ? `${r.kltDe[id]} · ${id}` : id

/** Ancho de la columna de etiquetas del Gantt: más ancha si hay que prefijar el KLT. */
export const columnaEtiquetas = (r: ResultadoPlanificacion): string =>
  r.kltDe ? 'max-content' : '3rem'

function sigue(cpus: (string | null)[]): string {
  if (cpus.length === 1) return `${cpus[0] ?? 'Nadie'} sigue en CPU.`
  return cpus.map((id, k) => `CPU ${k + 1}: ${id ?? 'ociosa'}.`).join(' ')
}

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
