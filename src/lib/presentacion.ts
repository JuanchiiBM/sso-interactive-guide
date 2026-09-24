/** Etiquetas y estilos de UI para los enums del schema de ejercicios. */
import type { Ejercicio } from '@lib/catalogo'

type Dificultad = Ejercicio['data']['dificultad']
type Tipo = Ejercicio['data']['tipo']

export const dificultadUI: Record<Dificultad, { label: string; color: string }> = {
  facil: { label: 'Fácil', color: 'var(--ok)' },
  media: { label: 'Media', color: 'var(--warn)' },
  dificil: { label: 'Difícil', color: 'var(--bad)' },
  parcial: { label: 'Parcial', color: 'var(--parcial)' },
}

export const algoritmoUI: Record<string, string> = {
  fifo: 'FIFO',
  sjf: 'SJF',
  srt: 'SRT',
  rr: 'Round Robin',
  prioridades: 'Prioridades sin desalojo',
  'prioridades-desalojo': 'Prioridades con desalojo',
  hrrn: 'HRRN',
  vrr: 'Virtual Round Robin',
  multinivel: 'Colas multinivel',
  feedback: 'Feedback multinivel',
}

export const tipoUI: Record<Tipo, string> = {
  teorico: 'Teórico',
  practico: 'Práctico',
  codigo: 'Código',
  'verdadero-falso': 'V / F',
  'multiple-choice': 'Multiple choice',
}
