---
titulo: Leer un byte en ext2
tema: parcial-2/fat-ufs
orden: 5
reconocer: pide cuántos bloques se leen para llegar a un byte o a un bloque lógico
resumen: Te dan el inodo y un byte; te piden por qué puntero se llega y cuántos accesos son.
trampas:
  - '**El rango de la zona no son lecturas:** solo dice si el bloque cae adentro.'
  - '**Bloques desde 0:** el byte 1023 con bloques de 1 KiB está en el bloque 0.'
  - '**El inodo no cuenta:** el archivo ya está abierto.'
teoria:
  - leer-el-byte-n-de-un-archivo
  - cuentas-en-ufs
---

### Receta

1. **Bloque lógico** = byte div tamaño de bloque, contando desde 0.
2. **Rangos de cada zona:** PD de 0 a n − 1; IS los P siguientes; ID los P<sup>2</sup> siguientes; IT los P<sup>3</sup> siguientes.
3. **Accesos:** PD 1, IS 2, ID 3, IT 4. Es un solo camino: un bloque por nivel.

### De dónde sale cada valor

|                   |                                                                                |
| ----------------- | ------------------------------------------------------------------------------ |
| `byte div bloque` | Cada bloque guarda tantos bytes como mide; el cociente dice cuántos hay antes. |
| rangos acumulados | Las zonas se llenan en orden: el simple empieza donde terminan los directos.   |
| IS = 2            | Se lee el bloque de punteros y después el de datos.                            |

### Ejemplo chico

Bloques de 1 KiB, punteros de 4 B (P = 256), inodo con 10 PD + IS + ID. Leer el byte 300.000.

```inodo
titulo: Leer el byte 300000
bloque: 1024
puntero: 4
punteros: { directos: 10, simples: 1, dobles: 1 }
byte: 300000
```
