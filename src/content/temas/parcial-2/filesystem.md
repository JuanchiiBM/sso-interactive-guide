---
titulo: Filesystem
parcial: 2
orden: 3
resumen: Archivos y atributos, operaciones, tablas de archivos abiertos, locks, directorios, protección, particiones y volúmenes, FCB, métodos de asignación, espacio libre y recuperación.
aliases:
  [
    filesystem,
    file system,
    sistema de archivos,
    archivo,
    atributos,
    FCB,
    bloque de control de archivo,
    tabla de archivos abiertos,
    locks,
    cerrojos,
    directorio,
    ruta absoluta,
    ruta relativa,
    working directory,
    punto de montaje,
    montaje,
    protección,
    permisos,
    rwx,
    chmod,
    ACL,
    matriz de acceso,
    partición,
    volumen,
    formatear,
    asignación contigua,
    asignación encadenada,
    asignación indexada,
    bitmap,
    espacio libre,
    journaling,
    hard link,
    soft link,
  ]
---

Hasta acá el disco apareció como el lugar del área de swap. Pero su uso principal es otro: guardar **archivos** que sobreviven al apagado y que comparten muchos usuarios. El **filesystem** es el conjunto de estructuras y de funciones (syscalls) que permiten crear, leer, modificar y borrar esos archivos.

## Objetivos de un filesystem

- **Almacenar datos** y operar con ellos.
- Dar soporte a **varios usuarios**, lo que obliga a tener **protección**.
- **Minimizar la pérdida** de datos y **garantizar la integridad** (coherencia) de lo guardado.
- **Maximizar el desempeño**: para el SO, administrar bien el espacio del disco; para el usuario, buen tiempo de respuesta.
- Soportar **distintos tipos de dispositivos**.

## Archivos

Un **archivo** es un conjunto de datos relacionados, identificados por un nombre y normalmente guardados en almacenamiento secundario (no volátil). Tiene dos tipos de información: los **datos** que lo forman y sus **atributos** (la metadata).

### Atributos

| Atributo      | Qué guarda                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| Nombre        | Incluye la extensión.                                                                                      |
| Identificador | Un número que lo distingue dentro del filesystem.                                                          |
| Tipo          | Regular, directorio, link, etc. **No es la extensión**: renombrar `tux.png` a `tux.txt` no cambia su tipo. |
| Ubicación     | Dónde y cómo está guardado **en el disco** (sus bloques), no la ruta.                                      |
| Tamaño        | Cuánto ocupa.                                                                                              |
| Permisos      | Quién puede hacer qué con él.                                                                              |
| Fechas        | Creación, última modificación, último acceso.                                                              |
| Propietario   | El usuario que lo creó.                                                                                    |

### Tipos de archivo

- **Los que distingue el SO:** regulares (un ejecutable es un regular con "algo extra"), directorios, links, dispositivos de caracteres y de bloques, semáforos, sockets, archivos del sistema y temporales.
- **Los que distinguen las aplicaciones:** el SO los ve como regulares, pero hace falta un programa para operarlos (un `.docx`, un `.png`).

### Operaciones

| Básicas                                                                              | Combinadas                        |
| ------------------------------------------------------------------------------------ | --------------------------------- |
| Crear, abrir, leer, escribir, reposicionar, truncar, renombrar/mover, borrar, cerrar | Copiar, renombrar/mover a otro FS |

- **Reposicionar** mueve el puntero de lectura/escritura (`fseek`) sin leer nada.
- **Truncar** cambia el tamaño del archivo (lo achica o lo agranda).
- **Renombrar/mover** dentro del mismo filesystem es **básica**: solo cambia la entrada de directorio y los datos no se tocan, por eso mover es mucho más rápido que copiar. Si el destino es **otro** filesystem es **combinada**: hay que copiar los datos y borrar el original.
- **Copiar** es abrir el original, leerlo, crear el nuevo, escribirlo y cerrar los dos.
- **Crear y borrar** son las únicas que no necesitan abrir el archivo antes.

### Apertura y modos de apertura

Abrir un archivo deja sus atributos en memoria, porque se van a consultar en cada operación. En la apertura se indica el **modo** (lectura, escritura, ejecución, agregar al final…) y el SO verifica que el proceso tenga los permisos para ese modo.

Con los archivos abiertos se arman **dos tablas en memoria**:

| Tabla                                | Una por… | Qué tiene                                                                                         |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------- |
| **Global** de archivos abiertos      | sistema  | Nombre, volumen, tamaño, permisos, **contador de aperturas**, locks. Lo que comparten todos.      |
| De archivos abiertos **por proceso** | proceso  | Modo de apertura, **puntero** de lectura/escritura, y un puntero a la entrada de la tabla global. |

```recorrido archivos-abiertos

```

Si dos procesos abren el mismo archivo, hay **una** entrada en la global (con contador 2) y **una en cada** tabla por proceso: cada uno lee por su lado, con su propio puntero. Al cerrar, se borra la entrada del proceso y baja el contador; cuando llega a 0, se libera la global.

### Locks (cerrojos)

Son a los archivos lo que los semáforos a los procesos, con una diferencia: un lock puede tomar **una porción** del archivo (de un byte a otro), así que dos procesos pueden trabajar a la vez en zonas distintas.

| Clasificación       | Tipo            | Qué significa                                                                                                                |
| ------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Por alcance         | **Exclusivo**   | Un solo proceso a la vez, como un mutex.                                                                                     |
|                     | **Compartido**  | Varios a la vez, para leer.                                                                                                  |
| Por quién lo impone | **Obligatorio** | Lo fuerza el SO.                                                                                                             |
|                     | **Sugerido**    | El SO no garantiza nada: cada proceso tiene que pedirlo. Ventaja: **menos overhead**, porque el SO no valida en cada acceso. |

### Métodos de acceso

- **Secuencial:** se lee o escribe desde donde quedó el puntero, y el SO lo avanza solo.
- **Directo:** se indica desde dónde se accede. Con registros de tamaño fijo, el registro `k` está en `k × tamaño de registro`, sin leer los anteriores.

## Directorios

Un **directorio** es un archivo de tipo directorio: sus entradas están indexadas por el **nombre** de cada archivo que "contiene". Sus operaciones son buscar un archivo, crear, borrar, renombrar, listar el directorio y recorrer el filesystem.

- **Ruta absoluta:** el nombre completo desde la raíz (`/` en Linux, `C:\` en Windows). No puede haber dos archivos con la misma ruta absoluta.
- **Ruta relativa:** se arma desde el **directorio de trabajo** (_working directory_), que se cambia con `cd`.
- Los primeros sistemas eran árboles estrictos. Hoy se usan **grafos** que permiten que un archivo aparezca en más de un directorio mediante **links** (ver [FAT y UFS](/teoria/parcial-2/fat-ufs/#links-hard-y-soft)).

### Implementación de directorios

Es cómo se guardan las entradas adentro del archivo directorio, para encontrar rápido un nombre:

| Estructura     | Idea                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| Lista lineal   | Una entrada abajo de la otra. Buscar es recorrer.                           |
| Lista ordenada | Ordenadas por algún criterio (el nombre).                                   |
| Árbol          | Búsqueda más rápida que recorrer una lista.                                 |
| Tabla de hash  | Se va directo a la entrada por el hash del nombre, como la tabla invertida. |

### Montaje

El **punto de montaje** es el lugar de la estructura de directorios donde se hace accesible otro filesystem (un pendrive, otra partición). En Linux es un directorio cualquiera (`/media/usb`); en Windows suele ser una letra de unidad (`E:`), aunque también puede ser una carpeta. Los montajes activos se registran en la **tabla de montaje**, en memoria.

## Protección

| Nivel                  | Qué permite                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| **Acceso total**       | Sin protección: todos acceden a todo. Servía cuando había un solo usuario. |
| **Acceso restringido** | Cada archivo tiene dueño y solo él accede; no puede darle acceso a otros.  |
| **Acceso controlado**  | Además del dueño, hay **permisos** asignables a otros usuarios.            |

Los permisos son tres: lectura (**r**), escritura (**w**) y ejecución (**x**).

### Formas de guardar los permisos

- **Tipo UNIX:** cada archivo tiene un **propietario** y un **grupo**, y tres ternas `rwx`: para el propietario, para el grupo y para el resto. Ocupa **9 bits**. Limitación: no se pueden dar permisos distintos a distintos grupos.
- **Matriz de acceso:** una única matriz para todo el sistema, archivos × usuarios, con los permisos en cada celda. Es enorme, casi toda vacía, y cada usuario o archivo nuevo agrega una fila o columna.
- **Lista de control de acceso (ACL):** cada archivo tiene una lista de los usuarios y grupos con permisos sobre él y de qué tipo.
- **Contraseñas por archivo:** casi no se usan; hoy se autentica al usuario y eso habilita todos sus archivos.

Ejemplo de permisos UNIX: `-rw-rw---- dan utnso notas.txt` da lectura y escritura a `dan` (el dueño) y al grupo `utnso`, y nada al resto. Cada terna es un número octal: `chmod 660 notas.txt` deja esos mismos permisos (`110 110 000`), y `chmod 777` da todo a todos.

## Disco lógico: particiones y volúmenes

El filesystem divide el espacio en **bloques** de tamaño fijo, todos iguales: es la **unidad mínima** de lectura y escritura. Para cambiar un byte se lee el bloque entero, se modifica en memoria y se escribe entero. Un bloque agrupa varios **sectores**, que son la unidad del disco físico. En un bloque no puede haber datos de dos archivos.

| Término        | Qué es                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Partición**  | Una región del disco, con o sin formato. En Linux aparece como `/dev/sdc1`, `/dev/sdc2`…          |
| **Formatear**  | Escribir en una partición las estructuras que pide un filesystem, para que quede lista para usar. |
| **Volumen**    | Una partición **con un filesystem instalado** (ext2, NTFS, FAT32).                                |
| **Filesystem** | La especificación: qué estructuras tiene el esquema de almacenamiento y cómo se usan.             |

Ejemplo de la cátedra: un disco de 220 GiB con tres particiones. Mientras su filesystem es "desconocido" no se puede guardar nada; una vez formateadas como ext2, NTFS y FAT32 son tres volúmenes. Cada uno pierde un poco de capacidad por sus propias estructuras.

## Estructuras de un filesystem

### En disco (persistidas)

| Estructura                       | Qué guarda                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Bloque de arranque**           | Lo necesario para iniciar el SO desde ese volumen.                                                              |
| **Bloque de control de volumen** | Tamaño de bloque, cantidad total de bloques y de libres, dónde está el directorio raíz y las demás estructuras. |
| **Estructura de directorios**    | Desde el directorio raíz. Cada entrada tiene el nombre y los atributos, o un puntero al FCB.                    |
| **FCB** (uno por archivo)        | Los atributos del archivo y los punteros a sus bloques.                                                         |
| **Bloques de datos**             | El contenido de los archivos.                                                                                   |

El **FCB** (_File Control Block_) es al archivo lo que el PCB al proceso: una estructura por archivo, que referencia a **un solo** archivo, con sus permisos, fechas, tamaño y **todos los punteros** necesarios para llegar a cada uno de sus bloques. Vive en disco y se copia a memoria mientras se opera con el archivo. Cada filesystem lo implementa a su manera: en UFS es el **inodo**, y FAT directamente no tiene (sus atributos van en la entrada de directorio).

### En memoria

- **Estructura de directorios** (la parte que se está usando): se consulta en cada syscall sobre archivos.
- **Tabla global** de archivos abiertos.
- **Tabla de archivos abiertos por proceso.**
- **Tabla de montaje.**

### Cómo ve un archivo el filesystem

El usuario ve un archivo como una secuencia continua de bytes (el código de `programa.c`). El filesystem lo ve **partido en bloques**: el primero termina en la mitad de una palabra y el último queda a medio llenar. Todos los bloques menos el último están llenos, así que el último tiene **fragmentación interna** (como máximo, un bloque menos un byte). Con un directorio pasa lo mismo: sus entradas (nombre, tipo, FCB) se reparten en bloques y el último tiene espacio sin usar.

## Métodos de asignación

Es cómo el filesystem decide **qué bloques** le da a cada archivo y cómo los encuentra después. Los tres métodos tienen fragmentación interna en el último bloque.

```recorrido metodos-asignacion

```

### Contigua

Los bloques del archivo son consecutivos. El FCB guarda el **bloque inicial** y la **cantidad** de bloques (o el tamaño).

- **Ventajas:** muy simple; el bloque `k` del archivo está en `inicial + k`, así que sirve tanto para acceso **secuencial** como **directo**.
- **Desventajas:** **fragmentación externa** (hay bloques libres pero no contiguos) y es poco flexible: si el bloque siguiente está ocupado, el archivo **no puede crecer** sin moverlo. Hoy casi no se usa.

### Encadenada (enlazada)

Los bloques pueden estar en cualquier lugar; los últimos bytes de cada uno guardan el número del **siguiente**. El FCB guarda el **bloque inicial** y, opcionalmente, el **final**.

- **Ventajas:** no hay fragmentación externa (sirve cualquier bloque libre) y el archivo crece sin problema.
- **Desventajas:** para llegar al bloque `k` hay que leer los `k` anteriores, así que **no sirve para acceso directo**. Si se rompe un bloque se pierde **también la referencia a todos los que siguen**.

### Indexada

El FCB tiene una **tabla de índices** con un puntero por cada bloque del archivo.

- **Ventajas:** no hay fragmentación externa, el archivo puede crecer y el acceso directo se resuelve leyendo la entrada `k` del índice. Si se pierde un bloque, se pierde solo ese.
- **Desventajas:** si se pierde el **índice**, se pierde el archivo entero; el índice tiene una cantidad fija de entradas (¿de qué tamaño se lo hace?); y es el método que **más espacio y overhead** consume.

| Método     | Frag. externa | Crecer                 | Acceso directo              | Si se rompe un bloque                      |
| ---------- | ------------- | ---------------------- | --------------------------- | ------------------------------------------ |
| Contigua   | Sí            | Difícil                | Sí (una cuenta)             | Se pierde ese bloque                       |
| Encadenada | No            | Fácil                  | No (recorre la cadena)      | Se pierden ese y los siguientes            |
| Indexada   | No            | Hasta llenar el índice | Sí (una entrada del índice) | Se pierde ese bloque; el índice es crítico |

[FAT](/teoria/parcial-2/fat-ufs/) es asignación **encadenada** con los punteros sacados de los bloques a una tabla aparte (algunos parciales la llaman "enlazada-indexada"); **UFS/ext2** es **indexada** con niveles de indirección.

## Gestión del espacio libre

| Estrategia                     | Idea                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Bitmap**                     | Un bit por bloque (1 = ocupado, 0 = libre, en la convención de la PPT). Tamaño fijo, simple y rápido de consultar.                 |
| **Lista de bloques libres**    | Una lista encadenada; al asignar un bloque se lo saca de la lista.                                                                 |
| **Indexada** (como un archivo) | Una tabla con los números de los bloques libres.                                                                                   |
| **Agrupamiento**               | Mezcla de lista e índice: un bloque lleno de números de bloques libres, cuyo último puntero lleva al siguiente bloque de ese tipo. |

## Ejemplo: escribir un archivo nuevo

Se crea `nuevo.txt` en `/home`, con asignación contigua:

1. **Crear el archivo:** verificar que haya un FCB disponible (el 405) y agregar la entrada `nuevo.txt | regular | 405` en `/home`.
2. **Asignarle bloques:** abrirlo (agregarlo a la tabla global y a la del proceso), obtener bloques libres y asignárselos (en el FCB, el primer bloque y la cantidad).
3. **Escribir:** escribir los bloques y actualizar atributos: tamaño, fechas.
4. **Cerrar:** actualizar las tablas de archivos abiertos.

Son muchas escrituras en lugares distintos del disco. Si el sistema se corta en el medio, el filesystem queda **inconsistente**: por ejemplo, una entrada de directorio que apunta a un FCB sin bloques, o bloques marcados ocupados que nadie usa.

## Recuperación

- **Comprobación de coherencia:** un programa recorre las estructuras y corrige lo que no cierra (por ejemplo, `chkdsk` en Windows).
- **Backups:** copias de seguridad. La cátedra destaca la copia de la **metadata** del filesystem, no solo de los datos.
- **Journaling:** las operaciones sobre un archivo se tratan como una **transacción**: o se hacen todas o ninguna. Antes de ejecutarlas se escribe en un registro (el _journal_) la lista de lo que hay que hacer; si el sistema se cae en el medio, al volver se lee el registro y se completa (o se descarta) la operación.

## Otros usos del disco

- **Área de swap:** el espacio de la [memoria virtual](/teoria/parcial-2/memoria-virtual/). En Linux es una **partición** de tipo `linux-swap`, de tamaño fijo; en Windows, un **archivo** de paginación dentro del filesystem.
- **Archivos mapeados a memoria:** el SO reusa la lógica de la memoria virtual para que un proceso use un archivo como si fuera un arreglo en memoria, sin `read`/`write`. Dos procesos que mapean el mismo archivo comparten los mismos frames. Es eficiente para archivos grandes.

## Preguntas de parcial

**1. ¿Qué diferencia hay entre la tabla global de archivos abiertos y la tabla por proceso?**

> La global es una sola para el sistema y tiene lo que es propio del archivo y compartido por todos: nombre, permisos, contador de aperturas y locks. La de cada proceso tiene lo que depende de quién lo abrió: modo de apertura y puntero de lectura/escritura, más un puntero a la entrada global. Dos procesos que leen el mismo archivo comparten la entrada global pero tienen cada uno su puntero.

**2. ¿Qué ventaja tienen los locks sugeridos sobre los obligatorios?**

> Menos overhead: con locks obligatorios el SO tiene que validar cada acceso al archivo. Con sugeridos la responsabilidad es de los procesos, que tienen que pedir el lock antes de usar el archivo.

**3. V o F: con asignación indexada, si se daña un bloque de datos de un archivo se pierde el archivo completo.**

> **Falso.** Se pierde solo ese bloque: los demás siguen referenciados desde el índice. Lo que hace perder el archivo entero es dañar el **índice**. En la encadenada, en cambio, un bloque roto corta la cadena y se pierden también todos los que siguen.

**4. ¿Por qué la asignación contigua sufre fragmentación externa y la indexada no?**

> Porque la contigua necesita que los bloques de un archivo sean consecutivos: puede haber suficientes bloques libres pero separados, y no sirven. La indexada (y la encadenada) puede usar cualquier bloque libre porque guarda dónde está cada uno. Las tres sufren fragmentación interna en el último bloque.

**5. ¿Qué limitación tienen los permisos tipo UNIX frente a una ACL?**

> Con UNIX hay un solo dueño, un solo grupo y "el resto": no se pueden dar permisos distintos a dos grupos o a un usuario puntual. La ACL lista, por archivo, cada usuario y grupo con sus permisos.

**6. V o F: mover un archivo de un directorio a otro siempre implica copiar sus datos.**

> **Falso.** Dentro del mismo filesystem solo se cambia la entrada de directorio y los bloques quedan donde están. Hay que copiar los datos solo si el destino está en **otro** filesystem.

**7. ¿Qué problema resuelve el journaling?**

> Que una operación que necesita varias escrituras (directorio, FCB, bitmap, datos) quede por la mitad si el sistema se cae, dejando el filesystem inconsistente. Al registrar antes las tareas como una transacción, se pueden terminar o deshacer al volver.

_Fuente: PPT Filesystem: Conceptos Básicos de la cátedra y Sistemas Operativos for Dummies (págs. 100–112)._
