/** Bloque ```tlb: el camino de cada referencia (tablero tlb-B). Ver brain: Resolución gráfica de la TLB. */
import type { Paso, Recorrido } from './recorrido'
import { bits, nibbles } from './recorrido-traduccion'
import { dibujoInicial, dibujoReferencia } from './recorrido-tlb-svg'
import { grupo } from './svg'
import { rotuloProceso, simularTlb, type EntradaTlb, type PasoTlb, type SpecTlb } from './tlb'

export type Tono = 'ok' | 'mal' | 'aviso' | 'neutro'
export interface Etapa {
  titulo: string
  dato: string
  porque: string
  tono: Tono
}

const hx = (n: number, digitos = 0) => `${n.toString(16).toUpperCase().padStart(digitos, '0')}h`
const PALABRA = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho']
/** "la 3 y la 15" */
const las = (ps: number[]) =>
  ps.length
    ? ps
        .map((p) => `la ${p}`)
        .join(', ')
        .replace(/, (?=[^,]*$)/, ' y ')
    : 'ninguna'
const yy = (xs: string[]) => xs.join(', ').replace(/, (?=[^,]*$)/, ' y ')

/** Sin bits (ej-06): las referencias son páginas, no hay DL ni DF y se cuentan accesos. */
export function etapas(spec: SpecTlb, x: PasoTlb): Etapa[] {
  const simple = !spec.bitsPagina
  const bo = spec.bitsOffset ?? 0
  const P = x.proceso
  const deP = simple ? '' : ` de ${P}`
  const ent = (e: EntradaTlb) => (simple ? `la ${e.pagina}` : `${e.pagina}/${e.frame}/${e.proceso}`)
  const r: Etapa[] = []

  if (x.dl != null) {
    const b = bits(x.dl, spec.bitsPagina! + bo)
    r.push({
      titulo: 'DL',
      dato: `${hx(x.dl)} = ${b.slice(0, spec.bitsPagina)} | ${nibbles(b.slice(spec.bitsPagina))}`,
      porque: `${spec.bitsPagina} bits de página | ${bo} de offset → página ${x.pagina}, offset ${hx(x.offset!, Math.ceil(bo / 4))}`,
      tono: 'neutro',
    })
  }

  const antes = x.tlbAntes
  if (x.hit != null) {
    const acc = simple
      ? ''
      : ` En la TP de ${P}, acc de la ${x.pagina} pasa a ${x.instante} (para LRU).`
    r.push({
      titulo: 'TLB',
      dato: `hit: ${x.pagina} → frame ${x.frame}${simple ? '' : `, de ${P}`}`,
      porque: `Está en la posición ${x.hit}${simple ? '' : ' y es del mismo proceso'}: no se lee la tabla de páginas.${acc}`,
      tono: 'ok',
    })
  } else if (simple) {
    const llena = antes.length === spec.entradas ? 'llena con' : 'con'
    r.push({
      titulo: 'TLB',
      dato: `miss: no está la ${x.pagina}`,
      porque: antes.length
        ? `TLB ${llena} ${yy(antes.map((e) => String(e.pagina)))}.`
        : 'TLB vacía.',
      tono: 'mal',
    })
  } else {
    const otra = antes.find((e) => e.pagina === x.pagina)
    const suyas = antes.filter((e) => e.proceso === P).map((e) => e.pagina)
    if (otra)
      r.push({
        titulo: 'TLB',
        dato: `miss: la ${x.pagina} de la TLB es de ${otra.proceso}`,
        porque: `Las de ${P} son ${las(suyas)}: ninguna sirve (tiene que ser del mismo proceso).`,
        tono: 'mal',
      })
    else {
      const porProceso = [...new Set(antes.map((e) => e.proceso))].sort((a, b) =>
        a === P ? -1 : b === P ? 1 : 0,
      )
      const partes = porProceso.map((q) => {
        const ps = antes.filter((e) => e.proceso === q).map((e) => e.pagina)
        return q === P
          ? `${ps.map((p) => `una ${p}`).join(' y ')} de ${q}`
          : `${PALABRA[ps.length]} de ${q}`
      })
      r.push({
        titulo: 'TLB',
        dato: `miss: no hay ${x.pagina} de ${P}`,
        porque: antes.length
          ? `Hay ${partes.join(', y ')}: ninguna sirve (tiene que ser del mismo proceso).`
          : 'La TLB está vacía.',
        tono: 'mal',
      })
    }
  }
  if (x.hit == null) {
    const porque = simple
      ? `Leer la TP es 1 acceso a memoria${x.pf ? '; traer la página, 1 acceso a disco.' : '. Está en memoria: no hay PF.'}`
      : `Acceso a TP (el ${x.accesosTP}.º del ejercicio). ${x.pf ? 'La página no está en memoria.' : `Está en memoria: no hay PF. acc pasa a ${x.instante}.`}`
    r.push({
      titulo: `Tabla de páginas${deP}`,
      dato: `pág. ${x.pagina} · P = ${x.pf ? '0 → PF' : `1 → frame ${x.frame}`}`,
      porque,
      tono: x.pf ? 'mal' : 'neutro',
    })
  }
  if (x.pf) {
    const marcos = spec.procesos[P]
    const titulo = simple ? `LRU (${marcos.length} frames)` : `LRU local (frames de ${P})`
    if (x.victima) {
      const u = simple ? 'ref.' : 'acc'
      const usos = simple ? x.usos! : [...x.usos!].sort((a, b) => a.pagina - b.pagina)
      const lista = usos.map((s) => `${s.pagina} (${s.acc})`).join(', ')
      r.push({
        titulo,
        dato: `sale la ${x.victima.pagina} (${u} ${x.victima.acc}) del frame ${x.frame}`,
        porque: `${simple ? 'Últimos usos' : `acc de ${P}`}: ${lista}. La ${x.pagina} entra en el frame ${x.frame}.`,
        tono: 'aviso',
      })
    } else {
      const llenos = x.ocupados
      r.push({
        titulo,
        dato: `sin víctima: entra en el frame ${x.frame}, libre`,
        porque: `${simple ? 'Ocupa' : `${P} ocupa`} ${llenos.length} de sus ${marcos.length} frames${simple || !llenos.length ? '' : ` (${llenos.join(', ')})`}: no hace falta sacar a nadie.`,
        tono: 'neutro',
      })
    }
  }
  if (x.hit == null) {
    const nueva = simple ? `la ${x.pagina}` : `${x.pagina}/${x.frame}/${P} (${x.instante})`
    if (x.sale) {
      const porque = simple
        ? `Entraron en orden ${yy([...antes].sort((a, b) => a.ingreso - b.ingreso).map((e) => String(e.pagina)))}: la primera es la ${x.sale.pagina}, en la posición ${x.pos}.`
        : `Ingresos: ${antes.map((e) => e.ingreso).join(', ')}. La más vieja es la de ${x.sale.ingreso}, en la posición ${x.pos}.`
      r.push({
        titulo: 'TLB (FIFO)',
        dato: `sale ${ent(x.sale)}${simple ? '' : ` (${x.sale.ingreso})`} · entra ${nueva}`,
        porque,
        tono: 'aviso',
      })
    } else
      r.push({
        titulo: 'TLB (FIFO)',
        dato: `entra ${nueva}`,
        porque: 'Hay lugar en la TLB: no sale ninguna.',
        tono: 'aviso',
      })
  }
  if (x.df != null) {
    const bf = spec.bitsFrame
    r.push({
      titulo: 'DF',
      dato: `${x.frame} × ${hx(2 ** bo)} + ${hx(x.offset!, Math.ceil(bo / 4))} = ${hx(x.df, Math.ceil(((bf ?? 0) + bo) / 4))}`,
      porque: `frame (${bf} bits) | offset (${bo} bits)`,
      tono: 'ok',
    })
  } else if (simple)
    r.push({
      titulo: 'Accesos',
      dato: `TLB 1 · memoria ${x.hit != null ? 1 : 2} · disco ${x.pf ? 1 : 0}`,
      porque:
        x.hit != null
          ? 'Hit: solo el dato en memoria.'
          : `Miss: TP + dato en memoria.${x.pf ? ' El PF suma la lectura de disco.' : ''}`,
      tono: 'ok',
    })
  return r
}

/** "Hasta acá": hits/TP/PF, o accesos a TLB, memoria y disco sin direcciones. */
export function hastaAca(spec: SpecTlb, pasos: PasoTlb[], k: number): string {
  if (k < 0)
    return spec.bitsPagina
      ? 'TLB hits: 0 · accesos a TP: 0 · PF: 0'
      : 'TLB: 0 · memoria: 0 · disco: 0'
  const x = pasos[k]
  if (spec.bitsPagina) return `TLB hits: ${x.hits} · accesos a TP: ${x.accesosTP} · PF: ${x.pfs}`
  const hechos = pasos.slice(0, k + 1)
  const memoria = hechos.reduce((s, p) => s + (p.hit != null ? 1 : 2), 0)
  return `TLB: ${k + 1} · memoria: ${memoria} · disco: ${x.pfs}`
}

function resumen(x: PasoTlb): string {
  const tlb = x.hit != null ? '**Hit** en la TLB' : '**Miss** en la TLB'
  const pf = x.pf ? ' y **PF**' : ''
  const frame = x.victima
    ? `: sale la ${x.victima.pagina} del frame ${x.frame}`
    : x.pf
      ? `: entra en el frame libre ${x.frame}`
      : ''
  return `${tlb}${pf}${frame}${x.df != null ? `. DF = **${hx(x.df)}**.` : '.'}`
}

export function recorridoTlb(spec: SpecTlb): Recorrido {
  const pasosTlb = simularTlb(spec)
  const inicial = dibujoInicial(spec, hastaAca(spec, pasosTlb, -1))
  const dibujos = [
    inicial,
    ...pasosTlb.map((x, k) =>
      dibujoReferencia(spec, x, etapas(spec, x), hastaAca(spec, pasosTlb, k)),
    ),
  ]
  const pasos: Paso[] = [
    {
      titulo: 'Estado inicial',
      texto: spec.bitsPagina
        ? 'Antes de la primera referencia: cómo se cortan las direcciones y qué hay en la TLB y en los frames de cada proceso.'
        : 'Antes de la primera referencia: qué hay en la TLB y en los frames.',
    },
    ...pasosTlb.map((x, k) => ({
      titulo:
        x.dl != null
          ? `${rotuloProceso(x.proceso)} ${hx(x.dl)} (instante ${x.instante})`
          : `Ref. ${k + 1} (página ${x.pagina})`,
      texto: resumen(x),
    })),
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
