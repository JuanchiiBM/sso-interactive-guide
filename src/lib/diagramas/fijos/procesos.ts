/** Diagramas fijos del tema Procesos. */
import { chip, panelLeyenda } from '../primitivas-t3'
import { marco, texto } from '../svg'

// grupos y campos tal como los lista la sección "PCB (Process Control Block)" de procesos.md
const GRUPOS: { nombre: string; campos: string[]; contexto?: boolean }[] = [
  {
    nombre: 'Identificación',
    campos: ['PID (del proceso)', 'PPID (del padre)', 'UID (del usuario)'],
  },
  { nombre: 'Estado', campos: ['estado del proceso'] },
  {
    nombre: 'Contexto de ejecución',
    campos: ['PC', 'PSW', 'demás registros de la CPU'],
    contexto: true,
  },
  { nombre: 'Información de planificación', campos: ['prioridad', 'tiempos', '…'] },
  { nombre: 'Información de memoria', campos: ['tablas', 'límites'] },
  { nombre: 'Información de E/S', campos: ['archivos abiertos', 'dispositivos asignados'] },
  { nombre: 'Información contable', campos: ['tiempo de CPU consumido', '…'] },
]
const Y0 = 44
const ALTO_BANDA = 38
const SALTO = 44

function banda(i: number) {
  const g = GRUPOS[i]
  const y = Y0 + i * SALTO
  const cy = y + ALTO_BANDA / 2
  let x = 254
  const chips = g.campos.map((c) => {
    const [html, fin] = chip(x, cy, c, g.contexto ? 't3p-chip-contexto' : '')
    x = fin + 8
    return html
  })
  return (
    `<g class="t3p-banda${g.contexto ? ' t3p-banda-contexto' : ''}">` +
    `<rect x="20" y="${y}" width="680" height="${ALTO_BANDA}" rx="8"/>` +
    texto(34, cy, g.nombre, { clase: 't3p-grupo' }) +
    chips.join('') +
    `</g>`
  )
}

const pcb = () =>
  marco({
    ancho: 720,
    alto: 390,
    titulo: 'El PCB de un proceso: sus grupos de campos',
    cuerpo: [
      panelLeyenda(10, 22, 700, 334, 'PCB · uno por proceso, siempre en memoria'),
      ...GRUPOS.map((_, i) => banda(i)),
      texto(360, 374, 'resaltado: lo que se guarda al dejar la CPU y se restaura al volver', {
        clase: 't3p-nota',
      }),
    ],
  })

export const diagramas: Record<string, () => string> = { 'pcb-grupos': pcb }
