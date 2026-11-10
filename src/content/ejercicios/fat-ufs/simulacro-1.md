---
titulo: 'Teoría de parciales: FAT y UFS/ext2'
tema: parcial-2/fat-ufs
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S1
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- fat
- ext2
- inodo
preguntas:
- enunciado: '(2R 1C2024, desarrollo 3) ¿Qué tipo de asignación usa **FAT** y qué estructura la sostiene?'
  opciones:
  - texto: 'Contigua: la entrada de directorio guarda el primer cluster y la cantidad de clusters que ocupa el archivo en el disco'
    explicacion: 'Los clusters de un archivo FAT pueden estar en cualquier lado.'
  - texto: 'Enlazada con punteros en una tabla: una entrada por cluster con el siguiente (o libre, dañado, fin)'
    explicacion: Correcta.
  - texto: 'Enlazada pura: cada cluster guarda al final el número del siguiente'
    explicacion: 'Eso es la enlazada pura; FAT saca esos punteros a una tabla.'
  - texto: 'Indexada combinada: cada archivo tiene un FCB con punteros directos e indirectos'
    explicacion: 'Eso es UFS/ext2; FAT no tiene FCB.'
  correcta: 1
  justificacion: |
    FAT usa una asignación **enlazada** donde los enlaces no están en los bloques sino en una **tabla** (la
    FAT, por eso a veces se la llama enlazada-indexada). La tabla tiene **una entrada por cluster**, y cada
    entrada guarda el número del **siguiente cluster** del archivo, o una marca: **libre**, **dañado**
    (error) o **fin de archivo** (EOF). La entrada de directorio del archivo tiene el **primer cluster**;
    desde ahí se recorre la tabla.
- enunciado: '(2P 1C2024 TM, V/F 5b) "En FAT, acceder al último bloque de un archivo es muy costoso porque hay que leer de disco cada bloque anterior". ¿Es verdadero o falso?'
  opciones:
  - texto: 'Verdadero: igual que en la enlazada pura, cada bloque tiene el número del siguiente'
    explicacion: 'En FAT los punteros no están en los bloques de datos.'
  - texto: 'Verdadero: la tabla FAT está en disco y se lee una entrada por cada bloque anterior'
    explicacion: 'La tabla se carga en memoria.'
  - texto: 'Falso: se recorren las entradas previas de la FAT, pero en memoria'
    explicacion: Correcta.
  - texto: 'Falso: la entrada de directorio guarda el último cluster, así que se accede directo'
    explicacion: 'La entrada de directorio solo guarda el primer cluster.'
  correcta: 2
  justificacion: |
    **Falso.** Eso describe la **asignación enlazada pura**, donde el puntero al siguiente está dentro de
    cada bloque. En FAT los punteros están en la **tabla FAT**, que se mantiene **cargada en memoria**: para
    llegar al último bloque se recorren las entradas previas de la tabla, pero en RAM, y después se lee un
    solo bloque de disco.
- enunciado: '(2P 2C2025 TM, single choice 6) ¿Qué ventaja introduce FAT respecto a la asignación enlazada pura?'
  opciones:
  - texto: Reduce fragmentación interna
    explicacion: 'La interna depende del tamaño de cluster, no de dónde están los punteros.'
  - texto: Accesos directos más eficientes
    explicacion: Correcta.
  - texto: Reduce espacio ocupado por punteros
    explicacion: 'Sigue habiendo un puntero por cluster, solo que en la tabla.'
  - texto: Accesos secuenciales más eficientes
    explicacion: 'El acceso secuencial ya era bueno en la enlazada pura.'
  correcta: 1
  justificacion: |
    En la enlazada pura, para llegar al bloque *n* hay que leer de disco los anteriores. En FAT la cadena se
    recorre en la **tabla en memoria** y se lee de disco solo el bloque buscado: el **acceso directo** es
    mucho más eficiente. Los punteros ocupan lo mismo (uno por cluster) y la fragmentación interna no cambia.
- enunciado: '(2P 1C2025 TM, V/F 5a; 2P 1C2026 TM, teoría 1c) En FAT, ¿dónde se guarda la **metadata** de un archivo (tamaño, fechas, atributos)?'
  opciones:
  - texto: 'En su FCB, junto con los punteros a los clusters'
    explicacion: 'FAT no tiene FCB: no hay inodos.'
  - texto: 'En la tabla FAT, en la entrada del primer cluster'
    explicacion: 'Las entradas de la FAT solo guardan el siguiente cluster o una marca.'
  - texto: 'En el primer cluster del archivo, antes de los datos'
    explicacion: 'Los clusters de un archivo tienen solo datos.'
  - texto: 'En su entrada de directorio'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    FAT **no tiene FCB**. La metadata del archivo (nombre, extensión, atributos, fechas, **tamaño** y **primer
    cluster**) va en su **entrada de directorio**. Por eso la afirmación de 2P 1C2025 TM ("en FAT la metadata
    va en el FCB junto con los punteros") es **falsa**.
- enunciado: '(2P 2C2025 TT, single choice 6) En un filesystem de tipo FAT, la **entrada de directorio** de un archivo regular posee:'
  opciones:
  - texto: La dirección del último cluster
    explicacion: 'El último se encuentra recorriendo la tabla hasta EOF.'
  - texto: La dirección del primer cluster
    explicacion: Correcta.
  - texto: La dirección del primer y último cluster
    explicacion: 'Solo guarda el primero.'
  - texto: La cantidad total de clusters
    explicacion: 'Guarda el tamaño en bytes, no la cantidad de clusters.'
  correcta: 1
  justificacion: |
    La entrada de directorio en FAT guarda el **primer cluster** del archivo. El resto de la cadena sale de
    la tabla FAT: cada entrada indica el siguiente cluster, hasta la marca de fin (EOF).
- enunciado: '(2P 1C2024 TM, desarrollo 4) ¿Qué asignación usa **EXT** (UFS) y por qué es flexible ante archivos de distintos tamaños?'
  opciones:
  - texto: 'Contigua, porque los bloques de un archivo se asignan juntos dentro de un grupo de bloques'
    explicacion: 'Los grupos acercan los bloques, pero no los obligan a ser contiguos.'
  - texto: 'Enlazada con tabla, igual que FAT pero con un bitmap de bloques'
    explicacion: 'EXT no encadena bloques: usa punteros en el inodo.'
  - texto: 'Indexada simple: un único bloque índice por archivo'
    explicacion: 'Un solo índice limitaría mucho el tamaño máximo.'
  - texto: 'Indexada combinada: directos para los chicos e indirectos para los grandes'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    EXT usa **asignación indexada combinada** (multinivel): el inodo tiene **punteros directos** y punteros
    **indirectos** simple, doble y triple. Un archivo chico se resuelve con los directos, **sin bloques de
    punteros aparte** (no desperdicia espacio ni accesos); uno grande se alcanza con los indirectos.
- enunciado: '(2P 2C2024 TT, desarrollo 5) ¿Para qué sirve tener punteros de **distinta indirección** en el inodo? ¿Sería mejor tener solo indirectos triples?'
  opciones:
  - texto: 'No: con solo triples todo acceso pasa por 3 bloques de punteros, incluso en archivos chicos'
    explicacion: Correcta.
  - texto: 'Sí: con solo indirectos triples el archivo máximo es más grande y el costo de acceder a un bloque es el mismo'
    explicacion: 'Cada nivel de indirección es un acceso más a disco.'
  - texto: 'Sí: los directos solo sirven para compatibilidad con sistemas viejos'
    explicacion: 'Los directos son lo que hace rápidos a los archivos chicos.'
  - texto: 'Da igual: los bloques de punteros se cachean siempre en memoria'
    explicacion: 'No se puede suponer que estén cacheados; en la cuenta de accesos se leen de disco.'
  correcta: 0
  justificacion: |
    La mezcla sirve para que el inodo sea eficiente con los **dos** extremos: los archivos **chicos** usan
    punteros directos (acceso rápido, sin bloques de punteros) y los **grandes** se alcanzan con los
    indirectos. Con solo triples, todo acceso necesitaría leer 3 bloques de punteros antes del dato, y hasta
    un archivo de un bloque ocuparía 3 bloques de punteros.
- enunciado: '(2P 2C2024 TT, desarrollo 5) En un UFS con bloques de 1 KB se borra un archivo de 2 KB. ¿Se pueden liberar **más de 2 bloques**?'
  opciones:
  - texto: 'No: un archivo de 2 KB con bloques de 1 KB ocupa exactamente 2 bloques de datos'
    explicacion: 'Si algún dato está en un nivel indirecto, también ocupa bloques de punteros.'
  - texto: 'No: el inodo se libera, pero el inodo no es un bloque'
    explicacion: 'El inodo no cuenta, pero sí los bloques de punteros.'
  - texto: 'Sí: también se liberan los bloques de punteros que usaba'
    explicacion: Correcta.
  - texto: 'Sí: siempre se libera además el bloque del directorio'
    explicacion: 'Se borra una entrada del directorio, no el bloque del directorio.'
  correcta: 2
  justificacion: |
    **Sí.** Además de los 2 bloques de datos, se liberan los **bloques de punteros** que usaba el archivo. Por
    ejemplo, con un inodo sin suficientes directos (o un archivo con "huecos" escrito en posiciones altas),
    algún dato queda detrás de un indirecto simple y ese bloque de punteros también se libera.
- enunciado: '(2P 2C2025 TM, single choice 7) En EXT2, la **metadata** de cada archivo se almacena en:'
  opciones:
  - texto: La tabla FAT
    explicacion: 'EXT2 no tiene tabla FAT.'
  - texto: Su entrada de directorio
    explicacion: 'En EXT2 la entrada solo tiene nombre y número de inodo.'
  - texto: Su inodo
    explicacion: Correcta.
  - texto: El super bloque
    explicacion: 'El superbloque describe al filesystem, no a cada archivo.'
  correcta: 2
  justificacion: |
    En EXT2 cada archivo tiene un **inodo** (su FCB) con toda la metadata: tipo, dueño, grupo, permisos,
    tamaño, fechas, contador de hard links y los punteros a los bloques. La entrada de directorio solo asocia
    un **nombre** con un **número de inodo**.
- enunciado: '(2P 2C2025 TT, single choice 7) En un filesystem de tipo EXT, la **entrada de directorio** de un archivo posee:'
  opciones:
  - texto: El número de inodo
    explicacion: Correcta.
  - texto: El dueño del archivo
    explicacion: 'Está en el inodo.'
  - texto: Los permisos del archivo
    explicacion: 'Están en el inodo.'
  - texto: El tamaño total del archivo
    explicacion: 'Está en el inodo.'
  correcta: 0
  justificacion: |
    La entrada de directorio de EXT es solo **nombre → número de inodo**. Dueño, permisos y tamaño están en
    el inodo; por eso varias entradas (hard links) pueden apuntar al mismo archivo y compartir todos sus
    atributos.
- enunciado: '(2P 1C2024 TT, desarrollo 4) ¿Cuál de estos datos **no** está en el inodo de un archivo en Unix?'
  opciones:
  - texto: El contador de hard links
    explicacion: 'Está en el inodo: cuenta cuántas entradas apuntan a él.'
  - texto: El nombre del archivo
    explicacion: Correcta.
  - texto: Los timestamps (creación, modificación, acceso)
    explicacion: 'Están en el inodo.'
  - texto: Los punteros a los bloques
    explicacion: 'Están en el inodo.'
  correcta: 1
  justificacion: |
    El inodo guarda: propietario, grupo, permisos, tipo, **timestamps**, **contador de hard links**, tamaño
    y **punteros** a los bloques. El **nombre** está en la entrada de directorio: un mismo inodo puede tener
    varios nombres (un hard link por cada uno).
- enunciado: '(2R 2C2025, single choice 6) En un filesystem de tipo EXT, el **inodo** de un archivo regular posee:'
  opciones:
  - texto: El nombre del archivo
    explicacion: 'El nombre está en la entrada de directorio.'
  - texto: La lista de inodos "hard-link" asociados
    explicacion: 'Los hard links comparten el mismo inodo: solo hay un contador.'
  - texto: El contenido de los primeros 12 bloques
    explicacion: 'Tiene punteros a los bloques, no su contenido.'
  - texto: Ninguna es correcta
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Ninguna aplica: el **nombre** está en la entrada de directorio; los hard links no son otros inodos sino
    otras entradas que apuntan **al mismo** inodo (el inodo solo tiene el **contador**); y lo que hay son
    **punteros** a los bloques, no su contenido.
- enunciado: '(2R 2C2025, single choice 7) En un filesystem de tipo EXT, el **bitmap de inodos** tiene tantos elementos como:'
  opciones:
  - texto: La cantidad máxima de archivos que se podrían crear
    explicacion: Correcta.
  - texto: La cantidad actual de archivos en uso
    explicacion: 'Tiene un bit por inodo, esté usado o libre.'
  - texto: La cantidad de bloques de datos total del sistema
    explicacion: 'Eso es el bitmap de bloques.'
  - texto: El tamaño total del archivo
    explicacion: 'El bitmap es del filesystem, no de un archivo.'
  correcta: 0
  justificacion: |
    Los inodos se crean al **formatear**, en una cantidad fija, y el bitmap de inodos tiene **un bit por
    inodo**. Como cada archivo necesita un inodo, esa cantidad es el **máximo de archivos** que se pueden
    crear en el filesystem.
- enunciado: '(2R 1C2025, desarrollo 2) En ext2, ¿podría el SO **reconstruir el bitmap de bloques** si se corrompiera?'
  opciones:
  - texto: 'No: el bitmap es la única estructura que sabe qué bloques están ocupados'
    explicacion: 'Los inodos también lo saben: tienen los punteros.'
  - texto: 'Sí: recorriendo los inodos ocupados y marcando en un bitmap nuevo cada bloque que usan'
    explicacion: Correcta.
  - texto: 'Sí, leyendo cada bloque del disco: los que tienen datos distintos de cero están ocupados'
    explicacion: 'Un bloque libre puede tener datos viejos, y uno ocupado puede tener ceros.'
  - texto: 'Solo si existe la copia de respaldo, como pasa con la tabla FAT'
    explicacion: 'No hace falta copia: la información está en los inodos.'
  correcta: 1
  justificacion: |
    **Sí.** Los bloques en uso son exactamente los que referencian los inodos ocupados. Se recorren todos los
    inodos en uso (según el bitmap de inodos), se siguen sus punteros directos e indirectos y se marca en un
    **bitmap nuevo, inicializado en 0**, cada bloque encontrado: los de datos y también los **bloques de
    punteros**.
---

Este simulacro reúne preguntas de **teoría** de los segundos parciales (2024 a 2026) sobre **FAT y
UFS/ext2**: la tabla FAT, entradas de directorio, el inodo y sus punteros, y los bitmaps. Cada pregunta
indica entre paréntesis de qué examen e ítem sale. Las preguntas de links están en el simulacro 2.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación
de cada una resume la resolución oficial de la cátedra.
