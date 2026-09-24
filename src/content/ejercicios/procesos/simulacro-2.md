---
titulo: 'Teoría de parciales: Procesos'
tema: parcial-1/procesos
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S2
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- imagen-del-proceso
- pcb
- fork
- cambio-de-contexto
preguntas:
- enunciado: '(1P 2C2025 TM) Realizar un cambio de proceso implica:'
  opciones:
  - texto: Solamente cambio de modo
    explicacion: También hay que guardar y cargar el contexto de los procesos.
  - texto: Solamente cambio de contexto
    explicacion: El planificador corre en modo kernel, así que también hay cambios de modo.
  - texto: Cambio de modo y de contexto
    explicacion: Correcta.
  - texto: No requiere cambio de modo ni de contexto
    explicacion: Cambiar de proceso es el caso que más cambios requiere.
  correcta: 2
  justificacion: |
    Un cambio de proceso lo realiza el SO, en modo kernel:

    1. Se pasa a **modo kernel** (por una interrupción o una syscall) y se guarda el **contexto** del proceso saliente en su PCB.
    2. Se actualiza su estado y el planificador elige al próximo.
    3. Se carga el **contexto** del proceso entrante y se vuelve a **modo usuario**.

    Por eso implica **cambios de modo y de contexto**. Lo inverso no vale: puede haber cambio de contexto o de modo sin cambio de proceso (por ejemplo, al atender una interrupción y volver al mismo proceso).
- enunciado: (1P 1C2026 TM) ¿Cuántos cambios de modo ocurren como mínimo al realizar un cambio de proceso?
  opciones:
  - texto: Ninguno
    explicacion: 'El planificador corre en modo kernel: hay que entrar y salir de él.'
  - texto: 'Uno: de usuario a kernel'
    explicacion: Se entra a modo kernel, pero también hay que volver a modo usuario para el nuevo proceso.
  - texto: 'Dos: ida y vuelta a kernel'
    explicacion: Correcta.
  - texto: 'Cuatro: dos por cada proceso involucrado'
    explicacion: No hace falta volver al proceso saliente en modo usuario antes de pasar al otro.
  correcta: 2
  justificacion: |
    Como mínimo son **dos cambios de modo**:

    1. **Usuario → kernel:** una interrupción (por ejemplo, fin de quantum) o una syscall del proceso que ejecuta.
    2. **Kernel → usuario:** después de que el SO guarda el contexto, el planificador elige al próximo y se carga su contexto.

    Entre la ejecución de una aplicación y la de otra siempre hay un paso por modo kernel, porque el que decide quién sigue es el SO.
- enunciado: (1P 1C2026 TT) Mientras ejecuta un proceso se produce una interrupción, y mientras se atiende
    se produce otra de más prioridad, que comienza a ser atendida. ¿Cuántos cambios de modo y de contexto
    llevan ocurridos desde el inicio?
  opciones:
  - texto: 1 cambio de contexto y 1 cambio de modo
    explicacion: 'La segunda interrupción también obliga a guardar un contexto: el de la rutina de la
      primera.'
  - texto: 2 cambios de contexto y 2 cambios de modo
    explicacion: Al llegar la segunda interrupción la CPU ya está en modo kernel.
  - texto: 1 cambio de contexto y 2 cambios de modo
    explicacion: Solo se cambió de modo una vez, y se guardaron dos contextos distintos.
  - texto: 2 cambios de contexto y 1 cambio de modo
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    - **Primera interrupción:** el proceso estaba en modo usuario. Se guarda su contexto (**1er cambio de contexto**) y se pasa a modo kernel (**único cambio de modo**).
    - **Segunda interrupción:** llega mientras se ejecuta la rutina de la primera, ya en modo kernel. Se guarda el contexto de esa rutina para atender la nueva (**2do cambio de contexto**), pero **no hay cambio de modo**, porque ya se estaba en kernel.

    Total: **2 cambios de contexto y 1 cambio de modo**. Es un ejemplo de que puede haber cambios de contexto sin cambio de proceso.
- enunciado: '(1P 1C2025 TM) Verdadero o falso: "Al matar un proceso, sus hilos y procesos hijos deben
    finalizar obligatoriamente."'
  opciones:
  - texto: 'Verdadero: hilos e hijos comparten el espacio de memoria del padre, así que no pueden seguir
      sin él'
    explicacion: Los hilos sí comparten memoria con el proceso, pero un hijo tiene su propia imagen.
  - texto: 'Falso: los hilos terminan con él, pero los hijos son independientes y pueden seguir ejecutando'
    explicacion: Correcta.
  - texto: 'Falso: ni los hilos ni los hijos terminan, porque cada uno tiene su propio PCB'
    explicacion: 'Los hilos no tienen PCB propio: son parte del proceso y no pueden existir sin él.'
  - texto: 'Verdadero: el SO recorre el árbol de procesos y finaliza a todos los descendientes'
    explicacion: En la mayoría de los SO (Linux, por ejemplo) los hijos no se finalizan con el padre.
  correcta: 1
  justificacion: |
    **Falso.** Hay que separar los dos casos:

    - **Hilos:** finalizan obligatoriamente, porque son parte del proceso (comparten su PCB, código, datos y heap).
    - **Procesos hijos:** no están obligados a finalizar. En la mayoría de los SO (Linux, por ejemplo) el hijo es una entidad independiente, con su propia imagen, que puede seguir ejecutando sin depender del padre.
- enunciado: '(1P 1C2025 TM) Verdadero o falso: "Al realizar un fork(), el proceso hijo creado tiene una
    imagen completamente idéntica a la de su padre."'
  opciones:
  - texto: 'Verdadero: fork copia byte a byte toda la imagen, incluido el PCB, y recién exec la modifica'
    explicacion: 'La copia no es exacta ni siquiera antes de un exec: hay datos que no pueden coincidir.'
  - texto: 'Falso: el hijo arranca con el heap y el stack vacíos y solo copia el código del padre'
    explicacion: El hijo recibe una copia de toda la imagen, con heap y stack incluidos.
  - texto: 'Verdadero: padre e hijo comparten la misma imagen en memoria, como si fueran hilos'
    explicacion: 'Padre e hijo no comparten memoria: cada uno tiene su propia imagen.'
  - texto: 'Falso: difieren el valor de retorno de fork() en el stack y el PID y el PPID en el PCB'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Falso.** El hijo arranca con una **copia** de la imagen del padre, pero hay diferencias:

    - **Stack:** el valor de retorno de `fork()` es distinto (0 en el hijo, el PID del hijo en el padre).
    - **PCB:** el hijo tiene su propio **PID** y su **PPID** es el PID del padre.
- enunciado: (1R 2C2025) Un programa declara int global = 1 fuera de main y, dentro de main, int local
    = 2 y char* nombre = malloc(10). ¿Dónde se ubica cada elemento en la imagen del proceso?
  opciones:
  - texto: global en datos; local y el puntero nombre en el stack; los 10 bytes reservados en el heap
    explicacion: Correcta.
  - texto: global en el heap; local en el stack; el puntero nombre y sus 10 bytes en el heap
    explicacion: Las variables globales no se reservan dinámicamente.
  - texto: global y local en la sección de datos, porque las dos se inicializan con un valor constante
    explicacion: Que se inicialice con un valor no cambia dónde vive una variable local.
  - texto: global en datos; local en el stack; tanto el puntero nombre como sus 10 bytes en el heap
    explicacion: malloc reserva en el heap lo apuntado, pero la variable nombre es local.
  correcta: 0
  justificacion: |
    ```c
    int global = 1;               // variable global -> sección de datos
    int main() {                  // nueva entrada (frame) en el stack
        int local = 2;            // variable local -> stack
        char* nombre = (char*) malloc(sizeof(char) * 10);
        // "nombre" es una variable local -> stack,
        // y apunta a los 10 bytes reservados en el heap
    }
    ```

    La trampa típica es el puntero: la **variable** `nombre` es local (stack); lo que está en el heap es la memoria **a la que apunta**.
- enunciado: '(1P 2C2025 TT) Los hilos de un mismo proceso comparten:'
  opciones:
  - texto: Heap
    explicacion: Correcta.
  - texto: Stack / Pila
    explicacion: Cada hilo tiene su propio stack para sus llamadas y variables locales.
  - texto: Registros
    explicacion: Cada hilo tiene su propio contexto de ejecución, guardado en su TCB.
  - texto: Ninguna es correcta
    explicacion: Hay una opción que sí comparten.
  correcta: 0
  justificacion: |
    Los hilos de un mismo proceso comparten el **código**, los **datos** (variables globales), el **heap** y los recursos del proceso (archivos abiertos, PCB).

    Cada hilo tiene lo propio de su ejecución: su **stack** y su **contexto** (registros, PC), guardados en su TCB.
- enunciado: (1P 1C2026 TT) Aparte del código y los datos estáticos (variables globales), ¿qué otros elementos
    conforman la imagen del proceso?
  opciones:
  - texto: El heap y el stack; el PCB queda en el kernel y no forma parte de la imagen
    explicacion: El PCB sí se considera parte de la imagen, aunque lo administre el SO.
  - texto: El heap (memoria dinámica), el stack (pila del sistema) y el PCB
    explicacion: Correcta.
  - texto: 'Solo el stack: el heap y el PCB pertenecen al SO y no al proceso'
    explicacion: El heap es memoria dinámica del propio proceso.
  - texto: Los registros de la CPU y la tabla de syscalls del SO
    explicacion: La tabla de syscalls es del SO, no de cada proceso.
  correcta: 1
  justificacion: |
    La imagen del proceso está formada por:

    | Elemento | Contenido |
    |---|---|
    | **Código** | Las instrucciones del programa |
    | **Datos** | Variables globales y estáticas |
    | **Heap** | Memoria dinámica (malloc) |
    | **Stack** | Llamadas a funciones, variables locales, parámetros |
    | **PCB** | Estructura del SO que administra el proceso: PID, estado, contexto, punteros a memoria |
- enunciado: '(1P 1C2026 TT) Diferentes hilos de un mismo proceso NO comparten:'
  opciones:
  - texto: Variables ubicadas en el heap (memoria dinámica)
    explicacion: El heap es del proceso y todos sus hilos lo ven.
  - texto: Código de las funciones
    explicacion: 'El código es del proceso: todos los hilos ejecutan sobre la misma sección.'
  - texto: Archivos abiertos
    explicacion: Los archivos abiertos se registran a nivel proceso.
  - texto: Variables ubicadas en la pila (stack)
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Cada hilo tiene su propio **stack**, con sus llamadas a funciones y sus variables locales: por eso las variables de la pila no se comparten.

    El heap, el código y los archivos abiertos son del proceso y los comparten todos sus hilos. (Técnicamente un hilo podría acceder al stack de otro manipulando direcciones, porque la protección del SO es a nivel proceso, pero no es memoria compartida por diseño.)
- enunciado: (1P 1C2026 TT) ¿Qué estrategia usa el SO para conocer dónde están el código, los datos, el
    contexto de ejecución y el estado de un proceso? ¿Cómo cambia si el sistema tiene de forma nativa
    hilos a nivel kernel?
  opciones:
  - texto: El PCB; con KLTs, cada hilo tiene su propio PCB completo con código, datos y heap propios
    explicacion: 'Los hilos comparten código, datos y heap: no tiene sentido duplicarlos por hilo.'
  - texto: El PCB; con KLTs se mantiene un PCB y se agrega un TCB por hilo con su contexto, stack y estado
    explicacion: Correcta.
  - texto: La tabla de syscalls; con KLTs, la biblioteca de hilos guarda cada contexto en modo usuario
    explicacion: La tabla de syscalls indica qué rutina atiende cada llamada, no dónde está cada proceso.
  - texto: El PCB; con KLTs desaparece el PCB y el proceso pasa a representarse solo con los TCB de sus
      hilos
    explicacion: Lo compartido (código, datos, heap) sigue necesitando una estructura a nivel proceso.
  correcta: 1
  justificacion: |
    - **Sin hilos:** el SO usa el **PCB**, donde guarda el estado y el contexto de ejecución del proceso y los punteros a memoria de su código, datos y heap.
    - **Con KLTs nativos:** sigue habiendo **un PCB** por proceso, con los punteros a lo compartido (código, datos, heap), y además **un TCB por hilo** con lo individual: su contexto de ejecución, su stack y su estado.
- enunciado: (1R 1C2026 TM) ¿Qué partes de la imagen de un proceso comparten sus hilos?
  opciones:
  - texto: Código, datos y heap (y el PCB)
    explicacion: Correcta.
  - texto: Código, datos, heap y stack
    explicacion: El stack es lo que cada hilo tiene propio.
  - texto: Solo el código; los datos y el heap son propios de cada hilo
    explicacion: Las variables globales y la memoria dinámica son del proceso.
  - texto: Código y stack; el heap es propio de cada hilo
    explicacion: Es al revés con el heap y el stack.
  correcta: 0
  justificacion: |
    Los hilos comparten todo lo que es del proceso:

    - **Código**
    - **Datos** (variables globales)
    - **Heap**
    - También puede incluirse el **PCB** (con los recursos del proceso, como los archivos abiertos).

    Lo propio de cada hilo es su **stack** y su contexto de ejecución, guardados en su TCB.
---

Simulacro con preguntas de teoría de parciales anteriores (primeros parciales y recuperatorios, 2024 a 2026) sobre imagen del proceso, PCB, fork y cambios de modo y de contexto, agrupadas por tema. Cada pregunta indica entre paréntesis el examen de donde sale.

Las preguntas de respuesta breve, verdadero o falso y desarrollo se reformularon como multiple choice. La respuesta correcta es siempre la de la resolución oficial, y al acertar se muestra su justificación.
