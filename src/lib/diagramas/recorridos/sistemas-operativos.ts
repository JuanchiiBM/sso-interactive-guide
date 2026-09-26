/** Recorridos del tema Sistemas operativos. */
import { arista } from '../primitivas-procesos'
import type { Paso, Recorrido } from '../recorrido'
import { caja, texto } from '../svg'

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

export const recorridos: Record<string, Recorrido> = {
  'syscall-read': syscall,
}
