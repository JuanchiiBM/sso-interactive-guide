/** Locks en el tiempo (```locks): código lado a lado, cerrojo, archivo y pantalla, un paso por turno de RR. Ver brain: Resolución gráfica paso a paso. */
import { simularLocks, type Evento, type SpecLocks, type Tenencia, type Turno } from './locks-rr'
import type { Paso, Recorrido } from './recorrido'
import { esc, grupo, texto } from './svg'

const ANCHO = 800
const X0 = 10
const GAP = 8
const CAB = 28
const LIN = 18
const ALTO_CAJA_LIN = 18
const POR_RENGLON = 4

type Tramos = [string, string?][]
const linea = (x: number, y: number, tramos: Tramos, clase = '') =>
  `<text class="rm-izq ${clase}" x="${x}" y="${y}">` +
  tramos.map(([t, c]) => (c ? `<tspan class="${c}">${esc(t)}</tspan>` : esc(t))).join('') +
  '</text>'

const lista = (xs: string[]) => xs.join(', ').replace(/, ([^,]+)$/, ' y $1')

export function recorridoLocks(spec: SpecLocks): Recorrido {
  const todos = simularLocks(spec)
  const ultimo = todos.findLastIndex((t) => t.lineas.some((l) => l.evento.tipo === 'imprime'))
  if (ultimo < 0) throw new Error('locks: ningún proceso imprime')
  const turnos = todos.slice(0, ultimo + 1)
  const impresiones = turnos.at(-1)!.despues.pantalla
  const nom = (p: number) => spec.procesos[p].nombre
  const f = spec.archivo.nombre
  const n = spec.procesos.length
  const colW = (ANCHO - 2 * X0 - (n - 1) * GAP) / n
  const maxLineas = Math.max(...spec.procesos.map((p) => p.codigo.length))
  const altoCol = CAB + 10 + maxLineas * LIN
  const yCajas = 10 + altoCol + 12
  const altoCaja = 26 + Math.max(3, impresiones.length) * ALTO_CAJA_LIN
  const yTabla = yCajas + altoCaja + 24

  // anotaciones que quedan: el valor impreso y el acceso sin lock
  const notas = turnos.map(() => spec.procesos.map(() => new Map<number, string>()))
  turnos.forEach((t, i) => {
    if (i) notas[i].forEach((m, p) => notas[i - 1][p].forEach((v, k) => m.set(k, v)))
    for (const { linea: k, evento: e } of t.lineas) {
      if (e.tipo === 'imprime') notas[i][t.p].set(k, e.valor)
      if (e.tipo === 'falla') notas[i][t.p].set(k, '✗ sin lock')
      if (e.tipo === 'pasa') notas[i][t.p].set(k, 'sin lock, pasa')
    }
  })

  const columna = (p: number, i: number) => {
    const t = turnos[i]
    const est = t.despues.procesos[p]
    const activo = t.p === p
    const x = X0 + p * (colW + GAP)
    const [etq, claseEst] = activo
      ? ['ejecuta', 'ck-est-ejecuta']
      : est.estado === 'bloqueado'
        ? ['bloqueado', 'ck-est-bloq']
        : est.estado === 'terminado'
          ? ['terminó', 'ck-est-fin']
          : est.conLock
            ? ['ready · con lock', 'ck-est-lock']
            : ['ready', 'ck-est-fin']
    const marcas = new Map(activo ? t.lineas.map((l) => [l.linea, l.evento.tipo] as const) : [])
    const ultima = activo ? t.lineas.at(-1)?.linea : undefined
    const lineas = spec.procesos[p].codigo
      .map((src, k) => {
        const y = 10 + CAB + 10 + k * LIN + LIN / 2
        const bloq = est.estado === 'bloqueado' && k === est.pc
        const clase = bloq
          ? 'ck-l-bloq'
          : marcas.get(k) === 'falla'
            ? 'ck-l-mal'
            : k === ultima
              ? 'ck-l-aqui'
              : k < est.pc || marcas.has(k)
                ? 'ck-l-hecha'
                : 'ck-l-pend'
        const sig = est.estado === 'ready' && k === est.pc ? '▸ ' : ''
        const nota = bloq ? 'espera ✗' : notas[i][p].get(k)
        const fondo = /aqui|mal|bloq/.test(clase)
          ? `<rect class="ck-l-fondo" x="${x + 1}" y="${y - LIN / 2}" width="${colW - 2}" height="${LIN}"/>` +
            `<rect class="ck-l-barra" x="${x + 1}" y="${y - LIN / 2}" width="3" height="${LIN}"/>`
          : ''
        return (
          `<g class="ck-l ${clase}">${fondo}` +
          texto(x + 10, y, `${sig}${src}${nota ? `  ${nota}` : ''}`, { clase: 'rm-izq' }) +
          '</g>'
        )
      })
      .join('')
    return (
      `<g class="ck-col ck-p${(p % 8) + 1}${activo ? ' ck-activo' : ''}">` +
      `<rect class="ck-marco" x="${x}" y="10" width="${colW}" height="${altoCol}" rx="8"/>` +
      `<line class="ck-sep" x1="${x}" x2="${x + colW}" y1="${10 + CAB}" y2="${10 + CAB}"/>` +
      texto(x + 8, 10 + CAB / 2, nom(p), { clase: 'rm-izq ck-nombre' }) +
      texto(x + colW - 8, 10 + CAB / 2, etq, { clase: `rm-der ck-est ${claseEst}` }) +
      lineas +
      '</g>'
    )
  }

  const quien = (p: number): [string, string] => [nom(p), `ck-quien ck-p${(p % 8) + 1}`]
  const conComas = (ps: number[]): Tramos =>
    ps.length ? ps.flatMap((p, j) => (j ? [[', '], quien(p)] : [quien(p)])) : [['—']]

  const escritor = (i: number) => {
    for (let j = i; j >= 0; j--)
      for (const l of turnos[j].lineas)
        if (l.evento.tipo === 'escribe' || (l.evento.tipo === 'pasa' && l.evento.op === 'write'))
          return turnos[j].p
    return -1
  }

  const cajas = (i: number) => {
    const { duenos, cola, archivo, pantalla } = turnos[i].despues
    const w = (ANCHO - 2 * X0 - 2 * GAP) / 3.3
    const anchos = [1.3 * w, w, w]
    const xs = [X0, X0 + anchos[0] + GAP, X0 + anchos[0] + w + 2 * GAP]
    const y = (k: number) => yCajas + 18 + k * ALTO_CAJA_LIN
    const marco = (k: number, clase: string, titulo: string) =>
      `<rect class="ck-caja ${clase}" x="${xs[k]}" y="${yCajas}" width="${anchos[k]}" height="${altoCaja}" rx="8"/>` +
      texto(xs[k] + 10, y(0), titulo, { clase: 'rm-izq ck-caja-tit' })
    const colaTramos: Tramos = cola.length
      ? cola.flatMap((t, j): Tramos => [
          ...(j ? [[', '] as [string]] : []),
          quien(t.p),
          [` pide ${t.modo}`],
        ])
      : [['—']]
    const cerrojo =
      marco(0, 'ck-caja-cerrojo', `Cerrojo de ${f} (${spec.cerrojo})`) +
      linea(
        xs[0] + 10,
        y(1),
        [['modo '], [duenos.length ? duenos[0].modo : 'libre', 'ck-b']],
        'ck-sans',
      ) +
      linea(xs[0] + 10, y(2), [['dueños: '], ...conComas(duenos.map((d) => d.p))], 'ck-sans') +
      linea(xs[0] + 10, y(3), [['cola: '], ...colaTramos], 'ck-sans')
    const quienEscribio = escritor(i)
    const arch =
      marco(1, '', `Archivo ${f}`) +
      texto(xs[1] + 10, y(1) + 4, `'${archivo}'`, { clase: 'rm-izq ck-archivo' }) +
      texto(
        xs[1] + 10,
        y(2) + 8,
        quienEscribio < 0
          ? 'nadie escribió todavía'
          : `${nom(quienEscribio)} escribió '${archivo}'`,
        { clase: 'rm-izq ck-sans ck-nota' },
      )
    const nuevo = turnos[i].lineas.some((l) => l.evento.tipo === 'imprime')
    const pant =
      marco(2, '', 'Pantalla') +
      (pantalla.length
        ? pantalla
            .map((im, k) => {
              const es = nuevo && k === pantalla.length - 1
              return texto(
                xs[2] + 10,
                y(k + 1),
                `${nom(im.p)}: ${im.valor}${es ? '  ← nuevo' : ''}`,
                {
                  clase: `rm-izq${es ? ' ck-nuevo' : ''}`,
                },
              )
            })
            .join('')
        : texto(xs[2] + 10, y(1), '—', { clase: 'rm-izq ck-nota' }))
    return cerrojo + arch + pant
  }

  const tabla = (i: number) => {
    const hechas = turnos[i].despues.pantalla.length
    const nueva = turnos[i].lineas.some((l) => l.evento.tipo === 'imprime') ? hechas - 1 : -1
    const items = impresiones.map((im, j): Tramos => {
      const bl = im.bloqueados.map(nom).join(', ') || '—'
      const t =
        j < hechas ? `${j + 1}.ª ${nom(im.p)} · ${im.valor} · ${bl}` : `${j + 1}.ª pendiente`
      return [[t, j === nueva ? 'ck-tabla-nueva' : '']]
    })
    let out = ''
    for (let r = 0; r * POR_RENGLON < items.length; r++) {
      const tramos = items
        .slice(r * POR_RENGLON, (r + 1) * POR_RENGLON)
        .flatMap((it, j): Tramos => (j ? [['   '], ...it] : it))
      out += linea(
        X0,
        yTabla + r * LIN,
        r ? tramos : [['Tabla a completar en este paso: '], ...tramos],
        'ck-tabla',
      )
    }
    return out
  }

  const pasos: Paso[] = turnos.map((t, i) => ({
    titulo: `Turno de ${nom(t.p)}`,
    texto: textoTurno(spec, turnos, i),
    mostrar: [`paso-${i}`],
    ocultar: turnos.map((_, j) => `paso-${j}`).filter((_, j) => j !== i),
  }))
  const renglonesTabla = Math.ceil(impresiones.length / POR_RENGLON)

  return {
    ancho: ANCHO,
    alto: yTabla + (renglonesTabla - 1) * LIN + 16,
    titulo: spec.titulo,
    cuerpo: turnos.map((_, i) =>
      grupo(
        `paso-${i}`,
        spec.procesos.map((_, p) => columna(p, i)).join('') + cajas(i) + tabla(i),
        { oculto: true },
      ),
    ),
    pasos,
  }
}

/** El porqué del turno: qué instrucción tocó el cerrojo y qué pasó. */
export function textoTurno(spec: SpecLocks, turnos: Turno[], i: number): string {
  const t = turnos[i]
  const nom = (p: number) => spec.procesos[p].nombre
  const yo = nom(t.p)
  const despues = t.despues
  const tienen = (ds: Tenencia[]) => {
    const ps = lista(ds.map((d) => nom(d.p)))
    return ds.length > 1 ? `${ps} tienen uno ${ds[0].modo}` : `${ps} lo tiene ${ds[0].modo}`
  }
  const porque = (modo: string) =>
    spec.modo === 'exclusivo'
      ? 'el cerrojo es exclusivo'
      : `abrió para ${modo === 'exclusivo' ? 'escribir' : 'leer'}`
  const frases: string[] = []
  const prev = i ? turnos[i - 1].despues : null
  if (prev?.procesos[t.p].conLock && t.lineas[0]?.evento.tipo !== 'libera') {
    const m = prev.duenos.find((d) => d.p === t.p)!.modo
    const quienSolto = turnos[i - 1].lineas.some((l) => l.evento.tipo === 'libera')
      ? ` (lo obtuvo cuando ${nom(turnos[i - 1].p)} hizo \`unlock\`)`
      : ''
    if (turnos.slice(0, i).some((x) => x.p === t.p && x.lineas.at(-1)?.evento.tipo === 'bloquea'))
      frases.push(`**${yo} ya tiene el lock ${m}**${quienSolto}.`)
  }
  let accesos: string[] = []
  const volcar = () => {
    if (accesos.length) frases.push(`${frases.length ? 'Después' : yo} ${lista(accesos)}.`)
    accesos = []
  }
  for (const { evento: e } of t.lineas) {
    if (e.tipo === 'lee' || e.tipo === 'escribe') {
      accesos.push(`${e.tipo} \`'${e.valor}'\``)
      continue
    }
    if (e.tipo !== 'open' && e.tipo !== 'asignar') volcar()
    frases.push(...fraseEvento(e))
  }
  volcar()
  return frases.join(' ')

  function fraseEvento(e: Evento): string[] {
    switch (e.tipo) {
      case 'toma':
        return [
          e.con.length
            ? `**${yo} pide el lock ${e.modo}**: es compatible con el de ${lista(e.con.map(nom))} y lo obtiene.`
            : `**${yo} toma el lock ${e.modo}** (${porque(e.modo)}; nadie lo tenía).`,
        ]
      case 'bloquea':
        return [
          `**${yo} pide el lock ${e.modo}** (${porque(e.modo)}): ${tienen(e.duenos)}, así que **se bloquea** en \`lock\`. No imprime nada.`,
        ]
      case 'falla':
        return [
          `**${yo} hace \`${e.op}\` sin pedir el lock.** Como el cerrojo es **obligatorio**, el SO rechaza la ${e.op === 'read' ? 'lectura' : 'escritura'}; las syscalls no bloquean, así que **falla** y ${e.op === 'read' ? `\`var\` sigue en \`'${e.valor}'\`` : 'el archivo no cambia'}.`,
        ]
      case 'pasa':
        return [
          `**${yo} hace \`${e.op}\` sin pedir el lock.** Como el cerrojo es **sugerido**, el SO no lo controla: la ${e.op === 'read' ? `lectura **pasa** y \`var\` queda en \`'${e.valor}'\`` : `escritura **pasa** y el archivo queda en \`'${e.valor}'\``}.`,
        ]
      case 'libera': {
        const d = e.despierta
        if (d.length)
          return [
            `**${yo} hace \`unlock\`.** ${lista(d.map((x) => `**${nom(x.p)}**`))} obtiene${d.length > 1 ? 'n' : ''} el lock ${d[0].modo} y pasa${d.length > 1 ? 'n' : ''} a Ready.`,
          ]
        const espera = despues.cola.map((x) => nom(x.p))
        return [
          `**${yo} hace \`unlock\`.**` +
            (espera.length
              ? ` ${lista(espera)} sigue${espera.length > 1 ? 'n' : ''} esperando: ${tienen(despues.duenos)}.`
              : ''),
        ]
      }
      case 'imprime': {
        const bl = despues.pantalla.at(-1)!.bloqueados
        const antes = despues.pantalla.at(-2)?.bloqueados
        const misma = antes && bl.length && antes.join() === bl.join()
        const bloqueados = !bl.length
          ? 'no hay bloqueados'
          : misma
            ? `los bloqueados siguen siendo **${lista(bl.map(nom))}**`
            : `bloqueados: **${lista(bl.map(nom))}**`
        const clock =
          despues.procesos[t.p].estado === 'ready'
            ? ` El clock lo manda a Ready${despues.procesos[t.p].conLock ? ' **con el lock tomado**' : ''}.`
            : ''
        return [`Imprime **${e.valor}**; ${bloqueados}.${clock}`]
      }
      default:
        return []
    }
  }
}
