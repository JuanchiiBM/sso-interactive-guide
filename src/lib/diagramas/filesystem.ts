/** Cálculos de File System (FAT y ext2), puros: arman los números de los ejercicios de la guía. */

export const KiB = 2 ** 10
export const MiB = 2 ** 20
export const GiB = 2 ** 30
export const TiB = 2 ** 40

// ── FAT ──

export type TipoFat = 12 | 16 | 32

/** Bits que direccionan clusters: FAT32 usa 28 de sus 32 (criterio de la cátedra). */
export const BITS_DIRECCION: Record<TipoFat, number> = { 12: 12, 16: 16, 32: 28 }

/** Tamaño de cada entrada de la tabla, en bytes. */
export const BYTES_ENTRADA: Record<TipoFat, number> = { 12: 1.5, 16: 2, 32: 4 }

export interface EspacioFat {
  /** Clusters direccionables por el formato: 2^bits. */
  clustersTeoricos: number
  /** 2^bits × cluster. En FAT es también el tamaño máximo teórico de un archivo. */
  teorico: number
  /** El teórico limitado por el disco (o la partición). */
  real: number
  /** Entradas que usa la tabla: clusters del disco, con tope en 2^bits. */
  entradas: number
  /** Tamaño de la tabla en bytes. */
  tamanoTabla: number
}

export function espacioFat(fat: TipoFat, cluster: number, disco: number): EspacioFat {
  const clustersTeoricos = 2 ** BITS_DIRECCION[fat]
  const teorico = clustersTeoricos * cluster
  const entradas = Math.min(clustersTeoricos, Math.floor(disco / cluster))
  return {
    clustersTeoricos,
    teorico,
    real: Math.min(teorico, disco),
    entradas,
    tamanoTabla: entradas * BYTES_ENTRADA[fat],
  }
}

/** Cluster más chico (potencia de 2) con el que el formato direcciona todo el disco. */
export function clusterMinimo(fat: TipoFat, disco: number): number {
  let cluster = 512
  while (2 ** BITS_DIRECCION[fat] * cluster < disco) cluster *= 2
  return cluster
}

/** Espacio que ocupa un archivo: se redondea a clusters (o bloques) enteros. */
export const espacioOcupado = (archivo: number, cluster: number) =>
  Math.ceil(archivo / cluster) * cluster

/** Bits que hacen falta para numerar `n` clusters. */
export const bitsNecesarios = (n: number) => Math.ceil(Math.log2(n))

/** Lo que se pierde en el último cluster (o bloque) del archivo. */
export const fragmentacionInterna = (archivo: number, cluster: number) =>
  espacioOcupado(archivo, cluster) - archivo

/** Peor caso: el último cluster lleva 1 solo byte. */
export const fragmentacionInternaMaxima = (cluster: number) => cluster - 1

/** Clusters enteros que ocupa la tabla FAT (u otra estructura) guardada en el volumen. */
export const clustersQueOcupa = (bytes: number, cluster: number) => Math.ceil(bytes / cluster)

/**
 * Cluster (potencia de 2) de un volumen cuya tabla FAT mide `tabla` bytes. Criterio de 1R 2C2025:
 * la tabla tiene 2^n entradas, el mínimo que cubre el volumen.
 */
export function clusterPorTabla(fat: TipoFat, tabla: number, volumen: number): number {
  const entradas = tabla / BYTES_ENTRADA[fat]
  let cluster = 512
  while (entradas * cluster < volumen) cluster *= 2
  return cluster
}

/** Archivo máximo real en FAT descontando la tabla (una copia), que ocupa clusters del volumen. */
export function archivoMaximoRealFat(
  fat: TipoFat,
  cluster: number,
  volumen: number,
  tabla: number,
) {
  const real = espacioFat(fat, cluster, volumen).real
  return real - clustersQueOcupa(tabla, cluster) * cluster
}

// ── ext2 ──

export interface Conformacion {
  directos: number
  simples?: number
  dobles?: number
  triples?: number
}

export const punterosPorBloque = (bloque: number, puntero: number) => bloque / puntero

/** Regiones del archivo en orden: cada puntero del inodo con su nivel de indirección. */
function regiones(conf: Conformacion, ppb: number) {
  const r: { nivel: number; bloques: number }[] = []
  const agregar = (cant = 0, nivel: number) => {
    for (let i = 0; i < cant; i++) r.push({ nivel, bloques: ppb ** nivel })
  }
  agregar(conf.directos, 0)
  agregar(conf.simples, 1)
  agregar(conf.dobles, 2)
  agregar(conf.triples, 3)
  return r
}

/** Bloques de datos que direcciona el inodo. */
export function maxBloquesArchivo(conf: Conformacion, bloque: number, puntero: number): number {
  return regiones(conf, punterosPorBloque(bloque, puntero)).reduce((s, r) => s + r.bloques, 0)
}

export const maxArchivoExt2 = (conf: Conformacion, bloque: number, puntero: number) =>
  maxBloquesArchivo(conf, bloque, puntero) * bloque

/** Tamaño máximo del FS: 2^(bits del puntero) bloques; el real, limitado por el disco. */
export function espacioExt2(puntero: number, bloque: number, disco: number) {
  const teorico = 2 ** (puntero * 8) * bloque
  return { teorico, real: Math.min(teorico, disco) }
}

/** Conformaciones con la menor cantidad de punteros que direccionan `objetivo` bytes, dentro de los topes. */
export function conformacionesMinimas(
  objetivo: number,
  bloque: number,
  puntero: number,
  topes: Required<Conformacion>,
): Required<Conformacion>[] {
  let mejores: Required<Conformacion>[] = []
  let minimo = Infinity
  for (let d = 0; d <= topes.directos; d++)
    for (let s = 0; s <= topes.simples; s++)
      for (let db = 0; db <= topes.dobles; db++)
        for (let t = 0; t <= topes.triples; t++) {
          const conf = { directos: d, simples: s, dobles: db, triples: t }
          const cant = d + s + db + t
          if (cant > minimo || maxArchivoExt2(conf, bloque, puntero) < objetivo) continue
          if (cant < minimo) [minimo, mejores] = [cant, []]
          mejores.push(conf)
        }
  return mejores
}

export interface Accesos {
  datos: number
  punteros: number
  total: number
}

export const SIGLA = ['PD', 'PIS', 'PID', 'PIT'] as const

/** Lo que aporta un puntero del inodo (los directos van juntos) a la lectura de un rango de bloques. */
export interface AccesosPuntero {
  /** `10 PD`, `PIS`, `PID 2`… (con número solo si hay más de uno de ese nivel). */
  rotulo: string
  nivel: number
  /** Bloques lógicos que cubre el puntero. */
  inicio: number
  fin: number
  /** Bloques lógicos que se leen por este puntero, o null si ninguno. */
  leidos: [number, number] | null
  datos: number
  /** Bloques de punteros que se leen en cada profundidad (1.er nivel primero). */
  bp: number[]
}

/** Desglose por puntero de la lectura de los bloques lógicos [primero, ultimo] (base 0). */
export function accesosPorPuntero(
  conf: Conformacion,
  bloque: number,
  puntero: number,
  primero: number,
  ultimo: number,
): AccesosPuntero[] {
  const ppb = punterosPorBloque(bloque, puntero)
  const indirectos = regiones(conf, ppb).filter((r) => r.nivel > 0)
  const grupos = [
    ...(conf.directos ? [{ nivel: 0, bloques: conf.directos, rotulo: `${conf.directos} PD` }] : []),
    ...indirectos.map((r, i) => {
      const iguales = indirectos.filter((o) => o.nivel === r.nivel).length
      const n = indirectos.slice(0, i).filter((o) => o.nivel === r.nivel).length + 1
      return { ...r, rotulo: SIGLA[r.nivel] + (iguales > 1 ? ` ${n}` : '') }
    }),
  ]
  let inicio = 0
  const out = grupos.map(({ nivel, bloques, rotulo }): AccesosPuntero => {
    const desde = inicio
    const fin = inicio + bloques - 1
    inicio = fin + 1
    const a = Math.max(primero, desde)
    const b = Math.min(ultimo, fin)
    if (a > b)
      return { rotulo, nivel, inicio: desde, fin, leidos: null, datos: 0, bp: Array(nivel).fill(0) }
    // en cada profundidad, los bloques de punteros que cubren [a, b]
    const bp = Array.from({ length: nivel }, (_, prof) => {
      const alcance = ppb ** (nivel - prof)
      return Math.floor((b - desde) / alcance) - Math.floor((a - desde) / alcance) + 1
    })
    return { rotulo, nivel, inicio: desde, fin, leidos: [a, b], datos: b - a + 1, bp }
  })
  if (ultimo >= inicio) throw new Error('el rango excede el tamaño máximo del archivo')
  return out
}

/** Bloques de punteros que se leen en total por un puntero. */
export const totalBP = (p: AccesosPuntero) => p.bp.reduce((s, n) => s + n, 0)

/**
 * Bloques que se leen para leer los bytes [desde, hasta] (base 0). Criterio de la cátedra:
 * bloques de datos + bloques de punteros, sin contar el inodo.
 */
export function accesosRango(
  conf: Conformacion,
  bloque: number,
  puntero: number,
  desde: number,
  hasta: number,
): Accesos {
  const ps = accesosPorPuntero(
    conf,
    bloque,
    puntero,
    Math.floor(desde / bloque),
    Math.floor(hasta / bloque),
  )
  const datos = ps.reduce((s, p) => s + p.datos, 0)
  const punteros = ps.reduce((s, p) => s + totalBP(p), 0)
  return { datos, punteros, total: datos + punteros }
}

export const accesosByte = (conf: Conformacion, bloque: number, puntero: number, byte: number) =>
  accesosRango(conf, bloque, puntero, byte, byte)

/** Accesos para leer el bloque lógico `n` (base 0) del archivo. */
export const accesosBloque = (conf: Conformacion, bloque: number, puntero: number, n: number) =>
  accesosRango(conf, bloque, puntero, n * bloque, n * bloque)
