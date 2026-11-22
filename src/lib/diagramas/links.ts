/** Simulación de directorios, hard y soft links (```links): entradas → inodos con contador. Pura, sin dibujo. */

export type OpLinks =
  | { ln: string; a: string; texto?: string }
  | { lns: string; a: string; inodo: string; texto?: string }
  | { rm: string; texto?: string }

export interface SpecLinksSim {
  /** Sin volúmenes: uno solo, con los directorios en el orden en que aparecen. */
  volumenes?: { nombre: string; directorios: string[] }[]
  inicial: { ruta: string; inodo: string }[]
  operaciones: OpLinks[]
}

export interface EntradaLinks {
  ruta: string
  dir: string
  nombre: string
  volumen: string
  inodo: string
  /** Cómo nació: estaba al principio, `ln` o `ln -s`. */
  tipo: 'original' | 'hard link' | 'soft link'
  /** Se borró en este paso, en uno anterior, o sigue. */
  borrada: 'ahora' | 'antes' | null
}

export interface InodoLinks {
  id: string
  volumen: string
  tipo: 'regular' | 'soft'
  contador: number
  /** Contador al empezar el paso (para "2 → 1"). */
  antes: number
  /** Ruta que guarda un soft link en su bloque. */
  destino?: string
  liberado: boolean
}

export interface PasoLinks {
  /** null en el estado inicial. */
  op: OpLinks | null
  entradas: EntradaLinks[]
  inodos: InodoLinks[]
  /** Inodo que cambia en este paso. */
  afectado: string | null
}

const partir = (ruta: string) => {
  const i = ruta.lastIndexOf('/')
  return { dir: ruta.slice(0, i) || '/', nombre: ruta.slice(i + 1) }
}

export function simularLinks(spec: SpecLinksSim): PasoLinks[] {
  const volDe = new Map<string, string>()
  for (const v of spec.volumenes ?? [])
    for (const d of v.directorios) {
      if (volDe.has(d)) throw new Error(`links: el directorio ${d} está en dos volúmenes`)
      volDe.set(d, v.nombre)
    }
  const volumen = (dir: string) => {
    if (!spec.volumenes) return ''
    const v = volDe.get(dir)
    if (v == null) throw new Error(`links: el directorio ${dir} no está en ningún volumen`)
    return v
  }

  const entradas: EntradaLinks[] = []
  const inodos: InodoLinks[] = []
  const viva = (ruta: string) => entradas.find((e) => e.ruta === ruta && !e.borrada)
  const inodo = (id: string) => inodos.find((i) => i.id === id)!
  const agregar = (ruta: string, ino: string, tipo: EntradaLinks['tipo']) => {
    if (viva(ruta)) throw new Error(`links: ${ruta} ya existe`)
    const { dir, nombre } = partir(ruta)
    const e = { ruta, dir, nombre, volumen: volumen(dir), inodo: ino, tipo, borrada: null }
    const vieja = entradas.findIndex((x) => x.ruta === ruta)
    if (vieja >= 0) entradas[vieja] = e
    else entradas.push(e)
    return e
  }

  for (const x of spec.inicial) {
    const e = agregar(x.ruta, x.inodo, 'original')
    const i = inodos.find((i) => i.id === x.inodo)
    if (i && i.volumen !== e.volumen)
      throw new Error(`links: el inodo ${x.inodo} no puede estar en dos volúmenes`)
    if (i) i.contador++
    else
      inodos.push({
        id: x.inodo,
        volumen: e.volumen,
        tipo: 'regular',
        contador: 1,
        antes: 1,
        liberado: false,
      })
  }

  const foto = (op: OpLinks | null, afectado: string | null): PasoLinks => ({
    op,
    entradas: entradas.map((e) => ({ ...e })),
    inodos: inodos.map((i) => ({ ...i })),
    afectado,
  })
  const pasos = [foto(null, null)]

  for (const op of spec.operaciones) {
    for (const e of entradas) if (e.borrada === 'ahora') e.borrada = 'antes'
    for (const i of inodos) i.antes = i.contador
    let afectado: string
    if ('rm' in op) {
      const e = viva(op.rm)
      if (!e) throw new Error(`links: rm ${op.rm}, que no existe`)
      e.borrada = 'ahora'
      const i = inodo(e.inodo)
      i.contador--
      i.liberado = i.contador === 0
      afectado = i.id
    } else if ('ln' in op) {
      const src = viva(op.ln)
      if (!src) throw new Error(`links: ln ${op.ln}, que no existe`)
      const i = inodo(src.inodo)
      if (i.tipo === 'soft') throw new Error(`links: ln ${op.ln} es un soft link (no soportado)`)
      const e = agregar(op.a, i.id, 'hard link')
      if (e.volumen !== i.volumen)
        throw new Error(
          `links: ln ${op.ln} ${op.a}: un hard link no cruza volúmenes (${i.volumen} → ${e.volumen})`,
        )
      i.contador++
      afectado = i.id
    } else {
      if (inodos.some((i) => i.id === op.inodo))
        throw new Error(`links: ln -s ${op.a}: el inodo ${op.inodo} ya existe`)
      const e = agregar(op.a, op.inodo, 'soft link')
      inodos.push({
        id: op.inodo,
        volumen: e.volumen,
        tipo: 'soft',
        contador: 1,
        antes: 0,
        destino: op.lns,
        liberado: false,
      })
      afectado = op.inodo
    }
    pasos.push(foto(op, afectado))
  }
  return pasos
}

/** ¿Abrir esta ruta llega al contenido? Un soft link resuelve la ruta que guarda (un nivel). */
export function abre(paso: PasoLinks, ruta: string): 'sí' | 'no existe' | 'no: colgado' {
  const e = paso.entradas.find((x) => x.ruta === ruta && !x.borrada)
  if (!e) return 'no existe'
  const i = paso.inodos.find((x) => x.id === e.inodo)!
  if (i.tipo === 'regular') return 'sí'
  return paso.entradas.some((x) => x.ruta === i.destino && !x.borrada) ? 'sí' : 'no: colgado'
}
