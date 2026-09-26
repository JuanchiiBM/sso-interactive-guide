/** Recorridos del tema Sistemas operativos. */
import { arista, nodo } from '../primitivas-procesos'
import { cruce, recuadroTitulado } from '../primitivas-so'
import type { Paso, Recorrido } from '../recorrido'
import { caja, grupo, texto } from '../svg'

// posición de cada caja: [x, y, ancho, alto]
const C = {
  programa: [100, 95, 160, 46],
  wrapper: [310, 95, 150, 46],
  otro: [650, 105, 120, 46],
  tabla: [310, 230, 150, 46],
  rutina: [500, 230, 150, 46],
  planificador: [650, 230, 120, 46],
  blocked: [500, 305, 120, 36],
  ready: [310, 305, 120, 36],
} as const
type Lugar = keyof typeof C

const cajaSyscall = (k: Lugar, t: string, clase = '', oculto = false) => {
  const [x, y, w, h] = C[k]
  const html = caja(x, y, w, h, t, clase, k)
  // `caja` no sabe de ocultos: se agrega la marca justo después del data-el
  return oculto ? html.replace(`data-el="${k}"`, `data-el="${k}" data-rc-oculto`) : html
}
// la ficha va en la esquina superior derecha de cada caja
const lugares = Object.fromEntries(
  Object.entries(C).map(([k, [x, y, w, h]]) => [k, { x: x + w / 2 - 4, y: y - h / 2 + 2 }]),
)

const comunes: Paso[] = [
  {
    titulo: 'En modo usuario.',
    texto: 'P1 ejecuta su propio código. El bit de modo del PSW dice **usuario**.',
    resaltar: ['programa', 'psw'],
    fichas: { p1: 'programa' },
  },
  {
    titulo: 'Llama al wrapper.',
    texto:
      'Llama a `read()` de la biblioteca de C. Es una función común: sigue en modo usuario y solo prepara los parámetros.',
    resaltar: ['programa', 'f-llama', 'wrapper', 'psw'],
    fichas: { p1: 'wrapper' },
  },
  {
    titulo: 'Syscall (trap).',
    texto:
      'El wrapper ejecuta la instrucción de syscall: se guarda el contexto y el PSW pasa a **modo kernel**. El cruce lo hace la syscall, no el wrapper.',
    resaltar: ['wrapper', 'f-trap', 'tabla', 'psw'],
    fichas: { p1: 'tabla' },
    valores: { modo: 'PSW · modo kernel' },
  },
  {
    titulo: 'Tabla de syscalls.',
    texto:
      'El kernel usa el número de syscall para buscar en la tabla la rutina que corresponde, y la ejecuta.',
    resaltar: ['tabla', 'f-busca', 'rutina'],
    fichas: { p1: 'rutina' },
  },
]

const syscall: Recorrido = {
  ancho: 720,
  alto: 340,
  titulo: 'Recorrido de una syscall read(), de modo usuario a kernel y de vuelta',
  cuerpo: [
    `<text class="dg-zona" x="14" y="20">Modo usuario</text>`,
    `<line class="dg-separador" x1="0" y1="165" x2="720" y2="165"/>`,
    `<text class="dg-zona" x="14" y="185">Modo kernel</text>`,
    `<g class="rp-indicador" data-el="psw"><rect x="380" y="16" width="190" height="28" rx="8"/>` +
      texto(475, 30, 'PSW · modo usuario', { val: 'modo' }) +
      `</g>`,
    arista('M180,85 L231,85', { el: 'f-llama', punta: true, etiqueta: 'llama', lx: 207, ly: 68 }),
    arista('M235,106 L184,106', {
      el: 'f-ret',
      punta: true,
      oculto: true,
      etiqueta: 'resultado',
      lx: 207,
      ly: 128,
    }),
    arista('M310,118 L310,203', {
      el: 'f-trap',
      punta: true,
      etiqueta: 'syscall (trap)',
      lx: 364,
      ly: 142,
    }),
    arista('M385,230 L421,230', { el: 'f-busca', punta: true }),
    arista('M500,207 Q500,95 389,95', {
      el: 'f-vuelve',
      punta: true,
      oculto: true,
      etiqueta: 'vuelve a usuario',
      lx: 548,
      ly: 150,
    }),
    arista('M500,253 L500,283', {
      el: 'f-bloquea',
      punta: true,
      oculto: true,
      etiqueta: 'espera la E/S',
      lx: 570,
      ly: 268,
    }),
    arista('M650,207 L650,132', {
      el: 'f-dispatch',
      punta: true,
      oculto: true,
      etiqueta: 'dispatch',
      lx: 612,
      ly: 170,
    }),
    arista('M440,305 L374,305', {
      el: 'f-io',
      punta: true,
      oculto: true,
      etiqueta: 'fin de E/S',
      lx: 407,
      ly: 334,
    }),
    cajaSyscall('programa', 'Programa\nx = read(fd, …)', 'dg-activo'),
    cajaSyscall('wrapper', 'read() de libc\n(wrapper)', 'dg-activo'),
    cajaSyscall('otro', 'Otro\nproceso', 'dg-activo', true),
    cajaSyscall('tabla', 'Tabla de\nsyscalls', 'dg-neutro'),
    cajaSyscall('rutina', 'sys_read()\ndel kernel', 'dg-neutro'),
    cajaSyscall('planificador', 'Planificador', 'dg-neutro', true),
    cajaSyscall('blocked', 'Blocked', 'dg-bloqueado', true),
    cajaSyscall('ready', 'Ready', 'dg-listo', true),
  ],
  fichas: { p1: 'P1', p2: 'P2' },
  lugares,
  variantes: [
    {
      nombre: 'No bloqueante',
      pasos: [
        ...comunes,
        {
          titulo: 'Vuelve con el resultado.',
          texto:
            'Como no bloquea, la rutina termina enseguida (con los datos o un "reintentar"). El PSW vuelve a **usuario** y el wrapper le devuelve el resultado a P1, que sigue.',
          resaltar: ['rutina', 'f-vuelve', 'wrapper', 'f-ret', 'programa', 'psw'],
          mostrar: ['f-vuelve', 'f-ret'],
          fichas: { p1: 'programa' },
          valores: { modo: 'PSW · modo usuario' },
        },
      ],
    },
    {
      nombre: 'Bloqueante',
      pasos: [
        ...comunes,
        {
          titulo: 'P1 se bloquea.',
          texto:
            'Los datos no están: el kernel le pide la lectura al disco y pasa a P1 a **Blocked**. No tiene sentido que siga ocupando la CPU.',
          resaltar: ['rutina', 'f-bloquea', 'blocked'],
          mostrar: ['f-bloquea', 'blocked'],
          fichas: { p1: 'blocked' },
        },
        {
          titulo: 'El planificador elige otro.',
          texto:
            'El planificador le da la CPU a otro proceso listo: se carga su contexto y se vuelve a modo usuario, pero ahora ejecuta P2.',
          resaltar: ['planificador', 'f-dispatch', 'otro', 'psw'],
          mostrar: ['planificador', 'f-dispatch', 'otro'],
          fichas: { p2: 'otro' },
          valores: { modo: 'PSW · modo usuario' },
        },
        {
          titulo: 'Termina la E/S.',
          texto:
            'Una interrupción avisa al SO: los datos quedan en el buffer de P1 y P1 pasa a **Ready**. Vuelve a modo usuario recién cuando lo elijan.',
          resaltar: ['blocked', 'f-io', 'ready'],
          mostrar: ['f-io', 'ready'],
          fichas: { p1: 'ready' },
        },
      ],
    },
  ],
}

// arquitecturas de kernel: tres columnas; cada pestaña recorre la suya y las otras quedan tenues
// posición de cada caja: [x, y, ancho, alto]
const K = {
  'm-app': [177, 90, 150, 44],
  'm-sys': [128, 215, 78, 32],
  'm-proc': [226, 215, 78, 32],
  'm-fs': [128, 285, 78, 32],
  'm-mem': [226, 285, 78, 32],
  'm-drv': [128, 355, 78, 32],
  'm-red': [226, 355, 78, 32],
  'c-app': [392, 90, 150, 44],
  'c-sys': [392, 190, 150, 34],
  'c-fs': [392, 242, 150, 34],
  'c-es': [392, 294, 150, 34],
  'c-drv': [392, 346, 150, 34],
  'k-app': [552, 90, 92, 44],
  'k-fs': [660, 90, 96, 44],
  'k-micro': [607, 250, 190, 56],
} as const
type ClaveK = keyof typeof K

const modulo = (k: ClaveK, t: string, clase: string) => {
  const [x, y, w, h] = K[k]
  return caja(x, y, w, h, t, clase, k)
}
const proceso = (k: ClaveK, nombre: string, linea: string, clase = '') => {
  const [x, y, w, h] = K[k]
  return nodo(x, y, w, h, nombre, linea, { el: k, clase })
}
const contador = (x: number, col: string, n: number) =>
  grupo(
    `${col}-cuenta`,
    texto(x, 425, `cambios de modo: ${n}`, { clase: 't3s-contador', val: `${col}-modos` }),
  )
const modos = (col: string, n: number) => ({ [`${col}-modos`]: `cambios de modo: ${n}` })

// resalta la columna activa (su contador incluido) para que las otras dos queden tenues
const paso = (col: string, p: Paso): Paso => ({
  ...p,
  resaltar: [...(p.resaltar ?? []), `${col}-cuenta`],
})

const pideLeer = (col: string, texto: string): Paso =>
  paso(col, {
    titulo: 'La app pide leer.',
    texto,
    resaltar: [`${col}-app`],
    fichas: { r: `${col}-app` },
    valores: modos(col, 0),
  })

const arquitecturasKernel: Recorrido = {
  ancho: 720,
  alto: 445,
  titulo:
    'Un mismo read() en un kernel monolítico, uno en capas y un microkernel, contando los cambios de modo',
  cuerpo: [
    `<text class="dg-zona" x="8" y="82">Modo</text>`,
    `<text class="dg-zona" x="8" y="97">usuario</text>`,
    `<line class="dg-separador" x1="0" y1="150" x2="720" y2="150"/>`,
    `<text class="dg-zona" x="8" y="172">Modo</text>`,
    `<text class="dg-zona" x="8" y="187">kernel</text>`,
    `<line class="t3s-divisor" x1="284" y1="10" x2="284" y2="440"/>`,
    `<line class="t3s-divisor" x1="499" y1="10" x2="499" y2="440"/>`,
    texto(177, 24, 'Monolítico', { clase: 't3s-col' }),
    texto(392, 24, 'En capas', { clase: 't3s-col' }),
    texto(607, 24, 'Microkernel', { clase: 't3s-col' }),
    // monolítico: un solo bloque en modo kernel donde cualquiera llama a cualquiera
    recuadroTitulado(82, 180, 190, 214, 'un solo bloque', {
      clase: 't3s-kernel',
      el: 'm-bloque',
      lx: 172,
    }),
    grupo(
      'm-malla',
      [
        'M167,215 L187,215',
        'M167,285 L187,285',
        'M167,355 L187,355',
        'M226,231 L226,269',
        'M226,301 L226,339',
        'M167,225 L187,275',
        'M167,275 L187,225',
        'M167,295 L187,345',
        'M167,345 L187,295',
      ]
        .map((d) => `<path d="${d}"/>`)
        .join(''),
      { clase: 't3s-malla' },
    ),
    cruce('m-trap', 'M128,112 L128,195', { trap: [128, 150] }),
    cruce('m-vuelta', 'M150,199 L205,116'),
    cruce('m-f1', 'M128,231 L128,265'),
    cruce('m-f2', 'M128,301 L128,335'),
    proceso('m-app', 'Aplicación', 'read(fd, buf, n)'),
    modulo('m-sys', 'Syscalls', 't3s-modulo'),
    modulo('m-proc', 'Procesos', 't3s-modulo'),
    modulo('m-fs', 'Archivos', 't3s-modulo'),
    modulo('m-mem', 'Memoria', 't3s-modulo'),
    modulo('m-drv', 'Drivers', 't3s-modulo'),
    modulo('m-red', 'Red', 't3s-modulo'),
    contador(177, 'm', 2),
    // en capas: cada capa usa solo a la de abajo
    cruce('c-trap', 'M372,112 L372,169', { trap: [372, 150] }),
    cruce('c-vuelta', 'M412,173 L412,116'),
    cruce('c-b1', 'M372,207 L372,221'),
    cruce('c-b2', 'M372,259 L372,273'),
    cruce('c-b3', 'M372,311 L372,325'),
    cruce('c-s1', 'M412,225 L412,211'),
    cruce('c-s2', 'M412,277 L412,263'),
    cruce('c-s3', 'M412,329 L412,315'),
    proceso('c-app', 'Aplicación', 'read(fd, buf, n)'),
    modulo('c-sys', 'Syscalls', 't3s-capa'),
    modulo('c-fs', 'Archivos', 't3s-capa'),
    modulo('c-es', 'E/S', 't3s-capa'),
    modulo('c-drv', 'Drivers', 't3s-capa'),
    contador(392, 'c', 2),
    // microkernel: el servidor de archivos es un proceso más; todo pasa por mensajes
    cruce('k-1', 'M530,112 L530,218', { trap: [530, 150], etiqueta: '1', lx: 530, ly: 196 }),
    cruce('k-2', 'M630,222 L630,116', { etiqueta: '2', lx: 630, ly: 196 }),
    cruce('k-3', 'M690,112 L690,218', { trap: [690, 150], etiqueta: '3', lx: 690, ly: 196 }),
    cruce('k-4', 'M575,222 L575,116', { etiqueta: '4', lx: 575, ly: 196 }),
    proceso('k-app', 'App', 'read()'),
    proceso('k-fs', 'Servidor', 'de archivos', 't3s-servicio'),
    proceso('k-micro', 'Microkernel', 'mensajes, planif., E/S básica', 't3s-kernel'),
    texto(607, 300, 'en modo kernel, solo lo mínimo', { clase: 't3s-nota-c' }),
    contador(607, 'k', 4),
  ],
  fichas: { r: 'R' },
  // la ficha va en la esquina superior derecha de cada caja
  lugares: Object.fromEntries(
    Object.entries(K).map(([k, [x, y, w, h]]) => [k, { x: x + w / 2 - 4, y: y - h / 2 + 2 }]),
  ),
  variantes: [
    {
      nombre: 'Monolítico',
      pasos: [
        pideLeer(
          'm',
          'La ficha **R** es el pedido: la aplicación llama a `read()` en modo usuario. Todavía no hubo ningún cambio de modo.',
        ),
        paso('m', {
          titulo: 'Trap al kernel.',
          texto:
            'La syscall pasa a **modo kernel** (1.er cambio) y entra al único bloque del SO por la parte de syscalls.',
          resaltar: ['m-trap', 'm-sys', 'm-bloque'],
          fichas: { r: 'm-sys' },
          valores: modos('m', 1),
        }),
        paso('m', {
          titulo: 'Llamada directa.',
          texto:
            'Syscalls llama a la parte de archivos como a cualquier función: están en el mismo bloque, así que no hay mensajes ni cambios de modo.',
          resaltar: ['m-sys', 'm-f1', 'm-fs', 'm-malla', 'm-bloque'],
          fichas: { r: 'm-fs' },
        }),
        paso('m', {
          titulo: 'Directo al driver.',
          texto:
            'Archivos le pide los bloques al driver de disco, también con una llamada común. Cualquier parte puede llamar a cualquier otra.',
          resaltar: ['m-fs', 'm-f2', 'm-drv', 'm-malla', 'm-bloque'],
          fichas: { r: 'm-drv' },
        }),
        paso('m', {
          titulo: 'Vuelve con los datos.',
          texto:
            'Con los datos leídos, el SO vuelve a **modo usuario** (2.º cambio). Solo dos cambios y casi sin overhead: por eso es tan eficiente.',
          resaltar: ['m-vuelta', 'm-app'],
          fichas: { r: 'm-app' },
          valores: modos('m', 2),
        }),
      ],
    },
    {
      nombre: 'En capas',
      pasos: [
        pideLeer(
          'c',
          'El mismo pedido: la aplicación llama a `read()` en modo usuario, con cero cambios de modo.',
        ),
        paso('c', {
          titulo: 'Trap a la capa de arriba.',
          texto:
            'La syscall pasa a **modo kernel** (1.er cambio) y entra por la capa de syscalls, la única que ve la aplicación.',
          resaltar: ['c-trap', 'c-sys'],
          fichas: { r: 'c-sys' },
          valores: modos('c', 1),
        }),
        paso('c', {
          titulo: 'Baja a archivos.',
          texto:
            'Cada capa usa solo a la de abajo, por su interfaz: syscalls no puede saltar directo al driver.',
          resaltar: ['c-sys', 'c-b1', 'c-fs'],
          fichas: { r: 'c-fs' },
        }),
        paso('c', {
          titulo: 'Baja a E/S.',
          texto: 'Archivos traduce el pedido a bloques del disco y se lo pasa a la capa de E/S.',
          resaltar: ['c-fs', 'c-b2', 'c-es'],
          fichas: { r: 'c-es' },
        }),
        paso('c', {
          titulo: 'Llega al driver.',
          texto:
            'El driver habla con el disco. Todo pasó en modo kernel: se atravesaron más capas, pero sin cambios de modo extra.',
          resaltar: ['c-es', 'c-b3', 'c-drv'],
          fichas: { r: 'c-drv' },
        }),
        paso('c', {
          titulo: 'Sube capa por capa.',
          texto:
            'La respuesta vuelve por el mismo camino y recién arriba se pasa a **modo usuario** (2.º cambio). Más ordenado, pero con más llamadas en el medio.',
          resaltar: ['c-s3', 'c-s2', 'c-s1', 'c-vuelta', 'c-app'],
          fichas: { r: 'c-app' },
          valores: modos('c', 2),
        }),
      ],
    },
    {
      nombre: 'Microkernel',
      pasos: [
        pideLeer(
          'k',
          'El mismo pedido, pero el sistema de archivos no está en el kernel: es un servidor que corre como proceso en modo usuario.',
        ),
        paso('k', {
          titulo: 'Mensaje al microkernel.',
          texto:
            'La app le manda un mensaje al servidor a través del microkernel. Es una syscall: pasa a **modo kernel** (1.er cambio).',
          resaltar: ['k-1', 'k-micro'],
          fichas: { r: 'k-micro' },
          valores: modos('k', 1),
        }),
        paso('k', {
          titulo: 'Entrega al servidor.',
          texto:
            'El microkernel le pasa el mensaje al servidor de archivos, que corre en **modo usuario** (2.º cambio).',
          resaltar: ['k-2', 'k-fs'],
          fichas: { r: 'k-fs' },
          valores: modos('k', 2),
        }),
        paso('k', {
          titulo: 'El servidor resuelve.',
          texto:
            'Busca el archivo; para llegar al disco también depende del kernel (más mensajes, que acá no contamos). Si el servidor se cae, el kernel sigue en pie.',
          resaltar: ['k-fs'],
        }),
        paso('k', {
          titulo: 'Respuesta al microkernel.',
          texto:
            'Responde con otro mensaje: otra syscall, así que otra vez a **modo kernel** (3.er cambio).',
          resaltar: ['k-3', 'k-micro'],
          fichas: { r: 'k-micro' },
          valores: modos('k', 3),
        }),
        paso('k', {
          titulo: 'Llega a la app.',
          texto:
            'El microkernel le entrega la respuesta a la app en **modo usuario** (4.º cambio): como mínimo el doble que en el monolítico. Ese overhead es su desventaja.',
          resaltar: ['k-4', 'k-app'],
          fichas: { r: 'k-app' },
          valores: modos('k', 4),
        }),
      ],
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'syscall-read': syscall,
  'arquitecturas-kernel': arquitecturasKernel,
}
