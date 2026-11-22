---
titulo: DF → DL
tema: parcial-2/memoria-real
orden: 4
reconocer: da una DF y las tablas de páginas, y pide la DL
resumen: Vas al revés; de la DF sacás el frame, buscás quién lo tiene y armás la DL.
trampas:
  - '**Buscá en todas las tablas:** el frame puede ser de otro proceso o de otro segmento.'
  - '**La misma DL en dos procesos no es un error:** aclará "14A0h del PID 2".'
  - '**El primer dígito se rearma:** seg + pág no son el número de frame.'
teoria:
  - segmentación-paginada
  - protección-y-compartición
---

### Receta

1. **Formato de la DF:** frames = memoria / tamaño de página; DF = `| frame | offset |`.
2. **Cortá la DF:** si el offset es múltiplo de 4 bits, el corte cae justo en un dígito hexa.
3. **Buscá el frame** en **todas** las tablas de páginas: el proceso, el segmento y la página que lo tienen.
4. **Pegá** `| seg | pág | offset |`: esa es la DL. Si ninguna tabla tiene el frame, está libre.

### De dónde sale cada valor

|                      |                                                                                   |
| -------------------- | --------------------------------------------------------------------------------- |
| `offset` igual       | Página y frame miden lo mismo: el offset no cambia al ir y volver.                |
| buscar en las tablas | La tabla va de página a frame; para ir al revés no queda otra que recorrerlas.    |
| código compartido    | Si dos procesos tienen el mismo frame, la DL depende de qué proceso te pregunten. |

### Ejemplo chico

16 bits: 1 de segmento, 3 de página, 12 de offset; memoria de 64 KiB (16 frames). ¿Qué DL corresponde a la DF `B4A0h`?

```traduccion
sentido: busqueda
titulo: De B4A0h a la dirección lógica
bitsSegmento: 1
bitsPagina: 3
bitsOffset: 12
bitsFrame: 4
procesos:
  - pid: PID1
    segmentos:
      - { seg: 0, paginas: { 0: 3, 1: 8 } }
      - { seg: 1, paginas: { 0: 6 } }
  - pid: PID2
    segmentos:
      - { seg: 0, paginas: { 0: 2, 1: 11 } }
direcciones:
  - { df: 0xB4A0 }
```
