/** Recorridos del tema Sincronización: carrera, soluciones de software, semáforo y productor-consumidor. */
import { cartel, codigo, lugaresCodigo, rect, valor } from '../primitivas-sincronizacion'
import type { Paso, Recorrido } from '../recorrido'
import { grupo, oculto, texto } from '../svg'

// ── Condición de carrera ──

const P1 = { x: 50, y: 40, w: 170 }
const P2 = { x: 300, y: 40, w: 170 }

const variable = (nombre: string, y: number, nota: string) =>
  valor(`var-${nombre}`, 510, y, 110, 28, nombre === 'a' ? 'a = 0' : `${nombre} = ?`, {
    val: nombre,
  }) + texto(632, y + 14, nota, { clase: 'rs-nota rs-izq' })

const inicioCarrera: Paso = {
  titulo: 'Arranque.',
  texto:
    '`a` es global y vale 0; `c` y `b` son locales de cada proceso. Uno suma 1 y el otro resta 1: tendría que quedar en 0.',
  resaltar: ['var-a'],
  fichas: { p1: 'p1-0', p2: 'p2-0' },
}

const carrera: Recorrido = {
  ancho: 720,
  alto: 225,
  titulo: 'Condición de carrera: dos procesos modifican la variable global a',
  cuerpo: [
    texto(P1.x + P1.w / 2, 20, 'Proceso 1', { clase: 'rs-titulo' }),
    texto(P2.x + P2.w / 2, 20, 'Proceso 2', { clase: 'rs-titulo' }),
    texto(605, 20, 'Variables', { clase: 'rs-titulo' }),
    codigo('p1', P1.x, P1.y, P1.w, ['c = a;', 'c = c + 1;', 'a = c;']),
    codigo('p2', P2.x, P2.y, P2.w, ['b = a;', 'b = b - 1;', 'a = b;']),
    variable('a', 40, 'global'),
    variable('c', 74, 'local de P1'),
    variable('b', 108, 'local de P2'),
    cartel('interrupcion', 260, 158, 330, 30, 'interrupción: el SO le da la CPU a P2'),
    cartel('resultado', 260, 200, 420, 32, ''),
  ],
  fichas: { p1: 'P1', p2: 'P2' },
  lugares: {
    ...lugaresCodigo('p1', P1.x, P1.y, 3),
    ...lugaresCodigo('p2', P2.x, P2.y, 3),
  },
  variantes: [
    {
      nombre: 'Con una interrupción en el medio',
      pasos: [
        inicioCarrera,
        {
          titulo: 'P1 lee a.',
          texto: 'Ejecuta `c = a`: se trae una copia de `a` a su variable local, `c = 0`.',
          resaltar: ['p1-0', 'var-a', 'var-c'],
          valores: { c: 'c = 0' },
        },
        {
          titulo: 'Interrupción.',
          texto:
            'Antes de `c = c + 1` llega una interrupción y el SO le da la CPU a P2. P1 queda a mitad de camino, con su `c = 0` guardado en el contexto.',
          resaltar: ['interrupcion', 'p1-1'],
          fichas: { p1: 'p1-1' },
          clases: { 'p1-1': 'rc-aviso' },
          mostrar: ['interrupcion'],
        },
        {
          titulo: 'P2 lee a.',
          texto: 'Ejecuta `b = a`. `a` **todavía vale 0**, porque P1 no llegó a escribirla.',
          resaltar: ['p2-0', 'var-a', 'var-b'],
          valores: { b: 'b = 0' },
          ocultar: ['interrupcion'],
        },
        {
          titulo: 'P2 resta.',
          texto: '`b = b - 1`: su copia local pasa a `-1`.',
          resaltar: ['p2-1', 'var-b'],
          fichas: { p2: 'p2-1' },
          valores: { b: 'b = -1' },
        },
        {
          titulo: 'P2 escribe a.',
          texto: '`a = b`: ahora `a = -1`. P2 terminó.',
          resaltar: ['p2-2', 'var-a'],
          fichas: { p2: 'p2-2' },
          valores: { a: 'a = -1' },
        },
        {
          titulo: 'Vuelve P1.',
          texto:
            'El SO le devuelve la CPU y P1 sigue donde quedó, con su `c = 0` viejo: `c = c + 1` da `1`. No se entera de que `a` cambió.',
          resaltar: ['p1-1', 'var-c'],
          fichas: { p1: 'p1-1', p2: null },
          clases: { 'p1-1': '' },
          valores: { c: 'c = 1' },
        },
        {
          titulo: 'P1 pisa el valor.',
          texto:
            '`a = c` deja `a = 1`: **se perdió la resta de P2**. Esas tres líneas son una sección crítica y no se pueden intercalar.',
          resaltar: ['p1-2', 'var-a', 'resultado'],
          fichas: { p1: 'p1-2' },
          valores: { a: 'a = 1', resultado: 'a = 1, pero tendría que dar 0' },
          clases: { 'var-a': 'rc-mal', resultado: 'rc-mal' },
          mostrar: ['resultado'],
        },
      ],
    },
    {
      nombre: 'Sin interrupción en el medio',
      pasos: [
        inicioCarrera,
        {
          titulo: 'P1 lee a.',
          texto: '`c = a`: `c = 0`.',
          resaltar: ['p1-0', 'var-a', 'var-c'],
          valores: { c: 'c = 0' },
        },
        {
          titulo: 'P1 suma.',
          texto: '`c = c + 1`: `c = 1`. Esta vez nadie lo interrumpe.',
          resaltar: ['p1-1', 'var-c'],
          fichas: { p1: 'p1-1' },
          valores: { c: 'c = 1' },
        },
        {
          titulo: 'P1 escribe a.',
          texto: '`a = c`: `a = 1`. P1 terminó su sección crítica entera.',
          resaltar: ['p1-2', 'var-a'],
          fichas: { p1: 'p1-2' },
          valores: { a: 'a = 1' },
        },
        {
          titulo: 'P2 lee a.',
          texto: '`b = a` lee el valor que dejó P1: `b = 1`.',
          resaltar: ['p2-0', 'var-a', 'var-b'],
          fichas: { p1: null },
          valores: { b: 'b = 1' },
        },
        {
          titulo: 'P2 resta.',
          texto: '`b = b - 1`: `b = 0`.',
          resaltar: ['p2-1', 'var-b'],
          fichas: { p2: 'p2-1' },
          valores: { b: 'b = 0' },
        },
        {
          titulo: 'P2 escribe a.',
          texto:
            '`a = b`: `a = 0`, el resultado correcto. Si corriera P2 primero también daría 0: el problema es solo intercalar las secciones críticas.',
          resaltar: ['p2-2', 'var-a', 'resultado'],
          fichas: { p2: 'p2-2' },
          valores: { a: 'a = 0', resultado: 'a = 0: el resultado correcto' },
          clases: { 'var-a': 'rc-ok', resultado: 'rc-ok' },
          mostrar: ['resultado'],
        },
      ],
    },
  ],
}

// ── Productor-consumidor ──

const PROD = { x: 30, y: 40, w: 186 }
const CONS = { x: 510, y: 40, w: 196 }
const CODIGO_PRODUCTOR = [
  'x = producir();',
  'wait(lugares);',
  'wait(mutex_buffer);',
  'agregar(buffer, x);',
  'signal(mutex_buffer);',
  'signal(elementos);',
]
const CODIGO_CONSUMIDOR = [
  'wait(elementos);',
  'wait(mutex_buffer);',
  'x = sacar(buffer);',
  'signal(mutex_buffer);',
  'signal(lugares);',
  'consumir(x);',
]
const CASILLAS = [297, 355, 413]

const casilla = (i: number) =>
  grupo(`casilla-${i}`, rect(CASILLAS[i] - 25, 36, 50, 36), { clase: 'rs-casilla' })
const item = (i: number) =>
  grupo(`item-${i}`, `<circle cx="${CASILLAS[i]}" cy="54" r="12"/>` + texto(CASILLAS[i], 54, 'x'), {
    oculto: true,
    clase: 'rs-item',
  })
const semaforo = (nombre: string, y: number, inicial: number) =>
  grupo(
    `sem-${nombre}`,
    rect(240, y, 230, 30) +
      texto(252, y + 15, `${nombre} = ${inicial}`, { clase: 'rs-izq', val: nombre }) +
      texto(460, y + 15, '', { clase: 'rs-cola', val: `cola-${nombre}` }),
    { clase: 'rs-caja' },
  )

const TODO_EL_BUFFER = ['casilla-0', 'casilla-1', 'casilla-2']
const SEMAFOROS = ['sem-lugares', 'sem-elementos', 'sem-mutex_buffer']

const productorConsumidor: Recorrido = {
  ancho: 720,
  alto: 260,
  titulo: 'Productor-consumidor con un buffer de 3 lugares y tres semáforos',
  cuerpo: [
    texto(PROD.x + PROD.w / 2, 20, 'Productor', { clase: 'rs-titulo' }),
    texto(CONS.x + CONS.w / 2, 20, 'Consumidor', { clase: 'rs-titulo' }),
    texto(355, 20, 'buffer (N = 3)', { clase: 'rs-titulo' }),
    codigo('prod', PROD.x, PROD.y, PROD.w, CODIGO_PRODUCTOR),
    codigo('cons', CONS.x, CONS.y, CONS.w, CODIGO_CONSUMIDOR, true),
    ...[0, 1, 2].map(casilla),
    ...[0, 1, 2].map(item),
    semaforo('lugares', 90, 3),
    semaforo('elementos', 128, 0),
    semaforo('mutex_buffer', 166, 1),
    cartel('deadlock', 360, 230, 520, 32, 'deadlock: cada uno espera un signal del otro'),
  ],
  fichas: { p: 'P', c: 'C' },
  lugares: {
    ...lugaresCodigo('prod', PROD.x, PROD.y, CODIGO_PRODUCTOR.length),
    ...lugaresCodigo('cons', CONS.x, CONS.y, CODIGO_CONSUMIDOR.length),
  },
  variantes: [
    {
      nombre: 'Orden correcto',
      pasos: [
        {
          titulo: 'Buffer vacío.',
          texto:
            '`lugares` arranca en N = 3 (lugares libres), `elementos` en 0 (nada para sacar) y `mutex_buffer` en 1.',
          resaltar: [...TODO_EL_BUFFER, ...SEMAFOROS],
          fichas: { p: 'prod-0', c: 'cons-0' },
        },
        {
          titulo: 'El consumidor llega primero.',
          texto:
            '`wait(elementos)` lo deja en `-1`: como quedó negativo, el consumidor **se bloquea** en la cola de `elementos`. No hay nada que sacar.',
          resaltar: ['cons-0', 'sem-elementos'],
          valores: { elementos: 'elementos = -1', 'cola-elementos': 'cola: C' },
          clases: { 'cons-0': 'rc-aviso', 'sem-elementos': 'rc-aviso' },
        },
        {
          titulo: 'El productor produce.',
          texto:
            'Produce `x` fuera de la sección crítica y hace `wait(lugares)`: 3 → 2. Había lugar, así que sigue.',
          resaltar: ['prod-0', 'prod-1', 'sem-lugares'],
          fichas: { p: 'prod-1' },
          valores: { lugares: 'lugares = 2' },
        },
        {
          titulo: 'Agrega al buffer.',
          texto:
            '`wait(mutex_buffer)`: 1 → 0, entra a la sección crítica y deja el elemento en el primer casillero.',
          resaltar: ['prod-2', 'prod-3', 'sem-mutex_buffer', 'casilla-0', 'item-0'],
          fichas: { p: 'prod-3' },
          valores: { mutex_buffer: 'mutex_buffer = 0' },
          mostrar: ['item-0'],
        },
        {
          titulo: 'Avisa.',
          texto:
            '`signal(mutex_buffer)` libera el buffer y `signal(elementos)` pasa de -1 a 0: como había alguien bloqueado, **despierta al consumidor**.',
          resaltar: ['prod-4', 'prod-5', 'sem-mutex_buffer', 'sem-elementos', 'cons-0'],
          fichas: { p: 'prod-5' },
          valores: {
            mutex_buffer: 'mutex_buffer = 1',
            elementos: 'elementos = 0',
            'cola-elementos': '',
          },
          clases: { 'cons-0': '', 'sem-elementos': '' },
        },
        {
          titulo: 'El consumidor saca.',
          texto:
            'Pasa `wait(mutex_buffer)` (1 → 0) y saca el elemento: el buffer vuelve a quedar vacío.',
          resaltar: ['cons-1', 'cons-2', 'sem-mutex_buffer', 'casilla-0'],
          fichas: { c: 'cons-2' },
          valores: { mutex_buffer: 'mutex_buffer = 0' },
          ocultar: ['item-0'],
        },
        {
          titulo: 'Libera y consume.',
          texto:
            '`signal(mutex_buffer)` y `signal(lugares)` (2 → 3): hay un lugar libre más. `consumir(x)` va fuera de la sección crítica.',
          resaltar: ['cons-3', 'cons-4', 'cons-5', 'sem-mutex_buffer', 'sem-lugares'],
          fichas: { c: 'cons-5' },
          valores: { mutex_buffer: 'mutex_buffer = 1', lugares: 'lugares = 3' },
        },
        {
          titulo: 'El productor se adelanta.',
          texto:
            'Mientras el consumidor está en `consumir(x)`, el productor da tres vueltas: cada una baja `lugares` y sube `elementos`. El buffer queda lleno.',
          resaltar: [
            ...TODO_EL_BUFFER,
            'item-0',
            'item-1',
            'item-2',
            'sem-lugares',
            'sem-elementos',
          ],
          fichas: { p: 'prod-5' },
          valores: { lugares: 'lugares = 0', elementos: 'elementos = 3' },
          mostrar: ['item-0', 'item-1', 'item-2'],
        },
        {
          titulo: 'Buffer lleno.',
          texto:
            'En la cuarta vuelta `wait(lugares)` lo deja en `-1` y **el productor se bloquea**. Recién va a seguir cuando el consumidor saque uno y haga `signal(lugares)`.',
          resaltar: ['prod-1', 'sem-lugares', ...TODO_EL_BUFFER, 'item-0', 'item-1', 'item-2'],
          fichas: { p: 'prod-1' },
          valores: { lugares: 'lugares = -1', 'cola-lugares': 'cola: P' },
          clases: { 'prod-1': 'rc-aviso', 'sem-lugares': 'rc-aviso' },
        },
      ],
    },
    {
      nombre: 'Invirtiendo los wait',
      pasos: [
        {
          titulo: 'Los wait al revés.',
          texto:
            'Ahora el consumidor hace `wait(mutex_buffer)` **antes** que `wait(elementos)`. El buffer está vacío.',
          resaltar: ['cons-0', 'cons-1', ...TODO_EL_BUFFER],
          fichas: { p: 'prod-0', c: 'cons-0' },
          valores: { 'cons-0': 'wait(mutex_buffer);', 'cons-1': 'wait(elementos);' },
        },
        {
          titulo: 'El consumidor toma el mutex.',
          texto: '`wait(mutex_buffer)`: 1 → 0. Entra a la sección crítica.',
          resaltar: ['cons-0', 'sem-mutex_buffer'],
          valores: { mutex_buffer: 'mutex_buffer = 0' },
        },
        {
          titulo: 'Se duerme adentro.',
          texto:
            '`wait(elementos)` lo deja en `-1` y se bloquea… **con el mutex tomado**: nadie más puede entrar al buffer.',
          resaltar: ['cons-1', 'sem-elementos', 'sem-mutex_buffer'],
          fichas: { c: 'cons-1' },
          valores: { elementos: 'elementos = -1', 'cola-elementos': 'cola: C' },
          clases: { 'cons-1': 'rc-aviso', 'sem-elementos': 'rc-aviso' },
        },
        {
          titulo: 'El productor produce.',
          texto: '`wait(lugares)`: 3 → 2, hay lugar. Hasta acá todo bien.',
          resaltar: ['prod-0', 'prod-1', 'sem-lugares'],
          fichas: { p: 'prod-1' },
          valores: { lugares: 'lugares = 2' },
        },
        {
          titulo: 'El productor no puede entrar.',
          texto:
            '`wait(mutex_buffer)` lo deja en `-1`: el mutex lo tiene el consumidor dormido, así que el productor también se bloquea.',
          resaltar: ['prod-2', 'sem-mutex_buffer'],
          fichas: { p: 'prod-2' },
          valores: { mutex_buffer: 'mutex_buffer = -1', 'cola-mutex_buffer': 'cola: P' },
          clases: { 'prod-2': 'rc-aviso', 'sem-mutex_buffer': 'rc-aviso' },
        },
        {
          titulo: 'Deadlock.',
          texto:
            'El consumidor espera un `signal(elementos)` que solo puede hacer el productor, y el productor espera el `signal(mutex_buffer)` del consumidor. Por eso **importa el orden de los `wait`**: primero el contador, después el mutex.',
          resaltar: ['prod-2', 'cons-1', 'sem-mutex_buffer', 'sem-elementos', 'deadlock'],
          clases: {
            'prod-2': 'rc-mal',
            'cons-1': 'rc-mal',
            'sem-mutex_buffer': 'rc-mal',
            'sem-elementos': 'rc-mal',
            deadlock: 'rc-mal',
          },
          mostrar: ['deadlock'],
        },
      ],
    },
  ],
}

// ── Intentos de solución por software ──

/** Sangría que el SVG no colapsa. */
const S = '  '
const N_LINEAS = 8
type Codigo = (i: number, j: number) => string[]

const INTENTO_1: Codigo = (i, j) => [
  `while (turno != ${i});`,
  '/* sección crítica */',
  `turno = ${j};`,
  '/* resto del código */',
]
const INTENTO_2: Codigo = (i, j) => [
  `while (adentro[${j}]);`,
  `adentro[${i}] = true;`,
  '/* sección crítica */',
  `adentro[${i}] = false;`,
]
const INTENTO_3: Codigo = (i, j) => [
  `interesado[${i}] = true;`,
  `while (interesado[${j}]);`,
  '/* sección crítica */',
  `interesado[${i}] = false;`,
]
const INTENTO_4: Codigo = (i, j) => [
  `interesado[${i}] = true;`,
  `while (interesado[${j}]) {`,
  `${S}interesado[${i}] = false;`,
  `${S}/* espera un rato */`,
  `${S}interesado[${i}] = true;`,
  '}',
  '/* sección crítica */',
  `interesado[${i}] = false;`,
]
const PETERSON: Codigo = (i, j) => [
  `interesado[${i}] = true;`,
  `turno = ${j};`,
  `while (interesado[${j}] && turno == ${j});`,
  '/* sección crítica */',
  `interesado[${i}] = false;`,
]

const C0 = { x: 30, y: 100, w: 310 }
const C1 = { x: 380, y: 100, w: 310 }
const lineasDe = (c: Codigo, i: number) => {
  const l = c(i, 1 - i)
  return [...l, ...Array<string>(N_LINEAS - l.length).fill('')]
}
const varFlag = (k: number) =>
  oculto(valor(`var-f${k}`, k === 0 ? 95 : 445, 32, 180, 30, '', { val: `f${k}` }))

/** Primer paso de cada pestaña: carga el código y las variables de ese intento. */
function arranque(c: Codigo, flag: string | null, turno: number | null, texto: string): Paso {
  const cod = Object.fromEntries(
    [0, 1].flatMap((i) => lineasDe(c, i).map((l, k) => [`c${i}-${k}`, l])),
  )
  const vars = [...(flag ? ['var-f0', 'var-f1'] : []), ...(turno !== null ? ['var-turno'] : [])]
  return {
    titulo: 'Arranque.',
    texto,
    resaltar: vars,
    fichas: { p0: 'c0-0', p1: 'c1-0' },
    valores: {
      ...cod,
      ...(flag ? { f0: `${flag}[0] = false`, f1: `${flag}[1] = false` } : {}),
      ...(turno !== null ? { turno: `turno = ${turno}` } : {}),
    },
    mostrar: vars,
  }
}

const intentosSoftware: Recorrido = {
  ancho: 720,
  alto: 354,
  titulo: 'Intentos de solución por software para dos procesos, P0 y P1',
  cuerpo: [
    texto(360, 16, 'variables compartidas', { clase: 'rs-nota' }),
    varFlag(0),
    oculto(valor('var-turno', 295, 32, 130, 30, 'turno = 0', { val: 'turno' })),
    varFlag(1),
    texto(C0.x + C0.w / 2, 86, 'P0', { clase: 'rs-titulo' }),
    texto(C1.x + C1.w / 2, 86, 'P1', { clase: 'rs-titulo' }),
    codigo('c0', C0.x, C0.y, C0.w, lineasDe(INTENTO_1, 0), true),
    codigo('c1', C1.x, C1.y, C1.w, lineasDe(INTENTO_1, 1), true),
    cartel('cartel', 360, 330, 560, 32, ''),
  ],
  fichas: { p0: 'P0', p1: 'P1' },
  lugares: {
    ...lugaresCodigo('c0', C0.x, C0.y, N_LINEAS),
    ...lugaresCodigo('c1', C1.x, C1.y, N_LINEAS),
  },
  variantes: [
    {
      nombre: '1. Variable turno',
      pasos: [
        arranque(
          INTENTO_1,
          null,
          0,
          'Una sola variable compartida: `turno = 0`. Cada proceso entra solo cuando `turno` tiene su número.',
        ),
        {
          titulo: 'P0 entra.',
          texto:
            '`turno != 0` es falso: P0 sale del `while` y entra. P1 da vueltas en su `while` (espera activa) porque no es su turno.',
          resaltar: ['c0-0', 'c0-1', 'var-turno', 'c1-0'],
          fichas: { p0: 'c0-1' },
          clases: { 'c1-0': 'rc-aviso' },
        },
        {
          titulo: 'P0 sale.',
          texto: 'Le pasa el turno a P1 con `turno = 1` y sigue con el resto de su código.',
          resaltar: ['c0-2', 'c0-3', 'var-turno'],
          fichas: { p0: 'c0-3' },
          valores: { turno: 'turno = 1' },
        },
        {
          titulo: 'P1 entra.',
          texto: 'Ahora `turno != 1` es falso: P1 sale del `while` y entra a la sección crítica.',
          resaltar: ['c1-0', 'c1-1', 'var-turno'],
          fichas: { p1: 'c1-1' },
          clases: { 'c1-0': '' },
        },
        {
          titulo: 'P1 sale.',
          texto: '`turno = 0`: le devuelve el turno a P0 y sigue con su resto.',
          resaltar: ['c1-2', 'c1-3', 'var-turno'],
          fichas: { p1: 'c1-3' },
          valores: { turno: 'turno = 0' },
        },
        {
          titulo: 'P1 quiere entrar otra vez.',
          texto:
            'Vuelve al `while (turno != 1)` y, como `turno = 0`, espera. Pero P0 sigue en su resto y **no tiene intención de entrar**.',
          resaltar: ['c1-0', 'var-turno', 'c0-3'],
          fichas: { p1: 'c1-0' },
          clases: { 'c1-0': 'rc-aviso' },
        },
        {
          titulo: 'Sin progreso.',
          texto:
            'La sección crítica está libre y P1 no puede usarla hasta que P0 pase por ella: **alternancia estricta**. Hay mutua exclusión, pero no hay progreso.',
          resaltar: ['c1-0', 'c0-3', 'cartel'],
          valores: { cartel: 'SC libre y P1 esperando: no hay progreso' },
          clases: { 'c1-0': 'rc-mal', cartel: 'rc-mal' },
          mostrar: ['cartel'],
        },
      ],
    },
    {
      nombre: '2. Flags "estoy adentro"',
      pasos: [
        arranque(
          INTENTO_2,
          'adentro',
          null,
          'Un flag por proceso, los dos en false. Cada uno mira el flag del otro y **después** levanta el suyo.',
        ),
        {
          titulo: 'P0 mira.',
          texto: '`while (adentro[1])`: el flag de P1 está en false, así que P0 sale del bucle.',
          resaltar: ['c0-0', 'var-f1'],
          fichas: { p0: 'c0-1' },
        },
        {
          titulo: 'Interrupción.',
          texto:
            'Justo antes de `adentro[0] = true`, el SO le da la CPU a P1. El flag de P0 **todavía está en false**.',
          resaltar: ['c0-1', 'var-f0', 'cartel'],
          valores: { cartel: 'interrupción: el SO le da la CPU a P1' },
          clases: { 'c0-1': 'rc-aviso', cartel: 'rc-aviso' },
          mostrar: ['cartel'],
        },
        {
          titulo: 'P1 mira.',
          texto:
            '`while (adentro[0])`: ve false, porque P0 no llegó a levantarlo, y sale del bucle.',
          resaltar: ['c1-0', 'var-f0'],
          fichas: { p1: 'c1-1' },
          ocultar: ['cartel'],
        },
        {
          titulo: 'P1 entra.',
          texto: '`adentro[1] = true` y entra a la sección crítica.',
          resaltar: ['c1-1', 'c1-2', 'var-f1'],
          fichas: { p1: 'c1-2' },
          valores: { f1: 'adentro[1] = true' },
        },
        {
          titulo: 'Vuelve P0.',
          texto:
            'Sigue donde quedó: ya pasó el `while`, así que no vuelve a mirar. Levanta su flag y entra.',
          resaltar: ['c0-1', 'c0-2', 'var-f0'],
          fichas: { p0: 'c0-2' },
          valores: { f0: 'adentro[0] = true' },
          clases: { 'c0-1': '' },
        },
        {
          titulo: 'Los dos adentro.',
          texto:
            '**No hay mutua exclusión**: mirar el flag y levantarlo son dos pasos separados, y una interrupción puede caer en el medio.',
          resaltar: ['c0-2', 'c1-2', 'cartel'],
          valores: { cartel: 'P0 y P1 en la sección crítica a la vez' },
          clases: { 'c0-2': 'rc-mal', 'c1-2': 'rc-mal', cartel: 'rc-mal' },
          mostrar: ['cartel'],
        },
      ],
    },
    {
      nombre: '3. Primero me declaro interesado',
      pasos: [
        arranque(
          INTENTO_3,
          'interesado',
          null,
          'Se invierte el orden: cada proceso **primero** levanta su flag y después espera a que el otro baje el suyo.',
        ),
        {
          titulo: 'P0 se declara interesado.',
          texto: '`interesado[0] = true`.',
          resaltar: ['c0-0', 'var-f0'],
          fichas: { p0: 'c0-1' },
          valores: { f0: 'interesado[0] = true' },
        },
        {
          titulo: 'Interrupción.',
          texto: 'Antes de que P0 llegue a mirar el flag del otro, el SO le da la CPU a P1.',
          resaltar: ['c0-1', 'cartel'],
          valores: { cartel: 'interrupción: el SO le da la CPU a P1' },
          clases: { cartel: 'rc-aviso' },
          mostrar: ['cartel'],
        },
        {
          titulo: 'P1 se declara interesado.',
          texto:
            '`interesado[1] = true` y va al `while (interesado[0])`: está en true, así que P1 espera.',
          resaltar: ['c1-0', 'c1-1', 'var-f0', 'var-f1'],
          fichas: { p1: 'c1-1' },
          valores: { f1: 'interesado[1] = true' },
          clases: { 'c1-1': 'rc-aviso' },
          ocultar: ['cartel'],
        },
        {
          titulo: 'Vuelve P0.',
          texto: '`while (interesado[1])` también da true: P0 también se queda esperando.',
          resaltar: ['c0-1', 'var-f1'],
          clases: { 'c0-1': 'rc-aviso' },
        },
        {
          titulo: 'Deadlock.',
          texto:
            'Cada uno espera que el otro baje su flag, y el flag se baja recién al salir de la sección crítica, a la que ninguno llega. Hay mutua exclusión, pero hay **deadlock**.',
          resaltar: ['c0-1', 'c1-1', 'var-f0', 'var-f1', 'cartel'],
          valores: { cartel: 'los dos esperan para siempre: deadlock' },
          clases: {
            'c0-1': 'rc-mal',
            'c1-1': 'rc-mal',
            'var-f0': 'rc-mal',
            'var-f1': 'rc-mal',
            cartel: 'rc-mal',
          },
          mostrar: ['cartel'],
        },
      ],
    },
    {
      nombre: '4. Ceder si hay conflicto',
      pasos: [
        arranque(
          INTENTO_4,
          'interesado',
          null,
          'Como el 3, pero si el otro también está interesado, se baja el flag, se espera un rato y se reintenta.',
        ),
        {
          titulo: 'Los dos se declaran interesados.',
          texto:
            'Corren a la par (en dos CPUs, o con cambios de contexto justo en esos puntos): `interesado[0] = true` e `interesado[1] = true`.',
          resaltar: ['c0-0', 'c1-0', 'var-f0', 'var-f1'],
          fichas: { p0: 'c0-1', p1: 'c1-1' },
          valores: { f0: 'interesado[0] = true', f1: 'interesado[1] = true' },
        },
        {
          titulo: 'Los dos ven conflicto.',
          texto: 'Cada uno mira el flag del otro, lo ve en true y entra al cuerpo del `while`.',
          resaltar: ['c0-1', 'c1-1', 'var-f0', 'var-f1'],
          fichas: { p0: 'c0-2', p1: 'c1-2' },
        },
        {
          titulo: 'Los dos ceden.',
          texto: 'Bajan su flag para dejar pasar al otro y esperan un rato.',
          resaltar: ['c0-2', 'c0-3', 'c1-2', 'c1-3', 'var-f0', 'var-f1'],
          fichas: { p0: 'c0-3', p1: 'c1-3' },
          valores: { f0: 'interesado[0] = false', f1: 'interesado[1] = false' },
        },
        {
          titulo: 'Los dos reintentan.',
          texto:
            'Pasado el mismo rato, levantan el flag otra vez **al mismo tiempo** y vuelven a mirar la condición del `while`.',
          resaltar: ['c0-4', 'c1-4', 'c0-1', 'c1-1', 'var-f0', 'var-f1'],
          fichas: { p0: 'c0-1', p1: 'c1-1' },
          valores: { f0: 'interesado[0] = true', f1: 'interesado[1] = true' },
        },
        {
          titulo: 'Y otra vez.',
          texto:
            'Ven el flag del otro en true, vuelven a ceder, y así. Los dos **cambian de estado todo el tiempo**, pero ninguno llega a la sección crítica.',
          resaltar: ['c0-1', 'c0-2', 'c0-3', 'c0-4', 'c1-1', 'c1-2', 'c1-3', 'c1-4'],
          clases: Object.fromEntries(
            [1, 2, 3, 4].flatMap((k) => [
              [`c0-${k}`, 'rc-aviso'],
              [`c1-${k}`, 'rc-aviso'],
            ]),
          ),
        },
        {
          titulo: 'Livelock.',
          texto:
            'No es deadlock, porque no están trabados: se mueven. Es **livelock**, como dos personas que se corren para el mismo lado en un pasillo. Si las demoras no coinciden se destraba, pero nada lo garantiza.',
          resaltar: ['c0-6', 'c1-6', 'cartel'],
          valores: { cartel: 'se mueven y ninguno entra: livelock' },
          clases: {
            ...Object.fromEntries(
              [1, 2, 3, 4].flatMap((k) => [
                [`c0-${k}`, ''],
                [`c1-${k}`, ''],
              ]),
            ),
            'c0-6': 'rc-mal',
            'c1-6': 'rc-mal',
            cartel: 'rc-mal',
          },
          mostrar: ['cartel'],
        },
      ],
    },
    {
      nombre: 'Peterson',
      pasos: [
        arranque(
          PETERSON,
          'interesado',
          0,
          'Los flags de interés del intento 3 más una variable `turno` que desempata. Se prueba con la misma intercalación que rompía a los otros.',
        ),
        {
          titulo: 'P0 se declara y cede.',
          texto:
            '`interesado[0] = true` y `turno = 1`: por si P1 también quiere entrar, le deja la prioridad.',
          resaltar: ['c0-0', 'c0-1', 'var-f0', 'var-turno'],
          fichas: { p0: 'c0-2' },
          valores: { f0: 'interesado[0] = true', turno: 'turno = 1' },
        },
        {
          titulo: 'Interrupción.',
          texto: 'Antes del `while` de P0, el SO le da la CPU a P1.',
          resaltar: ['c0-2', 'cartel'],
          valores: { cartel: 'interrupción: el SO le da la CPU a P1' },
          clases: { cartel: 'rc-aviso' },
          mostrar: ['cartel'],
        },
        {
          titulo: 'P1 hace lo mismo.',
          texto:
            '`interesado[1] = true` y `turno = 0`. Como los dos escribieron `turno`, **el último que lo escribió es el que espera**.',
          resaltar: ['c1-0', 'c1-1', 'var-f1', 'var-turno'],
          fichas: { p1: 'c1-2' },
          valores: { f1: 'interesado[1] = true', turno: 'turno = 0' },
          ocultar: ['cartel'],
        },
        {
          titulo: 'P1 espera.',
          texto:
            '`interesado[0] && turno == 0` es verdadero: P1 da vueltas en el `while` (espera activa).',
          resaltar: ['c1-2', 'var-f0', 'var-turno'],
          clases: { 'c1-2': 'rc-aviso' },
        },
        {
          titulo: 'Vuelve P0 y entra.',
          texto:
            '`interesado[1] && turno == 1` es falso, porque `turno` vale 0: P0 entra y P1 sigue afuera. **Hay mutua exclusión.**',
          resaltar: ['c0-2', 'c0-3', 'var-turno'],
          fichas: { p0: 'c0-3' },
          clases: { 'c0-3': 'rc-ok' },
        },
        {
          titulo: 'P0 sale y entra P1.',
          texto:
            '`interesado[0] = false` hace falsa la condición de P1, que entra. Sin deadlock y con progreso; lo que queda es la **espera activa**.',
          resaltar: ['c0-4', 'c1-3', 'var-f0', 'cartel'],
          fichas: { p0: 'c0-4', p1: 'c1-3' },
          valores: {
            f0: 'interesado[0] = false',
            cartel: 'funciona: mutua exclusión, progreso, sin deadlock',
          },
          clases: { 'c0-3': '', 'c1-2': '', 'c1-3': 'rc-ok', cartel: 'rc-ok' },
          mostrar: ['cartel'],
        },
      ],
    },
  ],
}

// ── Semáforo por dentro ──

const CODIGO_SEMAFORO = [
  'wait(s) {',
  `${S}s.valor--;`,
  `${S}if (s.valor < 0) bloquear(…);`,
  '}',
  'signal(s) {',
  `${S}s.valor++;`,
  `${S}if (s.valor <= 0) desbloquear(…);`,
  '}',
]
const SEM = { x: 30, y: 40, w: 280 }
const zona = (el: string, x: number, titulo: string) =>
  grupo(el, rect(x, 180, 170, 56) + texto(x + 85, 194, titulo, { clase: 'rs-nota' }), {
    clase: 'rs-caja',
  })
const nota = (t: string) => ({ 'nota-valor': t })

const semaforoPorDentro: Recorrido = {
  ancho: 720,
  alto: 290,
  titulo: 'Un semáforo por dentro: su valor y su cola de bloqueados con tres procesos',
  cuerpo: [
    texto(SEM.x + SEM.w / 2, 20, 'wait y signal', { clase: 'rs-titulo' }),
    codigo('sem', SEM.x, SEM.y, SEM.w, CODIGO_SEMAFORO),
    `<rect class="rd-marco" x="340" y="30" width="360" height="126" rx="10"/>`,
    texto(520, 46, 'semáforo s (mutex)', { clase: 'rs-titulo' }),
    valor('sem-valor', 356, 66, 150, 36, 's.valor = 1', { val: 'valor' }),
    texto(431, 126, '1: una instancia libre', { clase: 'rs-nota', val: 'nota-valor' }),
    grupo(
      'sem-cola',
      texto(605, 76, 'bloqueados (FIFO)', { clase: 'rs-nota' }) +
        rect(545, 92, 50, 36) +
        rect(615, 92, 50, 36),
      { clase: 'rs-caja' },
    ),
    zona('sc', 340, 'sección crítica'),
    zona('afuera', 530, 'fuera de la SC'),
    cartel('cartel', 360, 268, 460, 30, ''),
  ],
  fichas: { p1: 'P1', p2: 'P2', p3: 'P3' },
  lugares: {
    'cola-0': { x: 570, y: 110 },
    'cola-1': { x: 640, y: 110 },
    sc: { x: 425, y: 218 },
    'afuera-1': { x: 575, y: 218 },
    'afuera-2': { x: 615, y: 218 },
    'afuera-3': { x: 655, y: 218 },
  },
  pasos: [
    {
      titulo: 'Arranque.',
      texto:
        'Un semáforo es un **contador** y una **cola de bloqueados**. Como mutex arranca en 1: una instancia libre. Los tres procesos quieren entrar a la sección crítica.',
      resaltar: ['sem-valor', 'sem-cola'],
      fichas: { p1: 'afuera-1', p2: 'afuera-2', p3: 'afuera-3' },
    },
    {
      titulo: 'P1 hace wait.',
      texto:
        '`s.valor--` lo deja en 0. Como **no es negativo**, P1 no se bloquea y entra a la sección crítica.',
      resaltar: ['sem-0', 'sem-1', 'sem-2', 'sem-valor', 'sc'],
      fichas: { p1: 'sc' },
      valores: { valor: 's.valor = 0', ...nota('0: nada libre y nadie espera') },
    },
    {
      titulo: 'P2 hace wait.',
      texto:
        '`s.valor` pasa a −1. Ahora sí es negativo: P2 **se bloquea** y va a la cola del semáforo. No gasta CPU esperando.',
      resaltar: ['sem-1', 'sem-2', 'sem-valor', 'sem-cola'],
      fichas: { p2: 'cola-0' },
      valores: { valor: 's.valor = −1', ...nota('|−1| = 1 bloqueado') },
      clases: { 'sem-cola': 'rc-aviso' },
    },
    {
      titulo: 'P3 hace wait.',
      texto:
        '`s.valor` baja a −2 y P3 se encola detrás de P2. El valor negativo, en absoluto, es la **cantidad de bloqueados**.',
      resaltar: ['sem-1', 'sem-2', 'sem-valor', 'sem-cola'],
      fichas: { p3: 'cola-1' },
      valores: { valor: 's.valor = −2', ...nota('|−2| = 2 bloqueados') },
    },
    {
      titulo: 'P1 hace signal.',
      texto:
        '`s.valor++` da −1, que es `<= 0`: había alguien esperando, así que despierta **al primero de la cola** (FIFO), P2, que pasa a listo y entra. `signal` nunca bloquea.',
      resaltar: ['sem-5', 'sem-6', 'sem-valor', 'sem-cola', 'sc'],
      fichas: { p1: 'afuera-1', p2: 'sc', p3: 'cola-0' },
      valores: { valor: 's.valor = −1', ...nota('|−1| = 1 bloqueado') },
    },
    {
      titulo: 'P2 hace signal.',
      texto: '`s.valor` pasa a 0, todavía `<= 0`: despierta a P3, el único que quedaba en la cola.',
      resaltar: ['sem-5', 'sem-6', 'sem-valor', 'sem-cola', 'sc'],
      fichas: { p2: 'afuera-2', p3: 'sc' },
      valores: { valor: 's.valor = 0', ...nota('0: nada libre y nadie espera') },
      clases: { 'sem-cola': '' },
    },
    {
      titulo: 'P3 hace signal.',
      texto:
        '`s.valor` vuelve a 1. Como es positivo, no hay nadie a quien despertar: queda una instancia libre, igual que al principio.',
      resaltar: ['sem-5', 'sem-6', 'sem-valor', 'cartel'],
      fichas: { p3: 'afuera-3' },
      valores: {
        valor: 's.valor = 1',
        ...nota('1: una instancia libre'),
        cartel: 'tres wait y tres signal: vuelve a 1',
      },
      clases: { 'sem-valor': 'rc-ok', cartel: 'rc-ok' },
      mostrar: ['cartel'],
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'condicion-carrera': carrera,
  'intentos-software': intentosSoftware,
  'semaforo-por-dentro': semaforoPorDentro,
  'productor-consumidor': productorConsumidor,
}
