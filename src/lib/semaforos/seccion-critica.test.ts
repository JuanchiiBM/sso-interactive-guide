import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { parsear, plantilla } from './parser'
import { accionesDeMas } from './seccion-critica'
import type { EjercicioSemaforos } from './tipos'

type ConSolucion = EjercicioSemaforos & { solucion: string }
const desafio = (rel: string): ConSolucion => {
  const texto = readFileSync(`src/content/ejercicios/${rel}`, 'utf8')
  return parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1]).semaforos[0]
}
const medir = (codigo: string, d: EjercicioSemaforos) => {
  const { programa, errores } = parsear(codigo, d)
  expect(errores).toEqual([])
  return accionesDeMas(programa, d)
}

describe('accionesDeMas', () => {
  const z = desafio('sincronizacion/ej-21.md')

  it('la resolución de la red social "Z" no deja nada de más en la sección crítica', () => {
    expect(medir(z.solucion, z)).toBe(0)
  })

  it('el código original de "Z" deja 4 acciones de más dentro del mutex', () => {
    // Usuario: generarPost y mostrarEnPantalla; Analizador: procesar y guardarEnDisco
    expect(medir(plantilla(z), z)).toBe(4)
  })

  it('agrandar la sección crítica de una solución correcta suma', () => {
    const cafe = desafio('sincronizacion/ej-29.md')
    expect(medir(cafe.solucion, cafe)).toBe(0)
    const ancha = cafe.solucion.replace(
      '    pedido = generarPedido();\n    wait(capacidadPreparador);\n    wait(mutexPendientes);\n',
      '    wait(capacidadPreparador);\n    wait(mutexPendientes);\n    pedido = generarPedido();\n',
    )
    expect(ancha).not.toBe(cafe.solucion)
    expect(medir(ancha, cafe)).toBe(1)
  })

  it('los semáforos que no son mutex (contadores, orden) no cuentan', () => {
    // LyL: los turnos (3 y 0) y los contadores rodean acciones sin recurso, pero no son exclusión
    const lyl = desafio('sincronizacion/ej-23.md')
    expect(medir(lyl.solucion, lyl)).toBe(0)
  })

  it('un semáforo de orden que arranca en 1 no es sección crítica (CASA, Málaga)', () => {
    // el proceso hace wait(C) y después signal(A): nunca libera el mismo semáforo
    for (const rel of ['deadlock/ej-06.md', 'sincronizacion/ej-15.md', 'sincronizacion/ej-06.md']) {
      const d = desafio(rel)
      expect(medir(d.solucion, d), rel).toBe(0)
    }
  })

  it('un array de mutex cuenta por posición (Vault Tec)', () => {
    const vault = desafio('sincronizacion/ej-24.md')
    expect(medir(vault.solucion, vault)).toBe(0)
    const ancha = vault.solucion.replace(
      '    caja = recibir(lider[id_asent]);\n    signal(mutexEntrega[id_asent]);\n    cargarArmas();\n',
      '    caja = recibir(lider[id_asent]);\n    cargarArmas();\n    signal(mutexEntrega[id_asent]);\n',
    )
    expect(ancha).not.toBe(vault.solucion)
    expect(medir(ancha, vault)).toBe(1)
  })
})
