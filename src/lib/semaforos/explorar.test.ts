import { describe, expect, it } from 'vitest'
import { verificarSemaforos } from './explorar'
import { parsear, plantilla } from './parser'
import type { EjercicioSemaforos } from './tipos'

const contador: EjercicioSemaforos = {
  procesos: [{ nombre: 'Hilo', instancias: 3, codigo: 'while(TRUE){\n  contador++;\n}' }],
  acciones: { 'contador++': { recursos: ['contador'] } },
  tests: [{ tipo: 'exclusion', recurso: 'contador' }, { tipo: 'sin-deadlock' }, { tipo: 'todas-ejecutan' }],
}

const impresoras: EjercicioSemaforos = {
  procesos: [
    {
      nombre: 'Proceso',
      instancias: 4,
      codigo: 'while(TRUE){\n  preparar_documento();\n  usar_impresora();\n  continuar_trabajando();\n}',
    },
  ],
  acciones: { 'preparar_documento()': {}, 'usar_impresora()': {}, 'continuar_trabajando()': {} },
  tests: [
    { tipo: 'concurrencia-max', accion: 'usar_impresora()', max: 3 },
    { tipo: 'concurrencia-alcanzable', accion: 'usar_impresora()', valor: 3 },
    { tipo: 'sin-deadlock' },
  ],
}

const alternancia: EjercicioSemaforos = {
  procesos: [
    { nombre: 'A', instancias: 1, codigo: 'while(TRUE){\n  print("A");\n}' },
    { nombre: 'B', instancias: 1, codigo: 'while(TRUE){\n  print("B");\n}' },
  ],
  acciones: { 'print("A")': {}, 'print("B")': {} },
  tests: [{ tipo: 'secuencia', acciones: ['print("A")', 'print("B")'] }, { tipo: 'sin-deadlock' }],
}

const productorConsumidor: EjercicioSemaforos = {
  procesos: [
    { nombre: 'Compilador', instancias: 2, codigo: 'while(TRUE){\n  depositar_resultado(r, lista);\n}' },
    { nombre: 'Notificador', instancias: 1, codigo: 'while(TRUE){\n  retirar_resultado(lista);\n}' },
  ],
  acciones: {
    'depositar_resultado(r, lista)': { recursos: ['lista'], efecto: { items: 1 } },
    'retirar_resultado(lista)': { recursos: ['lista'], efecto: { items: -1 } },
  },
  variables: { items: 0 },
  tests: [
    { tipo: 'exclusion', recurso: 'lista' },
    { tipo: 'rango', variable: 'items', min: 0, max: 2 },
    { tipo: 'sin-deadlock' },
  ],
}

/** Arma un programa con la sintaxis del editor: `void Nombre() { while(TRUE){ ... } }`. */
function prog(declaraciones: string, funciones: Record<string, string[]>): string {
  const cuerpo = Object.entries(funciones).map(
    ([f, lineas]) => `void ${f}() {\n  while(TRUE){\n${lineas.map((l) => `    ${l}`).join('\n')}\n  }\n}`,
  )
  return [declaraciones, '', ...cuerpo].join('\n')
}

const fallidos = (fuente: string, ej: EjercicioSemaforos) =>
  verificarSemaforos(fuente, ej).tests.filter((t) => !t.ok).map((t) => t.nombre)
const mensajes = (fuente: string, ej: EjercicioSemaforos) =>
  parsear(fuente, ej).errores.map((e) => e.mensaje)

const MUTEX = ['wait(m);', 'contador++;', 'signal(m);']

describe('parser y linter', () => {
  it('la plantilla usa funciones void y parsea sin errores', () => {
    const t = plantilla(contador)
    expect(t).toContain('void Hilo() {')
    expect(parsear(t, contador).errores).toEqual([])
  })

  it('exige declarar e inicializar los semáforos usados', () => {
    expect(mensajes(prog('', { Hilo: MUTEX }), contador)).toContain(
      'El semáforo m no está declarado/inicializado',
    )
  })

  it('rechaza valores iniciales negativos', () => {
    expect(mensajes(prog('semaphore m = -1;', { Hilo: MUTEX }), contador)[0]).toMatch(/negativo/)
  })

  it('no permite modificar el código original', () => {
    expect(mensajes(prog('', { Hilo: ['contador--;'] }), contador).some((m) => /no reconocida/.test(m))).toBe(true)
  })

  it('marca los ";" que faltan', () => {
    const m = mensajes(prog('semaphore m = 1', { Hilo: ['wait(m)', 'contador++', 'signal(m);'] }), contador)
    expect(m.filter((x) => /Falta ";"/.test(x))).toHaveLength(3)
  })

  it('marca llaves sin cerrar y que sobran', () => {
    const sinCerrar = 'semaphore m = 1;\nvoid Hilo() {\n  while(TRUE){\n    contador++;\n  }\n'
    expect(mensajes(sinCerrar, contador)).toContain('Falta cerrar la llave "{" abierta acá')
    expect(mensajes(`${prog('semaphore m = 1;', { Hilo: MUTEX })}\n}`, contador)).toContain('Sobra una llave "}"')
  })

  it('wait y signal van en minúscula', () => {
    expect(mensajes(prog('semaphore m = 1;', { Hilo: ['Wait(m);', 'contador++;', 'signal(m);'] }), contador)).toContain(
      'Se escribe "wait" en minúscula',
    )
  })

  it('el nombre del semáforo no importa', () => {
    const f = prog('semaphore cualquierCosa = 1;', {
      Hilo: ['wait(cualquierCosa);', 'contador++;', 'signal(cualquierCosa);'],
    })
    expect(verificarSemaforos(f, contador).ok).toBe(true)
  })
})

describe('verificarSemaforos', () => {
  it('Ej. 1: mutex correcto pasa todo', () => {
    expect(verificarSemaforos(prog('semaphore m = 1;', { Hilo: MUTEX }), contador).ok).toBe(true)
  })

  it('Ej. 1: sin sincronizar rompe la mutua exclusión', () => {
    expect(fallidos(plantilla(contador), contador)).toEqual(['Mutua exclusión sobre contador'])
  })

  it('Ej. 1: mutex en 0 queda en deadlock', () => {
    expect(fallidos(prog('semaphore m = 0;', { Hilo: MUTEX }), contador)).toContain(
      'Nunca quedan todos bloqueados (sin deadlock)',
    )
  })

  it('Ej. 3: contador en 3 pasa; un mutex es demasiado restrictivo', () => {
    const conValor = (n: number) =>
      prog(`semaphore imp = ${n};`, {
        Proceso: ['preparar_documento();', 'wait(imp);', 'usar_impresora();', 'signal(imp);', 'continuar_trabajando();'],
      })
    expect(verificarSemaforos(conValor(3), impresoras).ok).toBe(true)
    expect(fallidos(conValor(1), impresoras)).toEqual(['Permite 3 a la vez en usar_impresora()'])
    expect(fallidos(conValor(4), impresoras)).toEqual(['Nunca hay más de 3 a la vez en usar_impresora()'])
  })

  it('Ej. 6: alternancia A-B con dos semáforos', () => {
    const conValores = (a: number, b: number) =>
      prog(`semaphore sa = ${a}, sb = ${b};`, {
        A: ['wait(sa);', 'print("A");', 'signal(sb);'],
        B: ['wait(sb);', 'print("B");', 'signal(sa);'],
      })
    expect(verificarSemaforos(conValores(1, 0), alternancia).ok).toBe(true)
    expect(fallidos(conValores(0, 1), alternancia)).toEqual(['Respeta la secuencia print("A") → print("B") → …'])
  })

  it('Ej. 10b: productor-consumidor con buffer acotado', () => {
    const compilador = ['wait(vacios);', 'wait(mutex);', 'depositar_resultado(r, lista);', 'signal(mutex);', 'signal(llenos);']
    const notificador = ['wait(llenos);', 'wait(mutex);', 'retirar_resultado(lista);', 'signal(mutex);', 'signal(vacios);']
    const decl = 'semaphore mutex = 1, llenos = 0, vacios = 2;'
    expect(verificarSemaforos(prog(decl, { Compilador: compilador, Notificador: notificador }), productorConsumidor).ok).toBe(true)
    // el orden de los wait importa: mutex antes que vacios puede trabar todo
    const invertido = ['wait(mutex);', 'wait(vacios);', ...compilador.slice(2)]
    expect(fallidos(prog(decl, { Compilador: invertido, Notificador: notificador }), productorConsumidor)).toContain(
      'Nunca quedan todos bloqueados (sin deadlock)',
    )
    expect(fallidos(prog(decl, { Compilador: compilador, Notificador: notificador.slice(1) }), productorConsumidor)).toContain(
      'items se mantiene entre 0 y 2',
    )
  })
})

describe('código fuera del while(TRUE)', () => {
  it('es válido sintácticamente, pero el wait de afuera deja a los demás hilos bloqueados', () => {
    const f = 'semaphore m = 1;\nvoid Hilo() {\n  wait(m);\n  while(TRUE){\n    contador++;\n  }\n}'
    expect(parsear(f, contador).errores).toEqual([])
    const r = verificarSemaforos(f, contador)
    const t = r.tests.find((x) => !x.ok)!
    expect(t.nombre).toMatch(/inanición/)
    expect(t.motivo).toMatch(/wait\(m\) \(línea 3\).*antes del while/)
  })

  it('una función sin while termina y no cuenta como deadlock', () => {
    const f = 'semaphore m = 1;\nvoid Hilo() {\n  wait(m);\n  contador++;\n  signal(m);\n}'
    expect(fallidos(f, contador)).toEqual([])
  })
})

describe('motivos de falla', () => {
  it('la exclusión fallida dice qué líneas se superponen', () => {
    const r = verificarSemaforos(plantilla(contador), contador)
    expect(r.tests[0].motivo).toMatch(/contador\+\+ \(línea \d+\) y contador\+\+/)
  })

  it('el deadlock dice dónde queda bloqueado cada uno', () => {
    const r = verificarSemaforos(prog('semaphore m = 0;', { Hilo: MUTEX }), contador)
    expect(r.tests.find((t) => /deadlock/.test(t.nombre))!.motivo).toMatch(/Hilo en wait\(m\)/)
  })
})
