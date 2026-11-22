import { describe, expect, it } from 'vitest'
import { simularLocks, type SpecLocks } from './locks-rr'

const lector = ['open(f, read)', "var = '-'", 'lock(f)', 'read(f, var)', 'print(var)', 'unlock(f)']
const escritor = (v: string) => [
  'open(f, write)',
  `var = '${v}'`,
  'lock(f)',
  'write(f, var)',
  'read(f, var)',
  'print(var)',
  'unlock(f)',
]
// Filesystem ej-09 (2° Parcial 1C2025 TT): obligatorio y compartido
const ej09: SpecLocks = {
  titulo: 'ej-09',
  cerrojo: 'obligatorio',
  modo: 'compartido',
  archivo: { nombre: 'f', contenido: 'A' },
  procesos: [
    { nombre: 'P1', codigo: lector },
    { nombre: 'P2', codigo: escritor('B') },
    { nombre: 'P3', codigo: lector },
    { nombre: 'P4', codigo: ['open(f, read)', "var = '-'", 'read(f, var)', 'print(var)'] },
  ],
}
const salida = (spec: SpecLocks) =>
  simularLocks(spec)
    .at(-1)!
    .despues.pantalla.map(
      (i) =>
        `${spec.procesos[i.p].nombre}:${i.valor}:${i.bloqueados.map((b) => spec.procesos[b].nombre).join(',') || '—'}`,
    )

describe('simularLocks', () => {
  it('ej-09: P3 comparte con P1, P2 espera y el read sin lock de P4 falla', () => {
    expect(salida(ej09)).toEqual(['P1:A:—', 'P3:A:P2', 'P4:-:P2', 'P2:B:—'])
  })

  it('un turno por proceso hasta el print, el lock que bloquea o el final', () => {
    const t = simularLocks(ej09)
    expect(t.map((x) => x.p)).toEqual([0, 1, 2, 3, 0, 2, 1, 1])
    expect(t[1].lineas.at(-1)!.evento).toMatchObject({ tipo: 'bloquea', modo: 'exclusivo' })
    expect(t[1].despues.procesos[1].estado).toBe('bloqueado')
    expect(t[2].lineas[2].evento).toEqual({ tipo: 'toma', modo: 'compartido', con: [0] })
    expect(t[3].lineas[2].evento).toMatchObject({ tipo: 'falla', op: 'read', valor: '-' })
    // P3 suelta el último compartido: P2 se lleva el exclusivo y pasa a Ready
    expect(t[5].lineas[0].evento).toEqual({
      tipo: 'libera',
      despierta: [{ p: 1, modo: 'exclusivo' }],
    })
    expect(t[5].despues.procesos[1]).toEqual({ pc: 3, estado: 'ready', conLock: true })
    expect(t[6].despues.archivo).toBe('B')
  })

  it('ej-10: con sugerido el read sin lock pasa y lee el archivo', () => {
    const ej10: SpecLocks = {
      ...ej09,
      cerrojo: 'sugerido',
      archivo: { nombre: 'f', contenido: 'B' },
      procesos: ej09.procesos.map((p) => (p.nombre === 'P2' ? { ...p, codigo: escritor('A') } : p)),
    }
    expect(salida(ej10)).toEqual(['P1:B:—', 'P3:B:P2', 'P4:B:P2', 'P2:A:—'])
    expect(simularLocks(ej10)[3].lineas[2].evento).toMatchObject({ tipo: 'pasa', valor: 'B' })
  })

  it('exclusivo: los lectores tampoco comparten y la cola sale por orden de llegada', () => {
    expect(salida({ ...ej09, modo: 'exclusivo' })).toEqual([
      'P1:A:—',
      'P4:-:P2,P3',
      'P2:B:P3',
      'P3:B:—',
    ])
  })

  it('rompe el build con código que no sabe ejecutar', () => {
    const con = (codigo: string[]) => ({ ...ej09, procesos: [{ nombre: 'P1', codigo }] })
    expect(() => simularLocks(con(['seek(f, 0)']))).toThrow('no sé ejecutar `seek(f, 0)`')
    expect(() => simularLocks(con(['lock(g)']))).toThrow('otro archivo')
    expect(() => simularLocks(con(['unlock(f)']))).toThrow('unlock sin tener el lock')
  })
})
