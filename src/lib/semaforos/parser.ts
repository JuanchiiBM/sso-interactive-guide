import type {
  EjercicioSemaforos,
  ErrorParseo,
  Instruccion,
  Programa,
  RefSemaforo,
  SemaforoDeclarado,
} from './tipos'

/** Forma canónica de una línea de código: sin espacios ni `;` final, para comparar acciones. */
export const normalizar = (s: string) => s.replace(/\s+/g, '').replace(/;+$/, '')

const RE_SEM = /^(semaphore|semaforo|semáforo)\s+(.+?)$/i
const RE_DECL = /^([A-Za-z_]\w*)\s*(?:\[\s*(\w+)\s*\])?\s*=\s*(\{[^}]*\}|-?\d+|[A-Za-z_]\w*|\?)$/
const RE_PROC = /^void\s+([A-Za-z_]\w*)\s*\(\s*(?:void)?\s*\)\s*(\{)?$/
// admite la notación de las resoluciones: wait(s) x3; = tres wait seguidos
const RE_OP = /^(wait|signal)\s*\(\s*([A-Za-z_]\w*)\s*(?:\[\s*(.+?)\s*\])?\s*\)\s*(?:[xX]\s*(\d+))?\s*(;)?$/i
const RE_WHILE = /^while\s*\(\s*(true|1)\s*\)\s*(\{)?$/i
const RUIDO = /^(while\s*\(\s*(true|1)\s*\)\s*\{?|\{|\}|do\s*\{?|\}\s*while.*)$/i

/** Semáforo a completar en una plantilla: `wait(______);`. */
const HUECO = /^_{2,}$/

/** Una línea wait/signal como tokens normalizados, uno por repetición (`wait(s)x3` → 3 tokens). */
function tokensOp(linea: string): string[] {
  const m = linea.trim().match(RE_OP)
  if (!m) return []
  const token = `${m[1].toLowerCase()}(${m[2]}${m[3] != null ? `[${m[3].replace(/\s+/g, '')}]` : ''})`
  return Array(Number(m[4] ?? 1)).fill(token)
}

/** Compara el código escrito con el original; un hueco `______` acepta cualquier semáforo. */
function coinciden(esperado: string[], obtenido: string[]): boolean {
  if (esperado.length !== obtenido.length) return false
  return esperado.every((e, i) => {
    const hueco = e.match(/^(wait|signal)\(_{2,}\)$/)
    return hueco ? obtenido[i].startsWith(`${hueco[1]}(`) : e === obtenido[i]
  })
}

/** Nombre de la función C de un proceso: "De Paul" → De_Paul. */
export const identificador = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\W+/g, '_')

const indentar = (codigo: string) =>
  codigo
    .trimEnd()
    .split('\n')
    .map((l) => (l ? `  ${l}` : l))
    .join('\n')

/** Separa por comas que no estén dentro de {} o []. */
function separarDeclaraciones(texto: string): string[] {
  const partes: string[] = []
  let profundidad = 0
  let actual = ''
  for (const c of texto) {
    if (c === '{' || c === '[') profundidad++
    if (c === '}' || c === ']') profundidad--
    if (c === ',' && profundidad === 0) {
      partes.push(actual)
      actual = ''
    } else {
      actual += c
    }
  }
  partes.push(actual)
  return partes.map((p) => p.trim()).filter(Boolean)
}

/** Plantilla que ve el alumno al abrir el ejercicio. */
export function plantilla(ej: EjercicioSemaforos): string {
  const partes = [ej.inicial?.trim() ?? '// Declará tus semáforos, ej: semaphore mutex = 1;', '']
  for (const p of ej.procesos) {
    const n = p.instancias === 1 ? '1 instancia' : `${p.instancias} instancias`
    partes.push(
      `// ${p.nombre} (${n} en los tests)`,
      `void ${identificador(p.nombre)}() {`,
      indentar(p.codigo),
      '}',
      '',
    )
  }
  return partes.join('\n')
}

/** Clave de `acciones`: "posicionarse()" o, si la misma línea significa distinto por proceso, "Jugador::posicionarse()". */
export const textoAccion = (clave: string) => {
  const i = clave.indexOf('::')
  return i < 0 ? clave : clave.slice(i + 2)
}

/**
 * Junta cada `if (...) { ... } else { ... }` en una sola línea: el modelo lo trata como una acción
 * atómica (lo que importa para sincronizar es cuándo se lee la condición, no qué rama corre).
 */
export function unirCondicionales(lineas: string[]): string[] {
  const out = [...lineas]
  for (let i = 0; i < out.length; i++) {
    if (!/^\s*if\s*\(/.test(out[i])) continue
    let j = i
    let texto = out[i].trim()
    let prof = 0
    const contar = (s: string) => {
      for (const c of s) prof += c === '{' ? 1 : c === '}' ? -1 : 0
    }
    contar(out[i])
    while (j + 1 < out.length && (prof > 0 || /^\s*else\b/.test(out[j + 1]))) {
      j++
      contar(out[j])
      texto += ` ${out[j].trim()}`
      out[j] = ''
    }
    out[i] = out[i].match(/^\s*/)![0] + texto
  }
  return out
}

/** Nombres válidos como índice de un array de semáforos. */
export function indicesValidos(ej: EjercicioSemaforos): Set<string> {
  return new Set([
    'id',
    ...(ej.locales ?? []),
    ...Object.keys(ej.variables ?? {}),
    ...Object.keys(ej.constantes ?? {}),
    ...Object.keys(ej.funciones ?? {}),
  ])
}

export function parsear(
  fuente: string,
  ej: EjercicioSemaforos,
): { programa: Programa; errores: ErrorParseo[] } {
  const errores: ErrorParseo[] = []
  const error = (linea: number, mensaje: string) => errores.push({ linea, mensaje })
  const semaforos: Record<string, SemaforoDeclarado> = {}
  const procesos: Programa['procesos'] = []
  const accionesValidas = new Map(
    Object.keys(ej.acciones).map((a) => [normalizar(textoAccion(a)), textoAccion(a)]),
  )
  const nombresProceso = new Map(
    ej.procesos.map((p) => [identificador(p.nombre).toLowerCase(), p.nombre]),
  )
  const indices = indicesValidos(ej)
  const valorDe = (s: string) => (/^-?\d+$/.test(s) ? Number(s) : ej.constantes?.[s])
  let actual: Programa['procesos'][number] | null = null
  let trasCiclo = false
  // acciones escritas por función, incluidas las inalcanzables (después del while)
  const escritas = new Map<string, string[]>()
  const llaves: { linea: number; tipo: 'funcion' | 'while' | 'bloque' }[] = []

  const declarar = (linea: number, decl: string) => {
    const m = decl.match(RE_DECL)
    if (!m) {
      error(linea, `Declaración inválida: "${decl}" (usá semaphore nombre = valor; o semaphore nombre[N] = valor;)`)
      return
    }
    const [, nombre, tam, valorTxt] = m
    if (nombre in semaforos) return error(linea, `El semáforo ${nombre} está declarado dos veces`)
    const tamano = tam == null ? 1 : valorDe(tam)
    if (tamano == null || tamano < 1) return error(linea, `Tamaño inválido "${tam}" para ${nombre}`)
    if (valorTxt === '?') {
      // plantilla de "inicializar": queda declarado para no marcar cada wait, pero falta el valor
      semaforos[nombre] = { valores: Array(tamano).fill(0), esArray: tam != null }
      return error(linea, `Completá el valor inicial de ${nombre} (en lugar de ?)`)
    }
    let valores: (number | undefined)[]
    if (valorTxt.startsWith('{')) {
      if (tam == null) return error(linea, `${nombre} no es un array: no se inicializa con { }`)
      valores = valorTxt.slice(1, -1).split(',').map((v) => valorDe(v.trim()))
      if (valores.length !== tamano) {
        return error(linea, `${nombre} tiene ${tamano} posiciones pero se inicializaron ${valores.length}`)
      }
    } else {
      valores = Array(tamano).fill(valorDe(valorTxt))
    }
    if (valores.some((v) => v == null)) return error(linea, `Valor desconocido en la declaración de ${nombre}`)
    if (valores.some((v) => v! < 0)) return error(linea, `El semáforo ${nombre} no puede inicializarse en negativo`)
    semaforos[nombre] = { valores: valores as number[], esArray: tam != null }
  }

  unirCondicionales(fuente.split('\n')).forEach((cruda, i) => {
    const linea = i + 1
    const texto = cruda.replace(/\/\/.*$/, '').trim()
    if (!texto) return

    // llaves: se cuentan en toda línea para detectar las que faltan o sobran
    const tipoBloque = RE_PROC.test(texto) ? 'funcion' : RE_WHILE.test(texto) ? 'while' : 'bloque'
    for (const c of texto) {
      if (c === '{' && !RE_SEM.test(texto)) llaves.push({ linea, tipo: tipoBloque })
      if (c === '}' && !RE_SEM.test(texto)) {
        const cerrada = llaves.pop()
        if (!cerrada) error(linea, 'Sobra una llave "}"')
        else if (cerrada.tipo === 'while') trasCiclo = true
      }
    }

    const sem = texto.match(RE_SEM)
    if (sem) {
      if (sem[1] !== 'semaphore') error(linea, `Se escribe "semaphore", no "${sem[1]}"`)
      if (!texto.endsWith(';')) error(linea, 'Falta ";" al final de la declaración')
      if (actual) error(linea, 'Los semáforos se declaran afuera de las funciones (son globales)')
      for (const decl of separarDeclaraciones(sem[2].replace(/;+$/, ''))) declarar(linea, decl)
      return
    }

    const proc = texto.match(RE_PROC)
    if (proc) {
      const nombre = nombresProceso.get(proc[1].toLowerCase())
      trasCiclo = false
      if (!nombre) {
        const validos = ej.procesos.map((p) => `${identificador(p.nombre)}()`).join(', ')
        error(linea, `Función desconocida: ${proc[1]}() (las válidas son ${validos})`)
        actual = null
      } else {
        actual = { nombre, instrucciones: [], inicioCiclo: 0, tieneCiclo: false }
        procesos.push(actual)
        escritas.set(nombre, [])
      }
      return
    }

    if (/^while\b/i.test(texto) && !RE_WHILE.test(texto)) {
      error(linea, 'El ciclo se escribe while(TRUE){')
      return
    }
    if (RE_WHILE.test(texto) && actual && !actual.tieneCiclo) {
      actual.tieneCiclo = true
      actual.inicioCiclo = actual.instrucciones.length
      return
    }
    if (RUIDO.test(texto)) return
    if (!actual) {
      error(linea, `Línea fuera de una función: "${texto}"`)
      return
    }

    const op = texto.match(RE_OP)
    let instr: Instruccion | null = null
    let veces = 1
    if (op) {
      if (op[1] !== op[1].toLowerCase()) error(linea, `Se escribe "${op[1].toLowerCase()}" en minúscula`)
      if (!op[5]) error(linea, 'Falta ";" al final')
      if (op[4] != null) {
        veces = Number(op[4])
        if (veces < 1 || veces > 20) error(linea, `Repetición inválida: x${op[4]} (entre x1 y x20)`)
      }
      const ref: RefSemaforo = { nombre: op[2], ...(op[3] != null ? { indice: op[3] } : {}) }
      if (ref.indice != null && !/^\d+$/.test(ref.indice) && !indices.has(ref.indice)) {
        const validos = [...indices].join(', ')
        error(linea, `Índice desconocido "${ref.indice}" (podés usar un número${validos ? ` o: ${validos}` : ''})`)
      }
      instr = { tipo: op[1].toLowerCase() as 'wait' | 'signal', sem: ref, linea }
      if (ej.soloInicializar) escritas.get(actual.nombre)!.push(...tokensOp(texto))
    } else if (/^(wait|signal)\b/i.test(texto)) {
      error(linea, 'Uso: wait(nombre); signal(nombre); o con array: wait(nombre[indice]);')
    } else {
      const accion = accionesValidas.get(normalizar(texto))
      if (!accion) {
        error(linea, `Línea no reconocida: "${texto}" (¿modificaste el código original?)`)
      } else {
        if (!texto.endsWith(';') && !texto.endsWith('}')) error(linea, 'Falta ";" al final')
        instr = { tipo: 'accion', accion, linea }
        escritas.get(actual.nombre)!.push(normalizar(accion))
      }
    }
    // lo que está después de un while(TRUE) nunca se ejecuta: cuenta para el código, no para el modelo
    if (instr && !trasCiclo) for (let k = 0; k < veces; k++) actual.instrucciones.push(instr)
  })

  for (const abierta of llaves) error(abierta.linea, 'Falta cerrar la llave "{" abierta acá')

  for (const p of procesos) {
    for (const ins of p.instrucciones) {
      if (ins.tipo === 'accion') continue
      const decl = semaforos[ins.sem.nombre]
      if (HUECO.test(ins.sem.nombre)) error(ins.linea, 'Completá el semáforo que va en este hueco')
      else if (!decl) error(ins.linea, `El semáforo ${ins.sem.nombre} no está declarado/inicializado`)
      else if (decl.esArray && ins.sem.indice == null) {
        error(ins.linea, `${ins.sem.nombre} es un array: indicá la posición, ej. ${ins.sem.nombre}[i]`)
      } else if (!decl.esArray && ins.sem.indice != null) {
        error(ins.linea, `${ins.sem.nombre} no es un array: no lleva [ ]`)
      }
    }
  }

  // el código original tiene que quedar intacto y en el mismo orden
  for (const def of ej.procesos) {
    const esperado = unirCondicionales(def.codigo.split('\n'))
      .map((l) => l.replace(/\/\/.*$/, '').trim())
      .filter((l) => l && !RUIDO.test(l))
      .flatMap((l) => (RE_OP.test(l) ? (ej.soloInicializar ? tokensOp(l) : []) : [normalizar(l)]))
    const obtenido = escritas.get(def.nombre)
    if (!obtenido) {
      error(0, `Falta la función ${identificador(def.nombre)}()`)
    } else if (!coinciden(esperado, obtenido)) {
      error(
        0,
        ej.soloInicializar
          ? `En ${identificador(def.nombre)}() solo se completan los huecos (______) y los valores iniciales: no se agregan, sacan ni mueven wait/signal`
          : `El código original de ${identificador(def.nombre)}() cambió: solo se pueden agregar wait/signal`,
      )
    }
  }

  errores.sort((a, b) => a.linea - b.linea)
  return { programa: { semaforos, procesos }, errores }
}
