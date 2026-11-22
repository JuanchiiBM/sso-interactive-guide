---
titulo: Diseñar un inodo con requisitos
tema: parcial-2/fat-ufs
orden: 8
reconocer: da requisitos (accesos, tamaños, cantidad de punteros) y pide cuántos punteros de cada tipo
resumen: Te dan condiciones sobre el inodo; cada una decide una pieza del diseño.
trampas:
  - '**Verificá, no supongas:** "archivos de al menos S" se comprueba con la fórmula del archivo máximo.'
  - '**El byte X** se pasa a bloque (X div bloque) antes de ubicarlo en una zona.'
  - '**Pocos directos** hacen que el simple empiece antes: mirá que el byte pedido siga cayendo donde tiene que caer.'
teoria:
  - el-inodo
  - cuentas-en-ufs
---

### Receta

| Requisito                                              | Qué decide                                        |
| ------------------------------------------------------ | ------------------------------------------------- |
| "archivos de hasta N con la menor cantidad de accesos" | ceil(N / bloque) punteros **directos**            |
| "el byte X en ≤ 2 accesos"                             | el bloque de X cae en el **simple**               |
| "ningún byte en más de k accesos"                      | el nivel máximo: k = 3 deja usar hasta el doble   |
| "como máximo m punteros en el inodo"                   | la suma de todos                                  |
| "archivos de al menos S"                               | se **verifica** con la fórmula del archivo máximo |
| "FS teórico de T con bloque B"                         | se despejan los bits del puntero                  |

### De dónde sale cada valor

|                     |                                                                              |
| ------------------- | ---------------------------------------------------------------------------- |
| directos primero    | Un directo es 1 acceso: los archivos chicos se leen sin bloques de punteros. |
| nivel = accesos − 1 | Cada nivel de indirección agrega una lectura antes del dato.                 |

### Ejemplo chico

Bloques de 1 KiB, P = 256. Requisitos: archivos de hasta 12 KiB con la menor cantidad de accesos; el byte 200.000 en ≤ 2 accesos; ningún byte en más de 3; archivos de al menos 60 MiB.

| Requisito        | Decisión                                              |
| ---------------- | ----------------------------------------------------- |
| hasta 12 KiB     | **12 PD**                                             |
| byte 200.000     | bloque 195; el IS cubre del 12 al 267: **1 IS**       |
| máximo 3 accesos | hasta el doble: **1 ID**, sin triple                  |
| al menos 60 MiB  | (12 + 256 + 65.536) × 1 KiB = 65.804 KiB ≈ 64,3 MiB ✓ |
