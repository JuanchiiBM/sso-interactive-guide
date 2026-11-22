/** Chequeos de build de la Metodología: tipos de ejercicio, anclas de teoría y links desde la teoría. */

/** `parcial-2/memoria-real/dl-df-hexa` → `dl-df-hexa`: el id del tipo es su ancla en la página. */
export const idTipo = (entryId: string) => entryId.slice(entryId.lastIndexOf('/') + 1)

/** Ruta de la metodología de un tema (`parcial-2/memoria-real`). */
export const metodologiaHref = (temaId: string, tipo?: string) =>
  `/metodologia/${temaId}/${tipo ? `#${tipo}` : ''}`

/** Rompe el build si alguno de `pedidos` no está en `existentes`. */
export function exigir(pedidos: string[], existentes: Iterable<string>, contexto: string): void {
  const hay = new Set(existentes)
  const faltan = pedidos.filter((p) => !hay.has(p))
  if (faltan.length) throw new Error(`${contexto}: no existe ${faltan.join(', ')}`)
}

/** Links `/metodologia/<tema>/#<tipo>` dentro de un markdown (la línea "↳ En ejercicios" de la teoría). */
export function linksAMetodologia(md: string): { tema: string; tipo: string }[] {
  return [...md.matchAll(/\/metodologia\/(parcial-\d\/[\w-]+)\/#([\w-]+)/g)].map((m) => ({
    tema: m[1],
    tipo: m[2],
  }))
}
