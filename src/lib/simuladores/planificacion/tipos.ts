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
  /** Proceso al que pertenece este KLT (grado de multiprogramación por proceso). Default: su id. */
  proceso?: string
}

/** Cómo pide E/S un ULT: syscall directa, wrapper de la biblioteca o wrapper con jacketing. */
export type ModoIO = 'directa' | 'wrapper' | 'jacketing'

export type AlgoritmoBiblioteca = Exclude<AlgoritmoBase, 'hrrn'>

/** Hilo de usuario: lo planifica la biblioteca de su KLT. */
export interface UltInput {
  id: string
  llegada: number
  rafagas: number[]
  prioridad?: number
  dispositivos?: string[]
}

/** KLT con ULTs: el SO lo planifica como un proceso; adentro, la biblioteca elige el ULT. */
export interface KltInput {
  id: string
  hilos: UltInput[]
  /** Algoritmo de la biblioteca (default fifo). */
  biblioteca?: AlgoritmoBiblioteca
  quantumBiblioteca?: number
  /** Default 'wrapper': la cátedra asume que no hay jacketing salvo que se diga. */
  modoIO?: ModoIO
  prioridad?: number
  cola?: number
  /** Proceso al que pertenece este KLT (grado de multiprogramación por proceso). Default: su id. */
  proceso?: string
}

/** Id de la fila del Gantt que muestra el uso de CPU del SO (overhead de interrupciones). */
export const FILA_SO = 'SO'

export const esKlt = (p: ProcesoInput | KltInput): p is KltInput => 'hilos' in p

export interface ColaConfig {
  algoritmo: AlgoritmoBase
  quantum?: number
}

export interface ConfigPlanificacion {
  algoritmo: Algoritmo
  quantum?: number
  /** Procesos o KLTs simples, y KLTs con ULTs (`hilos`). */
  procesos: (ProcesoInput | KltInput)[]
  /** Orden en que entran a listos los que llegan en el mismo instante. */
  desempate?: OrigenListo[]
  /** true (default): la E/S es un único dispositivo FIFO; false: E/S en paralelo. */
  ioUnica?: boolean
  /** true: número menor = mayor prioridad (convención por defecto). */
  prioridadMenorEsMejor?: boolean
  /** Máximo de procesos admitidos (listos + ejecutando + bloqueados). Sin valor = sin límite. */
  multiprogramacion?: number
  /** Con grado lleno, un proceso nuevo de mayor prioridad entra suspendiendo al peor en Ready. */
  suspensionPorPrioridad?: boolean
  /** u.t. de CPU que usa el SO para atender cada interrupción de fin de E/S (default 0). */
  overheadInterrupcion?: number
  /** SJF/SRT con estimación. Con `alfaSobre: 'estimacion'` (default): T_i = α·T_{i-1} + (1−α)·R_{i-1}. */
  alfa?: number
  /** Qué término pondera α; la cátedra usa las dos según el examen (con α = 0,5 dan igual). */
  alfaSobre?: 'estimacion' | 'real'
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
  | 'nuevo'
  | 'espera-admision'
  | 'listo'
  | 'ejecutando'
  | 'bloqueado'
  | 'espera-io'
  | 'fin'
  /** Fuera de memoria (planificador de mediano plazo). */
  | 'suspendido'
  /** Terminó su E/S y espera que el SO atienda la interrupción. */
  | 'espera-so'

export interface EstadoDispositivo {
  nombre: string
  usando: string | null
  cola: string[]
}

/** Lo que pasó en un tick [t, t+1). */
export interface Tick {
  t: number
  /** Hilo en el CPU 1 (o el único): proceso, KLT simple o ULT. */
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
  /** Solo con suspensión por prioridad: procesos suspendidos (fuera de memoria). */
  suspendidos?: string[]
  /** Solo con overhead de interrupciones: el SO usa cada CPU en este tick. */
  so?: boolean[]
  /** Solo con ULTs: ULT elegido y cola de cada biblioteca. */
  bibliotecas?: { klt: string; elegido: string | null; listos: string[] }[]
  /** Solo con ULTs: quantum que le queda al KLT de cada CPU (null = sin quantum u ociosa). */
  quantum?: (number | null)[]
  /** Por hilo planificable (ULT o KLT simple). */
  estados: Record<string, EstadoProceso>
  eventos: string[]
  /** Solo Gantt de código: sentencia que ejecuta cada uno en este tick. */
  sentencias?: Record<string, string>
  /** Solo Gantt de código: semáforos y recursos al inicio del tick. */
  sincro?: { nombre: string; valor: number; cola: string[]; duenos?: string[] }[]
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
  /** Hilos planificables en orden (ULTs y KLTs simples): las filas del Gantt. */
  hilos: string[]
  /** Solo con ULTs: KLT de cada ULT. */
  kltDe?: Record<string, string>
  /** Con overhead de interrupciones: el Gantt agrega la fila "SO". */
  so?: boolean
  /** Solo Gantt de código: `tick.io` son los bloqueados (semáforo, recurso o sleep), no la E/S. */
  bloqueoSincro?: boolean
}
