---
titulo: Formato de la dirección
tema: parcial-2/memoria-real
orden: 1
reconocer: da el tamaño de memoria, de página o la cantidad de segmentos y pide bits
resumen: Te dan tamaños y cantidades; te piden cuántos bits tiene cada campo de la dirección.
trampas:
  - '**Bits no es tamaño:** para numerar 64 frames hacen falta log₂(64) = 6 bits, no 64 / 2.'
  - '**Contá bien el exponente:** 16 KiB = 2<sup>4</sup> × 2<sup>10</sup> = **2<sup>14</sup>**, no 2<sup>13</sup>.'
  - '**Releé los datos de cada ejercicio:** el tamaño de página del inciso anterior no vale en este.'
teoria:
  - cuántos-bits-tiene-cada-dirección
  - tamaños-en-potencias-de-2
  - deducir-cuántos-bits-son-de-segmento
---

### Receta

1. **Offset** = log₂(tamaño de página).
2. **Frames** = memoria física / tamaño de página; los bits del frame son log₂(frames).
3. **Página** = log₂(tamaño máximo del segmento / tamaño de página).
4. **Segmento** = log₂(cantidad máxima de segmentos).
5. **Formato:** DL = `| seg | pág | offset |` y DF = `| frame | offset |`. La suma tiene que dar el ancho de cada dirección.

### De dónde sale cada valor

|                         |                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `log₂(N)`               | Con b bits se escriben 2<sup>b</sup> valores: para numerar N cosas hacen falta log₂(N) bits.                              |
| `N × unidad = 2^k`      | Los exponentes se suman: 2 KiB = 2<sup>1</sup> × 2<sup>10</sup> = 2<sup>11</sup>. Si N no es potencia de 2, se factoriza. |
| `offset` en DL y DF     | Página y frame miden lo mismo: el offset numera los bytes de adentro y pasa igual a la DF.                                |
| `pág = log₂(seg / pág)` | Son las páginas que entran en el segmento más grande.                                                                     |

### Ejemplo chico

Memoria de 128 KiB, páginas de 2 KiB, hasta 8 segmentos de hasta 16 KiB.

| Campo    | Cuenta                                                 | Bits |
| -------- | ------------------------------------------------------ | ---- |
| Offset   | log₂(2 KiB) = log₂(2<sup>11</sup>)                     | 11   |
| Frame    | 2<sup>17</sup> / 2<sup>11</sup> = 64 frames → log₂(64) | 6    |
| Página   | 16 KiB / 2 KiB = 8 páginas → log₂(8)                   | 3    |
| Segmento | log₂(8)                                                | 3    |

DL = 3 + 3 + 11 = **17 bits**; DF = 6 + 11 = **17 bits**.
