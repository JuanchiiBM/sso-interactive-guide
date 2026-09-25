/** Editor de semáforos: corre los tests del verificador y bloquea la solución hasta pasarlos. */
import { $, $$ } from '@lib/dom'
import { verificarSemaforos } from '@lib/semaforos/explorar'
import { parsear } from '@lib/semaforos/parser'
import type { EjercicioSemaforos, ResultadoVerificacion } from '@lib/semaforos/tipos'
import { estaResuelto, rutaActual } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'
import type { ItemExamen } from '@lib/desafios/tipos'
import { puntajeSemaforos, type PuntajeSemaforos } from '@lib/parciales/puntaje-semaforos'

export function initSemaforos(): void {
  for (const box of $$<HTMLElement>('[data-sem][data-sem-modo="practica"]')) init(box)
}

// borrador del código hasta resolverlo: al pasar todos los tests se borra (si después se edita, vuelve)
const BORRADOR = 'so:borrador:v2:'

function leerBorrador(clave: string): string | null {
  try {
    return localStorage.getItem(BORRADOR + clave)
  } catch {
    return null
  }
}

function guardarBorrador(clave: string, texto: string | null): void {
  try {
    if (texto == null) localStorage.removeItem(BORRADOR + clave)
    else localStorage.setItem(BORRADOR + clave, texto)
  } catch {}
}

interface Codigo {
  get: () => string
  set: (t: string) => void
}

/** Monta CodeMirror sobre el textarea (que queda de respaldo si no carga) y avisa cada cambio. */
function montarEditor(
  editor: HTMLTextAreaElement,
  spec: EjercicioSemaforos,
  valor: string,
  alCambiar: (t: string) => void,
): Codigo {
  const codigo: Codigo = {
    get: () => editor.value,
    set: (t) => {
      editor.value = t
    },
  }
  editor.value = valor
  editor.addEventListener('input', () => alCambiar(editor.value))
  void import('@lib/editor/editor-c').then(({ crearEditorC }) => {
    const host = document.createElement('div')
    host.className = 'sem-editor-host'
    editor.after(host)
    editor.hidden = true
    const cm = crearEditorC(host, {
      valor: editor.value,
      alCambiar,
      lint: (t) => parsear(t, spec).errores,
    })
    codigo.get = cm.getValue
    codigo.set = cm.setValue
  })
  return codigo
}

function init(box: HTMLElement): void {
  const spec = JSON.parse($('[data-sem-spec]', box)!.textContent!) as EjercicioSemaforos
  const clave = `${rutaActual()}#sem-${box.dataset.semClave}`
  const editor = $<HTMLTextAreaElement>('[data-sem-editor]', box)!
  const salida = $<HTMLElement>('[data-sem-resultados]', box)!
  const resolucion = $<HTMLElement>('[data-sem-resolucion]', box)!
  const boton = $<HTMLButtonElement>('[data-sem-accion="resolucion"]', box)!
  const original = editor.dataset.semPlantilla ?? editor.value

  // la plantilla sin tocar no se guarda como borrador
  const guardar = (t: string) => guardarBorrador(clave, t === original ? null : t)
  const codigo = montarEditor(editor, spec, leerBorrador(clave) ?? original, guardar)

  const control = controlarResolucion({
    boton,
    clave,
    mostrar: () => (resolucion.hidden = false),
    ocultar: () => {
      resolucion.hidden = true
      salida.replaceChildren()
    },
  })
  if (estaResuelto(clave))
    mensaje(salida, 'Ya lo resolviste antes. Podés volver a intentarlo.', 'var(--muted)')

  box.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-sem-accion]')?.dataset
      .semAccion
    if (accion === 'restablecer') {
      codigo.set(original)
      salida.replaceChildren()
    } else if (accion === 'verificar') {
      mensaje(salida, 'Probando todas las intercalaciones…', 'var(--muted)')
      // cede un frame para que se pinte el mensaje antes de la exploración (puede tardar ~1 s)
      setTimeout(() => {
        const r = verificarSemaforos(codigo.get(), spec)
        pintar(salida, r)
        if (r.ok) {
          guardarBorrador(clave, null)
          control.acerto()
        }
      }, 20)
    }
  })
}

/** Semáforos dentro de un simulacro: sin tests ni borrador; se corrige y se revela al finalizar. */
export function crearSemaforosExamen(box: HTMLElement): ItemExamen {
  const spec = JSON.parse($('[data-sem-spec]', box)!.textContent!) as EjercicioSemaforos & {
    solucion: string
  }
  const editor = $<HTMLTextAreaElement>('[data-sem-editor]', box)!
  const salida = $<HTMLElement>('[data-sem-resultados]', box)!
  const original = editor.dataset.semPlantilla ?? editor.value
  const codigo = montarEditor(editor, spec, original, () => {})
  let resultado: PuntajeSemaforos | null = null

  box.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-sem-accion]')?.dataset
      .semAccion
    if (accion === 'restablecer') codigo.set(original)
  })

  return {
    async puntaje() {
      mensaje(salida, 'Corrigiendo…', 'var(--muted)')
      // cede un frame para que se pinte el mensaje antes de la exploración
      await new Promise((r) => setTimeout(r, 20))
      resultado = puntajeSemaforos(codigo.get(), spec)
      return resultado.puntaje
    },
    revelar() {
      box.classList.add('sem-bloqueado')
      $<HTMLElement>('[data-sem-accion="restablecer"]', box)?.setAttribute('hidden', '')
      if (resultado) pintar(salida, resultado.verificacion)
      if (resultado?.seccionCriticaDeMas) {
        const nota = document.createElement('p')
        nota.className = 'text-sm text-warn'
        nota.textContent =
          'La sección crítica abarca más de lo necesario: hay acciones que no tocan nada compartido dentro de un mutex.'
        salida.append(nota)
      }
      $<HTMLElement>('[data-sem-resolucion]', box)!.hidden = false
    },
  }
}

function mensaje(salida: HTMLElement, texto: string, color: string) {
  const p = document.createElement('p')
  p.className = 'text-sm'
  p.style.color = color
  p.textContent = texto
  salida.replaceChildren(p)
}

function pintar(salida: HTMLElement, r: ResultadoVerificacion) {
  if (r.errores.length) {
    const lista = document.createElement('ul')
    lista.className = 'sem-errores'
    for (const e of r.errores) {
      const li = document.createElement('li')
      li.textContent = e.linea ? `Línea ${e.linea}: ${e.mensaje}` : e.mensaje
      lista.append(li)
    }
    const titulo = document.createElement('p')
    titulo.className = 'text-sm font-medium text-bad'
    titulo.textContent = r.errores.every((e) => e.ejecucion) ? 'Falla al ejecutar' : 'No compila'
    salida.replaceChildren(titulo, lista)
    return
  }
  const pasados = r.tests.filter((t) => t.ok).length
  const titulo = document.createElement('p')
  titulo.className = `text-sm font-medium ${r.ok ? 'text-ok' : 'text-bad'}`
  titulo.textContent = r.ok
    ? `¡Correcto! ${pasados}/${r.tests.length} tests pasados.`
    : `${pasados}/${r.tests.length} tests pasados.`
  const lista = document.createElement('ul')
  lista.className = 'sem-tests'
  for (const t of r.tests) {
    const li = document.createElement('li')
    li.dataset.ok = String(t.ok)
    li.textContent = t.nombre
    if (t.motivo) {
      const por = document.createElement('p')
      por.className = 'sem-motivo'
      por.textContent = t.motivo
      li.append(por)
    }
    lista.append(li)
  }
  salida.replaceChildren(titulo, lista)
  if (r.acotada) {
    const nota = document.createElement('p')
    nota.className = 'text-xs text-muted'
    nota.textContent = 'Nota: el espacio de estados es muy grande; se exploró hasta un límite.'
    salida.append(nota)
  }
}
