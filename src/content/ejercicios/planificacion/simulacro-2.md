---
titulo: 'Teoría de parciales: Planificación de CPU'
tema: parcial-1/planificacion
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S2
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- io-bound
- hrrn
- sjf
- multinivel
- prioridades
preguntas:
- enunciado: (1R 1C2025 TT) ¿Por qué algunos algoritmos de planificación tienden a priorizar a los procesos
    I/O bound?
  opciones:
  - texto: Porque ocupan menos memoria y así el planificador de largo plazo puede admitir más procesos
      al sistema
    explicacion: El uso de memoria no tiene relación con la prioridad de CPU de un I/O bound.
  - texto: Porque sus operaciones de E/S también usan la CPU y conviene terminarlas antes para liberar
      el procesador
    explicacion: Durante la E/S el proceso está bloqueado y no usa la CPU.
  - texto: Porque así se evita la starvation de los CPU bound
    explicacion: Priorizar I/O bound, si algo, perjudica a los CPU bound; no evita su starvation.
  - texto: 'Porque pasan mucho tiempo bloqueados en E/S y, al volver a ready, compiten en desventaja con los CPU bound que acaparan la CPU'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    La CPU ejecuta instrucciones mucho más rápido de lo que se completan las operaciones de E/S. Por eso
    los procesos I/O bound pasan gran parte de su vida en estado **Bloqueado**, y cuando vuelven a Ready
    quedan en desventaja frente a los CPU bound al competir por la CPU (por ejemplo, detrás de una ráfaga
    larga en FIFO). Priorizarlos compensa esa desventaja. Además, suelen ser procesos **interactivos**,
    donde conviene reducir el tiempo de espera.
- enunciado: '(1P 1C2025 TT) Verdadero o falso: "HRRN es un algoritmo sin desalojo que evita la inanición".'
  opciones:
  - texto: 'Falso: HRRN es con desalojo, porque replanifica cada vez que la tasa de respuesta de otro
      supera a la del que ejecuta'
    explicacion: 'HRRN es sin desalojo: la tasa se calcula solo cuando la CPU queda libre.'
  - texto: 'Verdadero: su prioridad incluye el tiempo de espera, que crece hasta que el proceso es elegido'
    explicacion: Correcta.
  - texto: 'Falso: un proceso largo puede quedar postergado indefinidamente'
    explicacion: Favorece a los cortos, pero la espera del largo hace crecer su tasa hasta que termina
      siendo elegido.
  - texto: 'Verdadero: como es sin desalojo, cada proceso que entra a la CPU termina su ráfaga, y eso
      evita la inanición'
    explicacion: Ser sin desalojo no evita la inanición (SJF sin desalojo la sufre); lo que la evita es
      contar la espera.
  correcta: 1
  justificacion: |
    **Verdadero.** HRRN (Highest Response Ratio Next) es sin desalojo y elige el proceso con mayor
    **tasa de respuesta** = (W + S) / S, donde W es el tiempo esperado y S la ráfaga. Como la espera W
    forma parte de la prioridad, un proceso que espera mucho aumenta progresivamente su tasa hasta ser
    elegido: nadie queda postergado indefinidamente, que es la definición de inanición.
- enunciado: '(1P 1C2026 TT) Indique cuál de estas afirmaciones es verdadera sobre HRRN:'
  opciones:
  - texto: Impide que un proceso monopolice la CPU
    explicacion: 'HRRN es sin desalojo: el proceso en ejecución no puede ser expulsado.'
  - texto: Nunca se puede producir starvation
    explicacion: Correcta.
  - texto: Se utiliza un Quantum dinámico
    explicacion: HRRN no usa quantum; el quantum remanente es de VRR.
  - texto: Tiene menos overhead que FIFO
    explicacion: 'Debe recalcular la tasa de respuesta de cada proceso en cada decisión: tiene más overhead.'
  correcta: 1
  justificacion: |
    En HRRN la prioridad es la tasa de respuesta (W + S) / S: el tiempo de espera hace crecer la
    prioridad, así que **nunca hay starvation**. Al ser sin desalojo no impide la monopolización, no usa
    quantum, y calcular la tasa de todos los procesos listos en cada decisión le da **más** overhead
    que FIFO.
- enunciado: (1P 1C2026 TM) ¿Qué algoritmo de planificación busca minimizar el tiempo de espera promedio
    de los procesos?
  opciones:
  - texto: FIFO
    explicacion: 'Atiende por orden de llegada: una ráfaga larga primero hace esperar a todos los demás.'
  - texto: Round Robin con quantum chico
    explicacion: Mejora la respuesta, pero intercala a todos y no minimiza la espera promedio.
  - texto: SJF y/o SRT
    explicacion: Correcta.
  - texto: HRRN
    explicacion: 'Contempla la ráfaga, pero también la espera: resigna algo de espera promedio para evitar
      la inanición.'
  correcta: 2
  justificacion: |
    **SJF** (y su variante con desalojo, **SRT**) elige siempre la ráfaga más corta. Terminar primero
    las ráfagas cortas hace que, en promedio, los procesos esperen lo menos posible: es el algoritmo que
    minimiza el tiempo de espera promedio (a costa de posible inanición de los procesos largos y de
    tener que estimar las ráfagas).
- enunciado: (1R 1C2026 TT) Tres procesos están listos en el mismo instante, en el orden de llegada P1,
    P2, P3, con ráfagas de 5, 4 y 1. ¿Cuál es el tiempo de espera promedio con SJF y con FIFO?
  opciones:
  - texto: 'SJF: 2 · FIFO: 4,67'
    explicacion: Correcta.
  - texto: 'SJF: 5,33 · FIFO: 8'
    explicacion: Esos son los tiempos de retorno promedio (fin de cada proceso), no de espera.
  - texto: 'SJF: 1,67 · FIFO: 4,67'
    explicacion: 'En SJF el último espera 1 + 4 = 5, no 4: la suma de esperas es 6.'
  - texto: 'SJF y FIFO: 4,67 en ambos, porque el orden no cambia el promedio'
    explicacion: 'El orden sí cambia las esperas: SJF deja lo largo para el final.'
  correcta: 0
  justificacion: |
    - **SJF:** ejecuta 1, 4 y 5 en ese orden. Esperas: 0, 1 y 5 → promedio **6 / 3 = 2**.
    - **FIFO:** ejecuta 5, 4 y 1 por orden de llegada. Esperas: 0, 5 y 9 → promedio **14 / 3 ≈ 4,67**.

    Atender primero las ráfagas cortas hace que muchos procesos esperen poco y solo uno (el largo)
    espere mucho, y por eso el promedio baja. Según la cátedra, SJF con desalojo es el que genera el
    menor tiempo de espera promedio posible. En rigor es "menor o igual": si las ráfagas ya llegan
    ordenadas de menor a mayor, FIFO da el mismo resultado.
- enunciado: (1R 1C2026 TT) ¿Cuáles son dos desventajas de utilizar SJF con desalojo por sobre FIFO?
  opciones:
  - texto: Permite que un proceso monopolice la CPU y no asegura que los procesos cortos terminen primero
    explicacion: 'Esas son desventajas de FIFO: SJF con desalojo expulsa al proceso cuando llega una ráfaga
      más corta.'
  - texto: Aumenta la espera promedio y requiere declarar prioridades
    explicacion: 'SJF minimiza la espera promedio y no usa prioridades declaradas: estima la próxima ráfaga.'
  - texto: Perjudica a los I/O bound, que tienen ráfagas de CPU largas, y necesita definir un quantum
      fijo
    explicacion: Los I/O bound tienen ráfagas de CPU cortas (SJF los favorece), y SJF no usa quantum.
  - texto: 'Puede producir inanición de los procesos largos y tiene mayor overhead (más cambios de contexto y estimar cada ráfaga)'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    - **Inanición:** si siguen llegando procesos con ráfagas cortas, un proceso con una ráfaga larga
      puede quedar postergado indefinidamente.
    - **Mayor overhead:** hay que estimar las ráfagas y replanificar (y desalojar) cada vez que llega o
      se desbloquea un proceso, mientras que FIFO solo decide cuando la CPU queda libre.
- enunciado: (1R 1C2025 TM) Se quiere un algoritmo de colas multinivel para procesos con distintas prioridades
    (que pueden cambiar durante la ejecución), sin starvation y con un tiempo de espera previsible. ¿Qué
    diseño cumple con todo?
  opciones:
  - texto: Una cola por prioridad con FIFO en cada una y prioridades fijas, asignadas al crear el proceso
    explicacion: Las prioridades no cambian, FIFO no da una espera previsible y la cola de menor prioridad
      puede sufrir starvation.
  - texto: Colas por prioridad con RR, bajando de cola a quien agote su quantum, sin ningún mecanismo
      para subir
    explicacion: Si solo se baja de cola, los procesos de la última cola pueden quedar postergados indefinidamente.
  - texto: Una cola por prioridad, RR en cada una y aging para subir a quien espera mucho
    explicacion: Correcta.
  - texto: Colas por prioridad atendidas con SJF, para que los procesos cortos esperen siempre lo mínimo
      posible
    explicacion: SJF puede generar starvation de los largos y no da una espera previsible.
  correcta: 2
  justificacion: |
    Un diseño posible (el de la resolución oficial):

    - Una cola por cada nivel de prioridad; los procesos nuevos entran a la cola de su prioridad.
    - Cada cola se planifica con **RR**, para que el tiempo de espera sea **previsible** (cota del quantum).
    - **Aging:** a los procesos que esperan en ready durante X tiempo se les sube la prioridad (cambian
      de cola), para evitar **starvation**.
    - Sin desalojo entre colas.

    Opcionalmente, se puede bajar la prioridad a los procesos que usan todo su quantum (salvo que ya
    estén en la más baja).
- enunciado: (1R 1C2025 TM) En ese diseño de colas multinivel con RR por cola y aging, ¿qué requisito
    cubre cada mecanismo?
  opciones:
  - texto: El RR (cota del quantum) hace previsible la espera y el aging evita la starvation
    explicacion: Correcta.
  - texto: 'El aging hace previsible la espera de cada cola y el RR, por sí solo, evita la starvation entre colas'
    explicacion: 'Al revés: RR reparte la CPU dentro de una cola, pero no impide que una cola baja quede
      sin atender.'
  - texto: El aging baja la prioridad a quien usa todo su quantum y el RR decide en qué orden se atienden
      las colas
    explicacion: Aging es subir la prioridad por esperar; y el orden entre colas lo da la prioridad, no
      el RR.
  - texto: El desalojo entre colas evita la starvation y el RR reduce la cantidad de cambios de contexto
      del sistema
    explicacion: El desalojo entre colas no evita la starvation (la resolución incluso propone no usarlo)
      y RR agrega cambios de contexto.
  correcta: 0
  justificacion: |
    - **RR en cada cola:** el quantum pone una cota a cuánto ejecuta cada proceso antes de ceder la CPU,
      así que el tiempo de espera dentro de la cola es **previsible**.
    - **Aging:** un proceso que espera en ready durante X tiempo sube de prioridad (y de cola). Así las
      colas de mayor prioridad no pueden postergar indefinidamente a las de menor: no hay **starvation**.
    - Bajar la prioridad a quien agota su quantum es opcional; sin aging, eso solo empeoraría la
      starvation.
- enunciado: (1P 1C2026 TM) ¿Qué problema típico puede generar un algoritmo de planificación de corto
    plazo basado en prioridades?
  opciones:
  - texto: Aging
    explicacion: 'El aging no es un problema: es la técnica que se usa para solucionar la starvation.'
  - texto: Starvation
    explicacion: Correcta.
  - texto: Deadlock
    explicacion: El deadlock depende de cómo se piden los recursos, no del algoritmo de planificación.
  - texto: Espera activa
    explicacion: La espera activa depende de la solución de mutua exclusión, no del planificador.
  correcta: 1
  justificacion: |
    Con prioridades, si siguen llegando procesos más prioritarios, un proceso de baja prioridad puede
    quedar en ready **indefinidamente**: eso es **starvation** (inanición). Se soluciona con **aging**,
    aumentando la prioridad de los procesos a medida que esperan.
---

Simulacro con preguntas de teoría de parciales anteriores (2024–2026) sobre **I/O bound, HRRN, SJF/SRT, colas multinivel y prioridades**, agrupadas por
tema. Cada pregunta cita el examen en el que se tomó y la respuesta correcta es la de la resolución
oficial de la cátedra.

Las preguntas de desarrollo y de verdadero o falso se reformularon como opción múltiple: elegí la
opción y leé la justificación completa, que resume lo que se esperaba responder en el parcial.
