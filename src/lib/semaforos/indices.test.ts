/** Índices de arrays de semáforos: lo que da el enunciado se acepta y es lo único que se sugiere. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { verificarSemaforos } from './explorar'
import { parsear } from './parser'
import type { EjercicioSemaforos } from './tipos'

type ConSolucion = EjercicioSemaforos & { solucion: string }
const desafio = (rel: string, i = 0): ConSolucion => {
  const texto = readFileSync(`src/content/ejercicios/${rel}`, 'utf8')
  return parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1]).semaforos[i]
}
const conIndice = (indice: string, d: EjercicioSemaforos) =>
  parsear(`semaphore s[2] = 0;\nvoid ${d.procesos[0].nombre}() {\n  wait(s[${indice}]);\n}`, d)
    .errores
const sugerencia = (d: EjercicioSemaforos) =>
  conIndice('nada', d).find((e) => e.mensaje.startsWith('Índice desconocido'))!.mensaje
const fallidos = (codigo: string, d: EjercicioSemaforos) => {
  const r = verificarSemaforos(codigo, d)
  expect(r.errores).toEqual([])
  return r.tests.filter((t) => !t.ok).map((t) => t.nombre)
}

describe('sugerencia de índices', () => {
  it('Parranui: no muestra las variables de los tests y sí los campos del pedido', () => {
    const msj = sugerencia(desafio('sincronizacion/ej-27.md'))
    for (const interna of ['enCola', 'llamado', 'realizado', 'listo', 'stock[0]'])
      expect(msj).not.toContain(interna)
    expect(msj).toContain('pedido->cliente')
    expect(msj).toContain('pedido.sabor')
  })

  it('si el enunciado da su función de id, se sugiere esa y no id()', () => {
    const msj = sugerencia(desafio('sincronizacion/ej-24.md'))
    expect(msj).toContain('getID()')
    expect(msj).not.toMatch(/\bid\(\)/)
  })

  it('las locales ocultas del modelo no se sugieren', () => {
    expect(sugerencia(desafio('sincronizacion/ej-29.md'))).not.toMatch(/\bpedido\b/)
    expect(sugerencia(desafio('sincronizacion/ej-30.md'))).not.toContain('carrera')
  })
})

describe('índices que da el enunciado', { timeout: 60_000 }, () => {
  it('Parranui: pedido->sabor y pedido.cliente valen como idSabor e idCliente', () => {
    const d = desafio('sincronizacion/ej-27.md')
    const codigo = d.solucion
      .replace('wait(contadorSabores[idSabor])', 'wait(contadorSabores[pedido->sabor])')
      .replace('signal(pedidoListo[idCliente])', 'signal(pedidoListo[pedido.cliente])')
    expect(codigo).not.toBe(d.solucion)
    expect(fallidos(codigo, d)).toEqual([])
  })

  it('Maratón: ticket->numero vale como ticket.numero', () => {
    const d = desafio('sincronizacion/ej-30.md')
    const codigo = d.solucion.replaceAll('[ticket.numero]', '[ticket->numero]')
    expect(codigo).not.toBe(d.solucion)
    expect(fallidos(codigo, d)).toEqual([])
  })

  it('las funciones de id del enunciado compilan como índice', () => {
    const casos: [string, string][] = [
      ['sincronizacion/ej-24.md', 'getID()'],
      ['sincronizacion/ej-25.md', 'id_tecnico'],
      ['sincronizacion/ej-26.md', 'getIdEspecialidad()'],
      ['sincronizacion/ej-29.md', 'cafe->idCliente'],
      ['sincronizacion/ej-30.md', 'ticket.idCarrera'],
    ]
    for (const [rel, indice] of casos) {
      const errores = conIndice(indice, desafio(rel)).map((e) => e.mensaje)
      expect(errores.filter((m) => m.startsWith('Índice'))).toEqual([])
    }
  })
})
