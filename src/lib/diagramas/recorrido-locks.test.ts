import { describe, expect, it } from 'vitest'
import type { SpecLocks } from './locks-rr'
import { renderRecorrido } from './recorrido'
import { recorridoLocks } from './recorrido-locks'

const lector = ['open(f, read)', "var = '-'", 'lock(f)', 'read(f, var)', 'print(var)', 'unlock(f)']
// Filesystem ej-09 (2° Parcial 1C2025 TT): el caso del tablero
const ej09: SpecLocks = {
  titulo: 'Locks obligatorios compartidos',
  cerrojo: 'obligatorio',
  modo: 'compartido',
  archivo: { nombre: 'f', contenido: 'A' },
  procesos: [
    { nombre: 'P1', codigo: lector },
    {
      nombre: 'P2',
      codigo: [
        'open(f, write)',
        "var = 'B'",
        'lock(f)',
        'write(f, var)',
        'read(f, var)',
        'print(var)',
        'unlock(f)',
      ],
    },
    { nombre: 'P3', codigo: lector },
    { nombre: 'P4', codigo: ['open(f, read)', "var = '-'", 'read(f, var)', 'print(var)'] },
  ],
}

const r = recorridoLocks(ej09)
const html = renderRecorrido(r)
const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]
const col = (f: string, p: number) => f.split('class="ck-col')[p + 1]

describe('recorridoLocks (ej-09)', () => {
  it('un paso por turno de RR hasta el último print', () => {
    expect(r.pasos!.map((p) => p.titulo)).toEqual([
      'Turno de P1',
      'Turno de P2',
      'Turno de P3',
      'Turno de P4',
      'Turno de P1',
      'Turno de P3',
      'Turno de P2',
    ])
  })

  it('paso 4: columnas con estado y línea actual como en el tablero', () => {
    const f = frame(3)
    expect(col(f, 0)).toContain('>ready · con lock<')
    expect(col(f, 0)).toContain('>▸ unlock(f)<')
    expect(col(f, 0)).toContain('>print(var)  A<')
    expect(col(f, 1)).toMatch(/ck-l-bloq">.*lock\(f\)  espera ✗</)
    expect(col(f, 1)).toContain('>bloqueado<')
    expect(col(f, 3)).toMatch(/^ ck-p4 ck-activo/)
    expect(col(f, 3)).toContain('>ejecuta<')
    expect(col(f, 3)).toMatch(/ck-l-mal">.*read\(f, var\)  ✗ sin lock</)
    expect(col(f, 3)).toMatch(/ck-l-aqui">.*print\(var\)  -</)
  })

  it('paso 4: cerrojo, archivo y pantalla', () => {
    const f = frame(3)
    expect(f).toContain('>Cerrojo de f (obligatorio)<')
    expect(f).toContain('modo <tspan class="ck-b">compartido</tspan>')
    expect(f).toContain(
      'dueños: <tspan class="ck-quien ck-p1">P1</tspan>, <tspan class="ck-quien ck-p3">P3</tspan>',
    )
    expect(f).toContain('cola: <tspan class="ck-quien ck-p2">P2</tspan> pide exclusivo')
    expect(f).toContain(">'A'<")
    expect(f).toContain('>nadie escribió todavía<')
    expect(f).toContain('>P3: A<')
    expect(f).toContain('ck-nuevo" x="')
    expect(f).toContain('>P4: -  ← nuevo<')
  })

  it('tabla a completar con la fila del paso marcada', () => {
    expect(frame(3)).toContain(
      'Tabla a completar en este paso: 1.ª P1 · A · —   2.ª P3 · A · P2   <tspan class="ck-tabla-nueva">3.ª P4 · - · P2</tspan>   4.ª pendiente',
    )
    expect(frame(4)).not.toContain('ck-tabla-nueva')
  })

  it('texto del paso 4 del tablero', () => {
    expect(r.pasos![3].texto).toBe(
      "**P4 hace `read` sin pedir el lock.** Como el cerrojo es **obligatorio**, el SO rechaza la lectura; las syscalls no bloquean, así que **falla** y `var` sigue en `'-'`. Imprime **-**; los bloqueados siguen siendo **P2**.",
    )
  })

  it('textos de tomar, bloquear, liberar y despertar', () => {
    const t = r.pasos!.map((p) => p.texto)
    expect(t[0]).toBe(
      "**P1 toma el lock compartido** (abrió para leer; nadie lo tenía). Después lee `'A'`. Imprime **A**; no hay bloqueados. El clock lo manda a Ready **con el lock tomado**.",
    )
    expect(t[1]).toBe(
      '**P2 pide el lock exclusivo** (abrió para escribir): P1 lo tiene compartido, así que **se bloquea** en `lock`. No imprime nada.',
    )
    expect(t[2]).toContain(
      '**P3 pide el lock compartido**: es compatible con el de P1 y lo obtiene.',
    )
    expect(t[4]).toBe('**P1 hace `unlock`.** P2 sigue esperando: P3 lo tiene compartido.')
    expect(t[5]).toBe('**P3 hace `unlock`.** **P2** obtiene el lock exclusivo y pasa a Ready.')
    expect(t[6]).toBe(
      "**P2 ya tiene el lock exclusivo** (lo obtuvo cuando P3 hizo `unlock`). Después escribe `'B'` y lee `'B'`. Imprime **B**; no hay bloqueados. El clock lo manda a Ready **con el lock tomado**.",
    )
  })

  it('sugerido: el read sin lock pasa', () => {
    const s = recorridoLocks({ ...ej09, cerrojo: 'sugerido' })
    expect(s.pasos![3].texto).toContain(
      "Como el cerrojo es **sugerido**, el SO no lo controla: la lectura **pasa** y `var` queda en `'A'`.",
    )
    expect(renderRecorrido(s)).toContain('>Cerrojo de f (sugerido)<')
  })
})
