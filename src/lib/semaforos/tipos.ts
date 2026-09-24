/** Modelo del intérprete de semáforos. Semántica y límites: docs/brain/simuladores/Verificador de Semáforos.md */

/** Semáforo referenciado en el código: `mutex` o `recursos[id_recurso]`. */
export interface RefSemaforo {
  nombre: string
  /** Expresión del índice tal como se escribió (literal, `id`, local, global o función). */
  indice?: string
}

export type Instruccion =
  | { tipo: 'wait'; sem: RefSemaforo; linea: number }
  | { tipo: 'signal'; sem: RefSemaforo; linea: number }
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

export interface SemaforoDeclarado {
  valores: number[]
  esArray: boolean
}

export interface Programa {
  semaforos: Record<string, SemaforoDeclarado>
  procesos: ProcesoParseado[]
}

export interface ErrorParseo {
  linea: number
  mensaje: string
  /** true: el código compila pero falla al ejecutarse (ej. índice fuera de rango). */
  ejecucion?: boolean
}

export interface AccionSpec {
  /** Recursos que "usa" mientras está en la acción; admite índices con locales: `recurso[id_recurso]`. */
  recursos?: string[]
  /** Suma a variables globales al ejecutarse; admite índices: `cajas[id_asent]` → `cajas[1]`. */
  efecto?: Record<string, number>
  /** Asignación no determinista a variables locales (se prueban todos los valores 0..valores-1). */
  asigna?: { variables: string[]; valores: number; distintos?: boolean }
  /** Locales que toman el id de la instancia, ej. `id_asent = getID()`. */
  asignaId?: string[]
  /** Agrega a una bolsa el valor de una expresión: `{ pendientes: 'id' }` (el pedido lleva el id). */
  pone?: Record<string, string>
  /** Saca de una bolsa un valor cualquiera (se prueban todos) y lo guarda en una local. */
  saca?: Record<string, string>
  /** Recurso implícito que la acción toma (bloquea si no hay) o devuelve, ej. syscall_pedir(). */
  adquiere?: string[]
  libera?: string[]
}

/** Definición del ejercicio (frontmatter `semaforos:`). */
export interface EjercicioSemaforos {
  procesos: { nombre: string; instancias: number; codigo: string }[]
  /** Efectos y recursos por acción, con la acción escrita como en el código (sin `;`). */
  acciones: Record<string, AccionSpec>
  /** Valores iniciales de variables globales contadoras (ej. elementos en una lista). */
  variables?: Record<string, number>
  /** Variables globales que dan la vuelta (ej. turno actual módulo 5). */
  modulos?: Record<string, number>
  /** Variables locales de cada instancia (arrancan en 0). `id` (0..instancias-1) existe siempre. */
  locales?: string[]
  /** Funciones que el alumno puede usar como índice: `actual()` → variable (+ desplazamiento). */
  funciones?: Record<string, { variable: string; mas?: number; modulo?: number }>
  /** Recursos implícitos de las acciones `adquiere`/`libera`: nombre → cantidad × instancias. */
  recursosImplicitos?: Record<string, { cantidad: number; instancias: number }>
  /** Declaraciones que trae la plantilla (ejercicios donde hay que corregir semáforos dados). */
  inicial?: string
  /** Los wait/signal del enunciado quedan fijos: solo se completan huecos `______` y valores iniciales. */
  soloInicializar?: boolean
  /** Constantes que el alumno puede usar al inicializar o como tamaño (ej. M = 3). */
  constantes?: Record<string, number>
  /** Listas compartidas que llevan datos (ids) de un proceso a otro; ver `pone`/`saca`. */
  bolsas?: string[]
  /** Otros nombres para `id` que el alumno puede usar como índice, ej. `getId()`. */
  aliasId?: string[]
  /** Topes de exploración propios (por defecto 12 y 8) cuando un contador puede crecer sin límite. */
  cotas?: { semaforos?: number; variables?: number }
  tests: TestSemaforos[]
}

/** Todo test acepta `nombre` y `motivo` (explicación propia cuando falla). */
export type TestSemaforos = (
  | { tipo: 'exclusion'; recurso: string; nombre?: string }
  | { tipo: 'concurrencia-max'; accion: string; max: number; nombre?: string }
  | { tipo: 'capacidad'; recurso: string; max: number; nombre?: string }
  | { tipo: 'capacidad-alcanzable'; recurso: string; valor: number; nombre?: string }
  | { tipo: 'concurrencia-alcanzable'; accion: string; valor: number; nombre?: string }
  | { tipo: 'secuencia'; acciones: string[]; nombre?: string }
  | { tipo: 'orden-instancias'; accion: string; proceso: string; nombre?: string }
  | { tipo: 'rango'; variable: string; min?: number; max?: number; nombre?: string }
  | { tipo: 'valor-alcanzable'; variable: string; valor: number; nombre?: string }
  | { tipo: 'simultaneas'; acciones: [string, string]; nombre?: string }
  | { tipo: 'sin-deadlock'; nombre?: string }
  | { tipo: 'sin-inanicion'; nombre?: string }
  | { tipo: 'todas-ejecutan'; nombre?: string }
  | { tipo: 'max-semaforos'; max: number; nombre?: string }
) & { motivo?: string }

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
