/** Desafío de cálculo: Verificar compara todos los campos juntos; solo dice correcto o incorrecto. */
import { $, $$ } from '@lib/dom'
import { estaResuelto, rutaActual } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'
import {
  campoCorrecto,
  puntajeCalculo,
  verificarCalculo,
  type CampoCalculo,
} from '@lib/calculos/verificar'
import type { ItemExamen } from '@lib/desafios/tipos'

export function initCalculos(): void {
  for (const box of $$<HTMLElement>('[data-calc][data-calc-modo="practica"]')) init(box)
}

const input = (fila: HTMLElement) => $<HTMLInputElement>('input', fila)!
const fault = (fila: HTMLElement) => $<HTMLButtonElement>('[data-calc-fault]', fila)
const marcarFault = (fila: HTMLElement, activo: boolean) => {
  fault(fila)?.setAttribute('aria-pressed', String(activo))
  input(fila).disabled = activo
  if (activo) input(fila).value = ''
}
const respuestaDe = (fila: HTMLElement) => ({
  valor: input(fila).value,
  fault: fault(fila)?.getAttribute('aria-pressed') === 'true',
})
/** El botón Fault alterna su campo; devuelve true si el click era de un Fault. */
const alternarFault = (e: Event) => {
  const boton = (e.target as Element).closest<HTMLButtonElement>('[data-calc-fault]')
  if (!boton) return false
  marcarFault(
    boton.closest<HTMLElement>('[data-calc-campo]')!,
    boton.getAttribute('aria-pressed') !== 'true',
  )
  return true
}

/** Cálculo dentro de un simulacro: vale la fracción de campos bien; al revelar marca cada campo. */
export function crearCalculoExamen(box: HTMLElement): ItemExamen {
  const campos = JSON.parse(box.dataset.calcCampos!) as CampoCalculo[]
  const filas = $$<HTMLElement>('[data-calc-campo]', box)
  box.addEventListener('click', alternarFault)
  const respondidas = () => filas.map(respuestaDe)
  return {
    puntaje: async () => puntajeCalculo(campos, respondidas()),
    detalle: () => {
      const r = respondidas()
      if (r.every((x) => !x.fault && !x.valor.trim())) return 'Sin responder'
      const { correctos } = verificarCalculo(campos, r)
      return campos.length === 1
        ? correctos
          ? 'Correcto'
          : 'Incorrecto'
        : `${correctos} de ${campos.length} resultados bien`
    },
    revelar() {
      const r = respondidas()
      filas.forEach((fila, i) => {
        fila.toggleAttribute(campoCorrecto(campos[i], r[i]) ? 'data-ok' : 'data-mal', true)
        input(fila).disabled = true
        fault(fila)?.setAttribute('disabled', '')
        $<HTMLElement>('[data-calc-solucion]', fila)!.hidden = false
      })
      $<HTMLElement>('[data-calc-respuesta]', box)!.hidden = false
    },
  }
}

function init(box: HTMLElement): void {
  const campos = JSON.parse(box.dataset.calcCampos!) as CampoCalculo[]
  const clave = `${rutaActual()}#calc-${box.dataset.calcClave}`
  const feedback = $<HTMLElement>('[data-calc-feedback]', box)!
  const respuesta = $<HTMLElement>('[data-calc-respuesta]', box)!
  const boton = $<HTMLButtonElement>('[data-calc-accion="resolucion"]', box)!
  const filas = $$<HTMLElement>('[data-calc-campo]', box)

  const decir = (texto: string, color = 'var(--muted)') => {
    feedback.textContent = texto
    feedback.style.color = color
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
    if (alternarFault(e)) return pintar()
    const accion = (e.target as Element).closest<HTMLElement>('[data-calc-accion]')
    if (accion?.dataset.calcAccion !== 'verificar') return
    const respuestas = filas.map(respuestaDe)
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
