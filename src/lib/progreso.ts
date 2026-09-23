/** Progreso del alumno en este navegador. localStorage puede no estar disponible: nunca romper. */
const PREFIJO = 'so:resuelto:'

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
}
