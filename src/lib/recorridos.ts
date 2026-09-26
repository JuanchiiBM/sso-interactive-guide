/** Cliente de los recorridos paso a paso: el estado de cada paso ya viene resuelto del build (data-estado). */
import { $, $$ } from '@lib/dom'
import type { EstadoPaso } from '@lib/diagramas/recorrido'

export function initRecorridos(): void {
  for (const fig of $$<HTMLElement>('[data-recorrido]')) init(fig)
}

const CLASES = ['rc-ok', 'rc-mal', 'rc-aviso']

function init(fig: HTMLElement): void {
  const svg = $<SVGSVGElement>('svg', fig)!
  const controles = $<HTMLElement>('.rc-controles', fig)!
  const puntos = $<HTMLElement>('[data-rc-puntos]', fig)!
  const anterior = $<HTMLButtonElement>('[data-rc="anterior"]', fig)!
  const siguiente = $<HTMLButtonElement>('[data-rc="siguiente"]', fig)!
  const variantes = $$<HTMLElement>('[data-rc-variante]', fig)
  const pestanas = $$<HTMLButtonElement>('[data-rc-pestana]', fig)
  const elementos = $$<SVGElement>('[data-el]', svg)
  const valores = $$<SVGElement>('[data-val]', svg)
  const inicial = new Map(valores.map((t) => [t, t.textContent ?? '']))
  const fichas = $$<SVGElement>('[data-rc-ficha]', svg)
  let variante = 0
  let paso = 0

  const pasos = () => $$<HTMLElement>('[data-rc-paso]', variantes[variante])

  function mostrar() {
    const lista = pasos()
    lista.forEach((li, i) => (li.hidden = i !== paso))
    variantes.forEach((v, k) => (v.hidden = k !== variante))
    const e = JSON.parse(lista[paso].dataset.estado!) as EstadoPaso

    fig.toggleAttribute('data-rc-foco', e.r.length > 0)
    for (const el of elementos) {
      const id = el.dataset.el!
      el.classList.toggle('rc-on', e.r.includes(id))
      el.classList.remove(...CLASES)
      if (e.c[id]) el.classList.add(e.c[id])
      if (el.hasAttribute('data-rc-oculto')) el.classList.toggle('rc-visible', e.m.includes(id))
      // la punta de la flecha resaltada cambia de color con su marcador propio
      for (const path of $$<SVGPathElement>('path[marker-end]', el))
        path.setAttribute('marker-end', `url(#${e.r.includes(id) ? 'dg-punta-on' : 'dg-punta'})`)
    }
    for (const t of valores) t.textContent = e.v[t.dataset.val!] ?? inicial.get(t)!
    for (const f of fichas) {
      const pos = e.f[f.dataset.rcFicha!]
      f.classList.toggle('rc-fuera', !pos)
      if (pos) f.style.transform = `translate(${pos[0]}px, ${pos[1]}px)`
    }

    puntos.replaceChildren(
      ...lista.map((_, i) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'rc-punto'
        b.dataset.rcIr = String(i)
        b.setAttribute('aria-label', `Paso ${i + 1}`)
        if (i === paso) b.setAttribute('aria-current', 'step')
        return b
      }),
    )
    anterior.disabled = paso === 0
    siguiente.disabled = paso === lista.length - 1
  }

  const ir = (i: number) => {
    paso = Math.max(0, Math.min(pasos().length - 1, i))
    mostrar()
  }

  fig.addEventListener('click', (ev) => {
    const b = (ev.target as Element).closest<HTMLButtonElement>('button')
    if (!b) return
    if (b.dataset.rc === 'anterior') ir(paso - 1)
    else if (b.dataset.rc === 'siguiente') ir(paso + 1)
    else if (b.dataset.rcIr) ir(Number(b.dataset.rcIr))
    else if (b.dataset.rcPestana) {
      variante = Number(b.dataset.rcPestana)
      for (const p of pestanas) p.setAttribute('aria-pressed', String(p === b))
      ir(0)
    }
  })
  fig.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight') ir(paso + 1)
    else if (ev.key === 'ArrowLeft') ir(paso - 1)
    else return
    ev.preventDefault()
  })

  // sin JS se ve el diagrama completo con la lista de pasos; con JS, de a un paso
  fig.classList.add('rc-activo')
  controles.hidden = false
  $<HTMLElement>('.rc-pestanas', fig)?.removeAttribute('hidden')
  mostrar()
  // la primera posición de las fichas no se anima
  requestAnimationFrame(() => fig.classList.add('rc-animar'))
}
