---
titulo: FAT y UFS (ext2)
parcial: 2
orden: 4
resumen: Dos filesystems reales. FAT con su tabla de clusters, entradas de directorio y versiones 12/16/32. UFS/ext2 con grupos de bloques, bitmaps, inodos y punteros indirectos. Tamaños máximos, accesos a disco, hard y soft links.
aliases:
  [
    FAT,
    FAT12,
    FAT16,
    FAT32,
    tabla FAT,
    cluster,
    entrada de directorio,
    UFS,
    ext2,
    ext3,
    ext4,
    inodo,
    i-nodo,
    superbloque,
    grupo de bloques,
    bitmap de bloques,
    bitmap de inodos,
    puntero directo,
    puntero indirecto,
    indirección simple,
    indirección doble,
    indirección triple,
    tamaño máximo de archivo,
    tamaño máximo del filesystem,
    hard link,
    soft link,
    symbolic link,
    contador de hard links,
  ]
---

El tema [Filesystem](/teoria/parcial-2/filesystem/) presentó las piezas genéricas: FCB, métodos de asignación, espacio libre. Acá se ven dos filesystems concretos que las combinan de formas opuestas. **FAT** es mínimo, con casi ninguna estructura. **UFS** (la familia ext de Linux) es más complejo pero tiene FCB, permisos, bitmaps y links.

Los dos ven el volumen como una secuencia de **bloques** de igual tamaño: la unidad mínima de lectura y escritura. En FAT el bloque se llama **cluster**. Un bloque agrupa varios **sectores** del disco físico.

## FAT (File Allocation Table)

Nació con MS-DOS para diskettes y hoy se usa sobre todo en memorias flash (pendrives, tarjetas). Versiones: FAT12, FAT16, FAT32, VFAT y exFAT.

### Estructura del volumen

| Boot | FAT 1 | FAT 2 … FAT n | Directorio raíz | Clusters de datos |
| ---- | ----- | ------------- | --------------- | ----------------- |

- **Boot (sector de arranque):** datos generales del volumen: tipo de filesystem, tamaño de cluster y dónde está el directorio raíz.
- **FAT 1:** la tabla de asignación. Es la **única estructura administrativa** del filesystem.
- **FAT 2 … n:** copias opcionales de la FAT 1, por tolerancia a fallos. Por defecto hay dos (la original y un backup).
- **Directorio raíz** y después los **clusters** con los datos de archivos y directorios.

### Entradas de directorio

FAT **no tiene FCB**. Los atributos de cada archivo van en su **entrada de directorio**, que es lo más parecido a un FCB que existe en FAT. Cada entrada ocupa 32 bytes y tiene el **tipo**, el **nombre con extensión**, el **primer cluster**, el **tamaño** y las fechas. Todos esos campos son de tamaño fijo menos el nombre.

Un directorio es un archivo cuyos clusters contienen esas entradas. Por ejemplo, el cluster de `/home`:

| Tipo | Nombre + extensión | 1er cluster | Tamaño |
| ---- | ------------------ | ----------- | ------ |
| a    | lala.txt           | 7           | 2000 B |
| a    | tp.c               | 5           | 3000 B |
| d    | utnso              | 3           | 0 B    |

La entrada solo dice dónde **empieza** el archivo. Los demás clusters se sacan de la FAT.

### La tabla FAT

Tiene **una entrada por cluster** del volumen: la entrada `i` habla del cluster `i`. Cada entrada puede valer:

| Valor         | Significado                               |
| ------------- | ----------------------------------------- |
| Un número `j` | El archivo **sigue** en el cluster `j`.   |
| **FIN**       | Es el último cluster del archivo.         |
| **LIBRE**     | El cluster no está asignado.              |
| **ERROR**     | El cluster está dañado y no se debe usar. |

Es **asignación encadenada**, pero con los punteros sacados de los bloques y juntos en una tabla. Para leer un archivo se arranca en el primer cluster de la entrada de directorio y se sigue la cadena en la FAT hasta FIN:

```recorrido cadena-fat

```

Con la tabla del ejemplo: lala.txt es `7 → 6`, tp.c es `5 → 4 → 9` y utnso es solo el `3`. Los tamaños cierran con clusters de 1 KiB: 2000 B ocupan 2 clusters y 3000 B ocupan 3.

### Versiones: bits por entrada

FAT12, FAT16 y FAT32 usan entradas (punteros a cluster) de 12, 16 y 32 bits. **FAT32 usa solo 28 de sus 32 bits** para direccionar: los 4 más significativos quedan reservados.

| Versión | Tamaño de entrada | Bits que direccionan | Clusters direccionables |
| ------- | ----------------- | -------------------- | ----------------------- |
| FAT12   | 12 bits           | 12                   | 2<sup>12</sup>          |
| FAT16   | 16 bits           | 16                   | 2<sup>16</sup>          |
| FAT32   | 32 bits (4 B)     | **28**               | 2<sup>28</sup>          |

### Cuentas en FAT

- **Tamaño máximo teórico del filesystem** = `2^(bits que direccionan) × tamaño de cluster`.
- **Tamaño máximo real del filesystem** = el **menor** entre el teórico y el tamaño del disco (o de la partición).
- **Tamaño que ocupa la FAT** = `cantidad de entradas × tamaño de entrada`. Hay una entrada por cluster, así que como máximo son 2<sup>28</sup> entradas en FAT32. Cada entrada ocupa los 4 bytes completos aunque solo use 28 bits.
- **Tamaño máximo de un archivo:** un archivo podría ocupar todos los clusters, así que en los ejercicios se toma el **tamaño del filesystem**. Pero el campo tamaño de la entrada de directorio mide 4 bytes, así que en la realidad ningún archivo FAT pasa de **4 GiB** (la PPT lo marca como "limitado por la entrada de directorio").

**Ejemplo (PPT): FAT32 con clusters de 2 KiB.**

- Teórico del filesystem: `2^28 × 2^11 B = 2^39 B = 512 GiB`.
- Real con un disco de 500 GiB: 512 GiB > 500 GiB, así que **500 GiB**. Con un disco de 1000 GiB: **512 GiB**, y el resto del disco no se puede direccionar.
- Tamaño de la FAT: `2^28 entradas × 2^2 B = 2^30 B = 1 GiB`, y cada copia ocupa lo mismo.

### Lo que FAT no tiene

- **Espacio libre:** no hay bitmap ni lista de libres. Para encontrar un cluster libre hay que **recorrer la FAT** buscando LIBRE.
- **Protección:** no hay permisos ni propietarios.
- **FCB:** los atributos están en la entrada de directorio.
- **Journaling:** nada que garantice la integridad ante un corte. La tolerancia a fallos se apoya en las **copias de la FAT**: si se pierde la tabla, se pierden todas las cadenas.
- **Links:** si dos entradas de directorio apuntaran al mismo primer cluster, cada una tendría **su propia copia de los atributos** (por ejemplo, el tamaño). Modificar el archivo por una entrada dejaría la otra desactualizada, y eso es inconsistente.

Crear un archivo en FAT es simple: crear la entrada de directorio, buscar un cluster libre para el primero y, si hacen falta más, buscar otros libres y encadenarlos en la FAT.

## UFS (Unix File System) / ext2

Es el filesystem de Linux (ext2, ext3, ext4) y de los sistemas tipo Unix. Tiene todo lo que le falta a FAT: FCB (el **inodo**), bitmaps, permisos, links y journaling.

### Estructura del volumen

Después del bloque de **boot**, el volumen se divide en **grupos de bloques**, todos con la misma estructura:

| Boot | Grupo 0 | Grupo 1 | …   | Grupo n |
| ---- | ------- | ------- | --- | ------- |

Cada grupo tiene:

| Estructura               | Qué guarda                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Superbloque**          | Datos de todo el volumen: total de inodos y de bloques, inodos y bloques libres, tamaño de bloque y de inodo. **Se replica en cada grupo.** |
| **Descriptor de grupos** | Datos de cada grupo: dónde están su bitmap de bloques y su bitmap de inodos, bloques e inodos libres. **Se replica en cada grupo.**         |
| **Bitmap de bloques**    | Un bit por bloque del grupo: cuáles están libres.                                                                                           |
| **Bitmap de inodos**     | Qué inodos del grupo están disponibles.                                                                                                     |
| **Tabla de inodos**      | Los FCB del grupo.                                                                                                                          |
| **Bloques de datos**     | El contenido de los archivos: el equivalente a los clusters de FAT.                                                                         |

Las dos primeras estructuras son iguales en todos los grupos (copias de seguridad, como las copias de la FAT). Las otras cuatro son propias de cada grupo. Los inodos **se crean al formatear**, en una cantidad fija por grupo: por eso la **cantidad máxima de archivos** del volumen está limitada.

### Directorios

Una entrada de directorio de UFS solo tiene el **número de inodo** y el **nombre**: todo lo demás está en el inodo. Ejemplo, `/home`:

| # Inodo | Nombre   |
| ------- | -------- |
| 10      | lala.txt |
| 20      | tp.c     |
| 25      | utnso    |

El número de inodo identifica al archivo: la relación inodo-archivo es uno a uno.

### El inodo

Es el **FCB** de UFS, uno por archivo, de tamaño fijo (128 bytes en las versiones clásicas de ext). Tiene los atributos (id, propietario, grupo, permisos, tamaño, tipo, fechas, **contador de hard links**) y una lista de **punteros** a los bloques del archivo.

Como el inodo es chico, entran pocos punteros. Para archivos grandes se usa un **bloque de datos para guardar punteros**, que se asigna recién cuando hace falta:

| Puntero                   | Apunta a                                     | Bloques de datos que alcanza |
| ------------------------- | -------------------------------------------- | ---------------------------- |
| **Directo (PD)**          | Un bloque de datos.                          | 1                            |
| **Indirecto simple (IS)** | Un bloque de punteros a bloques de datos.    | `n`                          |
| **Indirecto doble (ID)**  | Un bloque de punteros a bloques de punteros. | `n²`                         |
| **Indirecto triple (IT)** | Un nivel más que el doble.                   | `n³`                         |

Donde `n` es la **cantidad de punteros por bloque**:

`punteros por bloque = tamaño de bloque / tamaño de puntero`

Por ejemplo, con bloques de 1 KiB y punteros de 4 bytes, `n = 1024 / 4 = 256`.

La configuración típica es de **15 punteros: 12 PD + 1 IS + 1 ID + 1 IT**. Es la que se usa en los ejercicios cuando el enunciado no dice cómo está armado el inodo. Los ejemplos de la PPT usan un inodo más chico, con 4 PD.

UFS es asignación **indexada**: el índice está en el inodo y crece con los niveles de indirección.

### Cuentas en UFS

- **Tamaño máximo teórico del filesystem** = `2^(bits del puntero) × tamaño de bloque`. Acá no importa cómo está armado el inodo: solo cuántos bloques distintos puede nombrar un puntero.
- **Tamaño máximo teórico de un archivo** = `(PD + n + n² + n³) × tamaño de bloque`: la cantidad de bloques de datos que alcanzan todos los punteros del inodo.
- Los dos **reales** son el menor entre el teórico y el tamaño del disco.

**Ejemplo (PPT): bloques de 1 KiB, punteros de 32 bits (4 B), inodo con 4 PD + IS + ID + IT.**

- Filesystem: `2^32 × 2^10 B = 2^42 B = 4 TiB`. Con un disco de 500 GiB el real es **500 GiB**; con uno de 8 TiB, **4 TiB**.
- Punteros por bloque: `1 KiB / 4 B = 256`.
- Archivo: `(4 + 256 + 256² + 256³) × 1 KiB ≈ 256³ KiB = 2^24 KiB = 16 GiB`. El término del IT domina: los otros suman apenas unos 64 MiB más. Con un disco de 8 GiB el real es **8 GiB**; con uno de 30 GiB, **16 GiB**.

Con la configuración estándar (12 PD) el resultado casi no cambia: ocho bloques directos más son 8 KiB.

### Leer el byte N de un archivo

Para saber qué puntero lleva a un byte, y cuántos accesos a disco cuesta:

1. **Bloque lógico** = `N div tamaño de bloque`, y **desplazamiento** = `N mod tamaño de bloque`. Los bloques se numeran desde 0.
2. Se ubica en qué zona cae el bloque. Con 4 PD y `n = 256`: los PD cubren los bloques 0–3, el IS del 4 al 259, el ID del 260 al 65795 y el IT del 65796 en adelante. Con 12 PD los cortes se corren 8 lugares.
3. Se cuentan los **bloques que hay que leer**: uno por cada nivel de punteros, más el de datos.

| El bloque cae en | Accesos a disco |
| ---------------- | --------------- |
| Un PD            | 1 (datos)       |
| El IS            | 2               |
| El ID            | 3               |
| El IT            | 4               |

Criterio de las resoluciones de parciales: el **inodo no se cuenta**, porque el archivo ya está abierto y su inodo está en memoria. Se cuentan los bloques de punteros y los de datos.

```recorrido byte-inodo

```

Dentro de la zona de un puntero indirecto, la entrada de cada nivel sale de dividir. Para el ID, si `r` es la posición dentro de su zona, la entrada del primer nivel es `r div 256` y la del segundo es `r mod 256`.

### Crear y agrandar un archivo

1. **Localizar** el directorio, recorriendo la ruta.
2. Buscar un **inodo libre** (con el bitmap de inodos), completarlo y agregar la entrada (inodo, nombre) al directorio.
3. Buscar **bloques libres** con el bitmap de bloques, marcarlos y cargar sus punteros en el inodo. Si el archivo es grande, hay que asignar también bloques de punteros.
4. Escribir los datos y actualizar los atributos (tamaño, fechas).

Son muchos más pasos que en FAT: UFS es más complejo y tiene más overhead, a cambio de todo lo que FAT no tiene.

## Links (hard y soft)

Solo existen en UFS. Ejemplo de la PPT: en `/home/utnso`, `tp.c` es el inodo 20, y se quiere un acceso directo `tp_v2.c` en `/usr`.

- **Soft link (symbolic link):** se crea un **archivo nuevo**, con su propio inodo (el 33) de tipo _symbolic link_. Su primer puntero directo lleva a un bloque que guarda la **ruta** del original (`/home/utnso/tp.c`).
- **Hard link:** **no se crea ningún archivo**. Se agrega una entrada de directorio `tp_v2.c` con el **mismo número de inodo** (20).

Con un hard link ya no hay "entrada original": las dos entradas valen lo mismo. Para saber cuándo borrar el inodo, este lleva un **contador de hard links**, que dice **cuántas** entradas lo apuntan (no cuáles). Borrar una entrada baja el contador, y el inodo y sus bloques se liberan solo cuando llega a **0**.

```recorrido hard-soft-link

```

|                               | Soft link                                                | Hard link                                                         |
| ----------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| ¿Crea un archivo?             | Sí: inodo propio y un bloque con la ruta                 | No: solo una entrada de directorio                                |
| Espacio                       | Ocupa más (inodo + bloque)                               | Solo la entrada                                                   |
| Al abrirlo                    | Lee el bloque con la ruta y la resuelve: una lectura más | Va directo al inodo                                               |
| ¿Se sabe cuál es el original? | Sí                                                       | No: todas las entradas son iguales                                |
| Si se borra el original       | El link queda **colgado**: la ruta no lleva a nada       | El archivo sigue mientras el contador sea mayor que 0             |
| Otro volumen                  | **Sí**: la ruta es una referencia de alto nivel          | **No**: los números de inodo son únicos solo dentro de un volumen |
| Directorios                   | Sí                                                       | No, por diseño                                                    |

## FAT vs UFS

|               | FAT                                  | UFS                           |
| ------------- | ------------------------------------ | ----------------------------- |
| Complejidad   | Baja                                 | Alta                          |
| FCB           | No (atributos en la entrada de dir.) | Sí: el inodo                  |
| Espacio libre | No (recorre la FAT)                  | Bitmap de bloques e inodos    |
| Asignación    | Encadenada, con la tabla FAT         | Indexada, con indirecciones   |
| Journaling    | No                                   | Sí                            |
| Links         | No                                   | Hard y soft                   |
| Seguridad     | No                                   | Propietario, grupo y permisos |

## Preguntas de parcial

**1. ¿Cómo sabe FAT qué clusters están libres?**

> No tiene bitmap ni lista de libres: recorre la tabla FAT buscando entradas marcadas LIBRE. UFS, en cambio, tiene un bitmap de bloques en cada grupo.

**2. ¿Por qué FAT guarda varias copias de la tabla?**

> Porque la FAT es la única estructura que dice dónde están los clusters de cada archivo. Si se daña, se pierden todas las cadenas. Las copias permiten recuperarla.

**3. ¿Por qué FAT no puede tener links?**

> Porque los atributos del archivo (tamaño, fechas) están en la entrada de directorio. Dos entradas que apunten al mismo primer cluster tendrían dos copias de esos atributos, y una modificación por una de ellas dejaría la otra inconsistente. UFS los puede tener porque los atributos están en el inodo, que es uno solo.

**4. FAT32 con clusters de 4 KiB en un disco de 2 TiB: ¿cuál es el tamaño máximo real del filesystem?**

> Teórico: `2^28 × 2^12 B = 2^40 B = 1 TiB`. Como 1 TiB es menor que el disco, el real es **1 TiB**: el otro TiB queda sin direccionar.

**5. V o F: con un hard link, si se borra el archivo original, el link deja de funcionar.**

> **Falso.** No hay archivo original: las dos entradas apuntan al mismo inodo. Borrar una baja el contador de hard links y el inodo sigue mientras quede alguna. El que deja de funcionar es el **soft link**, que guarda una ruta que ya no existe.

**6. Bloques de 4 KiB, punteros de 4 B y la configuración estándar del inodo. ¿Cuántos accesos a disco hacen falta para leer el byte 100.000 de un archivo abierto?**

> Bloque lógico `100000 div 4096 = 24`. Hay `4096 / 4 = 1024` punteros por bloque, así que los 12 PD cubren los bloques 0–11 y el IS del 12 al 1035. El 24 cae en el IS: **2 accesos** (bloque de punteros + bloque de datos). El inodo ya está en memoria.

**7. ¿Por qué un hard link no puede apuntar a un archivo de otro volumen?**

> Porque un hard link es solo una entrada con un número de inodo, y los números de inodo son únicos **dentro de un volumen**: en otro volumen ese número es otro archivo. El soft link guarda una ruta, así que puede cruzar volúmenes.

_Fuente: PPT Filesystem: UFS y FAT de la cátedra y Sistemas Operativos for Dummies (págs. 113–121)._
