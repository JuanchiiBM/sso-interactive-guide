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

1. **Formato:** 2<sup>offset</sup> = tamaño de página; 2<sup>segmento</sup> = cantidad de segmentos; página = lo que sobra.
2. **Cortar:** pasá a binario solo el primer dígito. Los dígitos que son enteros del offset se copian.
3. **Límite:** desplazamiento ≤ límite del segmento. Si se pasa: segmentation fault.
4. **Permiso:** lectura mira R, escritura W, ejecución X.
5. **Tabla de páginas:** página = fila, frame = el valor de esa fila.
6. **DF** = frame | offset = frame × tamaño de página + offset.

### De dónde sale cada valor

|                           |                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `2^offset = página`       | Con b bits se numeran 2<sup>b</sup> bytes: los de una página.                                           |
| `1 dígito hexa = 4 bits`  | 16 = 2<sup>4</sup>. Por eso 12 bits de offset son 3 dígitos que se copian enteros.                      |
| `desplazamiento ≤ límite` | Para la cátedra el límite es la última dirección válida. Si te dan el largo, es `<`.                    |
| `frame × página + offset` | Los frames van uno atrás del otro y miden una página. Pegar bits es multiplicar por 2<sup>offset</sup>. |

### Ejemplo chico

16 bits: 2 de segmento, 2 de página, 12 de offset (páginas de 4 KiB). El segmento 1 es R-X, con límite 2FFFh y páginas 0 → 5, 1 → A, 2 → C. Leer `6B10h`.

```traduccion
sentido: directo
titulo: Leer 6B10h con segmentación paginada
bitsSegmento: 2
bitsPagina: 2
bitsOffset: 12
unidad: hexa
acceso: lectura
segmentos:
  - { seg: 1, limite: 0x2FFF, permisos: R-X, paginas: { 0: 5, 1: 10, 2: 12 } }
direcciones:
  - { dl: 0x6B10 }
```
