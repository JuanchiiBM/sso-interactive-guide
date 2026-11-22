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

```pasos
titulo: Armar el formato de la DL y la DF
pasos:
  - titulo: Offset
    texto: 'El offset numera los bytes de una página: 2 KiB = 2¹¹, así que son **11 bits**.'
    campos: [{ nombre: offset, bits: 11, tipo: off }]
    grande: '2 KiB = 2¹¹ → **11 bits**'
    resultado: offset 11
  - titulo: Frame
    texto: 'Frames = memoria / página = 128 KiB / 2 KiB = 64 = 2⁶: el número de frame ocupa **6 bits**. La DF es frame | offset.'
    campos: [{ nombre: frame, bits: 6, tipo: frame }, { nombre: offset, bits: 11, tipo: off }]
    grande: '128 KiB / 2 KiB = 64 = 2⁶ → **6 bits**'
    resultado: frame 6
  - titulo: Página
    texto: 'Las páginas de un segmento: 16 KiB / 2 KiB = 8 = 2³, así que la página ocupa **3 bits**.'
    grande: '16 KiB / 2 KiB = 8 = 2³ → **3 bits**'
    resultado: página 3
  - titulo: Segmento
    texto: 'Hasta 8 segmentos = 2³: **3 bits** de segmento.'
    grande: '8 segmentos = 2³ → **3 bits**'
    resultado: segmento 3
  - titulo: Formato
    texto: 'La DL es segmento | página | offset = 3 + 3 + 11 = **17 bits**. La DF, frame | offset = 6 + 11 = **17 bits**.'
    limpiar: true
    campos:
      - { nombre: segmento, bits: 3, tipo: seg }
      - { nombre: página, bits: 3, tipo: pag }
      - { nombre: offset, bits: 11, tipo: off }
    grande: 'DL = **17 bits** · DF = **17 bits**'
```
