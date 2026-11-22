---
titulo: DL → DF en decimal
tema: parcial-2/memoria-real
orden: 3
reconocer: da la DL en decimal
resumen: La DL viene en decimal; no se corta a ojo, se divide por potencias de 2.
trampas:
  - '**El resto no está en los decimales:** 4396 / 1024 = 4,29…, pero el resto es 4396 − 4 × 1024 = 300.'
  - '**Se divide por el tamaño de página**, no por la memoria ni por "la capacidad de la DF".'
  - '**Orden fijo:** límite → permiso → tabla. Si uno falla, fault y no se sigue.'
teoria:
  - división-entera-con-resto
  - cortar-la-dirección
  - segmentación-paginada
---

### Receta

1. **Segmento** = DL div 2<sup>(bits de página + bits de offset)</sup>. El resto es el desplazamiento.
2. **Límite:** desplazamiento ≤ límite del segmento. Si se pasa: segmentation fault.
3. **Permiso:** lectura mira R, escritura W, ejecución X.
4. **Página** = desplazamiento div tamaño de página; **offset** = el resto.
5. **DF** = frame × tamaño de página + offset.

### De dónde sale cada valor

|                                  |                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `div 2^k`                        | Dividir por 2<sup>k</sup> es correr k bits: el cociente son los bits de arriba. |
| `resto = n − cociente × divisor` | Son los bits de abajo. En la calculadora, los decimales **no** son el resto.    |
| `frame × página + offset`        | Lo mismo que pegar bits en hexa, pero hecho con la cuenta.                      |

### Ejemplo chico

15 bits: 2 de segmento, 3 de página, 10 de offset (páginas de 1 KiB). El segmento 2 es RW-, con límite 6143 y páginas 3 → 9, 4 → 14, 5 → 6. Escribir en `20780`.

```traduccion
sentido: directo
titulo: Escribir en 20780 con segmentación paginada
bitsSegmento: 2
bitsPagina: 3
bitsOffset: 10
unidad: decimal
acceso: escritura
segmentos:
  - { seg: 2, limite: 6143, permisos: RW-, paginas: { 3: 9, 4: 14, 5: 6 } }
direcciones:
  - { dl: 20780 }
```
