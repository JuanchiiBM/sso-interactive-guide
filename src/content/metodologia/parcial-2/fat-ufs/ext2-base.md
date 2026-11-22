---
titulo: Punteros por bloque y FS en ext2
tema: parcial-2/fat-ufs
orden: 3
reconocer: da el tamaño de bloque y de puntero, y pide cuántos punteros entran o el tamaño del FS
resumen: Es la base de todas las cuentas de ext2; P y el FS máximo.
trampas:
  - '**Todo en bytes:** un puntero de 32 bits son 4 B; P = 2048 / 4, no 2<sup>11</sup> / 2<sup>32</sup>.'
  - '**P es un número chico:** si da más que el bloque, está mal.'
  - '**No confundas P con el archivo máximo:** P es cuántos punteros entran en un bloque.'
  - '**El FS real** es el mínimo entre el teórico y la partición.'
teoria:
  - el-inodo
  - cuentas-en-ufs
---

### Receta

1. **P** = tamaño de bloque / tamaño de puntero, los dos en bytes.
2. **FS teórico** = 2<sup>bits del puntero</sup> × tamaño de bloque. Acá sí van los bits.
3. **FS real** = mínimo(teórico, partición).
4. **Al revés:** si te dan el FS teórico, despejá el bloque o los bits del puntero.

### De dónde sale cada valor

|                        |                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `P = bloque / puntero` | Un bloque de punteros es un bloque lleno de punteros: entran tantos como quepan.                    |
| `2^bits × bloque`      | Un puntero de b bits numera 2<sup>b</sup> bloques distintos.                                        |
| hojas y cajas          | Los bloques de **datos** son hojas; los de **punteros**, cajas de fichas: también ocupan y se leen. |

### Ejemplo chico

Bloques de 2 KiB, punteros de 32 bits, partición de 2 TiB.

```pasos
titulo: P y tamaño del FS en ext2
pasos:
  - titulo: Todo en bytes
    texto: 'Un puntero de 32 bits ocupa 32 / 8 = **4 B**. Antes de dividir, todo en bytes.'
    grande: '32 bits / 8 = **4 B**'
    resultado: puntero 4 B
  - titulo: P
    texto: 'Un bloque de punteros es un bloque lleno de punteros: 2048 B / 4 B = **512**.'
    grande: 'P = 2048 B / 4 B = **512**'
    resultado: P = 512
  - titulo: FS teórico
    texto: 'Acá sí van los bits: un puntero de 32 bits numera 2³² bloques de 2¹¹ B = 2⁴³ = **8 TiB**.'
    grande: '2³² × 2¹¹ = 2⁴³ = **8 TiB**'
    resultado: teórico 8 TiB
  - titulo: FS real
    texto: 'La partición es más chica: el mínimo es **2 TiB**.'
    grande: 'mín(8 TiB, 2 TiB) = **2 TiB**'
```
