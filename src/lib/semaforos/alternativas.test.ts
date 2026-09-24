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
      {
        nombre: 'A',
        instancias: 1,
        codigo: 'while(true){\n  acum += ultValor;\n  ultValor = 0;\n}',
      },
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

describe(
  'LyL impresión 3D: el test de turnos detecta errores de turno',
  { timeout: 30_000 },
  () => {
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
      expect(fallidos(mal, d)).toContain(
        'Nunca hay más de LIMITE pedidos pendientes ni se retira de la lista vacía',
      )
    })
  },
)

describe('Vault Tec Ammo: cada semáforo tiene un test que lo exige', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-24.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('el túnel como mutex restringe de más', () => {
    const mal = solucion.replace('accesoAlmacen = 2', 'accesoAlmacen = 1')
    expect(fallidos(mal, d)).toEqual(['Pueden estar 2 en el almacén a la vez'])
  })
  it('sin entrega[id] el asentamiento recibe cajas que no le llegaron', () => {
    const mal = solucion.replace(/ *(wait|signal)\(entrega\[id_asent\]\);\n/g, '')
    expect(fallidos(mal, d)).toContain('El asentamiento 0 solo recibe cajas que le entregaron')
  })
  it('sin mutexEntrega en el asentamiento se cruzan en el líder', () => {
    const mal = solucion.replace(
      '    wait(mutexEntrega[id_asent]);\n    caja = recibir(lider[id_asent]);\n    signal(mutexEntrega[id_asent]);\n',
      '    caja = recibir(lider[id_asent]);\n',
    )
    expect(fallidos(mal, d)).toEqual(['Nadie se cruza en el líder de un mismo asentamiento'])
  })
})

describe('Laboratorio de bioquímica: un aviso por analista', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-26.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('un solo semáforo con tres signal deja que un analista se lleve dos avisos', () => {
    const mal = solucion
      .replace('semaphore reporte_publicado[3] = 0;', 'semaphore reporte_publicado = 0;')
      .replace('wait(reporte_publicado[id_especialidad]);', 'wait(reporte_publicado);')
      .replace(/signal\(reporte_publicado\[\d\]\);/g, 'signal(reporte_publicado);')
    expect(fallidos(mal, d)).toContain('El analista 0 solo revisa reportes publicados')
  })
  it('avisar antes de publicar el reporte falla', () => {
    const mal = solucion.replace(
      '    publicar_reporte();\n    signal(reporte_publicado[0]);',
      '    signal(reporte_publicado[0]);\n    publicar_reporte();',
    )
    expect(fallidos(mal, d)).toEqual(['El analista 0 solo revisa reportes publicados'])
  })
})

describe('Parranui: stock por sabor y rendezvous', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-27.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('un solo contador (signal x3) deja entregar un sabor que no hay', () => {
    const mal = solucion
      .replace('contadorSabores[3] = 0', 'stock = 0')
      .replace('wait(contadorSabores[idSabor]);', 'wait(stock);')
      .replace(
        '    signal(contadorSabores[0]);\n    signal(contadorSabores[1]);\n    signal(contadorSabores[2]);\n',
        '    signal(stock) x3;\n',
      )
    expect(fallidos(mal, d)).toContain('Nunca se entrega frutilla sin stock')
  })
  it('sin esperar el llamado el cliente pide antes de tiempo', () => {
    const mal = solucion.replace('    wait(atendido);\n', '')
    expect(fallidos(mal, d)).toContain('El cliente pide recién cuando lo llaman')
  })
})

describe('Concurren CIA: cada semáforo tiene un test que lo exige', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-28.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('la solución no queda acotada', () => {
    expect(verificarSemaforos(solucion, d).acotada).toBe(false)
  })
  it('sin cajeros_disponibles se asignan más cajas que cajeros libres', () => {
    const mal = solucion.replace('    wait(cajeros_disponibles);\n', '')
    expect(fallidos(mal, d)).toContain('Solo se asigna caja si hay un cajero desocupado')
  })
  it('un solo semáforo de productos deja que un cajero escanee una caja ajena', () => {
    const mal = solucion
      .replace('productos_depositados[CAJEROS] = 0', 'productos_depositados = 0')
      .replace('signal(productos_depositados[id_cajero]);', 'signal(productos_depositados);')
      .replace('wait(productos_depositados[getId()]);', 'wait(productos_depositados);')
    expect(fallidos(mal, d)).toContain('El cajero 0 escanea solo productos depositados')
  })
  it('el mutex alrededor de todo el cajero restringe de más', () => {
    const mal = solucion.replace(
      '    escanear_productos();\n    wait(mutex_sistema_externo);\n',
      '    wait(mutex_sistema_externo);\n    escanear_productos();\n',
    )
    expect(fallidos(mal, d)).toEqual(['Dos cajeros pueden escanear a la vez'])
  })
})

describe('Cafetería de robots: el café llega a quien lo pidió', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-29.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('la solución no queda acotada', () => {
    expect(verificarSemaforos(solucion, d).acotada).toBe(false)
  })
  it('un solo semáforo de aviso deja que un cliente se lleve el café de otro', () => {
    const mal = solucion
      .replace('tomarCafe[CLIENTES] = 0', 'listo = 0')
      .replace('wait(tomarCafe[getId()]);', 'wait(listo);')
      .replace('signal(tomarCafe[cafe.idCliente]);', 'signal(listo);')
    expect(fallidos(mal, d)).toContain('El cliente 0 toma solo el café que le sirvieron a él')
  })
  it('sin el límite de pendientes se supera la capacidad', () => {
    const mal = solucion.replace(/ *(wait|signal)\(capacidadPreparador\);\n/g, '')
    expect(fallidos(mal, d)).toContain('Nunca hay más de LIMITE pendientes ni se retira de la lista vacía')
  })
})

describe('Maratón: cada semáforo tiene un test que lo exige', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-30.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('la solución no queda acotada', () => {
    expect(verificarSemaforos(solucion, d).acotada).toBe(false)
  })
  it('soltar la terminal al escribir deja entrar a otro corredor', () => {
    const mal = solucion
      .replace('    signal(inputEscrito);\n', '    signal(terminalLibre);\n    signal(inputEscrito);\n')
      .replace('    ticket_t ticket = recibirTicket();\n    signal(terminalLibre);\n', '    ticket_t ticket = recibirTicket();\n')
    expect(fallidos(mal, d)).toEqual(['Un solo corredor a la vez usa la terminal'])
  })
  it('un solo semáforo de llamado deja posicionarse a quien no llamaron', () => {
    const mal = solucion
      .replace('llamado[CORREDORES] = 0', 'llamado = 0')
      .replace('wait(llamado[ticket.número]);', 'wait(llamado);')
      .replace('signal(llamado[numLlamar]);', 'signal(llamado);')
    expect(fallidos(mal, d)).toContain('El corredor 0 se posiciona cuando llaman a su número')
  })
})

describe('Claudio Code: el issue llega al agente dueño del PR', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-31.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('un solo semáforo de issues deja que otro agente se lleve el aviso', () => {
    const mal = solucion
      .replace('sem_issues[AGENTES] = 0', 'sem_issues = 0')
      .replace('wait(sem_issues[id()]);', 'wait(sem_issues);')
      .replace('signal(sem_issues[id_agente(pr)]);', 'signal(sem_issues);')
    expect(fallidos(mal, d)).toContain('El agente 0 solo toma issues de su PR')
  })
  it('generar el PR con el mutex de prompts tomado restringe de más', () => {
    const mal = solucion.replace(
      '    signal(mutex_prompts);\n    pr = generar_pr(prompt);\n',
      '    pr = generar_pr(prompt);\n    signal(mutex_prompts);\n',
    )
    expect(fallidos(mal, d)).toEqual(['Dos agentes pueden generar PRs a la vez'])
  })
})

describe('La Nonna: el código del dueño', { timeout: 30_000 }, () => {
  const d = desafio('sincronizacion/ej-32.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('bien inicializado pero sin corregir, hay deadlock', () => {
    const mal = solucion
      .replace('    wait(hayLugarEnMostrador);\n    wait(mutexMostrador);\n', '    wait(mutexMostrador);\n    wait(hayLugarEnMostrador);\n')
      .replace('    wait(hayPizzas);\n    wait(mutexMostrador);\n', '    wait(mutexMostrador);\n    wait(hayPizzas);\n')
    expect(fallidos(mal, d)).toContain('Nunca quedan todos bloqueados (sin deadlock)')
  })
  it('corrigiendo solo la moto sigue el deadlock del pizzero', () => {
    const mal = solucion.replace(
      '    wait(hayLugarEnMostrador);\n    wait(mutexMostrador);\n',
      '    wait(mutexMostrador);\n    wait(hayLugarEnMostrador);\n',
    )
    expect(fallidos(mal, d)).toContain('Nunca quedan todos bloqueados (sin deadlock)')
  })
  it('hayPizzas inicializado en CAPACIDAD deja sacar del mostrador vacío', () => {
    const mal = solucion.replace('hayPizzas = 0', 'hayPizzas = CAPACIDAD')
    expect(fallidos(mal, d)).toContain('El mostrador no se desborda ni se saca del vacío')
  })
})

describe('Deadlock Ej. 15: reescribir waits y signals', { timeout: 30_000 }, () => {
  const d = desafio('deadlock/ej-15.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('el Proceso 3 pidiendo b antes que a vuelve a dar deadlock', () => {
    const mal = solucion.replace(
      '    signal (sem_b);\n    wait (sem_a);\n    wait (sem_b);\n    b = a * b;',
      '    wait (sem_a);\n    b = a * b;',
    )
    expect(fallidos(mal, d)).toContain('Regla 1: no hay deadlock')
  })
  it('si el Proceso 1 retiene b hasta el final, viola la regla 2', () => {
    const mal = solucion
      .replace('    a = a * b;\n    signal (sem_b);\n    a = a + c + d;', '    a = a * b;\n    a = a + c + d;')
      .replace('    a = a + c + 1;\n    signal (sem_a);', '    a = a + c + 1;\n    signal (sem_a);\n    signal (sem_b);')
    expect(fallidos(mal, d)).toEqual(['Regla 2: se libera lo que la siguiente sentencia no usa'])
  })
  it('conservar sem_c y sem_d sobra', () => {
    const mal = solucion.replace('semaphore sem_a = 1, sem_b = 1;', 'semaphore sem_a = 1, sem_b = 1, sem_c = 1, sem_d = 1;')
    expect(fallidos(mal, d)).toEqual(['Sin semáforos de más'])
  })
})

describe('Sincronización Ej. 36: inicializar productor-consumidor', () => {
  const d = desafio('sincronizacion/ej-36.md')
  const solucion = (d as EjercicioSemaforos & { solucion: string }).solucion
  it('A y C invertidos: se recibe de la lista vacía', () => {
    const mal = solucion.replace('semaphore A = 0, B = 1, C = MAX;', 'semaphore A = MAX, B = 1, C = 0;')
    expect(fallidos(mal, d)).toContain('La lista no se desborda ni se recibe de la vacía')
  })
  it('C en 1: la lista nunca se llena', () => {
    const mal = solucion.replace('C = MAX;', 'C = 1;')
    expect(fallidos(mal, d)).toContain('La lista puede llenarse')
  })
})
