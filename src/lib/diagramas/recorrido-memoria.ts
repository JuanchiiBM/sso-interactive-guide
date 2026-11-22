/** Resolución gráfica de huecos (```memoria): un fotograma por paso con chips, barras antes/después, flecha y tabla. */
import type { Paso, Recorrido } from './recorrido'
import {
  simularHuecos,
  huecosDe,
  type BloqueMem,
  type OpMem,
  type PasoMem,
  type SpecMemoria,
} from './memoria-huecos'
import type { AlgoritmoUbicacion, Hueco } from './memoria'
import { grupo, texto } from './svg'

export interface SpecRecorridoMemoria extends SpecMemoria {
  titulo: string
  /** KiB, MiB y bloques: los números del enunciado, sin convertir. */
  unidad?: 'hexa' | 'decimal' | 'KiB' | 'MiB' | 'bloques'
  /** Proceso cuya tabla de segmentos se muestra en cada paso, o `todos` | `particiones` | `directorio`. */
  tabla?: string
  /** Texto extra del autor para el estado inicial. */
  textoInicial?: string
  /** El paso inicial cuenta qué bloques de un archivo contiguo se leen (solo en bloques). */
  lectura?: {
    archivo: string
    desde: number
    bytes: number
    bloque: number
    titulo?: string
    rotulo?: string
    completar?: string[][]
  }
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

function leer(
  l: NonNullable<SpecRecorridoMemoria['lectura']>,
  bloques: BloqueMem[],
  unidad: string,
) {
  if (unidad !== 'bloques') throw new Error('memoria: `lectura` va con `unidad: bloques`')
  const b = bloques.find((x) => x.nombre === l.archivo)
  if (!b) throw new Error(`memoria: no existe ${l.archivo} para leer`)
  const fin = l.desde + l.bytes - 1
  const [primero, ultimo] = [Math.floor(l.desde / l.bloque), Math.floor(fin / l.bloque)]
  if (ultimo >= b.tam) throw new Error(`memoria: la lectura se pasa de ${l.archivo}`)
  return { l, b, primero, ultimo, fin }
}

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
  const lect = spec.lectura && leer(spec.lectura, pasos[0].despues, unidad)
  const procesos = [
    ...new Set(pasos.flatMap((p) => [...p.antes, ...p.despues]).map((b) => b.proceso)),
  ]
  const color = (b: BloqueMem) => `rm-p${(procesos.indexOf(b.proceso) % 8) + 1}`

  const tamDe = (op: OpMem) =>
    'segmentos' in op ? op.segmentos.reduce((s, x) => s + x.tam, 0) : 'tam' in op ? op.tam : 0
  const esNuevo = (p: PasoMem, b: BloqueMem) =>
    p.nuevo?.nombre === b.nombre || !!p.juntos?.some((x) => x.nombre === b.nombre)
  const libreDe = (p: PasoMem) => p.huecosAntes.reduce((s, h) => s + h.tam, 0)
  const compactarChip = (p: PasoMem, t: number): [string, string] => [
    `total libre ${tam(libreDe(p))} ≥ ${tam(t)} → compactar`,
    'neutro',
  ]
  const chipsDe = (p: PasoMem): [string, string][] => {
    if (!p.op && lect) {
      const { desde, bloque } = lect.l
      const coc = (n: number) => `${n} / ${bloque} = ${(n / bloque).toFixed(2).replace('.', ',')}`
      return [
        [`${coc(desde)} → lógico ${lect.primero}`, 'neutro'],
        [`${coc(lect.fin)} → lógico ${lect.ultimo}`, 'neutro'],
        [`bloque del FS = ${lect.b.inicio} + lógico`, 'ok'],
      ]
    }
    if (!p.op) return p.huecosAntes.map((h) => [`hueco ${rango(h)} ${tam(h.tam)}`, 'neutro'])
    if ('libera' in p.op)
      return p.liberados.map((b) => [`${b.nombre} libera ${rango(b)}`, 'neutro'])
    if ('marca' in p.op)
      return (p.op.chips ?? [])
        .flatMap((c) => Object.entries(c) as [string, string][])
        .map(([k, t]) => [t, k])
    if ('agranda' in p.op) {
      const { agranda, tam: t } = p.op
      const chips: [string, string][] = p.candidatos.map(({ hueco, estado }) => {
        const r = `${rango(hueco)} ${tam(hueco.tam)}`
        if (estado === 'no-al-lado') return [`${r} ✗ no está al lado`, 'mal']
        if (estado === 'elegido') return [`después de ${agranda}: ${r} ✓ alcanza`, 'ok']
        return [`después de ${agranda}: ${r} ✗ faltan ${tam(t - hueco.tam)}`, 'mal']
      })
      // primero el hueco de atrás, que es el que decide
      chips.sort((a, b) => Number(b[0].startsWith('después')) - Number(a[0].startsWith('después')))
      if (!p.candidatos.some((c) => c.estado !== 'no-al-lado'))
        chips.unshift([`después de ${agranda}: sin hueco ✗`, 'mal'])
      if (p.movidos.length) chips.push(compactarChip(p, t))
      return chips
    }
    const chips: [string, string][] = p.candidatos.map(({ hueco, estado }) => {
      const t = `${rango(hueco)} ${tam(hueco.tam)}`
      if (estado === 'no-entra') return [`${t} ✗ no entra`, 'mal']
      if (estado === 'entra-uno') return [`${t} · entra uno solo`, 'aviso']
      if (estado === 'elegido') return [`${t} ✓ elegido`, 'ok']
      if (estado === 'empate') return [`${t} ✓ también vale (empate)`, 'ok']
      return [`${t} · entra, pero ${alg} no lo elige`, 'aviso']
    })
    if (p.movidos.length) chips.push(compactarChip(p, tamDe(p.op)))
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
  const marcaDe = (p: PasoMem) => (p.op && 'marca' in p.op ? p.op : undefined)
  // las marcas y la tabla bajan solo en los pasos que dibujan algo más (regla de DL, cajas)
  const conCajas = (p: PasoMem) => !p.op && !!lect
  const yMarcasDe = (p: PasoMem) => yDespues + BARRA + 14 + (marcaDe(p) ? 56 : 0)
  const yTablaDe = (p: PasoMem) => yMarcasDe(p) + 26 + (conCajas(p) ? 76 : 0)

  type Fila = [string[], string]
  const sufijo = unidad === 'KiB' || unidad === 'MiB' ? ` (${unidad})` : ''
  const modo = spec.tabla
  const tablaDe =
    modo === 'todos'
      ? {
          titulo: `Tablas de segmentos en este paso${sufijo}`,
          columnas: ['Proceso', 'Seg', 'Base', 'Tamaño'],
        }
      : modo === 'particiones'
        ? { titulo: `Particiones en este paso${sufijo}`, columnas: ['Partición', 'Base', 'Tamaño'] }
        : modo === 'directorio'
          ? {
              titulo: 'Directorio (contigua) en este paso',
              columnas: ['Archivo', 'Inicio', 'Bloques'],
            }
          : {
              titulo: `Tabla de segmentos de ${modo} en este paso`,
              columnas: ['Seg', 'Base', 'Tamaño'],
            }
  const segDe = (n: string) => n.split('.').slice(1).join('.').replace(/^S/, '')
  // base y tamaño de un bloque en el paso: movido "26 ← 21", crecido "11 ← 3", recién cargado "(nuevo)"
  const celdas = (p: PasoMem, b: BloqueMem): Fila => {
    const m = p.movidos.find((x) => x.nombre === b.nombre)
    const c = p.crece?.nombre === b.nombre ? p.crece : undefined
    const base = m
      ? `${dir(m.a)} ← ${dir(m.de)}`
      : esNuevo(p, b)
        ? `${dir(b.inicio)} (nuevo)`
        : dir(b.inicio)
    const t = c ? `${tamCol(b.tam)} ← ${tamCol(b.tam - c.tam)}` : tamCol(b.tam)
    const clase = m
      ? 'rm-fila-mov'
      : c || esNuevo(p, b)
        ? 'rm-fila-nueva'
        : marcaDe(p)?.marca === b.nombre
          ? 'rm-fila-ok'
          : ''
    return [[base, t], clase]
  }
  const hueco = (h: Hueco, etq: string): Fila => [
    [
      etq,
      ...(modo === 'todos' ? [''] : []),
      dir(h.inicio),
      hexa ? `${tamCol(h.tam)} (${tam(h.tam)})` : tamCol(h.tam),
    ],
    'rm-fila-hueco',
  ]
  const procesoDe = new Map(pasos.flatMap((p) => p.despues).map((b) => [b.nombre, b.proceso]))
  const todosLosSegs = [...procesoDe.keys()].sort()
  const filasDe = (p: PasoMem): Fila[] => {
    const huecos = huecosDe(spec.total, p.despues)
    if (modo === 'particiones') {
      const partes = [...p.despues, ...huecos.map((h) => ({ ...h, nombre: '' }))].sort(
        (a, b) => a.inicio - b.inicio,
      )
      return partes.map((x) => {
        if (!x.nombre) return hueco(x, 'Hueco')
        const [cs, cl] = celdas(p, x as BloqueMem)
        return [[x.nombre, ...cs], cl]
      })
    }
    if (modo === 'directorio')
      return [
        ...p.despues.map((b): Fila => {
          const [cs, cl] = celdas(p, b)
          return [[b.nombre, ...cs], cl]
        }),
        ...huecos.map((h) => hueco(h, 'Libres')),
      ]
    const nombres =
      modo === 'todos' ? todosLosSegs : todosLosSegs.filter((n) => procesoDe.get(n) === modo)
    const filas = nombres.map((n): Fila => {
      const b = p.despues.find((x) => x.nombre === n)
      const pre = modo === 'todos' ? [procesoDe.get(n)!, segDe(n)] : [segDe(n)]
      if (!b) return [[...pre, '—', '—'], 'rm-fila-vacia']
      const [cs, cl] = celdas(p, b)
      return [[...pre, ...cs], cl]
    })
    return [...filas, ...huecos.map((h) => hueco(h, 'Hueco'))]
  }
  const completarDe = (p: PasoMem) =>
    marcaDe(p)?.completar ?? (p.op ? undefined : spec.lectura?.completar)
  const filasTabla = (p: PasoMem) => completarDe(p)?.length ?? (spec.tabla ? filasDe(p).length : 0)
  const alto = Math.max(
    ...pasos.map((p) =>
      filasTabla(p)
        ? yTablaDe(p) + 40 + filasTabla(p) * 20 + 8
        : yMarcasDe(p) + 16 + (conCajas(p) ? 76 : 0),
    ),
  )

  const op = (p: PasoMem) => (p.op && 'agranda' in p.op ? p.op : undefined)
  const barra = (bloques: BloqueMem[], y: number, p: PasoMem, antes: boolean, marcado = '') => {
    const estadoHueco = (h: Hueco) => {
      if (!antes || !p.op || 'libera' in p.op) return ''
      const c = p.candidatos.find((x) => x.hueco.inicio === h.inicio)
      return c
        ? ` rm-${{ 'no-al-lado': 'no-entra', 'entra-uno': 'no-elegido' }[c.estado as string] ?? c.estado}`
        : ''
    }
    const parte = (x0: number, w: number, clase: string, l1: string, l2: string) => {
      const chica = w < 46 ? ' rm-chica' : ''
      const textos =
        w < 30
          ? ''
          : w < (hexa || unidad === 'decimal' ? 60 : 38)
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
        !antes && esNuevo(p, b)
          ? ' rm-nuevo'
          : p.movidos.some((m) => m.nombre === b.nombre)
            ? ' rm-mov'
            : b.nombre === marcado
              ? ' rm-marcado'
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
        const etq = enBloques
          ? `${m.nombre}: ${sub(m.de, b.tam, false)} → ${sub(m.a, b.tam, false)}`
          : `${m.nombre}: base ${dir(m.de)} → ${dir(m.a)}`
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
    const completar = completarDe(p)
    if (!spec.tabla && !completar) return ''
    const yTabla = yTablaDe(p)
    const { titulo, columnas } = completar
      ? { titulo: 'Lo que había que completar', columnas: ['Campo', 'Valor'] }
      : tablaDe
    const filas: Fila[] = completar
      ? completar.map(([campo, valor, ok]) => [[campo, String(valor)], ok ? 'rm-fila-ok' : ''])
      : filasDe(p)
    const col = completar
      ? [X0, X0 + 220]
      : columnas.length === 4
        ? [X0, X0 + 90, X0 + 150, X0 + 330]
        : [X0, X0 + 80, X0 + 260]
    const fila = (i: number, [celdas, clase]: Fila) =>
      `<g class="rm-fila ${clase}">${celdas.map((c, j) => texto(col[j] + 8, yTabla + 40 + i * 20, c, { clase: 'rm-izq' })).join('')}</g>`
    return (
      texto(X0, yTabla, titulo, { clase: 'rm-izq rm-tabla-tit' }) +
      columnas
        .map((t, j) => texto(col[j] + 8, yTabla + 20, t, { clase: 'rm-izq rm-enc' }))
        .join('') +
      `<line class="rm-eje" x1="${X0}" y1="${yTabla + 29}" x2="${X0 + (columnas.length === 4 ? 480 : 440)}" y2="${yTabla + 29}"/>` +
      filas.map((f, i) => fila(i, f)).join('')
    )
  }

  const ancla = (x: number) => (x > X0 + W - 120 ? 'rm-der' : x < X0 + 120 ? 'rm-izq' : '')
  const pin = (b: BloqueMem, m: NonNullable<ReturnType<typeof marcaDe>>) => {
    const x = px(b.inicio + m.dl)
    const [x0, x1] = [px(b.inicio), px(b.inicio + b.tam)]
    const y = yDespues + BARRA + 8
    const etq = (xx: number, t: string, clase: string) =>
      `<line class="rm-regla${clase ? ' rm-regla-sel' : ''}" x1="${xx}" y1="${y}" x2="${xx}" y2="${y + 10}"/>` +
      texto(xx, y + 20, t, { clase: `rm-regla-etq ${clase} ${ancla(xx)}` })
    const fin = x1 - x < 75 ? tamCol(b.tam) : tam(b.tam)
    return (
      `<line class="rm-pin" x1="${x}" y1="${yDespues - 16}" x2="${x}" y2="${yDespues + BARRA}"/>` +
      texto(x, yDespues - 24, m.df ?? `DF ${dir(b.inicio + m.dl)}`, {
        clase: `rm-pin-etq ${ancla(x)}`,
      }) +
      `<line class="rm-regla" x1="${x0}" y1="${y + 5}" x2="${x1}" y2="${y + 5}"/>` +
      etq(x0, 'DL 0', '') +
      etq(x, m.dlRotulo ?? `DL ${dir(m.dl)}`, 'rm-regla-dl') +
      (m.dl < b.tam ? etq(x1, fin, '') : '') +
      texto(x0, y + 36, `Direcciones lógicas de ${m.marca}${m.regla ? ` ${m.regla}` : ''}`, {
        clase: 'rm-izq rm-regla-tit',
      })
    )
  }

  // una caja por bloque leído: su número, su lógico, su rango de bytes y lo que se lee
  const cajas = ({ l, b, primero, ultimo, fin }: NonNullable<typeof lect>) => {
    const n = ultimo - primero + 1
    const w = Math.min(232, (W - 12 * (n - 1)) / n)
    const y = yMarcasDe(pasos[0]) + 14
    return Array.from({ length: n }, (_, k) => {
      const lg = primero + k
      const [a, z] = [lg * l.bloque, (lg + 1) * l.bloque - 1]
      const [d, h] = [Math.max(a, l.desde), Math.min(z, fin)]
      const lee =
        d === a && h === z
          ? `lee el bloque entero · ${l.bloque} B`
          : `lee ${d} – ${h} · ${h - d + 1} B`
      const x = X0 + k * (w + 12)
      return (
        `<g class="rm-seg ${color(b)} rm-marcado"><rect x="${x}" y="${y}" width="${w}" height="58" rx="6"/>` +
        texto(x + 10, y + 14, `bloque ${b.inicio + lg} · lógico ${lg}`, {
          clase: 'rm-izq rm-caja-tit',
        }) +
        texto(x + 10, y + 31, `bytes ${a} – ${z}`, { clase: 'rm-izq rm-caja-sub' }) +
        texto(x + 10, y + 47, lee, { clase: 'rm-izq rm-caja-lee' }) +
        '</g>'
      )
    }).join('')
  }

  const marcasEn = (y: number) =>
    Array.from({ length: 9 }, (_, k) => (spec.total / 8) * k)
      .map((v, k) =>
        texto(px(v), y, dir(v), {
          clase: `rm-marca${k === 0 ? ' rm-izq' : k === 8 ? ' rm-der' : ''}`,
        }),
      )
      .join('')

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
      !p.op && lect
        ? rot(yDespues - 8, lect.l.rotulo ?? 'Disco') +
          barra(p.despues, yDespues, p, false, lect.b.nombre) +
          cajas(lect)
        : rot(yDespues - 8, p.op ? 'Después' : 'Memoria') + barra(p.despues, yDespues, p, false)
    const m = marcaDe(p)
    if (m) {
      // la barra es la del paso anterior (con lo que mostraba), más la DF y la regla de DL
      const prev = pasos[i - 1]
      const marca =
        rot(yDespues - 8, m.rotulo ?? `Memoria${sufijo}`) +
        barra(prev.despues, yDespues, prev, false, m.marca) +
        pin(
          p.despues.find((b) => b.nombre === m.marca)!,
          m,
        )
      return grupo(`paso-${i}`, chips + marca + marcasEn(yMarcasDe(p)) + tabla(p), { oculto: true })
    }
    const cuerpo = chips + antes + flechas(p) + despues + marcasEn(yMarcasDe(p)) + tabla(p)
    return grupo(`paso-${i}`, cuerpo, { oculto: true })
  }

  const PALABRA = ['', 'un', 'dos', 'tres', 'cuatro']
  const pasoJuntos = (p: PasoMem, op: Extract<OpMem, { segmentos: unknown }>) => {
    const segs = op.segmentos
    const iguales = segs.every((x) => x.tam === segs[0].tam)
    const n = PALABRA[segs.length] ?? String(segs.length)
    const juntos = p.juntos!
    const fin = juntos.at(-1)!.inicio + juntos.at(-1)!.tam
    const donde = lista(juntos.map((b) => `${b.nombre} en **${dir(b.inicio)}**`))
    let txt = iguales
      ? `**${op.carga} pide ${n} segmentos de ${tam(segs[0].tam)}.**`
      : `**${op.carga} pide ${n} segmentos (${lista(segs.map((x) => tam(x.tam)))}).**`
    if (p.movidos.length) {
      const uno = p.candidatos.filter((c) => c.estado === 'entra-uno')
      const resto = p.candidatos
        .filter((c) => c.estado !== 'entra-uno')
        .map((c) => tam(c.hueco.tam))
      const libre = `aunque hay ${tam(libreDe(p))} libres: fragmentación externa.`
      txt +=
        segs.length === 2 && uno.length === 1
          ? ` El hueco de ${tam(uno[0].hueco.tam)} admite uno solo y el otro no entra en ninguno (${lista(resto)}), ${libre}`
          : ` Ningún hueco admite los ${n} juntos (${lista(p.huecosAntes.map((h) => tam(h.tam)))}), ${libre}`
      const quien =
        p.movidos.length === 1 ? '**un solo segmento**' : `${p.movidos.length} segmentos`
      const movs = lista(p.movidos.map((m) => `${m.nombre} pasa a ${dir(m.a)}`))
      const hueco =
        fin -
        juntos[0].inicio +
        (huecosDe(spec.total, p.despues).find((h) => h.inicio === fin)?.tam ?? 0)
      txt += ` Se compacta moviendo ${quien}: ${movs} y los huecos se juntan en uno de ${tam(hueco)}, donde van ${donde}.`
    } else txt += ` Entran juntos: van ${donde}.`
    const t = iguales ? `${segs.length} × ${tam(segs[0].tam)}` : lista(segs.map((x) => tam(x.tam)))
    return { titulo: `${op.carga} (${t})`, texto: [txt, op.texto].filter(Boolean).join(' ') }
  }

  const paso = (p: PasoMem): Omit<Paso, 'resaltar' | 'mostrar' | 'ocultar'> => {
    if (!p.op && lect) {
      const { l, b, primero, ultimo, fin } = lect
      const kib =
        l.bytes % 1024 === 0 ? `**${l.bytes / 1024} KiB** (${l.bytes} B)` : `**${l.bytes} B**`
      const leidos = Array.from({ length: ultimo - primero + 1 }, (_, k) =>
        String(b.inicio + primero + k),
      )
      const txt = `El puntero está en el byte **${l.desde}** y se leen ${kib}: los bytes ${l.desde} a ${fin}. Con bloques de ${l.bloque} B, el ${l.desde} cae en el lógico ${primero} y el ${fin} en el lógico ${ultimo}. Como la asignación es **contigua**, el lógico k es el bloque ${b.inicio} + k del FS: se leen **${lista(leidos)}**.`
      return {
        titulo: l.titulo ?? 'Qué bloques se leen',
        texto: [txt, spec.textoInicial].filter(Boolean).join(' '),
      }
    }
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
    if ('segmentos' in p.op) return pasoJuntos(p, p.op)
    if ('marca' in p.op) return { titulo: p.op.titulo, texto: p.op.texto }
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
  return {
    ancho: ANCHO,
    alto,
    titulo: spec.titulo,
    cuerpo: [
      `<defs><pattern id="rm-rayas" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="rm-raya-fondo" width="8" height="8"/><line class="rm-raya" x1="0" y1="0" x2="0" y2="8"/></pattern></defs>`,
      ...pasos.map(fotograma),
    ],
    pasos: pasos.map((p, i) => ({
      ...paso(p),
      resaltar: [ids[i]],
      mostrar: [ids[i]],
      ocultar: ids.filter((_, k) => k !== i),
    })),
  }
}
