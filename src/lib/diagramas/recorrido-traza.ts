/** Resolución paso a paso de una traza a completar: la grilla correcta columna por columna, con el porqué de cada referencia. */
import {
  columnaInicial,
  marcarDe,
  normalizarPagina,
  trazaEsperada,
  NOMBRE_ALGORITMO,
  type AlgoritmoTraza,
  type ColumnaTraza,
  type TrazaSpec,
} from '../calculos/traza'
import { clockMejorado } from './memoria'
import type { Paso, Recorrido } from './recorrido'
import { grupo, texto } from './svg'

const X0 = 96
const COL = 72

export function recorridoTraza(spec: TrazaSpec, alg: AlgoritmoTraza): Recorrido {
  const cols = [columnaInicial(spec), ...trazaEsperada(spec, alg)]
  const marcar = marcarDe(alg, spec)
  const n = spec.marcos.length
  const F = (pos: number) => `F${spec.marcos[pos].marco}`
  const conBits = marcar.u || marcar.m
  const FILA = conBits ? 40 : 28
  const yFila = (i: number) => 52 + i * FILA
  const yExtra = yFila(n) + 16
  const extras = [
    ['PF', true],
    ['Disco', marcar.disco],
    ['P', marcar.puntero],
  ].filter(([, v]) => v)
  const alto = yExtra + extras.length * 20 + 6
  const x = (j: number) => X0 + j * COL

  const celda = (j: number, c: ColumnaTraza, i: number, entra: boolean) => {
    const p = c.paginas[i]
    const clase = c.h[i] ? ' rt-hit' : entra ? ' rt-entra' : ''
    const bits = [marcar.u ? `U${+c.u[i]}` : '', marcar.m ? `M${+c.m[i]}` : '']
      .filter(Boolean)
      .join(' ')
    const y = yFila(i)
    return (
      `<g class="rt-celda${clase}"><rect x="${x(j) + 4}" y="${y}" width="${COL - 8}" height="${FILA - 6}" rx="3"/>` +
      (p == null
        ? ''
        : texto(x(j) + COL / 2, y + (conBits ? 11 : (FILA - 6) / 2), p, { clase: 'rt-pag' }) +
          (conBits ? texto(x(j) + COL / 2, y + 26, bits, { clase: 'rt-bits' }) : '')) +
      '</g>'
    )
  }

  const columna = (c: ColumnaTraza, j: number) => {
    const prev = cols[j - 1]
    const entra = (i: number) =>
      c.resultado === 'pf' && normalizarPagina(prev?.paginas[i]) !== normalizarPagina(c.paginas[i])
    const ref = spec.referencias[j - 1]
    const cab =
      j === 0
        ? texto(x(j) + COL / 2, 34, 'Inicial', { clase: 'rm-marca' })
        : texto(x(j) + COL / 2, 14, ref.etiqueta, { clase: 'rm-marca' }) +
          texto(x(j) + COL / 2, 34, ref.pagina == null ? '✗' : `${ref.pagina} ${ref.acceso}`, {
            clase: 'rt-ref',
          })
    const fila = (k: number, t: string, clase: string) =>
      texto(x(j) + COL / 2, yExtra + k * 20, t, { clase })
    const vals: Record<string, string> = {
      PF: c.resultado === 'pf' ? 'PF' : c.resultado === 'invalida' ? 'INV' : '',
      Disco: c.disco ? 'sí' : '',
      P: c.puntero == null ? '' : F(c.puntero),
    }
    return grupo(
      `col-${j}`,
      cab +
        spec.marcos.map((_, i) => celda(j, c, i, entra(i))).join('') +
        extras
          .map(([nombre], k) =>
            fila(k, vals[nombre as string], nombre === 'PF' ? 'rm-pf' : 'rm-puntero'),
          )
          .join(''),
      { oculto: true },
    )
  }

  // último uso (LRU): los instantes iniciales y después uno por referencia
  const t0 = Math.max(0, ...spec.marcos.map((m) => m.ultimoUso)) + 1
  const usoHasta = (j: number) => {
    const uso = new Map<string, number>()
    spec.marcos.forEach(
      (m) => m.pagina != null && uso.set(normalizarPagina(m.pagina)!, m.ultimoUso),
    )
    spec.referencias
      .slice(0, j)
      .forEach((r, k) => r.pagina != null && uso.set(normalizarPagina(r.pagina)!, t0 + k))
    return uso
  }

  const porque = (j: number): string => {
    const prev = cols[j - 1]
    const cur = cols[j]
    const ref = spec.referencias[j - 1]
    const queda =
      cur.puntero != null && alg !== 'optimo' ? ` El puntero queda en ${F(cur.puntero)}.` : ''
    if (cur.resultado === 'invalida')
      return 'Dirección inválida (fuera del proceso): **error**, no es page fault; el estado no cambia.'
    if (cur.resultado === 'acierto') {
      const i = cur.h.indexOf(true)
      const bits = marcar.u && !prev.u[i] ? ' U pasa a 1.' : ''
      const m = ref.acceso === 'E' && marcar.m && !prev.m[i] ? ' Es escritura: M pasa a 1.' : ''
      const extra =
        alg === 'lru'
          ? ' Pasa a ser la usada más recientemente.'
          : marcar.puntero
            ? ' El puntero no se mueve.'
            : ''
      return `**${cur.paginas[i]}** ya está en ${F(i)}: **acierto**.${bits}${m}${extra}`
    }
    const e = cur.paginas.findIndex(
      (p, i) => normalizarPagina(p) !== normalizarPagina(prev.paginas[i]),
    )
    const v = prev.paginas[e]
    if (v == null)
      return `**PF**: ${F(e)} estaba libre, la página entra sin reemplazar a nadie.${queda}`
    const disco = cur.disco
      ? ' La víctima tenía M=1: **se escribe en disco** antes de reemplazarla.'
      : ''
    let como: string
    if (alg === 'fifo')
      como = `el puntero está en ${F(prev.puntero!)}: sale **${v}** de ${F(e)}, la que entró primero.`
    else if (alg === 'lru') {
      const uso = usoHasta(j - 1)
      const orden = [...prev.paginas].sort(
        (a, b) => uso.get(normalizarPagina(a)!)! - uso.get(normalizarPagina(b)!)!,
      )
      como = `Ordenadas de la usada hace más tiempo a la más reciente: ${orden.join(', ')} → sale **${v}** de ${F(e)}.`
    } else if (alg === 'optimo') {
      const prox = prev.paginas.map((p) => {
        const k = spec.referencias.findIndex(
          (r, q) => q >= j && normalizarPagina(r.pagina) === normalizarPagina(p),
        )
        return `${p} (${k < 0 ? 'nunca' : `ref. ${k + 1}`})`
      })
      como = `Próximo uso: ${prox.join(', ')} → sale **${v}**, la que se usa más tarde.`
    } else if (alg === 'clock') {
      const u = [...prev.u]
      const pasos: string[] = []
      for (let k = 0; k < 2 * n; k++) {
        const i = (prev.puntero! + k) % n
        if (!u[i]) {
          pasos.push(`${F(i)} (U=0) víctima`)
          break
        }
        u[i] = false
        pasos.push(`${F(i)} (U=1) → U=0`)
      }
      como = `Desde ${F(prev.puntero!)}: ${pasos.join(', ')}. Sale **${v}**.`
    } else {
      const estado = prev.paginas.map((_, k) => ({ pagina: k, u: prev.u[k], m: prev.m[k] }))
      const { visitas } = clockMejorado(estado, prev.puntero!)
      const u = [...prev.u]
      const vueltas: string[] = []
      let actual: string[] = []
      let pasada = 0
      const cerrar = (fin: string) =>
        vueltas.push(
          `${vueltas.length + 1}.ª vuelta busca ${pasada === 1 ? '(0,0)' : '(0,1) bajando U'}: ${actual.join(', ')}${fin}`,
        )
      for (const vis of visitas) {
        if (vis.pasada !== pasada && actual.length) cerrar(': no hay')
        if (vis.pasada !== pasada) [actual, pasada] = [[], vis.pasada]
        const b = `(${+u[vis.marco]},${+prev.m[vis.marco]})`
        if (vis.elegido) actual.push(`${F(vis.marco)} ${b} víctima`)
        else if (vis.bajaU) {
          u[vis.marco] = false
          actual.push(`${F(vis.marco)} → U=0`)
        } else actual.push(`${F(vis.marco)} ${b}`)
      }
      cerrar('')
      como = `Desde ${F(prev.puntero!)}. ${vueltas.join('. ')}. Sale **${v}**.`
    }
    return `**PF**. ${como}${disco}${queda}`
  }

  const titulo = (j: number) => {
    const r = spec.referencias[j - 1]
    if (r.pagina == null) return `${r.etiqueta} (inválida)`
    const pag = normalizarPagina(r.pagina) === normalizarPagina(r.etiqueta) ? '' : ` → ${r.pagina}`
    return `${r.etiqueta}${pag} (${r.acceso})`
  }

  const inicial = () => {
    const c = cols[0]
    if (c.paginas.every((p) => p == null)) return 'Los frames arrancan vacíos.'
    const fr = c.paginas.map(
      (p, i) => `${F(i)}: ${p ?? 'libre'}${conBits && p != null ? ` (${+c.u[i]},${+c.m[i]})` : ''}`,
    )
    return `${fr.join(', ')}.${c.puntero != null && marcar.puntero ? ` El puntero está en ${F(c.puntero)}.` : ''}`
  }

  const ids = cols.map((_, j) => `col-${j}`)
  const pasos: Paso[] = cols.map((_, j) => ({
    titulo: j === 0 ? 'Estado inicial' : titulo(j),
    texto: j === 0 ? inicial() : porque(j),
    resaltar: ids.slice(0, j + 1),
    mostrar: [ids[j]],
  }))
  return {
    ancho: Math.max(720, x(cols.length) + 12),
    alto,
    titulo: `Traza con ${NOMBRE_ALGORITMO[alg]}, paso a paso`,
    cuerpo: [
      ...spec.marcos.map((_, i) =>
        texto(X0 - 10, yFila(i) + (FILA - 6) / 2, F(i), { clase: 'rm-rotulo' }),
      ),
      ...extras.map(([nombre], k) =>
        texto(X0 - 10, yExtra + k * 20, nombre as string, { clase: 'rm-rotulo' }),
      ),
      ...cols.map(columna),
    ],
    pasos,
  }
}
