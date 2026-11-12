---
titulo: 'Teoría de parciales: hard links y soft links'
tema: parcial-2/fat-ufs
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S2
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- links
- hard-link
- soft-link
- inodo
- permisos
preguntas:
- enunciado: '(2P 1C2024 TT, desarrollo 4; 2R 1C2026, desarrollo 3) ¿Qué estructuras nuevas se generan al crear un **hard link**?'
  opciones:
  - texto: 'Un inodo nuevo, copia del original, y una entrada de directorio que apunta a él'
    explicacion: 'Eso sería una copia del archivo; el hard link comparte el inodo.'
  - texto: 'Solo una entrada de directorio al inodo original (el contador sube en 1)'
    explicacion: Correcta.
  - texto: 'Un inodo nuevo de tipo link y un bloque con la ruta del original'
    explicacion: 'Eso es un soft link.'
  - texto: 'Nada: el hard link es un atributo más dentro del inodo original'
    explicacion: 'Hace falta un nombre nuevo, o sea una entrada de directorio.'
  correcta: 1
  justificacion: |
    Un hard link es **otro nombre para el mismo archivo**: se crea solo una **entrada de directorio** con el
    **mismo número de inodo** que el original, y en el inodo se incrementa el **contador de hard links**.
    No se crea inodo ni se ocupan bloques de datos. Puede estar en otro directorio, siempre que sea del
    **mismo volumen**.
- enunciado: '(2P 1C2024 TT, desarrollo 4; 2R 1C2026, desarrollo 3) ¿Qué estructuras nuevas se generan al crear un **soft link**?'
  opciones:
  - texto: 'Solo una entrada de directorio que apunta al inodo del original'
    explicacion: 'Eso es un hard link.'
  - texto: 'Una entrada de directorio y un inodo nuevo cuyos punteros apuntan a los bloques de datos del original'
    explicacion: 'Los punteros del soft link apuntan a un bloque con la ruta, no a los datos del original.'
  - texto: 'Un inodo propio, una entrada de directorio y un bloque con la ruta del original'
    explicacion: Correcta.
  - texto: 'Una copia completa del archivo original en otro inodo'
    explicacion: 'El soft link no copia datos: guarda solo la ruta.'
  correcta: 2
  justificacion: |
    Un soft link es un **archivo nuevo**: necesita un **inodo propio** (de tipo soft link), una **entrada de
    directorio** que apunte a ese inodo y un **bloque** cuyo contenido es la **ruta** del archivo original.
    Se puede crear en cualquier directorio, incluso de otro volumen, porque solo guarda un path.
- enunciado: '(2P 1C2024 TM, V/F 5a; 2P 2C2025 TT, V/F 3b) ¿Se puede crear un **hard link** a un archivo que está en **otro volumen** (otro filesystem)?'
  opciones:
  - texto: 'Sí: se crea la entrada en el volumen destino y se suma 1 al contador del inodo original'
    explicacion: 'El número de inodo no tiene sentido fuera de su volumen.'
  - texto: 'Solo si los dos volúmenes son UFS'
    explicacion: 'Ni siquiera entre dos UFS: cada uno numera sus propios inodos.'
  - texto: 'Sí, pero solo para lectura'
    explicacion: 'El problema no son los permisos sino el número de inodo.'
  - texto: 'No: el número de inodo solo vale en su propio volumen'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Las dos afirmaciones de los parciales son **falsas**:

    - 2P 1C2024 TM: "un hard link a un archivo de otro FS crea una entrada y suma al contador".
    - 2P 2C2025 TT: "solo es posible un hard link a otro volumen si ese volumen también es UFS".

    Un hard link es una entrada con un **número de inodo**, y ese número solo identifica al archivo dentro
    de **su** volumen. No hay hard links entre volúmenes, independientemente del filesystem. Para eso está
    el soft link, que guarda una ruta.
- enunciado: '(2R 1C2024, desarrollo 4) ¿Se puede crear un **hard link** en un filesystem **FAT**?'
  opciones:
  - texto: 'Sí: dos entradas de directorio pueden tener el mismo primer cluster'
    explicacion: 'Cada entrada tendría su propio tamaño y fechas: se desincronizan al modificar el archivo.'
  - texto: 'No: FAT no tiene inodos, y la metadata del archivo está en su única entrada de directorio'
    explicacion: Correcta.
  - texto: 'Sí, pero solo en el directorio raíz'
    explicacion: 'El directorio no cambia nada: el problema es la falta de inodos.'
  - texto: 'No, porque FAT no permite dos archivos con el mismo nombre'
    explicacion: 'Un hard link puede tener otro nombre; el problema es otro.'
  correcta: 1
  justificacion: |
    Un hard link necesita un **FCB compartido** (el inodo) al que apunten varias entradas. En FAT **no hay
    inodos**: la metadata (tamaño, fechas, primer cluster) está en la **entrada de directorio**, así que no
    hay una estructura común a la que apunten dos nombres.
- enunciado: '(2P 2C2025 TM, single choice 8) ¿Cuál de las siguientes afirmaciones es válida para **hardlinks**?'
  opciones:
  - texto: Su creación implica crear un nuevo inodo
    explicacion: 'Comparte el inodo del original.'
  - texto: Puede referenciar a un archivo de otro FS
    explicacion: 'Los números de inodo son propios de cada FS.'
  - texto: Su creación implica crear una nueva entrada de directorio
    explicacion: Correcta.
  - texto: Todas las anteriores
    explicacion: 'Solo una es válida.'
  correcta: 2
  justificacion: |
    Crear un hard link es agregar una **entrada de directorio** con el número de inodo del original (y
    sumar 1 al contador). No crea inodo y no puede cruzar filesystems.
- enunciado: '(2P 2C2025 TT, V/F 3a) "Es necesario contar con un **inodo libre** para la creación de un softlink". ¿Es verdadero o falso?'
  opciones:
  - texto: 'Verdadero: es un archivo nuevo, con su propio inodo'
    explicacion: Correcta.
  - texto: 'Falso: el soft link usa el inodo del archivo apuntado'
    explicacion: 'Eso hace el hard link.'
  - texto: 'Falso: el soft link es solo una entrada de directorio con una ruta'
    explicacion: 'La ruta se guarda en un bloque del archivo link, que tiene inodo propio.'
  - texto: 'Verdadero, pero solo si el soft link apunta a otro volumen'
    explicacion: 'Siempre necesita inodo propio, apunte adonde apunte.'
  correcta: 0
  justificacion: |
    **Verdadero.** Un soft link es una nueva entrada de directorio que apunta a un **archivo nuevo, con su
    propio inodo**, cuyo contenido es la ruta del archivo apuntado. Sin inodos libres no se puede crear.
- enunciado: '(2R 2C2024, V/F 5b) "En el inodo de un softlink, los punteros apuntan a los bloques del archivo original". ¿Es verdadero o falso?'
  opciones:
  - texto: 'Verdadero: así el soft link accede a los datos sin pasar por el original'
    explicacion: 'Si fuera así, borrar el original no dejaría al link inválido.'
  - texto: 'Verdadero: es lo que lo diferencia del hard link'
    explicacion: 'Lo que lo diferencia es que guarda una ruta.'
  - texto: 'Falso: el inodo del soft link no tiene punteros'
    explicacion: 'Tiene punteros, a sus propios bloques.'
  - texto: 'Falso: apuntan a bloques propios cuyo contenido es la ruta del archivo original'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Falso.** El soft link es un archivo aparte: sus punteros apuntan a **sus propios bloques**, y el
    contenido de esos bloques es la **ruta** del original. Para acceder al original el SO lee esa ruta y la
    resuelve; por eso, si se borra el original, el soft link queda roto.
- enunciado: '(2P 1C2026 TT, teoría 2b) ¿Qué tipo de link permite referenciar a un archivo de **otro volumen**?'
  opciones:
  - texto: Hard link
    explicacion: 'El número de inodo solo vale dentro de su volumen.'
  - texto: Soft link
    explicacion: Correcta.
  - texto: Los dos
    explicacion: 'El hard link no puede cruzar volúmenes.'
  - texto: Ninguno
    explicacion: 'El soft link sí puede.'
  correcta: 1
  justificacion: |
    El **soft link** guarda una **ruta**, y una ruta puede llevar a cualquier volumen montado. El hard link
    guarda un número de inodo, que solo tiene sentido en su propio volumen.
- enunciado: '(2P 1C2026 TT, teoría 2c) ¿Qué tipo de link requiere **más espacio en disco** para su creación?'
  opciones:
  - texto: 'Hard link, porque duplica el inodo'
    explicacion: 'El hard link comparte el inodo.'
  - texto: 'Los dos ocupan solo una entrada de directorio'
    explicacion: 'El soft link además ocupa un inodo y un bloque.'
  - texto: 'Soft link: además de la entrada de directorio ocupa un inodo y un bloque con la ruta'
    explicacion: Correcta.
  - texto: 'Hard link, porque copia los bloques de datos'
    explicacion: 'No copia nada: es otro nombre para el mismo inodo.'
  correcta: 2
  justificacion: |
    El hard link ocupa solo una **entrada de directorio**. El soft link ocupa una entrada de directorio, un
    **inodo** propio y al menos un **bloque** con la ruta.
- enunciado: |
    (2P 1C2025 TM, desarrollo 2) Un directorio tiene el archivo `fileloco`, dos hard links a él (`hl_fileloco_1` y `hl_fileloco_2`) y un soft link `sl_fileloco` que apunta a `fileloco`. ¿Qué muestra el listado (`ls -li`) para estos archivos?
  opciones:
  - texto: 'Los cuatro con el mismo número de inodo y contador 4'
    explicacion: 'El soft link tiene su propio inodo y no suma al contador.'
  - texto: '`fileloco` y los dos hard links con el mismo inodo y contador 3, de tipo regular; `sl_fileloco` con otro inodo, tipo `l` y contador 1'
    explicacion: Correcta.
  - texto: '`fileloco` con contador 3 y los hard links con contador 1, cada uno con su inodo'
    explicacion: 'Los hard links comparten el inodo, así que muestran el mismo contador.'
  - texto: 'Los tres primeros con contador 3; `sl_fileloco` con el mismo inodo que `fileloco` y tipo `l`'
    explicacion: 'Un soft link es un archivo aparte: otro inodo.'
  correcta: 1
  justificacion: |
    El listado oficial (números de inodo de ejemplo):

    ```
    7777 lrwxrwxrwx 1 ... sl_fileloco -> fileloco
    7775 -rw-r--r-- 3 ... hl_fileloco_1
    7775 -rw-r--r-- 3 ... hl_fileloco_2
    7775 -rw-r--r-- 3 ... fileloco
    ```

    Los tres nombres del archivo comparten el **inodo 7775**, de tipo regular, con **contador 3** (el
    original también es un hard link). El soft link es un archivo nuevo: **otro inodo**, tipo `l`, contador
    **1**, y su contenido es la ruta `fileloco`.
- enunciado: '(2P 2C2024 TM, desarrollo 4) En UFS hay un archivo con **2 hard links** en total (contador 2: el nombre original y otro) y **1 soft link** que apunta a él. Para eliminar el archivo por completo, ¿cuántas entradas de directorio hay que borrar y cuántos inodos se liberan?'
  opciones:
  - texto: '3 entradas y 2 inodos'
    explicacion: 'El soft link no impide liberar el archivo: es un archivo aparte.'
  - texto: '1 entrada y 1 inodo'
    explicacion: 'Mientras quede un hard link, el inodo sigue en uso.'
  - texto: '2 entradas y 1 inodo'
    explicacion: Correcta.
  - texto: '2 entradas y 2 inodos'
    explicacion: 'Borrar los hard links libera solo el inodo del archivo.'
  correcta: 2
  justificacion: |
    El inodo se libera cuando su **contador de hard links llega a 0**: hay que borrar las **2 entradas**
    que apuntan a él, y se libera **1 inodo**. El soft link es un archivo independiente (con su propio
    inodo): no hace falta borrarlo, solo queda roto.
- enunciado: '(2R 1C2025, V/F 4b) "Un soft link debe siempre tener los mismos permisos que el archivo destino". ¿Es verdadero o falso?'
  opciones:
  - texto: 'Verdadero: si no, el soft link permitiría saltear los permisos del destino'
    explicacion: 'No puede saltearlos: al seguir la ruta se validan los permisos del destino.'
  - texto: 'Verdadero: el SO copia los permisos del destino en el inodo del link al crearlo'
    explicacion: 'El inodo del link tiene sus propios permisos (típicamente `rwxrwxrwx`).'
  - texto: 'Falso: al seguir la ruta se validan los permisos del destino'
    explicacion: Correcta.
  - texto: 'Falso: el soft link no tiene permisos porque no tiene inodo'
    explicacion: 'Sí tiene inodo propio.'
  correcta: 2
  justificacion: |
    Al acceder por un soft link, el SO lee la ruta guardada y la resuelve: los permisos que se validan son
    los del **archivo destino**. Los permisos del propio link (en Linux siempre `lrwxrwxrwx`) no se usan,
    así que no hace falta que coincidan.

    > La resolución oficial da **Verdadero** ("si no, podría haber un problema de seguridad") y acepta
    > Falso "si se asume que se ignoran los permisos del soft link". Como un soft link no puede dar más
    > acceso que el destino, la respuesta consistente es Falso.
- enunciado: |
    (2P 1C2026 TM, teoría 2a) En un FS tipo Unix se listan estos directorios (inodo, tipo/permisos, hard links, propietario, grupo, tamaño, nombre):

    ```
    /home:
    274907 d rwxr-xr-- 2 alumnos docente 4096 alumnos
    274903 d rwxr-x--- 2 docente docente 4096 docente
    /home/alumnos:
    392584 - rw-r--r-- 3 docente alumnos 175K notas1.txt
    495286 l rwxrwxrwx 1 docente alumnos 25   notas_parcial.txt -> parcial.txt
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    /home/docente:
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    ```

    ¿Qué ocurre si un usuario del grupo `alumnos` (que no es `docente`) intenta acceder al directorio `/home/docente`?
  opciones:
  - texto: 'Puede listarlo pero no entrar, porque tiene `r` como grupo'
    explicacion: 'No está en el grupo `docente`: le tocan los permisos de "otros".'
  - texto: 'Accede sin problema, porque los archivos de adentro son del grupo `alumnos`'
    explicacion: 'Para entrar a un directorio cuentan los permisos del directorio.'
  - texto: 'Puede entrar pero no listar'
    explicacion: 'Como "otros" no tiene ni `r` ni `x`.'
  - texto: 'Error por falta de permisos'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    `/home/docente` es `rwxr-x---` con dueño `docente` y grupo `docente`. Un usuario del grupo `alumnos` no es
    el dueño ni está en el grupo, así que le corresponden los permisos de **otros**: `---`. El acceso da
    **error por falta de permisos**.
- enunciado: |
    (2P 1C2026 TM, teoría 2b) Con el mismo listado:

    ```
    /home:
    274907 d rwxr-xr-- 2 alumnos docente 4096 alumnos
    274903 d rwxr-x--- 2 docente docente 4096 docente
    /home/alumnos:
    392584 - rw-r--r-- 3 docente alumnos 175K notas1.txt
    495286 l rwxrwxrwx 1 docente alumnos 25   notas_parcial.txt -> parcial.txt
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    ```

    ¿Cómo deberían quedar los permisos de `/home/alumnos` para que el usuario `docente` (del grupo `docente`) pueda **eliminar** `/home/alumnos/parcial.txt`?
  opciones:
  - texto: '`rwxr-xr-x`'
    explicacion: 'Agrega `x` a otros: sigue sin haber `w` para el grupo.'
  - texto: '`rwxrwxr--`'
    explicacion: Correcta.
  - texto: '`rwxr-xrw-`'
    explicacion: 'El usuario `docente` está en el grupo `docente`: cuentan los permisos del grupo.'
  - texto: 'No hace falta cambiar nada: `docente` es el dueño de `parcial.txt`'
    explicacion: 'Borrar es modificar el directorio: hace falta `w` en el directorio.'
  correcta: 1
  justificacion: |
    Eliminar un archivo es **borrar una entrada del directorio**, así que hace falta **escritura (y
    ejecución) sobre el directorio**, no sobre el archivo. `/home/alumnos` es de dueño `alumnos` y grupo
    `docente`; el usuario `docente` entra por el **grupo**, que hoy tiene `r-x`. Agregándole `w`:
    `rwxr-xr--` → **`rwxrwxr--`**.
- enunciado: |
    (2P 1C2026 TM, teoría 2c) Con el mismo listado:

    ```
    /home/alumnos:
    392584 - rw-r--r-- 3 docente alumnos 175K notas1.txt
    495286 l rwxrwxrwx 1 docente alumnos 25   notas_parcial.txt -> parcial.txt
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    /home/docente:
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    ```

    ¿Qué archivo quedaría **inutilizable** al eliminar `/home/alumnos/parcial.txt`?
  opciones:
  - texto: '`/home/alumnos/notas1.txt`'
    explicacion: 'Es un hard link al inodo 392584, que sigue vivo.'
  - texto: '`/home/docente/parcial.txt`'
    explicacion: 'Es otro hard link al mismo inodo: sigue funcionando.'
  - texto: 'Ninguno: el inodo 392584 sigue con otros dos nombres'
    explicacion: 'El soft link apunta al nombre, no al inodo.'
  - texto: '`/home/alumnos/notas_parcial.txt`'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    `notas_parcial.txt` es un **soft link** (tipo `l`) a la ruta `parcial.txt` (relativa a `/home/alumnos`).
    Al borrar ese nombre, la ruta ya no existe y el link queda **colgado**, aunque el inodo 392584 sigue vivo
    por los otros dos hard links (`notas1.txt` y `/home/docente/parcial.txt`).
- enunciado: |
    (2P 1C2026 TM, teoría 2d) Con el mismo listado:

    ```
    /home/alumnos:
    392584 - rw-r--r-- 3 docente alumnos 175K notas1.txt
    495286 l rwxrwxrwx 1 docente alumnos 25   notas_parcial.txt -> parcial.txt
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    /home/docente:
    392584 - rw-r--r-- 3 docente alumnos 175K parcial.txt
    ```

    ¿Qué entradas deberían eliminarse para eliminar **por completo** el archivo `parcial.txt`?
  opciones:
  - texto: '`/home/alumnos/parcial.txt` y `/home/docente/parcial.txt`'
    explicacion: 'Falta `notas1.txt`: tiene el mismo inodo.'
  - texto: '`/home/alumnos/parcial.txt`, `/home/alumnos/notas1.txt` y `/home/docente/parcial.txt`'
    explicacion: Correcta.
  - texto: 'Las cuatro entradas de `/home/alumnos` y `/home/docente`, incluido el soft link'
    explicacion: 'El soft link es otro archivo: no retiene al inodo 392584.'
  - texto: 'Solo `/home/alumnos/parcial.txt`: los demás son links'
    explicacion: 'Los hard links son nombres del mismo archivo, con el mismo peso que el original.'
  correcta: 1
  justificacion: |
    El inodo **392584** tiene contador **3**: son los tres hard links `/home/alumnos/parcial.txt`,
    `/home/alumnos/notas1.txt` y `/home/docente/parcial.txt`. El archivo se elimina del todo cuando el
    contador llega a 0, o sea al borrar **esas tres** entradas. El soft link no cuenta.
---

Este simulacro reúne preguntas de **teoría** de los segundos parciales (2024 a 2026) sobre **hard links y
soft links**: qué estructuras crea cada uno, contadores, links entre volúmenes y permisos. Cada pregunta
indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación
de cada una resume la resolución oficial de la cátedra.
