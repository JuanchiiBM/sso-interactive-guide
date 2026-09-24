/** "Gantt de código": procesos como sentencias con duración. Semántica: docs/brain/simuladores/Simulador de Gantt de Código.md */

export interface ProcesoCodigo {
  id: string
  llegada: number
  /** Solo con prioridades: menor número = más prioridad. */
  prioridad?: number
  /** Una sentencia por línea; `// 3` al final fija su duración. Admite un `while(true){ … }`. */
  codigo: string
}

export interface ConfigCodigo {
  algoritmo: 'fifo' | 'rr' | 'prioridades' | 'prioridades-desalojo'
  quantum?: number
  /** Duración por defecto de cada sentencia (sleep dura 0 de CPU salvo que se indique). */
  duracion?: number
  /** wait/signal/get/release no se interrumpen: el desalojo se posterga hasta que terminan. */
  atomicas?: boolean
  semaforos?: Record<string, number>
  /** Recursos con dueño para get/release: nombre → instancias. */
  recursos?: Record<string, number>
  /** Sentencia que corre la detección de deadlock y mata al de mayor tiempo restante. */
  detector?: { sentencia: string }
  /** Cortar la traza en este instante. */
  hasta?: number
  /** Cortar cuando terminen todos estos procesos. */
  hastaQueTerminen?: string[]
  procesos: ProcesoCodigo[]
}

export type Sentencia =
  | { tipo: 'wait' | 'signal'; sem: string; texto: string; duracion: number }
  | { tipo: 'get' | 'release'; recurso: string; texto: string; duracion: number }
  | { tipo: 'sleep'; bloqueo: number; texto: string; duracion: number }
  | { tipo: 'detectar'; texto: string; duracion: number }
  | { tipo: 'accion'; texto: string; duracion: number }

export interface ProgramaCodigo {
  sentencias: Sentencia[]
  /** Índice donde vuelve el while (null = sin ciclo: termina al final). */
  inicioCiclo: number | null
}

/** Estado de un semáforo o recurso al inicio de un tick (panel del paso a paso). */
export interface EstadoSincro {
  nombre: string
  valor: number
  cola: string[]
  duenos?: string[]
}
