import type { EjercicioSemaforos, ErrorParseo, Instruccion, Programa } from './tipos'

/** Forma canónica de una línea de código: sin espacios ni `;` final, para comparar acciones. */
export const normalizar = (s: string) => s.replace(/\s+/g, '').replace(/;+$/, '')

const RE_SEM = /^(semaphore|semaforo|semáforo)\s+(.+?)$/i
const RE_DECL = /^([A-Za-z_]\w*)\s*=\s*(-?\d+|[A-Za-z_]\w*)$/
const RE_PROC = /^void\s+([A-Za-z_]\w*)\s*\(\s*(?:void)?\s*\)\s*(\{)?$/
const RE_OP = /^(wait|signal)\s*\(\s*([A-Za-z_]\w*)\s*\)\s*(;)?$/i
const RE_WHILE = /^while\s*\(\s*(true|1)\s*\)\s*(\{)?$/i
const RUIDO = /^(while\s*\(\s*(true|1)\s*\)\s*\{?|\{|\}|do\s*\{?|\}\s*while.*)$/i

/** Nombre de la función C de un proceso: "De Paul" → De_Paul. */
export const identificador = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\W+/g, '_')

const indentar = (codigo: string) =>
  codigo
    .trimEnd()
    .split('\n')
    .map((l) => (l ? `  ${l}` : l))
    .join('\n')

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

export function parsear(
  fuente: string,
  ej: EjercicioSemaforos,
): { programa: Programa; errores: ErrorParseo[] } {
  const errores: ErrorParseo[] = []
  const error = (linea: number, mensaje: string) => errores.push({ linea, mensaje })
  const semaforos: Record<string, number> = {}
  const procesos: Programa['procesos'] = []
  const accionesValidas = new Map(Object.keys(ej.acciones).map((a) => [normalizar(a), a]))
  const nombresProceso = new Map(
    ej.procesos.map((p) => [identificador(p.nombre).toLowerCase(), p.nombre]),
  )
  let actual: Programa['procesos'][number] | null = null
  let trasCiclo = false
  // acciones escritas por función, incluidas las inalcanzables (después del while)
  const escritas = new Map<string, string[]>()
  const llaves: { linea: number; tipo: 'funcion' | 'while' | 'bloque' }[] = []

  fuente.split('\n').forEach((cruda, i) => {
    const linea = i + 1
    const texto = cruda.replace(/\/\/.*$/, '').trim()
    if (!texto) return

    // llaves: se cuentan en toda línea para detectar las que faltan o sobran
    const tipoBloque = RE_PROC.test(texto) ? 'funcion' : RE_WHILE.test(texto) ? 'while' : 'bloque'
    for (const c of texto) {
      if (c === '{') llaves.push({ linea, tipo: tipoBloque })
      if (c === '}') {
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
      for (const decl of sem[2].replace(/;+$/, '').split(',')) {
        const m = decl.trim().match(RE_DECL)
        const valor = m ? (/^-?\d+$/.test(m[2]) ? Number(m[2]) : ej.constantes?.[m[2]]) : undefined
        if (!m) error(linea, `Declaración inválida: "${decl.trim()}" (usá semaphore nombre = valor;)`)
        else if (valor == null) error(linea, `Valor desconocido "${m[2]}" para ${m[1]}`)
        else if (valor < 0) error(linea, `El semáforo ${m[1]} no puede inicializarse en negativo`)
        else if (m[1] in semaforos) error(linea, `El semáforo ${m[1]} está declarado dos veces`)
        else semaforos[m[1]] = valor
      }
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
    if (op) {
      if (op[1] !== op[1].toLowerCase()) error(linea, `Se escribe "${op[1].toLowerCase()}" en minúscula`)
      if (!op[3]) error(linea, 'Falta ";" al final')
      instr = { tipo: op[1].toLowerCase() as 'wait' | 'signal', sem: op[2], linea }
    } else if (/^(wait|signal)\b/i.test(texto)) {
      error(linea, 'Uso: wait(nombre); o signal(nombre); con un solo semáforo')
    } else {
      const accion = accionesValidas.get(normalizar(texto))
      if (!accion) {
        error(linea, `Línea no reconocida: "${texto}" (¿modificaste el código original?)`)
      } else {
        if (!texto.endsWith(';')) error(linea, 'Falta ";" al final')
        instr = { tipo: 'accion', accion, linea }
        escritas.get(actual.nombre)!.push(normalizar(accion))
      }
    }
    // lo que está después de un while(TRUE) nunca se ejecuta: cuenta para el código, no para el modelo
    if (instr && !trasCiclo) actual.instrucciones.push(instr)
  })

  for (const abierta of llaves) error(abierta.linea, 'Falta cerrar la llave "{" abierta acá')

  for (const p of procesos) {
    for (const ins of p.instrucciones) {
      if (ins.tipo !== 'accion' && !(ins.sem in semaforos)) {
        error(ins.linea, `El semáforo ${ins.sem} no está declarado/inicializado`)
      }
    }
  }

  // el código original tiene que quedar intacto y en el mismo orden
  for (const def of ej.procesos) {
    const esperado = def.codigo
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !RUIDO.test(l) && !RE_OP.test(l))
      .map(normalizar)
    const obtenido = escritas.get(def.nombre)
    if (!obtenido) {
      error(0, `Falta la función ${identificador(def.nombre)}()`)
    } else if (esperado.join('|') !== obtenido.join('|')) {
      error(0, `El código original de ${identificador(def.nombre)}() cambió: solo se pueden agregar wait/signal`)
    }
  }

  errores.sort((a, b) => a.linea - b.linea)
  return { programa: { semaforos, procesos }, errores }
}
