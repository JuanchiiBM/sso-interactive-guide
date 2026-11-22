---
titulo: Leer un rango de bytes en ext2
tema: parcial-2/fat-ufs
orden: 7
reconocer: pide cuántos accesos hacen falta para leer desde un byte hasta otro
resumen: Te dan un rango de bytes; te piden las hojas del rango más las cajas que se usan.
trampas:
  - '**La hoja final no es la cantidad:** hojas = final − inicial + 1.'
  - '**El +1 cambia las cajas:** 257 hojas en un doble piden 2 cajas chicas, no 1.'
  - '**El último doble no está lleno:** contá solo las cajas que el rango usa.'
teoria:
  - leer-el-byte-n-de-un-archivo
  - cuentas-en-ufs
---

### Receta

1. **Hoja inicial** = byte inicial div bloque; **hoja final** = byte final div bloque (desde 0).
2. **Hojas** = final − inicial + 1.
3. **Ubicá las zonas** que toca el rango y contá **solo las cajas que se usan**; en la última zona, las chicas necesarias, redondeando para arriba.
4. **Total** = hojas + cajas.

### De dónde sale cada valor

|                       |                                                            |
| --------------------- | ---------------------------------------------------------- |
| `final − inicial + 1` | Es un rango inclusivo: del 5 al 7 son 3 bloques, no 2.     |
| solo las cajas usadas | Una caja que no apunta a ninguna hoja del rango no se lee. |
| redondeo para arriba  | Una caja con algún puntero del rango se lee entera.        |

### Ejemplo chico

Bloques de 1 KiB, P = 256, inodo con 10 PD + IS + ID. Leer del byte 5000 al 400.000.

```inodo
titulo: Leer del byte 5000 al 400000
bloque: 1024
puntero: 4
punteros: { directos: 10, simples: 1, dobles: 1 }
bytes: [5000, 400000]
```

Hojas 4 a 390 = **387**. PD sin cajas; IS 1 caja; ID 1 grande + 1 chica (125 hojas). Total = 387 + 3 = **390**.
