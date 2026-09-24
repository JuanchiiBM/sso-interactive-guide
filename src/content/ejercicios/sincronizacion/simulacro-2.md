---
titulo: 'Teoría de parciales: Concurrencia y sincronización'
tema: parcial-1/sincronizacion
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S2
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- espera-activa
- semaforos
preguntas:
- enunciado: (1P 1C2024 TM, V/F 4a) "Al garantizar mutua exclusión, siempre es más performante utilizar
    semáforos con bloqueo que instrucciones de hardware como testAndSet o swapAndExchange." ¿Verdadero
    o falso?
  opciones:
  - texto: 'Verdadero: la espera activa de testAndSet siempre desperdicia CPU, así que bloquear al proceso
      es siempre la mejor opción'
    explicacion: La espera activa desperdicia CPU, pero bloquear también tiene un costo (syscalls y cambios
      de contexto).
  - texto: 'Falso: con una sección crítica muy corta y procesos en paralelo, esperar activamente cuesta
      menos que bloquear'
    explicacion: Correcta.
  - texto: 'Falso: testAndSet es siempre más performante, porque no requiere ninguna syscall ni cambios
      de contexto para funcionar'
    explicacion: 'Tampoco es "siempre": con secciones críticas largas o mucha contención la espera activa
      desperdicia mucha CPU.'
  - texto: 'Verdadero: testAndSet no garantiza mutua exclusión en multiprocesadores'
    explicacion: TestAndSet es atómica también en multiprocesadores (bloquea el bus); justamente ahí es
      donde mejor rinde.
  correcta: 1
  justificacion: |
    **Falso.** Si se dan estas condiciones:

    - la sección crítica es tan corta que el tiempo de los cambios de contexto por bloquear y desbloquear al proceso es
      mayor que lo que tendría que esperar para entrar, y
    - hay más de un procesador y los procesos que compiten ejecutan en **paralelo**,

    entonces conviene una solución **con espera activa**, como testAndSet o swapAndExchange. En ese caso también
    rendiría más un semáforo con espera activa que uno con bloqueo, pero las soluciones de hardware son las más
    performantes porque no requieren syscalls (ni los cambios de modo y contexto asociados).
- enunciado: (1P 1C2024 TT, V/F 4b) "Las soluciones de software conocidas no son performantes debido a
    que incurren en mucha espera activa." ¿Verdadero o falso?
  opciones:
  - texto: 'Verdadero: toda espera activa es peor que el bloqueo, porque ocupa la CPU sin hacer ningún
      trabajo útil mientras espera'
    explicacion: Bloquear también tiene costo; la comparación depende de cuánto dura la espera.
  - texto: 'Falso: tienen espera activa, pero con poca concurrencia, sección crítica rápida y varios núcleos
      pueden rendir más'
    explicacion: Correcta.
  - texto: 'Falso: las soluciones de software como Peterson no tienen espera activa, porque no usan ninguna
      instrucción especial de hardware'
    explicacion: 'Sí tienen espera activa: al no poder bloquear, esperan en un bucle while.'
  - texto: 'Verdadero: además, necesitan una syscall por cada intento de entrar'
    explicacion: Las soluciones de software corren enteras en modo usuario, sin syscalls.
  correcta: 1
  justificacion: |
    **Falso.** Es cierto que las soluciones de software (Peterson, Dekker) tienen espera activa: al no poder bloquear
    al proceso, esperan en un bucle. Pero que sean más o menos performantes **depende del escenario**. Con una sección
    crítica con poca probabilidad de concurrencia, cuyo código se ejecuta rápido, y en un sistema con varios núcleos,
    la espera activa dura muy poco y puede resultar más eficiente que una solución con bloqueo, que paga syscalls y
    cambios de contexto.
- enunciado: (1P 1C2025 TT, teoría 4) En un sistema con **alto uso de CPU** y **condiciones de carrera
    muy frecuentes**, ¿es más performante usar semáforos con bloqueo o una solución con test and set?
  opciones:
  - texto: 'Semáforos con bloqueo: test and set hace espera activa, que con tanta contención suma todavía
      más uso de CPU'
    explicacion: Correcta.
  - texto: 'Test and set, porque evita el costo de las syscalls y de los cambios de contexto que implica bloquear con semáforos'
    explicacion: Evita las syscalls, pero con mucha contención los procesos pasan mucho tiempo girando
      en el bucle y consumen CPU.
  - texto: 'Da lo mismo: ambos garantizan mutua exclusión y el costo lo determina únicamente el largo
      de la sección crítica'
    explicacion: 'La contención y la carga de CPU también importan: la espera activa compite por la CPU
      que ya está saturada.'
  - texto: Test and set, porque con condiciones de carrera frecuentes los procesos con semáforos se bloquearían
      todo el tiempo
    explicacion: 'Bloquearse es justamente lo deseable acá: libera la CPU para otros procesos en lugar
      de girar esperando.'
  correcta: 0
  justificacion: |
    Conviene una solución **con bloqueo**, como los semáforos. Test and set es una solución con soporte de hardware
    (una instrucción atómica específica) que genera **espera activa**: el proceso que no puede entrar sigue ejecutando
    un bucle. Si la CPU ya está muy cargada y las condiciones de carrera (la contención por la sección crítica) son muy
    frecuentes, esa espera activa agrega todavía más uso de CPU y agrava el problema. Con bloqueo, los procesos que
    esperan salen de la CPU y la dejan para quien puede progresar.
- enunciado: '(1P 2C2025 TM, single choice 6) La mutua exclusión implementada con espera activa puede
    obtener mejor performance que una variante con bloqueo si:'
  opciones:
  - texto: La sección crítica es larga y hay concurrencia
    explicacion: 'Con una sección crítica larga la espera activa quema mucha CPU: conviene bloquear.'
  - texto: La sección crítica es corta y hay paralelismo
    explicacion: Correcta.
  - texto: En la sección crítica se accede a pocos recursos compartidos
    explicacion: La cantidad de recursos no es lo que decide; importa cuánto dura la espera.
  - texto: Ninguna es correcta
    explicacion: La b) es correcta.
  correcta: 1
  justificacion: |
    La espera activa conviene cuando la espera es **muy breve**: si la sección crítica es **corta** y los procesos
    ejecutan en **paralelo** (en distintos procesadores), el que espera va a poder entrar enseguida, y girar unos pocos
    ciclos cuesta menos que bloquearse y desbloquearse (syscall, cambios de modo y de contexto). Con secciones críticas
    largas, o en un monoprocesador (donde el que tiene la sección crítica no avanza mientras el otro gira), la espera
    activa es peor.
- enunciado: '(1P 2C2025 TT, single choice 6) La mutua exclusión **sin espera activa** puede lograrse:'
  opciones:
  - texto: Con la instrucción test_and_set
    explicacion: 'Test and set se usa dentro de un bucle: el que no consigue el lock sigue girando (espera
      activa).'
  - texto: Deshabilitando interrupciones
    explicacion: Correcta.
  - texto: Con soluciones de software, como Peterson
    explicacion: 'Peterson espera en un bucle while: tiene espera activa.'
  - texto: No es posible
    explicacion: 'Sí es posible: deshabilitando interrupciones (y también con semáforos con bloqueo, que
      no está entre las opciones).'
  correcta: 1
  justificacion: |
    Al **deshabilitar interrupciones** (en un monoprocesador, y desde el SO), nadie puede quitarle la CPU al proceso
    dentro de la sección crítica, así que no existe otro proceso "esperando" en un bucle: no hay espera activa.

    - **test_and_set** y **Peterson** (software) se implementan con un bucle que reintenta hasta poder entrar: son
      soluciones con **espera activa**.
    - La otra forma de evitar la espera activa, los semáforos con bloqueo, no figura entre las opciones.
- enunciado: (1R 1C2026 TM, single choice iii) ¿Cuál de las siguientes opciones **NO** sufre espera activa
    en ningún caso?
  opciones:
  - texto: Solución de Peterson
    explicacion: 'Peterson espera en un bucle: siempre tiene espera activa.'
  - texto: Semáforos
    explicacion: Un semáforo puede implementarse con espera activa (spinlock); no está libre "en ningún
      caso".
  - texto: La instrucción de hardware Test and Set
    explicacion: 'Se usa en un bucle de reintento: tiene espera activa.'
  - texto: Deshabilitar interrupciones
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Deshabilitar interrupciones** no tiene espera activa en ningún caso: mientras están deshabilitadas nadie más
    ejecuta (en un monoprocesador), así que no hay procesos girando para entrar.

    - **Peterson** y **Test and Set** siempre esperan en un bucle.
    - Los **semáforos** normalmente se implementan con bloqueo, pero también existen implementaciones con espera activa
      (semáforos "spinlock"). Además, el propio código de `wait`/`signal` puede usar test and set internamente, con una
      espera activa breve. Por eso no son la respuesta a "en ningún caso".
- enunciado: (1R 1C2026 TT, respuesta breve 2a) ¿Qué comportamiento tienen las soluciones de software
    y algunas soluciones de hardware al intentar acceder a un recurso no disponible, pudiendo afectar
    el rendimiento de otros procesos?
  opciones:
  - texto: Bloqueo del proceso en la cola del recurso
    explicacion: Bloquear requiere del SO; las soluciones de software y test and set no bloquean.
  - texto: Livelock
    explicacion: Es un bloqueo entre procesos que siguen ejecutando sin progresar, no la forma de esperar
      de estas soluciones.
  - texto: Condición de carrera
    explicacion: Es lo que estas soluciones buscan evitar, no el comportamiento que tienen al esperar.
  - texto: Espera activa
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Espera activa** (busy waiting). Las soluciones de software (Peterson, Dekker) y algunas de hardware (test and set,
    swap) no pueden bloquear al proceso, así que cuando el recurso no está disponible el proceso queda ejecutando un
    bucle que vuelve a consultar hasta poder entrar. Mientras tanto consume CPU que podrían usar otros procesos, lo que
    afecta su rendimiento, sobre todo si la espera es larga.
- enunciado: (1P 1C2025 TM, teoría 3) Los semáforos cumplen los requisitos de una buena solución a la
    condición de carrera. ¿Cómo cumplen, en particular, el de **espera limitada**?
  opciones:
  - texto: Solo un proceso puede adquirir el semáforo a la vez y el resto se queda bloqueado esperando
    explicacion: Eso explica la mutua exclusión, no la espera limitada.
  - texto: Solo los procesos que también están haciendo wait pueden impedir que otro adquiera el semáforo
    explicacion: Eso explica el requisito de progreso.
  - texto: 'Los procesos se bloquean en la cola FIFO del semáforo y cada signal despierta al siguiente en orden, así nadie espera para siempre'
    explicacion: Correcta.
  - texto: El SO le da a cada proceso un tiempo máximo dentro de la sección crítica y lo desaloja cuando
      se vence
    explicacion: El semáforo no limita el tiempo dentro de la sección crítica; limita cuánto espera cada
      uno para entrar.
  correcta: 2
  justificacion: |
    Según la resolución oficial, los semáforos cumplen los cuatro requisitos:

    | Requisito | Cómo lo cumple el semáforo |
    |---|---|
    | Mutua exclusión | Solo un proceso puede adquirir el semáforo a la vez; el resto queda bloqueado. |
    | Progreso | Los únicos que pueden evitar que otro lo adquiera son los que también están haciendo `wait`. |
    | Espera limitada | Los procesos se bloquean en una **cola** del semáforo y se despiertan con cada `signal`, respetando el orden de bloqueo. |
    | Velocidad de los procesos | Funciona bien sin importar la velocidad relativa de los procesos. |
- enunciado: (1P 1C2025 TM, teoría 3) `wait` y `signal` operan sobre una variable compartida (el valor
    del semáforo). ¿Cómo podría el SO lograr que estas syscalls sean **atómicas**?
  opciones:
  - texto: Protegiendo la variable con testAndSet o deshabilitando las interrupciones
    explicacion: Correcta.
  - texto: 'Usando otro semáforo dentro de wait y signal, que proteja la variable del semáforo original'
    explicacion: 'Es circular: ese otro semáforo necesitaría a su vez que su wait y signal fueran atómicos.'
  - texto: 'No hace falta hacer nada: al ser syscalls se ejecutan en modo kernel, y el código del kernel
      no puede ser interrumpido'
    explicacion: El código del kernel sí puede ser interrumpido (y en multiprocesador otro núcleo puede
      ejecutar el mismo wait).
  - texto: Implementándolas como funciones de biblioteca que el proceso ejecuta en modo usuario, sin ningún
      cambio de modo
    explicacion: En modo usuario no puede garantizarse la atomicidad ni bloquear procesos; por eso son
      syscalls.
  correcta: 0
  justificacion: |
    `wait` y `signal` leen y modifican la variable del semáforo, que es compartida: su propio código es una **región
    crítica**. Para que el acceso sea atómico, el SO puede usar:

    - una **técnica de hardware**, como la instrucción `testAndSet` (sirve también en multiprocesadores), o
    - **deshabilitar interrupciones** mientras ejecuta `wait`/`signal` (suficiente en monoprocesador).

    En ambos casos la región crítica es muy corta (unas pocas instrucciones), así que la eventual espera activa del
    testAndSet es mínima.
- enunciado: '(1P 1C2026 TM, desarrollo 4) Una solución a la condición de carrera basada en **turnos**
    (alternancia estricta: cada proceso entra solo cuando es "su turno" y al salir le pasa el turno al
    otro), ¿qué requisito de una buena solución **no** cumple?'
  opciones:
  - texto: 'Mutua exclusión: en el cambio de turno pueden entrar los dos'
    explicacion: 'La alternancia sí garantiza mutua exclusión: el turno es de uno solo por vez.'
  - texto: 'Ninguno: la alternancia estricta cumple todos los requisitos, solamente es menos performante
      que un semáforo'
    explicacion: No cumple progreso, como explica la resolución oficial.
  - texto: Espera limitada, porque un proceso puede quedarse esperando su turno para siempre aunque el
      otro vaya alternando
    explicacion: 'Si el otro alterna, el turno vuelve: la espera está acotada. El problema aparece cuando
      el otro no quiere entrar.'
  - texto: 'Progreso: si el turno es de un proceso que no quiere entrar, el otro no puede entrar aunque la sección crítica esté libre'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    La solución por **turnos** solo cumple **mutua exclusión**. No cumple **progreso**: si es el turno de un proceso
    que en ese momento no quiere entrar a la sección crítica, el otro no puede entrar aunque la sección crítica esté
    libre. Un proceso que no está compitiendo por la sección crítica termina impidiendo que otro la use.

    Los semáforos, en cambio, cumplen los cuatro requisitos (mutua exclusión, progreso, espera limitada e independencia
    de la velocidad de los procesos): solo pueden impedir que otro entre los procesos que también están haciendo
    `wait`.
- enunciado: (1R 2C2025, single choice 6) ¿Cuál de los siguientes **no** es un requerimiento para una
    buena solución a la condición de carrera?
  opciones:
  - texto: No desalojo
    explicacion: Correcta.
  - texto: Progreso
    explicacion: 'Es un requisito: un proceso fuera de la sección crítica no puede impedir que otro entre.'
  - texto: Espera limitada
    explicacion: 'Es un requisito: ningún proceso puede esperar indefinidamente para entrar.'
  - texto: Mutua exclusión
    explicacion: 'Es el requisito principal: un solo proceso a la vez en la sección crítica.'
  correcta: 0
  justificacion: |
    Los requisitos de una buena solución a la condición de carrera son: **mutua exclusión**, **progreso**, **espera
    limitada** y que funcione **sin importar la velocidad** de los procesos. "**No desalojo**" no es uno de ellos: suena
    parecido a "sin desalojo", que es una de las **condiciones necesarias del deadlock**, un tema distinto. De hecho,
    una buena solución tiene que funcionar aunque el planificador desaloje al proceso en medio de la sección crítica.
- enunciado: '(1P 1C2026 TT, single choice iii) Las operaciones sobre los semáforos son:'
  opciones:
  - texto: Funciones que ejecutan en modo usuario
    explicacion: 'Necesitan ser atómicas y poder bloquear procesos: eso requiere al SO.'
  - texto: Instrucciones especiales
    explicacion: Las instrucciones especiales son las de hardware, como test and set; wait/signal son
      servicios del SO.
  - texto: Syscalls no bloqueantes
    explicacion: Un wait sobre un semáforo con valor 0 (o menor) bloquea al proceso.
  - texto: Syscalls potencialmente bloqueantes
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    `wait` y `signal` son **syscalls**: el SO garantiza que sean atómicas y es el único que puede bloquear y desbloquear
    procesos. Son **potencialmente bloqueantes** porque un `wait` bloquea al proceso si el semáforo no está disponible
    (si al decrementarlo el valor queda negativo); si está disponible, el proceso sigue sin bloquearse. `signal` nunca
    bloquea a quien lo llama, pero puede desbloquear a otro.
- enunciado: (1R 1C2026 TM, respuesta breve 1d) Si el valor de un semáforo es **-2** en un momento dado,
    ¿qué representa ese valor?
  opciones:
  - texto: Que el semáforo está mal inicializado, porque un semáforo nunca puede tomar valores negativos
    explicacion: En la implementación con bloqueo vista en la materia el valor sí puede ser negativo.
  - texto: 'Que se hicieron dos signal de más sobre el semáforo sin ningún wait'
    explicacion: 'Es al revés: los signal suben el valor. Un valor negativo indica procesos esperando.'
  - texto: Que hay dos procesos bloqueados en ese semáforo
    explicacion: Correcta.
  - texto: Que todavía quedan dos instancias del recurso disponibles para asignar
    explicacion: Las instancias disponibles se representan con valores positivos.
  correcta: 2
  justificacion: |
    En la implementación con bloqueo, `wait` primero **decrementa** el valor y, si queda negativo, bloquea al proceso.
    Así, cuando el valor es negativo, su valor absoluto indica **cuántos procesos están bloqueados** en la cola del
    semáforo: -2 significa que hay **2 procesos bloqueados** esperándolo. Cada `signal` incrementa el valor y, si
    todavía quedaba alguno esperando (valor resultante <= 0), despierta a uno.
- enunciado: |
    (1R 1C2026 TM, desarrollo 4) El SO implementa un semáforo con bloqueo con esta estructura:

    ```c
    struct sem_t {
      int valor;
      t_list cola;   // procesos bloqueados
    };
    ```

    `block()` encola al proceso actual y lo pasa a bloqueado; `wakeup()` saca al primero de la cola y lo pasa a ready. ¿Cuál es la lógica correcta de `wait` y `signal`?
  opciones:
  - texto: 'wait: decrementa y bloquea si el valor queda < 0. signal: incrementa y despierta a uno si
      queda <= 0'
    explicacion: Correcta.
  - texto: 'wait: decrementa y bloquea si el valor queda < 0. signal: incrementa y despierta a uno solamente
      si el valor queda < 0'
    explicacion: Si había un solo proceso bloqueado (valor -1), el signal lo deja en 0 y con esta condición
      nunca lo despertaría.
  - texto: 'wait: si el valor es 0 bloquea y si no lo decrementa. signal: incrementa y despierta siempre
      al primero de la cola'
    explicacion: Con la cola vacía no hay a quién despertar; y con este wait el valor nunca baja de 0,
      no cuenta bloqueados.
  - texto: 'wait: decrementa y bloquea si el valor queda <= 0. signal: incrementa y despierta a uno si el valor queda > 0'
    explicacion: Con valor inicial 1, el primer wait lo deja en 0 y bloquearía sin que nadie tenga el
      recurso.
  correcta: 0
  justificacion: |
    La resolución oficial:

    ```c
    wait(sem_t sem) {
      sem.valor--;
      if (sem.valor < 0) block();     // no había instancias: se bloquea
    }

    signal(sem_t sem) {
      sem.valor++;
      if (sem.valor <= 0) wakeup();   // había al menos uno bloqueado
    }
    ```

    Si al decrementar el valor queda negativo, no había instancias libres y el proceso se bloquea. En `signal`, si
    después de incrementar el valor sigue siendo <= 0, es que había procesos en la cola, y se despierta al primero. Las
    dos funciones son syscalls y el SO garantiza que se ejecuten de forma atómica.
- enunciado: (1R 1C2026 TT, desarrollo 5) ¿Por qué las operaciones `wait`/`signal` sobre semáforos requieren
    soporte del sistema operativo y no pueden implementarse simplemente como funciones en espacio de usuario?
  opciones:
  - texto: Porque usan instrucciones de E/S, y además necesitan acceder a la cola de listos del planificador
      de largo plazo
    explicacion: No hacen E/S, y la cola de listos la maneja el planificador de corto plazo.
  - texto: Porque deben ser atómicas, y además bloquear y desbloquear procesos es algo que solo puede
      hacer el kernel
    explicacion: Correcta.
  - texto: Porque el semáforo vive en el stack del proceso y signal genera una interrupción
    explicacion: El semáforo no vive en el stack de un proceso, y signal no genera interrupciones.
  - texto: Porque cada wait provoca siempre un cambio de proceso, y además solo el kernel puede restar
      enteros de forma segura
    explicacion: Un wait con el semáforo disponible no provoca cambio de proceso; y restar no es privilegiado.
  correcta: 1
  justificacion: |
    La resolución oficial da dos motivos:

    1. **Atomicidad:** para garantizar la mutua exclusión, `wait` y `signal` deben ejecutarse de forma atómica sobre la
       variable compartida del semáforo. El SO puede lograrlo, por ejemplo, deshabilitando interrupciones o usando
       test and set; un proceso de usuario no puede deshabilitar interrupciones.
    2. **Bloqueo y desbloqueo:** sus implementaciones necesitan bloquear procesos (pasarlos a bloqueado y encolarlos) y
       desbloquearlos (pasarlos a ready), y cambiar el estado de un proceso es algo que solo puede hacer el kernel.

    Por eso son **syscalls**.
---

Este simulacro reúne preguntas de **teoría** de parciales anteriores (2024 a 2026) sobre **sincronización**: espera activa, soluciones de hardware y semáforos. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación de cada una resume la resolución oficial de la cátedra.
