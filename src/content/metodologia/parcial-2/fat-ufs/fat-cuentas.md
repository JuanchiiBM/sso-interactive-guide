---
titulo: Cuentas en FAT
tema: parcial-2/fat-ufs
orden: 2
reconocer: pide el tamaño de la tabla FAT, el FS máximo, el espacio asignado o la fragmentación
resumen: Te dan la versión de FAT, el cluster y el disco; te piden tamaños.
trampas:
  - '**El FS real no es el disco:** es el mínimo entre el teórico y la partición.'
  - '**Una porción de la FAT** son entradas × tamaño de **entrada** (11 entradas de FAT32 = 44 B), no × cluster.'
  - '**FAT32 usa 28 bits**, aunque cada entrada ocupe 4 B.'
  - '**GiB, no GB:** 1 GiB = 2<sup>30</sup>; 1 GB = 10<sup>9</sup>.'
teoria:
  - versiones-bits-por-entrada
  - cuentas-en-fat
---

### Receta

| Pregunta              | Cuenta                                                          |
| --------------------- | --------------------------------------------------------------- |
| FS teórico            | 2<sup>bits</sup> × cluster (FAT12 = 12, FAT16 = 16, FAT32 = 28) |
| FS real               | mínimo(teórico, partición)                                      |
| Tamaño de la tabla    | clusters del FS real × tamaño de entrada (1,5 B, 2 B o 4 B)     |
| Espacio asignado      | clusters del archivo × tamaño de cluster                        |
| Fragmentación interna | asignado − tamaño real del archivo                              |

### De dónde sale cada valor

|                    |                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------- |
| `2^bits × cluster` | Hay una entrada por cluster: con b bits se numeran 2<sup>b</sup> clusters.          |
| `mínimo(…)`        | No se puede direccionar más disco del que hay, ni más del que numeran las entradas. |
| asignado           | Se asignan clusters enteros: el último puede quedar a medias.                       |

Cluster más grande: tabla más chica, pero más fragmentación interna.

### Ejemplo chico

FAT16 con clusters de 4 KiB en un disco de 512 MiB, y un archivo de 10.000 B.

| Pregunta              | Cuenta                                                         |
| --------------------- | -------------------------------------------------------------- |
| FS teórico            | 2<sup>16</sup> × 2<sup>12</sup> = 2<sup>28</sup> = **256 MiB** |
| FS real               | mínimo(256 MiB, 512 MiB) = **256 MiB**                         |
| Tamaño de la tabla    | 2<sup>16</sup> clusters × 2 B = **128 KiB**                    |
| Espacio asignado      | 10.000 / 4096 = 2,44 → 3 clusters × 4 KiB = **12.288 B**       |
| Fragmentación interna | 12.288 − 10.000 = **2.288 B**                                  |
