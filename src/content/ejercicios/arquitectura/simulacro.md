---
titulo: 'Teoría de parciales: Repaso de arquitectura'
tema: parcial-1/arquitectura
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- interrupciones
- ciclo-de-instruccion
- dma
preguntas:
- enunciado: '(1R 1C2025 TM) Verdadero o falso: "Si se estaba ejecutando una syscall y ocurre una interrupción,
    se esperará a que finalice su ejecución para atenderla, por ser código del SO."'
  opciones:
  - texto: 'Verdadero: el código del SO nunca puede ser interrumpido, porque corre en modo kernel con
      máxima prioridad'
    explicacion: Estar en modo kernel no impide que lleguen interrupciones; solo se postergan si están
      deshabilitadas.
  - texto: 'Falso: la interrupción se atiende al terminar la instrucción en curso (el kernel también es interrumpible) y después se retoma la syscall'
    explicacion: Correcta.
  - texto: 'Falso: la syscall se cancela y el proceso tiene que volver a invocarla después de la interrupción'
    explicacion: 'No se pierde el trabajo hecho: se guarda el contexto de la syscall para reanudarla.'
  - texto: 'Verdadero: las interrupciones solo se chequean cuando la CPU vuelve a modo usuario'
    explicacion: El chequeo de interrupciones es parte del ciclo de instrucción, en cualquier modo.
  correcta: 1
  justificacion: |
    **Falso.** Las interrupciones se chequean al final de cada instrucción, sin importar si el código que ejecuta es del SO o de un usuario. Si llega una interrupción durante una syscall, se interrumpe la ejecución (como última etapa del ciclo de instrucción actual), se **guarda el contexto** de la syscall en curso, se atiende la interrupción y luego se reanuda la syscall.

    La resolución oficial acepta también **Verdadero** con una justificación específica: si la syscall **deshabilitó las interrupciones** (por ejemplo, para garantizar mutua exclusión), la interrupción recién se atiende cuando se vuelven a habilitar. Lo que no es válido es justificarlo con que "el código del SO no se interrumpe".
- enunciado: '(1R 1C2025 TM) Verdadero o falso: "Las interrupciones sincrónicas (excepciones) son aquellas
    que genera el mismo SO."'
  opciones:
  - texto: 'Verdadero: son las que dispara el SO con una syscall para cambiar de modo'
    explicacion: Una syscall es un pedido del proceso, no una interrupción que "genera" el SO.
  - texto: 'Falso: las generan los dispositivos de E/S cuando terminan una operación, en sincronía con
      el reloj'
    explicacion: 'Las de fin de E/S son asincrónicas: no dependen de la instrucción que se está ejecutando.'
  - texto: 'Falso: surgen al ejecutar una instrucción (por ejemplo, dividir por cero) y las detecta la
      CPU'
    explicacion: Correcta.
  - texto: 'Verdadero: el SO las genera a intervalos fijos, sincronizadas con el reloj del sistema'
    explicacion: Las interrupciones de reloj son de hardware y asincrónicas respecto del programa.
  correcta: 2
  justificacion: |
    **Falso.** Las interrupciones sincrónicas (excepciones) son causadas por eventos que ocurren como **resultado directo de la ejecución de una instrucción**: división por cero, acceso inválido a memoria, instrucción privilegiada en modo usuario, page fault.

    No las genera el SO como tal, sino el propio **hardware** o la lógica del procesador en respuesta a esa instrucción. Después las **atiende** el SO.

    Se llaman sincrónicas porque, si se vuelve a ejecutar el mismo programa con los mismos datos, ocurren en el mismo punto. Las asincrónicas (fin de E/S, reloj) llegan en cualquier momento, sin relación con la instrucción en curso.
- enunciado: '(1R 2C2025) Considerando que las interrupciones no están deshabilitadas, las mismas se atienden:'
  opciones:
  - texto: Al finalizar de ejecutar la instrucción en curso
    explicacion: Correcta.
  - texto: En cuanto ocurren
    explicacion: 'La CPU no corta una instrucción a la mitad: primero la termina.'
  - texto: Cuando el planificador elija a otro proceso a ejecutar
    explicacion: La atención no depende del planificador; puede que ni siquiera haya cambio de proceso.
  - texto: Luego de desalojar al proceso actual
    explicacion: Atender una interrupción no implica desalojar al proceso que estaba ejecutando.
  correcta: 0
  justificacion: |
    El ciclo de instrucción es **fetch → decode → execute → chequeo de interrupciones**. La CPU no interrumpe una instrucción a la mitad: recién al terminarla revisa si hay interrupciones pendientes y, si las hay (y están habilitadas), guarda el contexto y salta a la rutina de atención.

    Atender una interrupción no implica desalojar al proceso: después de la rutina, el planificador puede decidir que siga el mismo.
- enunciado: (1R 2C2025) ¿Cuál de las siguientes es una interrupción sincrónica?
  opciones:
  - texto: Fin de quantum
    explicacion: 'La genera el reloj, sin relación con la instrucción que se ejecuta: es asincrónica.'
  - texto: Fin de Entrada/Salida
    explicacion: 'La genera el dispositivo cuando termina: es asincrónica.'
  - texto: Error en un dispositivo
    explicacion: 'Viene del hardware externo en cualquier momento: es asincrónica.'
  - texto: División por cero
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Una interrupción es **sincrónica** cuando la provoca la propia instrucción que se está ejecutando. La **división por cero** ocurre justamente al ejecutar la división: si se corre de nuevo el programa con los mismos datos, ocurre en el mismo punto.

    El fin de quantum (reloj), el fin de E/S y el error en un dispositivo vienen de hardware externo a la CPU y pueden llegar en cualquier momento: son **asincrónicas**.
- enunciado: (1P 1C2026 TT) ¿Cómo se llaman aquellas interrupciones cuya atención podría ser postergada
    temporalmente?
  opciones:
  - texto: Sincrónicas
    explicacion: Sincrónica/asincrónica clasifica el origen, no si se pueden postergar.
  - texto: No enmascarables
    explicacion: Estas son justamente las que no pueden postergarse.
  - texto: Enmascarables
    explicacion: Correcta.
  - texto: Asincrónicas de E/S
    explicacion: 'Que sea de E/S no la hace postergable: depende de si se puede enmascarar.'
  correcta: 2
  justificacion: |
    Las interrupciones **enmascarables** son las que el SO puede postergar temporalmente, por ejemplo deshabilitando interrupciones mientras ejecuta una sección crítica. Quedan pendientes y se atienden cuando se vuelven a habilitar.

    Las **no enmascarables** (por ejemplo, fallas graves de hardware) no pueden postergarse.
- enunciado: (1R 1C2026 TM) ¿Cuál de las siguientes es una interrupción asincrónica?
  opciones:
  - texto: Fin de quantum
    explicacion: Correcta.
  - texto: Solicitud de Entrada/Salida
    explicacion: La solicitud la hace el propio proceso con una syscall, al ejecutar esa instrucción.
  - texto: Page fault
    explicacion: 'Surge al ejecutar la instrucción que accede a una página ausente: es sincrónica.'
  - texto: División por cero
    explicacion: 'La provoca la instrucción que se está ejecutando: es sincrónica.'
  correcta: 0
  justificacion: |
    El **fin de quantum** lo señala el reloj del sistema, que interrumpe en cualquier momento sin relación con la instrucción que se está ejecutando: es **asincrónica**.

    Las otras tres surgen de ejecutar una instrucción concreta del proceso: la solicitud de E/S (una syscall), el page fault (acceso a una página no cargada) y la división por cero.
- enunciado: (1R 1C2026 TT) ¿Cuál es la primera etapa u operación que se debe realizar en el ciclo de
    instrucción?
  opciones:
  - texto: Decodificación de la instrucción
    explicacion: Para decodificarla primero hay que tenerla en el IR.
  - texto: Búsqueda (fetch) de la instrucción
    explicacion: Correcta.
  - texto: Chequeo de interrupciones pendientes
    explicacion: El chequeo de interrupciones es la última etapa, no la primera.
  - texto: Ejecución de la instrucción
    explicacion: La ejecución viene después de buscarla y decodificarla.
  correcta: 1
  justificacion: |
    El ciclo de instrucción es:

    1. **Fetch (búsqueda):** se trae de memoria la instrucción que indica el PC y se deja en el IR; el PC avanza.
    2. **Decode:** se interpreta la instrucción.
    3. **Execute:** se ejecuta.
    4. **Chequeo de interrupciones:** si hay alguna pendiente y habilitada, se atiende.
- enunciado: (1R 1C2026 TT) ¿Cómo se denomina al tipo de interrupciones cuya ejecución no puede ser postergada?
  opciones:
  - texto: Enmascarables
    explicacion: Las enmascarables son las que sí pueden postergarse.
  - texto: Sincrónicas (excepciones)
    explicacion: Sincrónica/asincrónica clasifica el origen, no si se pueden postergar.
  - texto: De reloj (fin de quantum)
    explicacion: 'El reloj genera interrupciones enmascarables: el SO puede postergarlas.'
  - texto: No enmascarables
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Las **no enmascarables** son las interrupciones que no pueden deshabilitarse ni postergarse: la CPU las atiende siempre. Se reservan para eventos críticos, como fallas graves de hardware.

    Las **enmascarables**, en cambio, pueden quedar pendientes mientras las interrupciones estén deshabilitadas.
- enunciado: (1P 2C2025 TM) ¿Cuál de los sistemas de gestión de E/S requiere un menor consumo de ciclos
    de CPU?
  opciones:
  - texto: E/S por interrupciones
    explicacion: Evita la espera activa, pero la CPU igual participa en cada transferencia.
  - texto: E/S programada
    explicacion: 'Es la que más consume: la CPU queda consultando el estado del dispositivo.'
  - texto: E/S por DMA
    explicacion: Correcta.
  - texto: No hay grandes diferencias entre estos métodos
    explicacion: Las diferencias son grandes, justamente en ciclos de CPU.
  correcta: 2
  justificacion: |
    | Técnica | Participación de la CPU |
    |---|---|
    | **Programada** | La CPU hace espera activa consultando el dispositivo hasta que termine. Máximo consumo. |
    | **Por interrupciones** | La CPU sigue con otra cosa y el dispositivo avisa; pero la CPU mueve los datos, con una interrupción por cada transferencia. |
    | **DMA** | El controlador DMA transfiere el bloque completo directo a memoria y la CPU solo recibe una interrupción al final. Mínimo consumo. |
---

Simulacro con preguntas de teoría de parciales anteriores (primeros parciales y recuperatorios, 2024 a 2026) sobre interrupciones, ciclo de instrucción y técnicas de E/S, agrupadas por tema. Cada pregunta indica entre paréntesis el examen de donde sale.

Las preguntas de respuesta breve, verdadero o falso y desarrollo se reformularon como multiple choice. La respuesta correcta es siempre la de la resolución oficial, y al acertar se muestra su justificación.
