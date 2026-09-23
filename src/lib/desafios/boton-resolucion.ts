/** Botón único Me rindo / Ver resolución / Ocultar. Estados: ver brain, Patrón — Desafío antes de la Resolución. */
import { estaResuelto, marcarResuelto } from '@lib/progreso'

type Estado = 'rendirse' | 'confirmar' | 'ver' | 'ocultar'

const UI: Record<Estado, { texto: string; clase: string }> = {
  rendirse: { texto: 'Me rindo', clase: 'boton-rendirse' },
  confirmar: { texto: '¿Seguro? Ver la resolución', clase: 'boton-rendirse' },
  ver: { texto: 'Ver resolución', clase: 'boton-ver' },
  ocultar: { texto: 'Ocultar resolución', clase: 'boton-ocultar' },
}

export interface ControlResolucion {
  /** Llamar cuando el alumno acierta. */
  acerto: () => void
}

export function controlarResolucion(opts: {
  boton: HTMLButtonElement
  clave: string
  mostrar: () => void
  /** Oculta la resolución y limpia la respuesta para reintentar. */
  ocultar: () => void
}): ControlResolucion {
  const { boton, clave, mostrar, ocultar } = opts
  let estado: Estado = estaResuelto(clave) ? 'ver' : 'rendirse'

  const pintar = (nuevo: Estado) => {
    estado = nuevo
    boton.textContent = UI[nuevo].texto
    boton.className = `ml-auto rounded-lg px-3 py-1.5 text-sm ${UI[nuevo].clase}`
  }
  pintar(estado)

  boton.addEventListener('click', () => {
    if (estado === 'rendirse') return pintar('confirmar')
    if (estado === 'ocultar') {
      ocultar()
      return pintar(estaResuelto(clave) ? 'ver' : 'rendirse')
    }
    mostrar()
    pintar('ocultar')
  })

  return {
    acerto() {
      marcarResuelto(clave)
      mostrar()
      pintar('ocultar')
    },
  }
}
