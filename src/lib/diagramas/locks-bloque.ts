/** Bloque ```locks: YAML con el tipo de cerrojo, el archivo y el código de cada proceso → recorrido por turnos de RR. Ver brain: Resolución gráfica paso a paso. */
import { parse } from 'yaml'
import { renderRecorrido } from './recorrido'
import { recorridoLocks } from './recorrido-locks'
import type { SpecLocks } from './locks-rr'

export function renderLocks(codigo: string): string {
  const spec = parse(codigo) as SpecLocks
  for (const campo of ['titulo', 'cerrojo', 'modo', 'archivo', 'procesos'] as const)
    if (spec?.[campo] == null) throw new Error(`Bloque locks: falta \`${campo}\``)
  if (!['obligatorio', 'sugerido'].includes(spec.cerrojo))
    throw new Error(`Bloque locks: cerrojo \`${spec.cerrojo}\` (obligatorio | sugerido)`)
  if (!['compartido', 'exclusivo'].includes(spec.modo))
    throw new Error(`Bloque locks: modo \`${spec.modo}\` (compartido | exclusivo)`)
  if (spec.archivo.nombre == null || spec.archivo.contenido == null)
    throw new Error('Bloque locks: el archivo lleva `nombre` y `contenido`')
  if (!spec.procesos.length || spec.procesos.some((p) => !p.nombre || !p.codigo?.length))
    throw new Error('Bloque locks: cada proceso lleva `nombre` y `codigo`')
  spec.archivo.contenido = String(spec.archivo.contenido)
  return renderRecorrido(recorridoLocks(spec))
}
