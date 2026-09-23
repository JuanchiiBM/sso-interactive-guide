export type Algoritmo =
  'fifo' | 'sjf' | 'srt' | 'rr' | 'prioridades' | 'prioridades-desalojo' | 'hrrn'

/** Motivo por el que un proceso entra a la cola de listos en un instante. */
export type OrigenListo = 'nuevo' | 'io' | 'desalojo'

export interface ProcesoInput {
  id: string
  llegada: number
  /** CPU, E/S, CPU, E/S, ... */
  rafagas: number[]
  prioridad?: number
}

export interface ConfigPlanificacion {
  algoritmo: Algoritmo
  quantum?: number
  procesos: ProcesoInput[]
  /** Orden en que entran a listos los que llegan en el mismo instante. */
  desempate?: OrigenListo[]
  /** true (default): la E/S es un único dispositivo FIFO; false: E/S en paralelo. */
  ioUnica?: boolean
  /** true: número menor = mayor prioridad (convención por defecto). */
  prioridadMenorEsMejor?: boolean
}

export type EstadoProceso = 'nuevo' | 'listo' | 'ejecutando' | 'bloqueado' | 'espera-io' | 'fin'

/** Lo que pasó en un tick [t, t+1). */
export interface Tick {
  t: number
  cpu: string | null
  io: string[]
  /** Procesos en cola de E/S sin atender (solo con ioUnica). */
  colaIO: string[]
  /** Cola de listos al inicio del tick, en orden (sin contar el que ejecuta). */
  listos: string[]
  estados: Record<string, EstadoProceso>
  eventos: string[]
}

export interface MetricasProceso {
  id: string
  llegada: number
  finalizacion: number
  /** Tiempo de retorno (turnaround) = finalización − llegada. */
  retorno: number
  /** Tiempo total en cola de listos. */
  espera: number
  /** Primer instante en CPU − llegada. */
  respuesta: number
}

export interface ResultadoPlanificacion {
  ticks: Tick[]
  metricas: MetricasProceso[]
  promedioRetorno: number
  promedioEspera: number
  fin: number
}
