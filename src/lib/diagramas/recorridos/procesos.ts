/** Recorridos del tema Procesos. */
import { ALTO_ESTADO, ANCHO_ESTADO, ESTADOS, lienzoEstadosProceso } from '../index'
import type { Recorrido } from '../recorrido'

// la ficha va en la esquina superior derecha de cada estado
const lugares = Object.fromEntries(
  Object.entries(ESTADOS).map(([k, { x, y }]) => [
    k,
    { x: x + ANCHO_ESTADO / 2 - 4, y: y - ALTO_ESTADO / 2 + 2 },
  ]),
)

const estadosProceso: Recorrido = {
  ...lienzoEstadosProceso(),
  titulo: 'Un proceso recorriendo el diagrama de 5 estados',
  fichas: { p1: 'P1' },
  lugares,
  pasos: [
    {
      titulo: 'New.',
      texto: 'El SO crea P1: le asigna un PID y arma su PCB. Todavía no compite por la CPU.',
      resaltar: ['new'],
      fichas: { p1: 'new' },
    },
    {
      titulo: 'Admitido.',
      texto: 'El planificador de largo plazo lo admite y P1 entra a la cola de listos.',
      resaltar: ['admitido', 'ready'],
      fichas: { p1: 'ready' },
    },
    {
      titulo: 'Dispatch.',
      texto: 'El planificador de corto plazo lo elige: P1 pasa a usar la CPU.',
      resaltar: ['dispatch', 'running'],
      fichas: { p1: 'running' },
    },
    {
      titulo: 'Fin de quantum.',
      texto:
        'Llega la interrupción de clock y el SO lo desaloja. Vuelve a **Ready**: no espera nada, solo le falta la CPU.',
      resaltar: ['desalojo', 'ready'],
      fichas: { p1: 'ready' },
    },
    {
      titulo: 'Dispatch otra vez.',
      texto: 'Le vuelve a tocar la CPU.',
      resaltar: ['dispatch', 'running'],
      fichas: { p1: 'running' },
    },
    {
      titulo: 'Espera un evento.',
      texto:
        'Hace una syscall bloqueante, por ejemplo un `read` de disco. Queda en Blocked hasta que termine la E/S.',
      resaltar: ['espera', 'blocked'],
      fichas: { p1: 'blocked' },
    },
    {
      titulo: 'Ocurre el evento.',
      texto:
        'Termina la E/S y una interrupción avisa al SO. P1 pasa a **Ready**, no a Running: Blocked → Running no existe.',
      resaltar: ['evento', 'ready'],
      fichas: { p1: 'ready' },
    },
    {
      titulo: 'Dispatch.',
      texto: 'Lo eligen de nuevo y sigue desde donde quedó.',
      resaltar: ['dispatch', 'running'],
      fichas: { p1: 'running' },
    },
    {
      titulo: 'Termina.',
      texto:
        'Hace `exit`. Se liberan sus recursos, pero el PCB queda con el valor de retorno hasta que el padre lo lea.',
      resaltar: ['termina', 'exit'],
      fichas: { p1: 'exit' },
    },
  ],
}

export const recorridos: Record<string, Recorrido> = {
  'estados-proceso': estadosProceso,
}
