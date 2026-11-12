---
titulo: 'Teoría de parciales: Memoria real'
tema: parcial-2/memoria-real
fuente: { guia: Parciales 2024–2026 (teoría), numero: S1 }
tipo: teorico
dificultad: parcial
tags: [simulacro, teoria, parcial, reubicacion, particiones, buddy, compactacion, fragmentacion]
preguntas:
  - enunciado: '(2P 1C2024 TM, desarrollo 1) En un esquema **sin memoria virtual** y con direcciones lógicas más chicas que las físicas, ¿se puede llegar a ocupar toda la memoria RAM?'
    opciones:
      - texto: 'No: si las direcciones lógicas son más chicas, siempre queda RAM sin usar'
        explicacion: 'Eso vale para un proceso solo, pero la RAM la comparten varios.'
      - texto: 'Sí, pero solo si se agrega memoria virtual'
        explicacion: 'La memoria virtual sirve para lo contrario: procesos más grandes que la RAM.'
      - texto: 'Sí: cada proceso tiene su propio espacio lógico, y con suficientes procesos cargados se ocupa toda la RAM'
        explicacion: Correcta.
      - texto: 'No: la MMU no puede generar una dirección física mayor que la mayor dirección lógica'
        explicacion: 'La DF sale de sumar una base (o un frame) que puede estar en cualquier parte de la RAM.'
    correcta: 2
    justificacion: |
      Un proceso **solo** no puede ocupar más de lo que direcciona. Pero cada proceso tiene su
      **propio** espacio lógico y la traducción lo ubica en cualquier parte de la RAM: con un grado de
      multiprogramación suficiente, entre todos la ocupan completa.
  - enunciado: '(2P 1C2024 TM, desarrollo 1) ¿Qué relación existe entre las direcciones lógicas y la capacidad de **reubicar** procesos?'
    opciones:
      - texto: 'Ninguna: la reubicación la decide el planificador de largo plazo'
        explicacion: 'El planificador decide cuándo, pero lo que permite mover un proceso es la traducción.'
      - texto: 'Como el proceso usa direcciones lógicas que se traducen en cada acceso, para moverlo alcanza con cambiar la estructura de traducción'
        explicacion: Correcta.
      - texto: 'Para reubicar un proceso hay que recompilarlo con las direcciones nuevas'
        explicacion: 'Eso pasa con direcciones absolutas resueltas en compilación: justo lo que las lógicas evitan.'
      - texto: 'Las direcciones lógicas impiden reubicar: el proceso queda atado a las direcciones que generó'
        explicacion: 'Es al revés: las direcciones lógicas no dependen de dónde está el proceso en la RAM.'
    correcta: 1
    justificacion: |
      Un proceso ya compilado tiene sus direcciones lógicas fijas, pero como se traducen a físicas
      **en cada acceso**, se lo puede mover a otro lugar de la RAM cambiando solo la estructura de
      traducción: el registro base, la lista de particiones, la tabla de segmentos o la de páginas.
  - enunciado: '(2P 2C2025 TT, single choice 1) Las direcciones lógicas son necesarias en un sistema de administración de memoria que posea:'
    opciones:
      - texto: Reubicación
        explicacion: Correcta.
      - texto: Protección
        explicacion: 'La protección se puede hacer con registros límite sobre direcciones físicas.'
      - texto: Particionamiento fijo
        explicacion: 'Con particiones fijas se puede cargar cada programa ya ligado a su partición.'
      - texto: Particionamiento dinámico
        explicacion: 'Lo que exige direcciones lógicas no es el esquema sino poder mover procesos.'
    correcta: 0
    justificacion: |
      Para **reubicar** un proceso (moverlo de lugar en la RAM, por ejemplo al compactar o al volver
      de suspendido) sus direcciones no pueden ser las físicas: tienen que ser **lógicas** y
      traducirse en cada acceso.
  - enunciado: '(2P 2C2024 TM, desarrollo 1; 2P 2C2025 TT, desarrollo 1) Al comparar **particiones fijas** y **particiones dinámicas**, ¿cuál de estas descripciones es correcta?'
    opciones:
      - texto: 'Fijas: fragmentación externa y necesidad de compactar. Dinámicas: fragmentación interna'
        explicacion: 'Están invertidas.'
      - texto: 'Las dos sufren fragmentación interna; las dinámicas además necesitan compactar'
        explicacion: 'Las dinámicas miden lo que pide el proceso: no les sobra nada adentro.'
      - texto: 'Fijas: fragmentación interna, limitan la multiprogramación y el tamaño del proceso, poco overhead. Dinámicas: fragmentación externa (hay que compactar), no limitan, más overhead'
        explicacion: Correcta.
      - texto: 'Fijas: limitan la multiprogramación pero no el tamaño del proceso, porque un proceso puede ocupar varias particiones'
        explicacion: 'La asignación es contigua: un proceso va en una sola partición, que limita su tamaño.'
    correcta: 2
    justificacion: |
      | | Particiones fijas | Particiones dinámicas |
      | --- | --- | --- |
      | Fragmentación | Solo **interna** (sobra lugar dentro de la partición) | Solo **externa** (huecos entre procesos) |
      | Compactación | No hace falta | Hace falta para juntar los huecos |
      | Multiprogramación | Limitada por la **cantidad de particiones** | No limitada |
      | Tamaño máximo de proceso | La **partición más grande** | No limitado (salvo por la memoria) |
      | Overhead | Bajo: estructuras fijas | Alto: estructuras variables y compactación |
  - enunciado: '(2P 1C2025 TM, V/F 4b) "En asignación contigua, las particiones dinámicas no limitan el grado de multiprogramación; en cambio, las particiones fijas sí lo limitan."'
    opciones:
      - texto: 'Falso: las dinámicas también lo limitan, porque la cantidad de particiones se decide al arrancar'
        explicacion: 'En las dinámicas las particiones se crean a medida, del tamaño de cada proceso.'
      - texto: 'Falso: las fijas no lo limitan, porque un proceso chico deja lugar para otro en su partición'
        explicacion: 'Cada partición fija la ocupa un solo proceso, aunque le sobre lugar.'
      - texto: 'Verdadero: las dinámicas no tienen ningún límite, ni siquiera la memoria libre'
        explicacion: 'La conclusión es correcta, pero la memoria libre sí las limita.'
      - texto: 'Verdadero: con N particiones fijas entran a lo sumo N procesos; con dinámicas el único límite es la memoria libre'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      **Verdadero.** Con particiones fijas la memoria se divide en N particiones, cada una ocupada por
      un solo proceso: el grado de multiprogramación es a lo sumo **N**. Con particiones dinámicas el
      tamaño de cada partición es el del proceso y la única limitante es la **memoria libre**.
  - enunciado: '(2R 1C2025, desarrollo 1) Comparando **particionamiento fijo**, **dinámico** y **segmentación** en compactación y fragmentación, ¿cuál es la afirmación correcta?'
    opciones:
      - texto: 'Fijo: no necesita compactar y sufre fragmentación interna. Dinámico y segmentación: necesitan compactar (con mucho overhead) y sufren fragmentación externa, no interna'
        explicacion: Correcta.
      - texto: 'Fijo y dinámico necesitan compactar; segmentación no, porque divide al proceso en partes'
        explicacion: 'Cada segmento es contiguo y de tamaño variable: deja huecos como las particiones dinámicas.'
      - texto: 'Segmentación sufre fragmentación interna en el último segmento de cada proceso'
        explicacion: 'El segmento mide lo que necesita: la interna aparece cuando hay páginas.'
      - texto: 'Fijo sufre fragmentación externa, porque quedan particiones enteras sin usar'
        explicacion: 'Una partición libre se puede usar para otro proceso que entre: eso no es externa.'
    correcta: 0
    justificacion: |
      | | Compactación | Frag. interna | Frag. externa |
      | --- | --- | --- | --- |
      | Particionamiento fijo | No hace falta | **Sí** | No |
      | Particionamiento dinámico | **Sí**, con alto overhead | No | **Sí** |
      | Segmentación | **Sí**, con alto overhead | No | **Sí** |

      La segmentación se comporta como el particionamiento dinámico, pero por segmento: cada uno
      ocupa un bloque contiguo del tamaño justo.
  - enunciado: '(2P 1C2026 TT, teoría 1a) ¿Qué problemática puede sufrir la estrategia de **particionamiento dinámico** de la memoria?'
    opciones:
      - texto: Fragmentación interna
        explicacion: 'Cada partición mide lo que pide el proceso: no sobra lugar adentro.'
      - texto: Thrashing
        explicacion: 'El thrashing es de memoria virtual, por falta de frames.'
      - texto: Límite fijo al grado de multiprogramación
        explicacion: 'Eso es de las particiones fijas.'
      - texto: Fragmentación externa
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Al ir entrando y saliendo procesos de distintos tamaños quedan **huecos** entre particiones:
      puede haber memoria libre suficiente para un proceso pero repartida en huecos chicos.
      Es **fragmentación externa**; se resuelve compactando.
  - enunciado: '(2P 2C2024 TT, desarrollo 2) Comparando particionamiento fijo, dinámico y **buddy system**, ¿qué fragmentación sufre el buddy system y cuánto overhead tiene?'
    opciones:
      - texto: 'Solo interna, como las particiones fijas, con overhead bajo'
        explicacion: 'Además de la interna, los bloques libres que no son buddies no se pueden unir.'
      - texto: 'Interna y externa, con overhead medio-alto'
        explicacion: Correcta.
      - texto: 'Solo externa, con overhead alto por la compactación'
        explicacion: 'Al redondear a potencias de 2 también sobra lugar adentro del bloque.'
      - texto: 'Ninguna: los bloques siempre se ajustan al tamaño del proceso'
        explicacion: 'Se ajustan a la potencia de 2 más cercana, no al tamaño exacto.'
    correcta: 1
    justificacion: |
      | | Overhead | Fragmentación |
      | --- | --- | --- |
      | Fijo | Poco | Interna |
      | Dinámico | Alto (compactación) | Externa |
      | Buddy system | Medio/alto | **Interna y externa** |

      El buddy redondea cada pedido a una potencia de 2 (**interna**) y solo junta bloques libres si
      son buddies, así que pueden quedar huecos separados (**externa**).
  - enunciado: '(2P 2C2025 TM, single choice 1) ¿Cuál de los siguientes esquemas de asignación de memoria requiere eventualmente compactar?'
    opciones:
      - texto: Segmentación paginada
        explicacion: 'Usa frames de tamaño fijo: cualquier frame libre sirve.'
      - texto: Segmentación pura
        explicacion: Correcta.
      - texto: Particiones fijas
        explicacion: 'Las particiones no cambian: no hay huecos que juntar.'
      - texto: Paginación jerárquica
        explicacion: 'Es paginación: sin fragmentación externa.'
    correcta: 1
    justificacion: |
      La **segmentación pura** ubica cada segmento en un bloque contiguo de tamaño variable: con el
      tiempo aparece fragmentación externa y la forma de recuperar ese espacio es **compactar**. Los
      esquemas con páginas no la necesitan nunca.
  - enunciado: '(2R 1C2026, single choice 1-ii) En el esquema de particionamiento fijo, es correcto decir que:'
    opciones:
      - texto: Se sufre fragmentación externa
        explicacion: 'Sufre interna: lo que sobra queda dentro de la partición.'
      - texto: Se usa una tabla de particiones por proceso
        explicacion: 'La tabla de particiones es una sola, global.'
      - texto: Las particiones son siempre fijas y de igual tamaño
        explicacion: 'Son fijas, pero pueden ser de distintos tamaños.'
      - texto: Ninguna es correcta
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Ninguna vale: el particionamiento fijo sufre fragmentación **interna**, usa **una** tabla de
      particiones para todo el sistema y sus particiones pueden ser de **distinto tamaño** (se fijan
      al arrancar, pero no tienen que ser iguales).
  - enunciado: '(2R 1C2024, desarrollo 1) Comparando paginación pura, segmentación paginada y particionamiento dinámico, ¿qué estructuras y qué fragmentación tiene la **segmentación paginada**?'
    opciones:
      - texto: 'Una tabla de páginas por proceso; fragmentación interna y externa'
        explicacion: 'Eso mezcla la estructura de la paginación pura con una externa que no existe.'
      - texto: 'Una tabla de segmentos por proceso y una tabla de páginas por segmento; solo fragmentación interna, en la última página de cada segmento'
        explicacion: Correcta.
      - texto: 'Una tabla de particiones y una de huecos libres; solo fragmentación externa'
        explicacion: 'Esas son las estructuras del particionamiento dinámico.'
      - texto: 'Una tabla de segmentos por proceso; solo fragmentación externa'
        explicacion: 'Esa es la segmentación pura.'
    correcta: 1
    justificacion: |
      | | Fragmentación | Estructuras | Overhead |
      | --- | --- | --- | --- |
      | Particionamiento dinámico | Solo externa | Tabla de particiones y de huecos libres | Muy alto si compacta |
      | Paginación pura | Solo interna | 1 tabla de páginas por proceso | Medio |
      | Segmentación paginada | Solo interna, en la **última página de cada segmento** | 1 tabla de segmentos por proceso + **1 tabla de páginas por segmento** | Medio-alto |
  - enunciado: '(2P 1C2026 TM, desarrollo 4) Comparando **particiones fijas** y **paginación**, ¿con qué estructuras se administra el espacio libre y cómo queda el grado máximo de multiprogramación?'
    opciones:
      - texto: 'Fijas: un bitmap de frames, sin límite de procesos. Paginación: tabla de particiones, con un proceso por partición'
        explicacion: 'Están invertidas.'
      - texto: 'Las dos usan una lista de huecos libres y limitan la multiprogramación a la cantidad de huecos'
        explicacion: 'Ninguna de las dos tiene huecos variables: eso es de particiones dinámicas.'
      - texto: 'Fijas: tabla de particiones (base, tamaño, libre u ocupada) y a lo sumo un proceso por partición. Paginación: bitmap de frames libres y casi sin límite, porque los frames son chicos'
        explicacion: Correcta.
      - texto: 'Fijas: no necesitan estructura porque las particiones no cambian. Paginación: tabla de páginas global'
        explicacion: 'Igual hay que saber qué partición está libre; y la tabla de páginas es por proceso, no del espacio libre.'
    correcta: 2
    justificacion: |
      - **Particiones fijas:** el grado de multiprogramación está limitado por la **cantidad de
        particiones**. El espacio libre se lleva en un arreglo con base y límite de cada partición y
        si está libre u ocupada.
      - **Paginación:** prácticamente no hay límite (hay muchísimos frames chicos). El espacio libre
        se lleva con un **bitmap** (o lista) de frames.
  - enunciado: '(2P 1C2026 TM, desarrollo 4) ¿Se usa algún hardware especial para agilizar la traducción de direcciones en **paginación**? ¿Por qué?'
    opciones:
      - texto: 'No: con registros base y límite alcanza, igual que en particiones fijas'
        explicacion: 'Eso alcanza para asignación contigua; en paginación cada página tiene su propio frame.'
      - texto: 'Sí, el DMA: transfiere las páginas sin pasar por la CPU'
        explicacion: 'El DMA mueve datos de E/S; no traduce direcciones.'
      - texto: 'No: la traducción la hace el SO en cada acceso'
        explicacion: 'La traducción la hace el hardware (MMU); el SO solo carga las tablas.'
      - texto: 'Sí, la TLB: la tabla de páginas es demasiado grande para registros y está en memoria, así que sin caché cada acceso costaría dos'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      En asignación contigua la MMU traduce con dos registros (base y límite). En paginación la
      tabla de páginas tiene una entrada por página: es demasiado grande para registros de la CPU y
      vive en memoria. Sin ayuda, cada acceso necesitaría **leer la tabla y después el dato**. La
      **TLB** guarda las traducciones recientes y evita la mayoría de esas lecturas.
---

Este simulacro reúne preguntas de **teoría** de 2dos parciales anteriores (2024 a 2026) sobre
**memoria real**: direcciones lógicas y reubicación, particiones fijas y dinámicas, buddy system,
compactación y fragmentación. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la
justificación de cada una resume la resolución oficial de la cátedra.
