/** Desafío de cálculo: Verificar compara todos los campos juntos; solo dice correcto o incorrecto. */
import { $, $$ } from '@lib/dom'
import { estaResuelto, rutaActual } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'
import { verificarCalculo, type CampoCalculo } from '@lib/calculos/verificar'

export function initCalculos(): void {
  for (const box of $$<HTMLElement>('[data-calc]')) init(box)
}

function init(box: HTMLElement): void {
  const campos = JSON.parse(box.dataset.calcCampos!) as CampoCalculo[]
  const clave = `${rutaActual()}#calc-${box.dataset.calcClave}`
  const feedback = $<HTMLElement>('[data-calc-feedback]', box)!
  const respuesta = $<HTMLElement>('[data-calc-respuesta]', box)!
  const boton = $<HTMLButtonElement>('[data-calc-accion="resolucion"]', box)!
  const filas = $$<HTMLElement>('[data-calc-campo]', box)
  const input = (fila: HTMLElement) => $<HTMLInputElement>('input', fila)!
  const fault = (fila: HTMLElement) => $<HTMLButtonElement>('[data-calc-fault]', fila)

  const decir = (texto: string, color = 'var(--muted)') => {
    feedback.textContent = texto
    feedback.style.color = color
  }
  const marcarFault = (fila: HTMLElement, activo: boolean) => {
    fault(fila)?.setAttribute('aria-pressed', String(activo))
    input(fila).disabled = activo
    if (activo) input(fila).value = ''
  }
  const pintar = (ok = false) => {
    for (const fila of filas) fila.toggleAttribute('data-ok', ok)
  }

  const control = controlarResolucion({
    boton,
    clave,
    mostrar: () => {
      respuesta.hidden = false
      for (const fila of filas) $<HTMLElement>('[data-calc-solucion]', fila)!.hidden = false
    },
    ocultar: () => {
      respuesta.hidden = true
      for (const fila of filas) {
        $<HTMLElement>('[data-calc-solucion]', fila)!.hidden = true
        marcarFault(fila, false)
        input(fila).value = ''
      }
      pintar()
      decir('')
    },
  })

  if (estaResuelto(clave)) decir('Ya lo resolviste antes. Podés volver a intentarlo.')

  box.addEventListener('input', () => pintar())

  box.addEventListener('click', (e) => {
    const objetivo = e.target as Element
    const botonFault = objetivo.closest<HTMLButtonElement>('[data-calc-fault]')
    if (botonFault) {
      const fila = botonFault.closest<HTMLElement>('[data-calc-campo]')!
      marcarFault(fila, botonFault.getAttribute('aria-pressed') !== 'true')
      return pintar()
    }
    if (objetivo.closest<HTMLElement>('[data-calc-accion]')?.dataset.calcAccion !== 'verificar')
      return
    const respuestas = filas.map((fila) => ({
      valor: input(fila).value,
      fault: fault(fila)?.getAttribute('aria-pressed') === 'true',
    }))
    if (respuestas.some((r) => !r.fault && !r.valor.trim()))
      return decir('Completá todos los campos.', 'var(--warn)')
    if (verificarCalculo(campos, respuestas).ok) {
      pintar(true)
      decir('¡Correcto!', 'var(--ok)')
      return control.acerto()
    }
    decir('Hay al menos un resultado incorrecto. Revisá las cuentas.', 'var(--bad)')
  })
}
