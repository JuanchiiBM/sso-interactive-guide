/** Identidad del sitio. Todo texto de marca sale de acá. */
export const SITE = {
  nombre: 'SO Interactivo',
  materia: 'Sistemas Operativos',
  universidad: 'UTN',
  universidadNombre: 'Universidad Tecnológica Nacional',
  /** Facultad regional (ej. 'FRBA'); vacío = se muestra solo "UTN". */
  facultad: 'FRBA',
  descripcion:
    'Guía interactiva de Sistemas Operativos (UTN): teoría resumida y ejercicios de parcial resueltos paso a paso.',
  repo: 'https://github.com/JuanchiiBM/sso-interactive-guide',
} as const

export const universidadLabel = SITE.facultad
  ? `${SITE.universidad} ${SITE.facultad}`
  : SITE.universidad
