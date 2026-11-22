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

| Proceso | Página | Frame | P   | U   | M   |
| ------- | ------ | ----- | --- | --- | --- |
| A       | 0      | 2     | 1   | 1   | 0   |
| A       | 1      | 0     | 0   | –   | –   |
| A       | 2      | 3     | 1   | 1   | 1   |
| B       | 0      | 1     | 1   | 0   | 0   |
| B       | 1      | 0     | 1   | 0   | 1   |

A1 tiene P = 0: su "frame 0" es viejo, el frame 0 es de B1. Quedan 4 presentes, así que hay **4 frames** y la página mide 16 KiB / 4 = **4 KiB**.

| Frame | Proceso, página | U   | M   |
| ----- | --------------- | --- | --- |
| F0    | B1              | 0   | 1   |
| F1    | B0              | 0   | 0   |
| F2    | A0              | 1   | 0   |
| F3    | A2              | 1   | 1   |

La única con U = 1 y M = 1 es **A2**: fue la última escritura.
