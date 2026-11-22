---
titulo: Formato de la dirección
tema: parcial-2/memoria-real
orden: 1
reconocer: da el tamaño de memoria, de página o la cantidad de segmentos y pide bits
resumen: Te dan tamaños y cantidades; te piden cuántos bits tiene cada campo de la dirección.
trampas:
  - '**Bits no es tamaño:** 64 frames = 2<sup>6</sup>, así que son 6 bits, no 64 / 2.'
  - '**Contá bien el exponente:** 16 KiB = 2<sup>4</sup> × 2<sup>10</sup> = **2<sup>14</sup>**, no 2<sup>13</sup>.'
  - '**Releé los datos de cada ejercicio:** el tamaño de página del inciso anterior no vale en este.'
teoria:
  - cuántos-bits-tiene-cada-dirección
  - tamaños-en-potencias-de-2
  - deducir-cuántos-bits-son-de-segmento
---

### Receta

1. **Offset:** 2<sup>offset</sup> = tamaño de página.
2. **Frames** = memoria física / tamaño de página; 2<sup>bits del frame</sup> = frames.
3. **Página:** 2<sup>página</sup> = tamaño máximo del segmento / tamaño de página.
4. **Segmento:** 2<sup>segmento</sup> = cantidad máxima de segmentos.
5. **Formato:** DL = `| seg | pág | offset |` y DF = `| frame | offset |`. La suma tiene que dar el ancho de cada dirección.

### De dónde sale cada valor

|                     |                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `2^bits = N`        | Con b bits se escriben 2<sup>b</sup> valores: para numerar N cosas, buscás a qué potencia de 2 hay que elevar para llegar a N. |
| `N × unidad = 2^k`  | Los exponentes se suman: 2 KiB = 2<sup>1</sup> × 2<sup>10</sup> = 2<sup>11</sup>. Si N no es potencia de 2, se factoriza.      |
| `offset` en DL y DF | Página y frame miden lo mismo: el offset numera los bytes de adentro y pasa igual a la DF.                                     |
| `2^pág = seg / pág` | Son las páginas que entran en el segmento más grande.                                                                          |

### Ejemplo chico

Memoria de 128 KiB, páginas de 2 KiB, hasta 8 segmentos de hasta 16 KiB.

| Campo    | Cuenta                                                      | Bits |
| -------- | ----------------------------------------------------------- | ---- |
| Offset   | 2 KiB = 2<sup>11</sup>                                      | 11   |
| Frame    | 2<sup>17</sup> / 2<sup>11</sup> = 64 frames = 2<sup>6</sup> | 6    |
| Página   | 16 KiB / 2 KiB = 8 páginas = 2<sup>3</sup>                  | 3    |
| Segmento | 8 segmentos = 2<sup>3</sup>                                 | 3    |

DL = 3 + 3 + 11 = **17 bits**; DF = 6 + 11 = **17 bits**.
