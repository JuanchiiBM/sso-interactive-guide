---
titulo: Armar el mapa de frames
tema: parcial-2/memoria-virtual
orden: 1
reconocer: da las tablas de páginas de varios procesos y pregunta qué hay en cada frame
resumen: Te dan las tablas de páginas; te piden qué página ocupa cada frame, el tamaño de página o cuál fue la última referencia.
trampas:
  - '**Página = fila, frame = valor:** no los cruces.'
  - '**Con P = 0 el frame es dato viejo:** esa página no está en RAM, aunque la fila tenga un número.'
  - '**P = 1 es "está en RAM"**, no "está en la TLB": la TLB es una caché de traducciones.'
teoria:
  - tabla-de-páginas-y-tabla-de-frames-libres
  - el-bit-m-escribir-en-ram-no-es-escribir-en-disco
---

### Receta

1. **Tomá solo las filas con P = 1.** Con P = 0 (o "-"), el frame que figura es dato viejo.
2. **Página = fila** y **frame = el valor** de la columna Frame.
3. **Armá la tabla frame → (proceso, página, U, M)**, ordenada por frame.
4. **Tamaño de página:** si "todos los frames están asignados", frames = páginas presentes y página = memoria / frames.
5. **"La última referencia fue una escritura"**: es la única página con U = 1 y M = 1.

### De dónde sale cada valor

|                             |                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `P = 1`                     | El bit de presencia dice si la página está en RAM; solo ahí el frame vale.              |
| `página = memoria / frames` | Con todos los frames ocupados, cada página presente es un frame.                        |
| `U = 1 y M = 1`             | Una escritura pone U y M en 1; si es la única con los dos, fue la última en escribirse. |

### Ejemplo chico

Memoria de 16 KiB, todos los frames asignados.

```pasos
titulo: De las tablas de páginas al mapa de frames
pasos:
  - titulo: Solo P = 1
    texto: 'Se toman solo las filas con P = 1. A1 dice frame 0, pero tiene **P = 0**: ese 0 es dato viejo (el frame 0 es de B1).'
    tabla:
      titulo: Tablas de páginas de A y B
      columnas: [Proceso, Pág, Frame, P, U, M]
      filas:
        - [A, 0, 2, 1, 1, 0]
        - [A, 1, 0, 0, '–', '–']
        - [A, 2, 3, 1, 1, 1]
        - [B, 0, 1, 1, 0, 0]
        - [B, 1, 0, 1, 0, 1]
      marca: [0, 2, 3, 4]
    resultado: 4 presentes
  - titulo: Tamaño de página
    texto: 'Con todos los frames ocupados, frames = páginas presentes = 4. La página mide 16 KiB / 4 = **4 KiB**.'
    grande: '16 KiB / 4 frames = **4 KiB**'
    resultado: página 4 KiB
  - titulo: Mapa de frames
    texto: 'Página = fila, frame = valor: se da vuelta la tabla y queda ordenada por frame.'
    tabla:
      titulo: Mapa de frames
      columnas: [Frame, Página, U, M]
      filas: [[F0, B1, 0, 1], [F1, B0, 0, 0], [F2, A0, 1, 0], [F3, A2, 1, 1]]
  - titulo: Última escritura
    texto: 'Una escritura deja U = 1 y M = 1. La única con los dos es **A2**: fue la última escritura.'
    tabla:
      titulo: Mapa de frames
      columnas: [Frame, Página, U, M]
      filas: [[F0, B1, 0, 1], [F1, B0, 0, 0], [F2, A0, 1, 0], [F3, A2, 1, 1]]
      marca: 3
      foco: 1
    grande: 'U = 1 y M = 1 → **A2**'
```
