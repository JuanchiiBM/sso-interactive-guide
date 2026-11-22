---
titulo: DL → DF en hexa
tema: parcial-2/memoria-real
orden: 2
reconocer: da una DL en hexa y la tabla, y pide la DF
resumen: Te dan una dirección lógica en hexa, el formato y la tabla; te piden la física o el fault.
trampas:
  - '**El primer dígito no se copia:** seg + pág se rearman siempre; el offset sí se copia.'
  - '**El primer dígito no se tira entero:** con 2 bits de segmento y 14 de desplazamiento, `7C00h` es 01|11…: segmento 1 y desplazamiento `3C00h`, no `C00h`.'
  - '**Dos DL iguales no son un error:** cada proceso tiene su espacio lógico. Aclará "6B10h del PID 2".'
  - '**Ejecutar mira la X:** no alcanza con R y W; un "-" es que no lo tiene.'
  - '**Orden fijo:** límite → permiso → tabla. Si uno falla, fault y no se sigue.'
teoria:
  - cortar-la-dirección
  - permisos
  - { ancla: traducción, texto: 'Paginación: traducción' }
  - segmentación-paginada
---

### Receta

0. **¿Qué esquema es?** Tabla de segmentos con base: segmentación pura. Una sola tabla de páginas: paginación pura. Tabla de segmentos y una tabla de páginas por segmento: segmentación paginada.
1. **Formato:** 2<sup>offset</sup> = tamaño de página; 2<sup>segmento</sup> = cantidad de segmentos; página = lo que sobra.
2. **Cortar:** pasá a binario solo el primer dígito. Los dígitos que son enteros del offset se copian.
3. **Límite** (si hay segmentos): desplazamiento ≤ límite del segmento. Si se pasa: segmentation fault.
4. **Permiso** (si la tabla los da): lectura mira R, escritura W, ejecución X.
5. **Tabla de páginas** (si hay páginas): página = fila, frame = el valor de esa fila.
6. **DF:** con páginas, frame | offset = frame × tamaño de página + offset; en segmentación pura, base + desplazamiento.

### De dónde sale cada valor

|                           |                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `2^offset = página`       | Con b bits se numeran 2<sup>b</sup> bytes: los de una página.                                           |
| `1 dígito hexa = 4 bits`  | 16 = 2<sup>4</sup>. Por eso 12 bits de offset son 3 dígitos que se copian enteros.                      |
| `desplazamiento ≤ límite` | Para la cátedra el límite es la última dirección válida. Si te dan el largo, es `<`.                    |
| `base + desplazamiento`   | Sin páginas el segmento está entero y contiguo a partir de su base.                                     |
| `frame × página + offset` | Los frames van uno atrás del otro y miden una página. Pegar bits es multiplicar por 2<sup>offset</sup>. |

### Ejemplo chico

La misma lectura de `6B10h` (16 bits) en los tres esquemas; cambiá de pestaña para ver qué cambia.

- **Segmentación pura:** 2 bits de segmento y 14 de desplazamiento. Segmento 1: base 8000h, límite 2FFFh, R-X.
- **Paginación pura:** 4 bits de página y 12 de offset (páginas de 4 KiB). Páginas 5 → 9, 6 → 3, 7 → E.
- **Segmentación paginada:** 2 de segmento, 2 de página, 12 de offset. Segmento 1: R-X, límite 2FFFh, páginas 0 → 5, 1 → A, 2 → C.

```traduccion
sentido: pasos
titulo: Leer 6B10h en los tres esquemas
dl: 0x6B10
acceso: lectura
esquemas:
  - nombre: Segmentación pura
    bitsSegmento: 2
    bitsOffset: 14
    segmentos:
      - { seg: 0, base: 0x0000, limite: 0x1FFF, permisos: RW- }
      - { seg: 1, base: 0x8000, limite: 0x2FFF, permisos: R-X }
  - nombre: Paginación pura
    bitsPagina: 4
    bitsOffset: 12
    paginas: { 5: 9, 6: 3, 7: 14 }
  - nombre: Segmentación paginada
    bitsSegmento: 2
    bitsPagina: 2
    bitsOffset: 12
    segmentos:
      - { seg: 0, limite: 0x1FFF, permisos: RW-, paginas: { 0: 7 } }
      - { seg: 1, limite: 0x2FFF, permisos: R-X, paginas: { 0: 5, 1: 10, 2: 12 } }
```
