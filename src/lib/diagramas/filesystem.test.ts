import { describe, expect, it } from 'vitest'
import {
  GiB,
  KiB,
  MiB,
  TiB,
  accesosByte,
  accesosRango,
  bitsNecesarios,
  clusterMinimo,
  conformacionesMinimas,
  espacioExt2,
  espacioFat,
  espacioOcupado,
  maxArchivoExt2,
  maxBloquesArchivo,
} from './filesystem'

describe('FAT: guía 2016', () => {
  it('Ej. 2: FAT12 con clusters de 8 KiB direcciona 32 MiB; para 128 MiB hacen falta 32 KiB o 14 bits', () => {
    expect(espacioFat(12, 8 * KiB, Infinity).teorico).toBe(32 * MiB)
    expect(clusterMinimo(12, 128 * MiB)).toBe(32 * KiB)
    expect(bitsNecesarios((128 * MiB) / (8 * KiB))).toBe(14)
    // entradas a recorrer para contar los libres en cada alternativa
    expect(espacioFat(16, 8 * KiB, 128 * MiB).entradas).toBe(16384)
    expect(espacioFat(12, 32 * KiB, 128 * MiB).entradas).toBe(4096)
  })

  it('Ej. 3: 8 GiB en FAT32 con 4 KiB → 2^21 entradas, tabla de 8 MiB (0,0977 %), 11 bits sin usar', () => {
    const e = espacioFat(32, 4 * KiB, 8 * GiB)
    expect(e.entradas).toBe(2 ** 21)
    expect(e.tamanoTabla).toBe(8 * MiB)
    expect((e.tamanoTabla / (8 * GiB)) * 100).toBe(0.09765625)
    expect(32 - bitsNecesarios(e.entradas)).toBe(11)
  })

  it('Ej. 4: 4 GiB en FAT16 → cluster mínimo de 64 KiB y archivos redondeados a clusters', () => {
    const c = clusterMinimo(16, 4 * GiB)
    expect(c).toBe(64 * KiB)
    expect([1 * KiB, 20 * KiB, 1 * MiB].map((a) => espacioOcupado(a, c))).toEqual([
      64 * KiB,
      64 * KiB,
      1 * MiB,
    ])
  })

  it('Ej. 5: 512 GiB en FAT32 (28 bits)', () => {
    const a = espacioFat(32, 1 * KiB, 512 * GiB)
    expect([a.teorico, a.real]).toEqual([256 * GiB, 256 * GiB])
    const b = espacioFat(32, 4 * KiB, 512 * GiB)
    expect([b.teorico, b.real]).toEqual([1 * TiB, 512 * GiB])
  })
})

describe('FAT: resoluciones de parciales', () => {
  it('1R 1C2025: FAT16 con clusters de 64 KiB en 6 GiB → 4 GiB teórico y real, tabla de 128 KiB', () => {
    const e = espacioFat(16, 64 * KiB, 6 * GiB)
    expect([e.teorico, e.real, e.tamanoTabla]).toEqual([4 * GiB, 4 * GiB, 128 * KiB])
  })

  it('1R 2C2024: FAT32 con 2 KiB en 256 GiB → 512 GiB teórico, 256 GiB real', () => {
    const e = espacioFat(32, 2 * KiB, 256 * GiB)
    expect([e.teorico, e.real]).toEqual([512 * GiB, 256 * GiB])
    expect(espacioFat(16, 1 * KiB, 256 * GiB).real).toBe(64 * MiB)
  })

  it('1C2026 TT: pendrive de 2 GB en FAT32 con clusters de 16 bytes → tabla de 512 MiB', () => {
    const e = espacioFat(32, 16, 2 * GiB)
    expect([e.teorico, e.tamanoTabla]).toEqual([4 * GiB, 512 * MiB])
  })
})

describe('ext2: guía 2016', () => {
  it('Ej. 7: bloques de 1 KiB y punteros de 4 bytes', () => {
    expect(maxArchivoExt2({ directos: 12 }, KiB, 4)).toBe(12 * KiB)
    expect(maxArchivoExt2({ directos: 12, simples: 1 }, KiB, 4)).toBe(268 * KiB)
    const c = { directos: 12, simples: 1, dobles: 1, triples: 1 }
    expect(maxBloquesArchivo(c, KiB, 4)).toBe(16843020)
  })

  it('Ej. 8: 30 MiB con bloques de 1 KiB y punteros de 8 bytes → alcanza un indirecto triple', () => {
    const topes = { directos: 10, simples: 2, dobles: 2, triples: 2 }
    expect(conformacionesMinimas(30 * MiB, KiB, 8, topes)).toEqual([
      { directos: 0, simples: 0, dobles: 0, triples: 1 },
    ])
  })

  it('Ej. 9: bloques de 4 KiB, punteros de 8 bytes, 12 + 1 + 1 + 1', () => {
    const c = { directos: 12, simples: 1, dobles: 1, triples: 1 }
    expect(accesosByte(c, 4 * KiB, 8, 16777227)).toEqual({ datos: 1, punteros: 2, total: 3 })
    expect(accesosRango(c, 4 * KiB, 8, 0, 250180)).toEqual({ datos: 62, punteros: 1, total: 63 })
  })

  it('Ej. 10: disco de 10 TiB, 10 directos + 2 dobles + 2 triples', () => {
    const fs = espacioExt2(8, 4 * KiB, 10 * TiB)
    expect([fs.teorico, fs.real]).toEqual([2 ** 76, 10 * TiB])
    const c = { directos: 10, dobles: 2, triples: 2 }
    expect(maxBloquesArchivo(c, 4 * KiB, 8)).toBe(268959754)
    expect(maxArchivoExt2(c, 4 * KiB, 8)).toBe(1 * TiB + 2 * GiB + 40 * KiB)
  })
})

describe('ext2: accesos en resoluciones de parciales (sin contar el inodo)', () => {
  it('1C2025 TM: byte 415.000 → 3 bloques; 1 MiB → 1033', () => {
    const c = { directos: 10, simples: 2, dobles: 2, triples: 2 }
    expect(accesosByte(c, KiB, 8, 415000).total).toBe(3)
    expect(accesosRango(c, KiB, 8, 0, MiB - 1).total).toBe(1033)
  })

  it('1C2026 TM: bytes 10.500 a 544.767 → 522 de datos + 4 de punteros', () => {
    const c = { directos: 10, simples: 1, dobles: 1 }
    expect(accesosRango(c, KiB, 4, 10500, 544767)).toEqual({ datos: 522, punteros: 4, total: 526 })
  })

  it('1R 1C2025: bloques 4 a 1541 → 1546', () => {
    const c = { directos: 5, simples: 1, dobles: 1 }
    expect(accesosRango(c, KiB, 4, 4 * KiB, 1542 * KiB - 1).total).toBe(1546)
  })

  it('1C2024 TM: archivo de 530 KiB → 534', () => {
    const c = { directos: 12, simples: 1, dobles: 1, triples: 1 }
    expect(accesosRango(c, KiB, 4, 0, 530 * KiB - 1).total).toBe(534)
  })

  it('2C2025 TT: bytes 6.553.600 a 8.631.975.936 → 1.052.909 de datos + 1.032 de punteros', () => {
    const c = { directos: 12, simples: 1, dobles: 2 }
    expect(accesosRango(c, 8 * KiB, 8, 6553600, 8631975936)).toEqual({
      datos: 1052909,
      punteros: 1032,
      total: 1053941,
    })
  })
})
