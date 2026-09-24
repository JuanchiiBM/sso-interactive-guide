---
titulo: 'Teoría de parciales: Procesos'
tema: parcial-1/procesos
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S1
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- estados
- planificadores
- multiprogramacion
preguntas:
- enunciado: (1P 1C2025 TT) ¿Qué sucede cuando ocurre una interrupción por fin de quantum, asumiendo que
    las interrupciones están habilitadas? ¿Podría ocurrir un cambio de proceso a raíz de esto?
  opciones:
  - texto: 'Se guarda el contexto, el proceso pasa a Ready y el planificador elige al próximo: sí, puede
      haber cambio de proceso'
    explicacion: Correcta.
  - texto: El proceso pasa a Blocked hasta la próxima interrupción del reloj; no hay cambio de proceso
      porque lo decide el hardware
    explicacion: 'El fin de quantum no bloquea al proceso: sigue en condiciones de ejecutar.'
  - texto: El hardware carga directamente el próximo proceso de la cola de listos, sin intervención del
      SO ni cambio de modo
    explicacion: Quien elige al próximo proceso es el planificador del SO, en modo kernel.
  - texto: 'Solo se guarda el PC y el proceso sigue ejecutando: nunca provoca cambio de proceso, solo
      cambio de modo'
    explicacion: Esa es justamente una de las situaciones típicas donde hay cambio de proceso.
  correcta: 0
  justificacion: |
    Cuando termina el quantum, el reloj genera una interrupción que atiende el SO:

    1. Se guarda el **contexto** del proceso actual (PC, registros, etc.).
    2. Como parte de la rutina, el planificador de corto plazo pasa el proceso de **Running a Ready**.
    3. El planificador elige el próximo proceso según la cola de listos.
    4. Se carga el contexto del proceso elegido desde su PCB.

    **Sí** puede haber cambio de proceso; de hecho es una de las situaciones principales donde ocurre. Si hay otro proceso listo, se lo selecciona y el actual vuelve a la cola de listos.
- enunciado: (1R 1C2026 TT) ¿Cómo influyen las interrupciones en los cambios de estado de los procesos
    y qué consecuencias pueden generar en la planificación con desalojo?
  opciones:
  - texto: Solo provocan Running → Blocked; con desalojo, el proceso interrumpido pierde siempre la CPU
      aunque no haya otro listo
    explicacion: Una interrupción no bloquea al proceso que ejecuta, y si no hay otro listo puede seguir
      el mismo.
  - texto: Provocan Running → Ready (fin de quantum) y Blocked → Ready (fin de E/S); con desalojo, un
      desbloqueado más prioritario desaloja al actual
    explicacion: Correcta.
  - texto: Llevan un proceso de Blocked a Running al terminar su E/S; con desalojo, así se evita pasar
      por la cola de listos y se reduce la espera
    explicacion: 'Blocked → Running no existe: el proceso desbloqueado pasa a Ready y compite por la CPU.'
  - texto: No cambian estados, solo provocan cambios de modo; los cambios de estado los causan exclusivamente
      las syscalls del proceso
    explicacion: El fin de quantum y el fin de E/S son interrupciones y sí cambian estados.
  correcta: 1
  justificacion: |
    Las interrupciones pueden provocar cambios de estado:

    - **Running → Ready:** el proceso es desalojado por fin de quantum.
    - **Blocked → Ready:** una interrupción avisa que terminó la E/S que esperaba.
    - Opcionalmente, **Blocked/Suspended → Ready/Suspended**, por el mismo motivo.

    En algunos algoritmos **con desalojo**, una interrupción puede provocar un **cambio de proceso**: si el proceso recién desbloqueado tiene más prioridad que el que está en ejecución, lo desaloja.
- enunciado: '(1P 1C2025 TT) Verdadero o falso: "El planificador de largo plazo es el único que influye
    en el grado de multiprogramación."'
  opciones:
  - texto: 'Verdadero: es el único que decide qué procesos nuevos se admiten en el sistema'
    explicacion: Admitir procesos no es la única forma de cambiar cuántos hay en memoria.
  - texto: 'Falso: el de mediano plazo también lo modifica, al suspender (swap out) o reactivar (swap
      in) procesos'
    explicacion: Correcta.
  - texto: 'Falso: el de corto plazo también influye, porque decide cuántos procesos pasan a Running'
    explicacion: El de corto plazo solo decide el orden de ejecución entre los que ya están en memoria.
  - texto: 'Verdadero: el de mediano plazo mueve procesos entre colas, pero sin cambiar cuántos hay en
      memoria'
    explicacion: Suspender un proceso es sacarlo de memoria principal.
  correcta: 1
  justificacion: |
    **Falso.** El planificador de **largo plazo** regula cuántos procesos se admiten en el sistema, y por eso influye en el grado de multiprogramación, pero no es el único.

    El de **mediano plazo** también interviene: al suspender procesos (swap out) el grado de multiprogramación **disminuye**, y cuando los procesos suspendidos vuelven a memoria principal (swap in), **aumenta**.

    El de corto plazo no lo modifica: solo decide qué proceso de los que están listos usa la CPU.
- enunciado: (1P 2C2025 TM) Sobre los planificadores de largo, mediano y corto plazo, ¿cuál de estas afirmaciones
    es correcta?
  opciones:
  - texto: El de largo plazo maneja Ready → Running y es el único planificador que modifica el grado de
      multiprogramación
    explicacion: Ready → Running la maneja otro planificador, y el de largo plazo no es el único que modifica
      el grado.
  - texto: El de corto plazo maneja las suspensiones (swap out) cuando falta memoria principal
    explicacion: Las suspensiones son responsabilidad de otro planificador.
  - texto: El de corto plazo maneja Ready → Running y Running → Ready, y no modifica el grado de multiprogramación
    explicacion: Correcta.
  - texto: El de mediano plazo maneja New → Ready y decide según el algoritmo de CPU (FIFO, RR, SJF)
    explicacion: Las admisiones y los algoritmos de CPU corresponden a otros planificadores.
  correcta: 2
  justificacion: |
    | Planificador | Transiciones | Criterio de ejemplo | ¿Modifica el grado de multiprogramación? |
    |---|---|---|---|
    | **Largo plazo** | New → Ready (admisión); también interviene en Exit | Mezcla de procesos CPU bound e I/O bound | Sí, directamente |
    | **Mediano plazo** | Ready/Blocked → Suspended (swap out) y Suspended → Ready/Blocked (swap in) | Memoria disponible, prioridad, mejorar la mezcla CPU/I/O bound | Sí, al suspender o reactivar |
    | **Corto plazo** | Ready → Running y Running → Ready (desalojo) | Algoritmo de CPU: FIFO, RR, SJF, prioridades | No, solo decide el orden de ejecución |
- enunciado: (1P 2C2025 TT) ¿Desde cuál estado NO se puede pasar a ready?
  opciones:
  - texto: Nuevo (New)
    explicacion: New → Ready es la admisión que hace el planificador de largo plazo.
  - texto: En ejecución (Running)
    explicacion: Running → Ready es el desalojo, por ejemplo por fin de quantum.
  - texto: Bloqueado (Blocked)
    explicacion: Blocked → Ready ocurre cuando termina el evento que esperaba.
  - texto: Bloqueado/Suspendido
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    En el modelo de 7 estados:

    - **New → Ready:** admisión (largo plazo).
    - **Running → Ready:** desalojo (corto plazo).
    - **Blocked → Ready:** termina el evento esperado.
    - **Blocked/Suspended:** cuando termina el evento pasa a **Ready/Suspended** (sigue fuera de memoria); para volver a Ready tiene que hacer antes el swap in. Si se lo reactiva sin que haya terminado el evento, pasa a Blocked. Nunca pasa directo a Ready.
- enunciado: (1R 2C2025) ¿Sobre cuál de las siguientes transiciones actúa el planificador de mediano plazo?
  opciones:
  - texto: susp/blocked -> blocked
    explicacion: Es un swap in, pero no es la única opción correcta.
  - texto: ready -> susp/ready
    explicacion: Es un swap out, pero no es la única opción correcta.
  - texto: susp/ready -> ready
    explicacion: Es un swap in, pero no es la única opción correcta.
  - texto: Todas son correctas
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    El planificador de mediano plazo decide qué procesos se suspenden (**swap out**) y cuáles vuelven a memoria (**swap in**):

    - **susp/blocked → blocked:** swap in de un proceso que sigue esperando un evento.
    - **ready → susp/ready:** swap out de un proceso listo, por ejemplo por falta de memoria.
    - **susp/ready → ready:** swap in de un proceso listo.

    Las tres transiciones son suyas, así que la respuesta es **d) Todas son correctas**.
- enunciado: (1P 1C2026 TM) ¿Cómo se le llama al número de procesos presentes simultáneamente en la memoria
    principal?
  opciones:
  - texto: Grado de multiprogramación
    explicacion: Correcta.
  - texto: Grado de multiprocesamiento
    explicacion: El multiprocesamiento tiene que ver con varias CPUs ejecutando a la vez.
  - texto: Throughput del sistema
    explicacion: El throughput mide procesos terminados por unidad de tiempo.
  - texto: Largo de la cola de listos
    explicacion: En memoria también hay procesos bloqueados y el que está ejecutando.
  correcta: 0
  justificacion: |
    El **grado de multiprogramación** es la cantidad de procesos cargados en memoria principal en un momento dado. Incluye a los que están en Ready, Running y Blocked (no a los suspendidos, que están en disco).

    Lo regulan el planificador de largo plazo (admitiendo procesos) y el de mediano plazo (suspendiendo y reactivando). Es la métrica que usa el SO para conocer su nivel de carga.
- enunciado: (1R 1C2026 TM) ¿Qué planificadores controlan el grado de multiprogramación?
  opciones:
  - texto: Solo el de largo plazo
    explicacion: 'No es el único: suspender y reactivar también cambia cuántos procesos hay en memoria.'
  - texto: Los de largo y mediano plazo
    explicacion: Correcta.
  - texto: Los de corto y largo plazo
    explicacion: El de corto plazo solo elige entre los procesos que ya están en memoria.
  - texto: 'Los tres: largo, mediano y corto plazo'
    explicacion: El de corto plazo no cambia cuántos procesos hay en memoria.
  correcta: 1
  justificacion: |
    - **Largo plazo:** admite procesos nuevos (New → Ready) y así aumenta el grado de multiprogramación.
    - **Mediano plazo:** lo baja al suspender procesos (swap out) y lo sube al reactivarlos (swap in).
    - **Corto plazo:** no lo modifica; solo decide cuál de los procesos listos ejecuta.
- enunciado: (1P 1C2026 TT) El SO mide su nivel de carga con el grado de multiprogramación, que regulan
    los planificadores de largo y mediano plazo. En ese contexto, ¿para qué sirve el estado Exit?
  opciones:
  - texto: Para liberar de inmediato toda la memoria y el PCB del proceso, apenas ejecuta su última instrucción
    explicacion: Si se liberara todo de inmediato, no quedaría información del proceso para consultar
      después.
  - texto: Para que el planificador de largo plazo pueda volver a admitir al mismo proceso más adelante
    explicacion: 'Un proceso que terminó no vuelve a admitirse: si se lo ejecuta otra vez, es un proceso
      nuevo.'
  - texto: 'Para guardar un tiempo datos del proceso terminado, como estadísticas o su valor de retorno, hasta que el padre los recoja'
    explicacion: Correcta.
  - texto: Para dejar al proceso suspendido en disco hasta que el usuario decida si lo reanuda o no
    explicacion: Eso describe a un proceso suspendido, no a uno terminado.
  correcta: 2
  justificacion: |
    La resolución oficial responde las tres partes de la pregunta:

    - **Métrica de carga:** el **grado de multiprogramación** (cantidad de procesos en memoria listos para ejecutar en un momento dado).
    - **Planificadores que la afectan:** el de **largo plazo** es el que más influye, porque controla cuántos procesos ingresan; el de **mediano plazo** regula la carga suspendiendo o reactivando procesos.
    - **Estado Exit:** sirve para **guardar temporalmente información** de un proceso que ya terminó de ejecutar. Por ejemplo, estadísticas de ejecución (tiempo de ejecución, etc.) o su estado de retorno (éxito, error), para que el padre o el SO puedan consultarlos.
- enunciado: (1R 1C2026 TM) Se analizan las transiciones Running → Ready, Suspended/Ready → Ready, Running
    → Blocked y Ready → Blocked. ¿Cuál de estas afirmaciones es correcta?
  opciones:
  - texto: 'Todas son posibles: Ready → Blocked ocurre cuando un proceso que está en la cola de listos
      solicita una E/S'
    explicacion: Un proceso en Ready no ejecuta instrucciones, así que no puede pedir una E/S.
  - texto: Suspended/Ready → Ready la decide el planificador de largo plazo, porque vuelve a admitir al
      proceso en el sistema
    explicacion: 'El proceso ya estaba admitido: traerlo de vuelta a memoria es un swap in.'
  - texto: 'Running → Ready no la decide ningún planificador: la provoca siempre el reloj del hardware
      al terminar el quantum'
    explicacion: El reloj genera la interrupción, pero desalojar al proceso es una decisión del planificador.
  - texto: Ready → Blocked es imposible, y Running → Blocked no la decide ningún planificador sino el
      propio proceso
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    | Transición | ¿Posible? | ¿Quién decide? | Ejemplo |
    |---|---|---|---|
    | **Running → Ready** | Sí | Planificador de corto plazo | Desalojo por fin de quantum, o para ejecutar otro más prioritario |
    | **Suspended/Ready → Ready** | Sí | Planificador de mediano plazo | Hay memoria disponible y se sube el grado de multiprogramación |
    | **Running → Blocked** | Sí | Ningún planificador | El proceso se bloquea esperando el resultado de una E/S |
    | **Ready → Blocked** | No | — | Para bloquearse el proceso tiene que estar ejecutando |
---

Simulacro con preguntas de teoría de parciales anteriores (primeros parciales y recuperatorios, 2024 a 2026) sobre estados de los procesos, planificadores y grado de multiprogramación, agrupadas por tema. Cada pregunta indica entre paréntesis el examen de donde sale.

Las preguntas de respuesta breve, verdadero o falso y desarrollo se reformularon como multiple choice. La respuesta correcta es siempre la de la resolución oficial, y al acertar se muestra su justificación.
