/** Diagramas paso a paso (```recorrido <id>): el SVG sale en build y el cliente aplica cada paso. Ver brain: Recorridos paso a paso. */
import { esc, lienzo, type Lienzo } from './svg'

export interface Paso {
  titulo: string
  /** Texto corto; admite `código` y **negrita**. */
  texto: string
  /** `data-el` que se resaltan en este paso (el resto queda tenue). No se hereda. */
  resaltar?: string[]
  /** Ficha → lugar (clave de `lugares`), o null para sacarla. Se hereda. */
  fichas?: Record<string, string | null>
  /** `data-val` → texto que muestra. Se hereda. */
  valores?: Record<string, string>
  /** `data-el` → clase de estado (`rc-ok`, `rc-mal`, `rc-aviso`), o '' para quitarla. Se hereda. */
  clases?: Record<string, string>
  /** `data-el` ocultos (hechos con `oculto: true`) que pasan a verse / dejan de verse. Se hereda. */
  mostrar?: string[]
  ocultar?: string[]
}

export interface Variante {
  nombre: string
  pasos: Paso[]
}

export interface Recorrido extends Lienzo {
  /** Nombre de cada ficha → texto que muestra (p. ej. `{ p1: 'P1' }`). */
  fichas?: Record<string, string>
  lugares?: Record<string, { x: number; y: number }>
  /** Una sola secuencia, o varias con pestañas. */
  pasos?: Paso[]
  variantes?: Variante[]
}

/** Estado completo de un paso, ya heredado: es lo que lee el cliente. */
export interface EstadoPaso {
  r: string[]
  f: Record<string, [number, number] | null>
  v: Record<string, string>
  c: Record<string, string>
  m: string[]
}

/** `código` y **negrita** sobre texto ya escapado. */
export const formatear = (t: string) =>
  esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

/** Acumula lo que se hereda paso a paso. */
export function estados(r: Recorrido, pasos: Paso[]): EstadoPaso[] {
  const f: Record<string, string | null> = {}
  const v: Record<string, string> = {}
  const c: Record<string, string> = {}
  const m = new Set<string>()
  return pasos.map((p, i) => {
    for (const [ficha, lugar] of Object.entries(p.fichas ?? {})) {
      if (!r.fichas?.[ficha]) throw new Error(`${r.titulo}, paso ${i + 1}: ficha "${ficha}"`)
      if (lugar && !r.lugares?.[lugar])
        throw new Error(`${r.titulo}, paso ${i + 1}: lugar "${lugar}"`)
      f[ficha] = lugar
    }
    Object.assign(v, p.valores)
    for (const [el, clase] of Object.entries(p.clases ?? {})) c[el] = clase
    for (const el of p.mostrar ?? []) m.add(el)
    for (const el of p.ocultar ?? []) m.delete(el)
    return {
      r: p.resaltar ?? [],
      f: Object.fromEntries(
        Object.entries(f).map(([k, l]) => [k, l ? [r.lugares![l].x, r.lugares![l].y] : null]),
      ),
      v: { ...v },
      c: Object.fromEntries(Object.entries(c).filter(([, clase]) => clase)),
      m: [...m],
    }
  })
}

const variantesDe = (r: Recorrido): Variante[] =>
  r.variantes ?? [{ nombre: '', pasos: r.pasos ?? [] }]

function lista(r: Recorrido, v: Variante, k: number): string {
  const items = estados(r, v.pasos)
    .map(
      (e, i) =>
        `<li data-rc-paso data-estado="${esc(JSON.stringify(e))}">` +
        `<span class="rc-num">${i + 1}/${v.pasos.length}</span> ` +
        `<strong class="rc-titulo">${esc(v.pasos[i].titulo)}</strong> ${formatear(v.pasos[i].texto)}</li>`,
    )
    .join('')
  const titulo = v.nombre ? `<p class="rc-variante-titulo">${esc(v.nombre)}</p>` : ''
  return `<div class="rc-variante" data-rc-variante="${k}">${titulo}<ol class="rc-pasos">${items}</ol></div>`
}

export function renderRecorrido(r: Recorrido): string {
  const variantes = variantesDe(r)
  if (!variantes.every((v) => v.pasos.length)) throw new Error(`${r.titulo}: variante sin pasos`)
  const fichas = Object.entries(r.fichas ?? {})
    .map(
      ([nombre, texto]) =>
        `<g class="rc-ficha" data-rc-ficha="${esc(nombre)}"><circle r="13"/><text>${esc(texto)}</text></g>`,
    )
    .join('')
  const boton = (accion: string, texto: string, etiqueta: string) =>
    `<button type="button" class="rc-boton" data-rc="${accion}" aria-label="${etiqueta}">${texto}</button>`
  const pestanas =
    variantes.length > 1
      ? `<div class="rc-pestanas" role="group" aria-label="Variantes" hidden>` +
        variantes
          .map(
            (v, k) =>
              `<button type="button" class="rc-pestana" data-rc-pestana="${k}" aria-pressed="${k === 0}">${esc(v.nombre)}</button>`,
          )
          .join('') +
        `</div>`
      : ''
  return (
    `<figure class="diagrama recorrido" data-recorrido tabindex="0" aria-label="${esc(r.titulo)}, paso a paso">` +
    pestanas +
    lienzo(r, fichas) +
    `<div class="rc-controles" hidden>` +
    boton('anterior', '←', 'Paso anterior') +
    `<span class="rc-puntos" data-rc-puntos></span>` +
    boton('siguiente', '→', 'Paso siguiente') +
    `</div>` +
    `<div class="rc-texto" aria-live="polite">${variantes.map((v, k) => lista(r, v, k)).join('')}</div>` +
    `</figure>`
  )
}
