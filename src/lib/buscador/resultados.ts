/** Resultados de Pagefind → lo que muestra el buscador. Puro: lo testea resultados.test.ts. */

/** Lo que devuelve `resultado.data()` de Pagefind (solo los campos que se usan). */
export interface DatoPagefind {
  url: string
  excerpt: string
  meta: { title?: string; tipo?: string; fuente?: string }
  sub_results?: { title: string; url: string; excerpt: string; locations?: number[] }[]
}

export interface Seccion {
  titulo: string
  url: string
  extracto: string
}

export interface Resultado {
  titulo: string
  url: string
  /** La sección a la que lleva el resultado (vacío = el principio de la página). */
  seccion: string
  tipo: string
  /** Guía o parcial de donde sale un ejercicio. */
  fuente: string
  extracto: string
  secciones: Seccion[]
}

export interface Grupo {
  nombre: string
  resultados: Resultado[]
}

/** Cuántos resultados se piden a Pagefind antes de agrupar. */
export const CANDIDATOS = 16
const MAX_TEORIA = 4
const MAX_EJERCICIOS = 6
const MAX_SECCIONES = 3

const plano = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Raíz corta de cada palabra, para que "interrupciones" matchee el título "Interrupción…". */
const raices = (q: string) =>
  plano(q)
    .split(' ')
    .filter((p) => p.length >= 3)
    .map((p) => p.slice(0, Math.max(4, p.length - 3)))

/** Qué tan bien nombra lo buscado el título de una sección: 2 = es eso, 1 = lo menciona, 0 = no. */
function nombra(titulo: string, consulta: string): number {
  // "interrupción" e "Interrupciones" cuentan como el mismo título
  const singular = (x: string) =>
    plano(x)
      .trim()
      .split(' ')
      .map((w) => w.replace(/(es|s)$/, ''))
      .join(' ')
  if (consulta && singular(titulo) === singular(consulta)) return 2
  return raices(consulta).some((r) => plano(titulo).includes(r)) ? 1 : 0
}

/**
 * Una página apuntando a su mejor sección (si tiene), con hasta 2 secciones más: primero las que
 * nombran lo buscado y después las de más coincidencias.
 */
export function armarResultado(d: DatoPagefind, consulta = ''): Resultado {
  const titulo = d.meta.title ?? d.url
  const [mejor, ...otras] = (d.sub_results ?? [])
    .map((s, i) => ({ s, i, n: nombra(s.title, consulta) }))
    .filter(({ s }) => s.url.includes('#') && s.title !== titulo)
    .sort(
      (a, b) =>
        b.n - a.n || (b.s.locations?.length ?? 0) - (a.s.locations?.length ?? 0) || a.i - b.i,
    )
    .map(({ s }) => ({ titulo: s.title, url: s.url, extracto: s.excerpt }))
  return {
    titulo,
    url: mejor?.url ?? d.url,
    seccion: mejor?.titulo ?? '',
    tipo: d.meta.tipo ?? '',
    fuente: d.meta.fuente ?? '',
    extracto: mejor?.extracto ?? d.excerpt,
    secciones: otras.slice(0, MAX_SECCIONES - 1),
  }
}

/** Teoría primero y ejercicios después, cada grupo en el orden de Pagefind (por puntaje). */
export function agrupar(datos: DatoPagefind[], consulta = ''): Grupo[] {
  const teoria = datos.filter((d) => d.meta.tipo === 'Teoría').slice(0, MAX_TEORIA)
  const resto = datos.filter((d) => d.meta.tipo !== 'Teoría').slice(0, MAX_EJERCICIOS)
  return [
    { nombre: 'Teoría', resultados: teoria.map((d) => armarResultado(d, consulta)) },
    { nombre: 'Ejercicios', resultados: resto.map((d) => armarResultado(d, consulta)) },
  ].filter((g) => g.resultados.length > 0)
}

/** Saca espacios de más; una consulta de menos de 2 letras no se busca. */
export function normalizarConsulta(q: string): string | null {
  const limpia = q.trim().replace(/\s+/g, ' ')
  return limpia.length >= 2 ? limpia : null
}
