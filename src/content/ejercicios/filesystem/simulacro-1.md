---
titulo: 'Teoría de parciales: Filesystem (archivos abiertos, locks y protección)'
tema: parcial-2/filesystem
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S1
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- archivos-abiertos
- locks
- proteccion
preguntas:
- enunciado: '(2P 2C2024 TM, desarrollo 3; 2P 1C2025 TT, desarrollo 3) Dos procesos abren el **mismo archivo** en modo lectura. ¿Qué queda registrado en las tablas de archivos abiertos?'
  opciones:
  - texto: 'Dos entradas en la tabla global, una por proceso, y ninguna en las tablas de los procesos'
    explicacion: 'La global tiene una sola entrada por archivo abierto, no por apertura.'
  - texto: 'Una entrada global con contador 2 y una entrada por proceso, cada una con su puntero y modo'
    explicacion: Correcta.
  - texto: 'Una entrada en la tabla global con un único puntero de lectura compartido por los dos procesos'
    explicacion: 'El puntero de lectura/escritura es de cada proceso: va en su tabla local.'
  - texto: 'Solo una entrada en la tabla de cada proceso; la global se crea recién cuando alguno escribe'
    explicacion: 'La global se crea en la primera apertura, sea lectura o escritura.'
  correcta: 1
  justificacion: |
    El SO usa dos niveles de tablas:

    - **Tabla global de archivos abiertos**: una entrada por archivo abierto en el sistema, con lo que es
      común a todos (información del FCB en memoria, permisos, locks y el **contador de aperturas**).
    - **Tabla por proceso**: una entrada por archivo que ese proceso abrió, con lo propio de esa apertura
      (**modo de apertura**, **puntero de lectura/escritura**) y una referencia a la entrada global.

    La primera apertura crea la entrada global y la del proceso. Si otro proceso abre el mismo archivo, solo
    se agrega la entrada en **su** tabla y el contador global pasa a 2. Ejemplo: P1 y P2 con
    `(FCB1, lectura, puntero 0)` cada uno, y la global con `(FCB1, aperturas: 2)`.
- enunciado: '(2P 2C2025 TM, desarrollo 1) Siguiendo con dos procesos que tienen abierto el mismo archivo, uno de ellos hace `close`. ¿Qué cambia en las estructuras?'
  opciones:
  - texto: 'Se borra la entrada global y la del proceso; el otro proceso tiene que volver a abrir el archivo'
    explicacion: 'La global sigue mientras quede alguien con el archivo abierto.'
  - texto: 'No cambia nada hasta que el otro proceso también lo cierre'
    explicacion: 'La entrada local del proceso que cerró se borra en el momento.'
  - texto: 'Se borra la entrada local y baja el contador global; la global se libera al llegar a 0'
    explicacion: Correcta.
  - texto: 'Se decrementa el contador de la global y se reinicia a 0 el puntero de lectura del otro proceso'
    explicacion: 'El puntero del otro proceso es suyo: el close ajeno no lo toca.'
  correcta: 2
  justificacion: |
    Al cerrar, el proceso **elimina su entrada local** (descriptor, modo, posición) y el SO **decrementa el
    contador de aperturas** de la entrada global. Mientras el contador sea mayor que 0, la entrada global
    queda (el otro proceso la sigue usando). Cuando llega a **0**, el SO libera la entrada global y el
    archivo queda cerrado del todo.
- enunciado: '(2P 2C2025 TT, single choice 5; 2P 1C2026 TT, teoría 2d) ¿Qué información **no** forma parte de la lista **global** de archivos abiertos?'
  opciones:
  - texto: Modo de apertura
    explicacion: Correcta.
  - texto: Cantidad de aperturas
    explicacion: 'El contador de aperturas es justamente lo que comparten todos: está en la global.'
  - texto: Locks/Bloqueos
    explicacion: 'Los locks son del archivo, no de una apertura: van en la global.'
  - texto: Ninguna es correcta
    explicacion: 'El modo de apertura no está en la global.'
  correcta: 0
  justificacion: |
    El **modo de apertura** depende de cada apertura (un proceso puede abrir para leer y otro para escribir),
    así que se guarda en la **tabla local de archivos abiertos del proceso**, junto con el puntero de
    lectura/escritura. La global guarda lo común al archivo: contador de aperturas, locks, ubicación del FCB.
- enunciado: '(2R 2C2025, single choice 5) ¿Qué información **no** forma parte de la lista **local** de archivos abiertos?'
  opciones:
  - texto: Modo de apertura
    explicacion: 'Cada proceso abre en su modo: está en la local.'
  - texto: Puntero de lectura/escritura
    explicacion: 'Cada proceso avanza por su cuenta: está en la local.'
  - texto: Locks/Bloqueos
    explicacion: Correcta.
  - texto: Ninguna es correcta
    explicacion: 'Los locks no están en la tabla local.'
  correcta: 2
  justificacion: |
    Los **locks** protegen al archivo frente a **todos** los procesos, así que se registran en la **tabla
    global** (es donde el SO los consulta para decidir si otro proceso puede operar). La tabla local tiene
    lo propio de cada apertura: modo y puntero de lectura/escritura. Es la pregunta espejo de la anterior.
- enunciado: '(2R 1C2026, single choice 2.iv) Indique cuál estructura o información **nunca** es persistida en el volumen de un filesystem:'
  opciones:
  - texto: El FCB
    explicacion: 'El FCB (inodo, entrada de directorio en FAT) vive en disco.'
  - texto: La tabla global de archivos abiertos
    explicacion: Correcta.
  - texto: El directorio raíz
    explicacion: 'El raíz es un directorio más (o una zona fija en FAT): está en disco.'
  - texto: Ninguna de las anteriores
    explicacion: 'La tabla global de archivos abiertos no se guarda en disco.'
  correcta: 1
  justificacion: |
    Las tablas de archivos abiertos (global y por proceso) son estructuras del SO **en memoria**: describen
    qué archivos están abiertos ahora y por quién. Al apagar el equipo pierden sentido, así que nunca se
    escriben al volumen. El FCB y los directorios, en cambio, son parte del filesystem en disco.
- enunciado: '(2R 1C2026, single choice 2.ii) Indique cuál syscall sobre archivos **no** requiere acceso a disco:'
  opciones:
  - texto: open / abrir
    explicacion: 'Hay que leer los directorios de la ruta y el FCB del archivo.'
  - texto: seek / reposicionar puntero
    explicacion: Correcta.
  - texto: close / cerrar
    explicacion: 'Puede tener que actualizar el FCB en disco (tamaño, fechas) y bajar buffers.'
  - texto: Ninguna de las anteriores
    explicacion: 'Una de las tres sí puede resolverse sin disco.'
  correcta: 1
  justificacion: |
    **Reposicionar** (`seek`) solo cambia el **puntero de lectura/escritura** de la tabla local del proceso:
    no lee ni escribe datos. `open` tiene que recorrer directorios y leer el FCB; `close` puede actualizar el
    FCB en disco.
- enunciado: '(2P 2C2024 TT, desarrollo 4) Un proceso ejecuta `write(file)` sobre un archivo que **otro proceso** tiene con un **lock obligatorio**. ¿Qué ocurre y qué estructura usa el SO para decidirlo?'
  opciones:
  - texto: 'El write se ejecuta igual: los locks solo frenan a los procesos que también piden el lock'
    explicacion: 'Eso es un lock sugerido; el obligatorio lo hace cumplir el SO.'
  - texto: 'El write falla o se bloquea; el SO lo decide con el lock registrado en la tabla global'
    explicacion: Correcta.
  - texto: 'El write falla; el SO lo decide mirando los permisos del FCB del archivo'
    explicacion: 'Los permisos dicen quién puede escribir en general, no si hay un lock tomado.'
  - texto: 'El SO aborta al proceso que tiene el lock y deja escribir al nuevo'
    explicacion: 'El SO no quita locks por la fuerza: el que lo pide espera o recibe un error.'
  correcta: 1
  justificacion: |
    Con un lock **obligatorio** el SO valida **cada operación**: si otro proceso tiene el archivo bloqueado,
    la syscall `write` **falla** (o, según la implementación, el proceso **se bloquea** hasta que se libere el
    lock) y no escribe nada. La información del lock está en la **tabla global de archivos abiertos**, que es
    la que el SO consulta junto con los permisos.
- enunciado: '(2R 1C2026, single choice 2.iii) Un cerrojo **exclusivo obligatorio** implica:'
  opciones:
  - texto: Un mayor overhead en syscalls
    explicacion: Correcta.
  - texto: Un acceso compartido solo si es lectura
    explicacion: 'Eso describe un lock compartido; el exclusivo no deja entrar a nadie más.'
  - texto: Un menor overhead en syscalls
    explicacion: 'Al revés: el SO tiene que validar el lock en cada operación.'
  - texto: Ninguna de las anteriores
    explicacion: 'Una de las opciones es correcta.'
  correcta: 0
  justificacion: |
    En un lock **obligatorio** el SO controla el lock en **cada** syscall sobre el archivo (`read`, `write`…),
    lo pida o no el proceso. Ese chequeo extra es **overhead** en todas las syscalls. Con un lock sugerido el
    SO solo interviene en `lock`/`unlock`: menos overhead, pero la consistencia queda en manos de los procesos.
- enunciado: '(2P 1C2026 TT, desarrollo 5b) ¿Qué ventaja pueden ofrecer los **locks** sobre archivos frente a proteger el archivo con un **semáforo mutex**?'
  opciones:
  - texto: 'Ninguna: un lock sobre un archivo es exactamente un semáforo mutex, solo cambia el nombre de las syscalls que se usan'
    explicacion: 'Los locks tienen modos (obligatorio, compartido) que un mutex no tiene.'
  - texto: 'Los locks evitan el deadlock, porque el SO nunca deja que un proceso espere un lock'
    explicacion: 'Un proceso puede bloquearse esperando un lock incompatible.'
  - texto: 'Los locks no necesitan que el archivo esté abierto, así que se usan sin syscalls'
    explicacion: 'Se piden con syscalls (`lock`/`unlock`) sobre un archivo abierto.'
  - texto: 'Un lock obligatorio protege aunque otro no lo pida; uno compartido deja leer a varios a la vez'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Los locks resuelven la **mutua exclusión** sobre archivos (evitan condiciones de carrera), como un mutex,
    pero al estar hechos para archivos ofrecen más:

    - **Obligatorio**: el SO lo hace cumplir en cada operación, así que un proceso queda protegido aunque
      otro proceso "mal portado" no pida el lock. Con un mutex, quien no hace `wait` entra igual.
    - **Compartido**: varios procesos pueden **leer** a la vez y solo la escritura es exclusiva; un mutex
      deja pasar de a uno, aunque todos solo lean.
- enunciado: '(2R 2C2025, single choice 4) La estrategia de permisos sobre archivos que **menor espacio** ocupa en disco es:'
  opciones:
  - texto: ACL
    explicacion: 'Guarda una lista de usuarios/grupos por archivo: crece con cada permiso.'
  - texto: Matriz de accesos
    explicacion: 'Tiene una celda por cada par usuario-archivo: es la que más ocupa.'
  - texto: Permisos tipo "unix"
    explicacion: Correcta.
  - texto: Todas ocupan el mismo espacio
    explicacion: 'Unix usa 9 bits por archivo; las otras dependen de la cantidad de usuarios.'
  correcta: 2
  justificacion: |
    Los permisos tipo **Unix** guardan un tamaño fijo por archivo: dueño, grupo y 9 bits (`rwx` para dueño,
    grupo y otros). La **ACL** agrega una entrada por cada usuario o grupo con permisos, y la **matriz de
    accesos** tiene una celda por cada combinación usuario-archivo.
- enunciado: '(2P 1C2024 TM, desarrollo 3) Compare los permisos tipo **Unix** con la **matriz de accesos** en espacio ocupado y granularidad.'
  opciones:
  - texto: 'Unix: mucho espacio y alta granularidad. Matriz: poco espacio y baja granularidad'
    explicacion: 'Está invertido.'
  - texto: 'Unix: poco espacio y baja granularidad. Matriz: mucho espacio y alta granularidad'
    explicacion: Correcta.
  - texto: 'Las dos ocupan lo mismo; la matriz solo agrega granularidad'
    explicacion: 'La matriz tiene una celda por usuario y archivo: ocupa mucho más.'
  - texto: 'Unix: poco espacio y la misma granularidad que la matriz, porque tiene permisos para dueño, grupo y otros'
    explicacion: 'Con tres clases no se pueden dar permisos distintos a usuarios puntuales.'
  correcta: 1
  justificacion: |
    - **Unix**: tres clases (dueño, grupo, otros) × `rwx` → **poco espacio**, pero **baja granularidad**: no
      se le puede dar un permiso distinto a un usuario puntual que no sea el dueño ni esté en el grupo.
    - **Matriz de accesos**: una celda por cada par (usuario, archivo) → **granularidad máxima**, pero
      **mucho espacio** (y casi todas las celdas vacías).
- enunciado: '(2P 1C2024 TM, desarrollo 3) Los permisos tipo Unix, ¿se guardan en la **entrada de directorio** o en el **FCB** (inodo)? ¿Por qué?'
  opciones:
  - texto: 'En la entrada de directorio, porque es lo primero que se lee al recorrer la ruta'
    explicacion: 'Con varios hard links habría varias copias que podrían no coincidir.'
  - texto: 'En el FCB: con hard links, cada entrada podría tener permisos distintos'
    explicacion: Correcta.
  - texto: 'En el FCB, porque la entrada de directorio no tiene espacio: solo guarda el nombre'
    explicacion: 'El lugar es una razón menor; el motivo de fondo son los hard links.'
  - texto: 'En los dos, para no tener que leer el inodo al validar'
    explicacion: 'Duplicarlos crea el mismo problema de consistencia.'
  correcta: 1
  justificacion: |
    Van en el **FCB (inodo)**. Una entrada de directorio es solo un **nombre → inodo**: con hard links, varias
    entradas apuntan al mismo inodo. Si los permisos estuvieran en la entrada, el mismo archivo tendría permisos
    distintos según el nombre por el que se lo abre. Guardándolos en el FCB, el archivo tiene un único juego
    de permisos.
- enunciado: '(2R 2C2024, V/F 5a; 2P 1C2025 TM, V/F 5b) ¿Cuál de estas afirmaciones sobre la **matriz de accesos** es correcta?'
  opciones:
  - texto: 'Es la estrategia más eficiente cuando hay muchos archivos, porque se consulta una sola estructura'
    explicacion: 'Con muchos archivos y usuarios crece muchísimo: es la menos eficiente en espacio.'
  - texto: 'Tiene la misma granularidad que los permisos Unix, pero ocupa menos'
    explicacion: 'Tiene más granularidad y ocupa más.'
  - texto: 'Da la mayor granularidad, pero cuesta mantenerla y ocupa muchísimo'
    explicacion: Correcta.
  - texto: 'Es una lista por archivo con los usuarios autorizados, por eso es barata de mantener'
    explicacion: 'Eso describe una ACL, que es una columna de la matriz.'
  correcta: 2
  justificacion: |
    - 2R 2C2024 (5a): "La matriz de accesos da mayor granularidad pero un mayor costo de mantenimiento" →
      **Verdadero**: es una estructura global única, de tamaño usuarios × archivos, que hay que mantener y
      sincronizar.
    - 2P 1C2025 TM (5b): "La matriz de accesos es lo más eficiente con muchos archivos" → **Falso**: guarda
      todas las combinaciones usuario-archivo, así que con muchos archivos ocupa muchísimo.
- enunciado: '(2P 1C2025 TT, desarrollo 4) ¿Cuál es la principal **desventaja** de la protección tipo UFS (dueño/grupo/otros con `rwx`) y cómo se soluciona?'
  opciones:
  - texto: 'No permite permiso de ejecución; se soluciona con una matriz de accesos'
    explicacion: 'UFS sí tiene el bit `x`.'
  - texto: 'Ocupa mucho espacio en el inodo; se soluciona guardando los permisos en el directorio'
    explicacion: 'Ocupa poco; el problema es la granularidad.'
  - texto: 'No permite dar permisos distintos a varios usuarios o grupos puntuales; se soluciona con listas de control de acceso (ACL)'
    explicacion: Correcta.
  - texto: 'Cualquier usuario puede cambiar los permisos; se soluciona con locks obligatorios'
    explicacion: 'Solo el dueño (o root) cambia los permisos; los locks son otra cosa.'
  correcta: 2
  justificacion: |
    UFS asigna permisos de lectura, escritura y ejecución para **tres clases**: el dueño, el grupo del archivo
    y el resto. La desventaja es la **granularidad limitada**: si se quiere que U1 pueda leer y U2 pueda
    escribir, y no están en el grupo del archivo, no hay forma de expresarlo.

    La solución son las **ACL (listas de control de acceso)**: por archivo, una lista de usuarios o grupos con
    sus permisos, con todas las entradas que hagan falta.
- enunciado: '(2R 1C2025, V/F 4a) "Al acceder a un archivo sin los permisos adecuados, el sistema produce una interrupción que es atendida por el SO". ¿Es verdadero o falso?'
  opciones:
  - texto: 'Verdadero: la MMU detecta el acceso inválido y genera una interrupción, como en un page fault'
    explicacion: 'Los archivos no se acceden por la MMU: se piden por syscalls.'
  - texto: 'Falso: es una syscall y el SO valida los permisos antes; si no alcanzan, da error'
    explicacion: Correcta.
  - texto: 'Verdadero: el disco rechaza la lectura y genera una interrupción de E/S'
    explicacion: 'El disco no sabe de permisos: el que valida es el SO.'
  - texto: 'Falso: el SO no valida permisos al acceder, solo al crear el archivo'
    explicacion: 'Los valida al abrir (y en cada operación si corresponde).'
  correcta: 1
  justificacion: |
    **Falso.** El proceso accede al archivo con una **syscall** (`open`, `read`…), y es el SO el que valida
    **preventivamente** los permisos contra el FCB. Si no alcanzan, la syscall devuelve un error: no hay una
    interrupción por el acceso indebido (a diferencia de un page fault o una violación de segmento, que
    detecta el hardware).
---

Este simulacro reúne preguntas de **teoría** de los segundos parciales (2024 a 2026) sobre **filesystem**:
tablas de archivos abiertos, operaciones, locks y protección. Cada pregunta indica entre paréntesis de qué
examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación
de cada una resume la resolución oficial de la cátedra.
