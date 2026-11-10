---
titulo: 'Teoría de parciales: Memoria real'
tema: parcial-2/memoria-real
fuente: { guia: Parciales 2024–2026 (teoría), numero: S2 }
tipo: teorico
dificultad: parcial
tags: [simulacro, teoria, parcial, segmentacion, segmentacion-paginada, paginacion, mmu, ubicacion]
preguntas:
  - enunciado: '(2P 1C2026 TT, teoría 1b) ¿Qué esquema de organización de memoria agrupa las partes de un proceso según la función que cumplen?'
    opciones:
      - texto: Paginación
        explicacion: 'Las páginas son trozos de tamaño fijo, sin relación con lo que contienen.'
      - texto: Segmentación
        explicacion: Correcta.
      - texto: Particionamiento dinámico
        explicacion: 'El proceso va entero en una sola partición.'
      - texto: Buddy system
        explicacion: 'Asigna bloques de potencias de 2 al proceso entero.'
    correcta: 1
    justificacion: |
      La **segmentación** divide al proceso en partes lógicas según su función (código, datos, pila,
      heap…), cada una con su tamaño y sus permisos.
  - enunciado: '(2P 2C2025 TT, single choice 4) ¿Cuál de estos campos **no** está presente en una entrada de la tabla de segmentos?'
    opciones:
      - texto: Base del segmento
        explicacion: 'Está: es donde empieza el segmento en la RAM.'
      - texto: Límite del segmento
        explicacion: 'Está: con él se valida el desplazamiento.'
      - texto: Offset del segmento
        explicacion: Correcta.
      - texto: Permiso de ejecución
        explicacion: 'Está: los permisos van por segmento.'
    correcta: 2
    justificacion: |
      Una entrada de la tabla de segmentos tiene **base**, **límite** y **permisos**. El **offset**
      (desplazamiento) viene en la dirección lógica: cambia en cada acceso y se compara con el límite.
  - enunciado: '(2P 2C2025 TT, single choice 2) ¿Cuál de estas estrategias de administración de memoria **no** genera fragmentación interna?'
    opciones:
      - texto: Buddy System
        explicacion: 'Redondea cada pedido a una potencia de 2: sobra lugar adentro.'
      - texto: Paginación
        explicacion: 'La última página de cada proceso suele quedar incompleta.'
      - texto: Segmentación
        explicacion: Correcta.
      - texto: Segmentación Paginada
        explicacion: 'La última página de cada segmento suele quedar incompleta.'
    correcta: 2
    justificacion: |
      En la **segmentación pura** cada segmento ocupa exactamente lo que mide: no sobra nada adentro.
      Su problema es la fragmentación **externa**.
  - enunciado: '(2P 1C2026 TM, teoría 1a) ¿Qué tipo de fragmentación sufren la **segmentación** y la **segmentación paginada**?'
    opciones:
      - texto: 'Segmentación: externa. Segmentación paginada: interna'
        explicacion: Correcta.
      - texto: 'Segmentación: interna. Segmentación paginada: externa'
        explicacion: 'Están invertidas.'
      - texto: 'Las dos sufren interna y externa'
        explicacion: 'Al paginar los segmentos desaparece la externa; sin páginas no hay interna.'
      - texto: 'Las dos sufren solo externa, porque los segmentos son de tamaño variable'
        explicacion: 'En la paginada los segmentos se reparten en frames fijos: no quedan huecos.'
    correcta: 0
    justificacion: |
      - **Segmentación:** segmentos contiguos de tamaño variable → **externa**.
      - **Segmentación paginada:** cada segmento se reparte en frames de tamaño fijo → solo
        **interna**, en la última página de cada segmento.
  - enunciado: '(2P 1C2025 TM, V/F 4a) "Mientras que paginación posee fragmentación interna, segmentación paginada posee tanto fragmentación interna como externa."'
    opciones:
      - texto: 'Verdadero: la paginación aporta la interna y la segmentación aporta la externa'
        explicacion: 'Los segmentos ya no son contiguos: se reparten en frames.'
      - texto: 'Falso: la segmentación paginada no tiene ninguna de las dos'
        explicacion: 'La última página de cada segmento sigue pudiendo quedar incompleta.'
      - texto: 'Falso: en segmentación paginada la memoria se divide en frames, así que solo hay fragmentación interna'
        explicacion: Correcta.
      - texto: 'Verdadero, pero solo cuando los segmentos son más chicos que una página'
        explicacion: 'Aun así ocupan un frame: es interna, no externa.'
    correcta: 2
    justificacion: |
      **Falso.** En segmentación paginada la RAM está dividida en **frames** y cualquier frame libre
      sirve: no hay fragmentación externa. Queda solo la **interna** de la última página de cada
      segmento.
  - enunciado: '(2P 1C2025 TT, V/F 1a) "La segmentación paginada causa en promedio más fragmentación externa en sistemas donde los segmentos suelen ser pequeños."'
    opciones:
      - texto: 'Verdadero: muchos segmentos chicos dejan muchos huecos chicos'
        explicacion: 'Eso pasa en segmentación pura, no en la paginada.'
      - texto: 'Verdadero: un segmento más chico que una página deja la página a medias'
        explicacion: 'Eso es fragmentación interna, no externa.'
      - texto: 'Falso: los segmentos chicos causan más thrashing, no fragmentación'
        explicacion: 'Lo que importa es que la paginada no tiene fragmentación externa en ningún caso.'
      - texto: 'Falso: la segmentación paginada no tiene fragmentación externa, porque los segmentos se dividen en páginas de tamaño fijo'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      **Falso.** Al dividir cada segmento en páginas que van a frames de tamaño fijo, la segmentación
      paginada **elimina** la fragmentación externa, sea cual sea el tamaño de los segmentos. Con
      segmentos chicos lo que puede crecer es la **interna**.
  - enunciado: '(2P 2C2025 TM, desarrollo 2) En **segmentación paginada**, ¿qué compone la dirección lógica y qué estructuras intervienen en la traducción?'
    opciones:
      - texto: 'Número de segmento + desplazamiento; la tabla de segmentos da la base física del segmento'
        explicacion: 'Esa es la segmentación pura.'
      - texto: 'Número de segmento + número de página + offset; la tabla de segmentos da la tabla de páginas del segmento y esa tabla da el frame'
        explicacion: Correcta.
      - texto: 'Número de página + offset; una sola tabla de páginas por proceso'
        explicacion: 'Esa es la paginación simple.'
      - texto: 'Número de segmento + número de frame + offset; la MMU suma el frame a la base del segmento'
        explicacion: 'El frame no está en la DL: es lo que se obtiene al traducir.'
    correcta: 1
    justificacion: |
      DL = **segmento | página | offset**. La tabla de segmentos (una por proceso) indica, para cada
      segmento, dónde está su **tabla de páginas** y su límite. Con el número de página se busca el
      **frame** en esa tabla, y la DF es frame + offset.
  - enunciado: '(2P 2C2025 TM, desarrollo 2) ¿Qué ventaja da la segmentación paginada para **compartir memoria** entre procesos?'
    opciones:
      - texto: 'Ninguna: para compartir hay que copiar el segmento en la memoria de cada proceso'
        explicacion: 'Justamente se evita copiar: se apunta a los mismos frames.'
      - texto: 'Se puede compartir un segmento entero (por ejemplo, el código) haciendo que los dos procesos apunten a la misma tabla de páginas o a los mismos frames'
        explicacion: Correcta.
      - texto: 'Se comparten las tablas de segmentos completas, así los procesos ven la misma memoria'
        explicacion: 'Compartirían todo, también los datos y la pila.'
      - texto: 'Se comparte la TLB, que es lo que guarda las traducciones'
        explicacion: 'La TLB es una caché; compartir es un tema de las tablas.'
    correcta: 1
    justificacion: |
      Como los segmentos son unidades lógicas (código, datos…), se elige compartir uno entero: la
      entrada de ese segmento en ambos procesos apunta a la **misma tabla de páginas** (o sus tablas
      apuntan a los **mismos frames**). Típico: el código de solo lectura de un programa.
  - enunciado: '(2P 1C2026 TT, teoría 1d) ¿Qué estructura utiliza la MMU para traducir una dirección lógica a física en un esquema de **paginación simple**?'
    opciones:
      - texto: La tabla de segmentos
        explicacion: 'Es de segmentación.'
      - texto: La tabla de particiones
        explicacion: 'Es de asignación contigua.'
      - texto: El bitmap de frames libres
        explicacion: 'Lo usa el SO para asignar frames, no la MMU para traducir.'
      - texto: La tabla de páginas
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      La MMU usa la **tabla de páginas** del proceso: con el número de página obtiene el frame. (Si
      hay TLB, la consulta antes.)
  - enunciado: '(2R 1C2026, single choice 1-i) La traducción y validación de una dirección lógica en paginación sin memoria virtual es realizada por:'
    opciones:
      - texto: El SO
        explicacion: 'El SO prepara las tablas, pero no interviene en cada acceso.'
      - texto: 'El proceso, a través de una syscall'
        explicacion: 'Sería lentísimo: una syscall por cada acceso a memoria.'
      - texto: El HW
        explicacion: Correcta.
      - texto: Ninguna de las anteriores
        explicacion: 'La hace la MMU, que es hardware.'
    correcta: 2
    justificacion: |
      La traduce y la valida el **hardware** (la MMU) en cada acceso, usando las tablas que preparó
      el SO.
  - enunciado: '(2P 2C2024 TT, desarrollo 1) ¿Qué componentes del hardware dan soporte a la traducción de direcciones y qué pasaría si no estuvieran?'
    opciones:
      - texto: 'La MMU, que traduce, y la TLB, que guarda traducciones recientes. Sin MMU la traduciría el SO con muchísimo overhead; sin TLB cada traducción iría a la tabla en memoria'
        explicacion: Correcta.
      - texto: 'El DMA y el controlador de disco: sin ellos no se podrían traer páginas'
        explicacion: 'Participan en la E/S, no en la traducción.'
      - texto: 'Solo la TLB: si no está, la traducción no se puede hacer'
        explicacion: 'Sin TLB se traduce igual, leyendo la tabla en memoria; es más lento.'
      - texto: 'La MMU y el bitmap de frames: sin bitmap la MMU no sabe a qué frame ir'
        explicacion: 'El bitmap es una estructura del SO para asignar, no un componente de hardware.'
    correcta: 0
    justificacion: |
      - **MMU:** hace la traducción en hardware, rápido y sin intervención del SO. Sin ella la tendría
        que hacer el SO en cada acceso: overhead enorme.
      - **TLB:** caché de entradas de la tabla de páginas; con un hit se evita leer la tabla en
        memoria. Sin ella todas las traducciones irían a la tabla.
  - enunciado: '(2R 2C2025, single choice 1) En un sistema con paginación **sin memoria virtual**, si el espacio de direcciones lógicas es mayor al espacio de direcciones físicas, entonces:'
    opciones:
      - texto: Se desaprovechará espacio de RAM
        explicacion: 'Al contrario: hay más espacio lógico que RAM.'
      - texto: Algunos procesos no podrán ejecutar
        explicacion: Correcta.
      - texto: Se sufrirá fragmentación externa
        explicacion: 'La paginación no tiene fragmentación externa.'
      - texto: Ninguna es correcta
        explicacion: 'La b) es correcta.'
    correcta: 1
    justificacion: |
      Sin memoria virtual el proceso tiene que estar **entero** en RAM. Si un proceso usa más espacio
      lógico que la memoria física, **no podrá ejecutar**.
  - enunciado: '(2R 2C2025, desarrollo 1) Con memoria virtual, al traer un elemento de disco y habiendo espacio libre, ¿qué **política de ubicación** se usa en **paginación**?'
    opciones:
      - texto: 'Best Fit: el frame libre más chico donde entra la página'
        explicacion: 'Todos los frames miden lo mismo: no hay uno "más chico".'
      - texto: 'La del algoritmo de reemplazo: LRU, Clock, etc.'
        explicacion: 'Eso es reemplazo: elegir a quién sacar cuando no hay lugar.'
      - texto: 'First Fit: siempre el primer frame de la memoria'
        explicacion: 'Se puede elegir así, pero no hay ventaja en hacerlo.'
      - texto: 'No hace falta ninguna: cualquier frame libre da lo mismo'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      En paginación todos los frames son iguales y las páginas entran en cualquiera: **no hay
      política de ubicación**. En segmentación sí, porque los segmentos son de tamaño variable y hay
      que elegir hueco.
  - enunciado: '(2R 2C2025, desarrollo 1) En **segmentación**, ¿qué hace la política de ubicación **Best Fit**?'
    opciones:
      - texto: 'Ubica el segmento en el primer hueco donde entra, recorriendo desde el principio'
        explicacion: 'Eso es First Fit.'
      - texto: 'Ubica el segmento en el hueco más chico donde entra'
        explicacion: Correcta.
      - texto: 'Ubica el segmento en el hueco más grande'
        explicacion: 'Eso es Worst Fit.'
      - texto: 'Ubica el segmento en el primer hueco donde entra, desde donde quedó la última ubicación'
        explicacion: 'Eso es Next Fit.'
    correcta: 1
    justificacion: |
      Las políticas de ubicación para segmentos (o particiones dinámicas):

      - **First Fit:** el primer hueco donde entra, desde el principio.
      - **Next Fit:** igual, pero desde la última ubicación.
      - **Best Fit:** el hueco **más chico** donde entra.
      - **Worst Fit:** el hueco **más grande**.
  - enunciado: '(2R 1C2026, single choice 1-iv) En la organización de la memoria, las políticas de ubicación **NO** son necesarias en las estrategias:'
    opciones:
      - texto: Segmentación
        explicacion: 'Hay que elegir hueco para cada segmento.'
      - texto: Particionamiento dinámico
        explicacion: 'Hay que elegir hueco para cada proceso.'
      - texto: Segmentación paginada
        explicacion: Correcta.
      - texto: Ninguna de las anteriores
        explicacion: 'En la c) no hace falta.'
    correcta: 2
    justificacion: |
      En **segmentación paginada** los segmentos se reparten en frames de tamaño fijo: cualquier
      frame libre sirve y no hay hueco que elegir. En segmentación pura y particiones dinámicas, sí.
---

Este simulacro reúne preguntas de **teoría** de 2dos parciales anteriores (2024 a 2026) sobre
**memoria real**: segmentación, segmentación paginada, paginación, el hardware que traduce y las
políticas de ubicación. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la
justificación de cada una resume la resolución oficial de la cátedra.
