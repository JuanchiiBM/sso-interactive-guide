/** Bloque ```tlb con `niveles`: dos niveles de tablas y bitmap (tablero tlb-08). Ver brain: Resolución gráfica de la TLB. */
import type { Paso, Recorrido } from './recorrido'
import {
  caja,
  camino,
  renglones,
  tabla,
  tablasEnFila,
  txt,
  W,
  X0,
  type BloqueTabla,
} from './recorrido-tlb-svg'
import { grupo } from './svg'
import {
  etapasNiveles,
  hxd,
  simularNiveles,
  type EntradaNiveles,
  type SpecTlbNiveles,
} from './tlb-niveles'

const hasta = (h: number, a: number, p: number) =>
  `TLB hits: ${h} · accesos a tablas: ${a} · PF: ${p}`

export function recorridoTlbNiveles(spec: SpecTlbNiveles): Recorrido {
  const [b1, b2] = spec.niveles
  const { bitsOffset: bo, bitsFrame: bf } = spec
  const pasosN = simularNiveles(spec)
  const filasTlb = (tlb: EntradaNiveles[], nueva?: number) =>
    tlb.map((e, i) => [
      hxd(e.pagina, b1 + b2),
      hxd(e.frame, bf),
      `${e.proceso}${i === nueva ? ' (nueva)' : ''}`,
    ])
  const colsBitmap = spec.bitmap.bits.map((_, i) => hxd(spec.bitmap.desde + i, bf))
  const libre = (bits: (0 | 1)[]) => {
    const i = bits.indexOf(0)
    return i < 0 ? 'ninguno' : hxd(spec.bitmap.desde + i, bf)
  }

  // paso 1: formato, TLB, tablas y bitmap
  let y = 4
  const pag = 2 ** bo
  const formato = caja(
    X0,
    y,
    W - 2 * X0,
    `DL ${b1 + b2 + bo} bits = 1.er nivel (${b1}) | 2.º nivel (${b2}) | offset (${bo})`,
    `DF ${bf + bo} bits = frame (${bf}) | offset (${bo}). Página de ${pag % 1024 ? `${pag} B` : `${pag / 1024} KiB`} = 2^${bo}; DF = frame × ${hxd(pag, 0)}h + offset.`,
    'neutro',
  )
  y += formato.h + 16
  const bloques: BloqueTabla[] = [
    { rotulo: 'TLB', cols: ['Pág.', 'Frame', 'Proc.'], filas: filasTlb(spec.tlb ?? []) },
    {
      rotulo: 'TP 1.er nivel',
      cols: ['Entrada', '2.º nivel en'],
      filas: Object.entries(spec.tp1).map(([k, v]) => [hxd(+k, b1), `${hxd(v, 32)}h`]),
    },
    ...Object.entries(spec.tablas).map(([dir, filas]) => ({
      rotulo: `TP 2.º nivel en ${hxd(+dir, 32)}h`,
      cols: ['Pág.', 'Frame', 'P'],
      filas: Object.entries(filas).map(([k, f]) => [hxd(+k, b2), hxd(f.frame, bf), String(f.p)]),
    })),
  ]
  const fila = tablasEnFila(bloques, y)
  y = fila.y
  const bm = tabla(X0, y + 20, colsBitmap, [spec.bitmap.bits.map(String)])
  let inicial =
    formato.svg +
    fila.svg +
    txt(X0, y + 8, `Bitmap de frames (la flecha en ${colsBitmap[0]})`, 'tlb-etq') +
    bm.svg
  y += 20 + bm.h + 16
  const refs = spec.referencias.map((r) => `${r.proceso} ${hxd(r.dl, b1 + b2 + bo)}h`).join(' · ')
  inicial += txt(X0, y + 8, 'Referencias', 'tlb-etq')
  renglones(refs, 96).forEach((l, i) => (inicial += txt(X0, y + 30 + i * 18, l, 'tlb-hasta')))
  y += 48
  inicial += txt(X0, y + 4, 'Hasta acá', 'tlb-etq') + txt(X0, y + 26, hasta(0, 0, 0), 'tlb-hasta')
  const dibujos = [{ svg: inicial, alto: y + 36 }]

  for (const x of pasosN) {
    const c = camino(etapasNiveles(spec, x), 4)
    const y0 = c.alto + 14
    const t = tabla(
      X0,
      y0 + 20,
      ['Pág.', 'Frame', 'Proc.'],
      filasTlb(x.tlb, x.hit ? undefined : x.tlb.length - 1),
      x.hit ? undefined : x.tlb.length - 1,
    )
    const xd = X0 + t.w + 24
    const b = tabla(xd, y0 + 20, colsBitmap, [x.bits.map(String)])
    const svg =
      c.svg +
      txt(X0, y0 + 8, 'TLB después de este paso', 'tlb-etq') +
      t.svg +
      txt(xd, y0 + 8, `Bitmap después (siguiente libre: ${libre(x.bits)})`, 'tlb-etq') +
      b.svg +
      txt(xd, y0 + 20 + b.h + 18, 'Hasta acá', 'tlb-etq') +
      txt(xd, y0 + 20 + b.h + 40, hasta(x.hits, x.accesos, x.pfs), 'tlb-hasta')
    dibujos.push({ svg, alto: y0 + 20 + Math.max(t.h, b.h + 50) + 4 })
  }

  const pasos: Paso[] = [
    {
      titulo: 'Estado inicial',
      texto:
        'Antes de la primera referencia: cómo se corta la dirección, la TLB, las tablas y el bitmap.',
    },
    ...pasosN.map((x) => ({
      titulo: `${x.proceso} ${hxd(x.dl, b1 + b2 + bo)}h`,
      texto: `${x.hit ? '**Hit** en la TLB' : '**Miss** en la TLB'}${x.pf ? ` y **PF**: el bitmap da el frame ${hxd(x.frame, bf)}` : ''}. DF = **${hxd(x.df, bf + bo)}h**.`,
    })),
  ].map((p, k, todos) => ({
    ...p,
    resaltar: [`paso-${k}`],
    mostrar: [`paso-${k}`],
    ocultar: todos.map((_, i) => `paso-${i}`).filter((_, i) => i !== k),
  }))
  return {
    ancho: W,
    alto: Math.max(...dibujos.map((d) => d.alto)),
    titulo: spec.titulo,
    cuerpo: dibujos.map((d, k) => grupo(`paso-${k}`, d.svg, { oculto: true, clase: 'tlb-paso' })),
    pasos,
  }
}
