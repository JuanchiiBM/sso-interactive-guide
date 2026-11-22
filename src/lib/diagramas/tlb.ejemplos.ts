/** Casos de la guía para los tests de la TLB. */
import type { SpecTlb } from './tlb'
import type { SpecTlbNiveles } from './tlb-niveles'

// memoria-virtual ej-07: TLB FIFO de 4 entradas, LRU local con 4 frames por proceso
export const ej07: SpecTlb = {
  titulo: 'Referencias de A y B',
  bitsPagina: 6,
  bitsOffset: 14,
  bitsFrame: 4,
  entradas: 4,
  tlb: [
    { pagina: 11, frame: 2, proceso: 'A', ingreso: 50 },
    { pagina: 7, frame: 12, proceso: 'A', ingreso: 75 },
    { pagina: 3, frame: 9, proceso: 'B', ingreso: 35 },
    { pagina: 15, frame: 7, proceso: 'B', ingreso: 60 },
  ],
  procesos: {
    A: [
      { frame: 2, pagina: 11, acc: 80 },
      { frame: 5, pagina: 5, acc: 65 },
      { frame: 8, pagina: 13, acc: 20 },
      { frame: 12, pagina: 7, acc: 75 },
    ],
    B: [
      { frame: 1, pagina: 11, acc: 30 },
      { frame: 3 },
      { frame: 7, pagina: 15, acc: 60 },
      { frame: 9, pagina: 3, acc: 48 },
    ],
  },
  referencias: [
    { proceso: 'B', dl: 0x2c010, instante: 85 },
    { proceso: 'A', dl: 0x2f022, instante: 90 },
    { proceso: 'A', dl: 0x19333, instante: 95 },
    { proceso: 'B', dl: 0x1e041, instante: 100 },
    { proceso: 'A', dl: 0x30000, instante: 105 },
  ],
}

// memoria-virtual ej-06, P1: TLB y frames vacíos, referencias como páginas
export const ej06: SpecTlb = {
  titulo: 'P1',
  entradas: 4,
  procesos: { P1: [{ frame: 0 }, { frame: 1 }, { frame: 2 }, { frame: 3 }] },
  referencias: [10, 11, 0, 3, 4, 11, 0, 3, 4, 11, 0, 3, 4],
}

// memoria-virtual ej-08: dos niveles de 8 bits, TLB con lugar, bitmap desde el frame 0015
export const ej08: SpecTlbNiveles = {
  titulo: 'Referencias de A',
  niveles: [8, 8],
  bitsOffset: 16,
  bitsFrame: 16,
  entradas: 8,
  tlb: [
    { pagina: 0x1020, frame: 0x0011, proceso: 'A' },
    { pagina: 0xa101, frame: 0x000a, proceso: 'A' },
    { pagina: 0x0301, frame: 0x00aa, proceso: 'B' },
    { pagina: 0x1111, frame: 0x0010, proceso: 'A' },
    { pagina: 0x0022, frame: 0x0004, proceso: 'C' },
  ],
  tp1: { 0x02: 0xfff10000, 0x03: 0xfff30000, 0x04: 0xfff50000 },
  tablas: {
    0xfff30000: {
      0x00: { frame: 0x000f, p: 0 },
      0x01: { frame: 0x000c, p: 0 },
      0x02: { frame: 0x0002, p: 1 },
      0x03: { frame: 0x000b, p: 1 },
      0x04: { frame: 0x0001, p: 0 },
    },
  },
  bitmap: { desde: 0x15, bits: [0, 1, 1, 0, 1, 1, 1, 1, 1, 0] },
  referencias: [
    { proceso: 'A', dl: 0xa1012222 },
    { proceso: 'A', dl: 0x030110a1 },
    { proceso: 'A', dl: 0x03030000 },
  ],
}
