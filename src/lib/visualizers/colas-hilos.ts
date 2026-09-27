/** Zonas del diagrama de colas propias de ULT sobre KLT (bibliotecas, quantum del KLT). */
import type { Zona } from './colas-dom'
import type { ContextoColas } from './colas'

export function zonasHilos({ tick }: ContextoColas): Zona[] {
  if (!tick.bibliotecas) return []
  return []
}
