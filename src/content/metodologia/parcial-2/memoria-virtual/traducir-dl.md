---
titulo: Traducir una DL
tema: parcial-2/memoria-virtual
orden: 2
reconocer: da una DL en decimal de un proceso y pide la DF o si hay page fault
resumen: Te dan una DL y las tablas; te piden si es hit o page fault y la DF.
trampas:
  - '**Calcular la DF antes de elegir la víctima:** en un PF el frame recién se sabe después del reemplazo.'
  - '**Tiene que estar esa página de ese proceso:** "A está en memoria" no es lo mismo que "está A1"; una página de otro proceso no es hit.'
  - '**DF = frame × página + offset**, no DL × página + offset.'
teoria:
  - los-tres-casos-de-una-referencia
  - atención-de-un-page-fault
---

### Receta

1. **Página** = DL div tamaño de página; **offset** = DL − página × tamaño de página.
2. **¿Esa página de ese proceso tiene P = 1?**
   - **Sí, es hit:** DF = frame × tamaño de página + offset.
   - **No, es page fault:** corré el algoritmo, la página entra **en el frame de la víctima** y recién ahí DF = frame nuevo × tamaño de página + offset.
3. **Actualizá la tabla:** la nueva con P = 1 y su frame; la víctima con P = 0.

### De dónde sale cada valor

|                           |                                                                               |
| ------------------------- | ----------------------------------------------------------------------------- |
| `DL div tamaño de página` | Las páginas van una atrás de otra: el cociente dice en cuál cae la dirección. |
| `offset` igual            | Página y frame miden lo mismo; el offset pasa sin cambios.                    |
| frame de la víctima       | En un PF sin frames libres, la página nueva ocupa el lugar de la que sale.    |

### Ejemplo chico

Páginas de 4 KiB (4096 B). El proceso A tiene la página 2 en el frame 3 y la página 1 en disco.

| DL de A | Página, offset                       | ¿Está?           | DF                                                            |
| ------- | ------------------------------------ | ---------------- | ------------------------------------------------------------- |
| 9000    | 9000 div 4096 = 2; 9000 − 8192 = 808 | A2 en F3: hit    | 3 × 4096 + 808 = **13096**                                    |
| 5000    | 5000 div 4096 = 1; 5000 − 4096 = 904 | A1 con P = 0: PF | el algoritmo elige la víctima en F0: 0 × 4096 + 904 = **904** |
