---
titulo: 'Teoría de parciales: Sistemas operativos'
tema: parcial-1/sistemas-operativos
fuente:
  guia: Parciales 2024–2026 (teoría)
  numero: S
tipo: teorico
dificultad: parcial
tags:
- simulacro
- teoria
- parcial
- syscall
- wrapper
- modos-de-ejecucion
- microkernel
preguntas:
- enunciado: (1P 1C2024 TM) ¿Cuál es la diferencia entre una syscall y su respectivo wrapper de la biblioteca
    del sistema, y cuándo conviene usar cada uno?
  opciones:
  - texto: El wrapper ejecuta el servicio en modo usuario sin pasar por el kernel; por eso conviene siempre
      que se busque performance
    explicacion: El wrapper es código de usuario, pero para acceder al servicio igual termina invocando
      a la syscall.
  - texto: La syscall es portable entre sistemas operativos y el wrapper no; conviene la syscall cuando
      el programa debe correr en varios SO
    explicacion: 'Es al revés: cada SO tiene sus propias syscalls; lo estandarizado entre sistemas es
      la biblioteca.'
  - texto: 'El wrapper es una función de biblioteca que envuelve la syscall: conviene por simpleza y portabilidad; la syscall directa, por control fino del pedido'
    explicacion: Correcta.
  - texto: 'Son lo mismo con distinto nombre: el compilador decide cuál de las dos se usa'
    explicacion: 'No son lo mismo: uno es una función de biblioteca y la otra es la entrada al kernel.'
  correcta: 2
  justificacion: |
    - **Syscall:** es la interfaz que brinda el SO para acceder de forma segura a los servicios que provee. Es propia de cada sistema.
    - **Wrapper:** función de la biblioteca del sistema que "envuelve" la llamada a la syscall con lógica extra, para simplificar su uso y dar **portabilidad**.

    Cuándo conviene cada uno:

    - **Wrapper:** cuando se busca simplicidad y portabilidad.
    - **Syscall directa:** cuando se necesita control completo sobre la configuración del pedido de recursos o servicios al SO.

    Ejemplos de pares syscall/wrapper: `open`/`fopen`, `read`/`fread`, `write`/`fwrite`.
- enunciado: (1R 1C2025 TT) Un proceso fue escrito usando syscalls directamente. ¿Cómo podría adaptarse
    para que sea portable y qué desventaja trae esa adaptación?
  opciones:
  - texto: 'Recompilándolo en el otro sistema: las syscalls son iguales en todos los SO, así que no hay
      desventajas'
    explicacion: 'Las syscalls son propias de cada SO: otro sistema no las reconocería.'
  - texto: Reescribiéndolo con wrappers de bibliotecas estándar, a costa de perder algo de personalización
      del pedido
    explicacion: Correcta.
  - texto: Ejecutándolo en modo kernel para que acceda al hardware directamente; la desventaja es la menor
      seguridad
    explicacion: Un proceso de usuario no puede elegir ejecutar en modo kernel, y eso no tiene que ver
      con la portabilidad.
  - texto: Usando wrappers; la desventaja es que el proceso ya no puede pasar a modo kernel para pedir
      servicios al SO
    explicacion: El wrapper invoca por dentro a la syscall, así que el cambio de modo sigue ocurriendo.
  correcta: 1
  justificacion: |
    Un proceso escrito con syscalls **no es portable**: las syscalls son propias de cada SO y otro sistema no las reconocería.

    - **Adaptación:** reescribirlo usando **wrappers** de bibliotecas estándar, disponibles en distintos sistemas (por ejemplo `fopen` en lugar de `open`).
    - **Desventaja:** los wrappers pueden ser **menos personalizables** que la syscall directa, porque exponen solo las opciones comunes a todos los sistemas.

    El wrapper igual termina invocando a la syscall del SO donde corre, así que el cambio de modo sigue existiendo.
- enunciado: '(1P 2C2025 TM) Las llamadas al sistema permiten a los procesos de usuario:'
  opciones:
  - texto: Ejecutar cualquier instrucción privilegiada
    explicacion: 'El proceso no ejecuta instrucciones privilegiadas: le pide al SO que haga la operación.'
  - texto: Evitar el modo kernel
    explicacion: 'Al contrario: la syscall es justamente uno de los caminos para pasar a modo kernel.'
  - texto: Interactuar con el hardware sin protección
    explicacion: La syscall existe para que el acceso al hardware sea controlado por el SO.
  - texto: Ninguna de las anteriores
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Una syscall es un **pedido al SO**: se produce un cambio a modo kernel y es el SO quien ejecuta la operación, con sus controles.

    - **a)** Falso: el proceso no ejecuta instrucciones privilegiadas; las ejecuta el SO en su nombre, y solo las que correspondan a ese servicio.
    - **b)** Falso: la syscall provoca el cambio a modo kernel.
    - **c)** Falso: el objetivo es que el acceso al hardware sea **protegido**, pasando por el SO.

    Por eso la respuesta es **d) Ninguna de las anteriores**.
- enunciado: '(1P 2C2025 TT) Cuando un proceso crea a otro proceso, necesita:'
  opciones:
  - texto: Disparar una interrupción
    explicacion: 'El proceso no dispara interrupciones para pedir servicios: usa la interfaz que da el
      SO.'
  - texto: Ejecutar una instrucción privilegiada
    explicacion: Un proceso de usuario no puede ejecutar instrucciones privilegiadas.
  - texto: Ejecutar una syscall
    explicacion: Correcta.
  - texto: No puede crearlo
    explicacion: Sí puede, por ejemplo con fork() en Linux.
  correcta: 2
  justificacion: |
    Crear un proceso implica que el SO asigne un PID, reserve memoria para la imagen, arme el PCB y lo agregue a las colas de planificación. Todo eso lo hace el **kernel**, así que el proceso tiene que pedírselo con una **syscall** (por ejemplo `fork()` en Linux).

    - El proceso de usuario no puede ejecutar instrucciones privilegiadas por su cuenta.
    - Sí puede crear otros procesos: el SO los crea a pedido.
- enunciado: (1P 1C2024 TT) ¿Cuál es la relación entre las instrucciones privilegiadas/no privilegiadas
    y los modos de ejecución?
  opciones:
  - texto: En modo kernel se ejecutan ambas clases; en modo usuario, únicamente las no privilegiadas
    explicacion: Correcta.
  - texto: En modo kernel solo se ejecutan las privilegiadas y en modo usuario solo las no privilegiadas
    explicacion: 'El modo kernel no está limitado a las privilegiadas: el SO también usa MOV, ADD, etc.'
  - texto: En modo usuario se pueden ejecutar privilegiadas si el proceso tiene permisos de administrador
    explicacion: Los permisos del usuario son un concepto del SO; el hardware solo mira el modo de la
      CPU.
  - texto: 'En modo usuario también se ejecutan las privilegiadas, pero el SO valida cada una antes de ejecutarla'
    explicacion: Si fuera así, un proceso de usuario podría operar sobre el hardware directamente.
  correcta: 0
  justificacion: |
    | Modo | Instrucciones que puede ejecutar |
    |---|---|
    | **Kernel** | Privilegiadas **y** no privilegiadas |
    | **Usuario** | Solo no privilegiadas |

    El modo actual queda indicado en un bit del PSW. Las privilegiadas (habilitar/deshabilitar interrupciones, operar sobre dispositivos, detener la CPU) quedan reservadas al SO; si un programa las necesita, se las pide al SO con una syscall.
- enunciado: (1P 1C2025 TM) En un sistema cuya CPU tiene modos de ejecución para garantizar la protección,
    ¿cuál es la forma correcta de operar sobre el hardware desde un proceso de usuario?
  opciones:
  - texto: Hacer una syscall, para que sea el SO quien realice la operación en modo kernel
    explicacion: Correcta.
  - texto: 'Ejecutar directamente la instrucción privilegiada: la CPU cambia sola a modo kernel al detectarla'
    explicacion: 'La CPU no cambia de modo para dejar pasar la instrucción: la rechaza.'
  - texto: 'Deshabilitar interrupciones para que nadie lo interrumpa y acceder directamente al dispositivo'
    explicacion: Deshabilitar interrupciones es en sí una instrucción privilegiada.
  - texto: Cambiar a kernel el bit de modo del PSW, ejecutar la operación y volver a modo usuario
    explicacion: Un proceso de usuario no puede cambiar de modo por su cuenta.
  correcta: 0
  justificacion: |
    La forma correcta es a través de una **syscall**: el proceso le "pide" al SO que realice la operación por él. Se produce el cambio a modo kernel, el SO ejecuta las instrucciones privilegiadas necesarias y luego se vuelve a modo usuario.

    Un proceso de usuario no puede cambiar de modo por su cuenta: solo una interrupción o una syscall llevan a modo kernel, y en los dos casos el control pasa al código del SO.
- enunciado: (1P 1C2025 TM) En ese mismo sistema, ¿qué ocurre si un proceso de usuario usa la forma "incorrecta"
    e intenta ejecutar él mismo la instrucción privilegiada?
  opciones:
  - texto: 'La CPU lanza una excepción, el SO la atiende y finaliza el proceso'
    explicacion: Correcta.
  - texto: La instrucción se ejecuta igual, aunque más lenta, porque el SO la emula
    explicacion: 'El SO no emula la instrucción: el intento se trata como un error.'
  - texto: La CPU la ignora y el proceso sigue con la instrucción siguiente sin enterarse
    explicacion: 'El intento no pasa desapercibido: el hardware lo detecta y avisa.'
  - texto: El SO pasa automáticamente a modo kernel y ejecuta la instrucción en nombre del proceso
    explicacion: El SO sí toma el control, pero no para completar la operación prohibida.
  correcta: 0
  justificacion: |
    Intentar ejecutar la instrucción privilegiada en modo usuario **falla**, porque solo puede ejecutarse en modo kernel:

    1. La CPU detecta el intento y lanza una **excepción** (interrupción sincrónica).
    2. La excepción la atiende el **SO**, que toma el control en modo kernel.
    3. El SO normalmente decide **finalizar al proceso** que la provocó.

    Por eso la única forma válida de operar sobre el hardware es pedírselo al SO con una syscall.
- enunciado: '(1P 2C2025 TT) Una instrucción privilegiada puede ser ejecutada:'
  opciones:
  - texto: En modo usuario
    explicacion: En modo usuario solo se ejecutan instrucciones no privilegiadas.
  - texto: Solo en modo kernel
    explicacion: Correcta.
  - texto: En ambos modos
    explicacion: Si se pudiera en modo usuario, no habría protección.
  - texto: No se pueden ejecutar
    explicacion: Se ejecutan, pero solo el SO puede hacerlo.
  correcta: 1
  justificacion: |
    Las instrucciones privilegiadas solo pueden ejecutarse en **modo kernel**, es decir, solo las ejecuta el SO. En modo usuario, la CPU rechaza el intento con una excepción.
- enunciado: (1P 2C2025 TT) Comparando las arquitecturas monolítica y microkernel en mantenibilidad, overhead
    y tolerancia a fallas, ¿cuál afirmación es correcta?
  opciones:
  - texto: El monolítico tiene menos overhead y además es más tolerante a fallas, porque todo corre en
      modo kernel
    explicacion: Que todo corra junto en modo kernel es lo que hace que una falla afecte a todo el sistema.
  - texto: El microkernel tiene menos overhead, porque en modo kernel queda solo lo mínimo
    explicacion: Tener poco en el kernel obliga a comunicar los módulos a través de él, y eso agrega overhead.
  - texto: 'El microkernel es más mantenible y más tolerante a fallas (los servicios corren aislados en modo usuario), pero tiene más overhead'
    explicacion: Correcta.
  - texto: El monolítico es más fácil de mantener, porque todo el código está en un único módulo
    explicacion: Tener todo en un bloque aumenta el acoplamiento, y eso lo hace más difícil de mantener.
  correcta: 2
  justificacion: |
    | | Monolítica | Microkernel |
    |---|---|---|
    | **Mantenibilidad** | Más difícil: mayor acoplamiento entre responsabilidades | Más fácil: módulos separados entre sí y del microkernel |
    | **Overhead** | Menor: un único módulo, se llaman funciones y se accede a variables directamente | Mayor: los módulos se comunican a través del microkernel (cambios de modo y de contexto) |
    | **Tolerancia a fallas** | Menor: una falla afecta a todo el monolito, que puede modificar memoria de cualquier parte del kernel | Mayor: si un módulo falla, el resto y el microkernel no se ven afectados por estar aislados |
- enunciado: (1R 1C2026 TT) ¿Qué nombre recibe la arquitectura de sistema operativo que mantiene en modo
    kernel solo los mecanismos esenciales y ejecuta servicios como drivers y sistema de archivos en espacio
    de usuario?
  opciones:
  - texto: Monolítica
    explicacion: En la monolítica todo el SO, drivers incluidos, corre en modo kernel.
  - texto: En capas
    explicacion: La división en capas ordena el kernel, pero no saca los servicios a modo usuario.
  - texto: Kernel híbrido
    explicacion: Un híbrido deja buena parte de los servicios dentro del kernel por performance.
  - texto: Microkernel
    explicacion: Correcta.
  correcta: 3
  justificacion: |
    Es la arquitectura **microkernel**: en modo kernel queda solo lo mínimo (manejo de interrupciones, E/S básica, comunicación entre procesos, planificación) y el resto de los servicios corre como procesos en modo usuario.

    A cambio de ser más flexible, mantenible y tolerante a fallas, tiene más overhead: los servicios se comunican por mensajes a través del kernel.
---

Simulacro con preguntas de teoría de parciales anteriores (primeros parciales y recuperatorios, 2024 a 2026) sobre syscalls, wrappers, modos de ejecución y arquitecturas de kernel, agrupadas por tema. Cada pregunta indica entre paréntesis el examen de donde sale.

Las preguntas de respuesta breve, verdadero o falso y desarrollo se reformularon como multiple choice. La respuesta correcta es siempre la de la resolución oficial, y al acertar se muestra su justificación.
