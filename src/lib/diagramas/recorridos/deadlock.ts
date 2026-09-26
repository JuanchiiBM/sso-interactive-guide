/** Recorridos del tema Deadlock: banquero, grafo de asignación pedido a pedido y detección. */
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
import { detectar } from '../deteccion'
import { arista, instancias, leyenda, proceso, recurso, type Nodo } from '../primitivas-grafo'
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

// ── Grafo de asignación pedido a pedido ──

const nodo = (x: number, y: number, forma: Nodo['forma']): Nodo => ({ x, y, forma })
const G = {
  p3: nodo(100, 60, 'circulo'),
  p1: nodo(250, 60, 'circulo'),
  p2: nodo(400, 60, 'circulo'),
  r1: nodo(250, 210, 'cuadrado'),
  r2: nodo(400, 210, 'cuadrado'),
}
const CICLO = ['e-r1-p1', 'e-p1-r2', 'e-r2-p2', 'e-p2-r1']
const conClase = (els: string[], clase: string) => Object.fromEntries(els.map((e) => [e, clase]))
const estado = (p: string, t: string) => ({ [`est-${p}`]: `${p.toUpperCase()}: ${t}` })

const grafoPedidos: Recorrido = {
  ancho: 720,
  alto: 305,
  titulo: 'Grafo de asignación de recursos armado pedido a pedido',
  cuerpo: [
    arista('e-r1-p1', G.r1, G.p1, 'asignacion'),
    arista('e-r1-p3', G.r1, G.p3, 'asignacion'),
    arista('e-r1-p2', G.r1, G.p2, 'asignacion'),
    arista('e-r2-p2', G.r2, G.p2, 'asignacion'),
    arista('e-r2-p1', G.r2, G.p1, 'asignacion'),
    arista('e-p1-r2', G.p1, G.r2, 'solicitud'),
    arista('e-p2-r1', G.p2, G.r1, 'solicitud'),
    proceso('p1', G.p1, 'P1'),
    proceso('p2', G.p2, 'P2'),
    proceso('p3', G.p3, 'P3', { oculto: true }),
    recurso('r1', G.r1, 'R1'),
    recurso('r2', G.r2, 'R2'),
    instancias('r1-uno', G.r1, 1),
    instancias('r1-dos', G.r1, 2),
    instancias('r2-uno', G.r2, 1),
    texto(590, 36, 'estado', { clase: 'rs-titulo' }),
    ...['p1', 'p2', 'p3'].map((p, i) =>
      texto(470, 66 + i * 26, '', { clase: 'rs-izq', val: `est-${p}` }),
    ),
    leyenda(470, 190),
    cartel('veredicto', 250, 282, 400, 30, ''),
  ],
  variantes: [
    {
      nombre: 'Una instancia de cada recurso',
      pasos: [
        {
          titulo: 'Arranque.',
          texto:
            'Dos procesos y dos recursos con **una instancia** cada uno. Todavía no hay aristas: nadie tiene ni pide nada.',
          resaltar: ['p1', 'p2', 'r1', 'r2', 'r1-uno', 'r2-uno'],
          valores: { ...estado('p1', 'nada'), ...estado('p2', 'nada') },
          mostrar: ['r1-uno', 'r2-uno'],
        },
        {
          titulo: 'P1 toma R1.',
          texto:
            'R1 está libre, así que se le asigna enseguida: aparece la arista **R1 → P1** (asignación). Un pedido concedido no deja arista de solicitud.',
          resaltar: ['e-r1-p1', 'r1', 'r1-uno', 'p1'],
          valores: estado('p1', 'tiene R1'),
          mostrar: ['e-r1-p1'],
        },
        {
          titulo: 'P2 toma R2.',
          texto: 'Lo mismo con R2, que también estaba libre: **R2 → P2**.',
          resaltar: ['e-r2-p2', 'r2', 'r2-uno', 'p2'],
          valores: estado('p2', 'tiene R2'),
          mostrar: ['e-r2-p2'],
        },
        {
          titulo: 'P1 pide R2.',
          texto:
            'La única instancia de R2 la tiene P2, así que P1 **se bloquea**: queda la arista punteada **P1 → R2** (solicitud).',
          resaltar: ['e-p1-r2', 'p1', 'r2', 'e-r2-p2'],
          valores: estado('p1', 'tiene R1, espera R2'),
          clases: { p1: 'rc-aviso' },
          mostrar: ['e-p1-r2'],
        },
        {
          titulo: 'P2 pide R1.',
          texto: 'R1 la tiene P1, que está bloqueado: P2 también se bloquea y aparece **P2 → R1**.',
          resaltar: ['e-p2-r1', 'p2', 'r1', 'e-r1-p1'],
          valores: estado('p2', 'tiene R2, espera R1'),
          clases: { p2: 'rc-aviso' },
          mostrar: ['e-p2-r1'],
        },
        {
          titulo: 'Se cerró el ciclo.',
          texto:
            'P1 → R2 → P2 → R1 → P1. Como cada recurso del ciclo tiene **una sola instancia**, el ciclo alcanza: **hay deadlock**, porque cada uno espera lo que retiene el otro.',
          resaltar: [...CICLO, 'p1', 'p2', 'r1', 'r2', 'veredicto'],
          valores: { veredicto: 'ciclo con una instancia por recurso: deadlock' },
          clases: { ...conClase([...CICLO, 'p1', 'p2', 'veredicto'], 'rc-mal') },
          mostrar: ['veredicto'],
        },
      ],
    },
    {
      nombre: 'R1 con dos instancias',
      pasos: [
        {
          titulo: 'Arranque.',
          texto:
            'Ahora **R1 tiene dos instancias** (dos puntos) y hay un tercer proceso, P3. R2 sigue teniendo una sola.',
          resaltar: ['p1', 'p2', 'p3', 'r1', 'r2', 'r1-dos', 'r2-uno'],
          valores: { ...estado('p1', 'nada'), ...estado('p2', 'nada'), ...estado('p3', 'nada') },
          mostrar: ['r1-dos', 'r2-uno', 'p3'],
        },
        {
          titulo: 'P1 y P3 toman R1.',
          texto:
            'Cada uno se lleva **una instancia** de R1: aristas R1 → P1 y R1 → P3. R1 se queda sin instancias libres.',
          resaltar: ['e-r1-p1', 'e-r1-p3', 'r1', 'r1-dos', 'p1', 'p3'],
          valores: { ...estado('p1', 'tiene R1'), ...estado('p3', 'tiene R1') },
          mostrar: ['e-r1-p1', 'e-r1-p3'],
        },
        {
          titulo: 'P2 toma R2.',
          texto: 'R2 estaba libre: **R2 → P2**.',
          resaltar: ['e-r2-p2', 'r2', 'r2-uno', 'p2'],
          valores: estado('p2', 'tiene R2'),
          mostrar: ['e-r2-p2'],
        },
        {
          titulo: 'P1 pide R2.',
          texto: 'La tiene P2: P1 se bloquea con la solicitud **P1 → R2**.',
          resaltar: ['e-p1-r2', 'p1', 'r2'],
          valores: estado('p1', 'tiene R1, espera R2'),
          clases: { p1: 'rc-aviso' },
          mostrar: ['e-p1-r2'],
        },
        {
          titulo: 'P2 pide R1: hay ciclo.',
          texto:
            'Las dos instancias de R1 están tomadas, así que P2 espera. Se forma el mismo ciclo P1 → R2 → P2 → R1 → P1, pero R1 tiene **varias instancias**: puede o no haber deadlock.',
          resaltar: [...CICLO, 'p1', 'p2', 'r1', 'r2', 'r1-dos'],
          valores: estado('p2', 'tiene R2, espera R1'),
          clases: conClase([...CICLO, 'p2'], 'rc-aviso'),
          mostrar: ['e-p2-r1'],
        },
        {
          titulo: 'P3 no espera nada.',
          texto:
            'P3 tiene una instancia de R1 y no pide nada más, así que puede terminar. Está **fuera del ciclo** y es el que lo va a destrabar.',
          resaltar: ['p3', 'e-r1-p3', 'r1', 'r1-dos'],
          valores: estado('p3', 'tiene R1, no pide más'),
          clases: { p3: 'rc-ok' },
        },
        {
          titulo: 'P3 termina y libera R1.',
          texto:
            'Su instancia de R1 queda libre y se la dan a P2, que la estaba esperando: la solicitud P2 → R1 pasa a ser la asignación **R1 → P2**.',
          resaltar: ['e-r1-p2', 'p2', 'r1', 'r1-dos'],
          valores: { ...estado('p3', 'terminó'), ...estado('p2', 'tiene R1 y R2') },
          clases: { ...conClase(CICLO, ''), p2: 'rc-ok', p3: '' },
          ocultar: ['e-r1-p3', 'e-p2-r1'],
          mostrar: ['e-r1-p2'],
        },
        {
          titulo: 'Sin deadlock.',
          texto:
            'P2 termina y libera R1 y R2; R2 pasa a P1, que también puede terminar. **Había un ciclo y no había deadlock**: con varias instancias, el ciclo es necesario pero no suficiente.',
          resaltar: ['e-r2-p1', 'e-r1-p1', 'p1', 'r1', 'r2', 'veredicto'],
          valores: {
            ...estado('p1', 'tiene R1 y R2'),
            ...estado('p2', 'terminó'),
            veredicto: 'hay ciclo, pero no hay deadlock',
          },
          clases: { p1: 'rc-ok', p2: '', veredicto: 'rc-ok' },
          ocultar: ['e-r1-p2', 'e-r2-p2', 'e-p1-r2'],
          mostrar: ['e-r2-p1', 'veredicto'],
        },
      ],
    },
  ],
}

// ── Algoritmo de detección ──

/** Datos del ejemplo (los verifica deteccion.test.ts). */
export const EJEMPLO_DETECCION = {
  total: [2, 1, 2],
  asig: [
    [1, 0, 0],
    [1, 1, 0],
    [0, 0, 1],
    [0, 0, 0],
  ],
  pet: [
    [0, 1, 0],
    [1, 0, 1],
    [0, 0, 1],
    [1, 0, 0],
  ],
}
const DT = EJEMPLO_DETECCION
const DD = disponibles(DT.total, DT.asig)
const DET = detectar(DT.asig, DT.pet, DD)
const ND = DT.asig.length
const XD = { a: 80, pet: 220, marca: 342, d: 500 }
const filasDe = (pref: string) => Array.from({ length: ND }, (_, i) => `${pref}-${i}`)
const lista = (ps: number[]) => ps.map(nombre).join(' y ')
const vMarcas = (m: Record<number, string>) =>
  Object.fromEntries(Array.from({ length: ND }, (_, i) => [`marca-${i}`, m[i] ?? '']))
const vMarcados = (ps: number[]) => ({ marcados: `marcados: ${ps.map(nombre).join(', ') || '—'}` })
function cuentas(...lineas: string[]) {
  if (lineas.length > 4) throw new Error('detección: más de 4 renglones de cuentas')
  return Object.fromEntries([0, 1, 2, 3].map((k) => [`cuenta-${k}`, lineas[k] ?? '']))
}

const deteccionLienzo = {
  ancho: 720,
  alto: 305,
  titulo: 'Algoritmo de detección de deadlock con 4 procesos y 3 tipos de recurso',
  cuerpo: [
    encabezado(XD.a, 'A'),
    encabezado(XD.pet, 'Pet'),
    encabezado(XD.d, 'D'),
    ...Array.from({ length: ND }, (_, i) =>
      texto(40, yFila(i) + ALTO / 2, nombre(i), { clase: 'rs-titulo' }),
    ),
    ...DT.asig.map((v, i) => fila(`a-${i}`, XD.a, yFila(i), CELDA, ALTO, v.map(String))),
    ...DT.pet.map((v, i) => fila(`pet-${i}`, XD.pet, yFila(i), CELDA, ALTO, v.map(String))),
    ...Array.from({ length: ND }, (_, i) =>
      texto(XD.marca, yFila(i) + ALTO / 2, '', { clase: 'rs-izq rs-nota', val: `marca-${i}` }),
    ),
    fila('d', XD.d, Y0, CELDA, ALTO, ['·', '·', '·']),
    texto(554, 100, `T = ${fmt(DT.total)}`, { clase: 'rs-nota' }),
    texto(554, 124, 'marcados: —', { val: 'marcados' }),
    ...[0, 1, 2, 3].map((k) =>
      texto(360, 200 + k * 20, '', { clase: 'rs-cuenta', val: `cuenta-${k}` }),
    ),
    cartel('veredicto', 360, 284, 480, 30, ''),
  ],
}

function pasosDeteccion(): Paso[] {
  const marcas: Record<number, string> = conClase(DET.descartados.map(String), 'descartado')
  const hechos = [...DET.descartados]
  const desc = lista(DET.descartados)
  const pasos: Paso[] = [
    {
      titulo: 'Los datos.',
      texto:
        '`A` es lo que cada proceso tiene asignado y `Pet` lo que está pidiendo **ahora** sin que se lo den. No hacen falta los máximos: la detección mira el presente.',
      resaltar: [...filasDe('a'), ...filasDe('pet')],
    },
    {
      titulo: 'Disponibles.',
      texto: `\`D = T − (suma de A) = ${fmt(DT.total)} − ${fmt(restar(DT.total, DD))} = ${fmt(DD)}\`.`,
      resaltar: [...filasDe('a'), 'd'],
      valores: vD(DD),
    },
    {
      titulo: `Descartar a ${desc}.`,
      texto: `${desc} no tiene nada asignado: no retiene nada que otro espere, así que **no puede ser parte de un deadlock**. Se marca de entrada.`,
      resaltar: DET.descartados.map((i) => `a-${i}`),
      valores: { ...vMarcas(marcas), ...vMarcados(hechos) },
      clases: conClase(
        DET.descartados.map((i) => `a-${i}`),
        'rc-ok',
      ),
    },
  ]
  DET.vueltas.forEach((v, k) => {
    const lineas = v.revisados.map(
      ({ proceso: i, cumple }) =>
        `${nombre(i)}: ${fmt(DT.pet[i])} ≤ ${fmt(v.antes)}? ${cumple ? 'sí' : 'no'}`,
    )
    const clases = Object.fromEntries(
      v.revisados.map(({ proceso: i, cumple }) => [`pet-${i}`, cumple ? 'rc-ok' : 'rc-mal']),
    )
    const revisados = v.revisados.map(({ proceso: i }) => `pet-${i}`)
    const titulo = `Vuelta ${k + 1}.`
    if (v.elegido === null) {
      pasos.push({
        titulo: `${titulo} Nadie más avanza.`,
        texto: `Con \`D = ${fmt(v.antes)}\` ninguno de los que quedan tiene \`Pet ≤ D\`: cada uno pide algo que retiene otro que tampoco puede avanzar.`,
        resaltar: [...revisados, 'd'],
        valores: cuentas(...lineas),
        clases,
      })
      return
    }
    const e = v.elegido
    pasos.push({
      titulo: `${titulo} ¿Quién puede avanzar?`,
      texto: `Se busca, en orden, uno sin marcar con \`Pet ≤ D\`. **${nombre(e)} sí**: \`${fmt(DT.pet[e])} ≤ ${fmt(v.antes)}\`.`,
      resaltar: [...revisados, 'd'],
      valores: cuentas(...lineas),
      clases,
    })
    hechos.push(e)
    marcas[e] = 'marcado'
    const suma = `D = ${fmt(v.antes)} + ${fmt(DT.asig[e])} = ${fmt(v.despues)}`
    pasos.push({
      titulo: `Se marca ${nombre(e)}.`,
      texto: `Se supone que recibe lo que pide, termina y libera todo lo asignado: \`${suma}\`. Después se vuelve a buscar.`,
      resaltar: [`a-${e}`, 'd'],
      valores: { ...vD(v.despues), ...vMarcas(marcas), ...vMarcados(hechos), ...cuentas(suma) },
      clases: { ...conClase(filasDe('pet'), ''), [`a-${e}`]: 'rc-ok' },
    })
  })
  const enDeadlock = lista(DET.deadlock)
  for (const i of DET.deadlock) marcas[i] = 'deadlock'
  const filasDeadlock = DET.deadlock.flatMap((i) => [`a-${i}`, `pet-${i}`])
  pasos.push({
    titulo: 'Los que quedan sin marcar.',
    texto: `${enDeadlock} están en **deadlock**. ${desc} no forma parte del deadlock, pero pide un recurso que retienen ellos: se queda esperando indefinidamente (**inanición**).`,
    resaltar: [...filasDeadlock, 'veredicto'],
    valores: { ...vMarcas(marcas), ...cuentas(), veredicto: `deadlock: ${enDeadlock}` },
    clases: {
      ...conClase([...filasDeadlock, 'veredicto'], 'rc-mal'),
      ...conClase(
        filasDe('pet').filter((el) => !filasDeadlock.includes(el)),
        '',
      ),
    },
    mostrar: ['veredicto'],
  })
  return pasos
}

const deteccion: Recorrido = { ...deteccionLienzo, pasos: pasosDeteccion() }

export const recorridos: Record<string, Recorrido> = {
  banquero,
  'grafo-pedido-a-pedido': grafoPedidos,
  deteccion,
}
