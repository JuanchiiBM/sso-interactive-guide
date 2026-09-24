/** Algoritmos de una sola cola; también sirven como algoritmo de cada cola en multinivel. */
export type AlgoritmoBase =
  'fifo' | 'sjf' | 'srt' | 'rr' | 'prioridades' | 'prioridades-desalojo' | 'hrrn'

export type Algoritmo = AlgoritmoBase | 'vrr' | 'multinivel' | 'feedback'

/** Motivo por el que un proceso entra a la cola de listos en un instante. */
export type OrigenListo = 'nuevo' | 'io' | 'desalojo'

export interface ProcesoInput {
  id: string
  llegada: number
  /** CPU, E/S, CPU, E/S, ... */
  rafagas: number[]
  prioridad?: number
  /** Dispositivo de cada ráfaga de E/S, en orden (ej. [red, pantalla]). Cada uno es FIFO propio. */
  dispositivos?: string[]
  /** Multinivel: cola fija del proceso, 1 = la de mayor prioridad. */
  cola?: number
  /** Estimación de la primera ráfaga (SJF/SRT con `alfa`). */
  estimacionInicial?: number
  /** Alternativa a `estimacionInicial`: última ráfaga previa (estimada y real). */
  estimacionAnterior?: number
  rafagaAnterior?: number
}

export interface ColaConfig {
  algoritmo: AlgoritmoBase
  quantum?: number
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
  /** Máximo de procesos admitidos (listos + ejecutando + bloqueados). Sin valor = sin límite. */
  multiprogramacion?: number
  /** SJF/SRT con estimación: T_i = α·T_{i-1} + (1−α)·R_{i-1}. */
  alfa?: number
  /** Multinivel / feedback: colas de mayor a menor prioridad. */
  colas?: ColaConfig[]
  /** Multinivel / feedback: la llegada a una cola superior desaloja (default true). */
  desalojoEntreColas?: boolean
  /** Feedback: al volver de E/S, a la primera cola o a la misma (default 'misma'). */
  trasIO?: 'primera' | 'misma'
  /** Cantidad de CPUs (default 1). */
  procesadores?: number
  /** Con varios CPUs: el proceso vuelve siempre al CPU donde ejecutó primero. */
  afinidad?: boolean
}

export type EstadoProceso =
  'nuevo' | 'espera-admision' | 'listo' | 'ejecutando' | 'bloqueado' | 'espera-io' | 'fin'

export interface EstadoDispositivo {
  nombre: string
  usando: string | null
  cola: string[]
}

/** Lo que pasó en un tick [t, t+1). */
export interface Tick {
  t: number
  /** Quién ocupa el CPU 1 (o el único). */
  cpu: string | null
  /** Ocupación de cada CPU. */
  cpus: (string | null)[]
  /** Procesos usando un dispositivo de E/S (cualquiera). */
  io: string[]
  /** Procesos esperando un dispositivo ocupado. */
  colaIO: string[]
  /** Cola de listos al inicio del tick, en orden (sin contar el que ejecuta). */
  listos: string[]
  /** Solo con varias colas (VRR, multinivel, feedback). */
  colas?: { nombre: string; procesos: string[] }[]
  /** Solo con dispositivos nombrados. */
  dispositivos?: EstadoDispositivo[]
  /** Solo con grado de multiprogramación: esperan admisión en New. */
  nuevos?: string[]
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
  procesadores: number
}
