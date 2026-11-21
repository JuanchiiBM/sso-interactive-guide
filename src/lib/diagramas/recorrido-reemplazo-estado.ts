/** Recorrido de reemplazo que arranca de un estado dado, con lectura/escritura, bits U/M y escrituras a disco. */
import {
  clockMejorado,
  reemplazoConEstado,
  type AlgoritmoConEstado,
  type InstanteUM,
  type MarcoEstado,
  type RefAcceso,
} from './memoria'
import { celdaM, rotulo } from './primitivas-memoria'
import type { Paso, Recorrido, Variante } from './recorrido'
import { texto } from './svg'

type AlgoritmoEstado = AlgoritmoConEstado | 'fifo' | 'clock'

const NOMBRE: Record<AlgoritmoEstado, string> = {
  lru: 'LRU',
  'clock-mejorado': 'Clock mejorado',
  fifo: 'FIFO',
  clock: 'Clock',
}

const COL = 56
const FILA = 30
const X0 = 116

export interface OpcionesReemplazoEstado {
  inicial: MarcoEstado[]
  /** Posición del puntero en `inicial` (Clock mejorado). */
  puntero: number
  refs: RefAcceso[]
  /** Texto de cada referencia arriba de la grilla (p. ej. la dirección virtual). */
  direcciones: string[]
  algoritmos: AlgoritmoEstado[]
  titulo: string
  /** Rótulo de cada página por número (`P2p0`), si las páginas no son números. */
  rotulos?: string[]
}

export function recorridoReemplazoEstado(o: OpcionesReemplazoEstado): Recorrido {
  const { inicial, refs } = o
  const n = inicial.length
  const cols = refs.length + 1 // columna 0 = estado inicial
  const x = (j: number) => X0 + j * COL
  const yFila = (i: number) => 66 + i * FILA
  const yPF = yFila(n) + 14
  const yDisco = yPF + 20
  const yPuntero = yDisco + 20
  const alto = yPuntero + 40
  const ancho = Math.max(720, x(cols) + 12)
  const nombreMarco = (pos: number) => `F${inicial[pos].marco}`
  const lbl = (p: number | null) => (p == null ? '' : (o.rotulos?.[p] ?? String(p)))
  const refTxt = (r: RefAcceso) =>
    r.pagina == null ? '✗' : `${lbl(r.pagina)} ${r.escritura ? 'E' : 'L'}`

  const cuerpo = [
    rotulo(X0 - 12, 14, 'Dir.'),
    rotulo(X0 - 12, 42, 'Pág.'),
    texto(x(0) + COL / 2, 42, 'Inicial', { clase: 'rm-marca' }),
    ...refs.map((r, j) =>
      [
        texto(x(j + 1) + COL / 2, 14, o.direcciones[j], { clase: 'rm-marca' }),
        celdaM(`ref-${j}`, x(j + 1), 30, COL, 24, refTxt(r), { clase: 'rm-ref rm-grilla' }),
      ].join(''),
    ),
    ...inicial.map((m, i) =>
      [
        rotulo(X0 - 12, yFila(i) + FILA / 2, `Frame ${m.marco}`),
        ...Array.from({ length: cols }, (_, j) =>
          celdaM(`m${i}-${j}`, x(j), yFila(i), COL, FILA, '', { clase: 'rm-grilla' }),
        ),
      ].join(''),
    ),
    rotulo(X0 - 12, yPF, 'PF'),
    rotulo(X0 - 12, yDisco, 'A disco'),
    rotulo(X0 - 12, yPuntero, 'Puntero'),
    ...Array.from({ length: cols }, (_, j) =>
      [
        texto(x(j) + COL / 2, yPF, '', { val: `pf-${j}`, clase: 'rm-pf' }),
        texto(x(j) + COL / 2, yDisco, '', { val: `dk-${j}`, clase: 'rm-pf' }),
        texto(x(j) + COL / 2, yPuntero, '', { val: `pt-${j}`, clase: 'rm-puntero' }),
      ].join(''),
    ),
    texto(ancho / 2, alto - 12, '', { val: 'resumen', clase: 'rm-resumen' }),
  ]

  const variantes: Variante[] = o.algoritmos.map((alg) => ({
    nombre: NOMBRE[alg],
    pasos: pasosDe(alg, reemplazoConEstado(inicial, o.puntero, refs, alg)),
  }))
  return { ancho, alto, titulo: o.titulo, cuerpo, variantes }

  function pasosDe(alg: AlgoritmoEstado, inst: InstanteUM[]): Paso[] {
    const clock = alg === 'clock-mejorado' || alg === 'clock'
    const celda = (pag: number | null, u: boolean, m: boolean) => {
      if (pag == null) return '–'
      const bits = `${clock && u ? 'U' : ''}${m ? 'M' : ''}`
      return bits ? `${lbl(pag)} ${bits}` : lbl(pag)
    }
    const estadoInicial = {
      paginas: inicial.map((m) => m.pagina),
      u: inicial.map((m) => m.u),
      m: inicial.map((m) => m.m),
      puntero: o.puntero,
    }
    const columna = (j: number, e: Pick<InstanteUM, 'paginas' | 'u' | 'm' | 'puntero'>) => {
      const v: Record<string, string> = {}
      for (let i = 0; i < n; i++) v[`m${i}-${j}`] = celda(e.paginas[i], e.u[i], e.m[i])
      if (alg !== 'lru' && e.puntero != null) v[`pt-${j}`] = nombreMarco(e.puntero)
      return v
    }
    const visibles = (hasta: number) =>
      Array.from({ length: hasta + 1 }, (_, j) => [
        ...(j > 0 ? [`ref-${j - 1}`] : []),
        ...Array.from({ length: n }, (_, i) => `m${i}-${j}`),
      ]).flat()

    let pf = 0
    let escritas: string[] = []
    const resumen = () =>
      `${pf} PF · escritas a disco: ${escritas.length ? escritas.join(', ') : 'ninguna'}`

    const pasos: Paso[] = [
      {
        titulo: 'Estado inicial.',
        texto:
          alg !== 'lru'
            ? `Así está la memoria antes de la primera referencia. El puntero apunta al ${nombreMarco(o.puntero)}.${clock ? ' En la celda, **U** y **M** indican los bits prendidos.' : ' **M** indica que está modificada.'}`
            : 'Así está la memoria antes de la primera referencia. En LRU importa el instante de la última referencia de cada página (todos anteriores a la ref. 1 de la secuencia); **M** indica que está modificada.',
        resaltar: visibles(0),
        valores: { ...columna(0, estadoInicial), resumen: resumen() },
      },
    ]

    let anteriores: Record<string, string> = {}
    inst.forEach((i, t) => {
      const j = t + 1
      const antes = t === 0 ? estadoInicial : inst[t - 1]
      if (i.fallo) pf++
      if (i.escrita) escritas = [...escritas, lbl(i.victima)]
      const nuevas: Record<string, string> = { [`ref-${t}`]: i.invalida ? 'rc-mal' : 'rc-aviso' }
      if (!i.invalida) {
        const pos = i.fallo ? i.marco! : i.paginas.indexOf(i.ref.pagina)
        nuevas[`m${pos}-${j}`] = i.fallo ? 'rc-mal' : 'rc-ok'
      }
      const clases = {
        ...Object.fromEntries(Object.keys(anteriores).map((e) => [e, ''])),
        ...nuevas,
      }
      anteriores = nuevas
      const valores = {
        ...columna(j, i),
        [`pf-${j}`]: i.fallo ? 'PF' : '',
        [`dk-${j}`]: i.escrita ? lbl(i.victima) : '',
        resumen: resumen(),
      }
      pasos.push({
        titulo: titulo(i, t),
        texto: explicar(alg, i, antes, t),
        resaltar: visibles(j),
        valores,
        clases,
      })
    })
    pasos[pasos.length - 1].texto += ` En total, **${pf} PF** con ${NOMBRE[alg]}.`
    return pasos
  }

  function titulo(i: InstanteUM, t: number) {
    const dir = o.direcciones[t]
    if (i.invalida) return `Ref. ${t + 1}: ${dir} es inválida.`
    const modo = i.ref.escritura ? 'escritura' : 'lectura'
    return i.fallo
      ? `Ref. ${t + 1}: página ${lbl(i.ref.pagina)} (${modo}), PF.`
      : `Ref. ${t + 1}: página ${lbl(i.ref.pagina)} (${modo}), está.`
  }

  /** Última referencia a la página antes de la ref. t: en la secuencia, o el instante del estado inicial. */
  function ultimoUso(pagina: number, t: number) {
    const k = refs.findLastIndex((r, j) => j < t && r.pagina === pagina)
    if (k >= 0) return `ref. ${k + 1}`
    return `inst. ${inicial.find((m) => m.pagina === pagina)!.ultimoUso}`
  }

  function explicar(
    alg: AlgoritmoEstado,
    i: InstanteUM,
    antes: Pick<InstanteUM, 'paginas' | 'u' | 'm' | 'puntero'>,
    t: number,
  ) {
    if (i.invalida)
      return `La dirección ${o.direcciones[t]} cae fuera del espacio del proceso: es un **error de dirección inválida**, no un PF. No se carga nada y la memoria queda igual.`
    const escribe = !i.ref.escritura
      ? ''
      : !i.fallo && antes.m[i.paginas.indexOf(i.ref.pagina)]
        ? ' Es escritura: M ya estaba en 1.'
        : ' Como es escritura, se prende **M**.'
    if (!i.fallo) {
      const extra =
        alg === 'lru'
          ? 'pasa a ser la referenciada más recientemente'
          : alg === 'fifo'
            ? 'en FIFO un acierto no cambia nada: el puntero **no** se mueve'
            : 'U pasa a 1 y el puntero **no** se mueve'
      return `Acierto en el ${nombreMarco(i.paginas.indexOf(i.ref.pagina))}: ${extra}.${escribe}`
    }
    const avanza = alg === 'lru' ? '' : ` El puntero queda en el ${nombreMarco(i.puntero!)}.`
    if (i.victima == null)
      return `El ${nombreMarco(i.marco!)} está libre: la página entra sin reemplazar a nadie.${escribe}${avanza}`
    const sale = `Sale la **${lbl(i.victima)}** del ${nombreMarco(i.marco!)}`
    const disco = i.escrita
      ? ' Tenía M = 1: **se escribe en disco** antes de reemplazarla.'
      : ' Tenía M = 0: no hace falta escribirla.'
    if (alg === 'lru') {
      const usos = antes.paginas.map((p) => `${lbl(p)} (${ultimoUso(p!, t)})`).join(', ')
      return `Último uso: ${usos}. ${sale}, la que hace más tiempo que no se referencia.${disco}${escribe}`
    }
    if (alg === 'fifo')
      return `El puntero está en el ${nombreMarco(antes.puntero!)}: ahí está la que hace más tiempo que entró. ${sale}.${disco}${escribe}${avanza}`
    if (alg === 'clock') {
      const u = [...antes.u]
      const recorre: string[] = []
      for (let k = 0, p = antes.puntero!; k < 2 * n; k++, p = (p + 1) % n) {
        if (!u[p]) {
          recorre.push(`${nombreMarco(p)} (U=0) víctima`)
          break
        }
        u[p] = false
        recorre.push(`${nombreMarco(p)} (U=1) → U=0`)
      }
      return `Desde el ${nombreMarco(antes.puntero!)}: ${recorre.join(', ')}. ${sale}.${disco}${escribe}${avanza}`
    }
    return `Desde el ${nombreMarco(antes.puntero!)}. ${vueltasClockMejorado(antes)}. ${sale}.${disco}${escribe}${avanza}`
  }

  /** "1.ª vuelta busca (0,0): F5 (1,1), F6 (0,1)…": cada frame que visita el puntero, con sus bits. */
  function vueltasClockMejorado(antes: Pick<InstanteUM, 'paginas' | 'u' | 'm' | 'puntero'>) {
    const { visitas } = clockMejorado(
      antes.paginas.map((p, k) => ({ pagina: p!, u: antes.u[k], m: antes.m[k] })),
      antes.puntero!,
    )
    const u = [...antes.u]
    const vueltas: string[] = []
    let actual: string[] = []
    let pasada = 0
    const cerrar = (fin: string) =>
      vueltas.push(
        `${vueltas.length + 1}.ª vuelta busca ${pasada === 1 ? '(0,0)' : '(0,1) bajando U'}: ${actual.join(', ')}${fin}`,
      )
    for (const v of visitas) {
      if (v.pasada !== pasada) {
        if (actual.length) cerrar(': no hay')
        actual = []
        pasada = v.pasada
      }
      const bits = `(${+u[v.marco]},${+antes.m[v.marco]})`
      if (v.bajaU) u[v.marco] = false
      actual.push(
        v.elegido
          ? `${nombreMarco(v.marco)} ${bits} víctima`
          : v.bajaU
            ? `${nombreMarco(v.marco)} → U=0`
            : `${nombreMarco(v.marco)} ${bits}`,
      )
    }
    cerrar('')
    return vueltas.join('. ')
  }
}
