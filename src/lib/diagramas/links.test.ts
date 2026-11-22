import { describe, expect, it } from 'vitest'
import { abre, simularLinks, type SpecLinksSim } from './links'

// fat-ufs ej-19: hard link, soft link, se borra el original y después la copia
const ej19: SpecLinksSim = {
  inicial: [{ ruta: '/datos/informe.txt', inodo: 'I' }],
  operaciones: [
    { ln: '/datos/informe.txt', a: '/datos/copia.txt' },
    { lns: '/datos/informe.txt', a: '/datos/acceso.txt', inodo: 'S' },
    { rm: '/datos/informe.txt' },
    { rm: '/datos/copia.txt' },
  ],
}

describe('simularLinks', () => {
  const pasos = simularLinks(ej19)
  const ino = (k: number, id: string) => pasos[k].inodos.find((i) => i.id === id)!

  it('un paso por operación más el inicial', () => {
    expect(pasos).toHaveLength(5)
    expect(pasos[0].op).toBeNull()
  })

  it('ln suma una entrada al mismo inodo y sube el contador', () => {
    expect(pasos[1].entradas.map((e) => [e.nombre, e.inodo, e.tipo])).toEqual([
      ['informe.txt', 'I', 'original'],
      ['copia.txt', 'I', 'hard link'],
    ])
    expect(ino(1, 'I')).toMatchObject({ antes: 1, contador: 2 })
    expect(pasos[1].afectado).toBe('I')
  })

  it('ln -s crea un inodo propio que guarda la ruta, sin tocar el contador del destino', () => {
    expect(ino(2, 'S')).toMatchObject({ tipo: 'soft', contador: 1, destino: '/datos/informe.txt' })
    expect(ino(2, 'I').contador).toBe(2)
    expect(abre(pasos[2], '/datos/acceso.txt')).toBe('sí')
  })

  it('rm del original: baja el contador y el soft link queda colgado', () => {
    const p = pasos[3]
    expect(p.entradas[0]).toMatchObject({ nombre: 'informe.txt', borrada: 'ahora' })
    expect(ino(3, 'I')).toMatchObject({ antes: 2, contador: 1, liberado: false })
    expect(abre(p, '/datos/informe.txt')).toBe('no existe')
    expect(abre(p, '/datos/copia.txt')).toBe('sí')
    expect(abre(p, '/datos/acceso.txt')).toBe('no: colgado')
  })

  it('rm de la última entrada libera el inodo; la borrada antes queda como "antes"', () => {
    expect(ino(4, 'I')).toMatchObject({ antes: 1, contador: 0, liberado: true })
    expect(pasos[4].entradas.map((e) => e.borrada)).toEqual(['antes', 'ahora', null])
  })

  it('con volúmenes: cada entrada sabe el suyo y el soft link resuelve entre volúmenes', () => {
    const p = simularLinks({
      volumenes: [
        { nombre: 'A', directorios: ['/datos'] },
        { nombre: 'B', directorios: ['/backup'] },
      ],
      inicial: [{ ruta: '/datos/informe.txt', inodo: 'I' }],
      operaciones: [{ lns: '/datos/informe.txt', a: '/backup/informe_link.txt', inodo: 'S' }],
    })
    expect(p[1].inodos.map((i) => i.volumen)).toEqual(['A', 'B'])
    expect(abre(p[1], '/backup/informe_link.txt')).toBe('sí')
  })
})

describe('simularLinks: lo que rompe el build', () => {
  const vols = [
    { nombre: 'A', directorios: ['/datos'] },
    { nombre: 'B', directorios: ['/backup'] },
  ]
  const ini = [{ ruta: '/datos/informe.txt', inodo: 'I' }]

  it('un hard link entre volúmenes', () => {
    expect(() =>
      simularLinks({
        volumenes: vols,
        inicial: ini,
        operaciones: [{ ln: '/datos/informe.txt', a: '/backup/x.txt' }],
      }),
    ).toThrow('un hard link no cruza volúmenes')
  })

  it('una ruta que no existe, o que ya existe', () => {
    expect(() => simularLinks({ inicial: ini, operaciones: [{ rm: '/datos/otro.txt' }] })).toThrow(
      'que no existe',
    )
    expect(() =>
      simularLinks({
        inicial: ini,
        operaciones: [{ ln: '/datos/informe.txt', a: '/datos/informe.txt' }],
      }),
    ).toThrow('ya existe')
  })

  it('un inodo repetido en ln -s', () => {
    expect(() =>
      simularLinks({
        inicial: ini,
        operaciones: [{ lns: '/datos/informe.txt', a: '/datos/s.txt', inodo: 'I' }],
      }),
    ).toThrow('el inodo I ya existe')
  })

  it('un directorio que no está en ningún volumen', () => {
    expect(() =>
      simularLinks({
        volumenes: vols,
        inicial: [{ ruta: '/tmp/a.txt', inodo: 'I' }],
        operaciones: [],
      }),
    ).toThrow('no está en ningún volumen')
  })
})
