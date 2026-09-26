/** Recorridos del tema Deadlock: algoritmo del banquero (estado seguro y solicitudes). */
import {
  disponibles,
  estadoSeguro,
  fmt,
  pendiente,
  restar,
  solicitar,
  sumar,
  type Seguridad,
  type Vector,
} from '../banquero'
import { cartel, fila } from '../primitivas-sincronizacion'
import type { Paso, Recorrido } from '../recorrido'
import { texto } from '../svg'

/** Datos del ejemplo (los verifica banquero.test.ts). */
export const EJEMPLO_BANQUERO = {
  total: [7, 4, 5],
  max: [
    [4, 3, 3],
    [3, 2, 2],
    [5, 3, 3],
  ],
  asig: [
    [1, 0, 1],
    [2, 1, 1],
    [2, 2, 1],
  ],
}
const { total: T, max: MAX, asig: A } = EJEMPLO_BANQUERO
const D = disponibles(T, A)
const PEND = pendiente(MAX, A)
const N = MAX.length

const CELDA = 36
const ALTO = 30
const X = { max: 70, a: 200, pend: 330, d: 490 }
const Y0 = 52
const yFila = (i: number) => Y0 + i * (ALTO + 4)
const nombre = (i: number) => `P${i + 1}`
const orden = (s: number[]) => s.map(nombre).join(' → ')
const filas = (pref: string) => Array.from({ length: N }, (_, i) => `${pref}-${i}`)

const encabezado = (x: number, titulo: string) =>
  texto(x + (CELDA * 3) / 2, 22, titulo, { clase: 'rs-titulo' }) +
  [0, 1, 2]
    .map((j) => texto(x + j * CELDA + CELDA / 2, 42, `R${j + 1}`, { clase: 'rs-nota' }))
    .join('')

const matriz = (pref: string, x: number, datos: (Vector | null)[]) =>
  datos
    .map((v, i) =>
      fila(`${pref}-${i}`, x, yFila(i), CELDA, ALTO, v ? v.map(String) : ['·', '·', '·']),
    )
    .join('')

const banqueroLienzo = {
  ancho: 720,
  alto: 290,
  titulo: 'Algoritmo del banquero con 3 procesos y 3 tipos de recurso',
  cuerpo: [
    encabezado(X.max, 'Max'),
    encabezado(X.a, 'A'),
    encabezado(X.pend, 'Pend = Max − A'),
    encabezado(X.d, 'D'),
    ...Array.from({ length: N }, (_, i) =>
      texto(40, yFila(i) + ALTO / 2, nombre(i), { clase: 'rs-titulo', val: `fin-${i}` }),
    ),
    matriz('max', X.max, MAX),
    matriz('a', X.a, A),
    matriz(
      'pend',
      X.pend,
      PEND.map(() => null),
    ),
    fila('d', X.d, Y0, CELDA, ALTO, ['·', '·', '·']),
    texto(544, 100, `T = ${fmt(T)}`, { clase: 'rs-nota' }),
    texto(544, 124, 'secuencia: —', { val: 'secuencia' }),
    cartel('sol', 544, 160, 200, 30, ''),
    ...[0, 1, 2].map((k) =>
      texto(360, 192 + k * 20, '', { clase: 'rs-cuenta', val: `cuenta-${k}` }),
    ),
    cartel('veredicto', 360, 266, 480, 32, ''),
  ],
}

// ── valores de celdas ──

const vFila = (pref: string, i: number, v: Vector) =>
  Object.fromEntries(v.map((x, j) => [`${pref}-${i}-${j}`, String(x)]))
const vD = (v: Vector) => Object.fromEntries(v.map((x, j) => [`d-${j}`, String(x)]))
const vPend = (pend: Vector[]) => Object.assign({}, ...pend.map((v, i) => vFila('pend', i, v)))
const vFin = (terminados: number[]) =>
  Object.fromEntries(
    Array.from({ length: N }, (_, i) => [
      `fin-${i}`,
      nombre(i) + (terminados.includes(i) ? ' ✓' : ''),
    ]),
  )
const vSecuencia = (s: number[]) => ({
  secuencia: `secuencia: ${s.length ? orden(s) : '—'}`,
})
function vCuentas(...lineas: string[]) {
  if (lineas.length > 3) throw new Error('banquero: más de 3 renglones de cuentas')
  return Object.fromEntries([0, 1, 2].map((k) => [`cuenta-${k}`, lineas[k] ?? '']))
}
const sinClases = (pref: string) => Object.fromEntries(filas(pref).map((el) => [el, '']))

/** Recursos en los que no alcanza: "R2", "R1 y R2"… */
function faltan(pend: Vector, d: Vector) {
  const r = pend.flatMap((x, j) => (x > d[j] ? [`R${j + 1}`] : []))
  return r.length > 1 ? `${r.slice(0, -1).join(', ')} y ${r.at(-1)}` : r[0]
}

/** Pasos del chequeo de estado seguro, una vuelta por paso (o dos, revisar y terminar). */
function pasosSeguridad(s: Seguridad, asig: Vector[], separado: boolean): Paso[] {
  const pasos: Paso[] = []
  s.vueltas.forEach((v, k) => {
    const d = v.antes
    const lineas = v.revisados.map(
      ({ proceso: i, cumple }) =>
        `${nombre(i)}: ${fmt(s.pend[i])} ≤ ${fmt(d)}? ${cumple ? 'sí' : 'no'}`,
    )
    const noPueden = v.revisados
      .filter((r) => !r.cumple)
      .map(
        ({ proceso: i }) =>
          `${nombre(i)} no: necesita más de lo disponible en ${faltan(s.pend[i], d)}.`,
      )
    const clases = Object.fromEntries(
      v.revisados.map(({ proceso: i, cumple }) => [`pend-${i}`, cumple ? 'rc-ok' : 'rc-mal']),
    )
    const revisados = v.revisados.map(({ proceso: i }) => `pend-${i}`)
    const titulo = `Vuelta ${k + 1}.`
    if (v.elegido === null) {
      pasos.push({
        titulo,
        texto: `${noPueden.join(' ')} **Ningún proceso puede terminar** con \`D = ${fmt(d)}\`.`,
        resaltar: [...revisados, 'd'],
        valores: vCuentas(...lineas),
        clases,
      })
      return
    }
    const e = v.elegido
    const suma = `D = ${fmt(d)} + ${fmt(asig[e])} = ${fmt(v.despues)}`
    const hecho = s.secuencia.slice(0, k + 1)
    const busca = `${noPueden.join(' ')} **${nombre(e)} sí**: \`${fmt(s.pend[e])} ≤ ${fmt(d)}\`.`
    const termina: Paso = {
      titulo: separado ? `Termina ${nombre(e)}.` : titulo,
      texto:
        (separado
          ? `Se supone que ${nombre(e)} recibe lo que le falta, termina y devuelve todo lo que tenía asignado: `
          : `${busca} Termina y devuelve lo asignado: `) + `\`${suma}\`.`,
      resaltar: separado ? [`a-${e}`, 'd'] : [...revisados, `a-${e}`, 'd'],
      valores: {
        ...vD(v.despues),
        ...vFin(hecho),
        ...vSecuencia(hecho),
        ...(separado ? vCuentas(suma) : vCuentas(...lineas, suma)),
      },
      clases: { ...clases, ...(separado ? sinClases('pend') : {}), [`pend-${e}`]: 'rc-ok' },
    }
    if (separado)
      pasos.push({
        titulo: `${titulo} ¿Quién puede terminar?`,
        texto: `Se busca, en orden, un proceso con \`Pend ≤ D\` componente a componente. ${busca}`,
        resaltar: [...revisados, 'd'],
        valores: vCuentas(...lineas),
        clases,
      })
    pasos.push(termina)
  })
  return pasos
}

// ── Variante 1: ¿el estado es seguro? ──

const seguridad = estadoSeguro(MAX, A, D)
const secuencia = orden(seguridad.secuencia)

const pasosEstadoSeguro: Paso[] = [
  {
    titulo: 'Los datos.',
    texto: `Cada proceso declaró su máximo (\`Max\`) y tiene asignado \`A\`. En total hay \`T = ${fmt(T)}\` instancias de R1, R2 y R3.`,
    resaltar: [...filas('max'), ...filas('a')],
  },
  {
    titulo: 'Pend = Max − A.',
    texto: `Lo que a cada uno le puede faltar todavía. Por ejemplo, P1: \`${fmt(MAX[0])} − ${fmt(A[0])} = ${fmt(PEND[0])}\`.`,
    resaltar: [...filas('max'), ...filas('a'), ...filas('pend')],
    valores: vPend(PEND),
  },
  {
    titulo: 'Disponibles.',
    texto: `\`D = T − (suma de A) = ${fmt(T)} − ${fmt(restar(T, D))} = ${fmt(D)}\`.`,
    resaltar: [...filas('a'), 'd'],
    valores: vD(D),
  },
  ...pasosSeguridad(seguridad, A, true),
  {
    titulo: 'Estado seguro.',
    texto: `Todos pudieron terminar: ${secuencia} es una **secuencia segura**. Alcanza con encontrar una, aunque haya otras.`,
    resaltar: ['veredicto'],
    valores: { veredicto: `seguro: ${secuencia}`, ...vCuentas() },
    clases: { ...sinClases('pend'), veredicto: 'rc-ok' },
    mostrar: ['veredicto'],
  },
]

// ── Variantes 2 y 3: llega una solicitud ──

const estadoInicial = { ...vPend(PEND), ...vD(D) }

function pasosSolicitud(p: number, sol: Vector): Paso[] {
  const r = solicitar(MAX, A, D, p, sol)
  if (!r.valida || !r.alcanza || !r.seguridad)
    throw new Error('banquero: la solicitud del ejemplo tiene que simularse')
  const P = nombre(p)
  const pendSim = pendiente(MAX, r.asig!)
  const s = r.seguridad
  const inicio: Paso[] = [
    {
      titulo: 'Llega una solicitud.',
      texto: `Desde el mismo estado seguro, ${P} pide \`${fmt(sol)}\`. Antes de dárselo, el banquero se fija cómo quedaría.`,
      resaltar: ['sol', `pend-${p}`, 'd'],
      valores: { ...estadoInicial, sol: `Sol[${P}] = ${fmt(sol)}` },
      mostrar: ['sol'],
    },
    {
      titulo: '¿Es válida? ¿Hay disponibles?',
      texto: `\`Sol ≤ Pend[${P}]\`: no pide más de lo que declaró. \`Sol ≤ D\`: hay con qué dársela ahora. Si fallara la primera sería un error; si fallara la segunda, ${P} esperaría.`,
      resaltar: ['sol', `pend-${p}`, 'd'],
      valores: vCuentas(
        `Sol ≤ Pend[${P}]: ${fmt(sol)} ≤ ${fmt(PEND[p])}? sí`,
        `Sol ≤ D: ${fmt(sol)} ≤ ${fmt(D)}? sí`,
      ),
    },
    {
      titulo: 'Simular.',
      texto: `Se hace de cuenta que se la da: \`D = D − Sol\`, \`A[${P}] = A[${P}] + Sol\` y \`Pend[${P}] = Pend[${P}] − Sol\`. Sobre ese estado se corre el chequeo.`,
      resaltar: ['sol', `a-${p}`, `pend-${p}`, 'd'],
      valores: {
        ...vD(r.disp!),
        ...vFila('a', p, r.asig![p]),
        ...vFila('pend', p, pendSim[p]),
        ...vCuentas(
          `D = ${fmt(D)} − ${fmt(sol)} = ${fmt(r.disp!)}`,
          `A[${P}] = ${fmt(A[p])} + ${fmt(sol)} = ${fmt(sumar(A[p], sol))}`,
          `Pend[${P}] = ${fmt(PEND[p])} − ${fmt(sol)} = ${fmt(pendSim[p])}`,
        ),
      },
      clases: { [`a-${p}`]: 'rc-aviso', [`pend-${p}`]: 'rc-aviso', d: 'rc-aviso' },
    },
  ]
  const fin: Paso = r.concede
    ? {
        titulo: 'Seguro: se concede.',
        texto: `Con la solicitud dada sigue habiendo una secuencia segura (${orden(s.secuencia)}), así que la simulación pasa a ser el estado real y queda \`D = ${fmt(r.disp!)}\`.`,
        resaltar: ['veredicto', `a-${p}`, 'd'],
        valores: {
          ...vD(r.disp!),
          ...vFin([]),
          ...vSecuencia(s.secuencia),
          ...vCuentas(),
          veredicto: `seguro: se le concede a ${P}`,
        },
        clases: { ...sinClases('pend'), [`a-${p}`]: '', d: '', veredicto: 'rc-ok' },
        mostrar: ['veredicto'],
      }
    : {
        titulo: 'Inseguro: no se concede.',
        texto: `Aunque había disponibles, con la solicitud dada nadie tiene garantizado terminar. Se **deshace la simulación** y ${P} espera; no se le saca nada a nadie. Inseguro no es deadlock, pero el banquero no se arriesga.`,
        resaltar: ['veredicto', `a-${p}`, `pend-${p}`, 'd'],
        valores: {
          ...estadoInicial,
          ...vFila('a', p, A[p]),
          ...vCuentas(),
          veredicto: `inseguro: ${P} espera`,
        },
        clases: { ...sinClases('pend'), [`a-${p}`]: '', d: '', veredicto: 'rc-mal' },
        mostrar: ['veredicto'],
      }
  return [...inicio, ...pasosSeguridad(s, r.asig!, false), fin]
}

const banquero: Recorrido = {
  ...banqueroLienzo,
  variantes: [
    { nombre: '¿El estado es seguro?', pasos: pasosEstadoSeguro },
    { nombre: 'P3 pide (1, 0, 1)', pasos: pasosSolicitud(2, [1, 0, 1]) },
    { nombre: 'P1 pide (1, 1, 0)', pasos: pasosSolicitud(0, [1, 1, 0]) },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  banquero,
}
