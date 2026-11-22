import { describe, expect, it } from 'vitest'
import { renderRecorrido } from './recorrido'
import { recorridoLinks, type SpecLinks } from './recorrido-links'

// fat-ufs ej-19, tablero links-A (paso 4 de 5: rm del original)
const ej19: SpecLinks = {
  titulo: 'Links de /datos/informe.txt',
  inicial: [{ ruta: '/datos/informe.txt', inodo: 'I' }],
  operaciones: [
    { ln: '/datos/informe.txt', a: '/datos/copia.txt' },
    { lns: '/datos/informe.txt', a: '/datos/acceso.txt', inodo: 'S' },
    { rm: '/datos/informe.txt' },
    { rm: '/datos/copia.txt' },
  ],
}

const r = recorridoLinks(ej19)
const html = renderRecorrido(r)
const frame = (k: number) => html.split(`data-el="paso-${k}"`)[1].split('data-el="paso-')[0]
const sinTags = (s: string) => s.replace(/<[^>]+>/g, '')

describe('recorridoLinks (directorio → inodos)', () => {
  it('un paso por operación, con el resumen del tablero', () => {
    expect(r.pasos!.map((p) => p.titulo)).toEqual([
      'Estado inicial',
      'ln /datos/informe.txt /datos/copia.txt',
      'ln -s /datos/informe.txt /datos/acceso.txt',
      'rm /datos/informe.txt',
      'rm /datos/copia.txt',
    ])
    expect(html).toContain('Pasos: inicial · ln · ln -s · rm informe · rm copia')
  })

  it('el texto del rm es el del tablero', () => {
    expect(r.pasos![3].texto).toBe(
      'Borrar **informe.txt** quita **esa entrada** y baja el contador de I de 2 a **1**. Como no llegó a 0, el inodo y sus bloques siguen: **copia.txt** abre el mismo contenido. **acceso.txt** guarda la ruta `/datos/informe.txt`, que ya no existe: queda **colgado**.',
    )
  })

  it('paso 4: entrada tachada, contador 2 → 1 y soft link colgado', () => {
    const f = frame(3)
    expect(f).toContain('directorio /datos')
    expect(f.match(/lk-fila lk-fila-borrada/g)).toHaveLength(1)
    expect(f).toContain('lk-flecha lk-flecha-borrada')
    expect(f).toMatch(/lk-inodo lk-inodo-sel"[^]*Inodo I · archivo regular/)
    expect(sinTags(f)).toContain('contador de hard links: 2 → 1')
    expect(f).toContain('Bloques de datos: siguen (el contador no llegó a 0)')
    expect(f).toContain('Inodo S · soft link')
    expect(sinTags(f)).toContain('contador: 1 (no cambia)')
    expect(f).toContain('lk-bloque lk-bloque-mal')
    expect(f).toContain('bloque: &quot;/datos/informe.txt&quot;')
    expect(f).toContain('✗ ya no existe')
    expect(f).toContain('S apunta por ruta')
  })

  it('paso 4: tabla Ruta | Tipo | Inodo | ¿Abre el contenido?', () => {
    const t = sinTags(frame(3))
    expect(t).toContain('RutaTipoInodo¿Abre el contenido?')
    expect(t).toContain('/datos/informe.txt——no existe')
    expect(t).toContain('/datos/copia.txthard linkIsí')
    expect(t).toContain('/datos/acceso.txtsoft linkSno: colgado')
  })

  it('estados que el tablero no muestra', () => {
    expect(sinTags(frame(0))).toContain('contador de hard links: 1')
    expect(frame(1)).toContain('Bloques de datos: los mismos (no se copia nada)')
    expect(sinTags(frame(2))).toContain('contador: 1 (su propia entrada)')
    expect(frame(2)).toContain('✓ existe')
    const f = frame(4)
    expect(f).toContain('lk-inodo lk-inodo-sel lk-inodo-libre')
    expect(f).toContain('Bloques de datos: se liberan (el contador llegó a 0)')
    expect(f.match(/lk-fila lk-fila-antes/g)).toHaveLength(1)
    expect(r.pasos![4].texto).toContain('Llegó a 0: el SO libera el inodo y sus bloques de datos.')
  })
})
