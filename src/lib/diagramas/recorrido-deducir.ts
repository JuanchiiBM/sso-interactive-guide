/** Bloque ```deducir: decodificar la referencia y comparar algoritmos (tableros tlb-D, tlb-11, tlb-16). Ver brain: Resolución gráfica de la TLB. */
import { clockMejorado } from './memoria'
import type { Paso, Recorrido } from './recorrido'
import {
  dibujoComparar,
  dibujoDecodificar,
  type Celda,
  type Tarjeta,
} from './recorrido-deducir-svg'
import type { Etapa } from './recorrido-tlb'
import { bits, nibbles } from './recorrido-traduccion'
import { grupo } from './svg'
import {
  deducir,
  type AlgDeducir,
  type MarcoDeducir,
  type ResultadoAlg,
  type SpecDeducir,
} from './deducir'
import { rotuloProceso } from './tlb'

export const NOMBRE: Record<AlgDeducir, string> = {
  fifo: 'FIFO',
  lru: 'LRU',
  clock: 'Clock',
  'clock-mejorado': 'Clock mejorado',
}
const CORTO: Record<AlgDeducir, string> = { ...NOMBRE, 'clock-mejorado': 'Clock mej.' }
const CUANTAS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho']
const yy = (xs: string[]) => xs.join(', ').replace(/, (?=[^,]*$)/, ' y ')

/** Corte de una dirección: en hexa si el offset son dígitos enteros, si no en bits. */
function corte(n: number, total: number, bo: number) {
  if (bo % 4 === 0) {
    const h = n
      .toString(16)
      .toUpperCase()
      .padStart(Math.ceil(total / 4), '0')
    return `${h}h = ${h.slice(0, h.length - bo / 4)} | ${h.slice(h.length - bo / 4)}`
  }
  const b = bits(n, total)
  return `${n.toString(16).toUpperCase()}h = ${b.slice(0, total - bo)} | ${nibbles(b.slice(total - bo))}`
}

export function recorridoDeducir(spec: SpecDeducir): Recorrido {
  const { real, algoritmos } = deducir(spec)
  const uso = spec.uso ?? 'TUR'
  const bo = spec.bitsOffset
  const varios = real.length > 1
  const multi = spec.marcos.some((m) => m.proceso)
  // "B2" en la tabla; "la 6" en el texto si hay un solo proceso
  const pag = (p: string | undefined, n: number) => (p ? `${p}${n}` : String(n))
  const nombre = (p: string | undefined, n: number) => (p ? `${p}${n}` : `la ${n}`)
  const marcoDe = (f: number) => spec.marcos.find((m) => m.frame === f)!
  const deMarco = (m: MarcoDeducir) =>
    varios && m.proceso ? `${rotuloProceso(m.proceso)}${m.pagina}` : nombre(m.proceso, m.pagina)

  // paso 1: decodificar
  const etapas: Etapa[] = varios
    ? real.map((r, k) => {
        const ref = spec.referencias[k]
        const v = r.victima != null ? marcoDe(r.victima) : null
        return {
          titulo: `${r.proceso ? rotuloProceso(r.proceso) : ''} ${ref.dl
            .toString(16)
            .toUpperCase()
            .padStart(
              Math.ceil(spec.bitsDL / 4),
              '0',
            )}h${ref.acceso ? ` (${ref.acceso})` : ''}`.trim(),
          dato: `pág. ${r.pagina} → frame ${r.frame}`,
          porque: v
            ? `No estaba: PF. El frame ${r.frame} tenía ${rotuloProceso(v.proceso ?? '')}${v.pagina}: esa fue la víctima.`
            : `Ya estaba en el frame ${r.frame}: acierto.`,
          tono: v ? 'aviso' : 'ok',
        }
      })
    : (() => {
        const r = real[0]
        const ref = spec.referencias[0]
        const v = r.victima != null ? marcoDe(r.victima) : null
        return [
          {
            titulo: 'DL',
            dato: corte(ref.dl, spec.bitsDL, bo),
            porque: `${bo} bits de offset → página ${r.pagina}${r.proceso ? ` de ${r.proceso}` : ''}. ${v ? 'No está presente: PF.' : 'Está presente: acierto.'}`,
            tono: v ? 'mal' : 'ok',
          },
          {
            titulo: 'DF',
            dato: corte(ref.df, spec.bitsDF, bo),
            porque: v
              ? `Frame ${r.frame}, que tenía ${deMarco(v)}: esa fue la víctima.`
              : `Frame ${r.frame}: es donde ya estaba.`,
            tono: v ? 'aviso' : 'ok',
          },
        ] as Etapa[]
      })()

  // paso 2: comparar
  const v0 = real[0].victima != null ? marcoDe(real[0].victima) : null
  const inicioDe = (a: ResultadoAlg) =>
    a.puntero == null ? 0 : spec.marcos.findIndex((m) => m.frame === a.puntero)
  const pasadas = (a: ResultadoAlg) => {
    const r = clockMejorado(
      spec.marcos.map((m) => ({ pagina: m.pagina, u: !!m.u, m: !!m.m })),
      inicioDe(a),
    )
    return Math.ceil(r.visitas.length / spec.marcos.length)
  }
  const celda = (a: ResultadoAlg): string => {
    const m = marcoDe(a.victimas[0]!)
    if (a.alg === 'fifo')
      return spec.marcos.every((x) => x.tc != null) ? 'sale (menor TC)' : 'sale (orden)'
    if (a.alg === 'lru') return `sale (menor ${uso})`
    if (a.alg === 'clock') return m.u ? 'sale (vuelta completa)' : 'sale (U=0, 1.º)'
    const p = pasadas(a)
    if (p <= 2) return p === 1 ? 'sale (0,0)' : 'sale (0,1)'
    const unica = spec.marcos.filter((x) => !x.m).length === 1
    return p === 3 && unica ? 'sale (única M = 0)' : `sale (${p}.ª vuelta)`
  }

  const textoUna = (a: ResultadoAlg): string => {
    const x = marcoDe(a.victimas[0]!)
    const V = v0!
    const ptr = a.cualquiera ? ' Pasa sea cual sea el puntero.' : ''
    if (a.alg === 'fifo') {
      if (x.tc == null) return `Con el puntero en el frame ${a.puntero}, saca ${deMarco(x)}.`
      return a.coincide
        ? `Saca la cargada hace más tiempo: ${deMarco(V)} (TC ${V.tc}).`
        : `Saca la cargada hace más tiempo: ${deMarco(x)} (TC ${x.tc}), no ${deMarco(V)} (TC ${V.tc}).`
    }
    if (a.alg === 'lru')
      return a.coincide
        ? `La de menor ${uso} es ${deMarco(V)} (${V.tur}).`
        : `Saca la referenciada hace más tiempo: ${deMarco(x)} (${uso} ${x.tur}), no ${deMarco(V)} (${uso} ${V.tur}).`
    if (a.alg === 'clock') {
      if (!a.coincide) return `Ninguna posición del puntero saca primero a ${deMarco(V)}.`
      return a.cualquiera
        ? `Elige a ${deMarco(V)} sea cual sea el puntero.`
        : `${deMarco(V)} tiene U = ${V.u ?? 0}; con el puntero en el frame ${a.puntero} es la primera que encuentra.`
    }
    const p = pasadas(a)
    const n = spec.marcos.length
    if (p === 1)
      return `La 1.ª vuelta busca (0,0) y ${deMarco(x)} lo es${a.coincide ? `.${ptr}` : `: la elige antes que ${deMarco(V)} (${V.u ?? 0},${V.m ?? 0}).`}`
    const todasU = spec.marcos.every((m) => m.u)
    const intro = todasU ? `${n <= 8 ? `Las ${CUANTAS[n]}` : `Las ${n}`} tienen U = 1. ` : ''
    const unica = spec.marcos.filter((m) => !m.m).length === 1 ? 'la única ' : ''
    const resto =
      p === 2
        ? `2.ª: ${deMarco(x)} es la primera (0,1).`
        : p === 3
          ? `2.ª: no hay (0,1) y baja todos los U. 3.ª: ${deMarco(x)} es ${unica}(0,0).`
          : `2.ª: no hay (0,1) y baja todos los U. 3.ª: no hay (0,0). 4.ª: ${deMarco(x)} (0,1).`
    return `${intro}1.ª vuelta: no hay (0,0). ${resto}${a.coincide ? ptr : ` No es ${deMarco(V)}.`}`
  }

  const F = (f: number | null) => (f == null ? 'acierto' : `F${f}`)
  const textoVarias = (a: ResultadoAlg): string => {
    const k = a.desvio
    if (a.coincide && a.alg === 'clock') return `${trazaClock(spec, inicioDe(a))}`
    if (a.coincide)
      return `Saca ${yy(a.victimas.filter((f) => f != null).map(F))}${a.puntero != null && !a.cualquiera ? `, con el puntero en el frame ${a.puntero}` : ''}.`
    if (k === 0 && a.alg === 'clock-mejorado') return textoUna(a)
    const r = real[k].victima
    const x = a.victimas[k]
    const pre =
      k > 0
        ? `Acierta ${k === 1 ? 'la primera' : `las ${CUANTAS[k] ?? k} primeras`}, pero en la ${k + 1}.ª`
        : 'En la 1.ª referencia'
    const original = x != null ? spec.marcos.find((m) => m.frame === x) : undefined
    const quien =
      a.alg === 'lru' && original && !real.slice(0, k).some((rr) => rr.frame === x)
        ? `${rotuloProceso(original.proceso ?? '')}${original.pagina} (${uso} ${original.tur}, frame ${x})`
        : `el frame ${x}`
    const fifo =
      a.alg === 'fifo'
        ? `Reemplaza en el orden de los frames: con el puntero en el ${a.puntero}, `
        : ''
    const cuerpo = `${pre} saca ${quien}, no ${r == null ? 'acierta' : `el frame ${r}`}.`
    return fifo ? fifo + cuerpo.charAt(0).toLowerCase() + cuerpo.slice(1) : cuerpo
  }

  const tarjetas: Tarjeta[] = algoritmos.map((a) => ({
    ok: a.coincide,
    titulo: `${NOMBRE[a.alg]}: ${a.coincide ? 'sí' : 'no'}${varios && a.coincide && a.puntero != null && !a.cualquiera ? `, con el puntero en el frame ${a.puntero}` : ''}.`,
    texto: varios ? textoVarias(a) : textoUna(a),
  }))
  const si = algoritmos.filter((a) => a.coincide)
  const solo = si.length === 1 && si[0].puntero != null && !si[0].cualquiera
  const respuesta = si.length
    ? `${yy(si.map((a) => NOMBRE[a.alg]))}${solo ? `, con el puntero arrancando en el frame ${si[0].puntero}` : ''}`
    : 'ninguno de los algoritmos'

  let tablaCeldas: {
    cols: string[]
    filas: Celda[][]
    previa?: { cols: string[]; filas: string[][] }
  }
  if (!varios) {
    const tc = spec.marcos.some((m) => m.tc != null)
    const um = spec.marcos.some((m) => m.u != null)
    const cols = [
      'Frame',
      'Página',
      uso,
      ...(tc ? ['TC'] : []),
      ...(um ? ['U', 'M'] : []),
      ...algoritmos.map((a) => CORTO[a.alg]),
    ]
    const filas: Celda[][] = spec.marcos.map((m) => {
      const victimaReal = m.frame === real[0].victima
      const datos: Celda[] = [
        { t: String(m.frame) },
        {
          t: `${pag(m.proceso, m.pagina)}${victimaReal ? ' ← víctima real' : ''}`,
          c: victimaReal ? 'ded-fuerte' : '',
        },
        { t: String(m.tur ?? '') },
        ...(tc ? [{ t: String(m.tc ?? '') }] : []),
        ...(um ? [{ t: String(m.u ?? 0) }, { t: String(m.m ?? 0) }] : []),
        ...algoritmos.map((a) =>
          a.victimas[0] === m.frame
            ? { t: celda(a), c: a.coincide ? 'ded-si' : 'ded-no' }
            : { t: '' },
        ),
      ]
      return victimaReal ? datos.map((d) => ({ ...d, fila: 'ded-real' })) : datos
    })
    const pie: Celda[] = [
      {
        t: `¿Coincide con ${v0 ? pag(v0.proceso, v0.pagina) : '—'}?`,
        span: cols.length - algoritmos.length,
        c: 'ded-pregunta',
      },
      ...algoritmos.map((a) => ({
        t: a.coincide ? '✓' : '✗',
        c: a.coincide ? 'ded-si ded-marca' : 'ded-no ded-marca',
      })),
    ]
    tablaCeldas = { cols, filas: [...filas, pie] }
  } else {
    const previa = {
      cols: ['Frame', ...spec.marcos.map((m) => String(m.frame))],
      filas: [
        ['Página', ...spec.marcos.map((m) => `${rotuloProceso(m.proceso ?? '')}${m.pagina}`)],
        ...(spec.marcos.some((m) => m.u != null)
          ? [['U M', ...spec.marcos.map((m) => `${m.u ?? 0} ${m.m ?? 0}`)]]
          : []),
        [uso, ...spec.marcos.map((m) => String(m.tur ?? ''))],
      ],
    }
    const cols = ['Ref.', 'Víctima real', ...algoritmos.map((a) => CORTO[a.alg])]
    const filas: Celda[][] = real.map((r, k) => {
      const ref = spec.referencias[k]
      const v = r.victima != null ? marcoDe(r.victima) : null
      return [
        {
          t: `${r.proceso ? rotuloProceso(r.proceso) : ''} p${r.pagina}${ref.acceso ? ` (${ref.acceso})` : ''}`.trim(),
        },
        v
          ? { t: `F${r.frame} · ${rotuloProceso(v.proceso ?? '')}${v.pagina}`, c: 'ded-fuerte' }
          : { t: `acierto (F${r.frame})` },
        ...algoritmos.map((a): Celda => {
          if (k >= a.victimas.length) return { t: '—', c: 'ded-gris' }
          const f = a.victimas[k]
          if (f == null) return { t: 'acierto' }
          return { t: F(f), c: f === r.victima ? 'ded-si' : 'ded-no' }
        }),
      ]
    })
    const pie: Celda[] = [
      { t: '¿Coincide?', span: 2, c: 'ded-pregunta' },
      ...algoritmos.map((a) => ({
        t: a.coincide ? '✓' : '✗',
        c: a.coincide ? 'ded-si ded-marca' : 'ded-no ded-marca',
      })),
    ]
    tablaCeldas = { cols, filas: [...filas, pie], previa }
  }

  const dibujos = [
    dibujoDecodificar(etapas),
    dibujoComparar(tablaCeldas, tarjetas, `Respuesta: ${respuesta}.`),
  ]
  const textoComparar = varios
    ? `Hubo **${real.filter((r) => r.victima != null).length} víctimas** en orden: ${yy(real.filter((r) => r.victima != null).map((r) => `frame ${r.frame}`))}. Cada algoritmo arranca del mismo estado y sigue su propia simulación: ¿saca los mismos, en el mismo orden?`
    : `${v0 ? `La DF usa el **frame ${real[0].frame}**, que tenía ${multi ? `la **página ${v0.pagina} de ${v0.proceso}**` : `la **página ${v0.pagina}**`}: esa fue la víctima. ` : ''}Cada algoritmo, sobre el mismo estado, ¿la habría elegido?`
  const pasos: Paso[] = [
    {
      titulo: 'Decodificar',
      texto: varios
        ? 'Página y frame de cada referencia: si la página no estaba, lo que había en ese frame fue la víctima.'
        : 'De la DL sale la página; de la DF, el frame. Lo que había en ese frame fue la víctima.',
    },
    { titulo: 'Comparar algoritmos', texto: textoComparar },
  ].map((p, k, todos) => ({
    ...p,
    resaltar: [`paso-${k}`],
    mostrar: [`paso-${k}`],
    ocultar: todos.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
  }))
  return {
    ancho: Math.max(760, ...dibujos.map((d) => d.ancho)),
    alto: Math.max(...dibujos.map((d) => d.alto)),
    titulo: spec.titulo,
    cuerpo: dibujos.map((d, k) => grupo(`paso-${k}`, d.svg, { oculto: true, clase: 'tlb-paso' })),
    pasos,
  }
}

/** Clock simple paso a paso (solo para el texto): qué U baja y a quién saca en cada PF. */
function trazaClock(spec: SpecDeducir, inicio: number): string {
  const marcos = spec.marcos.map((m) => ({ ...m, u: !!m.u, id: `${m.proceso}${m.pagina}` }))
  const n = marcos.length
  let p = inicio
  const partes: string[] = []
  for (const r of spec.referencias) {
    const pagina = Math.floor(r.dl / 2 ** spec.bitsOffset)
    const ya = marcos.find((m) => m.id === `${r.proceso}${pagina}`)
    if (ya) {
      ya.u = true
      continue
    }
    const bajados: number[] = []
    while (marcos[p].u) {
      marcos[p].u = false
      bajados.push(marcos[p].frame)
      p = (p + 1) % n
    }
    const f = marcos[p].frame
    partes.push(bajados.length ? `baja U de ${rangos(bajados)} y saca F${f}` : `saca F${f} (U = 0)`)
    Object.assign(marcos[p], { id: `${r.proceso}${pagina}`, u: true })
    p = (p + 1) % n
  }
  const t = partes.join('; ')
  return t.charAt(0).toUpperCase() + t.slice(1) + '.'
}

/** "1 a 4" para 4 o más seguidos; si no, "5, 6 y 7". */
function rangos(fs: number[]): string {
  const seguidos = fs.every((f, i) => i === 0 || f === fs[i - 1] + 1)
  return seguidos && fs.length >= 4 ? `${fs[0]} a ${fs.at(-1)}` : yy(fs.map(String))
}
