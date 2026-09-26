/** Recorridos del tema Hilos. */
import { recuadro } from '../primitivas-planificacion'
import type { Paso, Recorrido } from '../recorrido'
import { caja, flecha, texto } from '../svg'

const arranque: Paso = {
  titulo: 'Arranque.',
  texto:
    'P tiene la CPU y su biblioteca eligió a ULT1; ULT2 espera lista. Para el SO, P es **un solo hilo** en Running: no sabe que adentro hay dos ULT.',
  resaltar: ['ult1', 'elige-ult1', 'cpu', 'proc'],
  valores: { e1: 'ULT1: ejecutando', e2: 'ULT2: lista', cpu: 'P · ULT1', proc: 'P: Running' },
  clases: { ult1: 'rc-ok', proc: 'rc-ok' },
}

const directa: Paso[] = [
  arranque,
  {
    titulo: 'ULT1 llama a `read`.',
    texto: 'Es la syscall del SO, sin pasar por la biblioteca: la biblioteca no se entera de nada.',
    resaltar: ['ult1', 'directa', 'so'],
  },
  {
    titulo: 'El SO bloquea a P entero.',
    texto:
      'El SO ve un solo hilo, así que bloquea al proceso y manda el pedido al disco. Para la biblioteca, ULT1 **sigue ejecutando**.',
    resaltar: ['so', 'so-disco', 'disco', 'proc'],
    valores: { cpu: 'otro proceso', proc: 'P: Blocked' },
    clases: { proc: 'rc-mal' },
  },
  {
    titulo: 'ULT2 no puede ejecutar.',
    texto:
      'Está lista, pero la biblioteca solo corre cuando P tiene la CPU, y P está bloqueado. Todo el proceso espera la E/S de ULT1.',
    resaltar: ['ult2', 'proc'],
    clases: { ult2: 'rc-aviso' },
  },
  {
    titulo: 'Termina la E/S.',
    texto: 'La interrupción del disco avisa al SO, que pasa a P de Blocked a Ready.',
    resaltar: ['disco', 'disco-so', 'so', 'proc'],
    valores: { proc: 'P: Ready' },
    clases: { proc: 'rc-aviso' },
  },
  {
    titulo: 'Sigue ULT1.',
    texto:
      'Cuando P vuelve a la CPU, el PC guardado apunta a ULT1 y continúa él. La biblioteca no replanificó: **se pierde su planificación**.',
    resaltar: ['ult1', 'cpu', 'proc'],
    valores: { cpu: 'P · ULT1', proc: 'P: Running' },
    clases: { proc: 'rc-ok', ult2: '' },
  },
]

const wrapper: Paso[] = [
  arranque,
  {
    titulo: 'ULT1 llama a `read`.',
    texto:
      'Pero llama al **wrapper** de la biblioteca (algo como `read_ult`), que intercepta la llamada antes de ir al SO.',
    resaltar: ['ult1', 'por-biblio', 'biblio'],
    valores: { syscall: 'read bloqueante' },
  },
  {
    titulo: 'La biblioteca replanifica.',
    texto:
      'Anota a ULT1 como bloqueado y, según su algoritmo, deja elegido a ULT2 como el próximo.',
    resaltar: ['biblio', 'ult1', 'ult2', 'elige-ult2'],
    valores: { e1: 'ULT1: bloqueado', e2: 'ULT2: próximo' },
    clases: { ult1: 'rc-mal', ult2: 'rc-aviso' },
  },
  {
    titulo: 'Igual se bloquea P entero.',
    texto:
      'La syscall real sigue siendo bloqueante: el SO bloquea al proceso y **ULT2 tampoco ejecuta** todavía.',
    resaltar: ['biblio-so', 'so', 'so-disco', 'disco', 'proc'],
    valores: { cpu: 'otro proceso', proc: 'P: Blocked' },
    clases: { proc: 'rc-mal' },
  },
  {
    titulo: 'Termina la E/S.',
    texto:
      'El SO pasa a P a Ready. ULT1 vuelve a estar lista, al final de la cola de la biblioteca.',
    resaltar: ['disco', 'disco-so', 'so', 'proc', 'ult1'],
    valores: { e1: 'ULT1: lista', proc: 'P: Ready' },
    clases: { proc: 'rc-aviso', ult1: '' },
  },
  {
    titulo: 'Arranca ULT2.',
    texto:
      'Cuando P vuelve a la CPU, la biblioteca ejecuta al que había elegido: **se respeta su planificación**, aunque el proceso haya estado bloqueado.',
    resaltar: ['elige-ult2', 'ult2', 'cpu', 'proc'],
    valores: { e2: 'ULT2: ejecutando', cpu: 'P · ULT2', proc: 'P: Running' },
    clases: { ult2: 'rc-ok', proc: 'rc-ok' },
  },
]

const jacketing: Paso[] = [
  arranque,
  {
    titulo: 'ULT1 llama a `read`.',
    texto:
      'La biblioteca la intercepta: con **jacketing**, la llamada bloqueante queda "revestida".',
    resaltar: ['ult1', 'por-biblio', 'biblio'],
    valores: { syscall: 'read no bloqueante' },
  },
  {
    titulo: 'La convierte en no bloqueante.',
    texto:
      'Pide la E/S con la versión no bloqueante de la syscall: solo ULT1 queda bloqueado, y **solo para la biblioteca**. P sigue en Running.',
    resaltar: ['biblio-so', 'so', 'so-disco', 'disco', 'ult1', 'proc'],
    valores: { e1: 'ULT1: bloqueado' },
    clases: { ult1: 'rc-mal' },
  },
  {
    titulo: 'ULT2 ejecuta enseguida.',
    texto:
      'La biblioteca elige a ULT2 sin que P deje la CPU. El SO no ve nada de esto: para él, P siguió ejecutando.',
    resaltar: ['elige-ult2', 'ult2', 'cpu', 'proc'],
    valores: { e2: 'ULT2: ejecutando', cpu: 'P · ULT2' },
    clases: { ult2: 'rc-ok' },
  },
  {
    titulo: 'Termina la E/S.',
    texto:
      'La biblioteca, que cada tanto le pregunta al SO si terminó, pone a ULT1 en su cola de listos. **P nunca pasó a Blocked**; si no quedara ningún ULT listo, recién ahí dejaría la CPU.',
    resaltar: ['disco', 'disco-so', 'biblio', 'ult1', 'proc'],
    valores: { e1: 'ULT1: lista' },
    clases: { ult1: '' },
  },
]

const syscallUlt: Recorrido = {
  ancho: 720,
  alto: 330,
  titulo: 'Syscall bloqueante con ULT: directa, wrapper y jacketing',
  cuerpo: [
    `<text class="dg-zona" x="14" y="20">Espacio de usuario</text>`,
    `<line class="dg-separador" x1="0" y1="230" x2="720" y2="230"/>`,
    `<text class="dg-zona" x="14" y="252">Kernel</text>`,
    `<g class="dg-panel"><rect x="20" y="30" width="440" height="185" rx="12"/>` +
      `<text x="34" y="50">Proceso P (un KLT) · estado de sus ULT según la biblioteca</text></g>`,
    flecha('M200,98 L170,131', undefined, 0, 0, '', 'elige-ult1'),
    flecha('M280,98 L320,131', undefined, 0, 0, '', 'elige-ult2'),
    flecha('M80,131 L80,82 L143,82', 'read', 80, 108, '', 'por-biblio'),
    flecha('M150,169 L150,268', 'read', 150, 246, '', 'directa'),
    // la etiqueta cambia según la variante, por eso la flecha se arma a mano
    `<g class="dg-flecha" data-el="biblio-so"><path d="M240,100 L240,268" marker-end="url(#dg-punta)"/>` +
      texto(312, 250, '', { clase: 'dg-etiqueta', val: 'syscall' }) +
      `</g>`,
    flecha('M312,282 L388,282', undefined, 0, 0, '', 'so-disco'),
    flecha('M388,298 L312,298', undefined, 0, 0, '', 'disco-so'),
    caja(240, 82, 190, 32, 'Biblioteca de hilos', 'dg-neutro', 'biblio'),
    recuadro(135, 150, 170, 34, 'ult1', 'e1', 'ULT1: lista', 'dg-listo'),
    recuadro(345, 150, 170, 34, 'ult2', 'e2', 'ULT2: lista', 'dg-listo'),
    texto(595, 90, 'En la CPU'),
    recuadro(595, 122, 200, 40, 'cpu', 'cpu', 'P · ULT1', 'dg-activo'),
    caja(220, 290, 180, 40, 'Planificador del SO', 'dg-neutro', 'so'),
    caja(450, 290, 120, 40, 'Disco', 'dg-bloqueado', 'disco'),
    texto(620, 256, 'P según el SO'),
    recuadro(620, 290, 170, 40, 'proc', 'proc', 'P: Running'),
  ],
  variantes: [
    { nombre: 'Syscall directa', pasos: directa },
    { nombre: 'Wrapper', pasos: wrapper },
    { nombre: 'Jacketing', pasos: jacketing },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'hilos-syscall-bloqueante': syscallUlt,
}
