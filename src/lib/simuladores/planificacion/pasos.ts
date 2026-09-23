import type { Step } from '@lib/playback'
import { simularPlanificacion } from './simular'
import type { ConfigPlanificacion, ResultadoPlanificacion } from './tipos'

export interface EstadoGantt {
  resultado: ResultadoPlanificacion
  procesos: string[]
  /** Último tick visible; `null` = paso final con métricas. */
  hasta: number | null
}

export function pasosPlanificacion(config: ConfigPlanificacion): Step<EstadoGantt>[] {
  const resultado = simularPlanificacion(config)
  const procesos = config.procesos.map((p) => p.id)

  const pasos: Step<EstadoGantt>[] = resultado.ticks.map((tick) => ({
    state: { resultado, procesos, hasta: tick.t },
    descripcion: `t=${tick.t}: ${tick.eventos.join(' ') || `${tick.cpu ?? 'Nadie'} sigue en CPU.`}`,
  }))

  pasos.push({
    state: { resultado, procesos, hasta: null },
    descripcion: `Fin en t=${resultado.fin}. Retorno promedio ${fmt(resultado.promedioRetorno)} · Espera promedio ${fmt(resultado.promedioEspera)}.`,
  })
  return pasos
}

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
