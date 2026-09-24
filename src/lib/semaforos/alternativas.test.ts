/** Soluciones de resoluciones oficiales contra el verificador: las correctas pasan, las erradas fallan. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { verificarSemaforos } from './explorar'
import type { EjercicioSemaforos } from './tipos'

const desafio = (rel: string, i = 0): EjercicioSemaforos => {
  const texto = readFileSync(`src/content/ejercicios/${rel}`, 'utf8')
  return parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1]).semaforos[i]
}
const fallidos = (codigo: string, d: EjercicioSemaforos) => {
  const r = verificarSemaforos(codigo, d)
  expect(r.errores).toEqual([])
  return r.tests.filter((t) => !t.ok).map((t) => t.nombre)
}

describe('soluciones alternativas correctas', () => {
  it('Málaga: la solución oficial de 4 semáforos con wait x3 también pasa', () => {
    const oficial = `semaphore sem_m = 3, sem_a = 0, sem_l = 2, sem_g = 1;
void M() {
  while(1){
    wait(sem_m)x3;
    print("M");
    signal(sem_a);
  }
}
void A() {
  while(1){
    wait(sem_a);
    print("A");
    signal(sem_l);
    signal(sem_g);
    signal(sem_m);
  }
}
void L() {
  while(1){
    wait(sem_l)x3;
    print("L");
    signal(sem_a);
  }
}
void G() {
  while(1){
    wait(sem_g)x3;
    print("G");
    signal(sem_a);
  }
}`
    expect(fallidos(oficial, desafio('sincronizacion/ej-15.md'))).toEqual([])
  }, 60000)
})

describe('resoluciones oficiales con errores (el verificador las tiene que rechazar)', () => {
  it('CANADA CAMPEON (1R 1C2026 TM): A habilita a C en cada vuelta y C puede repetir antes que N', () => {
    const oficial = `semaphore semA = 0, semC = 1, semN = 2, semD = 1, semCAMPEON = 0;
void A() {
  while(1){
    wait(semA);
    print("A");
    signal(semC);
    signal(semN);
    signal(semD);
    signal(semCAMPEON);
  }
}
void C() {
  while(1){
    wait(semC);
    print("C");
    signal(semA);
  }
}
void N() {
  while(1){
    wait(semN)x3;
    print("N");
    signal(semA);
  }
}
void D() {
  while(1){
    wait(semD)x3;
    print("D");
    signal(semA);
  }
}
void CAMPEON() {
  while(1){
    wait(semCAMPEON)x3;
    print(" CAMPEON");
    signal(semC);
  }
}`
    expect(fallidos(oficial, desafio('sincronizacion/ej-14.md'))).toContain(
      'Se imprime la secuencia pedida, en orden, para siempre',
    )
  }, 60000)
})

const solucionDe = (rel: string, i = 0): string => {
  const texto = readFileSync(`src/content/ejercicios/${rel}`, 'utf8')
  return parse(texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)![1]).semaforos[i].solucion
}

describe('afirmaciones de las justificaciones de parcial', () => {
  it('B-A-C (1P 1C2026 TM b): sacando mutexAcum se sigue cumpliendo la consigna', () => {
    const d = { ...desafio('sincronizacion/ej-18.md'), soloInicializar: false }
    const sinMutex = solucionDe('sincronizacion/ej-18.md')
      .replace(', mutexAcum = 1', '')
      .split('\n')
      .filter((l) => !/mutexAcum/.test(l))
      .join('\n')
    expect(fallidos(sinMutex, d)).toEqual([])
  })

  it('productor-consumidor (1P 1C2026 TT): SC = 4 no llega a llenar la lista', () => {
    const d = desafio('sincronizacion/ej-19.md')
    const conCuatro = solucionDe('sincronizacion/ej-19.md').replace('SC = 5', 'SC = 4')
    expect(fallidos(conCuatro, d)).toEqual(['La lista puede llenarse hasta 5 elementos'])
  })

  it('productor-consumidor: invertir X1 y X2 traba al consumidor con el mutex tomado', () => {
    const d = desafio('sincronizacion/ej-19.md')
    const invertido = solucionDe('sincronizacion/ej-19.md').replace(
      '  wait(SA);\n  wait(SB);\n  elemento = retirar',
      '  wait(SB);\n  wait(SA);\n  elemento = retirar',
    )
    expect(invertido).not.toEqual(solucionDe('sincronizacion/ej-19.md'))
    expect(fallidos(invertido, d).length).toBeGreaterThan(0)
  })

  it('TORO: si O espera SEM_Z en vez de SEM_Y, se rompe la secuencia', () => {
    const d = desafio('sincronizacion/ej-20.md')
    const mal = solucionDe('sincronizacion/ej-20.md').replace(
      '    wait(SEM_Y);\n    agregarAlFinal(COLA, "O");',
      '    wait(SEM_Z);\n    agregarAlFinal(COLA, "O");',
    )
    expect(mal).not.toEqual(solucionDe('sincronizacion/ej-20.md'))
    expect(fallidos(mal, d).length).toBeGreaterThan(0)
  })
})

describe('trazas del 1R 1C2025 TM Ej. 3 (el MC dice que hay deadlock y carrera sobre ultValor)', () => {
  const ej: EjercicioSemaforos = {
    procesos: [
      { nombre: 'A', instancias: 1, codigo: 'while(true){\n  acum += ultValor;\n  ultValor = 0;\n}' },
      { nombre: 'B', instancias: 1, codigo: 'while(true){\n  ultValor = generarValor();\n}' },
      { nombre: 'C', instancias: 1, codigo: 'while(true){\n  printf(Acumulado: %d, acum);\n}' },
    ],
    acciones: {
      'acum += ultValor': { recursos: ['acum', 'ultValor'] },
      'ultValor = 0': { recursos: ['ultValor'] },
      'ultValor = generarValor()': { recursos: ['ultValor'] },
      'printf(Acumulado: %d, acum)': { recursos: ['acum'] },
    },
    tests: [
      { tipo: 'sin-deadlock' },
      { tipo: 'exclusion', recurso: 'ultValor' },
      { tipo: 'exclusion', recurso: 'acum' },
    ],
  }
  const dado = `semaphore mutexAcum = 1, valorGenerado = 0, valorLeido = 2;
void A() {
  while(true){
    wait(mutexAcum);
    wait(valorGenerado);
    acum += ultValor;
    ultValor = 0;
    signal(valorLeido) x2;
    signal(mutexAcum);
  }
}
void B() {
  while(true){
    wait(valorLeido);
    ultValor = generarValor();
    signal(valorGenerado);
  }
}
void C() {
  while(true){
    wait(valorLeido);
    wait(mutexAcum);
    printf(Acumulado: %d, acum);
    signal(mutexAcum);
  }
}`
  it('hay deadlock y carrera sobre ultValor, pero no sobre acum', () => {
    expect(fallidos(dado, ej)).toEqual([
      'Nunca quedan todos bloqueados (sin deadlock)',
      'Mutua exclusión sobre ultValor',
      'Ningún proceso queda esperando para siempre (sin inanición)',
    ])
  })
})

describe('LyL impresión 3D: el test de turnos detecta errores de turno', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-23.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('Leonardo con un solo wait(turnoLeonardo) rompe el 3 a 1', () => {
    const mal = solucion.replace('wait(turnoLeonardo) x3;', 'wait(turnoLeonardo);')
    expect(fallidos(mal, d)).toContain('Se turnan: 3 diseños Luciano, 1 Leonardo, y así')
  })
  it('sin semáforos de turno imprimen los dos a la vez', () => {
    const mal = solucion
      .replace(/ *wait\(turno\w+\)( x3)?;\n/g, '')
      .replace(/ *signal\(turno\w+\)( x3)?;\n/g, '')
    expect(fallidos(mal, d)).toContain('Hay una sola impresora: nunca imprimen los dos a la vez')
  })
  it('sin el límite de pedidos se superan los pendientes', () => {
    const mal = solucion.replace(/ *(wait|signal)\(limitePedidos\);\n/g, '')
    expect(fallidos(mal, d)).toContain('Nunca hay más de LIMITE pedidos pendientes ni se retira de la lista vacía')
  })
})
