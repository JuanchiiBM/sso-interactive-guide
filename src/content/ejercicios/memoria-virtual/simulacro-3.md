---
titulo: 'Teoría de parciales: Memoria virtual'
tema: parcial-2/memoria-virtual
fuente: { guia: Parciales 2024–2026 (teoría), numero: S3 }
tipo: teorico
dificultad: parcial
tags: [simulacro, teoria, parcial, paginacion-jerarquica, tabla-invertida, tlb, localidad, page-fault]
preguntas:
  - enunciado: '(2P 1C2024 TT, desarrollo 2) Dos procesos muy grandes tienen gran parte de la RAM ocupada por sus tablas de páginas. ¿Qué recomendaría para tener más memoria disponible sin penalizar mucho el tiempo de acceso?'
    opciones:
      - texto: 'Achicar las páginas, así cada tabla ocupa menos'
        explicacion: 'Con páginas más chicas hay más páginas y la tabla crece.'
      - texto: 'Pasar a segmentación pura, que no usa tablas de páginas'
        explicacion: 'Cambia el esquema entero y trae fragmentación externa.'
      - texto: 'Usar paginación jerárquica, para tener en memoria solo las partes de la tabla que se usan, y una TLB para compensar los accesos extra'
        explicacion: Correcta.
      - texto: 'Agrandar la TLB hasta que entren las tablas completas'
        explicacion: 'La TLB es una caché chica; no reemplaza a las tablas.'
    correcta: 2
    justificacion: |
      La **paginación jerárquica** parte la tabla en niveles y solo hace falta tener en memoria las
      tablas de 2do nivel que se usan: ocupa mucho menos. Cuesta un acceso más por nivel, y eso se
      compensa con una **TLB**.
  - enunciado: '(2R 2C2024, V/F 4b) "Un sistema con paginación jerárquica reduce la cantidad de accesos a memoria en comparación con la paginación simple."'
    opciones:
      - texto: 'Verdadero: las tablas son más chicas y se recorren más rápido'
        explicacion: 'Más chicas, pero hay que leer una por nivel.'
      - texto: 'Falso: los aumenta, porque para traducir hay que leer una tabla por cada nivel'
        explicacion: Correcta.
      - texto: 'Verdadero: con dos niveles la mitad de las veces alcanza con leer el primero'
        explicacion: 'El primer nivel solo dice dónde está la tabla del segundo: siempre hay que leer los dos.'
      - texto: 'Falso: tiene la misma cantidad de accesos, solo cambia el tamaño de las tablas'
        explicacion: 'Agrega un acceso por cada nivel extra.'
    correcta: 1
    justificacion: |
      **Falso.** Reduce la **memoria** ocupada por las tablas, pero cada traducción (sin TLB) lee
      **una entrada por nivel**: con dos niveles, dos accesos más el del dato, contra uno más el dato
      en paginación simple.
  - enunciado: '(2P 2C2025 TT, single choice 3) La paginación por niveles:'
    opciones:
      - texto: Reduce el espacio ocupado en la memoria
        explicacion: Correcta.
      - texto: Mejora el tiempo en la traducción de direcciones
        explicacion: 'Lo empeora: un acceso más por nivel.'
      - texto: Reduce la cantidad de Page Faults
        explicacion: 'Los fallos de página dependen de los frames y del reemplazo.'
      - texto: La dirección lógica no contiene offset
        explicacion: 'Tiene offset; la parte de página se divide en varios índices.'
    correcta: 0
    justificacion: |
      La paginación multinivel **reduce el espacio** que ocupan las tablas de páginas en memoria, a
      costa de más accesos para traducir.
  - enunciado: '(2R 1C2026, desarrollo 4) ¿Cómo reduce la paginación **multinivel** la RAM usada por las tablas de páginas, y cuál es su principal desventaja?'
    opciones:
      - texto: 'Comprime las entradas de la tabla; la desventaja es que hay que descomprimirlas al traducir'
        explicacion: 'No comprime nada: reparte la tabla en pedazos.'
      - texto: 'Comparte una misma tabla entre todos los procesos; la desventaja es la seguridad'
        explicacion: 'Eso se parece más a la tabla invertida, que es global.'
      - texto: 'Elimina la tabla de páginas y usa solo la TLB; la desventaja es que la TLB es chica'
        explicacion: 'Las tablas siguen existiendo, en niveles.'
      - texto: 'Solo se cargan la tabla de 1er nivel y las de 2do nivel que se usan; la desventaja es un acceso extra a memoria por nivel en cada TLB miss'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Ejemplo de la resolución: 32 bits con páginas de 4 KiB. En paginación simple, la tabla de cada
      proceso tiene `2^20` entradas, todas en memoria. Con dos niveles de 10 bits alcanza con tener la
      tabla de 1er nivel y una de 2do: `2^10 + 2^10 = 2^11` entradas como mínimo.

      La desventaja: en cada TLB miss hay **un acceso extra por nivel**. Y con thrashing empeora,
      porque las propias tablas pueden no estar en memoria y generar sus propios fallos de página.
  - enunciado: '(2P 1C2025 TT, desarrollo 2) ¿Cuál es la principal ventaja de un esquema de **paginación invertida**?'
    opciones:
      - texto: 'Traduce con un solo acceso siempre, sin importar la cantidad de procesos'
        explicacion: 'Puede necesitar varios accesos si hay colisiones o no hay hash.'
      - texto: 'Hay una sola tabla, con una entrada por frame: ocupa poco y un tamaño fijo, sin importar cuántos procesos haya ni su tamaño'
        explicacion: Correcta.
      - texto: 'Hace muy fácil compartir páginas entre procesos'
        explicacion: 'Es al revés: cada frame tiene un solo dueño en la tabla, compartir es complicado.'
      - texto: 'Elimina los fallos de página'
        explicacion: 'Los fallos de página siguen existiendo.'
    correcta: 1
    justificacion: |
      La tabla invertida tiene **una entrada por frame** de la RAM (con PID y número de página), en
      lugar de una tabla por proceso con una entrada por página. Ocupa mucho menos y su tamaño no
      depende de cuántos procesos haya ni de qué tamaño sean.
  - enunciado: '(2P 1C2025 TT, desarrollo 2) ¿Qué sucede al traducir direcciones si la tabla invertida se usa **sin función de hash**?'
    opciones:
      - texto: 'Hay que recorrer la tabla secuencialmente buscando el par (PID, página): la traducción se vuelve muy lenta'
        explicacion: Correcta.
      - texto: 'Se usa directamente el número de página como índice de la tabla'
        explicacion: 'La tabla está indexada por frame: el número de página no sirve de índice.'
      - texto: 'No se puede traducir: el hash es lo que guarda los frames'
        explicacion: 'Se puede: buscando entrada por entrada.'
      - texto: 'Nada cambia: el hash solo sirve para compartir páginas'
        explicacion: 'El hash sirve para ir directo a la entrada.'
    correcta: 0
    justificacion: |
      Como la tabla está ordenada por frame, para saber dónde está la página P del proceso X hay que
      buscar la entrada con (X, P). Sin hash, eso es una **búsqueda lineal** sobre toda la tabla en
      cada traducción: muy ineficiente. El hash lleva directo a una entrada (y las colisiones se
      encadenan).
  - enunciado: '(2P 1C2026 TT, desarrollo 3) Con **varios procesos de gran tamaño**, ¿qué tabla de páginas consume más memoria real?'
    opciones:
      - texto: 'La invertida, porque guarda el PID en cada entrada'
        explicacion: 'Tiene una entrada por frame y tamaño fijo: es de las que menos ocupa.'
      - texto: 'La multinivel, porque tiene varias tablas por proceso'
        explicacion: 'Tiene varias, pero solo carga las que usa.'
      - texto: 'La de un nivel: cada proceso necesita una tabla tan grande como su cantidad de páginas'
        explicacion: Correcta.
      - texto: 'Las tres consumen lo mismo'
        explicacion: 'Difieren mucho cuando los procesos son grandes.'
    correcta: 2
    justificacion: |
      | | Memoria | Accesos para traducir |
      | --- | --- | --- |
      | Un nivel | **Alto**: una entrada por página, por proceso | **Mínimo** (1) |
      | Multinivel | Bajo/intermedio: solo las tablas que se usan | Intermedio: uno por nivel |
      | Invertida | Bajo/intermedio: tamaño fijo, una entrada por frame | Bajo/intermedio: 1 si se encuentra al primer intento, más si hay colisiones |
  - enunciado: '(2P 1C2026 TT, desarrollo 3) ¿Qué tabla de páginas necesita la **menor** cantidad de accesos para traducir una dirección?'
    opciones:
      - texto: 'La multinivel, porque cada tabla es más chica'
        explicacion: 'Más chica pero hay que leer una por nivel.'
      - texto: 'La invertida, porque es una sola'
        explicacion: 'Puede necesitar varios accesos si hay que seguir colisiones.'
      - texto: 'Todas necesitan la misma cantidad'
        explicacion: 'La multinivel necesita uno por nivel.'
      - texto: 'La de un nivel: un solo acceso a la tabla'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      La tabla de **un nivel** se indexa directo con el número de página: **un acceso**. La multinivel
      necesita uno por nivel, y la invertida uno si el hash acierta a la primera, más si hay que
      recorrer la cadena de colisiones.
  - enunciado: '(2P 1C2025 TM, desarrollo 1; 2R 1C2026, desarrollo 5) ¿Qué relación hay entre la **localidad temporal** y el uso de la **TLB**?'
    opciones:
      - texto: 'Ninguna: la TLB depende solo de su algoritmo de reemplazo'
        explicacion: 'El reemplazo ayuda, pero los hits salen de que el proceso reuse sus páginas.'
      - texto: 'Como el proceso usa el mismo conjunto de páginas durante un intervalo, una TLB con pocas entradas logra muchos hits'
        explicacion: Correcta.
      - texto: 'La localidad temporal hace que el proceso cambie de páginas todo el tiempo, y por eso la TLB se vacía'
        explicacion: 'La localidad dice lo contrario: se reusan las mismas páginas.'
      - texto: 'La TLB guarda las páginas que se van a usar, adelantándose a la localidad'
        explicacion: 'Guarda traducciones de páginas usadas recientemente, no futuras.'
    correcta: 1
    justificacion: |
      La **TLB** es una caché de traducciones: ahorra el acceso a la tabla de páginas en cada hit.
      Por **localidad temporal** un proceso referencia activamente un conjunto acotado de páginas
      en cada intervalo. Si la TLB tiene al menos esas entradas, casi todas las traducciones son
      **hits**.
  - enunciado: '(2P 2C2025 TM, single choice 2) En paginación simple, el uso de una TLB permite:'
    opciones:
      - texto: Reducir la memoria ocupada por tablas
        explicacion: 'Las tablas siguen enteras en memoria.'
      - texto: Reducir la cantidad de Page Faults
        explicacion: 'En paginación simple no hay fallos de página; y la TLB no los evitaría.'
      - texto: Reducir el tiempo de traducción de direcciones
        explicacion: Correcta.
      - texto: Todas las anteriores
        explicacion: 'Solo la c) es correcta.'
    correcta: 2
    justificacion: |
      La TLB guarda traducciones recientes: con un hit no hace falta leer la tabla de páginas en
      memoria. Reduce el **tiempo de traducción**, nada más.
  - enunciado: '(2P 2C2025 TT, desarrollo 2) Cuando un proceso referencia una página que no está en memoria, ¿quién **genera** la interrupción de page fault y quién la **atiende**?'
    opciones:
      - texto: 'La genera el proceso con una syscall; la atiende la MMU'
        explicacion: 'El proceso no sabe que la página no está; y la MMU no trae páginas.'
      - texto: 'La genera el SO al revisar la tabla; la atiende el controlador de disco'
        explicacion: 'El SO no revisa cada acceso: lo hace la MMU.'
      - texto: 'La genera y la atiende la MMU, sin intervención del SO'
        explicacion: 'Elegir frame y pedir la página al disco es trabajo del SO.'
      - texto: 'La genera la MMU al ver el bit de presencia en 0; la atiende el SO'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      La **MMU** calcula la página, busca en la TLB (miss) y en la tabla de páginas, y como el bit de
      presencia está en 0 **genera la interrupción**. La **atiende el SO** (kernel): trae la página,
      actualiza las estructuras y se reintenta la instrucción.
  - enunciado: '(2P 2C2025 TT, desarrollo 2) ¿Qué estructuras se consultaron necesariamente **antes** de que ocurra el page fault?'
    opciones:
      - texto: 'La TLB y la tabla de páginas'
        explicacion: Correcta.
      - texto: 'Solo la tabla de segmentos'
        explicacion: 'En paginación no hay tabla de segmentos.'
      - texto: 'El bitmap de frames libres y el área de swap'
        explicacion: 'Esas las usa el SO después, al atender el fallo.'
      - texto: 'La tabla de archivos abiertos del proceso'
        explicacion: 'Es de filesystem.'
    correcta: 0
    justificacion: |
      Antes del fallo, la MMU busca en la **TLB** (si hay) y, ante el miss, en la **tabla de
      páginas**, donde encuentra P = 0. Recién ahí se genera la interrupción. El bitmap y el swap
      los usa el SO para atenderla.

      > El enunciado dice "paginación simple", pero un page fault solo existe con paginación bajo
      > demanda (memoria virtual); así se interpretó.
  - enunciado: '(2P 1C2026 TM, teoría 1b) ¿Qué tipo de interrupción es un Page Fault?'
    opciones:
      - texto: Asincrónica, porque la genera el hardware
        explicacion: 'La genera el hardware, pero por la instrucción que se está ejecutando.'
      - texto: Una interrupción de E/S, porque hay que leer el disco
        explicacion: 'La de E/S llega después, cuando termina la lectura.'
      - texto: Sincrónica (una excepción provocada por la instrucción en curso)
        explicacion: Correcta.
      - texto: Una interrupción de clock
        explicacion: 'No depende del tiempo.'
    correcta: 2
    justificacion: |
      Es **sincrónica**: la provoca la propia instrucción que está ejecutando el proceso al
      referenciar una página ausente (un *trap* o excepción). Si se repitiera la ejecución, ocurriría
      en el mismo punto.
  - enunciado: '(2R 1C2026, single choice 1-iii) La resolución de page faults en memoria virtual implica un involucramiento activo de solamente:'
    opciones:
      - texto: El HW y el SO
        explicacion: Correcta.
      - texto: 'El HW, el SO y el Proceso'
        explicacion: 'El proceso no hace nada: queda bloqueado esperando.'
      - texto: El HW
        explicacion: 'Traer la página y actualizar la tabla lo hace el SO.'
      - texto: Ninguna de las anteriores
        explicacion: 'La a) es correcta.'
    correcta: 0
    justificacion: |
      El **hardware** detecta el fallo (MMU) y transfiere la página (disco, DMA); el **SO** lo
      atiende, elige el frame y actualiza las tablas. El proceso no participa: está bloqueado.
  - enunciado: '(2P 1C2026 TT, desarrollo 4) Durante un page fault, ¿por qué estados pasa el proceso hasta poder acceder a la referencia?'
    opciones:
      - texto: 'Ejecutando → Bloqueado (mientras se lee la página) → Listo (cuando termina la E/S) → Ejecutando, reintentando la instrucción'
        explicacion: Correcta.
      - texto: 'Sigue ejecutando: la página se trae sin interrumpirlo'
        explicacion: 'Leer de disco tarda muchísimo: el proceso se bloquea.'
      - texto: 'Ejecutando → Suspendido → Listo'
        explicacion: 'Suspendido es estar fuera de memoria entera; acá solo espera una página.'
      - texto: 'Ejecutando → Listo → Ejecutando, porque el fallo lo atiende la MMU al instante'
        explicacion: 'La MMU solo lo detecta; hay que esperar la E/S.'
    correcta: 0
    justificacion: |
      El proceso queda **bloqueado** mientras dura la lectura de la página, pasa a **listo** cuando
      la página está cargada y, cuando vuelve a ejecutar, **reintenta** la instrucción que falló.
  - enunciado: '(2P 1C2026 TT, desarrollo 4) ¿Cuál es el orden correcto del procedimiento de un page fault?'
    opciones:
      - texto: 'El SO trae la página → la MMU ve P = 0 → interrupción → se actualiza la tabla → se reintenta la instrucción'
        explicacion: 'El SO no puede traerla antes de enterarse del fallo.'
      - texto: 'La MMU ve P = 0 → interrupción de PF → el SO pide la página al disco y el proceso se bloquea → el DMA la copia a memoria → interrupción de fin de E/S → el SO actualiza la tabla (y la TLB) → el proceso pasa a listo → reintenta la instrucción'
        explicacion: Correcta.
      - texto: 'La MMU ve P = 0 → la MMU lee la página de disco → actualiza la TLB → el proceso sigue'
        explicacion: 'La MMU no lee de disco: eso lo inicia el SO.'
      - texto: 'Interrupción de PF → el proceso pasa a listo → el SO pide la página → el proceso se bloquea → reintenta'
        explicacion: 'El proceso se bloquea primero y pasa a listo cuando la página ya está.'
    correcta: 1
    justificacion: |
      1. La MMU consulta la TLB (miss) y la tabla de páginas: **P = 0**.
      2. Se genera la **interrupción** de page fault.
      3. El SO inicia la lectura de la página desde disco; el proceso pasa a **bloqueado**.
      4. El **DMA** transfiere la página del disco a memoria.
      5. Llega la **interrupción de fin de E/S**, que atiende el SO.
      6. El SO actualiza la tabla de páginas (y la TLB).
      7. El proceso pasa a **listo**.
      8. Cuando ejecuta, **reintenta** la instrucción.
---

Este simulacro reúne preguntas de **teoría** de 2dos parciales anteriores (2024 a 2026) sobre
**memoria virtual**: tablas jerárquicas e invertidas, TLB y localidad, y el procedimiento de un
page fault. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la
justificación de cada una resume la resolución oficial de la cátedra.
