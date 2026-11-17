/** Traza de reemplazo: el alumno completa la grilla; Verificar solo dice correcto o incorrecto. */
import { $, $$ } from '@lib/dom'
import { estaResuelto, rutaActual } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'
import type { ItemExamen } from '@lib/desafios/tipos'
import {
  columnaCorrecta,
  normalizarPagina,
  verificarTraza,
  type ColumnaTraza,
  type Marcar,
  type Resultado,
} from '@lib/calculos/traza'

interface Datos {
  inicial: ColumnaTraza
  esperadas: ColumnaTraza[][]
  marcar: Marcar[]
}

export function initTrazas(): void {
  for (const box of $$<HTMLElement>('[data-traza][data-traza-modo="practica"]')) init(box)
}

const presionado = (b: Element | null) => b?.getAttribute('aria-pressed') === 'true'
const presionar = (b: Element | null, v: boolean) => b?.setAttribute('aria-pressed', String(v))

/** Lectura y escritura de una grilla (un panel = un algoritmo). */
function grilla(panel: HTMLElement, frames: number) {
  const celda = (k: number, i: number) => $<HTMLElement>(`[data-traza-celda="${k}-${i}"]`, panel)!
  const columnas = $$('[data-traza-col]', panel).length

  const leer = (k: number): ColumnaTraza => {
    const filas = Array.from({ length: frames }, (_, i) => celda(k, i))
    const radio = $(
      `[data-traza-resultado="${k}"] [aria-checked="true"]`,
      panel,
    ) as HTMLElement | null
    return {
      paginas: filas.map((c) => $<HTMLInputElement>('input', c)!.value.trim() || null),
      h: filas.map((c) => presionado($('[data-bit="h"]', c))),
      u: filas.map((c) => presionado($('[data-bit="u"]', c))),
      m: filas.map((c) => presionado($('[data-bit="m"]', c))),
      puntero: ((i) => (i < 0 ? null : i))(
        filas.findIndex((c) => presionado($('[data-bit="p"]', c))),
      ),
      resultado: (radio?.dataset.valor as Resultado) ?? 'acierto',
      disco: presionado($(`[data-traza-disco="${k}"]`, panel)),
    }
  }

  /** `completa` = también H, resultado y disco (para mostrar la solución); copiar solo trae el estado. */
  const escribir = (k: number, col: ColumnaTraza, completa: boolean) => {
    for (let i = 0; i < frames; i++) {
      const c = celda(k, i)
      $<HTMLInputElement>('input', c)!.value = col.paginas[i]?.toString() ?? ''
      presionar($('[data-bit="h"]', c), completa && col.paginas[i] != null && col.h[i])
      presionar($('[data-bit="u"]', c), col.paginas[i] != null && col.u[i])
      presionar($('[data-bit="m"]', c), col.paginas[i] != null && col.m[i])
    }
    for (let i = 0; i < frames; i++) presionar($('[data-bit="p"]', celda(k, i)), col.puntero === i)
    if (!completa) return
    elegir(k, col.resultado)
    presionar($(`[data-traza-disco="${k}"]`, panel), col.disco)
  }

  const elegir = (k: number, valor: Resultado | null) => {
    for (const b of $$(`[data-traza-resultado="${k}"] [role="radio"]`, panel))
      b.setAttribute('aria-checked', String((b as HTMLElement).dataset.valor === valor))
    $(`[data-traza-col="${k}"]`, panel)!.setAttribute('data-resultado', valor ?? '')
  }

  const vacia: ColumnaTraza = {
    paginas: Array(frames).fill(null),
    h: Array(frames).fill(false),
    u: Array(frames).fill(false),
    m: Array(frames).fill(false),
    puntero: null,
    resultado: null,
    disco: false,
  }

  return { columnas, celda, leer, escribir, elegir, vacia }
}

/** El puntero es uno por columna: prender P en un frame lo apaga en los demás. */
function alternarBit(bit: Element) {
  const prender = !presionado(bit)
  if (bit.getAttribute('data-bit') === 'p' && prender) {
    const k = bit.closest<HTMLElement>('[data-traza-celda]')!.dataset.trazaCelda!.split('-')[0]
    for (const otro of $$(
      `[data-traza-celda^="${k}-"] [data-bit="p"]`,
      bit.closest('[data-traza-panel]')!,
    ))
      presionar(otro, false)
  }
  presionar(bit, prender)
}

/** Grilla editable (tabs, celdas, bits, copiar); `alCambiar` avisa cada edición. */
function interactiva(box: HTMLElement, alCambiar: () => void) {
  const datos = JSON.parse(box.dataset.trazaDatos!) as Datos
  const frames = datos.inicial.paginas.length
  const paneles = $$<HTMLElement>('[data-traza-panel]', box)
  const grillas = paneles.map((p) => grilla(p, frames))

  /** Resalta la página que cambió respecto de la columna anterior y actualiza la cuenta. */
  const refrescar = (a: number) => {
    const g = grillas[a]
    let pf = 0
    let disco = 0
    let antes = datos.inicial
    for (let k = 0; k < g.columnas; k++) {
      const col = g.leer(k)
      col.paginas.forEach((p, i) =>
        g
          .celda(k, i)
          .toggleAttribute(
            'data-cambio',
            p != null && normalizarPagina(p) !== normalizarPagina(antes.paginas[i]),
          ),
      )
      if (col.resultado === 'pf') pf++
      if (col.disco) disco++
      antes = col
    }
    const cuenta = $<HTMLElement>('[data-traza-cuenta]', paneles[a])!
    cuenta.textContent = datos.marcar[a].disco ? `PF: ${pf} · A disco: ${disco}` : `PF: ${pf}`
  }
  const panelDe = (el: Element) => paneles.indexOf(el.closest<HTMLElement>('[data-traza-panel]')!)
  const cambio = (a: number) => {
    alCambiar()
    if (a >= 0) refrescar(a)
  }

  box.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement
    // con rótulos de proceso (A3) se aceptan letras; si no, solo dígitos
    if (input.matches('.traza-pagina'))
      input.value = input.value.replace(
        box.hasAttribute('data-traza-texto') ? /[^\da-z]/gi : /\D/g,
        '',
      )
    cambio(panelDe(input))
  })

  box.addEventListener('keydown', (e) => {
    const input = e.target as HTMLInputElement
    if (!input.matches('.traza-pagina')) return
    const k = Number(input.dataset.col)
    const i = Number(input.dataset.fila)
    const tecla = e.key.toLowerCase()
    // con rótulos de proceso las letras se escriben: los atajos van con Alt
    const atajo = !box.hasAttribute('data-traza-texto') || e.altKey
    if (atajo && tecla.length === 1 && 'hump'.includes(tecla)) {
      e.preventDefault()
      const bit = $(`[data-bit="${tecla}"]`, input.closest('td')!)
      if (bit) alternarBit(bit)
      return cambio(panelDe(input))
    }
    const mover: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }
    const d = mover[e.key]
    if (!d) return
    // izquierda/derecha solo saltan de celda con el cursor en el borde del texto
    if (d[0] && input.selectionStart !== (d[0] < 0 ? 0 : input.value.length)) return
    const destino = $<HTMLInputElement>(
      `input[data-col="${k + d[0]}"][data-fila="${i + d[1]}"]`,
      input.closest('[data-traza-panel]')!,
    )
    if (!destino) return
    e.preventDefault()
    destino.focus()
    destino.select()
  })

  box.addEventListener('click', (e) => {
    const el = e.target as Element
    const tab = el.closest<HTMLElement>('[data-traza-tab]')
    if (tab) {
      const n = Number(tab.dataset.trazaTab)
      $$('[data-traza-tab]', box).forEach((t, i) =>
        t.setAttribute('aria-selected', String(i === n)),
      )
      paneles.forEach((p, i) => (p.hidden = i !== n))
      return
    }
    const a = panelDe(el)
    const bit = el.closest('[data-bit]')
    const disco = el.closest('[data-traza-disco]')
    const radio = el.closest<HTMLElement>('[data-traza-resultado] [role="radio"]')
    const copiar = el.closest<HTMLElement>('[data-traza-copiar]')
    if (bit) alternarBit(bit)
    else if (disco) presionar(disco, !presionado(disco))
    else if (radio) {
      const k = Number(radio.closest<HTMLElement>('[data-traza-resultado]')!.dataset.trazaResultado)
      // un segundo click sobre el elegido lo desmarca
      grillas[a].elegir(
        k,
        radio.getAttribute('aria-checked') === 'true' ? null : (radio.dataset.valor as Resultado),
      )
    } else if (copiar) {
      const k = Number(copiar.dataset.trazaCopiar)
      const g = grillas[a]
      g.escribir(k, k === 0 ? datos.inicial : g.leer(k - 1), false)
      $<HTMLInputElement>(`input[data-col="${k}"][data-fila="0"]`, paneles[a])!.focus()
    }
    if (bit || disco || radio || copiar) cambio(a)
  })

  return {
    datos,
    grillas,
    refrescar: () => grillas.forEach((_, a) => refrescar(a)),
    respuestas: () => grillas.map((g) => Array.from({ length: g.columnas }, (_, k) => g.leer(k))),
    bloquear: (si: boolean) => {
      for (const el of $$<HTMLInputElement | HTMLButtonElement>(
        '.traza-grilla input, .traza-grilla button',
        box,
      ))
        el.disabled = si
    },
  }
}

/** Traza dentro de un simulacro: vale la fracción de columnas bien; al revelar marca cada columna. */
export function crearTrazaExamen(box: HTMLElement): ItemExamen {
  const t = interactiva(box, () => {})
  const corregir = () => verificarTraza(t.datos.esperadas, t.respuestas(), t.datos.marcar)
  const vacia = () =>
    t
      .respuestas()
      .every((cols) =>
        cols.every((c) => c.paginas.every((p) => p == null) && c.resultado === 'acierto'),
      )
  return {
    puntaje: async () => {
      const { correctas, total } = corregir()
      return total ? correctas / total : 0
    },
    detalle: () => {
      if (vacia()) return 'Sin responder'
      const { correctas, total } = corregir()
      return correctas === total ? 'Correcto' : `${correctas} de ${total} columnas bien`
    },
    revelar() {
      const r = t.respuestas()
      t.datos.esperadas.forEach((cols, a) =>
        cols.forEach((e, k) => {
          const ok = columnaCorrecta(e, r[a][k], t.datos.marcar[a])
          $(`[data-traza-panel="${a}"] [data-traza-col="${k}"]`, box)!.toggleAttribute(
            ok ? 'data-ok' : 'data-mal',
            true,
          )
        }),
      )
      t.bloquear(true)
      $<HTMLElement>('[data-traza-respuesta]', box)!.hidden = false
    },
  }
}

function init(box: HTMLElement): void {
  const feedback = $<HTMLElement>('[data-traza-feedback]', box)!
  const respuesta = $<HTMLElement>('[data-traza-respuesta]', box)!
  const clave = `${rutaActual()}#calc-${box.dataset.trazaClave}`
  const decir = (texto: string, color = 'var(--muted)') => {
    feedback.textContent = texto
    feedback.style.color = color
  }
  const pintar = (ok: boolean) => box.toggleAttribute('data-ok', ok)
  const t = interactiva(box, () => pintar(false))
  const { datos, grillas } = t

  const control = controlarResolucion({
    boton: $<HTMLButtonElement>('[data-traza-accion="resolucion"]', box)!,
    clave,
    mostrar: () => {
      grillas.forEach((g, a) => datos.esperadas[a].forEach((col, k) => g.escribir(k, col, true)))
      t.refrescar()
      t.bloquear(true)
      respuesta.hidden = false
    },
    ocultar: () => {
      grillas.forEach((g) => {
        for (let k = 0; k < g.columnas; k++) g.escribir(k, g.vacia, true)
      })
      t.refrescar()
      t.bloquear(false)
      respuesta.hidden = true
      pintar(false)
      decir('')
    },
  })

  if (estaResuelto(clave)) decir('Ya lo resolviste antes. Podés volver a intentarlo.')

  box.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-traza-accion]')
    if (accion?.dataset.trazaAccion !== 'verificar') return
    if (verificarTraza(datos.esperadas, t.respuestas(), datos.marcar).ok) {
      pintar(true)
      decir('¡Correcto!', 'var(--ok)')
      return control.acerto()
    }
    decir('Hay al menos una celda incorrecta. Revisá la traza.', 'var(--bad)')
  })
}
