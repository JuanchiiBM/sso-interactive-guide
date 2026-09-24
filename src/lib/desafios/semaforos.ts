/** Editor de semáforos: corre los tests del verificador y bloquea la solución hasta pasarlos. */
import { $, $$ } from '@lib/dom'
import { verificarSemaforos } from '@lib/semaforos/explorar'
import { parsear } from '@lib/semaforos/parser'
import type { EjercicioSemaforos, ResultadoVerificacion } from '@lib/semaforos/tipos'
import { estaResuelto } from '@lib/progreso'
import { controlarResolucion } from '@lib/desafios/boton-resolucion'

export function initSemaforos(): void {
  for (const box of $$<HTMLElement>('[data-sem]')) init(box)
}

// v2: sintaxis void func() { }; los borradores v1 (proceso X:) ya no parsean
const BORRADOR = 'so:borrador:v2:'

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(BORRADOR + clave)
  } catch {
    return null
  }
}

function guardar(clave: string, texto: string): void {
  try {
    localStorage.setItem(BORRADOR + clave, texto)
  } catch {}
}

function init(box: HTMLElement): void {
  const spec = JSON.parse($('[data-sem-spec]', box)!.textContent!) as EjercicioSemaforos
  const clave = `${location.pathname}#sem-${box.dataset.semClave}`
  const editor = $<HTMLTextAreaElement>('[data-sem-editor]', box)!
  const salida = $<HTMLElement>('[data-sem-resultados]', box)!
  const resolucion = $<HTMLElement>('[data-sem-resolucion]', box)!
  const boton = $<HTMLButtonElement>('[data-sem-accion="resolucion"]', box)!
  const original = editor.dataset.semPlantilla ?? editor.value

  // el textarea es el respaldo si CodeMirror no carga; con CodeMirror, el código vive en el editor
  let codigo = {
    get: () => editor.value,
    set: (t: string) => {
      editor.value = t
    },
  }
  editor.value = leer(clave) ?? original
  editor.addEventListener('input', () => guardar(clave, editor.value))
  void import('@lib/editor/editor-c').then(({ crearEditorC }) => {
    const host = document.createElement('div')
    host.className = 'sem-editor-host'
    editor.after(host)
    editor.hidden = true
    const cm = crearEditorC(host, {
      valor: editor.value,
      alCambiar: (t) => guardar(clave, t),
      lint: (t) => parsear(t, spec).errores,
    })
    codigo = { get: cm.getValue, set: cm.setValue }
  })

  const control = controlarResolucion({
    boton,
    clave,
    mostrar: () => (resolucion.hidden = false),
    ocultar: () => {
      resolucion.hidden = true
      salida.replaceChildren()
    },
  })
  if (estaResuelto(clave)) mensaje('Ya lo resolviste antes. Podés volver a intentarlo.', 'var(--muted)')

  box.addEventListener('click', (e) => {
    const accion = (e.target as Element).closest<HTMLElement>('[data-sem-accion]')?.dataset.semAccion
    if (accion === 'restablecer') {
      codigo.set(original)
      guardar(clave, original)
      salida.replaceChildren()
    } else if (accion === 'verificar') {
      mensaje('Probando todas las intercalaciones…', 'var(--muted)')
      // cede un frame para que se pinte el mensaje antes de la exploración (puede tardar ~1 s)
      setTimeout(() => {
        const r = verificarSemaforos(codigo.get(), spec)
        pintar(r)
        if (r.ok) control.acerto()
      }, 20)
    }
  })

  function mensaje(texto: string, color: string) {
    const p = document.createElement('p')
    p.className = 'text-sm'
    p.style.color = color
    p.textContent = texto
    salida.replaceChildren(p)
  }

  function pintar(r: ResultadoVerificacion) {
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
      titulo.textContent = 'No compila'
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
}
