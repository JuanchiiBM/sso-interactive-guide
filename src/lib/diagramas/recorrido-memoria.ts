/** Resolución gráfica de huecos (```memoria): un fotograma por paso con chips, barras antes/después, flecha y tabla. */
import type { Paso, Recorrido } from './recorrido'
import {
  simularHuecos,
  huecosDe,
  type BloqueMem,
  type PasoMem,
  type SpecMemoria,
} from './memoria-huecos'
import type { AlgoritmoUbicacion, Hueco } from './memoria'
import { grupo, texto } from './svg'

export interface SpecRecorridoMemoria extends SpecMemoria {
  titulo: string
  /** KiB, MiB y bloques: los números del enunciado, sin convertir. */
  unidad?: 'hexa' | 'decimal' | 'KiB' | 'MiB' | 'bloques'
  /** Proceso cuya tabla de segmentos se muestra en cada paso. */
  tabla?: string
  /** Texto extra del autor para el estado inicial. */
  textoInicial?: string
}

const NOMBRE: Record<AlgoritmoUbicacion, string> = {
  mejor: 'Best Fit',
  peor: 'Worst Fit',
  primer: 'First Fit',
  siguiente: 'Next Fit',
}
const CRITERIO: Record<AlgoritmoUbicacion, string> = {
  mejor: 'elige el más chico donde entra',
  peor: 'elige el más grande',
  primer: 'elige el primero (por dirección) donde entra',
  siguiente: 'sigue buscando desde la última asignación',
}

const ANCHO = 760
const X0 = 20
const W = 720
const BARRA = 44
const CHIP = 20

const lista = (xs: string[]) =>
  xs.length < 2 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`

export function recorridoMemoria(spec: SpecRecorridoMemoria): Recorrido {
  const unidad = spec.unidad ?? 'hexa'
  const hexa = unidad === 'hexa'
  const enBloques = unidad === 'bloques'
  const dir = (n: number) =>
    hexa ? `${n.toString(16).toUpperCase().padStart(4, '0')}h` : String(n)
  const tam = (n: number) => {
    if (unidad === 'MiB') return `${n} MiB`
    if (enBloques) return `${n} ${n === 1 ? 'bloque' : 'bloques'}`
    const kib = unidad === 'KiB' || n % 1024 === 0
    if (unidad === 'decimal' || !kib) return `${n} B`
    return n % 1024 === 0 ? `${n / 1024} ${hexa ? 'KiB' : 'MiB'}` : `${n} KiB`
  }
  // en bloques, cada parte muestra su rango inclusivo (21–26) en vez de la base o el tamaño
  const sub = (inicio: number, t: number, hueco: boolean) =>
    enBloques ? `${inicio}–${inicio + t - 1}` : hueco ? tam(t) : dir(inicio)
  const tamCol = (n: number) => (hexa ? dir(n) : String(n))
  const rango = (h: Hueco) => `[${dir(h.inicio)}, ${dir(h.inicio + h.tam)})`
  const px = (v: number) => X0 + (v / spec.total) * W
  const alg = NOMBRE[spec.algoritmo]

  const pasos = simularHuecos(spec)
  const procesos = [
    ...new Set(pasos.flatMap((p) => [...p.antes, ...p.despues]).map((b) => b.proceso)),
  ]
  const color = (b: BloqueMem) => `rm-p${(procesos.indexOf(b.proceso) % 8) + 1}`

  const libreDe = (p: PasoMem) => p.huecosAntes.reduce((s, h) => s + h.tam, 0)
  const compactarChip = (p: PasoMem, t: number): [string, string] => [
    `total libre ${tam(libreDe(p))} ≥ ${tam(t)} → compactar`,
    'neutro',
  ]
  const chipsDe = (p: PasoMem): [string, string][] => {
    if (!p.op) return p.huecosAntes.map((h) => [`hueco ${rango(h)} ${tam(h.tam)}`, 'neutro'])
    if ('libera' in p.op)
      return p.liberados.map((b) => [`${b.nombre} libera ${rango(b)}`, 'neutro'])
    if ('agranda' in p.op) {
      const { agranda, tam: t } = p.op
      const chips: [string, string][] = p.candidatos.map(({ hueco, estado }) => {
        const r = `${rango(hueco)} ${tam(hueco.tam)}`
        if (estado === 'no-al-lado') return [`${r} ✗ no está al lado`, 'mal']
        if (estado === 'elegido') return [`después de ${agranda}: ${r} ✓ alcanza`, 'ok']
        return [`después de ${agranda}: ${r} ✗ faltan ${tam(t - hueco.tam)}`, 'mal']
      })
      if (!p.candidatos.some((c) => c.estado !== 'no-al-lado'))
        chips.unshift([`después de ${agranda}: sin hueco ✗`, 'mal'])
      if (p.movidos.length) chips.push(compactarChip(p, t))
      return chips
    }
    const chips: [string, string][] = p.candidatos.map(({ hueco, estado }) => {
      const t = `${rango(hueco)} ${tam(hueco.tam)}`
      if (estado === 'no-entra') return [`${t} ✗ no entra`, 'mal']
      if (estado === 'elegido') return [`${t} ✓ elegido`, 'ok']
      if (estado === 'empate') return [`${t} ✓ también vale (empate)`, 'ok']
      return [`${t} · entra, pero ${alg} no lo elige`, 'aviso']
    })
    if (p.movidos.length) chips.push(compactarChip(p, p.op.tam))
    return chips
  }

  // chips en filas que no pasen el ancho
  const ubicarChips = (chips: [string, string][]) => {
    let x = X0
    let fila = 0
    return chips.map(([t, clase]) => {
      const w = t.length * 6.6 + 16
      if (x + w > X0 + W && x > X0) {
        x = X0
        fila++
      }
      const c = { t, clase, x, fila, w }
      x += w + 8
      return c
    })
  }
  const chipsPorPaso = pasos.map((p) => ubicarChips(chipsDe(p)))
  const filasChips = Math.max(1, ...chipsPorPaso.map((cs) => (cs.at(-1)?.fila ?? 0) + 1))

  const yAntes = 14 + filasChips * (CHIP + 6) + 14
  const yDespues = yAntes + BARRA + 52
  const yMarcas = yDespues + BARRA + 14
  const yTabla = yMarcas + 26

  const segsTabla = spec.tabla
    ? [
        ...new Set(
          pasos
            .flatMap((p) => p.despues)
            .filter((b) => b.proceso === spec.tabla)
            .map((b) => b.nombre),
        ),
      ].sort()
    : []
  const filasTabla =
    segsTabla.length + Math.max(...pasos.map((p) => huecosDe(spec.total, p.despues).length))
  const alto = spec.tabla ? yTabla + 40 + filasTabla * 20 + 8 : yMarcas + 16

  const op = (p: PasoMem) => (p.op && 'agranda' in p.op ? p.op : undefined)
  const barra = (bloques: BloqueMem[], y: number, p: PasoMem, antes: boolean) => {
    const estadoHueco = (h: Hueco) => {
      if (!antes || !p.op || 'libera' in p.op) return ''
      const c = p.candidatos.find((x) => x.hueco.inicio === h.inicio)
      return c ? ` rm-${c.estado === 'no-al-lado' ? 'no-entra' : c.estado}` : ''
    }
    const parte = (x0: number, w: number, clase: string, l1: string, l2: string) => {
      const chica = w < 46 ? ' rm-chica' : ''
      const textos =
        w < 22
          ? ''
          : w < (enBloques ? 38 : 60)
            ? texto(x0 + w / 2, y + BARRA / 2, l1, { clase: `rm-etq${chica}` })
            : texto(x0 + w / 2, y + BARRA / 2 - 7, l1, { clase: 'rm-etq' }) +
              texto(x0 + w / 2, y + BARRA / 2 + 9, l2, { clase: 'rm-etq rm-chica rm-sub' })
      return `<g class="rm-seg ${clase}"><rect x="${x0}" y="${y}" width="${w}" height="${BARRA}" rx="3"/>${textos}</g>`
    }
    const segs = bloques.map((b) => {
      const c = !antes ? p.crece : undefined
      if (c?.nombre === b.nombre) {
        const viejo = { ...b, tam: b.tam - c.tam }
        const mov = p.movidos.some((m) => m.nombre === b.nombre) ? ' rm-mov' : ''
        return (
          parte(
            px(viejo.inicio),
            px(c.inicio) - px(viejo.inicio),
            color(b) + mov,
            b.nombre,
            sub(viejo.inicio, viejo.tam, false),
          ) +
          parte(
            px(c.inicio),
            px(c.inicio + c.tam) - px(c.inicio),
            `${color(b)} rm-nuevo`,
            `+${enBloques ? c.tam : tam(c.tam)}`,
            op(p)?.etiqueta ?? sub(c.inicio, c.tam, false),
          )
        )
      }
      const extra =
        !antes && p.nuevo?.nombre === b.nombre
          ? ' rm-nuevo'
          : p.movidos.some((m) => m.nombre === b.nombre)
            ? ' rm-mov'
            : ''
      return parte(
        px(b.inicio),
        px(b.inicio + b.tam) - px(b.inicio),
        color(b) + extra,
        b.nombre,
        sub(b.inicio, b.tam, false),
      )
    })
    const huecos = huecosDe(spec.total, bloques).map((h) =>
      parte(
        px(h.inicio),
        px(h.inicio + h.tam) - px(h.inicio),
        `rm-hueco rm-rayado${estadoHueco(h)}`,
        'libre',
        sub(h.inicio, h.tam, true),
      ),
    )
    const rejilla = enBloques
      ? Array.from({ length: spec.total - 1 }, (_, k) => {
          const x = px(k + 1)
          return `<line class="rm-rejilla" x1="${x}" y1="${y + 3}" x2="${x}" y2="${y + BARRA - 3}"/>`
        })
      : []
    return [...huecos, ...segs, ...rejilla].join('')
  }

  const flechas = (p: PasoMem) =>
    p.movidos
      .map((m) => {
        const b = p.antes.find((x) => x.nombre === m.nombre)!
        const x1 = px(m.de + b.tam / 2)
        const x2 = px(m.a + b.tam / 2)
        const y1 = yAntes + BARRA + 4
        const y2 = yDespues - 6
        const ym = (y1 + y2) / 2
        const etq = `${m.nombre}: base ${dir(m.de)} → ${dir(m.a)}`
        const w = etq.length * 6.6 + 12
        return (
          `<path class="rm-flecha" d="M ${x1} ${y1} C ${x1} ${ym}, ${x2} ${ym}, ${x2} ${y2}"/>` +
          `<path class="rm-flecha-punta" d="M ${x2 - 5} ${y2 - 7} L ${x2} ${y2} L ${x2 + 5} ${y2 - 7}"/>` +
          `<rect class="rm-flecha-fondo" x="${(x1 + x2) / 2 - w / 2}" y="${ym - 9}" width="${w}" height="18" rx="3"/>` +
          texto((x1 + x2) / 2, ym, etq, { clase: 'rm-flecha-etq' })
        )
      })
      .join('')

  const tabla = (p: PasoMem) => {
    if (!spec.tabla) return ''
    const col = [X0, X0 + 80, X0 + 260]
    const fila = (i: number, celdas: string[], clase = '') =>
      `<g class="rm-fila ${clase}">${celdas.map((c, j) => texto(col[j] + 8, yTabla + 40 + i * 20, c, { clase: 'rm-izq' })).join('')}</g>`
    const segs = segsTabla.map((n, i) => {
      const b = p.despues.find((x) => x.nombre === n)
      const etq = n.replace(`${spec.tabla}.`, '').replace(/^S/, '')
      if (!b) return fila(i, [etq, '—', '—'], 'rm-fila-vacia')
      const m = p.movidos.find((x) => x.nombre === n)
      if (m) return fila(i, [etq, `${dir(m.a)} ← ${dir(m.de)}`, tamCol(b.tam)], 'rm-fila-mov')
      if (p.nuevo?.nombre === n)
        return fila(i, [etq, `${dir(b.inicio)} (nuevo)`, tamCol(b.tam)], 'rm-fila-nueva')
      return fila(i, [etq, dir(b.inicio), tamCol(b.tam)])
    })
    const huecos = huecosDe(spec.total, p.despues).map((h, k) =>
      fila(
        segsTabla.length + k,
        ['Hueco', dir(h.inicio), hexa ? `${tamCol(h.tam)} (${tam(h.tam)})` : tamCol(h.tam)],
        'rm-fila-hueco',
      ),
    )
    return (
      texto(X0, yTabla, `Tabla de segmentos de ${spec.tabla} en este paso`, {
        clase: 'rm-izq rm-tabla-tit',
      }) +
      ['Seg', 'Base', 'Tamaño']
        .map((t, j) => texto(col[j] + 8, yTabla + 20, t, { clase: 'rm-izq rm-enc' }))
        .join('') +
      `<line class="rm-eje" x1="${X0}" y1="${yTabla + 29}" x2="${X0 + 440}" y2="${yTabla + 29}"/>` +
      [...segs, ...huecos].join('')
    )
  }

  const fotograma = (p: PasoMem, i: number) => {
    const chips = chipsPorPaso[i]
      .map(
        (c) =>
          `<g class="rm-chip rm-chip-${c.clase}"><rect x="${c.x}" y="${14 + c.fila * (CHIP + 6)}" width="${c.w}" height="${CHIP}" rx="4"/>` +
          texto(c.x + c.w / 2, 14 + c.fila * (CHIP + 6) + CHIP / 2, c.t) +
          '</g>',
      )
      .join('')
    // si una flecha llega al principio de la barra, los rótulos van a la derecha para no taparla
    const der = p.movidos.some((m) => px(m.a) < X0 + 90)
    const rot = (y: number, t: string) =>
      texto(der ? X0 + W : X0, y, t, { clase: `${der ? 'rm-der' : 'rm-izq'} rm-nota` })
    const antes = p.op ? rot(yAntes - 8, 'Antes') + barra(p.antes, yAntes, p, true) : ''
    const despues =
      rot(yDespues - 8, p.op ? 'Después' : 'Memoria') + barra(p.despues, yDespues, p, false)
    return grupo(`paso-${i}`, chips + antes + flechas(p) + despues + tabla(p), { oculto: true })
  }

  const paso = (p: PasoMem): Omit<Paso, 'resaltar' | 'mostrar' | 'ocultar'> => {
    if (!p.op) {
      const hs = p.huecosAntes.map((h) => `${rango(h)} ${tam(h.tam)}`)
      return {
        titulo: 'Estado inicial',
        texto: [`Huecos libres: ${lista(hs)}.`, spec.textoInicial].filter(Boolean).join(' '),
      }
    }
    const extra = p.op.texto ?? ''
    if ('libera' in p.op) {
      const hs = huecosDe(spec.total, p.despues)
      const libre = hs.reduce((s, h) => s + h.tam, 0)
      const txt = `**${p.op.libera} termina**: libera ${lista(p.liberados.map((b) => b.nombre))}. Quedan **${tam(libre)} libres** en ${hs.length} ${hs.length === 1 ? 'hueco' : 'huecos'}.`
      return { titulo: `${p.op.libera} termina`, texto: [txt, extra].filter(Boolean).join(' ') }
    }
    if ('agranda' in p.op) {
      const { agranda, tam: t } = p.op
      const b = p.antes.find((x) => x.nombre === agranda)!
      const lugar = p.candidatos.find((c) => c.estado !== 'no-al-lado')
      const libres = huecosDe(spec.total, p.despues)
      const sobra = libres.find((h) => h.inicio === p.crece!.inicio + t)?.tam ?? 0
      const cuenta = `(${hexa ? tam(b.tam) : b.tam} → ${tam(b.tam + t)})`
      const alLado = lugar
        ? `El hueco de al lado mide ${tam(lugar.hueco.tam)}`
        : 'Atrás no tiene hueco'
      let txt = `**${agranda} crece ${tam(t)}** ${cuenta}. `
      if (p.movidos.length) {
        const movs = lista(p.movidos.map((m) => `${m.nombre} (${dir(m.de)} → ${dir(m.a)})`))
        txt += `${alLado}: no alcanza. Libres hay ${tam(libreDe(p))} en ${p.huecosAntes.length} huecos: fragmentación externa → hay que **compactar**. Se ${p.movidos.length > 1 ? 'mueven' : 'mueve'} ${movs} y crece ahí.`
      } else txt += `${alLado}: alcanza, crece en su lugar.`
      txt += sobra ? ` Sobran **${tam(sobra)}**.` : ' Encaja justo.'
      return {
        titulo: p.op.titulo ?? `${agranda} crece ${tam(t)}`,
        texto: [txt, p.op.texto].filter(Boolean).join(' '),
      }
    }
    const titulo = `${p.op.carga} (${tam(p.op.tam)})`
    const nuevo = p.nuevo!
    const sirven = p.candidatos.filter((c) => c.estado !== 'no-entra')
    let txt: string
    if (p.movidos.length) {
      const libre = p.huecosAntes.reduce((s, h) => s + h.tam, 0)
      const movs = lista(p.movidos.map((m) => `${m.nombre} (${dir(m.de)} → ${dir(m.a)})`))
      txt = `**No entra** en ningún hueco (${lista(p.huecosAntes.map((h) => tam(h.tam)))}), aunque hay **${tam(libre)} libres**: fragmentación externa. Se compacta moviendo ${movs}; ${p.op.carga} va en **${dir(nuevo.inicio)}**.`
    } else if (sirven.length === 1) {
      txt = `Solo entra en el hueco de ${tam(sirven[0].hueco.tam)}: va en **${dir(nuevo.inicio)}**.`
    } else {
      const empate = p.candidatos.some((c) => c.estado === 'empate')
      txt =
        `Entra en ${sirven.length} huecos (${lista(sirven.map((c) => tam(c.hueco.tam)))}). ${alg} ${CRITERIO[spec.algoritmo]}: el de **${tam(p.candidatos.find((c) => c.estado === 'elegido')!.hueco.tam)}** en **${dir(nuevo.inicio)}**.` +
        (empate ? ' Hay empate: se toma el primero, pero el otro también vale.' : '')
    }
    const hueco = p.movidos.length ? null : p.candidatos.find((c) => c.estado === 'elegido')!.hueco
    if (hueco)
      txt +=
        hueco.tam === nuevo.tam
          ? ' Encaja justo.'
          : ` Sobra un hueco de ${tam(hueco.tam - nuevo.tam)} en ${dir(nuevo.inicio + nuevo.tam)}.`
    return { titulo, texto: [txt, extra].filter(Boolean).join(' ') }
  }

  const ids = pasos.map((_, i) => `paso-${i}`)
  const marcas = Array.from({ length: 9 }, (_, k) => (spec.total / 8) * k).map((v, k) =>
    texto(px(v), yMarcas, dir(v), {
      clase: `rm-marca${k === 0 ? ' rm-izq' : k === 8 ? ' rm-der' : ''}`,
    }),
  )
  return {
    ancho: ANCHO,
    alto,
    titulo: spec.titulo,
    cuerpo: [
      `<defs><pattern id="rm-rayas" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="rm-raya-fondo" width="8" height="8"/><line class="rm-raya" x1="0" y1="0" x2="0" y2="8"/></pattern></defs>`,
      ...pasos.map(fotograma),
      ...marcas,
    ],
    pasos: pasos.map((p, i) => ({
      ...paso(p),
      resaltar: [ids[i]],
      mostrar: [ids[i]],
      ocultar: ids.filter((_, k) => k !== i),
    })),
  }
}
