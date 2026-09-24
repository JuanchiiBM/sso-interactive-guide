---
titulo: 'Teoría de parciales: Deadlock'
tema: parcial-1/deadlock
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S1
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- condiciones-necesarias
- prevencion
- evasion
- deteccion
preguntas:
- enunciado: (1P 1C2025 TM, teoría 2) Sobre las condiciones necesarias del deadlock, ¿qué es la **prevención**
    y cómo se relaciona con ellas?
  opciones:
  - texto: Deja que se cumplan las cuatro condiciones y, cuando se forma el ciclo, elimina a un proceso
      involucrado en el deadlock
    explicacion: Eso es detección y recuperación.
  - texto: Analiza en cada petición si el sistema queda en estado seguro
    explicacion: Eso es evasión (algoritmo del banquero).
  - texto: 'Es una estrategia que impide el deadlock por diseño, eliminando al menos una de las cuatro condiciones necesarias (alcanza con romper una)'
    explicacion: Correcta.
  - texto: Elimina las cuatro condiciones a la vez, porque alcanza con que se cumpla cualquiera de ellas
      para que haya deadlock
    explicacion: 'Las condiciones son necesarias todas juntas: alcanza con eliminar una sola para que
      el deadlock sea imposible.'
  correcta: 2
  justificacion: |
    Las condiciones necesarias para que ocurra un deadlock son cuatro: **mutua exclusión**, **sin desalojo**,
    **retención y espera** y **espera circular**. Tienen que darse **todas a la vez**.

    La **prevención** es una estrategia de tratamiento de deadlocks que evita su ocurrencia **eliminando al menos una**
    de esas condiciones mediante políticas definidas de antemano (por ejemplo, pedir los recursos en un orden global
    para que nunca haya espera circular). Si una de las condiciones no puede darse, el deadlock es imposible.
- enunciado: (1P 2C2025 TM, single choice 7) ¿Cuál de las siguientes **no** es una condición necesaria
    para la ocurrencia de deadlocks?
  opciones:
  - texto: Mutua exclusión
    explicacion: 'Es condición necesaria: al menos un recurso no compartible.'
  - texto: Espera limitada
    explicacion: Correcta.
  - texto: Sin desalojo
    explicacion: 'Es condición necesaria: los recursos no pueden quitarse por la fuerza.'
  - texto: Ninguna es correcta
    explicacion: La b) no es una condición de deadlock.
  correcta: 1
  justificacion: |
    Las cuatro condiciones necesarias (de Coffman) son **mutua exclusión**, **retención y espera**, **sin desalojo** y
    **espera circular**. **Espera limitada** no es una de ellas: es uno de los **requisitos de una buena solución a la
    condición de carrera** (junto con mutua exclusión, progreso y velocidad de los procesos). Es fácil confundirlas
    porque "mutua exclusión" aparece en las dos listas.
- enunciado: (1P 1C2026 TM, respuesta breve 1d) ¿Cuáles son las condiciones necesarias para la ocurrencia
    de deadlock?
  opciones:
  - texto: Mutua exclusión, progreso, espera limitada y espera circular
    explicacion: Progreso y espera limitada son requisitos de una solución a la condición de carrera,
      no condiciones de deadlock.
  - texto: Mutua exclusión, retención y espera, desalojo de recursos y espera circular
    explicacion: 'Es al revés: la condición es que **no** haya desalojo (los recursos no se pueden quitar
      por la fuerza).'
  - texto: Retención y espera, sin desalojo, espera circular e inanición de alguno de los procesos
    explicacion: La inanición es otro problema; falta la mutua exclusión.
  - texto: 'Mutua exclusión, retención y espera, sin desalojo y espera circular (las cuatro de Coffman)'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Las cuatro condiciones necesarias son:

    1. **Mutua exclusión:** al menos un recurso no es compartible.
    2. **Retención y espera:** un proceso retiene recursos mientras espera otros.
    3. **Sin desalojo:** los recursos no se le pueden quitar por la fuerza a quien los tiene.
    4. **Espera circular:** existe una cadena cerrada de procesos donde cada uno espera un recurso del siguiente.

    Deben darse las cuatro simultáneamente para que haya deadlock.
- enunciado: (1R 1C2026 TM, respuesta breve 1c) ¿Qué condición necesaria para la ocurrencia de deadlock
    puede eliminarse al utilizar recursos **read-only**?
  opciones:
  - texto: Retención y espera
    explicacion: Un proceso puede seguir reteniendo un recurso mientras espera otro, sea read-only o no.
  - texto: Espera circular
    explicacion: Si los recursos igual fueran exclusivos podría seguir habiendo ciclos; lo que cambia
      es que ya no son exclusivos.
  - texto: Sin desalojo
    explicacion: Que un recurso sea de solo lectura no hace que el SO pueda quitárselo a un proceso.
  - texto: Mutua exclusión
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Un recurso **read-only** (de solo lectura) puede ser usado por varios procesos al mismo tiempo sin riesgo, porque
    nadie lo modifica (no se cumple Bernstein). Deja de ser un recurso no compartible, así que se elimina la condición
    de **mutua exclusión** para ese recurso, y ningún proceso tiene que esperar para usarlo. Es una de las pocas
    formas prácticas de atacar esa condición en la prevención.
- enunciado: (1R 1C2026 TM, desarrollo 5) ¿Cuál de estas explicaciones de una condición necesaria del
    deadlock es **correcta**?
  opciones:
  - texto: 'Sin desalojo: el SO no puede desalojar de la CPU a un proceso mientras tenga algún recurso
      asignado'
    explicacion: El "desalojo" de la condición es de recursos, no de la CPU.
  - texto: 'Espera circular: todos los procesos del sistema esperan el mismo recurso y forman una cola
      circular para usarlo'
    explicacion: Es una cadena cerrada en la que cada proceso espera un recurso retenido por el siguiente,
      no una cola por un recurso.
  - texto: 'Retención y espera: un proceso retiene recursos ya asignados mientras espera otros que tienen
      otros procesos'
    explicacion: Correcta.
  - texto: 'Mutua exclusión: todos los recursos del sistema tienen que ser no compartibles para que ocurra
      un deadlock'
    explicacion: Alcanza con que **al menos un** recurso sea no compartible.
  correcta: 2
  justificacion: |
    Las explicaciones de la resolución oficial:

    - **Mutua exclusión:** al menos un recurso debe ser no compartible; si otro proceso lo pide, espera a que se libere.
    - **Retención y espera:** un proceso retiene uno o más recursos ya asignados mientras espera obtener recursos
      adicionales que están usando otros procesos.
    - **Sin desalojo:** los recursos no pueden ser retirados por la fuerza; solo el proceso que los tiene los libera.
    - **Espera circular:** existe una cadena cerrada de procesos donde cada uno espera un recurso retenido por el
      siguiente.

    Deben cumplirse las cuatro a la vez; la prevención consiste en impedir al menos una con políticas del SO.
- enunciado: (1P 1C2024 TM, V/F 5a) "En un sistema en que los procesos declaran sus peticiones máximas
    de recursos al iniciar, se utiliza algún mecanismo de prevención de deadlocks." ¿Verdadero o falso?
  opciones:
  - texto: 'Verdadero: declarar los máximos es una política definida a priori que elimina la condición
      de retención y espera'
    explicacion: Declarar los máximos no impide retener y esperar; solo le da información al SO para decidir
      cada asignación.
  - texto: 'Falso: es propio de la detección, que busca ciclos'
    explicacion: 'Detección no necesita los máximos: trabaja con las asignaciones y peticiones actuales.'
  - texto: 'Verdadero: con los máximos declarados el SO puede ordenar los recursos y así eliminar la espera
      circular'
    explicacion: El orden de pedido no depende de declarar máximos.
  - texto: 'Falso: declarar de antemano las peticiones máximas es lo que requiere la evasión (algoritmo del banquero), no la prevención'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    **Falso.** La **matriz de peticiones máximas** es lo que necesita la **evasión**: el algoritmo del banquero usa los
    máximos declarados para calcular, ante cada petición, si el estado resultante es seguro. La prevención no necesita
    esa información, porque se basa en políticas fijas que eliminan alguna de las condiciones necesarias (por ejemplo,
    pedir en orden o pedir todo junto). La detección tampoco la usa: analiza el estado actual.
- enunciado: '(1P 1C2025 TT, teoría 1) Comparando **prevención** con **evasión** en términos de overhead
    y de flexibilidad a la hora de solicitar recursos:'
  opciones:
  - texto: Prevención tiene overhead alto porque revisa las cuatro condiciones en cada petición; evasión
      es más liviana y más flexible
    explicacion: 'Prevención no revisa nada en cada petición: sus políticas se definen de antemano.'
  - texto: 'Prevención: overhead mínimo y menos flexible. Evasión: overhead alto y más flexible'
    explicacion: Correcta.
  - texto: Ambas tienen overhead alto porque las dos corren el banquero
    explicacion: Solo evasión corre el banquero; prevención es la menos flexible.
  - texto: Prevención tiene overhead mínimo y es más flexible; evasión tiene overhead alto y además restringe
      el orden de pedido
    explicacion: Restringir el orden de pedido es justamente una política de prevención, lo que la hace
      menos flexible.
  correcta: 1
  justificacion: |
    La **prevención** asegura que al menos una de las condiciones necesarias nunca se cumpla, por ejemplo pidiendo los
    recursos siempre en un orden preestablecido (sin espera circular).

    | | Prevención | Evasión |
    |---|---|---|
    | Overhead | Mínimo: políticas definidas a priori que no requieren ejecución activa. | Alto: corre el algoritmo del banquero ante cada petición. |
    | Flexibilidad | Menor: las políticas limitan cómo se piden los recursos. | Mayor: cualquier petición se concede si el sistema queda en estado seguro; solo exige declarar los máximos. |
- enunciado: (1R 1C2025 TM, teoría 5) ¿En qué se diferencian la estrategia de **evasión** y la de **detección**
    de deadlock?
  opciones:
  - texto: Evasión actúa en cada asignación y el deadlock no puede ocurrir; detección actúa cuando ya
      ocurrió
    explicacion: Correcta.
  - texto: Evasión actúa sobre un deadlock que ya se formó y detección en cada asignación; ambas impiden
      que el deadlock ocurra
    explicacion: 'Están invertidas, y detección no impide el deadlock: lo encuentra una vez que existe.'
  - texto: Ambas actúan en cada asignación de recursos, pero solo detección necesita que los procesos
      declaren sus peticiones máximas
    explicacion: Es evasión la que requiere las peticiones máximas; detección no actúa en cada asignación.
  - texto: 'Evasión elimina una condición necesaria por diseño y detección corre el algoritmo del banquero en cada petición'
    explicacion: Eliminar condiciones es prevención; el banquero es de evasión.
  correcta: 0
  justificacion: |
    Tabla de la resolución oficial:

    | | ¿Cuándo se aplica? | Flexibilidad de peticiones | ¿Puede ocurrir deadlock? | Overhead |
    |---|---|---|---|---|
    | Detección | Sobre el deadlock | Muy flexible: cualquier petición válida puede realizarse. | Sí | Depende de la frecuencia del algoritmo de detección. |
    | Evasión | En cada asignación | Intermedia: los procesos deben declarar sus peticiones máximas. | No | Alto: se corre el banquero con cada petición. |
- enunciado: (1R 1C2025 TM, teoría 5) En la PC de un puesto administrativo, donde el operador usa planillas
    de cálculo, imprime documentos y navega por internet, ¿qué estrategia conviene entre evasión y detección,
    y por qué?
  opciones:
  - texto: 'Evasión: un deadlock en la impresora justifica correr el banquero'
    explicacion: Un deadlock en este sistema es poco crítico (se puede reiniciar la aplicación); no justifica
      el overhead.
  - texto: 'Evasión: como el operador usa pocos recursos, declarar las peticiones máximas es sencillo
      y no agrega ningún overhead'
    explicacion: 'Aunque se declaren fácilmente, el banquero corre en cada petición: el overhead existe
      igual.'
  - texto: 'Detección y recuperación: garantiza que el deadlock nunca ocurra, igual que evasión, pero
      con un costo mucho menor'
    explicacion: 'Detección no garantiza que no ocurra: lo encuentra cuando ya ocurrió.'
  - texto: 'Detección: en ese puesto el deadlock es poco crítico, hay menos overhead que con evasión y no hay que declarar peticiones máximas'
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    En este sistema la **criticidad de un deadlock es baja**: si ocurre, se puede recuperar sin grandes pérdidas. Por
    eso conviene **detección y recuperación**, con dos ventajas frente a evasión:

    - **Menos overhead:** no hay que correr el algoritmo del banquero ante cada petición.
    - **Mayor flexibilidad:** los procesos no tienen que declarar los recursos máximos que van a usar (algo difícil de
      saber de antemano en aplicaciones interactivas como estas).

    La evasión se justificaría en un sistema donde un deadlock sea inaceptable y los máximos se conozcan de antemano.
- enunciado: (1R 1C2025 TT, V/F 5a) "La estrategia de detección de deadlock analiza el estado actual del
    sistema cada vez que un proceso solicita un recurso." ¿Verdadero o falso?
  opciones:
  - texto: 'Verdadero: detección corre en cada petición y, si la asignación forma un deadlock, la rechaza
      antes de hacerla'
    explicacion: Rechazar asignaciones para no llegar al deadlock es lo que hace evasión.
  - texto: 'Falso: detección no analiza el estado actual del sistema, sino las peticiones máximas declaradas
      por cada proceso'
    explicacion: 'Es al revés: detección sí analiza el estado actual; las peticiones máximas son de evasión.'
  - texto: 'Falso: analiza el estado actual buscando deadlock, pero se corre periódicamente (o ante cierto evento), no en cada petición'
    explicacion: Correcta.
  - texto: 'Verdadero: por eso tiene el mismo overhead que evasión'
    explicacion: El overhead de detección depende de cada cuánto se ejecute; no corre en cada petición.
  correcta: 2
  justificacion: |
    **Falso.** El algoritmo de detección sí analiza el **estado actual** del sistema (recursos asignados, peticiones
    pendientes y disponibles) para determinar si **existe** un deadlock, pero no lo hace cada vez que un proceso pide un
    recurso: se ejecuta periódicamente o ante algún evento (por ejemplo, baja utilización de CPU). Por eso su overhead
    depende de la frecuencia con que se lo corra. El que actúa en cada petición es el banquero de la evasión.
- enunciado: (1R 1C2025 TT, V/F 5b) "La estrategia de prevención asegura que nunca ocurrirá deadlock pero
    como consecuencia puede ocurrir una baja tasa de uso de recursos." ¿Verdadero o falso?
  opciones:
  - texto: 'Verdadero: sus políticas pueden impedir asignar o usar recursos aunque estén disponibles'
    explicacion: Correcta.
  - texto: 'Falso: prevención no asegura que nunca ocurra deadlock, solamente reduce la probabilidad de
      que se forme un ciclo'
    explicacion: 'Si una condición necesaria no puede darse, el deadlock es imposible: sí lo asegura.'
  - texto: 'Falso: prevención no afecta el uso de recursos, porque sus políticas solo se chequean una
      vez cuando arranca el proceso'
    explicacion: Las políticas condicionan todas las peticiones del proceso, y eso sí afecta el uso de
      los recursos.
  - texto: 'Verdadero: porque corre un algoritmo costoso (como el banquero) en cada petición de recursos'
    explicacion: Eso describe overhead (y es de evasión); prevención casi no tiene overhead.
  correcta: 0
  justificacion: |
    **Verdadero.** La prevención obliga a los procesos a pedir los recursos respetando ciertas políticas (todos juntos,
    en un orden global, de a uno, etc.). Eso asegura que alguna condición necesaria no se cumpla y que el deadlock no
    ocurra nunca, pero puede provocar que algunos recursos no puedan ser pedidos o usados **aunque estén disponibles**
    (por ejemplo, un proceso que pide todo junto retiene recursos que todavía no usa). El resultado es una **baja tasa
    de uso de recursos**.
- enunciado: (1P 2C2025 TM, desarrollo 3) ¿Cuál de estos pares son dos formas de implementar la **prevención**
    de deadlocks?
  opciones:
  - texto: Pedir todos los recursos juntos (o ninguno) y pedirlos en un orden global creciente
    explicacion: Correcta.
  - texto: 'Declarar de antemano las peticiones máximas y conceder cada pedido solo si el sistema queda en un estado seguro'
    explicacion: 'Eso es evasión: no elimina ninguna condición, decide cada asignación.'
  - texto: Correr periódicamente un algoritmo de detección y finalizar de a un proceso hasta romper el
      ciclo
    explicacion: 'Eso es detección y recuperación: el deadlock sí llega a ocurrir.'
  - texto: Asignar prioridades fijas a los procesos y aplicar herencia de prioridades al proceso que retiene
      un recurso
    explicacion: La herencia de prioridades soluciona la inversión de prioridades, no el deadlock.
  correcta: 0
  justificacion: |
    La prevención diseña el sistema para que al menos una de las 4 condiciones no pueda cumplirse:

    - **Eliminar retención y espera:** el proceso pide todos los recursos que va a necesitar de una vez; si no los
      consigue todos, no se le da ninguno.
    - **Eliminar espera circular:** se define un orden global de los recursos y los procesos solo pueden pedirlos en
      orden creciente.

    Comparada con prevención, la **evasión es más flexible**: no restringe a priori cómo se piden los recursos (solo
    exige conocer los máximos) y, ante cada petición, la concede si el sistema queda en estado seguro.
- enunciado: (1P 2C2025 TT, desarrollo 3) Una técnica de prevención obliga a pedir **de a un recurso,
    usarlo y liberarlo antes de pedir otro**. ¿Qué condición necesaria elimina?
  opciones:
  - texto: La mutua exclusión
    explicacion: El recurso se sigue usando de forma exclusiva mientras se lo tiene.
  - texto: El sin desalojo de los recursos
    explicacion: 'Nadie le quita el recurso al proceso: lo libera él mismo.'
  - texto: La espera circular
    explicacion: 'Se elimina indirectamente, pero la condición atacada es otra: nunca se retiene algo
      mientras se espera.'
  - texto: La retención y espera
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Si el proceso siempre libera el recurso que tiene **antes** de pedir otro, nunca está **reteniendo** un recurso
    mientras **espera** otro: se elimina la condición de **retención y espera**. Es una de las tres técnicas de la
    resolución oficial:

    1. Eliminar retención y espera pidiendo todos los recursos juntos, usarlos y liberarlos.
    2. Eliminar retención y espera pidiendo de a un recurso, usarlo y liberarlo antes de pedir otro.
    3. Eliminar la espera circular asignando un orden a los recursos y respetándolo al pedirlos.
- enunciado: (1P 2C2025 TT, desarrollo 3) Con respecto al **uso de recursos**, ¿qué ventaja y desventaja
    tiene la prevención frente a las otras estrategias?
  opciones:
  - texto: Alta tasa de utilización de recursos, porque nunca hay procesos bloqueados en deadlock reteniendo
      recursos sin usarlos
    explicacion: 'Es al revés: las políticas de prevención suelen dejar recursos libres sin poder asignarse.'
  - texto: Baja utilización de recursos, pero sin algoritmos que agreguen overhead al asignarlos
    explicacion: Correcta.
  - texto: Baja tasa de utilización y además alto overhead, porque tiene que chequear las políticas con
      el banquero en cada petición
    explicacion: 'Prevención no corre el banquero: esa es la evasión.'
  - texto: La misma utilización que detección, pero sin declarar máximos
    explicacion: Detección no impone restricciones y aprovecha mejor los recursos; y ninguna de las dos
      pide máximos.
  correcta: 1
  justificacion: |
    Por las técnicas y políticas que impone para la asignación, la prevención genera una **baja tasa de utilización de
    recursos**: puede haber recursos disponibles que no se asignan porque hay que respetar las políticas (por ejemplo,
    pedir en orden, o pedir todo junto aunque algunos recursos se usen recién al final).

    La **ventaja** es que no requiere implementar ni ejecutar algoritmos que agreguen overhead durante la asignación de
    recursos (como el banquero de la evasión) ni cuando ya hay un deadlock (como la detección y recuperación).
---

Este simulacro reúne preguntas de **teoría** de parciales anteriores (2024 a 2026) sobre **deadlock**: condiciones necesarias y comparación entre prevención, evasión y detección. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la justificación de cada una resume la resolución oficial de la cátedra.
