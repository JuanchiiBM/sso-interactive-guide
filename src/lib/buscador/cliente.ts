/** Buscador en el cliente: abre el <dialog>, carga Pagefind recién al usarlo y pinta los resultados. */
import { $, $$ } from '@lib/dom'
import {
  agrupar,
  CANDIDATOS,
  normalizarConsulta,
  type DatoPagefind,
  type Grupo,
  type Resultado,
} from './resultados'

interface Pagefind {
  options(o: Record<string, unknown>): Promise<void>
  debouncedSearch(
    q: string,
    o?: Record<string, unknown>,
    ms?: number,
  ): Promise<{ results: { data(): Promise<DatoPagefind> }[] } | null>
}

// lo genera la integración al final del build: en `pnpm dev` no existe
const URL_PAGEFIND = '/pagefind/pagefind.js'

let pagefind: Promise<Pagefind | null> | null = null
const cargar = () =>
  (pagefind ??= import(/* @vite-ignore */ URL_PAGEFIND)
    .then(async (pf: Pagefind) => {
      await pf.options({ excerptLength: 22 })
      return pf
    })
    .catch(() => null))

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// el extracto de Pagefind ya viene escapado, con <mark> en las coincidencias
const item = (id: string, url: string, titulo: string, extracto: string, extra = '') =>
  `<a id="${id}" href="${esc(url)}" class="buscador-item ${extra}" role="option" aria-selected="false" data-buscador-item>` +
  `${titulo}<p class="buscador-extracto">${extracto}</p></a>`

function pintar(r: Resultado, i: string): string {
  const tipo = [r.tipo, r.fuente]
    .filter(Boolean)
    .map((t) => `<span class="buscador-tipo">${esc(t)}</span>`)
    .join('')
  const destino = r.seccion ? `<span class="buscador-destino"> › ${esc(r.seccion)}</span>` : ''
  const pagina = item(
    `br-${i}`,
    r.url,
    `<span class="buscador-titulo">${esc(r.titulo)}</span>${destino}${tipo}`,
    r.extracto,
    'buscador-pagina',
  )
  const secciones = r.secciones
    .map((s, k) => item(`br-${i}-${k}`, s.url, esc(s.titulo), s.extracto, 'buscador-seccion'))
    .join('')
  return `<li role="presentation">${pagina}${secciones}</li>`
}

const pintarGrupo = (g: Grupo, k: number) =>
  `<li role="presentation" class="buscador-grupo">${esc(g.nombre)}</li>` +
  g.resultados.map((r, i) => pintar(r, `${k}-${i}`)).join('')

export function initBuscador(): void {
  const dialogo = $<HTMLDialogElement>('[data-buscador]')
  const input = $<HTMLInputElement>('[data-buscador-input]')
  const lista = $<HTMLElement>('[data-buscador-resultados]')
  const estado = $<HTMLElement>('[data-buscador-estado]')
  if (!dialogo || !input || !lista || !estado) return

  let activo = -1
  const items = () => $$<HTMLAnchorElement>('[data-buscador-item]', lista)
  const marcar = (i: number) => {
    const xs = items()
    if (!xs.length) return
    activo = (i + xs.length) % xs.length
    xs.forEach((x, k) => x.setAttribute('aria-selected', String(k === activo)))
    input.setAttribute('aria-activedescendant', xs[activo].id)
    xs[activo].scrollIntoView({ block: 'nearest' })
  }
  const mostrar = (texto: string, html = '') => {
    estado.textContent = texto
    estado.hidden = !texto
    lista.innerHTML = html
    activo = -1
    input.removeAttribute('aria-activedescendant')
    input.setAttribute('aria-expanded', String(Boolean(html)))
  }

  const abrir = () => {
    if (dialogo.open) return
    dialogo.showModal()
    input.select()
    void cargar()
  }
  const cerrar = () => dialogo.close()

  const buscar = async () => {
    const q = normalizarConsulta(input.value)
    if (!q) return mostrar('Escribí al menos 2 letras.')
    const pf = await cargar()
    if (!pf) return mostrar('El buscador anda en el sitio publicado o después de pnpm build.')
    const busqueda = await pf.debouncedSearch(q, {}, 150)
    if (!busqueda) return // la pisó una búsqueda más nueva
    const datos = await Promise.all(busqueda.results.slice(0, CANDIDATOS).map((r) => r.data()))
    if (!datos.length) return mostrar(`No hay resultados para "${q}".`)
    mostrar('', agrupar(datos, q).map(pintarGrupo).join(''))
  }

  input.addEventListener('input', () => void buscar())
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      marcar(activo + (e.key === 'ArrowDown' ? 1 : -1))
    } else if (e.key === 'Enter' && activo >= 0) {
      e.preventDefault()
      items()[activo].click()
    }
  })
  lista.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-buscador-item]')) cerrar()
  })
  // click en el fondo (fuera del panel) cierra
  dialogo.addEventListener('click', (e) => {
    if (e.target === dialogo) cerrar()
  })
  $('[data-buscador-cerrar]', dialogo)?.addEventListener('click', cerrar)
  for (const b of $$('[data-buscador-abrir]')) b.addEventListener('click', abrir)

  document.addEventListener('keydown', (e) => {
    const t = e.target
    const escribiendo =
      t instanceof HTMLElement &&
      (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      abrir()
    } else if (e.key === '/' && !escribiendo) {
      e.preventDefault()
      abrir()
    }
  })
}
