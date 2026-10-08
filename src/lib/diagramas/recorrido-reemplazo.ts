/** Arma un recorrido de reemplazo de páginas con la tabla de la cátedra (marcos × referencias, PF y puntero). */
import { fallos, reemplazo, type AlgoritmoReemplazo, type Instante } from './memoria'
import { celdaM, rotulo } from './primitivas-memoria'
import type { Paso, Recorrido, Variante } from './recorrido'
import { texto } from './svg'

const NOMBRE: Record<AlgoritmoReemplazo, string> = {
  optimo: 'Óptimo',
  fifo: 'FIFO',
  lru: 'LRU',
  clock: 'Clock',
}

const COL = 44
const FILA = 30
const X0 = 116

const lista = (xs: string[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0]

export interface OpcionesReemplazo {
  refs: number[]
  marcos: number
  algoritmos: AlgoritmoReemplazo[]
  titulo: string
  /** Nombre de cada variante (por defecto, el del algoritmo). */
  nombres?: string[]
}

export function recorridoReemplazo(o: OpcionesReemplazo): Recorrido {
  const { refs, marcos: n } = o
  const yFila = (i: number) => 52 + i * FILA
  const yPF = yFila(n) + 14
  const yPuntero = yPF + 22
  const alto = yPuntero + 44
  const conPuntero = o.algoritmos.some((a) => a === 'fifo' || a === 'clock')
  const cuerpo = [
    rotulo(X0 - 12, 34, 'Ref.'),
    ...refs.map((r, j) =>
      [
        texto(X0 + j * COL + COL / 2, 14, String(j + 1), { clase: 'rm-marca' }),
        celdaM(`ref-${j}`, X0 + j * COL, 22, COL, 24, String(r), { clase: 'rm-ref rm-grilla' }),
      ].join(''),
    ),
    ...Array.from({ length: n }, (_, i) =>
      [
        rotulo(X0 - 12, yFila(i) + FILA / 2, `Marco ${i}`),
        ...refs.map((_, j) =>
          celdaM(`m${i}-${j}`, X0 + j * COL, yFila(i), COL, FILA, '', { clase: 'rm-grilla' }),
        ),
      ].join(''),
    ),
    rotulo(X0 - 12, yPF, 'PF'),
    ...refs.map((_, j) =>
      texto(X0 + j * COL + COL / 2, yPF, '', { val: `pf-${j}`, clase: 'rm-pf' }),
    ),
    conPuntero ? rotulo(X0 - 12, yPuntero, 'Puntero') : '',
    ...(conPuntero
      ? refs.map((_, j) =>
          texto(X0 + j * COL + COL / 2, yPuntero, '', { val: `pt-${j}`, clase: 'rm-puntero' }),
        )
      : []),
    texto(360, alto - 12, '', { val: 'resumen', clase: 'rm-resumen' }),
  ]

  const variantes: Variante[] = o.algoritmos.map((alg, k) => ({
    nombre: o.nombres?.[k] ?? NOMBRE[alg],
    pasos: pasosDe(alg, reemplazo(refs, n, alg)),
  }))
  return { ancho: 720, alto, titulo: o.titulo, cuerpo, variantes }

  function pasosDe(alg: AlgoritmoReemplazo, inst: Instante[]): Paso[] {
    const celda = (i: Instante, m: number) => {
      const p = i.marcos[m]
      if (p == null) return '–'
      return alg === 'clock' && i.uso[m] ? `${p} U` : String(p)
    }
    const columna = (j: number) => {
      const v: Record<string, string> = {}
      for (let m = 0; m < n; m++) v[`m${m}-${j}`] = celda(inst[j], m)
      v[`pf-${j}`] = inst[j].fallo ? 'PF' : ''
      if (inst[j].puntero != null) v[`pt-${j}`] = `M${inst[j].puntero}`
      return v
    }
    const clasesDe = (j: number) => {
      const c: Record<string, string> = { [`ref-${j}`]: 'rc-aviso' }
      const i = inst[j]
      const m = i.fallo ? i.marco! : i.marcos.indexOf(i.ref)
      c[`m${m}-${j}`] = i.fallo ? 'rc-mal' : 'rc-ok'
      return c
    }
    const visibles = (hasta: number) =>
      Array.from({ length: hasta + 1 }, (_, j) => [
        `ref-${j}`,
        ...Array.from({ length: n }, (_, m) => `m${m}-${j}`),
      ]).flat()

    const lleno = inst.findIndex((i) => i.marcos.every((p) => p != null))
    const pasos: Paso[] = []
    let anteriores: Record<string, string> = {}
    const agregar = (desde: number, hasta: number, titulo: string, txt: string) => {
      const valores = Object.assign(
        {},
        ...Array.from({ length: hasta - desde + 1 }, (_, k) => columna(desde + k)),
      )
      const nuevas = Object.assign(
        {},
        ...Array.from({ length: hasta - desde + 1 }, (_, k) => clasesDe(desde + k)),
      )
      const clases = {
        ...Object.fromEntries(Object.keys(anteriores).map((e) => [e, ''])),
        ...nuevas,
      }
      anteriores = nuevas
      const total = fallos(inst.slice(0, hasta + 1))
      const iniciales = fallos(inst.slice(0, lleno + 1))
      valores.resumen =
        hasta >= lleno
          ? `${iniciales} PF de carga inicial + ${total - iniciales} PF con reemplazo = ${total} PF`
          : `${total} PF`
      pasos.push({ titulo, texto: txt, resaltar: visibles(hasta), valores, clases })
    }

    const cargados = inst.slice(0, lleno + 1)
    const aciertosIniciales = cargados.filter((i) => !i.fallo).map((i) => String(i.ref))
    agregar(
      0,
      lleno,
      'Carga inicial.',
      `Los marcos arrancan vacíos: ${lista(cargados.filter((i) => i.fallo).map((i) => String(i.ref)))} entran sin reemplazar a nadie, pero **cada una es un PF** y se cuenta.` +
        (aciertosIniciales.length ? ` La ${lista(aciertosIniciales)} repetida es acierto.` : '') +
        extraInicial(alg),
    )
    for (let t = lleno + 1; t < refs.length; t++) {
      const i = inst[t]
      if (!i.fallo) {
        agregar(t, t, `Ref. ${t + 1}: la ${i.ref} está.`, acierto(alg, i))
      } else {
        agregar(t, t, `Ref. ${t + 1}: la ${i.ref} no está (PF).`, motivo(alg, inst, t))
      }
    }
    const ult = pasos[pasos.length - 1]
    ult.texto += ` En total, **${fallos(inst)} PF** con ${NOMBRE[alg]}.`
    return pasos
  }

  function extraInicial(alg: AlgoritmoReemplazo) {
    if (alg === 'clock')
      return ' Cada página entra con U = 1 y el puntero avanza al marco siguiente.'
    if (alg === 'fifo') return ' El puntero queda en el marco de la que entró primero.'
    return ''
  }

  function acierto(alg: AlgoritmoReemplazo, i: Instante) {
    const m = `marco ${i.marcos.indexOf(i.ref)}`
    if (alg === 'fifo')
      return `Acierto en el ${m}. En FIFO un acierto no cambia nada: el puntero no se mueve.`
    if (alg === 'lru')
      return `Acierto en el ${m}: se actualiza su instante de referencia, ahora es la más reciente.`
    if (alg === 'clock')
      return `Acierto en el ${m}: su bit de uso pasa a 1 y el puntero **no** se mueve.`
    return `Acierto en el ${m}: no hay que elegir víctima.`
  }

  function motivo(alg: AlgoritmoReemplazo, inst: Instante[], t: number) {
    const i = inst[t]
    const antes = inst[t - 1]
    const sale = `Sale la **${i.victima}** del marco ${i.marco}`
    if (alg === 'optimo') {
      const proximos = antes.marcos.map((p) => {
        const k = refs.indexOf(p!, t + 1)
        return k < 0 ? `la ${p} no se vuelve a usar` : `la ${p} se usa en la ref. ${k + 1}`
      })
      return `Mira el futuro: ${lista(proximos)}. ${sale}, la que se usa más lejos.`
    }
    if (alg === 'fifo')
      return `El puntero está en el marco ${antes.puntero}: ahí está la que hace más tiempo que entró. ${sale} y el puntero avanza.`
    if (alg === 'lru') {
      const ultimos = antes.marcos.map(
        (p) => `la ${p} en la ref. ${refs.lastIndexOf(p!, t - 1) + 1}`,
      )
      return `Último uso de cada una: ${lista(ultimos)}. ${sale}, la que hace más tiempo que no se usa.`
    }
    const uso = [...antes.uso]
    let p = antes.puntero!
    const bajados: string[] = []
    while (uso[p]) {
      bajados.push(`marco ${p} (${antes.marcos[p]})`)
      uso[p] = false
      p = (p + 1) % n
    }
    const recorre = bajados.length
      ? `El puntero arranca en el marco ${antes.puntero} y baja U a 0 en ${lista(bajados)}. Llega al marco ${p}, que tiene U = 0.`
      : `El puntero está en el marco ${p}, que tiene U = 0.`
    return `${recorre} ${sale}; la nueva entra con U = 1 y el puntero pasa al siguiente.`
  }
}
