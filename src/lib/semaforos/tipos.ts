/** Modelo del intérprete de semáforos. Semántica y límites: docs/brain/simuladores/Verificador de Semáforos.md */

export type Instruccion =
  | { tipo: 'wait'; sem: string; linea: number }
  | { tipo: 'signal'; sem: string; linea: number }
  | { tipo: 'accion'; accion: string; linea: number }

export interface ProcesoParseado {
  nombre: string
  /** Prólogo (antes del while, corre una vez) seguido del cuerpo del ciclo. */
  instrucciones: Instruccion[]
  /** Índice donde empieza el cuerpo del while(TRUE). */
  inicioCiclo: number
  /** false: la función no tiene while(TRUE) y el proceso termina al final del prólogo. */
  tieneCiclo: boolean
}

export interface Programa {
  semaforos: Record<string, number>
  procesos: ProcesoParseado[]
}

export interface ErrorParseo {
  linea: number
  mensaje: string
}

/** Definición del ejercicio (frontmatter `semaforos:`). */
export interface EjercicioSemaforos {
  procesos: { nombre: string; instancias: number; codigo: string }[]
  /** Efectos y recursos por acción, con la acción escrita como en el código (sin `;`). */
  acciones: Record<string, { recursos?: string[]; efecto?: Record<string, number> }>
  /** Valores iniciales de variables contadoras (ej. elementos en una lista). */
  variables?: Record<string, number>
  /** Declaraciones que trae la plantilla (ejercicios donde hay que corregir semáforos dados). */
  inicial?: string
  /** Constantes que el alumno puede usar al inicializar (ej. M = 3). */
  constantes?: Record<string, number>
  tests: TestSemaforos[]
}

export type TestSemaforos =
  | { tipo: 'exclusion'; recurso: string; nombre?: string }
  | { tipo: 'concurrencia-max'; accion: string; max: number; nombre?: string }
  | { tipo: 'capacidad'; recurso: string; max: number; nombre?: string }
  | { tipo: 'capacidad-alcanzable'; recurso: string; valor: number; nombre?: string }
  | { tipo: 'concurrencia-alcanzable'; accion: string; valor: number; nombre?: string }
  | { tipo: 'secuencia'; acciones: string[]; nombre?: string }
  | { tipo: 'rango'; variable: string; min?: number; max?: number; nombre?: string }
  | { tipo: 'sin-deadlock'; nombre?: string }
  | { tipo: 'sin-inanicion'; nombre?: string }
  | { tipo: 'todas-ejecutan'; nombre?: string }
  | { tipo: 'max-semaforos'; max: number; nombre?: string }

export interface ResultadoTest {
  nombre: string
  ok: boolean
  /** Por qué falla (sin dar la solución). */
  motivo?: string
}

export interface ResultadoVerificacion {
  errores: ErrorParseo[]
  tests: ResultadoTest[]
  ok: boolean
  /** true si la exploración se cortó por tamaño (los tests pasados son "hasta donde se exploró"). */
  acotada: boolean
}
