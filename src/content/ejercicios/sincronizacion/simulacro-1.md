---
titulo: 'Teoría de parciales: Concurrencia y sincronización'
tema: parcial-1/sincronizacion
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S1
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- condicion-de-carrera
- inversion-de-prioridades
preguntas:
- enunciado: (1P 1C2026 TM, desarrollo 5) ¿Qué es el problema de inversión de prioridades y cómo puede
    solucionarse?
  opciones:
  - texto: Un proceso de baja prioridad nunca llega a ejecutar porque siempre hay otros más prioritarios
      en ready; se soluciona con aging
    explicacion: Eso es starvation (inanición) por prioridades, y el aging es su solución. La inversión
      involucra un recurso retenido.
  - texto: Un proceso prioritario queda bloqueado mucho tiempo por un recurso que retiene uno menos prioritario;
      se soluciona con herencia de prioridades
    explicacion: Correcta.
  - texto: El planificador pasa a ejecutar los procesos en orden inverso de prioridad cuando detecta un
      deadlock entre ellos; se soluciona matando al de menor prioridad
    explicacion: 'El planificador no invierte el orden, y no hay deadlock: el de baja prioridad eventualmente
      libera el recurso.'
  - texto: Dos procesos de igual prioridad se ceden el recurso mutuamente todo el tiempo sin progresar;
      se soluciona asignándoles prioridades distintas
    explicacion: Eso describe un livelock, no una inversión de prioridades.
  correcta: 1
  justificacion: |
    La **inversión de prioridades** se da en un sistema con planificación por prioridades cuando un proceso **más
    prioritario** queda bloqueado de forma prolongada esperando un recurso (por ejemplo un semáforo) que retiene un
    proceso **menos prioritario**. Si además aparece un proceso de prioridad intermedia que no usa el recurso, desaloja
    al de baja prioridad y el de alta sigue esperando: en la práctica el intermedio "le gana" al más prioritario.

    La solución es la **herencia de prioridades**: mientras el proceso de baja prioridad retiene el recurso que necesita
    el de alta, hereda temporalmente la prioridad de este último, así nadie de prioridad intermedia puede desalojarlo.
    Al liberar el recurso vuelve a su prioridad original.
- enunciado: |
    (1P 1C2026 TM, desarrollo 5) Con planificación por prioridades con desalojo y prioridades P1 < P2 < P3:

    - t=0: P1 hace `WAIT(semR)` y adquiere el recurso R.
    - t=1: llega P3, desaloja a P1 y hace `WAIT(semR)`: se bloquea, y vuelve a ejecutar P1.
    - t=2: llega P2, que no necesita R.

    ¿Qué ocurre a partir de t=2 y qué cambiaría con herencia de prioridades?
  opciones:
  - texto: P3 desaloja a P1 y le quita el recurso R, porque es el proceso más prioritario del sistema
    explicacion: 'Un semáforo no expropia recursos: P3 sigue bloqueado hasta que P1 haga SIGNAL(semR).'
  - texto: Se produce un deadlock entre P1 y P3, porque P3 espera a P1 y P1 no puede ejecutar mientras
      esté P2
    explicacion: 'No hay espera circular: P1 no espera nada de P3. Cuando P2 termine o se bloquee, P1
      avanza y libera R.'
  - texto: P2 desaloja a P1 y ejecuta mientras P3, el más prioritario, sigue bloqueado; con herencia,
      P1 tomaría la prioridad de P3
    explicacion: Correcta.
  - texto: 'No hay ningún problema: P3 espera exactamente lo mismo que esperaría sin P2, porque P1 igual
      tiene que terminar de usar R'
    explicacion: 'P3 espera más: todo el tiempo que ejecuta P2 se suma a la espera de P3, aunque P2 sea
      menos prioritario.'
  correcta: 2
  justificacion: |
    Es la traza de la resolución oficial. En t=2, P2 tiene más prioridad que P1, así que lo **desaloja**; como no
    necesita R, sigue ejecutando. P3 no puede ejecutar a pesar de ser **más prioritario que P2**, porque está bloqueado
    esperando R, que retiene P1, que a su vez no ejecuta porque lo desalojó P2. Eso es la **inversión de prioridades**.

    Con **herencia de prioridades**, en t=1 (cuando P3 se bloquea por R) P1 pasaría a tener la prioridad de P3. En t=2
    P2 no podría desalojarlo; P1 terminaría de usar R, haría `SIGNAL(semR)`, volvería a su prioridad original y P3
    ejecutaría antes que P2.
- enunciado: '(1R 1C2026 TM, single choice i) Los semáforos, aún bien utilizados, pueden crear problemas
    en la planificación si el algoritmo de planificación es:'
  opciones:
  - texto: Round Robin (RR)
    explicacion: 'RR no mira prioridades: el que retiene el semáforo recibe su quantum como todos y termina
      liberándolo.'
  - texto: FIFO
    explicacion: 'FIFO atiende por orden de llegada: no hay un proceso intermedio que "se cuele" delante
      del más prioritario.'
  - texto: Prioridades
    explicacion: Correcta.
  - texto: SJF
    explicacion: SJF puede generar starvation por sí mismo, pero el problema típico ligado a semáforos
      es la inversión de prioridades.
  correcta: 2
  justificacion: |
    Aun con los `wait`/`signal` bien puestos (sin condición de carrera ni deadlock), un algoritmo por **prioridades**
    puede generar **inversión de prioridades**: un proceso muy prioritario se bloquea en un semáforo que tiene tomado uno
    poco prioritario, y procesos de prioridad intermedia desalojan a este último, alargando indefinidamente la espera
    del más prioritario. Se mitiga con **herencia de prioridades**. En RR, FIFO o SJF no existe este efecto, porque la
    decisión de planificación no depende de una prioridad que el semáforo pueda "invertir".
- enunciado: (1P 1C2024 TM, V/F 4b) "Si dos hilos acceden concurrentemente a una variable global, no es
    necesario que ambos la modifiquen para que se genere una condición de carrera." ¿Verdadero o falso?
  opciones:
  - texto: 'Falso: para que haya condición de carrera los dos hilos tienen que estar escribiendo la variable
      al mismo tiempo'
    explicacion: 'Alcanza con un escritor: el que lee puede ver un valor a medio actualizar.'
  - texto: 'Verdadero: alcanza con que ambos la lean a la vez'
    explicacion: 'Si nadie escribe, todas las lecturas ven el mismo valor: no hay condición de carrera.'
  - texto: 'Falso: si la variable es global el SO la protege automáticamente y no puede haber una condición
      de carrera'
    explicacion: El SO no protege las variables globales de un proceso; la sincronización es responsabilidad
      del programador.
  - texto: 'Verdadero: alcanza con que uno de los dos la modifique'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Verdadero.** Por las **condiciones de Bernstein**, hay condición de carrera cuando dos o más hilos acceden de
    forma concurrente al mismo recurso y **al menos uno** de ellos lo modifica. No hace falta que ambos escriban: si uno
    escribe y el otro lee, el lector puede obtener un valor viejo o inconsistente según el orden de ejecución. El único
    caso sin condición de carrera es que **todos** los accesos sean de lectura.
- enunciado: (1P 1C2024 TT, V/F 4a) "En un sistema donde los procesos compiten por los recursos es necesario
    protegerlos implementando alguna solución que nos brinde mutua exclusión." ¿Verdadero o falso?
  opciones:
  - texto: 'Verdadero siempre: cualquier acceso concurrente a un recurso, aunque sea de solo lectura,
      requiere algún tipo de mutua exclusión'
    explicacion: Si todos los accesos son de lectura no se cumple Bernstein y no hace falta mutua exclusión.
  - texto: 'Falso siempre: la competencia la resuelve el planificador, que nunca deja que dos procesos
      usen el mismo recurso a la vez'
    explicacion: El planificador reparte la CPU; no impide que dos procesos accedan a la misma variable
      compartida.
  - texto: 'Depende: si el SO administra el recurso, no hace falta; si lo usan concurrentemente, sí, solo
      si alguno lo modifica'
    explicacion: Correcta.
  - texto: 'Verdadero solo en multiprocesadores: en un monoprocesador no hay ejecución simultánea'
    explicacion: 'En un monoprocesador también hay concurrencia: un cambio de proceso en el medio de una
      modificación alcanza.'
  correcta: 2
  justificacion: |
    La resolución oficial acepta **dos lecturas** del enunciado:

    - Si "competir" significa que el **sistema operativo** es el único responsable de administrar los recursos (los
      procesos se los piden y el SO los asigna), la afirmación es **falsa**: los procesos no tienen que implementar
      nada, lo resuelve el SO.
    - Si "competir" significa que los procesos **usan los recursos de forma concurrente**, es **verdadera** sí y sólo sí
      al menos uno de los procesos/hilos los modifica (condiciones de Bernstein). Si todos solo leen, no hace falta
      mutua exclusión.
- enunciado: (1R 1C2025 TM, teoría 4) ¿Qué tiene que cumplirse para que exista una condición de carrera?
    ¿Podría un proceso de usuario solucionar sus condiciones de carrera deshabilitando interrupciones?
  opciones:
  - texto: Que varios procesos lo modifiquen a la vez; y sí, es lo más simple en un monoprocesador
    explicacion: No hace falta que todos modifiquen (alcanza con uno) y el proceso de usuario no puede
      deshabilitar interrupciones.
  - texto: Más de un proceso accediendo al mismo recurso y al menos uno modificándolo; y no, es una instrucción
      privilegiada
    explicacion: Correcta.
  - texto: Accesos concurrentes con al menos uno que modifique; y sí, siempre que el proceso vuelva a
      habilitarlas al salir de la sección crítica
    explicacion: 'La condición está bien, pero deshabilitar interrupciones es privilegiado: un proceso
      de usuario no puede hacerlo.'
  - texto: Que haya más de un procesador ejecutando en paralelo; y no, porque deshabilitar interrupciones
      solo afecta al procesador local
    explicacion: También hay condición de carrera en monoprocesador; y el motivo por el que no puede es
      que la instrucción es privilegiada.
  correcta: 1
  justificacion: |
    **Condiciones de Bernstein:** más de un proceso/hilo accediendo de forma **concurrente** a un mismo recurso, con
    **al menos uno** de ellos modificándolo.

    Un proceso de usuario **no** puede resolver sus condiciones de carrera deshabilitando interrupciones: deshabilitar y
    habilitar interrupciones son **instrucciones privilegiadas**, que solo puede ejecutar el sistema operativo en modo
    kernel. Si un proceso de usuario lo intentara, la CPU lanzaría una excepción. El SO sí usa esta técnica
    internamente, por ejemplo para que su propio código de `wait`/`signal` sea atómico en un monoprocesador.
- enunciado: (1R 1C2025 TT, teoría 4) En un sistema **monoprocesador**, ¿de qué manera puede quedar inconsistente
    una variable que varios procesos modifican concurrentemente? ¿Algún algoritmo de planificación impide
    que ocurra?
  opciones:
  - texto: Un cambio de proceso a mitad de la modificación, y otro proceso la modifica; bajo ciertas condiciones,
      un algoritmo sin desalojo
    explicacion: Correcta.
  - texto: 'No puede pasar: en un monoprocesador los procesos nunca ejecutan a la vez, así que ningún
      algoritmo necesita impedirlo'
    explicacion: 'Concurrencia no es paralelismo: basta con que el cambio de proceso ocurra en el medio
      de la modificación.'
  - texto: Una interrupción de E/S corrompe el valor que está en memoria; lo impide cualquier algoritmo
      con desalojo porque atiende la interrupción al instante
    explicacion: La interrupción no corrompe la memoria; el problema es el cambio de proceso que puede
      provocar, y el desalojo lo favorece.
  - texto: Un cambio de proceso a mitad de la modificación; lo impide Round Robin, siempre que el quantum
      sea mayor que la sección crítica
    explicacion: 'El quantum puede vencer justo en el medio de la sección crítica aunque sea grande: RR
      no lo impide.'
  correcta: 0
  justificacion: |
    Aunque haya un solo procesador, la modificación de una variable (por ejemplo `x = x + 1`) son varias instrucciones
    de máquina. Si en el medio llega una **interrupción** que termina en un **cambio de proceso**, y el siguiente
    proceso también modifica la variable, al volver el primero escribe un valor calculado con datos viejos y la variable
    queda inconsistente.

    Según la resolución oficial, **bajo ciertas circunstancias** los algoritmos **sin desalojo** evitan la situación:
    el proceso ejecuta hasta que hace una llamada al sistema (o termina), así que las interrupciones no generan un
    cambio de proceso en el medio de la modificación. La condición es que el proceso no haga una syscall bloqueante
    dentro de la sección crítica; por eso no es una solución general a la condición de carrera.
- enunciado: |
    (1P 2C2025 TM, desarrollo 2) Dos hilos idénticos incrementan un contador compartido. Se quiere resolver la condición de carrera **deshabilitando interrupciones**. ¿Qué va en (A) y en (B)?

    ```c
    int contador = 0; // variable compartida

    // Hilo 1 y Hilo 2 (idénticos)
    while (true) {
      /* (A) */
      contador++;
      /* (B) */
    }
    ```
  opciones:
  - texto: (A) habilitar interrupciones; (B) deshabilitar interrupciones
    explicacion: 'Invertido: así el incremento corre con las interrupciones habilitadas y puede haber
      un cambio de hilo en el medio.'
  - texto: (A) deshabilitar interrupciones; (B) habilitar interrupciones
    explicacion: Correcta.
  - texto: (A) deshabilitar interrupciones; (B) nada, se vuelven a habilitar solas en el próximo fin de
      quantum
    explicacion: 'Con las interrupciones deshabilitadas no llega el fin de quantum: el hilo monopolizaría
      la CPU.'
  - texto: (A) wait(mutex) con mutex en 0; (B) signal(mutex)
    explicacion: 'Esa es la versión con semáforos, y un mutex en 0 hace que el primer wait bloquee para
      siempre: debe iniciar en 1.'
  correcta: 1
  justificacion: |
    Hay **condición de carrera**: los dos hilos acceden concurrentemente a `contador` y ambos lo modifican, así que el
    resultado depende del orden de ejecución.

    - **Con semáforos:** `mutex = 1`; `wait(mutex)` antes de `contador++` y `signal(mutex)` después.
    - **Deshabilitando interrupciones:** deshabilitar **antes** del incremento y habilitar **después**. Mientras las
      interrupciones están deshabilitadas no puede haber fin de quantum ni otro evento que provoque un cambio de hilo.

    Aclaración: en la transcripción de la resolución oficial el orden aparece invertido (habilitar antes, deshabilitar
    después); lo correcto es deshabilitar al entrar y habilitar al salir. Además, en la práctica esto solo lo puede
    hacer código del SO, porque son instrucciones privilegiadas.
- enunciado: (1P 2C2025 TM, desarrollo 2) ¿Qué desventajas tiene resolver una condición de carrera **deshabilitando
    interrupciones** con respecto a usar semáforos?
  opciones:
  - texto: Genera espera activa, porque el proceso tiene que consultar en un bucle si las interrupciones
      ya volvieron a estar habilitadas
    explicacion: 'No hay espera activa: nadie consulta en un bucle, simplemente no se atienden interrupciones
      durante la sección crítica.'
  - texto: Es más lenta que un semáforo, porque requiere hacer una syscall por cada instrucción que se
      ejecuta dentro de la sección crítica
    explicacion: Son dos instrucciones (deshabilitar y habilitar), no una por instrucción de la sección
      crítica.
  - texto: No garantiza mutua exclusión ni siquiera en un monoprocesador
    explicacion: 'En un monoprocesador sí la garantiza: sin interrupciones no hay forma de que el SO tome
      el control y cambie de proceso.'
  - texto: 'No escala en multiprocesadores (solo afecta a la CPU local), y un proceso de usuario no puede hacerlo porque es una instrucción privilegiada'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Las desventajas que pide la resolución oficial son dos:

    - **No es escalable en multiprocesadores:** deshabilitar interrupciones afecta solo al núcleo que ejecuta la
      instrucción; para garantizar mutua exclusión habría que ordenar deshabilitarlas en **todos** los núcleos, con un
      costo muy alto (y los otros núcleos igual podrían estar ejecutando en paralelo).
    - **Los procesos de usuario no pueden usarla:** es una instrucción privilegiada, solo disponible en modo kernel.

    Un semáforo, en cambio, es una syscall que cualquier proceso puede invocar y funciona igual con uno o varios
    procesadores.
- enunciado: |
    (1P 2C2025 TT, desarrollo 2) Dos hilos ejecutan `CONT = CONT + 1` sobre un contador compartido inicializado en 0. Cada incremento son tres instrucciones:

    ```
    REGISTRO <- MEMORIA
    REGISTRO <- REGISTRO + 1
    MEMORIA  <- REGISTRO
    ```

    El hilo 1 es interrumpido justo después de su segunda instrucción; el hilo 2 ejecuta sus tres instrucciones y luego se retoma el hilo 1. ¿Cuánto vale CONT al final?
  opciones:
  - texto: 1, porque el hilo 1 escribe el valor que había calculado antes del cambio
    explicacion: Correcta.
  - texto: '2, porque cada uno de los dos hilos sumó 1 al contador y las dos escrituras quedan registradas'
    explicacion: Sería 2 si los incrementos no se intercalaran; acá el hilo 1 ya había leído el 0 antes
      del cambio.
  - texto: 0, porque el hilo 1 pisa el contador con el valor original que había leído al principio
    explicacion: El hilo 1 no escribe el valor original (0) sino el que calculó en su registro (0 + 1).
  - texto: 'No está definido: el hilo 1 genera una excepción al retomar con un registro que quedó desactualizado'
    explicacion: Al retomar se restaura su contexto (incluido el registro con 1); no hay ninguna excepción.
  correcta: 0
  justificacion: |
    Es una **condición de carrera**: los dos hilos modifican concurrentemente el mismo recurso y el resultado depende
    del orden de ejecución.

    | Paso | Hilo | Instrucción | REGISTRO (del hilo) | CONT |
    |---|---|---|---|---|
    | 1 | H1 | REGISTRO <- MEMORIA | 0 | 0 |
    | 2 | H1 | REGISTRO <- REGISTRO + 1 | 1 | 0 |
    | 3 | H2 | las tres instrucciones | 1 | 1 |
    | 4 | H1 | MEMORIA <- REGISTRO | 1 | **1** |

    El hilo 1 tenía guardado en su contexto el registro con 1; al retomar lo escribe en memoria y pisa el incremento
    del hilo 2. Se hicieron dos incrementos pero CONT queda en **1**.
- enunciado: (1R 1C2026 TT, respuesta breve 2b) ¿Qué problema puede ocurrir cuando dos o más procesos
    modifican un mismo recurso compartido al mismo tiempo?
  opciones:
  - texto: Deadlock
    explicacion: El deadlock es una espera circular por recursos; acá nadie espera a nadie, el problema
      es el acceso simultáneo.
  - texto: Inversión de prioridades
    explicacion: Es un problema de planificación por prioridades con recursos retenidos, no del acceso
      simultáneo.
  - texto: Condición de carrera
    explicacion: Correcta.
  - texto: Espera activa
    explicacion: La espera activa es una forma de esperar (en un bucle), no el problema que provoca el
      acceso simultáneo.
  correcta: 2
  justificacion: |
    Es una **condición de carrera** (race condition): dos o más procesos acceden concurrentemente a un recurso
    compartido y al menos uno lo modifica (condiciones de Bernstein), de modo que el resultado final depende del orden
    en que se intercalen sus instrucciones. Se resuelve garantizando **mutua exclusión** sobre la sección crítica, por
    ejemplo con semáforos.
---

Este simulacro reúne preguntas de **teoría** de parciales anteriores (2024 a 2026) sobre **sincronización**: inversión de prioridades y condición de carrera. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación de cada una resume la resolución oficial de la cátedra.
