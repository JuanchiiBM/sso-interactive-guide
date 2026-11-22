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

0. **¿Qué esquema es?** Igual que en hexa: con segmentos, con páginas o con los dos. Sin segmentos se salta el paso 1; sin páginas, el 4.
1. **Segmento** = DL div 2<sup>(bits de página + bits de offset)</sup>. El resto es el desplazamiento.
2. **Límite:** desplazamiento ≤ límite del segmento. Si se pasa: segmentation fault.
3. **Permiso:** lectura mira R, escritura W, ejecución X.
4. **Página** = desplazamiento div tamaño de página; **offset** = el resto.
5. **DF** = frame × tamaño de página + offset; en segmentación pura, base + desplazamiento.

### De dónde sale cada valor

|                                  |                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `div 2^k`                        | Dividir por 2<sup>k</sup> es correr k bits: el cociente son los bits de arriba. |
| `resto = n − cociente × divisor` | Son los bits de abajo. En la calculadora, los decimales **no** son el resto.    |
| `frame × página + offset`        | Lo mismo que pegar bits en hexa, pero hecho con la cuenta.                      |

### Ejemplo chico

La misma escritura en `20780` (15 bits) en los tres esquemas.

- **Segmentación pura:** 2 bits de segmento y 13 de desplazamiento. Segmento 2: base 30000, límite 6143, RW-.
- **Paginación pura:** 5 bits de página y 10 de offset (páginas de 1 KiB). Páginas 19 → 11, 20 → 7, 21 → 2.
- **Segmentación paginada:** 2 de segmento, 3 de página, 10 de offset. Segmento 2: RW-, límite 6143, páginas 3 → 9, 4 → 14, 5 → 6.

```traduccion
sentido: pasos
titulo: Escribir en 20780 en los tres esquemas
dl: 20780
unidad: decimal
acceso: escritura
esquemas:
  - nombre: Segmentación pura
    bitsSegmento: 2
    bitsOffset: 13
    segmentos:
      - { seg: 1, base: 9000, limite: 4095, permisos: R-X }
      - { seg: 2, base: 30000, limite: 6143, permisos: RW- }
  - nombre: Paginación pura
    bitsPagina: 5
    bitsOffset: 10
    paginas: { 19: 11, 20: 7, 21: 2 }
  - nombre: Segmentación paginada
    bitsSegmento: 2
    bitsPagina: 3
    bitsOffset: 10
    segmentos:
      - { seg: 2, limite: 6143, permisos: RW-, paginas: { 3: 9, 4: 14, 5: 6 } }
```
