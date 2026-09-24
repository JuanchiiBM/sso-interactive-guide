---
titulo: 'Teoría de parciales: Planificación de CPU'
tema: parcial-1/planificacion
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S1
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- desalojo
- fifo
- rr
- vrr
preguntas:
- enunciado: (1P 1C2024 TT) ¿Cuál es la diferencia entre los algoritmos de planificación con y sin desalojo?
  opciones:
  - texto: Sin desalojo, el proceso suelta la CPU solo si se bloquea o termina; con desalojo, el SO puede
      sacarlo ante un evento
    explicacion: Correcta.
  - texto: Con desalojo, el proceso se expulsa únicamente cuando se le agota el quantum; sin desalojo
      no existe ningún tipo de límite
    explicacion: 'El quantum es un caso: también desaloja la llegada de un proceso más prioritario (SRT,
      prioridades con desalojo).'
  - texto: Sin desalojo, el SO no atiende interrupciones mientras el proceso ejecuta; con desalojo, las
      atiende apenas llegan al procesador
    explicacion: Las interrupciones se atienden igual en ambos casos; lo que cambia es si pueden provocar
      un cambio de proceso.
  - texto: 'Con desalojo, el SO puede suspender el proceso a disco para liberar memoria; sin desalojo, queda siempre en memoria principal'
    explicacion: Eso es swapping (mediano plazo); el desalojo es una decisión del planificador de corto
      plazo.
  correcta: 0
  justificacion: |
    - **Sin desalojo:** el proceso libera la CPU solamente cuando se **bloquea** (E/S, wait) o **finaliza**
      su ejecución. El planificador decide solo cuando la CPU queda libre.
    - **Con desalojo:** además, el SO puede **expulsar intempestivamente** al proceso en ejecución ante
      interrupciones o syscalls (fin de quantum, llegada o desbloqueo de un proceso más prioritario), si
      el algoritmo indica que otro proceso debe ejecutar.
- enunciado: (1P 1C2024 TT) En un sistema en el que no queremos procesos monopolizando la CPU, ¿qué tipo
    de algoritmo conviene utilizar?
  opciones:
  - texto: Uno sin desalojo que ejecute primero ráfagas cortas, como SJF sin desalojo, así ningún proceso
      retiene la CPU
    explicacion: Sin desalojo, un proceso con una ráfaga larga que ya tomó la CPU la retiene hasta bloquearse
      o terminar.
  - texto: Un algoritmo con desalojo, que permita expulsar al proceso en ejecución aunque no se bloquee
    explicacion: Correcta.
  - texto: 'FIFO, porque atiende estrictamente por orden de llegada y así todos los procesos terminan ejecutando'
    explicacion: 'Eso habla de starvation, no de monopolización: en FIFO un proceso largo monopoliza la
      CPU.'
  - texto: HRRN, porque la tasa de respuesta crece con la espera y ningún proceso puede retener la CPU
      mucho tiempo
    explicacion: 'HRRN evita la inanición, pero es sin desalojo: el que ejecuta no suelta la CPU hasta
      bloquearse o terminar.'
  correcta: 1
  justificacion: |
    La monopolización ocurre cuando un proceso toma la CPU y no la libera hasta bloquearse o terminar,
    que es justamente el comportamiento de los algoritmos **sin desalojo** (FIFO, SJF sin desalojo,
    HRRN, prioridades sin desalojo). Para evitarla hace falta un algoritmo **con desalojo**, que pueda
    sacar al proceso de la CPU (por ejemplo RR o VRR por fin de quantum).
- enunciado: '(1P 1C2025 TM) Verdadero o falso: "Una transición desde Running hacia Ready sólo es posible
    si el algoritmo del planificador de corto plazo es Round Robin o variantes del mismo".'
  opciones:
  - texto: 'Verdadero: solo el fin de quantum puede sacar a un proceso de la CPU sin que se bloquee ni
      termine'
    explicacion: También desaloja la llegada de un proceso más prioritario, sin quantum de por medio (SRT,
      prioridades).
  - texto: 'Falso: esa transición la decide siempre el planificador de mediano plazo al suspender procesos
      a disco'
    explicacion: Suspender lleva a Ready/Suspended o Blocked/Suspended; Running → Ready es decisión del
      corto plazo.
  - texto: 'Falso: es posible con cualquier algoritmo con desalojo, por ejemplo SJF con desalojo cuando llega un proceso con ráfaga más corta'
    explicacion: Correcta.
  - texto: 'Falso: también ocurre en FIFO cuando el proceso vuelve de su E/S'
    explicacion: Volver de E/S es Blocked → Ready, no Running → Ready.
  correcta: 2
  justificacion: |
    **Falso.** Running → Ready es un **desalojo**: el proceso podía seguir ejecutando pero el planificador
    de corto plazo lo saca. Eso lo hace cualquier algoritmo **con desalojo**, no solo RR/VRR: por ejemplo
    SJF con desalojo (SRT) cuando llega un proceso con ráfaga más corta, o prioridades con desalojo
    cuando llega uno más prioritario.
- enunciado: (1P 2C2025 TT) ¿Cuál de estos algoritmos impide la monopolización de la CPU?
  opciones:
  - texto: HRRN
    explicacion: 'Es sin desalojo: evita la inanición, pero el proceso en ejecución no suelta la CPU.'
  - texto: Prioridades sin desalojo
    explicacion: Sin desalojo, el proceso que ejecuta retiene la CPU aunque llegue uno más prioritario.
  - texto: FIFO
    explicacion: 'Es el caso típico de monopolización: un proceso largo ejecuta hasta bloquearse o terminar.'
  - texto: VRR
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Para impedir la monopolización hace falta **desalojo**. De las opciones, el único con desalojo es
    **VRR**: el quantum pone una cota superior a lo que un proceso puede ejecutar de corrido. HRRN,
    prioridades sin desalojo y FIFO dejan al proceso en la CPU hasta que se bloquee o finalice.
- enunciado: '(1P 1C2026 TM) Los algoritmos de planificación de corto plazo sin desalojo siempre tienen
    en cuenta el siguiente evento:'
  opciones:
  - texto: Proceso en ejecución finaliza
    explicacion: Correcta.
  - texto: Proceso nuevo pasa al estado ready
    explicacion: Un proceso nuevo en ready no dispara replanificación en un algoritmo sin desalojo.
  - texto: Proceso se desbloquea y pasa al estado ready
    explicacion: 'Tampoco: el desbloqueo solo replanifica si hay desalojo.'
  - texto: Ninguna de las anteriores
    explicacion: 'Hay un evento que sí consideran siempre: que la CPU quede libre.'
  correcta: 0
  justificacion: |
    Un algoritmo sin desalojo solo planifica cuando **la CPU queda libre**: porque el proceso en
    ejecución **finaliza** o porque se bloquea. La llegada de un proceso nuevo o el desbloqueo de uno
    son eventos que solo importan en algoritmos **con desalojo**, que pueden decidir expulsar al que
    está ejecutando.
- enunciado: (1R 1C2026 TT) ¿Cómo se denomina al conjunto de algoritmos de planificación que solo toman
    decisiones de planificación cuando la CPU se encuentra libre?
  opciones:
  - texto: Algoritmos con desalojo (apropiativos)
    explicacion: Estos también deciden con la CPU ocupada, para expulsar al proceso.
  - texto: Algoritmos de planificación de largo plazo
    explicacion: El largo plazo decide qué procesos se admiten, no quién usa la CPU.
  - texto: Algoritmos de prioridades dinámicas
    explicacion: Que la prioridad cambie no dice nada sobre cuándo se planifica.
  - texto: Algoritmos sin desalojo
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Los algoritmos **sin desalojo** (no apropiativos) solo eligen un nuevo proceso cuando el que está
    ejecutando libera la CPU: al bloquearse o finalizar. Los **con desalojo** también toman decisiones
    con la CPU ocupada (fin de quantum, llegada de un proceso más prioritario) y pueden expulsar al
    proceso en ejecución.
- enunciado: (1P 1C2024 TM) Comparando FIFO, Round Robin y Virtual Round Robin, ¿cómo se ordenan en cantidad
    de cambios de contexto, de menor a mayor?
  opciones:
  - texto: RR < FIFO < VRR
    explicacion: 'FIFO es el de menor overhead: no desaloja nunca.'
  - texto: FIFO < VRR < RR
    explicacion: 'VRR suma cambios de contexto: el quantum remanente es menor que el fijo.'
  - texto: FIFO < RR < VRR
    explicacion: Correcta.
  - texto: Los tres generan la misma cantidad; solo cambia el orden de atención
    explicacion: El quantum agrega desalojos que FIFO no tiene.
  correcta: 2
  justificacion: |
    | | Cambios de contexto |
    |---|---|
    | FIFO | **Mínimo**: el proceso solo deja la CPU al bloquearse, terminar o hacer yield. |
    | RR | **Intermedio**: se suman los desalojos por fin de quantum; crecen cuanto más chico es el quantum. |
    | VRR | **Mayor**: además del quantum fijo, los que vuelven de E/S usan un quantum remanente, siempre menor, y generan aún más desalojos. |
- enunciado: (1P 1C2024 TM) Comparando FIFO, RR y VRR en cuanto a priorizar procesos I/O bound y starvation,
    ¿qué afirmación es correcta?
  opciones:
  - texto: RR y VRR priorizan a los I/O bound; VRR puede generar starvation por su cola de mayor prioridad
    explicacion: RR trata a todos igual; y VRR no genera starvation porque la cola auxiliar usa solo el
      quantum remanente.
  - texto: Solo VRR prioriza a los I/O bound (con su cola auxiliar), y ninguno de los tres genera starvation
    explicacion: Correcta.
  - texto: FIFO favorece a los I/O bound porque los atiende por orden de llegada, y RR genera starvation
      con quantum chico
    explicacion: FIFO los perjudica (un CPU bound puede monopolizar la CPU) y RR no genera starvation
      con ningún quantum.
  - texto: Ninguno prioriza a los I/O bound, porque solo los algoritmos por prioridades pueden hacerlo,
      y FIFO genera starvation
    explicacion: 'VRR sí los prioriza con su cola auxiliar; y FIFO no genera starvation: todos terminan
      atendidos en orden.'
  correcta: 1
  justificacion: |
    | | Prioridad I/O bound | Starvation |
    |---|---|---|
    | FIFO | No los prioriza: un proceso largo puede monopolizar la CPU, lo que es injusto para los I/O bound y hace impredecible la espera. | No genera. |
    | RR | No los prioriza, pero da una espera **predecible** gracias a la cota del quantum. | No genera. |
    | VRR | Como RR, y además prioriza a los que no aprovecharon su quantum, en una cola de mayor prioridad. | No genera. |
- enunciado: '(1P 1C2025 TM) Verdadero o falso: "Virtual Round Robin utiliza colas con diferentes niveles
    de prioridad. En consecuencia, puede generar starvation".'
  opciones:
  - texto: 'Falso: en la cola auxiliar solo usan el quantum que les sobró, que se agota'
    explicacion: Correcta.
  - texto: 'Verdadero: mientras sigan volviendo procesos de E/S, la cola común podría no atenderse nunca'
    explicacion: Cada proceso de la auxiliar ejecuta a lo sumo su remanente y después vuelve a la común;
      no puede postergarla indefinidamente.
  - texto: 'Falso: VRR usa una sola cola de ready, con un quantum variable que se ajusta a cada proceso'
    explicacion: 'VRR sí tiene dos colas: la auxiliar (más prioritaria) y la común.'
  - texto: 'Verdadero: todo algoritmo con más de una cola de prioridad genera starvation si no aplica
      aging'
    explicacion: 'No es una regla general: en VRR lo que evita la starvation es el quantum remanente.'
  correcta: 0
  justificacion: |
    **Falso.** Es cierto que VRR tiene una cola (auxiliar) de mayor prioridad, pero los procesos que están
    en ella ejecutan con un **Q' = quantum remanente**, lo que no alcanzaron a usar antes de bloquearse.
    Eso limita cuánto tiempo se planifica un proceso con mayor prioridad: el remanente "tiende a cero",
    y al agotarlo el proceso vuelve a la cola común. Así, ningún proceso queda postergado indefinidamente.
- enunciado: (1P 2C2025 TM) ¿Cuál de los siguientes algoritmos de planificación tiende a favorecer a los
    procesos I/O bound y no genera starvation?
  opciones:
  - texto: SJF sin desalojo
    explicacion: Puede favorecer ráfagas cortas, pero genera starvation de los procesos largos.
  - texto: VRR
    explicacion: Correcta.
  - texto: 'FEEDBACK (C1: RR y C2: FIFO)'
    explicacion: Favorece a los I/O bound, pero la cola de menor prioridad puede sufrir starvation.
  - texto: Prioridades con desalojo
    explicacion: Sin aging, los procesos de baja prioridad pueden sufrir starvation.
  correcta: 1
  justificacion: |
    **VRR** favorece a los I/O bound: cuando vuelven de E/S sin haber agotado su quantum, entran a una
    cola auxiliar que tiene prioridad sobre la común. Y no genera starvation porque en esa cola solo
    usan el quantum remanente. SJF, feedback y prioridades pueden postergar indefinidamente a algún
    proceso (los largos o los de menor prioridad).
- enunciado: (1R 2C2025) ¿Cuál de las siguientes afirmaciones es falsa sobre FIFO?
  opciones:
  - texto: Podría permitir que un proceso monopolice la CPU
    explicacion: 'Es verdadera: FIFO es sin desalojo.'
  - texto: Minimiza los cambios de contexto
    explicacion: 'Es verdadera: es el algoritmo de menor overhead.'
  - texto: Podría ser útil para correr procesos secuenciales
    explicacion: 'Es verdadera: si los procesos deben correr en orden, FIFO lo respeta.'
  - texto: Perjudica a los procesos CPU bound
    explicacion: 'Correcta: es falsa, porque FIFO perjudica a los I/O bound.'
  correcta: 3
  justificacion: |
    FIFO es sin desalojo: un proceso puede **monopolizar la CPU** y los cambios de contexto son
    **mínimos**; además respeta el orden de llegada, útil para procesos secuenciales. Lo falso es que
    perjudique a los CPU bound: al contrario, los **favorece**, porque un CPU bound ejecuta su ráfaga
    larga completa y los I/O bound que vuelven de E/S esperan detrás.
- enunciado: (1R 2C2025) Comparando VRR, RR y FIFO en atención de I/O bound y tiempo de respuesta promedio,
    ¿qué afirmación es correcta?
  opciones:
  - texto: RR tiene el mejor tiempo de respuesta porque trata a todos por igual
    explicacion: Tratar a todos igual no favorece a los I/O bound; VRR mejora a RR justamente priorizándolos.
  - texto: FIFO tiene mejor tiempo de respuesta que RR porque no pierde tiempo en cambios de contexto
      por quantum
    explicacion: El overhead es menor, pero un proceso que vuelve de E/S puede esperar mucho detrás de
      un CPU bound.
  - texto: 'VRR lo mejora respecto de RR porque los I/O bound vuelven por la cola auxiliar; en FIFO puede empeorar mucho si hay un CPU bound adelante'
    explicacion: Correcta.
  - texto: Los tres tienen un tiempo de respuesta similar; solo difieren en la cantidad de cambios de
      contexto que generan
    explicacion: El tratamiento de los I/O bound cambia mucho el tiempo de respuesta.
  correcta: 2
  justificacion: |
    - **I/O bound:** VRR los favorece (vuelven de E/S a la cola auxiliar con su quantum remanente). RR y
      FIFO tratan a todos por igual, aunque FIFO puede perjudicarlos al no limitar a los CPU bound.
    - **Inanición:** ninguno la tiene. RR se basa en FIFO; en VRR el remanente se agota y el proceso
      vuelve a la cola común.
    - **Tiempo de respuesta promedio:** VRR mejora a RR porque favorece a los I/O bound. En FIFO puede
      verse muy perjudicado: un proceso que vuelve de E/S espera detrás de un CPU bound.
---

Simulacro con preguntas de teoría de parciales anteriores (2024–2026) sobre **planificación con y sin desalojo y la comparación entre FIFO, RR y VRR**, agrupadas por
tema. Cada pregunta cita el examen en el que se tomó y la respuesta correcta es la de la resolución
oficial de la cátedra.

Las preguntas de desarrollo y de verdadero o falso se reformularon como opción múltiple: elegí la
opción y leé la justificación completa, que resume lo que se esperaba responder en el parcial.
