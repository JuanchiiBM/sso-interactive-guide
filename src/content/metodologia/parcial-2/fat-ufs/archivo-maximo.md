---
titulo: Archivo máximo en ext2
tema: parcial-2/fat-ufs
orden: 4
reconocer: da los punteros del inodo y pide el tamaño máximo de un archivo
resumen: Te dan cuántos punteros de cada tipo tiene el inodo; te piden cuánto puede medir un archivo.
trampas:
  - '**Cada nivel multiplica por P:** el doble son P<sup>2</sup> bloques, no 2 × P.'
  - '**Pasalo a bytes:** la suma da bloques; falta multiplicar por el tamaño de bloque.'
  - '**Solo hojas:** el archivo máximo cuenta bloques de datos, no los de punteros.'
teoria:
  - el-inodo
  - cuentas-en-ufs
---

### Receta

1. **P** = bloque / puntero (en bytes).
2. **Bloques de datos** = PD + IS × P + ID × P<sup>2</sup> + IT × P<sup>3</sup>.
3. **Archivo máximo** = esa suma × tamaño de bloque.
4. **Comparalo con el FS real:** un archivo no puede medir más que el FS.

### De dónde sale cada valor

|            |                                                                         |
| ---------- | ----------------------------------------------------------------------- |
| `IS × P`   | El simple apunta a una caja con P punteros a datos.                     |
| `ID × P^2` | El doble apunta a una caja de P cajas, cada una con P punteros a datos. |
| `× bloque` | Cada puntero a datos es un bloque de datos entero.                      |

### Ejemplo chico

Bloques de 1 KiB, punteros de 8 B, inodo con 12 PD + IS + ID.

P = 1024 / 8 = 128. Bloques de datos = 12 + 128 + 128<sup>2</sup> = 12 + 128 + 16.384 = **16.524**. Archivo máximo = 16.524 × 1 KiB = **16.524 KiB** (unos 16 MiB).
