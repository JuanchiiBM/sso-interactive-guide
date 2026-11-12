---
titulo: 'Teoría de parciales: Memoria virtual'
tema: parcial-2/memoria-virtual
fuente: { guia: Parciales 2024–2026 (teoría), numero: S1 }
tipo: teorico
dificultad: parcial
tags: [simulacro, teoria, parcial, thrashing, multiprogramacion, pff, working-set]
preguntas:
  - enunciado: '(2P 1C2026 TT, teoría 1c) ¿Cómo se llama el fenómeno que ocurre cuando los procesos pasan la mayor parte del tiempo intercambiando páginas entre disco y memoria principal?'
    opciones:
      - texto: Fragmentación externa
        explicacion: 'Es espacio libre repartido en huecos, no intercambio de páginas.'
      - texto: Thrashing (sobrepaginación)
        explicacion: Correcta.
      - texto: Swapping
        explicacion: 'El swapping saca procesos enteros; el fenómeno patológico tiene otro nombre.'
      - texto: Inanición
        explicacion: 'Es de planificación: un proceso que nunca recibe la CPU.'
    correcta: 1
    justificacion: |
      Es el **thrashing** o sobrepaginación: los procesos fallan todo el tiempo, se la pasan esperando
      páginas y casi no ejecutan.
  - enunciado: '(2P 2C2024 TT, desarrollo 3) ¿Qué relación hay entre el thrashing y el grado de multiprogramación?'
    opciones:
      - texto: 'Ninguna: el thrashing depende solo del algoritmo de reemplazo'
        explicacion: 'Con cualquier algoritmo, si a cada proceso le tocan muy pocos frames, falla todo el tiempo.'
      - texto: 'Subir la multiprogramación siempre mejora el uso de CPU, así que nunca causa thrashing'
        explicacion: 'Mejora al principio, hasta que los frames por proceso no alcanzan.'
      - texto: 'Subir la multiprogramación con la CPU ociosa mejora al principio, pero si se sigue subiendo cada proceso tiene muy pocas páginas en memoria y aparece el thrashing'
        explicacion: Correcta.
      - texto: 'El thrashing aparece cuando la multiprogramación es baja, porque la CPU queda ociosa'
        explicacion: 'Con multiprogramación baja la CPU está ociosa por falta de procesos, sin paginar.'
    correcta: 2
    justificacion: |
      **Thrashing:** durante un intervalo la CPU pasa más tiempo con el SO atendiendo fallos de página
      que ejecutando procesos. Si el sistema está subutilizado, subir la multiprogramación mejora el
      uso de CPU; pero llega un punto en que cada proceso tiene muy pocos frames para su localidad,
      falla constantemente y el uso de CPU **se desploma**.
  - enunciado: '(2P 1C2024 TT, desarrollo 1) Si analiza un sistema para determinar si está ocurriendo thrashing, ¿qué métricas permitirían inferirlo?'
    opciones:
      - texto: 'Uso de CPU bajo y cantidad de fallos de página en aumento (con mucha E/S a disco de paginación)'
        explicacion: Correcta.
      - texto: 'Uso de CPU alto y pocos fallos de página'
        explicacion: 'Es un sistema trabajando bien.'
      - texto: 'Mucha fragmentación externa en la memoria'
        explicacion: 'No tiene que ver con la paginación bajo demanda.'
      - texto: 'Muchos TLB hits'
        explicacion: 'Muchos hits indican buena localidad, lo contrario del thrashing.'
    correcta: 0
    justificacion: |
      La señal es la combinación: **CPU baja** y **fallos de página en aumento**, que se ven como
      mucha E/S de paginación. Se soluciona con más memoria o **bajando la multiprogramación**, para
      que crezca el conjunto residente de los procesos que fallan.
  - enunciado: '(2P 1C2024 TM, desarrollo 2) Sistema con 10 procesos, paginación bajo demanda, asignación dinámica y sustitución **local**. ¿Cómo se detecta si hay thrashing?'
    opciones:
      - texto: 'Midiendo el uso total de CPU: si es bajo, hay thrashing'
        explicacion: 'Con sustitución local el thrashing puede ser de un solo proceso sin que la CPU total lo muestre.'
      - texto: 'Midiendo la frecuencia de fallos de página global del sistema'
        explicacion: 'Con sustitución local hay que mirar proceso por proceso.'
      - texto: 'Mirando si hay frames libres: si no hay, hay thrashing'
        explicacion: 'Que la memoria esté llena es lo normal.'
      - texto: 'Midiendo la frecuencia de fallos de página de cada proceso'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Con sustitución **local** cada proceso reemplaza solo sus páginas: el thrashing queda
      **dentro de uno o algunos procesos**. Las métricas globales (CPU, fallos totales) no lo
      muestran bien; hay que medir la **frecuencia de PF de cada proceso**. Se soluciona dándoles más
      frames a los que están en thrashing.
  - enunciado: '(2P 1C2024 TM, desarrollo 2) En ese mismo sistema, si un proceso está en thrashing y **no hay frames libres**, ¿qué se puede hacer?'
    opciones:
      - texto: 'Nada: con sustitución local no se le pueden dar frames de otro lado'
        explicacion: 'La asignación es dinámica: el SO puede cambiar cuántos frames tiene cada proceso.'
      - texto: 'Sacarles frames a procesos con frecuencia de PF muy baja, o bajar la multiprogramación suspendiendo un proceso'
        explicacion: Correcta.
      - texto: 'Aumentar la multiprogramación para que la CPU no quede ociosa'
        explicacion: 'Más procesos compiten por los mismos frames: lo empeora.'
      - texto: 'Cambiar el algoritmo de reemplazo a uno global'
        explicacion: 'Con global el proceso le robaría frames a otros y podría contagiarlos.'
    correcta: 1
    justificacion: |
      Sin frames libres hay que liberarlos: **reducir los frames** de procesos con frecuencia de PF
      muy baja (les sobran) para dárselos al que está en thrashing, o **bajar el grado de
      multiprogramación** (suspender algún proceso).
  - enunciado: '(2R 2C2024, desarrollo 3) ¿Cómo se soluciona una situación de thrashing con **reemplazo local** y con **reemplazo global**?'
    opciones:
      - texto: 'En los dos casos, cambiando el algoritmo de reemplazo por LRU'
        explicacion: 'Ningún algoritmo arregla que no alcancen los frames.'
      - texto: 'Local: bajando la multiprogramación. Global: dándole más frames a un proceso'
        explicacion: 'Están invertidas.'
      - texto: 'Local: dándoles más frames a los procesos en thrashing. Global: bajando el grado de multiprogramación'
        explicacion: Correcta.
      - texto: 'Local: no puede haber thrashing. Global: compactando la memoria'
        explicacion: 'Con local puede haberlo en algunos procesos; y compactar no aplica a la paginación.'
    correcta: 2
    justificacion: |
      - **Local:** el thrashing ocurre en procesos específicos → asignarles **más frames**.
      - **Global:** los procesos se roban frames entre sí y el problema es de todo el sistema →
        **bajar el grado de multiprogramación**.
  - enunciado: '(2P 1C2025 TT, V/F 1b) "El thrashing se puede solucionar parcialmente aumentando el grado de multiprogramación del sistema."'
    opciones:
      - texto: 'Verdadero: con más procesos la CPU tiene más trabajo y deja de estar ociosa'
        explicacion: 'La CPU está ociosa porque los procesos esperan páginas: más procesos esperarían más.'
      - texto: 'Verdadero, pero solo con sustitución local'
        explicacion: 'Con local tampoco: los frames siguen sin alcanzar.'
      - texto: 'Falso: el thrashing no tiene nada que ver con la multiprogramación'
        explicacion: 'Tiene todo que ver: es su causa típica.'
      - texto: 'Falso: lo empeora, porque más procesos compiten por los mismos frames; se soluciona bajando la multiprogramación'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      **Falso.** Aumentar la multiprogramación reparte los frames entre más procesos y cada uno tiene
      menos: **empeora** el thrashing. Se soluciona bajándola (o con asignación dinámica según el
      working set o la frecuencia de PF).
  - enunciado: '(2P 2C2025 TM, desarrollo 3) Con asignación dinámica y sustitución **global**, ¿cómo se detecta y se mitiga el thrashing?'
    opciones:
      - texto: 'Se detecta con la frecuencia de fallos de página (cotas) o comparando la suma de los working sets con los frames; se mitiga bajando el grado de multiprogramación'
        explicacion: Correcta.
      - texto: 'Se detecta por la fragmentación externa; se mitiga compactando'
        explicacion: 'La paginación no tiene fragmentación externa.'
      - texto: 'Se detecta por el uso de CPU alto; se mitiga aumentando la multiprogramación'
        explicacion: 'El thrashing baja el uso de CPU, y más procesos lo empeoran.'
      - texto: 'No se puede detectar con sustitución global; hay que pasar a local'
        explicacion: 'Se detecta igual, con métricas del sistema.'
    correcta: 0
    justificacion: |
      **Causa:** los frames no alcanzan para la localidad de los procesos (multiprogramación alta).
      **Impacto:** sube la tasa de PF, baja el uso de CPU y el disco se vuelve el cuello de botella.

      - **Detección:** frecuencia de PF con cotas superior e inferior (PFF), o el **working set**: si
        la suma de los conjuntos de trabajo supera los frames disponibles, hay thrashing.
      - **Mitigación:** **bajar el grado de multiprogramación** (suspender procesos).
  - enunciado: '(2R 2C2025, V/F 3b) "Si en un sistema existe un bajo uso de I/O durante un período de tiempo, podemos concluir que no hay thrashing."'
    opciones:
      - texto: 'Falso: el thrashing se mide con el uso de CPU, no con la E/S'
        explicacion: 'La CPU baja también puede ser falta de procesos; la E/S de paginación es lo que delata.'
      - texto: 'Verdadero: el thrashing implica muchos fallos de página, y cada uno es una E/S a disco'
        explicacion: Correcta.
      - texto: 'Falso: los fallos de página se atienden desde la TLB, sin E/S'
        explicacion: 'Una página ausente no está en la TLB: hay que traerla de disco.'
      - texto: 'Verdadero, porque con poca E/S los procesos no se bloquean nunca'
        explicacion: 'La conclusión es correcta pero el motivo no: pueden bloquearse por otras cosas.'
    correcta: 1
    justificacion: |
      **Verdadero.** El thrashing es una tormenta de fallos de página, y cada uno requiere leer (y a
      veces escribir) una página en disco. Si casi no hay E/S, no hay thrashing.
  - enunciado: '(2P 1C2026 TM, desarrollo 3 a) Paginación bajo demanda con multiprogramación variable. Se mide **CPU 13 %, disco de paginación 97 %**. ¿Qué pasa? ¿Conviene subir la multiprogramación?'
    opciones:
      - texto: 'Hay pocos procesos; conviene subir la multiprogramación'
        explicacion: 'Con pocos procesos el disco de paginación no estaría al 97 %.'
      - texto: 'El sistema anda bien: el disco trabaja mucho porque hay mucha E/S de archivos'
        explicacion: 'Es el disco de paginación: está atendiendo fallos de página.'
      - texto: 'Hay thrashing; subir la multiprogramación lo empeoraría'
        explicacion: Correcta.
      - texto: 'Hay thrashing; subir la multiprogramación lo soluciona porque usa más la CPU'
        explicacion: 'Más procesos son menos frames por proceso: más fallos.'
    correcta: 2
    justificacion: |
      CPU ociosa y disco de paginación saturado: los procesos se la pasan esperando páginas.
      Es **thrashing**. Subir la multiprogramación generaría más fallos de página; hay que bajarla.
  - enunciado: '(2P 1C2026 TM, desarrollo 3 b) Mismo sistema: **CPU 87 %, disco de paginación 13 %**. ¿Qué pasa? ¿Conviene subir la multiprogramación?'
    opciones:
      - texto: 'Hay thrashing; hay que bajar la multiprogramación'
        explicacion: 'Con CPU alta y poca paginación no hay thrashing.'
      - texto: 'No hay thrashing: hay bastantes procesos con su localidad en memoria; subirla podría aumentar un poco la CPU, siempre que no lleve al thrashing'
        explicacion: Correcta.
      - texto: 'Hay pocos procesos; subir la multiprogramación siempre va a aumentar mucho la CPU'
        explicacion: 'La CPU ya está alta: el margen es chico y el riesgo es pasarse.'
      - texto: 'El disco es el cuello de botella; hay que agrandar el área de swap'
        explicacion: 'El disco está casi libre.'
    correcta: 1
    justificacion: |
      La CPU está bien usada y casi no se pagina: los procesos tienen su localidad en memoria. Se
      podría subir un poco la multiprogramación para ganar algo de CPU, **siempre que** los nuevos
      procesos no empujen al sistema al thrashing.
  - enunciado: '(2P 1C2026 TM, desarrollo 3 c) Mismo sistema: **CPU 13 %, disco de paginación 3 %**. ¿Qué pasa? ¿Conviene subir la multiprogramación?'
    opciones:
      - texto: 'Hay thrashing; hay que bajar la multiprogramación'
        explicacion: 'Con thrashing el disco de paginación estaría saturado.'
      - texto: 'El sistema está saturado y no admite más procesos'
        explicacion: 'Ni la CPU ni el disco están ocupados.'
      - texto: 'No conviene: con la CPU tan baja cualquier proceso nuevo causa thrashing'
        explicacion: 'Lo que causa thrashing es la falta de frames, y casi no se está paginando.'
      - texto: 'Hay pocos procesos con su localidad en memoria; subir la multiprogramación aumentaría el uso de CPU, lejos del thrashing'
        explicacion: Correcta.
    correcta: 3
    justificacion: |
      Ni la CPU ni el disco trabajan: hay **pocos procesos**. Agregar procesos aumentaría el uso de
      CPU sin acercarse al thrashing (sobra memoria para su localidad).
  - enunciado: '(2R 1C2026, desarrollo 5) ¿El uso de la **TLB** podría ayudar a mitigar el thrashing?'
    opciones:
      - texto: 'Sí: con más TLB hits hay menos fallos de página'
        explicacion: 'Un hit ahorra leer la tabla, pero si la página no está en memoria, no hay hit posible.'
      - texto: 'Sí, si la TLB es lo bastante grande como para guardar todas las páginas del proceso'
        explicacion: 'La TLB guarda traducciones de páginas presentes; no agrega memoria.'
      - texto: 'No: una página que no está en memoria tampoco está en la TLB, así que el fallo de página ocurre igual'
        explicacion: Correcta.
      - texto: 'No, porque la TLB solo se usa con segmentación'
        explicacion: 'La TLB es de paginación.'
    correcta: 2
    justificacion: |
      El thrashing es falta de **frames**: la RAM no alcanza para el working set de los procesos y
      los fallos de página son constantes. La TLB solo acelera la traducción de páginas que **ya
      están** en memoria; no evita ningún fallo de página.
---

Este simulacro reúne preguntas de **teoría** de 2dos parciales anteriores (2024 a 2026) sobre
**thrashing**: cómo se detecta, qué tiene que ver con la multiprogramación y cómo se soluciona con
reemplazo local y global. Cada pregunta indica entre paréntesis de qué examen e ítem sale.

Los ítems de respuesta breve, verdadero/falso y desarrollo se pasaron a multiple choice; la
justificación de cada una resume la resolución oficial de la cátedra.
