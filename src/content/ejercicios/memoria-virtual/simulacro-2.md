---
titulo: 'Teoría de parciales: Memoria virtual'
tema: parcial-2/memoria-virtual
fuente: { guia: Parciales 2024–2026 (teoría), numero: S2 }
tipo: teorico
dificultad: parcial
tags: [simulacro, teoria, parcial, asignacion, sustitucion, bits, bit-de-modificado, clock-mejorado]
preguntas:
  - enunciado: '(2R 1C2024, V/F 2b) "Tener un sistema con memoria virtual permite tener un mayor grado de multiprogramación que en un sistema sin memoria virtual."'
    opciones:
      - texto: 'Verdadero: los procesos se cargan parcialmente, y el espacio que no ocupan se usa para cargar otros'
        explicacion: Correcta.
      - texto: 'Falso: el grado de multiprogramación depende solo de la cantidad de CPUs'
        explicacion: 'Depende de cuántos procesos entran en memoria.'
      - texto: 'Falso: la memoria virtual hace que cada proceso ocupe más, porque agrega bits en la tabla'
        explicacion: 'Los bits extra son mínimos; lo que importa es que no hace falta cargar todo el proceso.'
      - texto: 'Verdadero: con memoria virtual los procesos no ocupan RAM'
        explicacion: 'Ocupan RAM, pero solo con las páginas que usan.'
    correcta: 0
    justificacion: |
      **Verdadero.** Sin memoria virtual cada proceso tiene que estar **entero** en memoria. Con
      memoria virtual alcanza con las páginas que usa, y el resto del espacio se usa para cargar
      **más procesos**.
  - enunciado: '(2R 1C2025, desarrollo 5) Si los procesos nunca fueran más grandes que la memoria RAM, ¿tendría sentido el esquema de memoria virtual?'
    opciones:
      - texto: 'No: la memoria virtual solo sirve para ejecutar procesos más grandes que la RAM'
        explicacion: 'Esa es una de sus ventajas, no la única.'
      - texto: 'No: si los procesos entran, la memoria virtual solo agrega fallos de página'
        explicacion: 'Entran de a uno; todos juntos, no.'
      - texto: 'Sí: permite tener más procesos activos a la vez, cada uno con menos páginas en RAM'
        explicacion: Correcta.
      - texto: 'Sí: elimina la fragmentación interna'
        explicacion: 'La fragmentación interna de la paginación sigue estando.'
    correcta: 2
    justificacion: |
      **Sí.** Aunque cada proceso entre en la RAM, no entran **todos** a la vez. Con memoria virtual
      cada uno ocupa solo las páginas que está usando y se puede subir el **grado de
      multiprogramación**.
  - enunciado: '(2P 2C2024 TM, desarrollo 2) En un sistema con paginación y 1 GiB de RAM, la DL **8101FFFFh** de un proceso es válida. ¿El sistema usa memoria virtual?'
    opciones:
      - texto: 'Sí: esa dirección está más allá de 1 GiB, así que el proceso no entraría entero en la RAM aunque fuera el único'
        explicacion: Correcta.
      - texto: 'No: una DL de 32 bits es normal en cualquier sistema con paginación'
        explicacion: 'Que sea válida implica que el proceso tiene más de 2 GiB de espacio lógico.'
      - texto: 'No se puede saber: depende del tamaño de página'
        explicacion: 'El tamaño de página no cambia cuánto mide el espacio lógico.'
      - texto: 'No: la MMU la traduciría a una dirección física dentro de 1 GiB'
        explicacion: 'Traducirla a un frame existe, pero el proceso entero no entra en la RAM.'
    correcta: 0
    justificacion: |
      8101FFFFh es mayor que `2^30` (1 GiB): el proceso tiene un espacio lógico de más de 2 GiB.
      Sin memoria virtual no podría cargarse completo ni siendo el único. Así que usa **memoria
      virtual** (la otra posibilidad, según la resolución, sería una técnica como el *overlaying*,
      que carga solo una porción del proceso por vez).
  - enunciado: '(2P 2C2025 TM, single choice 3) ¿Cuál de las siguientes es una ventaja de implementar memoria virtual?'
    opciones:
      - texto: Reduce los accesos a disco
        explicacion: 'Los aumenta: cada fallo de página es un acceso a disco.'
      - texto: Previene el thrashing
        explicacion: 'El thrashing es un problema propio de la memoria virtual.'
      - texto: Reduce los accesos a memoria
        explicacion: 'Los aumenta: hay que consultar tablas más grandes.'
      - texto: Ninguna de las anteriores
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Ninguna: la memoria virtual **agrega** accesos a disco (fallos de página) y a memoria, y es la
      que trae el riesgo de thrashing. Sus ventajas son otras: procesos más grandes que la RAM y más
      multiprogramación.
  - enunciado: '(2R 2C2025, single choice 3) Al utilizar memoria virtual, los procesos pueden disponer de un espacio lógico:'
    opciones:
      - texto: Más grande que el área de swap
        explicacion: 'Las páginas que no están en RAM tienen que estar en algún lado: el swap.'
      - texto: Más grande que la memoria RAM
        explicacion: Correcta.
      - texto: Menor a su conjunto residente
        explicacion: 'El conjunto residente es parte del espacio lógico: no puede ser mayor.'
      - texto: Ninguna es correcta
        explicacion: 'La b) es correcta.'
    correcta: 1
    justificacion: |
      Es la idea de la memoria virtual: el proceso puede ser **más grande que la RAM**, porque solo
      una parte de sus páginas está cargada y el resto queda en el área de swap.
  - enunciado: '(2P 1C2025 TM, desarrollo 3; 2P 2C2025 TM, single choice 4) ¿Cuál de las siguientes combinaciones de asignación y sustitución de páginas no es posible?'
    opciones:
      - texto: Asignación fija y sustitución global
        explicacion: Correcta.
      - texto: Asignación fija y sustitución local
        explicacion: 'Es posible: el proceso reemplaza dentro de sus propios frames.'
      - texto: Asignación dinámica y sustitución global
        explicacion: 'Es posible: los procesos se roban frames y su cantidad cambia.'
      - texto: Asignación dinámica y sustitución local
        explicacion: 'Es posible: el SO ajusta los frames de cada proceso y cada uno reemplaza los suyos.'
    correcta: 0
    justificacion: |
      | | Sustitución local | Sustitución global |
      | --- | --- | --- |
      | Asignación dinámica | OK | OK |
      | Asignación fija | OK | **No** |

      Con asignación **fija** la cantidad de frames de cada proceso no cambia. La sustitución global
      lo contradice: si otro proceso le roba un frame, tiene menos; si él le roba a otro, tiene más.
  - enunciado: '(2R 1C2024, V/F 2a; 2P 2C2024 TM, V/F 5a) "El bit de modificado en las tablas de páginas en un sistema con memoria virtual es necesario únicamente cuando el algoritmo de reemplazo es clock mejorado."'
    opciones:
      - texto: 'Verdadero: es el único algoritmo que mira el bit M'
        explicacion: 'Es el único que lo usa para elegir víctima, pero no es el único uso del bit.'
      - texto: 'Falso: hace falta con cualquier algoritmo, para saber si al reemplazar una página hay que escribirla a disco'
        explicacion: Correcta.
      - texto: 'Falso: también lo usa LRU para ordenar las páginas'
        explicacion: 'LRU ordena por instante de referencia, no por M.'
      - texto: 'Verdadero: sin clock mejorado todas las víctimas se escriben a disco igual'
        explicacion: 'Escribir siempre sería un desperdicio: para evitarlo está el bit M.'
    correcta: 1
    justificacion: |
      **Falso.** Con memoria virtual el bit M es indispensable con **cualquier** algoritmo: al
      reemplazar una página, si M = 1 hay que escribirla a disco antes de usar el frame; si M = 0,
      la copia del disco ya está al día y se ahorra la escritura.
  - enunciado: '(2R 1C2025, desarrollo 3) En una tabla de páginas con bits de presencia, uso y modificado, ¿quién **pone en 1 el bit M** y quién lo **lee**?'
    opciones:
      - texto: 'Lo pone el SO cuando atiende un fallo de página; lo lee la MMU en cada traducción'
        explicacion: 'Al traer una página M queda en 0; y la MMU no necesita M para traducir.'
      - texto: 'Lo pone la MMU cuando el proceso escribe en la página; lo lee el SO al reemplazarla, para saber si escribirla a disco'
        explicacion: Correcta.
      - texto: 'Lo pone el proceso con una syscall; lo lee el SO'
        explicacion: 'Sería una syscall por escritura: lo hace el hardware.'
      - texto: 'Lo ponen y lo leen solo el SO, durante el algoritmo de reemplazo'
        explicacion: 'El SO no se entera de cada escritura: la ve el hardware.'
    correcta: 1
    justificacion: |
      | Bit | Lectura | Escritura |
      | --- | --- | --- |
      | **P** | La **MMU** al traducir (si es 0, genera el fallo de página) | El **SO** al cargar o sacar la página |
      | **U** | El **SO** al buscar víctima (Clock) | La **MMU** lo pone en 1 al referenciar; el **SO** lo baja en el Clock |
      | **M** | El **SO** al reemplazar, para decidir si escribir a disco | La **MMU** cuando el proceso escribe |

      (La resolución oficial menciona solo al SO modificando U en el Clock; que el hardware lo ponga
      en 1 en cada referencia es lo que hace funcionar al algoritmo.)
  - enunciado: '(2R 1C2025, desarrollo 3) ¿Quién **lee** el bit de presencia y quién lo **escribe**?'
    opciones:
      - texto: 'Lo lee el SO cuando elige víctima; lo escribe la MMU'
        explicacion: 'Están invertidos.'
      - texto: 'Lo lee y lo escribe la MMU, sin intervención del SO'
        explicacion: 'Cargar una página la hace el SO: es él quien la marca presente.'
      - texto: 'Lo lee la MMU al traducir; lo escribe el SO al cargar o descargar la página'
        explicacion: Correcta.
      - texto: 'Lo lee el proceso antes de acceder; lo escribe el SO'
        explicacion: 'El proceso no ve su tabla de páginas.'
    correcta: 2
    justificacion: |
      La **MMU** lo **lee** en cada traducción: si P = 0 genera la interrupción de fallo de página.
      El **SO** lo **escribe**: lo pone en 1 al terminar de traer la página y en 0 al elegirla como
      víctima.
  - enunciado: '(2R 1C2025, desarrollo 3) ¿Quién **lee** el bit de uso (U)?'
    opciones:
      - texto: 'La MMU, para decidir si traducir o no la dirección'
        explicacion: 'Para traducir alcanza con P y el frame.'
      - texto: 'El proceso, para saber qué páginas usa'
        explicacion: 'El proceso no ve su tabla de páginas.'
      - texto: 'Nadie: es un bit informativo'
        explicacion: 'Lo usa el algoritmo de reemplazo.'
      - texto: 'El SO, en el algoritmo Clock, al buscar una víctima'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Lo lee el **SO** cuando corre el algoritmo **Clock** (o Clock mejorado): una página con U = 1
      se salva (y el SO le baja el bit); la primera con U = 0 es la víctima.
  - enunciado: '(2R 2C2025, single choice 2) El algoritmo de sustitución de páginas **Clock Mejorado** requiere en la tabla de páginas:'
    opciones:
      - texto: Un timestamp de carga
        explicacion: 'Eso lo necesita FIFO.'
      - texto: Un timestamp de último acceso
        explicacion: 'Eso lo necesita LRU.'
      - texto: Un timestamp de última modificación
        explicacion: 'Ningún algoritmo de los vistos lo usa.'
      - texto: Ninguna es correcta
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      El Clock mejorado no usa instantes: usa los bits **U y M** de cada página y un puntero que
      recorre los frames. Ninguna de las opciones es lo que necesita.
  - enunciado: '(2R 2C2024, desarrollo 2) ¿Qué diferencia hay entre la tabla de páginas de un proceso con **memoria real** y con **memoria virtual**?'
    opciones:
      - texto: 'Ninguna: en las dos cada entrada tiene solo el número de frame'
        explicacion: 'Con memoria virtual hacen falta bits para presencia y para el reemplazo.'
      - texto: 'Con memoria real: frame y bit de validez. Con memoria virtual: el bit de validez pasa a ser de presencia y se agregan el bit M y datos para el reemplazo (bit U, instantes de carga o de referencia)'
        explicacion: Correcta.
      - texto: 'Con memoria virtual la tabla tiene una entrada por frame en vez de una por página'
        explicacion: 'Esa es la tabla invertida, que también existe sin memoria virtual.'
      - texto: 'Con memoria real la tabla incluye la dirección en disco de cada página'
        explicacion: 'Sin memoria virtual las páginas están todas en RAM.'
    correcta: 1
    justificacion: |
      - **Memoria real:** número de **frame** y bit de **validez** (si la página pertenece al proceso).
      - **Memoria virtual:** el bit de validez se reemplaza por el de **presencia** (está o no en
        RAM) y se agregan el bit de **modificado** y los datos que pida el algoritmo de reemplazo:
        instante de carga, de última referencia y/o bit de **uso**.
---

Este simulacro reúne preguntas de **teoría** de 2dos parciales anteriores (2024 a 2026) sobre
**memoria virtual**: para qué sirve, políticas de asignación y sustitución, y los bits de la tabla
de páginas. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la
justificación de cada una resume la resolución oficial de la cátedra.
