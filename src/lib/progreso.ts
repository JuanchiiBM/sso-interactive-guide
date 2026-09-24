/** Progreso del alumno en este navegador. localStorage puede no estar disponible: nunca romper. */
const PREFIJO = 'so:resuelto:'
const EVENTO = 'so:progreso'

/** Ruta del ejercicio con barra final, igual que `ejercicioHref` (las claves se arman con ella). */
export const rutaActual = () => location.pathname.replace(/\/?$/, '/')

/** Claves de todas las partes interactivas de un ejercicio, en el mismo formato que usa cada desafío. */
export function clavesEjercicio(
  href: string,
  partes: { simulaciones: unknown[]; preguntas: unknown[]; semaforos: unknown[] },
): string[] {
  return [
    ...partes.simulaciones.map((_, i) => `${href}#${i}`),
    ...partes.preguntas.map((_, i) => `${href}#mc-${i}`),
    ...partes.semaforos.map((_, i) => `${href}#sem-${i}`),
  ]
}

export function estaResuelto(clave: string): boolean {
  try {
    return localStorage.getItem(PREFIJO + clave) === '1'
  } catch {
    return false
  }
}

export function marcarResuelto(clave: string): void {
  try {
    localStorage.setItem(PREFIJO + clave, '1')
  } catch {}
  document.dispatchEvent(new Event(EVENTO))
}

/** Marca con `data-resuelto` los links y cards (`data-claves`) de ejercicios con todas sus partes resueltas. */
function pintarResueltos(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-claves]')) {
    const claves = el.dataset.claves!.split('|').filter(Boolean)
    el.toggleAttribute('data-resuelto', claves.length > 0 && claves.every(estaResuelto))
  }
  document.dispatchEvent(new Event(`${EVENTO}:pintado`))
}

/** Los borradores del editor de semáforos ya no se guardan: se borran los que hayan quedado. */
function limpiarBorradores(): void {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('so:borrador:')) localStorage.removeItem(k)
    }
  } catch {}
}

export function initProgreso(): void {
  limpiarBorradores()
  pintarResueltos()
  document.addEventListener(EVENTO, pintarResueltos)
}
