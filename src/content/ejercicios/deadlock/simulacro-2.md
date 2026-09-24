---
titulo: 'Teoría de parciales: Deadlock'
tema: parcial-1/deadlock
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S2
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- evasion
- deteccion
- recuperacion
- livelock
preguntas:
- enunciado: '(1P 2C2025 TT, single choice 7) La técnica para asegurar la no ocurrencia de deadlock con
    **bajo overhead** y **alta flexibilidad** para la solicitud de recursos sería:'
  opciones:
  - texto: Evasión
    explicacion: Asegura la no ocurrencia y es bastante flexible, pero tiene overhead alto (banquero en
      cada petición).
  - texto: Detección y Recupero
    explicacion: 'Es flexible y puede tener bajo overhead, pero no asegura la no ocurrencia: el deadlock
      ocurre.'
  - texto: Prevención
    explicacion: Asegura la no ocurrencia con bajo overhead, pero es poco flexible por sus políticas.
  - texto: Ninguna es correcta
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Ninguna estrategia reúne las tres cosas a la vez:

    | Estrategia | ¿Asegura que no ocurra? | Overhead | Flexibilidad |
    |---|---|---|---|
    | Prevención | Sí | Bajo | Baja (políticas restrictivas) |
    | Evasión | Sí | Alto (banquero en cada petición) | Media (hay que declarar máximos) |
    | Detección y recupero | No (lo detecta cuando ocurre) | Según la frecuencia | Alta |

    Por eso la respuesta es **d) Ninguna es correcta**.
- enunciado: '(1R 2C2025, single choice 7) El mecanismo de **evasión** de deadlocks:'
  opciones:
  - texto: Tiene una alta flexibilidad en la asignación de los recursos
    explicacion: 'Su flexibilidad es intermedia: exige declarar los máximos y puede negar peticiones.'
  - texto: Tiene overhead bajo según con qué frecuencia ejecute
    explicacion: Eso describe a la detección; el banquero corre en cada petición y su overhead es alto.
  - texto: Requiere que los procesos indiquen sus peticiones máximas
    explicacion: Correcta.
  - texto: Todas son correctas
    explicacion: La a) y la b) son falsas.
  correcta: 2
  justificacion: |
    La evasión (algoritmo del banquero) **requiere que los procesos declaren sus peticiones máximas**: con esa
    información, ante cada petición simula la asignación y la concede solo si el sistema queda en estado seguro.

    - Su **overhead es alto**, porque el algoritmo corre con cada petición (no "según la frecuencia", que es el caso de
      la detección).
    - Su **flexibilidad es intermedia**: más que prevención, pero menos que detección.
- enunciado: '(1P 1C2026 TM, single choice iv) El algoritmo del banquero:'
  opciones:
  - texto: Se utiliza en la estrategia de prevención de deadlocks
    explicacion: 'Prevención no corre algoritmos: impone políticas.'
  - texto: Se ejecuta periódicamente
    explicacion: El que se ejecuta periódicamente es el algoritmo de detección; el banquero corre en cada
      petición.
  - texto: Se utiliza en la estrategia de evasión de deadlocks
    explicacion: Correcta.
  - texto: No aporta un overhead significativo
    explicacion: 'Aporta overhead alto: simula la asignación y busca una secuencia segura con cada petición.'
  correcta: 2
  justificacion: |
    El **algoritmo del banquero** es el mecanismo de la **evasión**: ante cada petición de recursos simula la
    asignación y verifica si el estado resultante es **seguro** (si existe una secuencia en la que todos los procesos
    pueden terminar con sus máximos declarados). Si lo es, asigna; si no, el proceso espera. Como corre con cada
    petición, su overhead es alto.
- enunciado: (1R 1C2026 TM, single choice ii) ¿Cuál estrategia de tratamiento de deadlock requiere conocer
    las **peticiones máximas** de los procesos?
  opciones:
  - texto: Prevención
    explicacion: 'Prevención no necesita los máximos: impone políticas fijas.'
  - texto: Evasión (algoritmo del banquero)
    explicacion: Correcta.
  - texto: Detección y recuperación (algoritmo de detección)
    explicacion: Detección trabaja con el estado actual (asignados y pedidos), no con máximos.
  - texto: Ninguna de las anteriores
    explicacion: La b) es correcta.
  correcta: 1
  justificacion: |
    La **evasión** necesita que cada proceso declare de antemano sus **peticiones máximas**: el banquero calcula la
    necesidad restante (máximo menos asignado) de cada proceso para decidir si el estado que quedaría tras una
    asignación es seguro. Ni la prevención (políticas fijas) ni la detección (analiza el estado actual) usan esa
    información.
- enunciado: (1R 1C2026 TT, respuesta breve 2d) ¿Qué condición del sistema debe verificar el **algoritmo
    del banquero** antes de asignar un recurso?
  opciones:
  - texto: Que no haya ningún ciclo en el grafo de asignación de recursos
    explicacion: Buscar ciclos es propio de la detección.
  - texto: Que se sigan cumpliendo las cuatro condiciones necesarias de Coffman
    explicacion: El banquero no evalúa las condiciones de Coffman.
  - texto: Que el sistema quede en estado seguro
    explicacion: Correcta.
  - texto: 'Que el proceso pida los recursos en orden creciente'
    explicacion: El orden global es una política de prevención.
  correcta: 2
  justificacion: |
    El banquero verifica que, si se concede la petición, el sistema quede en **estado seguro**: que exista al menos
    una secuencia de ejecución en la que cada proceso pueda obtener lo que le falta hasta su máximo, terminar y
    liberar sus recursos. Si el estado resultante sería inseguro, la petición no se concede y el proceso espera,
    aunque los recursos estén disponibles.
- enunciado: (1R 1C2026 TT, respuesta breve 2c) ¿Qué estrategia de deadlock puede generar una **baja utilización
    de recursos** al imponer restricciones para evitar que ocurran?
  opciones:
  - texto: Evasión
    explicacion: Evasión no impone restricciones a priori sobre cómo pedir; decide cada petición.
  - texto: Prevención
    explicacion: Correcta.
  - texto: Detección y recuperación
    explicacion: 'Detección no impone restricciones: deja que ocurra y después lo resuelve.'
  - texto: Ignorar el problema (algoritmo del avestruz)
    explicacion: No impone restricciones de ningún tipo.
  correcta: 1
  justificacion: |
    La **prevención** impone restricciones sobre la forma de pedir los recursos (pedir todo junto, en orden, de a uno)
    para que alguna condición necesaria no pueda cumplirse. Esas restricciones hacen que haya recursos libres que no se
    pueden asignar, o recursos retenidos que todavía no se usan: **baja utilización de recursos**.
- enunciado: '(1P 1C2026 TT, single choice iv) La estrategia de **Detección y Recupero** permite:'
  opciones:
  - texto: Detectar exclusivamente deadlocks actuales
    explicacion: Correcta.
  - texto: Detectar exclusivamente deadlocks próximos
    explicacion: Anticiparse a un deadlock es lo que hace la evasión.
  - texto: Resolver deadlocks evitando alguna de las condiciones necesarias
    explicacion: Eliminar condiciones es prevención.
  - texto: Ninguna de las anteriores
    explicacion: La a) es correcta.
  correcta: 0
  justificacion: |
    El algoritmo de detección analiza el estado **actual** del sistema y encuentra los deadlocks que **ya existen**; no
    predice deadlocks futuros (eso es lo que busca la evasión al mantener el estado seguro) ni elimina condiciones
    necesarias (eso es la prevención). Una vez detectado, se aplica una medida de recuperación.

    Nota: en la resolución oficial la respuesta figura como "c (o b en 2° tema): Detectar deadlocks actuales", porque
    el orden de opciones cambiaba entre temas; acá se respeta el texto de la opción correcta.
- enunciado: (1P 1C2026 TT, desarrollo 5) ¿Cómo garantiza cada estrategia, **prevención** y **evasión**,
    que no ocurra deadlock?
  opciones:
  - texto: Prevención mantiene el estado seguro; evasión ordena los recursos
    explicacion: Están invertidas.
  - texto: 'Prevención elimina por diseño al menos una de las condiciones necesarias; evasión analiza cada petición para mantener el sistema en estado seguro'
    explicacion: Correcta.
  - texto: 'Ninguna lo garantiza: ambas detectan el deadlock a tiempo y lo resuelven matando a uno de
      los procesos del ciclo'
    explicacion: Eso describe detección y recuperación, que no garantiza la no ocurrencia.
  - texto: Prevención rechaza las peticiones que superan los máximos declarados; evasión ignora el problema
      hasta que ocurre
    explicacion: Rechazar por máximos es parte de evasión, y evasión no ignora el problema.
  correcta: 1
  justificacion: |
    Tabla de la resolución oficial:

    | | Prevención | Evasión |
    |---|---|---|
    | Estrategia | Asegura que nunca suceda un deadlock eliminando una de las condiciones. | Garantiza la no existencia del deadlock manteniendo al sistema en un estado seguro. |
    | Flexibilidad de peticiones | Restringida, por las políticas aplicadas. | Media: los procesos deben declarar sus peticiones máximas. |
    | Overhead | Poco: no necesita analizar continuamente los estados. | Alto: cada solicitud requiere verificar si el estado resultante es seguro. |
- enunciado: '(1P 1C2026 TT, desarrollo 5) Hay dos procesos y dos recursos: R1 con **1 instancia** y R2
    con **2 instancias**. ¿Cuál de estas situaciones es un **deadlock**?'
  opciones:
  - texto: R1 asignado a P1; R2 con una instancia en P2 y otra libre; P1 pide R2 y P2 pide R1
    explicacion: 'P1 recibe la instancia libre de R2, termina y libera R1: no hay deadlock.'
  - texto: R1 asignado a P1; R2 con sus dos instancias en P2; P1 pide R2 y P2 no pide nada más
    explicacion: 'P2 no espera nada: termina, libera R2 y P1 avanza. No hay ciclo.'
  - texto: R1 libre; R2 con una instancia en P1 y otra en P2; P1 pide R1 y P2 pide R2
    explicacion: P1 obtiene R1 (está libre), termina y libera su instancia de R2, que recibe P2.
  - texto: R1 asignado a P1; R2 con una instancia en P1 y otra en P2; P1 pide R2 y P2 pide R1
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Es el grafo de la resolución oficial: R1 asignado a P1, las dos instancias de R2 ocupadas (una en P1 y otra en
    P2), P1 pide otra instancia de R2 y P2 pide R1.

    ```grafo
    procesos: P1, P2
    recursos: R1, R2=2
    R1 -> P1
    R2 -> P1
    R2 -> P2
    P1 -> R2
    P2 -> R1
    resaltar-ciclo
    ```

    P1 espera una instancia de R2, pero la única que no tiene la retiene P2; P2 espera R1, que retiene P1. Con
    recursos de varias instancias un ciclo no alcanza por sí solo, pero acá **todas** las instancias de R2 están
    tomadas por procesos del ciclo y nadie de afuera puede liberar nada: **deadlock confirmado**.
- enunciado: (1P 1C2024 TM, V/F 5b) "Al detectar un deadlock, siempre puede resolverse finalizando un
    solo proceso." ¿Verdadero o falso?
  opciones:
  - texto: 'Verdadero: al finalizar cualquier proceso del ciclo se liberan sus recursos y con eso se rompe
      la espera circular'
    explicacion: Puede haber varios ciclos, o los recursos liberados no alcanzar para destrabar a los
      demás.
  - texto: 'Falso: al finalizar uno puede no romperse el ciclo; hay que volver a correr la detección y, si sigue el deadlock, elegir otra víctima'
    explicacion: Correcta.
  - texto: 'Falso: la única forma es finalizar a todos los procesos del ciclo'
    explicacion: 'Finalizar a todos es una opción, pero no la única: también se puede ir de a uno o desalojar
      recursos.'
  - texto: 'Verdadero: siempre alcanza con finalizar al proceso que más recursos retiene, porque así se
      desarman todos los ciclos'
    explicacion: Ese proceso puede no estar en todos los ciclos; no hay garantía.
  correcta: 1
  justificacion: |
    **Falso.** Si la estrategia de recuperación elegida es eliminar procesos de a uno, después de finalizar a la
    víctima hay que **volver a correr el algoritmo de detección** para verificar que el deadlock efectivamente se
    resolvió; si no, se elige otra víctima y se repite. Por ejemplo, con dos ciclos independientes (P1-P2 y P3-P4),
    finalizar a P1 destraba a P2 pero P3 y P4 siguen en deadlock.
- enunciado: (1R 2C2025, desarrollo 3) Al detectar un deadlock, el SO puede **finalizar de a un proceso**
    hasta que se solucione. Frente a finalizar a todos los involucrados, ¿qué ventaja y desventaja tiene?
  opciones:
  - texto: Es más sencillo de implementar, pero potencialmente finaliza más procesos de los que eran necesarios
    explicacion: Eso describe finalizar a todos los procesos del deadlock.
  - texto: 'Menor costo (se pierde menos trabajo), pero hay que elegir una víctima y volver a correr la detección después de cada finalización'
    explicacion: Correcta.
  - texto: No finaliza ningún proceso, pero requiere poder devolver a los procesos expropiados a un estado
      anterior
    explicacion: Eso describe el desalojo de recursos.
  - texto: Menor costo, y un solo proceso siempre alcanza
    explicacion: 'Un solo proceso no siempre alcanza: hay que verificar con la detección.'
  correcta: 1
  justificacion: |
    Las tres medidas de la resolución oficial, con ventaja y desventaja:

    | Medida | Ventaja | Desventaja |
    |---|---|---|
    | Finalizar todos los procesos del deadlock | Implementación sencilla. | Mayor costo de negocio: potencialmente finaliza procesos de más. |
    | Finalizar de a un proceso | Menor costo. | Más trabajo: elegir víctima, volver a correr la detección y repetir hasta resolverlo. |
    | Desalojar recursos | No finaliza procesos: es la más eficiente en ese sentido. | Hay que poder devolver al proceso expropiado a un estado desde el que pueda reanudar; puede causar inanición si siempre se elige la misma víctima. |
- enunciado: (1R 2C2025, desarrollo 3) ¿Qué desventajas tiene **desalojar recursos** como medida de recuperación
    de un deadlock?
  opciones:
  - texto: Hay que poder reanudar al proceso expropiado desde un estado previo, y puede causar inanición
    explicacion: Correcta.
  - texto: Deja siempre al sistema en un estado inseguro, por lo que después hay que correr el algoritmo
      del banquero sí o sí
    explicacion: La recuperación no pasa por el banquero, que es de evasión.
  - texto: Obliga a finalizar a todos los procesos involucrados, aunque después se les devuelvan los recursos
      al reiniciarlos
    explicacion: Justamente evita finalizar procesos.
  - texto: 'No tiene desventajas: como no finaliza ningún proceso, no se pierde trabajo ni hay que elegir víctima'
    explicacion: 'Es la más eficiente en cuanto a no finalizar procesos, pero tiene costos: rollback e
      inanición.'
  correcta: 0
  justificacion: |
    Desalojar recursos es la medida más eficiente en términos de **no finalizar procesos**, pero:

    - requiere poder **devolver al proceso expropiado a un estado** en el que pueda reanudar su ejecución (un
      checkpoint o rollback), porque perdió un recurso que estaba usando;
    - puede causar **inanición** si un mismo proceso es elegido una y otra vez como víctima.
- enunciado: (1P 1C2024 TT, teoría 5) Si analiza un sistema para determinar si está ocurriendo un **deadlock**
    o un **livelock**, ¿qué métricas del SO y de la computadora permitirían inferir la respuesta?
  opciones:
  - texto: 'Estado de los procesos (bloqueados: deadlock) y consumo de CPU (alto y con cambios de estado:
      livelock)'
    explicacion: Correcta.
  - texto: 'Solo el consumo de CPU: en ambos casos es muy alto, así que la diferencia la da el grado de
      multiprogramación del sistema'
    explicacion: En un deadlock los procesos están bloqueados y no consumen CPU; el consumo es justamente
      lo que los distingue.
  - texto: 'Estado de los procesos (todos ejecutando sugiere deadlock) y consumo de CPU (nulo o muy bajo sugiere livelock)'
    explicacion: 'Está al revés: en el deadlock están bloqueados; en el livelock consumen CPU.'
  - texto: La memoria usada (un deadlock la va llenando de a poco) y la cantidad de archivos abiertos
      por cada proceso involucrado
    explicacion: Ninguna de las dos distingue entre deadlock y livelock.
  correcta: 0
  justificacion: |
    La resolución oficial propone mirar:

    1. **El estado de los procesos:** si no progresan y están en **bloqueado**, es un indicio de que podrían estar
       interbloqueados (deadlock); si están ejecutando, es un indicio de un posible **livelock**.
    2. **El consumo de CPU** de la computadora y de los procesos involucrados: si es frecuente y su estado cambia
       seguido (ready/running/bloqueado) sin progresar, probablemente se trate de un **livelock**. En un deadlock los
       procesos no consumen CPU.
- enunciado: '(1R 2C2025, single choice 8) Comparando deadlocks y livelocks:'
  opciones:
  - texto: El livelock es generalmente más difícil de detectar
    explicacion: Correcta.
  - texto: El deadlock retiene los recursos mientras que el livelock no
    explicacion: En un livelock los procesos también pueden retener recursos mientras reintentan.
  - texto: El deadlock es generalmente más difícil de detectar
    explicacion: 'Es al revés: el deadlock deja procesos bloqueados, fáciles de ver.'
  - texto: Ninguna es correcta
    explicacion: La a) es correcta.
  correcta: 0
  justificacion: |
    El **livelock** es generalmente más difícil de detectar: los procesos no están bloqueados, siguen ejecutando y
    cambiando de estado (usan CPU), pero no progresan. Desde afuera parecen estar trabajando. En un **deadlock**, en
    cambio, los procesos quedan bloqueados esperando recursos, lo que se puede ver en su estado y en un grafo de
    asignación (con un algoritmo de detección).
- enunciado: (1P 1C2026 TT, respuesta breve 1d) ¿Cómo se llama el tipo de bloqueo permanente entre procesos
    bajo el cual los mismos usan la CPU, sin progresar?
  opciones:
  - texto: Deadlock
    explicacion: 'En el deadlock los procesos están bloqueados: no usan la CPU.'
  - texto: Inanición
    explicacion: La inanición afecta a un proceso postergado indefinidamente, que ni siquiera llega a
      ejecutar.
  - texto: Espera activa
    explicacion: Es una forma de esperar un recurso, no un bloqueo permanente entre procesos que se traban
      mutuamente.
  - texto: Livelock
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Es un **livelock**: los procesos siguen ejecutándose (usan CPU y cambian de estado) pero ninguno puede progresar,
    por ejemplo porque se ceden mutuamente un recurso una y otra vez. Se diferencia del **deadlock** en que en este
    último los procesos quedan bloqueados esperando, sin consumir CPU.
---

Este simulacro reúne preguntas de **teoría** de parciales anteriores (2024 a 2026) sobre **deadlock**: evasión y detección, recuperación y deadlock contra livelock. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación de cada una resume la resolución oficial de la cátedra.
