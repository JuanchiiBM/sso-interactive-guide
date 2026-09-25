/** Multiple choice: la justificación queda oculta hasta acertar (o pedir verla). */
import { $, $$ } from '@lib/dom'
import { estaResuelto, rutaActual } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'
import type { ItemExamen } from '@lib/desafios/tipos'

export function initMultipleChoice(): void {
  for (const box of $$<HTMLElement>('[data-mc][data-mc-modo="practica"]')) init(box)
}

/** Multiple choice dentro de un simulacro: vale 1 o 0; al revelar marca la correcta y la elegida. */
export function crearMCExamen(box: HTMLElement): ItemExamen {
  const correcta = Number(box.dataset.mcCorrecta)
  const elegida = () => {
    const input = $<HTMLInputElement>('input[type="radio"]:checked', box)
    return input ? Number(input.value) : null
  }
  return {
    puntaje: async () => (elegida() === correcta ? 1 : 0),
    detalle: () => {
      const e = elegida()
      return e == null ? 'Sin responder' : e === correcta ? 'Correcta' : 'Incorrecta'
    },
    revelar() {
      const e = elegida()
      for (const op of $$<HTMLElement>('[data-mc-opcion]', box)) {
        const i = Number(op.dataset.mcOpcion)
        op.dataset.estado = i === correcta ? 'correcta' : i === e ? 'error' : 'incorrecta'
        $<HTMLElement>('[data-mc-explicacion]', op)?.removeAttribute('hidden')
        $<HTMLInputElement>('input', op)!.disabled = true
      }
      $<HTMLElement>('[data-mc-respuesta]', box)!.hidden = false
    },
  }
}

function init(box: HTMLElement): void {
  const correcta = Number(box.dataset.mcCorrecta)
  const clave = `${rutaActual()}#mc-${box.dataset.mcClave}`
  const feedback = $<HTMLElement>('[data-mc-feedback]', box)!
  const respuesta = $<HTMLElement>('[data-mc-respuesta]', box)!
  const boton = $<HTMLButtonElement>('[data-mc-accion="resolucion"]', box)
  const opciones = $$<HTMLElement>('[data-mc-opcion]', box)
  if (!boton) return

  const decir = (texto: string, color = 'var(--muted)') => {
    feedback.textContent = texto
    feedback.style.color = color
  }

  const control = controlarResolucion({
    boton,
    clave,
    mostrar: () => {
      respuesta.hidden = false
      for (const op of opciones) {
        op.dataset.estado = Number(op.dataset.mcOpcion) === correcta ? 'correcta' : 'incorrecta'
        $<HTMLElement>('[data-mc-explicacion]', op)?.removeAttribute('hidden')
      }
    },
    ocultar: () => {
      respuesta.hidden = true
      for (const op of opciones) {
        delete op.dataset.estado
        $<HTMLElement>('[data-mc-explicacion]', op)?.setAttribute('hidden', '')
        $<HTMLInputElement>('input', op)!.checked = false
      }
      decir('')
    },
  })

  if (estaResuelto(clave)) decir('Ya la resolviste antes. Podés volver a intentarlo.')

  box.addEventListener('change', () => {
    for (const op of opciones) if (op.dataset.estado === 'error') delete op.dataset.estado
  })

  box.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-mc-accion]')?.dataset.mcAccion
    if (accion !== 'verificar') return
    const elegida = $<HTMLInputElement>('input[type="radio"]:checked', box)
    if (!elegida) return decir('Elegí una opción.', 'var(--warn)')
    const i = Number(elegida.value)
    if (i === correcta) {
      decir('¡Correcta!', 'var(--ok)')
      return control.acerto()
    }
    opciones[i].dataset.estado = 'error'
    // la explicación de la opción elegida es pista, no revela cuál es la correcta
    const pista = $<HTMLElement>('[data-mc-explicacion]', opciones[i])?.textContent?.trim()
    decir(pista ? `Incorrecta. ${pista}` : 'Incorrecta, probá de nuevo.', 'var(--bad)')
  })
}
