/** Recorridos del tema Sincronización: condición de carrera y productor-consumidor. */
import { cartel, codigo, lugaresCodigo, rect, valor } from '../primitivas-sincronizacion'
import type { Paso, Recorrido } from '../recorrido'
import { grupo, texto } from '../svg'

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

export const recorridos: Record<string, Recorrido> = {
  'condicion-carrera': carrera,
  'productor-consumidor': productorConsumidor,
}
