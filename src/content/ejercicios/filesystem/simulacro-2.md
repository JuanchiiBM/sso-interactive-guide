---
titulo: 'Teoría de parciales: Filesystem (asignación, espacio libre y operaciones)'
tema: parcial-2/filesystem
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S2
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- asignacion
- fragmentacion
- espacio-libre
- archivos-mapeados
preguntas:
- enunciado: '(2P 1C2024 TT, desarrollo 5) ¿Qué información hace falta, como mínimo, para acceder a un archivo con asignación **contigua** y con asignación **indexada**?'
  opciones:
  - texto: 'Contigua: primer bloque y tamaño. Indexada: el bloque índice (y el tamaño)'
    explicacion: Correcta.
  - texto: 'Contigua: la lista de todos los bloques. Indexada: el primer bloque y un puntero al siguiente en cada bloque'
    explicacion: 'La contigua no necesita lista: los bloques son consecutivos. Lo otro es la enlazada.'
  - texto: 'Contigua: primer y último bloque de cada fragmento. Indexada: solo el tamaño'
    explicacion: 'En contigua hay un único fragmento; la indexada necesita el índice.'
  - texto: 'Las dos solo necesitan el primer bloque'
    explicacion: 'La indexada necesita el bloque índice, que no es el primer bloque de datos.'
  correcta: 0
  justificacion: |
    - **Contigua**: los bloques son consecutivos, así que alcanza con el **primer bloque** y el **tamaño**
      (cantidad de bloques); el bloque *i* es `primero + i`.
    - **Indexada**: el FCB apunta a un **bloque índice** con la lista de punteros a los bloques del archivo;
      con eso (y el tamaño) se llega a cualquier bloque.
- enunciado: '(2P 2C2024 TM, V/F 5b; 2P 1C2024 TT, desarrollo 5) "La asignación contigua tiene fragmentación externa pero no interna". ¿Es correcto?'
  opciones:
  - texto: 'Sí: como cada archivo ocupa exactamente los bloques que necesita, no desperdicia nada dentro'
    explicacion: 'El último bloque casi nunca se llena entero.'
  - texto: 'No: tiene interna pero no externa, porque los bloques son de tamaño fijo'
    explicacion: 'Los huecos entre archivos son fragmentación externa.'
  - texto: 'No: no tiene ninguna de las dos si se compacta seguido'
    explicacion: 'Compactar resuelve la externa, pero la interna del último bloque sigue.'
  - texto: 'No: tiene las dos, interna en el último bloque y externa entre archivos'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Falso.** La fragmentación **interna** depende del tamaño de bloque, no del método: el último bloque de
    un archivo queda en parte vacío en cualquier asignación. La **externa** es propia de la contigua: al
    borrar archivos quedan huecos de bloques libres que, sumados, alcanzarían para un archivo, pero no son
    contiguos.
- enunciado: '(2P 1C2024 TT, desarrollo 5) ¿Qué limita la **creación y el crecimiento** de un archivo con asignación contigua y con indexada?'
  opciones:
  - texto: 'Contigua: bloques libres consecutivos al crear y detrás del archivo para crecer. Indexada: bloques libres y lugar en el índice'
    explicacion: Correcta.
  - texto: 'Las dos solo necesitan que haya bloques libres en el disco'
    explicacion: 'La contigua necesita que además sean consecutivos.'
  - texto: 'Contigua: una vez creado, el archivo no puede crecer nunca. Indexada: puede crecer sin límite mientras haya bloques libres en el disco'
    explicacion: 'La contigua crece si hay espacio libre detrás; la indexada la limita el índice.'
  - texto: 'Indexada: necesita bloques libres contiguos al índice para crecer'
    explicacion: 'Los bloques de una indexada pueden estar en cualquier lado.'
  correcta: 0
  justificacion: |
    - **Contigua**: para crear un archivo hacen falta **N bloques libres consecutivos**, y para que crezca,
      bloques libres **justo detrás** de su último bloque (si no, hay que moverlo o compactar).
    - **Indexada**: cualquier bloque libre sirve; el límite es el **bloque índice**, que tiene una cantidad
      fija de entradas.
- enunciado: '(2R 2C2024, desarrollo 1) Entre contigua, enlazada e indexada, ¿cuál es la **más flexible** para que un archivo crezca y qué tipo de acceso favorece?'
  opciones:
  - texto: 'La contigua, porque el archivo crece hacia el bloque siguiente; favorece el acceso directo'
    explicacion: 'Crece solo si el bloque siguiente está libre: es la menos flexible.'
  - texto: 'La indexada, porque no tiene límite de tamaño; favorece el acceso secuencial'
    explicacion: 'El índice limita el tamaño, y favorece el acceso directo.'
  - texto: 'La enlazada: cualquier bloque libre se encadena al final, pero el acceso es secuencial'
    explicacion: Correcta.
  - texto: 'Las tres son igual de flexibles; solo cambia la fragmentación'
    explicacion: 'Difieren en crecimiento y en acceso.'
  correcta: 2
  justificacion: |
    | | Fragmentación | Crecimiento | Acceso directo |
    | --- | --- | --- | --- |
    | **Contigua** | interna (último bloque) y externa | poco flexible | inmediato: `primero + i` |
    | **Enlazada** | interna en el último bloque | **la más flexible** | **secuencial**: hay que recorrer la cadena |
    | **Indexada** | interna en el índice y en el último bloque | flexible, el índice limita el tamaño | índice + bloque |
- enunciado: '(2P 1C2025 TT, desarrollo 5) ¿Qué métodos de asignación son más adecuados para el **acceso directo** a un bloque específico de un archivo?'
  opciones:
  - texto: 'Solo la enlazada, porque cada bloque sabe cuál es el siguiente'
    explicacion: 'Para llegar al bloque i hay que leer los i anteriores.'
  - texto: 'La contigua y la indexada'
    explicacion: Correcta.
  - texto: 'Solo la indexada: la contigua necesita leer los bloques anteriores'
    explicacion: 'En contigua el bloque i se calcula sin leer nada.'
  - texto: 'Las tres por igual, porque el FCB tiene el primer bloque'
    explicacion: 'Con solo el primer bloque, la enlazada tiene que recorrer la cadena.'
  correcta: 1
  justificacion: |
    - **Contigua**: conociendo el primer bloque, el bloque buscado se **calcula** (`primero + i`), sin leer
      los anteriores.
    - **Indexada**: la tabla índice tiene un puntero por bloque, así que se va **directo** al que se busca.

    En la **enlazada** hay que leer cada bloque anterior para conocer el siguiente: el acceso es secuencial.
- enunciado: '(2P 2C2025 TM, single choice 5) ¿Cuál de los siguientes esquemas de asignación de bloques sufre **fragmentación interna**?'
  opciones:
  - texto: Indexada simple
    explicacion: 'Sí la sufre, pero no es la única.'
  - texto: Indexada multinivel
    explicacion: 'Sí la sufre, pero no es la única.'
  - texto: Contigua
    explicacion: 'Sí la sufre, pero no es la única.'
  - texto: Todas las anteriores
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    La fragmentación interna aparece porque el **último bloque** de un archivo casi nunca se llena entero, y
    eso pasa con **cualquier** método de asignación por bloques: depende del tamaño de bloque y del archivo,
    no de cómo se encadenan los bloques. En la indexada se suma el espacio sin usar del bloque índice.
- enunciado: '(2P 1C2026 TT, teoría 2a; 2P 1C2025 TT, desarrollo 5) ¿Cuál de las estrategias de asignación de bloques puede sufrir **fragmentación externa**?'
  opciones:
  - texto: Enlazada
    explicacion: 'Cualquier bloque libre sirve: no quedan huecos inútiles.'
  - texto: Indexada
    explicacion: 'Cualquier bloque libre sirve: no quedan huecos inútiles.'
  - texto: Contigua
    explicacion: Correcta.
  - texto: Las tres
    explicacion: 'Solo la que exige bloques consecutivos.'
  correcta: 2
  justificacion: |
    Solo la **contigua**: exige que todos los bloques de un archivo sean consecutivos, así que puede haber
    bloques libres suficientes en total pero repartidos en huecos donde el archivo no entra. Enlazada e
    indexada usan cualquier bloque libre.
- enunciado: '(2P 1C2026 TM, teoría 1d) Mencione un esquema de asignación de **memoria** y uno de asignación de **bloques** en los que la **compactación** sea indispensable para aprovechar el espacio.'
  opciones:
  - texto: 'Paginación en memoria y asignación indexada de bloques'
    explicacion: 'Ninguno de los dos tiene fragmentación externa: no necesitan compactar.'
  - texto: 'Particiones fijas y asignación enlazada'
    explicacion: 'Particiones fijas y enlazada no sufren fragmentación externa.'
  - texto: 'Segmentación paginada en memoria y asignación FAT en el disco'
    explicacion: 'Las dos trabajan con unidades de tamaño fijo y cualquier frame o cluster libre sirve.'
  - texto: 'Segmentación (o part. dinámicas) y asignación contigua'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    La compactación es la solución a la **fragmentación externa**: juntar los huecos libres en uno solo. La
    sufren los esquemas que piden espacio **contiguo de tamaño variable**:

    - En memoria: **segmentación pura** o **particiones dinámicas**.
    - En disco: la **asignación contigua** de bloques.
- enunciado: '(2R 1C2026, single choice 2.i) ¿Cuál es el mayor problema que suele tener la **asignación enlazada pura** con archivos grandes?'
  opciones:
  - texto: Fragmentación interna
    explicacion: 'Es la misma que en cualquier método: no empeora con archivos grandes.'
  - texto: Accesos directos muy lentos
    explicacion: Correcta.
  - texto: Fragmentación externa
    explicacion: 'La enlazada usa cualquier bloque libre: no tiene externa.'
  - texto: Estructuras administrativas muy grandes
    explicacion: 'Solo agrega un puntero por bloque, dentro del mismo bloque.'
  correcta: 1
  justificacion: |
    En la enlazada pura el puntero al siguiente bloque está **dentro de cada bloque de datos**. Para llegar
    al bloque *n* hay que **leer de disco los n−1 anteriores**: en un archivo grande, acceder al final o a una
    posición intermedia es muy lento. FAT resuelve esto sacando los punteros a una tabla en memoria.
- enunciado: '(2R 1C2024, desarrollo 5) De las estrategias para administrar los **bloques libres** (lista enlazada, tabla/lista indexada, bitmap), ¿cuál optimiza el **espacio** ocupado?'
  opciones:
  - texto: 'La lista enlazada, porque los punteros van dentro de los propios bloques libres'
    explicacion: 'Usa los bloques libres, pero recorrerla es lento y necesita un puntero por bloque.'
  - texto: 'La tabla indexada, porque guarda solo los bloques libres'
    explicacion: 'Guarda un número de bloque entero (32 o 64 bits) por cada libre.'
  - texto: 'El bitmap: un solo bit por bloque del disco'
    explicacion: Correcta.
  - texto: 'Ocupan lo mismo: un dato por bloque'
    explicacion: 'Un bit no es lo mismo que un puntero de 32 bits.'
  correcta: 2
  justificacion: |
    Las estrategias son **lista enlazada** de bloques libres, **tabla/lista indexada** (con los números de los
    bloques libres) y **bitmap**. La que menos espacio ocupa es el **bitmap**: **1 bit por bloque** (libre u
    ocupado), contra un puntero entero por bloque libre en las otras.
- enunciado: '(2P 1C2024 TT, desarrollo 3) Para **mover** un archivo a otro directorio del **mismo** filesystem alcanza con abrir, renombrar/mover y cerrar. ¿Qué hace falta si el destino está en **otro** filesystem?'
  opciones:
  - texto: 'Lo mismo: renombrar cambia la ruta y el SO actualiza la entrada en el otro filesystem'
    explicacion: 'Renombrar solo cambia entradas de directorio del mismo filesystem.'
  - texto: 'Abrir origen, crear y abrir destino, copiar leyendo y escribiendo, cerrar ambos y borrar el origen'
    explicacion: Correcta.
  - texto: 'Crear un hard link en el destino y borrar el original'
    explicacion: 'No se pueden crear hard links entre filesystems.'
  - texto: 'Copiar el FCB del origen al filesystem destino; los bloques de datos quedan compartidos entre los dos filesystems'
    explicacion: 'Cada filesystem tiene sus propios bloques: hay que copiar los datos.'
  correcta: 1
  justificacion: |
    Dentro del mismo filesystem, mover es **renombrar**: cambia la entrada de directorio y los datos no se
    tocan. Entre filesystems no hay forma de compartir bloques ni FCB, así que mover es **copiar y borrar**:

    1. Abrir el archivo origen.
    2. Crear y abrir el archivo destino.
    3. Leer el origen.
    4. Agrandar (truncar) el destino y escribir los datos.
    5. Cerrar el origen y el destino.
    6. **Eliminar** el origen.
- enunciado: '(2R 2C2025, desarrollo 2) Un proceso abre un archivo y escribe **un byte al final**; el tamaño del archivo es idéntico al espacio que ocupa en disco. ¿Qué tiene que pasar, además de abrirlo?'
  opciones:
  - texto: 'Se escribe en el último bloque del archivo, que tiene lugar para un byte más'
    explicacion: 'Tamaño = espacio ocupado: el último bloque está lleno.'
  - texto: 'El SO busca un bloque libre, lo asigna (espacio libre y FCB) y escribe ahí el byte'
    explicacion: Correcta.
  - texto: 'El SO compacta el disco para que haya un bloque libre contiguo al archivo'
    explicacion: 'Solo haría falta en asignación contigua; en general alcanza con cualquier bloque libre.'
  - texto: 'La escritura falla: un archivo no puede crecer más allá del espacio que se le asignó al crearlo'
    explicacion: 'Los archivos crecen asignando bloques nuevos.'
  correcta: 1
  justificacion: |
    Pasos (lista no exhaustiva):

    1. Syscall `open`: el SO valida que el archivo exista y los permisos para escribir.
    2. Se crean las entradas en la tabla de archivos abiertos del proceso y en la global.
    3. Syscall `write` al final: como el archivo ocupa exactamente sus bloques, el **último está lleno**.
    4. El SO **busca un bloque libre** y lo **asigna** al archivo: actualiza la estructura de espacio libre
       (p. ej. el bitmap) y el **FCB** (nuevo puntero, tamaño).
    5. Se escribe el byte en el bloque nuevo.
- enunciado: '(2R 2C2025, V/F 3a) "La estrategia de **mapear archivos a memoria** es más eficiente si el tamaño de bloque es igual al tamaño de página". ¿Es verdadero o falso?'
  opciones:
  - texto: 'Verdadero: la MV trata los bloques del archivo como páginas'
    explicacion: Correcta.
  - texto: 'Falso: el mapeo copia el archivo entero a memoria al abrirlo, el tamaño de bloque no influye'
    explicacion: 'El mapeo carga las páginas bajo demanda, no todo de una vez.'
  - texto: 'Falso: conviene que el bloque sea mucho más grande que la página para leer menos veces'
    explicacion: 'Si no coinciden, cada page fault lee bloques de más o de menos.'
  - texto: 'Verdadero, pero solo si el archivo entra entero en un frame'
    explicacion: 'La ventaja vale para archivos de cualquier tamaño.'
  correcta: 0
  justificacion: |
    **Verdadero.** Con un archivo mapeado, traer y bajar partes del archivo a RAM lo hace el **mecanismo de
    memoria virtual**: un page fault trae una página. Si bloque y página tienen el mismo tamaño, cada page
    fault es exactamente una lectura de un bloque (y cada página sucia, una escritura).
- enunciado: '(2P 1C2026 TT, desarrollo 5a) Con **archivos mapeados a memoria**, ¿cuál pseudocódigo escribe el byte 1000 de `a.txt`?'
  opciones:
  - texto: '`fd = open("a.txt"); seek(fd, 1000); write(fd, 543)`'
    explicacion: 'Escribe el byte, pero con syscalls de E/S clásicas: no usa el mapeo.'
  - texto: '`p = mmap("a.txt"); write(p, 1000)`'
    explicacion: 'Con el archivo mapeado no hace falta `write`: se escribe en memoria.'
  - texto: '`p = mmap("a.txt"); p[1000] = 543`'
    explicacion: Correcta.
  - texto: '`p = malloc(1000); read("a.txt", p); p[999] = 543`'
    explicacion: 'Copia el archivo a un buffer propio: los cambios no llegan al archivo.'
  correcta: 2
  justificacion: |
    La estrategia usa la **paginación con memoria virtual** para operar sobre archivos: una syscall (`mmap`)
    devuelve un puntero al primer byte del archivo y el proceso trabaja como si todo el contenido estuviera en
    memoria. El SO divide el archivo en páginas y las carga **bajo demanda**, igual que las de código o datos.

    ```c
    void *p = mmap("a.txt");  // puntero al primer byte del archivo
    p[1000] = 543;            // escribe en la posición 1000 del archivo
    ```
- enunciado: '(2P 1C2026 TM, desarrollo 5) Disco de 1 TiB con unos pocos archivos grandes (90 a 100 GiB) que ya existen; de ahora en más solo se crean archivos de 1 a 2 KiB. Se leen seguido varios archivos chicos completos y pequeñas secciones de algún archivo grande. ¿Cuál de estas propuestas es adecuada?'
  opciones:
  - texto: 'Asignación enlazada pura con bloques de 2 KiB: no hay fragmentación externa y los archivos chicos entran en un bloque'
    explicacion: 'Leer una sección de un archivo de 100 GiB obliga a recorrer millones de bloques.'
  - texto: 'Asignación indexada simple (un bloque índice) con bloques de 2 KiB'
    explicacion: 'Un solo bloque índice de 2 KiB no direcciona archivos de 100 GiB.'
  - texto: 'Contigua con bloques de 2 KiB: acceso directo a los grandes y poca frag. interna en los chicos'
    explicacion: Correcta.
  - texto: 'FAT32 con clusters de 64 KiB para direccionar los archivos grandes con pocos clusters'
    explicacion: 'Cada archivo de 1–2 KiB desperdiciaría más de 60 KiB.'
  correcta: 2
  justificacion: |
    Hay varias opciones válidas; la oficial propone dos:

    - **Contigua con bloques de 2 KiB**: el acceso directo a una sección de un archivo grande se calcula
      (`primero + i`) y los chicos casi no desperdician. Su desventaja, la fragmentación externa, acá casi
      no pega: los archivos nuevos ocupan **un solo bloque** y los grandes ya existen.
    - **Indexación mixta tipo ext2** (1 o 2 directos + 1 indirecto triple, bloques de 2 KiB, punteros de 32
      bits): acceso directo a los chicos sin bloques de punteros y alcance para los grandes, a costa de
      algunas indirecciones y espacio en bloques de punteros.

    Se descartan la **enlazada pura** (muy lenta para leer una sección de un archivo grande) y la **indexada
    pura** (o mucha fragmentación interna, o un índice que no alcanza para los grandes).
---

Este simulacro reúne preguntas de **teoría** de los segundos parciales (2024 a 2026) sobre **filesystem**:
métodos de asignación, fragmentación, espacio libre, operaciones y archivos mapeados a memoria. Cada pregunta
indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación
de cada una resume la resolución oficial de la cátedra.
