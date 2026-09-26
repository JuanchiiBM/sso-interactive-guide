/** Recorridos del tema Repaso de arquitectura. */
import { CICLO, lienzoCicloInstruccion } from '../index'
import { recuadro } from '../primitivas-planificacion'
import { arista, tarjeta } from '../primitivas-procesos'
import { codigo, lugaresCodigo, valor } from '../primitivas-sincronizacion'
import type { Paso, Recorrido } from '../recorrido'
import { caja, flecha, grupo, oculto, texto } from '../svg'

// ── Atención de una interrupción: el programa, la CPU, la pila del kernel y el manejador ──
const COD_X = 36
const PROG_Y = 48
const MAN_Y = 208
const PROGRAMA = [
  '0x100  MOV AC, [200]',
  '0x104  ADD AC, 1    ; k',
  '0x108  MOV [200], AC ; k+1',
  '0x10C  JMP 0x100',
]
const MANEJADOR = [
  '0x800  guarda registros',
  '0x804  atiende el disco',
  '0x808  restaura registros',
  '0x80C  IRET',
]
const panelFijo = (y: number, h: number, titulo: string) =>
  `<g class="dg-panel"><rect x="10" y="${y}" width="254" height="${h}" rx="12"/><text class="ri-leyenda" x="24" y="${y}">${titulo}</text></g>`

const atencionInterrupcion: Recorrido = {
  ancho: 720,
  alto: 330,
  titulo: 'Atención de una interrupción: qué guarda el hardware y qué hace el SO',
  cuerpo: [
    panelFijo(20, 138, 'Programa · modo usuario'),
    codigo('prog', COD_X, PROG_Y, 222, PROGRAMA),
    panelFijo(180, 138, 'Manejador (SO) · modo kernel'),
    codigo('man', COD_X, MAN_Y, 222, MANEJADOR),
    tarjeta(
      375,
      90,
      190,
      100,
      'CPU',
      [
        { t: 'PC = 0x108', val: 'cpu-pc' },
        { t: 'PSW: usuario · int. hab.', val: 'cpu-psw' },
        { t: 'AC = 7', val: 'cpu-ac' },
      ],
      { el: 'cpu', clase: 'dg-activo' },
    ),
    oculto(flecha('M375,270 L375,144', 'interrupción', 375, 205, '', 'irq')),
    caja(375, 290, 110, 40, 'Disco', 'dg-bloqueado', 'disco'),
    `<g class="dg-panel"><rect x="490" y="20" width="220" height="146" rx="12"/><text class="ri-leyenda" x="504" y="20">Pila del kernel</text></g>`,
    oculto(valor('s-pc', 510, 50, 180, 28, 'PC = 0x108')),
    oculto(valor('s-psw', 510, 84, 180, 28, 'PSW: usuario · hab.')),
    oculto(valor('s-regs', 510, 118, 180, 28, 'AC = 8 · BX · …')),
    arista('M472,86 L504,86', { el: 'f-guarda', oculto: true, punta: true }),
    arista('M504,110 L472,110', { el: 'f-restaura', oculto: true, punta: true }),
    texto(600, 222, 'modo de la CPU (bit del PSW)', { clase: 'dg-etiqueta' }),
    recuadro(600, 254, 180, 40, 'modo', 'modo', 'modo usuario', 'dg-listo'),
  ],
  fichas: { cpu: 'CPU' },
  lugares: {
    ...lugaresCodigo('prog', COD_X, PROG_Y, PROGRAMA.length),
    ...lugaresCodigo('man', COD_X, MAN_Y, MANEJADOR.length),
  },
  pasos: [
    {
      titulo: 'Llega una interrupción.',
      texto:
        'El disco avisa que terminó mientras la CPU ejecuta `ADD` (la instrucción k). Puede llegar en cualquier momento, pero no se atiende a mitad de una instrucción.',
      resaltar: ['prog-1', 'irq', 'disco', 'cpu'],
      fichas: { cpu: 'prog-1' },
      mostrar: ['irq'],
    },
    {
      titulo: 'Termina la instrucción k.',
      texto:
        'Fetch, decode y execute no se cortan: la CPU termina `ADD` y recién en la etapa de interrupción ve que hay una pendiente. El PC ya apunta a k+1 (`0x108`).',
      resaltar: ['prog-1', 'cpu'],
      clases: { 'prog-1': 'rc-ok' },
      valores: { 'cpu-ac': 'AC = 8' },
    },
    {
      titulo: 'El hardware guarda PC y PSW.',
      texto:
        'Los apila la propia CPU, antes de ejecutar una sola instrucción del SO: son justo lo que se perdería al saltar (dónde seguir y en qué modo estaba).',
      resaltar: ['cpu', 'f-guarda', 's-pc', 's-psw'],
      mostrar: ['f-guarda', 's-pc', 's-psw'],
      clases: { 'prog-1': '' },
    },
    {
      titulo: 'Salta al manejador, en modo kernel.',
      texto:
        'Carga en el PC la dirección del manejador y el bit de modo del PSW pasa a **kernel**: desde acá ejecuta el SO, que puede usar instrucciones privilegiadas.',
      resaltar: ['cpu', 'modo', 'man-0'],
      fichas: { cpu: 'man-0' },
      ocultar: ['f-guarda'],
      valores: {
        'cpu-pc': 'PC = 0x800',
        'cpu-psw': 'PSW: kernel · int. hab.',
        modo: 'modo kernel',
      },
      clases: { modo: 'rc-aviso' },
    },
    {
      titulo: 'El SO guarda el resto de los registros.',
      texto:
        'El hardware solo guardó PC y PSW; `AC`, `BX` y los demás los guarda el manejador. Si corresponde, deshabilita las interrupciones mientras atiende.',
      resaltar: ['man-0', 'cpu', 'f-guarda', 's-regs'],
      mostrar: ['f-guarda', 's-regs'],
      valores: { 'cpu-psw': 'PSW: kernel · int. deshab.' },
    },
    {
      titulo: 'Atiende la interrupción.',
      texto:
        'Hace lo que pide el evento, por ejemplo pasar a Ready al proceso que esperaba esa E/S. Para eso usa los registros de la CPU: por eso había que guardarlos.',
      resaltar: ['man-1', 'disco', 'cpu'],
      fichas: { cpu: 'man-1' },
      ocultar: ['f-guarda'],
      valores: { 'cpu-ac': 'AC = 3 (del SO)' },
      clases: { disco: 'rc-ok' },
    },
    {
      titulo: 'Restaura los registros.',
      texto:
        'Copia de la pila a la CPU los registros que había guardado: `AC` vuelve a valer 8, como lo dejó el programa.',
      resaltar: ['man-2', 'f-restaura', 'cpu', 's-regs'],
      fichas: { cpu: 'man-2' },
      mostrar: ['f-restaura'],
      valores: { 'cpu-ac': 'AC = 8' },
    },
    {
      titulo: 'Restaura primero el PSW y después el PC.',
      texto:
        '`IRET` saca de la pila el **PSW** y recién después el **PC**: apenas se carga el PC, la CPU sigue con el programa, así que el modo y las interrupciones tienen que estar listos antes.',
      resaltar: ['man-3', 'f-restaura', 'cpu', 'modo', 's-psw', 's-pc'],
      fichas: { cpu: 'man-3' },
      ocultar: ['s-regs'],
      valores: {
        'cpu-psw': 'PSW: usuario · int. hab.',
        'cpu-pc': 'PC = 0x108',
        modo: 'modo usuario',
      },
      clases: { modo: '' },
    },
    {
      titulo: 'Sigue en k+1.',
      texto:
        'La CPU trae la instrucción de `0x108` en modo usuario, con los mismos registros que antes: el programa no se entera de que lo interrumpieron.',
      resaltar: ['prog-2', 'cpu'],
      fichas: { cpu: 'prog-2' },
      ocultar: ['f-restaura', 'irq', 's-psw', 's-pc'],
      clases: { disco: '' },
    },
  ],
}

// ── Ciclo de instrucción con etapa de interrupción (mismo dibujo que el diagrama fijo) ──
const { xs, y: yCiclo } = CICLO

const fetch: Paso = {
  titulo: 'Fetch.',
  texto: 'Con la dirección del PC, la CPU trae de memoria la próxima instrucción.',
  resaltar: ['fetch'],
}
const decode: Paso = {
  titulo: 'Decode.',
  texto: 'La interpreta (qué operación es y qué operandos usa) y la deja en el IR.',
  resaltar: ['f-decode', 'decode'],
}
const execute = (texto: string, extra: Partial<Paso> = {}): Paso => ({
  titulo: 'Execute.',
  texto,
  resaltar: ['f-execute', 'execute', 'indivisible'],
  mostrar: ['indivisible'],
  ...extra,
})
const chequeo = (texto: string, mascara: string): Paso => ({
  titulo: '¿Hay una interrupción?',
  texto,
  resaltar: ['f-chequeo', 'chequeo', 'preguntas'],
  valores: { nmi: '1. ¿Hay una NMI? no', mascara },
})
const siguiente = (texto: string): Paso => ({
  titulo: 'Sigue con la siguiente.',
  texto,
  resaltar: ['no', 'fetch'],
})

const cicloInstruccion: Recorrido = {
  ...lienzoCicloInstruccion(),
  cuerpo: [
    ...lienzoCicloInstruccion().cuerpo,
    grupo(
      'indivisible',
      `<path class="ri-llave" d="M${xs[0] - 50},${yCiclo + 28} L${xs[0] - 50},${yCiclo + 34} L${xs[2] + 50},${yCiclo + 34} L${xs[2] + 50},${yCiclo + 28}"/>` +
        texto(xs[1], yCiclo + 46, 'no se cortan a la mitad', { clase: 'ri-chica' }),
      { oculto: true },
    ),
    grupo(
      'preguntas',
      texto(110, 145, '1. ¿Hay una NMI?', { clase: 'ri-chica ri-izq', val: 'nmi' }) +
        texto(110, 165, '2. ¿Enmascarable habilitada y pendiente?', {
          clase: 'ri-chica ri-izq',
          val: 'mascara',
        }),
    ),
  ],
  fichas: { irq: 'IRQ' },
  lugares: { pendiente: { x: 624, y: 40 }, manejador: { x: 628, y: 180 } },
  variantes: [
    {
      nombre: 'Sin interrupción',
      pasos: [
        fetch,
        decode,
        execute(
          'La ejecuta. Fetch, decode y execute son **inseparables**: la etapa de interrupción llega recién cuando la instrucción terminó.',
        ),
        chequeo(
          'Primero mira si hay una no enmascarable (NMI) y después si hay enmascarables pendientes con las interrupciones habilitadas. No hay ninguna.',
          '2. ¿Enmascarable habilitada y pendiente? no',
        ),
        siguiente(
          'El PC ya apunta a la próxima instrucción (o al destino de un salto), así que el ciclo vuelve a fetch.',
        ),
      ],
    },
    {
      nombre: 'Con interrupción',
      pasos: [
        fetch,
        decode,
        execute(
          'Mientras la ejecuta llega una interrupción del disco. No corta la instrucción: queda **pendiente** hasta la etapa de interrupción.',
          { fichas: { irq: 'pendiente' } },
        ),
        chequeo(
          'No hay NMI, pero hay una enmascarable pendiente y el PSW dice que están habilitadas: hay que atenderla.',
          '2. ¿Enmascarable habilitada y pendiente? sí',
        ),
        {
          titulo: 'Guarda PC y PSW y salta al manejador.',
          texto:
            'El hardware guarda el PC y el PSW del programa, pasa a modo kernel y carga en el PC la dirección del manejador de esa interrupción.',
          resaltar: ['si', 'manejador'],
          fichas: { irq: 'manejador' },
        },
        {
          titulo: 'Vuelve a fetch.',
          texto:
            'El manejador son instrucciones como cualquier otra y sigue el mismo ciclo. Al terminar restaura PSW y PC, y el programa sigue con su instrucción siguiente.',
          resaltar: ['vuelve', 'fetch'],
          fichas: { irq: null },
        },
      ],
    },
    {
      nombre: 'Enmascaradas deshabilitadas',
      pasos: [
        fetch,
        decode,
        execute(
          'Mientras la ejecuta llega una interrupción enmascarable, pero el SO había deshabilitado las interrupciones (por ejemplo con `CLI`).',
          { fichas: { irq: 'pendiente' } },
        ),
        chequeo(
          'No hay NMI, y la enmascarable está pendiente pero deshabilitada: por ahora no se atiende.',
          '2. ¿Enmascarable habilitada y pendiente? no',
        ),
        siguiente(
          'El ciclo sigue normal y la interrupción espera hasta que se habiliten de nuevo (`STI`). Una NMI, en cambio, se atendería sí o sí.',
        ),
      ],
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'atencion-interrupcion': atencionInterrupcion,
  'ciclo-instruccion': cicloInstruccion,
}
