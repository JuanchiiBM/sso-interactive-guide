import type { Step } from '@lib/playback'
import { pasosDeResultado, type EstadoGantt } from '../planificacion/pasos'
import { simularCodigo } from './simular'
import type { ConfigCodigo } from './tipos'

export const pasosCodigo = (config: ConfigCodigo): Step<EstadoGantt>[] =>
  pasosDeResultado(simularCodigo(config))
