/** Partes encadenadas (`encadenado: true`): cada una se muestra al revelar la anterior. */
import { $, $$ } from '@lib/dom'
import { estaResuelto } from '@lib/progreso'

export function initEncadenados(): void {
  for (const cont of $$<HTMLElement>('[data-encadenado]')) init(cont)
}

function init(cont: HTMLElement): void {
  const partes = $$<HTMLElement>('[data-parte]', cont)
  const destrabar = (i: number) => {
    const parte = partes[i]
    if (!parte) return
    $<HTMLElement>('[data-parte-contenido]', parte)!.hidden = false
    $<HTMLElement>('[data-parte-bloqueo]', parte)?.remove()
  }

  // resuelta antes (localStorage) → la siguiente arranca visible
  for (let i = 1; i < partes.length; i++) {
    if (!estaResuelto(partes[i - 1].dataset.parteClave!)) break
    destrabar(i)
  }

  cont.addEventListener('so:revelado', (e) => {
    const parte = (e.target as Element).closest<HTMLElement>('[data-parte]')
    if (parte) destrabar(partes.indexOf(parte) + 1)
  })
}
