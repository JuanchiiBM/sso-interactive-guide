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
  const ppb = punterosPorBloque(bloque, puntero)
  const regs = regiones(conf, ppb)
  const primero = Math.floor(desde / bloque)
  const ultimo = Math.floor(hasta / bloque)
  const bloquesPunteros = new Set<string>()
  let inicio = 0
  for (let p = 0; p < regs.length; p++) {
    const { nivel, bloques } = regs[p]
    const a = Math.max(primero, inicio)
    const b = Math.min(ultimo, inicio + bloques - 1)
    // en cada profundidad, los bloques de punteros que cubren [a, b]
    for (let prof = 0; a <= b && prof < nivel; prof++) {
      const alcance = ppb ** (nivel - prof)
      const desdeBP = Math.floor((a - inicio) / alcance)
      const hastaBP = Math.floor((b - inicio) / alcance)
      for (let k = desdeBP; k <= hastaBP; k++) bloquesPunteros.add(`${p}:${prof}:${k}`)
    }
    inicio += bloques
  }
  if (ultimo >= inicio) throw new Error('el rango excede el tamaño máximo del archivo')
  const datos = ultimo - primero + 1
  return { datos, punteros: bloquesPunteros.size, total: datos + bloquesPunteros.size }
}

export const accesosByte = (conf: Conformacion, bloque: number, puntero: number, byte: number) =>
  accesosRango(conf, bloque, puntero, byte, byte)
