---
titulo: Seguir la cadena en la FAT
tema: parcial-2/fat-ufs
orden: 1
reconocer: da la tabla FAT y el primer cluster, y pide los clusters del archivo o dónde está un byte
resumen: Te dan una porción de la FAT; te piden la cadena del archivo, cuántos clusters ocupa o en cuál cae un byte.
trampas:
  - '**Se cuentan los números, no las flechas:** el primer cluster cuenta y EOF no es un cluster.'
  - '**El bloque lógico cuenta desde 0:** el byte N está en el lógico N div tamaño de cluster.'
  - '**Las entradas que no aparecen en la cadena** son de otros archivos: no se suman.'
teoria:
  - entradas-de-directorio
  - la-tabla-fat
---

### Receta

1. **El primer cluster** está en la entrada de directorio del archivo.
2. **Cada entrada de la FAT** guarda el siguiente cluster: FAT[n] = m. Seguí hasta EOF.
3. **Contá los números** de la cadena: esa es la cantidad de clusters.
4. **Un byte N** cae en el cluster lógico N div tamaño de cluster: es el que está en esa posición de la cadena, contando desde 0.

### De dónde sale cada valor

|                      |                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------- |
| primer cluster       | FAT no tiene inodos: el directorio guarda nombre, tamaño, atributos y el primero.      |
| `FAT[n] = siguiente` | Es una lista enlazada con los punteros juntos en una tabla aparte.                     |
| `N div cluster`      | Cada cluster guarda tantos bytes como mide; el cociente dice cuántos llenos hay antes. |

### Ejemplo chico

Clusters de 2 KiB. El archivo empieza en el cluster 7. ¿Dónde está el byte 5000?

```fat
titulo: Seguir la cadena hasta el byte 5000
tabla: { 3: 12, 4: 10, 7: 3, 9: EOF, 10: EOF, 12: 9 }
inicio: 7
bloque: 2048
byte: 5000
```

La cadena es 7 → 3 → 12 → 9: **4 clusters**. Las entradas 4 y 10 son de otro archivo.
