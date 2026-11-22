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

// fat-ufs ej-49, tablero links-M1 (directorios apilados, flecha del soft link por adentro)
describe('recorridoLinks con varios directorios', () => {
  const r49 = recorridoLinks({
    titulo: 'Links de /etc/fixture.txt',
    inicial: [{ ruta: '/etc/fixture.txt', inodo: '5' }],
    operaciones: [
      { ln: '/etc/fixture.txt', a: '/var/h-fixture.txt' },
      { lns: '/etc/fixture.txt', a: '/temp/s-fixture.txt', inodo: '6' },
      { rm: '/etc/fixture.txt' },
      { rm: '/var/h-fixture.txt' },
    ],
  })
  const h = renderRecorrido(r49)
  const f3 = h.split('data-el="paso-3"')[1].split('data-el="paso-')[0]

  it('una caja por directorio, apiladas en el orden en que aparecen', () => {
    const ys = ['/etc', '/var', '/temp'].map((d) => {
      const m = f3.match(new RegExp(String.raw`y="(\d+)"[^>]*>directorio ${d}<`))
      return Number(m![1])
    })
    expect(ys).toEqual([...ys].sort((a, b) => a - b))
  })

  it('el texto del rm es el de M1', () => {
    expect(r49.pasos![3].texto).toBe(
      'Borrar **fixture.txt** quita **esa entrada** de /etc y baja el contador del inodo 5 de 2 a **1**. Como no llegó a 0, el inodo y sus bloques siguen: **/var/h-fixture.txt** abre el mismo contenido. **/temp/s-fixture.txt** guarda la ruta `/etc/fixture.txt`, que ya no existe: queda **colgado**.',
    )
  })

  it('las tarjetas de inodo no se pisan', () => {
    const cards = [
      ...f3.matchAll(
        /class="lk-inodo[^"]*"><rect x="\d+" y="(\d+(?:\.\d+)?)" width="\d+" height="(\d+)"/g,
      ),
    ].map((m) => [Number(m[1]), Number(m[2])])
    expect(cards).toHaveLength(2)
    expect(cards[0][0] + cards[0][1]).toBeLessThanOrEqual(cards[1][0])
    expect(f3).toContain('6 apunta por ruta')
  })
})

// fat-ufs ej-20: un soft link en otro volumen, columnas lado a lado
describe('recorridoLinks con dos volúmenes', () => {
  const r20 = recorridoLinks({
    titulo: 'Links en dos volúmenes',
    volumenes: [
      { nombre: 'A', directorios: ['/datos'] },
      { nombre: 'B', directorios: ['/backup'] },
    ],
    inicial: [{ ruta: '/datos/informe.txt', inodo: 'I' }],
    operaciones: [
      { ln: '/datos/informe.txt', a: '/datos/copia.txt' },
      { lns: '/datos/informe.txt', a: '/datos/acceso.txt', inodo: 'S' },
      { lns: '/datos/informe.txt', a: '/backup/informe_link.txt', inodo: 'S2' },
      { rm: '/datos/informe.txt' },
    ],
  })
  const h = renderRecorrido(r20)
  const f4 = h.split('data-el="paso-4"')[1].split('data-el="paso-')[0]

  it('una columna por volumen, con su título', () => {
    expect(f4).toContain('Volumen A')
    expect(f4).toContain('Volumen B')
    const x = (d: string) =>
      Number(f4.match(new RegExp(String.raw`x="(\d+)"[^>]*>directorio ${d}<`))![1])
    expect(x('/backup')).toBeGreaterThan(x('/datos') + 400)
    expect(r20.ancho).toBeGreaterThan(820)
  })

  it('el soft link de B llega a la entrada de A por el carril de arriba', () => {
    expect(f4).toContain('S2 apunta por ruta')
    expect(f4).toMatch(/lk-flecha-soft"><path d="M [\d.]+ [\d.]+ L [\d.]+ [\d.]+ L [\d.]+ 42 /)
    expect(r20.pasos![4].texto).toContain('**/backup/informe_link.txt** guarda la ruta')
  })
})

// fat-ufs ej-22: c), d) y e) arrancan del mismo estado → una pestaña por inciso
describe('recorridoLinks con escenarios', () => {
  const r22 = recorridoLinks({
    titulo: 'Versión por defecto con hard link',
    inicial: [{ ruta: '/usr/lib/java17/bin/java', inodo: 'J17' }],
    operaciones: [{ ln: '/usr/lib/java17/bin/java', a: '/etc/alternatives/java' }],
    escenarios: [
      { nombre: 'c) rm java17', operaciones: [{ rm: '/usr/lib/java17/bin/java' }] },
      { nombre: 'd) rm del link', operaciones: [{ rm: '/etc/alternatives/java' }] },
      {
        nombre: 'e) rm de los dos',
        operaciones: [{ rm: '/usr/lib/java17/bin/java' }, { rm: '/etc/alternatives/java' }],
      },
    ],
  })
  const h = renderRecorrido(r22)

  it('una pestaña por escenario, cada una con los pasos comunes y los suyos', () => {
    expect(r22.pasos).toBeUndefined()
    expect(r22.variantes!.map((v) => [v.nombre, v.pasos.length])).toEqual([
      ['c) rm java17', 3],
      ['d) rm del link', 3],
      ['e) rm de los dos', 4],
    ])
    expect(r22.variantes![1].pasos[2].titulo).toBe('rm /etc/alternatives/java')
    expect(h).toContain('data-rc-pestana="2"')
  })

  it('cada escenario tiene sus fotogramas y su resumen de pasos', () => {
    expect(h).toContain('data-el="e2-paso-3"')
    expect(h).toContain(
      'Pasos: inicial · ln · rm /usr/lib/java17/bin/java · rm /etc/alternatives/java',
    )
    expect(r22.variantes![2].pasos[3].texto).toContain('Llegó a 0')
  })
})
