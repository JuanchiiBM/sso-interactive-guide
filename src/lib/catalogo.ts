/** Consultas a las content collections, agrupadas para navegación (solo build/SSR). */
import { getCollection, type CollectionEntry } from 'astro:content'
import { armarParciales, type Parcial } from '@lib/parciales/catalogo'

export type Tema = CollectionEntry<'temas'>
export type Ejercicio = CollectionEntry<'ejercicios'>

export interface TemaConEjercicios {
  tema: Tema
  ejercicios: Ejercicio[]
}

export async function getTemas(parcial?: 1 | 2): Promise<Tema[]> {
  const temas = await getCollection('temas', (t) => parcial == null || t.data.parcial === parcial)
  return temas.sort((a, b) => a.data.parcial - b.data.parcial || a.data.orden - b.data.orden)
}

export async function getEjercicios(): Promise<Ejercicio[]> {
  const ejercicios = await getCollection('ejercicios')
  return ejercicios.sort((a, b) => compararNumero(a.data.fuente.numero, b.data.fuente.numero))
}

export async function getCatalogo(parcial?: 1 | 2): Promise<TemaConEjercicios[]> {
  const [temas, ejercicios] = await Promise.all([getTemas(parcial), getEjercicios()])
  return temas.map((tema) => ({
    tema,
    ejercicios: ejercicios.filter((e) => e.data.tema.id === tema.id),
  }))
}

/** Los parciales reales como simulacros, con la teoría y la práctica cargadas de cada examen. */
export async function getParciales(): Promise<Parcial[]> {
  const [temas, ejercicios] = await Promise.all([getTemas(1), getEjercicios()])
  return armarParciales(
    ejercicios,
    temas.map((t) => t.id),
  )
}

export const temaHref = (id: string) => `/teoria/${id}/`
export const simulacroHref = (id: string) => `/simulacros/${id}/`
export const ejercicioHref = (id: string) => `/ejercicios/${id}/`

/** "Ej. 12", o "Simulacro" / "Simulacro 2" para los de numeración `S`, `S2`. */
export function rotuloEjercicio(numero: string | number): string {
  const m = String(numero).match(/^S(\d*)$/)
  return m ? `Simulacro${m[1] ? ` ${m[1]}` : ''}` : `Ej. ${numero}`
}

function compararNumero(a: string | number, b: string | number): number {
  return String(a).localeCompare(String(b), 'es', { numeric: true })
}
