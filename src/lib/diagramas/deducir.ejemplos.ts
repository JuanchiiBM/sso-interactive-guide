/** Casos de la guía para los tests de deducir el algoritmo. */
import type { SpecDeducir } from './deducir'

// memoria-virtual ej-18: una víctima, frames 20/30/40/50
export const ej18: SpecDeducir = {
  titulo: '¿Qué algoritmo sacó a B2?',
  bitsOffset: 20,
  bitsDL: 32,
  bitsDF: 28,
  marcos: [
    { frame: 20, proceso: 'B', pagina: 2, tur: 100, tc: 100, u: 0, m: 1 },
    { frame: 30, proceso: 'A', pagina: 0, tur: 105, tc: 50, u: 0, m: 0 },
    { frame: 40, proceso: 'A', pagina: 2, tur: 200, tc: 90, u: 1, m: 0 },
    { frame: 50, proceso: 'A', pagina: 3, tur: 300, tc: 95, u: 1, m: 1 },
  ],
  referencias: [{ proceso: 'A', dl: 0x00bb1233, df: 0x14b1233 }],
  algoritmos: ['fifo', 'lru', 'clock', 'clock-mejorado'],
}

// memoria-virtual ej-11: un proceso, solo LRU y Clock mejorado
export const ej11: SpecDeducir = {
  titulo: '¿Qué algoritmo sacó a la página 6?',
  bitsOffset: 14,
  bitsDL: 16,
  bitsDF: 18,
  uso: 'REF',
  marcos: [
    { frame: 2, pagina: 0, tur: 101, u: 1, m: 1 },
    { frame: 6, pagina: 2, tur: 77, u: 1, m: 1 },
    { frame: 11, pagina: 6, tur: 200, u: 1, m: 0 },
  ],
  referencias: [{ dl: 0xc0ff, df: 0x2c0ff }],
  algoritmos: ['lru', 'clock-mejorado'],
}

// memoria-virtual ej-16: reemplazo global, 4 referencias y 3 víctimas
export const ej16: SpecDeducir = {
  titulo: '¿Qué algoritmo sacó F4, F0 y F5?',
  bitsOffset: 14,
  bitsDL: 20,
  bitsDF: 17,
  uso: 'TS',
  marcos: [
    { frame: 0, proceso: 'B', pagina: 1, tur: 90, u: 0, m: 0 },
    { frame: 1, proceso: 'B', pagina: 5, tur: 105, u: 1, m: 1 },
    { frame: 2, proceso: 'A', pagina: 2, tur: 100, u: 1, m: 0 },
    { frame: 3, proceso: 'C', pagina: 1, tur: 120, u: 1, m: 0 },
    { frame: 4, proceso: 'B', pagina: 3, tur: 85, u: 0, m: 1 },
    { frame: 5, proceso: 'C', pagina: 4, tur: 110, u: 1, m: 0 },
    { frame: 6, proceso: 'A', pagina: 4, tur: 115, u: 1, m: 1 },
    { frame: 7, proceso: 'C', pagina: 2, tur: 95, u: 1, m: 1 },
  ],
  referencias: [
    { proceso: 'A', dl: 0x00aef, df: 0x10aef, acceso: 'E' },
    { proceso: 'C', dl: 0x17a1c, df: 0x00a1c, acceso: 'E' },
    { proceso: 'B', dl: 0x13778, df: 0x17778, acceso: 'E' },
    { proceso: 'A', dl: 0x095f1, df: 0x095f1, acceso: 'L' },
  ],
  algoritmos: ['fifo', 'lru', 'clock', 'clock-mejorado'],
}
