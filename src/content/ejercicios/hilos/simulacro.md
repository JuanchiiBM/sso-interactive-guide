---
titulo: 'Teoría de parciales: Hilos'
tema: parcial-1/hilos
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- ult
- klt
- procesos
preguntas:
- enunciado: (1P 1C2024 TT) ¿Cuál es una ventaja y cuál una desventaja de utilizar procesos en lugar de
    hilos KLT?
  opciones:
  - texto: 'Ventaja: cambios de contexto más rápidos que entre KLTs. Desventaja: no pueden correr en paralelo'
    explicacion: Cambiar de proceso es más costoso que cambiar de KLT, y los procesos sí pueden ejecutar
      en paralelo.
  - texto: 'Ventaja: comunicación más eficiente por memoria compartida. Desventaja: un error afecta a
      todos'
    explicacion: 'Es al revés: los procesos no comparten memoria por defecto y justamente aíslan los errores.'
  - texto: 'Ventaja: aislamiento, un error no se propaga. Desventaja: su creación es más lenta'
    explicacion: Correcta.
  - texto: 'Ventaja: más paralelismo que los KLTs. Desventaja: la comunicación entre ellos requiere syscalls'
    explicacion: La desventaja es razonable, pero los KLTs dan el mismo paralelismo que los procesos.
  correcta: 2
  justificacion: |
    - **Ventajas de los procesos:** ofrecen **aislamiento**, que evita que los errores (intencionales o
      no) se propaguen; los hilos, al compartir varios recursos, están altamente acoplados. Además, al no
      compartir recursos por defecto, dan mayor **seguridad**.
    - **Desventaja:** su **creación es más lenta**, porque un KLT requiere estructuras más livianas
      (TCB) que un proceso (PCB, espacio de direcciones, etc.).
- enunciado: (1P 1C2024 TT) En una aplicación que busque minimizar los cambios de modo, ¿qué tipo de hilos
    convendría usar?
  opciones:
  - texto: KLTs, porque el kernel los gestiona directamente y no necesita cambiar de modo para planificarlos
    explicacion: Justamente por gestionarlos el kernel, crearlos o planificarlos requiere pasar a modo
      kernel.
  - texto: 'ULTs, porque la biblioteca los crea, planifica y cambia en modo usuario, sin syscalls ni intervención del kernel'
    explicacion: Correcta.
  - texto: Procesos, porque cada uno tiene su PCB y el SO no tiene que pasar por ninguna biblioteca de
      hilos
    explicacion: 'Crear procesos o cambiar entre ellos requiere siempre al SO: más cambios de modo, no
      menos.'
  - texto: 'Es indistinto: todo tipo de hilo requiere syscalls'
    explicacion: Las operaciones sobre ULTs las resuelve la biblioteca en modo usuario, sin syscalls.
  correcta: 1
  justificacion: |
    Los **ULTs** se crean, planifican y cambian desde una biblioteca que ejecuta en **modo usuario**: el
    SO ni siquiera los conoce. Por eso esas operaciones no requieren cambios de modo. Con KLTs (y con
    procesos), el que gestiona es el kernel, así que cada una de esas operaciones implica pasar a modo
    kernel.
- enunciado: (1P 1C2025 TT) En términos de posibilidad de multiprocesamiento, ¿qué afirmación es correcta
    sobre procesos, KLTs y ULTs?
  opciones:
  - texto: Solo los procesos aprovechan varios cores; los KLTs no
    explicacion: El kernel conoce a cada KLT y puede asignarlos a cores distintos.
  - texto: Los tres pueden ejecutar en paralelo, porque el SO reparte los hilos de usuario entre los cores
      disponibles
    explicacion: 'El SO no conoce a los ULTs: ve un único hilo de ejecución por KLT.'
  - texto: Los ULTs permiten paralelismo si la biblioteca usa jacketing; los KLTs dependen del core del
      proceso
    explicacion: El jacketing no da paralelismo, y los KLTs se planifican de forma independiente.
  - texto: 'Procesos y KLTs pueden usar distintos cores; los ULTs hermanos no, porque el SO los ve como una sola unidad, salvo que corran sobre KLTs distintos'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    | | Procesos | KLTs | ULTs |
    |---|---|---|---|
    | Multiprocesamiento | Sí: cada proceso puede correr en un core | Sí: el kernel puede asignar hilos a distintos cores | No: los hilos hermanos no corren simultáneamente en cores distintos (solo si pertenecen a KLTs distintos) |
- enunciado: (1P 1C2025 TT) ¿Cómo se comparan procesos, KLTs y ULTs en overhead de creación y en seguridad
    (aislamiento)?
  opciones:
  - texto: 'Overhead: procesos > KLTs > ULTs. Aislamiento: procesos > KLTs > ULTs'
    explicacion: Correcta.
  - texto: 'Overhead: ULTs > KLTs > procesos. Aislamiento: procesos > KLTs > ULTs'
    explicacion: 'Crear un ULT es lo más barato: no hace falta ninguna estructura del SO.'
  - texto: 'Overhead: procesos > ULTs > KLTs. Aislamiento: ULTs > KLTs > procesos'
    explicacion: 'Los procesos son los que tienen memoria separada: el máximo aislamiento.'
  - texto: 'Overhead: procesos > KLTs > ULTs. Aislamiento: igual en los tres, porque comparten memoria'
    explicacion: Los procesos no comparten memoria entre sí por defecto.
  correcta: 0
  justificacion: |
    | | Procesos | KLTs | ULTs |
    |---|---|---|---|
    | Overhead en creación | Alto: PCB, espacio de direcciones, etc. | Medio: lo gestiona el kernel, pero solo crea un TCB | Bajo: se gestionan en espacio de usuario |
    | Seguridad / aislamiento | Alta: memoria separada | Media: comparten espacio, pero los gestiona el kernel | Baja: comparten memoria y el kernel no tiene control directo |
- enunciado: '(1R 1C2025 TT) Verdadero o falso: "Los hilos KLT requieren menos cambios de modo porque
    su código se ejecuta en modo kernel".'
  opciones:
  - texto: 'Verdadero: al ser hilos del kernel, su código corre en modo kernel y no hace falta cambiar
      de modo'
    explicacion: Que el kernel los gestione no significa que su código corra en modo kernel.
  - texto: 'Falso: el KLT lo gestiona el kernel, pero su código es del proceso y se ejecuta en modo usuario como cualquier otro'
    explicacion: Correcta.
  - texto: 'Falso: los KLTs no requieren cambios de modo'
    explicacion: Eso sería un ULT; a los KLTs los planifica el SO, en modo kernel.
  - texto: 'Verdadero: el SO los planifica sin interrupciones, por eso ahorran cambios de modo frente
      a los ULTs'
    explicacion: 'Es al revés: los ULTs son los que ahorran cambios de modo.'
  correcta: 1
  justificacion: |
    **Falso.** Los KLTs se crean con una biblioteca provista por el SO y los gestiona el kernel, pero el
    código que ejecutan es el del **proceso**, en **modo usuario**. Además, como su gestión la hace el
    kernel, requieren **más** cambios de modo que los ULTs, no menos.
- enunciado: '(1R 1C2025 TT) Verdadero o falso: "Un proceso que sólo implementa hilos ULT genera menos
    overhead al crear, finalizar o cambiar sus hilos, con respecto a otros procesos que utilizan hilos
    KLT".'
  opciones:
  - texto: 'Falso: cada ULT necesita una syscall al crearse, porque el SO tiene que registrarlo en un
      TCB propio'
    explicacion: 'El SO no conoce a los ULTs: la biblioteca los registra en sus propias estructuras, en
      modo usuario.'
  - texto: 'Falso: el overhead es el mismo, porque ambos crean un TCB'
    explicacion: 'La diferencia está en quién la crea: la biblioteca en modo usuario o el kernel vía syscall.'
  - texto: 'Verdadero: esas operaciones las hace la biblioteca de hilos en modo usuario, sin syscalls ni intervención del SO'
    explicacion: Correcta.
  - texto: 'Verdadero: los ULTs se ejecutan en paralelo, así que crearlos y cambiarlos se reparte entre
      las CPUs'
    explicacion: Los ULTs de un mismo KLT no ejecutan en paralelo; la razón es que no interviene el SO.
  correcta: 2
  justificacion: |
    **Verdadero.** La creación, finalización y el cambio entre ULTs los hace la biblioteca de hilos en
    **modo usuario**, sin intervención del sistema operativo: no hay syscalls ni cambios de modo. Con
    KLTs, cada una de esas operaciones pasa por el kernel.
- enunciado: '(1R 1C2025 TM) Verdadero o falso: "El SO no permite que un KLT acceda al stack de otro KLT
    del mismo proceso ya que cada TCB tiene su propio stack".'
  opciones:
  - texto: 'Verdadero: cada KLT tiene su stack y el SO protege esa región para que solo la use su propio
      hilo'
    explicacion: 'El SO no protege la memoria entre hilos del mismo proceso: comparten el espacio de direcciones.'
  - texto: 'Verdadero: el TCB guarda el puntero al stack y el SO valida cada acceso a memoria contra él'
    explicacion: El TCB guarda el contexto del hilo, pero el SO no valida los accesos a memoria por hilo.
  - texto: 'Falso: la protección de memoria del SO es por proceso, así que otro KLT del mismo proceso podría accederlo'
    explicacion: Correcta.
  - texto: 'Falso: los KLTs de un mismo proceso comparten un único stack, que se guarda en el PCB'
    explicacion: Cada KLT sí tiene su propio stack; lo que falta es protección entre ellos.
  correcta: 2
  justificacion: |
    **Falso.** Cada KLT tiene su propio stack, y un hilo **no debería** acceder al stack de otro, pero la
    protección de acceso a memoria que da el SO es a nivel **proceso**. No hay ninguna protección que
    impida, mediante una manipulación (maliciosa o no) de direcciones, que un KLT acceda al stack de otro
    KLT del mismo proceso.
- enunciado: '(1R 1C2025 TM) Verdadero o falso: "Por defecto los hilos ULT de un mismo proceso no pueden
    ser ejecutados en paralelo, pero esto puede solucionarse utilizando la técnica de jacketing".'
  opciones:
  - texto: 'Verdadero: el jacketing convierte cada llamada bloqueante en un KLT nuevo que corre en otra
      CPU'
    explicacion: El jacketing reemplaza la syscall bloqueante por una no bloqueante; no crea KLTs.
  - texto: 'Verdadero: con jacketing el SO pasa a conocer cada ULT y puede asignarlo a distintos procesadores'
    explicacion: 'El jacketing se implementa en la biblioteca: el SO sigue sin conocer a los ULTs.'
  - texto: 'Falso: los ULTs pueden ejecutar en paralelo por defecto'
    explicacion: 'La primera parte de la frase es cierta: por defecto no hay paralelismo entre ULTs.'
  - texto: 'Falso: el SO no ve los ULTs; el jacketing solo evita que una syscall bloqueante bloquee a todo el proceso, no da paralelismo'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Falso.** Como el SO no reconoce a los ULTs, no los puede ejecutar en paralelo aunque se use
    jacketing. El jacketing solo evita que una syscall bloqueante de un ULT **bloquee a todo el
    proceso** (la biblioteca la cambia por una no bloqueante y pasa a otro ULT). Solo podría haber
    paralelismo si el proceso tiene, además, varios KLTs sobre los que corren los ULTs.
- enunciado: (1P 2C2025 TM, 1P 1C2026 TM) ¿Cuál es una desventaja típica de los ULTs?
  opciones:
  - texto: No permiten concurrencia entre hilos pares
    explicacion: 'Sí hay concurrencia: la biblioteca los intercala en el tiempo.'
  - texto: No permiten paralelismo entre hilos pares
    explicacion: Correcta.
  - texto: No comparten memoria entre hilos pares
    explicacion: Los hilos de un mismo proceso comparten código, datos y heap.
  - texto: Requieren múltiples CPUs
    explicacion: Funcionan con una sola CPU; de hecho no pueden aprovechar más de una.
  correcta: 1
  justificacion: |
    El SO no conoce a los ULTs: para él existe un único hilo de ejecución (el proceso o el KLT sobre el
    que corren). Por eso los ULTs hermanos pueden ser **concurrentes** (la biblioteca los intercala)
    pero **no paralelos**: nunca ejecutan a la vez en dos CPUs. En la versión de 1P 2C2025 TM las otras
    opciones eran "mayor overhead para su creación" y "mayor overhead en cambio de contexto", que en
    realidad son ventajas de los ULTs (tienen menos overhead).
- enunciado: '(1R 2C2025) Comparado con utilizar múltiples KLTs, utilizar múltiples procesos cooperativos
    permite:'
  opciones:
  - texto: Ejecutar con mayor paralelismo
    explicacion: 'Los KLTs también los planifica el SO en distintas CPUs: el paralelismo es el mismo.'
  - texto: Mayor eficiencia en la comunicación
    explicacion: 'Es al revés: los KLTs comparten memoria; los procesos necesitan mecanismos del SO.'
  - texto: Cambios de contexto más rápidos
    explicacion: Cambiar entre procesos es más costoso que entre KLTs del mismo proceso.
  - texto: Ninguna es correcta
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Frente a KLTs, los procesos cooperativos **no** dan más paralelismo (el SO puede repartir KLTs entre
    CPUs igual que procesos), **no** se comunican más eficientemente (los hilos comparten memoria, los
    procesos requieren IPC vía SO) y **no** cambian de contexto más rápido (el cambio de proceso es más
    pesado). Su ventaja real es otra, el **aislamiento**, que no está entre las opciones.
- enunciado: (1P 1C2026 TM) Un servidor de 32 procesadores atiende peticiones con un algoritmo propietario
    (independiente del SO), busca el mayor paralelismo posible y que un error fatal en una petición no
    comprometa todo el sistema. ¿Cuántos procesos debería haber, como mínimo?
  opciones:
  - texto: Al menos 2, para que un error fatal no tire todo; hasta 32 (o varios KLTs) para más paralelismo
    explicacion: Correcta.
  - texto: 'Uno solo con 32 KLTs: así se logra el máximo paralelismo con el algoritmo propio de planificación'
    explicacion: Con un solo proceso, un error fatal compromete a todo el sistema; y a los KLTs los planifica
      el SO.
  - texto: 'Exactamente 32, uno por CPU, porque con menos procesos no se puede usar más de un procesador a la vez'
    explicacion: También se pueden aprovechar varias CPUs con varios KLTs dentro de cada proceso.
  - texto: Uno por cada petición que llegue, así cada error queda aislado y el SO la planifica con su
      algoritmo
    explicacion: 'El algoritmo tiene que ser propietario, independiente del SO: eso lo da una biblioteca
      de ULTs.'
  correcta: 0
  justificacion: |
    - **Error fatal:** hacen falta **al menos 2 procesos** atendiendo peticiones. Cada uno tiene su propio
      espacio de memoria, así que un error fatal en uno no afecta a los demás y el servidor sigue
      atendiendo, aunque con menor concurrencia.
    - **Paralelismo:** para aprovechar los 32 procesadores, se pueden tener **32 procesos** en lugar de 2,
      o que cada proceso tenga a su vez **múltiples KLTs**.
- enunciado: (1P 1C2026 TM) En ese mismo servidor, ¿cómo debería crear y usar hilos la aplicación para
    cada petición?
  opciones:
  - texto: Un KLT por petición, porque el algoritmo propietario se configura en el planificador del SO
    explicacion: Un algoritmo independiente del SO no puede vivir en el planificador del SO.
  - texto: Un ULT por petición con jacketing, porque así los ULTs de un mismo proceso corren en las 32
      CPUs
    explicacion: 'El jacketing no da paralelismo: solo evita que una syscall bloqueante bloquee al proceso.'
  - texto: 'Un ULT por petición, planificado por la biblioteca de hilos del proceso con el algoritmo propietario'
    explicacion: Correcta.
  - texto: 'Ningún hilo: un proceso nuevo por cada petición'
    explicacion: Los procesos los planifica el SO; el algoritmo propio lo da una biblioteca de ULTs.
  correcta: 2
  justificacion: |
    Por cada petición se levanta un **ULT**, porque se desea planificar con un **algoritmo propietario,
    independiente del SO**: la biblioteca de ULTs del proceso define ese algoritmo. El resto de los
    requisitos se cubre con procesos (al menos 2, para aislar errores fatales) y, si se quiere más
    paralelismo, con varios KLTs por proceso sobre los que corren los ULTs.
- enunciado: (1P 1C2024 TM) Un servidor de 16 procesadores atiende peticiones de 4 tipos distintos; se
    quiere planificar cada tipo con un algoritmo personalizado y que un error en las peticiones de un
    tipo no afecte al resto. ¿Qué combinación de procesos e hilos cumple?
  opciones:
  - texto: Un proceso por tipo (al menos 4), cada uno con su biblioteca de ULTs y un ULT por petición
    explicacion: Correcta.
  - texto: Un único proceso con 4 KLTs, uno por tipo, y el planificador del SO configurado con 4 prioridades
    explicacion: Con un solo proceso, un error en un tipo afecta a todos; y el algoritmo del SO no es
      personalizado por tipo.
  - texto: 'Un proceso por petición, cada uno con un único KLT, y que el SO los planifique con su propio algoritmo'
    explicacion: 'Aísla errores, pero la planificación la hace el SO: no hay un algoritmo personalizado
      por tipo.'
  - texto: Un proceso por tipo con un KLT por petición, porque cada proceso puede elegir el algoritmo
      de sus KLTs
    explicacion: Los KLTs los planifica el SO con su algoritmo; el algoritmo propio lo da una biblioteca
      de ULTs.
  correcta: 0
  justificacion: |
    - **Un proceso por tipo** (4 como mínimo): como cada proceso usa su espacio de memoria de forma
      independiente, un error en las peticiones de un tipo no puede afectar a otro tipo.
    - **Un ULT por petición:** cada proceso usa una biblioteca de ULTs cuyo algoritmo se ajusta a las
      necesidades de planificación de ese tipo de petición.

    Es la misma idea que el ejercicio de 1P 1C2026 TM (32 procesadores), con el aislamiento por tipo de
    petición en lugar de por error fatal.
---

Simulacro con preguntas de teoría de parciales anteriores (2024–2026) sobre **procesos, KLTs y ULTs, y cómo combinarlos para diseñar un servidor**, agrupadas por
tema. Cada pregunta cita el examen en el que se tomó y la respuesta correcta es la de la resolución
oficial de la cátedra.

Las preguntas de desarrollo y de verdadero o falso se reformularon como opción múltiple: elegí la
opción y leé la justificación completa, que resume lo que se esperaba responder en el parcial.
