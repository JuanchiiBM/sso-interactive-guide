---
titulo: Planificación de CPU
parcial: 1
orden: 4
resumen: Planificadores de largo, mediano y corto plazo, criterios, algoritmos (FIFO, SJF/SRT, RR, VRR, HRRN, multinivel) y desempates.
aliases:
  [
    scheduling,
    planificador,
    dispatcher,
    FIFO,
    SJF,
    SRT,
    Round Robin,
    VRR,
    HRRN,
    multinivel,
    feedback,
    Gantt,
  ]
---

Con multiprogramación hay varios procesos queriendo usar la CPU al mismo tiempo. Si no se los coordina, pueden pasar cosas como que un proceso largo acapare la CPU, que otros no ejecuten nunca o que el sistema responda cada vez más lento. La **planificación** decide quién ejecuta y cuándo. En el parcial casi siempre aparece como un **diagrama de Gantt** armado a partir de una traza de procesos.

## Conceptos base

- **Grado (nivel) de multiprogramación**: cantidad de procesos activos en memoria principal, es decir, en Ready, Running o Blocked.
  - Si el sistema tiene un **grado máximo** y llega un proceso con el cupo lleno, queda en **New** hasta que se libere un lugar.
  - Un proceso **bloqueado sigue ocupando** su lugar: el cupo se libera recién cuando alguno **termina** (o lo suspende el planificador de mediano plazo).
  - El tiempo en New no cuenta como espera en Ready, pero el tiempo de retorno se mide desde la llegada.
- **CPU bound**: proceso que pasa la mayor parte del tiempo calculando.
- **I/O bound**: proceso que hace poco cálculo y usa la E/S todo el tiempo.
- La CPU nunca está realmente "vacía": si no hay procesos de usuario listos, ejecuta el proceso _idle_ del SO.

## Tipos de planificadores

| Planificador      | Decide                                                         | Transiciones que maneja                                        | ¿Afecta la multiprogramación?                          |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Largo plazo**   | Qué procesos se admiten en el sistema.                         | New → Ready, → Exit                                            | **Sí**: admitir la sube, finalizar la baja.            |
| **Mediano plazo** | Qué procesos se sacan a disco o se traen de vuelta (swapping). | Ready ↔ Ready/Susp, Blocked ↔ Blocked/Susp                     | **Sí**: el swap out la baja, el swap in la sube.       |
| **Corto plazo**   | Cuál de los procesos en Ready ejecuta ahora.                   | Ready → Running (dispatch), Running → Ready (timeout/desalojo) | **No**: trabaja solo con procesos que ya están en RAM. |

El de corto plazo es el que se ejecuta más seguido. Interviene con cada interrupción, syscall o señal que pueda cambiar quién debe usar la CPU, y por eso tiene que ser muy liviano. Tiene dos piezas: el **dispatcher**, que le entrega la CPU al proceso elegido, y el **cambio de contexto**.

### Con desalojo y sin desalojo

- **Sin desalojo (non-preemptive)**: una vez que un proceso tiene la CPU, la conserva hasta que se bloquea o termina. Puede monopolizarla.
- **Con desalojo (preemptive)**: el SO puede sacarle la CPU al proceso cuando llega a Ready alguien con más prioridad o cuando vence el quantum.

|                  | El SO interviene para replanificar cuando…                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Sin desalojo** | Hay una syscall bloqueante o termina el proceso.                                                      |
| **Con desalojo** | Lo anterior, y además cuando llega un proceso a Ready: New → Ready, Blocked → Ready o fin de quantum. |

## Criterios de planificación

|                                   | Cuantitativos (se miden)                                 | Cualitativos                                         |
| --------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- |
| **Orientados al usuario/proceso** | Tiempo de retorno, tiempo de espera, tiempo de respuesta | Previsibilidad                                       |
| **Orientados al sistema**         | Throughput (tasa de procesamiento), uso de CPU           | Equidad, respeto de prioridades, balance de recursos |

Fórmulas que se usan en los ejercicios:

- `Tiempo de retorno (ejecución) = instante de fin − instante de llegada`
- `Tiempo de espera = instante de fin − instante de llegada − tiempo total de CPU` (en la versión simplificada de la cátedra; si hubo E/S, también hay que restar el tiempo de E/S; ver la nota)
- **Tiempo de respuesta**: el tiempo que tarda el proceso en dar su primera respuesta. Por convención, esa primera respuesta es su primera E/S.
- **Throughput**: cantidad de procesos que terminan por unidad de tiempo.
- **Uso de CPU**: porcentaje del tiempo en que la CPU estuvo ocupada. Cuanto más alto, mejor.

> **Nota:** el tiempo de espera cuenta solo el tiempo pasado en la **cola de Ready**. Si el proceso hizo E/S, al restar solo la CPU también se estaría contando el tiempo bloqueado. En un Gantt lo más seguro es sumar directamente los intervalos en Ready.

## Algoritmos

Idea general: cada proceso tiene una prioridad (que puede cambiar con el tiempo) y se elige al de mayor prioridad. Lo que cambia entre algoritmos es **cómo se define esa prioridad**. Las E/S no se planifican: cada dispositivo atiende su cola en orden **FIFO**.

### FIFO (FCFS)

Ejecuta en orden de llegada a Ready. El proceso que vuelve de una E/S se pone **al final** de la cola. Es sin desalojo.

- Simple y con poco overhead.
- Un proceso largo demora a todos los cortos que llegan detrás. Además puede monopolizar la CPU.

### SJF / SPN (Shortest Job First), sin desalojo

Elige al proceso cuya **próxima ráfaga de CPU es más corta**. Si hay empate, gana el que lleva más tiempo en Ready (FIFO).

- Minimiza el tiempo de espera promedio.
- Tiene **inanición**: un proceso largo puede no ejecutar nunca si siguen llegando procesos cortos.
- En la realidad no se sabe cuánto va a durar una ráfaga, así que hay que **estimarla**.

### Estimación de ráfagas

La próxima ráfaga se estima como un promedio ponderado entre la última ráfaga real y la última estimación:

`EST(n+1) = α · REAL(n) + (1 − α) · EST(n)`, con `0 ≤ α ≤ 1`

- Con α alto pesa más el comportamiento reciente: la estimación reacciona rápido.
- Con α bajo pesa más la historia: la estimación cambia despacio. Conviene cuando el proceso es estable.
- Calcular estimaciones agrega overhead.
- El planificador **elige por la estimación**, pero el proceso **ejecuta su ráfaga real**. Si la real resulta más larga que la estimada, el proceso sigue ejecutando igual: la estimación solo sirve para decidir a quién elegir.
- La estimación de cada ráfaga se calcula cuando el proceso vuelve a Ready (con la ráfaga real que acaba de terminar).

### SRT (Shortest Remaining Time) = SJF con desalojo

Cada vez que llega un proceso a Ready se compara su ráfaga con **lo que le falta** al que está ejecutando. Si la del recién llegado es menor, hay desalojo. Si hay empate, sigue el que ya estaba ejecutando.

Con estimaciones, "lo que le falta" es la **estimación restante**: `estimación − lo que ya ejecutó`. Puede llegar a 0 (o quedar negativa) si la ráfaga real es más larga que la estimada; en ese caso el proceso sigue y solo lo desaloja alguien con una estimación **estrictamente menor**.

- Favorece todavía más a los procesos cortos.
- Tiene inanición y más overhead que SJF.

### Round Robin (RR)

Es FIFO con un **quantum** (Q): cuando el proceso agota su quantum, una interrupción de clock lo desaloja y lo manda al final de Ready.

- Si el proceso se bloquea antes de agotar el quantum, **lo que le sobró no se acumula**: la próxima vez arranca con Q entero.
- Si vence el quantum y **no hay nadie más en Ready**, el mismo proceso sigue ejecutando con un quantum nuevo (igual hay interrupción de clock).
- Con Q muy chico hay muchísimos cambios de contexto y mucho overhead. Con Q muy grande nunca corta a nadie y se comporta como FIFO.
- Es equitativo y no tiene inanición, pero **perjudica a los I/O bound**: se bloquean enseguida, pierden el resto del quantum y vuelven al final de la cola.

### Virtual Round Robin (VRR)

Corrige esa injusticia de RR contra los I/O bound con **dos colas FIFO**:

| Cola                              | Quién entra                                    | Quantum con el que sale                               |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| **Auxiliar (mayor prioridad)**    | Procesos que vuelven de una E/S.               | `Q − lo que ya usó` desde que salió de la cola común. |
| **Ready común (menor prioridad)** | Procesos nuevos y los que agotaron su quantum. | Q completo.                                           |

La cola común solo se atiende cuando la auxiliar está vacía. En la práctica, al proceso I/O bound se le "respeta" el quantum que le había sobrado.

```recorrido vrr-cola-auxiliar

```

### HRRN (Highest Response Ratio Next)

Es sin desalojo. Cada vez que hay que elegir, se calcula el **response ratio** de cada proceso en Ready y gana el más alto:

`R = (w + s) / s = w / s + 1`

- `w` = tiempo que lleva esperando en Ready.
- `s` = duración de su próxima ráfaga de CPU (en los ejercicios se toma de la tabla; en la realidad se estima).

Como `w` crece mientras el proceso espera, su prioridad sube sola (**aging**). Así se evita la inanición de SJF sin dejar de favorecer a los cortos. Su costo es un overhead alto, porque hay que recalcular R de todos en cada decisión.

### Por prioridades

Hay una única cola de Ready ordenada por una prioridad fija de cada proceso. Puede ser con desalojo (si llega uno más prioritario, desaloja al actual) o sin desalojo. Con prioridades fijas **puede haber inanición**. Se soluciona haciendo la prioridad dinámica, subiéndola con el tiempo de espera (aging).

### Colas multinivel

Hay **una cola por nivel de prioridad** y cada cola puede usar su propio algoritmo (por ejemplo FIFO para los procesos críticos y RR para el resto). Un proceso **siempre vuelve a su misma cola**, porque la prioridad es estática. Una cola se atiende solo si todas las de mayor prioridad están vacías, así que hay **inanición** para las colas bajas.

### Multinivel con retroalimentación (feedback)

Es parecido al anterior, pero los procesos **cambian de cola**. La versión típica funciona así:

- Todo proceso nuevo entra en la cola de mayor prioridad.
- Si agota su quantum, baja una cola.
- Puede tener reglas de promoción (por ejemplo, volver a la cola alta después de una E/S) o de aging.
- Entre colas se suele planificar por prioridad con desalojo.

No tiene una única definición: **las reglas exactas las fija el enunciado**. Generan replanificación la interrupción por quantum, la llegada de un proceso nuevo, el fin de una E/S y el bloqueo de un proceso.

## Tabla comparativa

| Algoritmo               | Desalojo        | Criterio de selección              | Quantum       | Inanición                                                        | Overhead        | Observaciones                                                    |
| ----------------------- | --------------- | ---------------------------------- | ------------- | ---------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| **FIFO**                | No              | Orden de llegada                   | No            | No en sentido estricto, pero un proceso puede monopolizar la CPU | Bajo            | Perjudica a los procesos cortos que llegan después de uno largo. |
| **SJF / SPN**           | No              | Ráfaga más corta                   | No            | Sí                                                               | Medio (estimar) | Empate: FIFO.                                                    |
| **SRT**                 | Sí              | Menor tiempo restante              | No            | Sí                                                               | Medio-alto      | Empate: sigue el que ejecutaba.                                  |
| **RR**                  | Sí (por clock)  | FIFO + quantum                     | Sí            | No                                                               | Medio           | Favorece a los CPU bound y perjudica a los I/O bound.            |
| **VRR**                 | Sí (por clock)  | FIFO, con la cola auxiliar primero | Sí            | No                                                               | Alto            | Mejora la situación de los I/O bound.                            |
| **HRRN**                | No              | Mayor `(w + s) / s`                | No            | No (aging)                                                       | Alto            | Favorece a los procesos cortos que esperaron mucho.              |
| **Prioridades**         | Opcional        | Prioridad fija                     | No            | Sí                                                               | Bajo-medio      | Se soluciona con aging.                                          |
| **Colas multinivel**    | Según el diseño | Cola de mayor prioridad no vacía   | Según la cola | Sí                                                               | Medio           | La prioridad es estática.                                        |
| **Feedback multinivel** | Sí              | Nivel de la cola, que es dinámico  | Por cola      | Puede haber, salvo con aging                                     | Alto            | Las reglas las fija el enunciado.                                |

## Criterios de desempate de la cátedra

La guía de ejercicios 2026 fija estos criterios para resolver empates en los Gantt:

1. **Simultaneidad de llegadas a Ready** (aplica en FIFO, RR y cualquier cola FIFO). Si en el mismo instante llegan varios procesos por motivos distintos, se encolan en este orden:
   1. el que viene de una **interrupción de clock** (fin de quantum);
   2. el que viene de una **interrupción por fin de evento** (terminó su E/S);
   3. el que viene de una **syscall de creación** (proceso nuevo).

   El motivo: las interrupciones se atienden antes que las syscalls, y entre interrupciones tiene prioridad la de clock.

2. Si sigue el empate, gana **el proceso cuyo nombre va antes en orden ascendente** (A antes que B).

Algunas aclaraciones:

- En **SJF/SRT/HRRN** el orden de llegada no decide nada, porque se comparan ráfagas o ratios. Solo sirve para romper empates de ese criterio.
- En **VRR**, el proceso que vuelve de E/S va a la cola **auxiliar**, así que no compite en ese desempate con los de la cola común.
- En cada evento conviene preguntarse qué hizo intervenir al SO: una syscall, una interrupción de clock o una interrupción de E/S. La guía pide pensarlo explícitamente.

### Supuestos de la guía para armar los Gantt

- **E/S única y FIFO.** Salvo que el enunciado diga otra cosa, las columnas de E/S usan **un solo dispositivo**, que atiende a un proceso por vez en orden de llegada. Si un proceso termina su ráfaga de CPU y el dispositivo está ocupado, queda **bloqueado esperando el dispositivo**: su ráfaga de E/S recién empieza a contar cuando se libera, y ese tiempo **no** es espera en Ready.
- **Varios dispositivos.** Si el enunciado nombra dispositivos distintos, cada uno tiene su propia cola FIFO y pueden trabajar en paralelo entre sí.
- **Varios procesadores.** La cola de Ready es una sola. Con **afinidad**, un proceso que ya ejecutó en una CPU vuelve a esa misma CPU (la espera aunque la otra esté libre); **sin afinidad**, toma cualquier CPU libre. Si hay dos CPUs libres al mismo tiempo, cualquiera de las dos es válida.

### Las dos versiones de la fórmula de estimación

El resumen y la guía escriben el estimador con el α en lugares distintos:

| Fuente             | Fórmula                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| Resumen            | `EST(n+1) = α · REAL(n) + (1 − α) · EST(n)` (α pondera la ráfaga **real**)    |
| Guía de ejercicios | `T(i) = T(i−1) · α + R(i−1) · (1 − α)` (α pondera la **estimación** anterior) |

Con **α = 0,5**, que es el valor que usa la guía, las dos dan exactamente lo mismo: `EST = (REAL + EST_anterior) / 2`. Si en un examen aparece otro α, hay que usar la fórmula tal como la escribe el enunciado.

## Preguntas de parcial

**1. ¿Qué eventos consideran los algoritmos con desalojo para replanificar? ¿Por qué los sin desalojo no?**

> Además del bloqueo y la finalización, los algoritmos con desalojo replanifican cada vez que un proceso **llega a Ready**: si es nuevo, si vuelve de una E/S o si se venció un quantum. El recién llegado podría tener más prioridad que el que está ejecutando. Los sin desalojo no los consideran porque, por definición, no le sacan la CPU a quien la tiene: esperan a que la libere solo.

**2. Compare HRRN, SJF con desalojo (SRT) y SJF sin desalojo.**

> - **HRRN**: elige por mayor `(w + s) / s`. No tiene desalojo. Su overhead es alto porque recalcula el ratio de todos. No tiene inanición gracias al aging. Favorece a los cortos sin condenar a los largos.
> - **SRT**: elige por menor tiempo restante. Tiene desalojo y un overhead medio-alto (estimaciones y comparaciones en cada llegada). Hay inanición de los procesos largos.
> - **SJF sin desalojo**: elige por ráfaga más corta, sin desalojo. Es el de menor overhead de los tres, pero también tiene inanición de los largos.

**3. ¿Cómo puede el planificador de corto plazo provocar una condición de carrera? ¿Cómo se soluciona sin ayuda del SO, incluso con varios procesadores?**

> Dos procesos modifican una variable compartida. Esa modificación son varias instrucciones de máquina, y una interrupción en el medio hace que el planificador ponga a ejecutar al otro proceso. El resultado depende del orden en que se intercalan. Sin ayuda del SO se puede proteger la región crítica con una instrucción atómica de hardware como **test-and-set**, que funciona también con varios procesadores. Deshabilitar interrupciones no sirve en ese caso: solo afecta a una CPU y además es una instrucción privilegiada.

**4. ¿El proceso se da cuenta de que fue bloqueado o desalojado?**

> No. El SO guarda su contexto completo y lo restaura después, así que desde el punto de vista del proceso la ejecución continúa como si nada hubiera pasado. Lo único que "percibe" es que pasó el tiempo.

**5. ¿Cómo afecta el tamaño del quantum? ¿Es igual en RR y en VRR?**

> Con un quantum chico el reparto es más equitativo, pero hay muchos cambios de contexto y mucho overhead. Con uno grande hay poco overhead, pero RR termina comportándose como FIFO. En VRR pasa lo mismo, con el agregado de que la cola auxiliar puede crecer mucho si hay muchos I/O bound.

**6. Compare FIFO, RR y SJF en equidad, overhead e inanición.**

> - **FIFO**: no es equitativo, porque un proceso largo monopoliza la CPU. Overhead bajo. El resumen lo marca con inanición en este cuadro: en rigor, todos terminan ejecutando salvo que alguien nunca libere la CPU.
> - **RR**: es equitativo porque todos reciben el mismo quantum, aunque favorece a los CPU bound. Overhead medio. Sin inanición.
> - **SJF**: no es equitativo. Overhead alto (estimar y comparar ráfagas). Tiene inanición.

**7. ¿Qué pasos ocurren si, mientras ejecuta un proceso, llega la interrupción de fin de E/S de otro proceso bloqueado?**

> Llega la interrupción. La CPU termina la instrucción actual, detecta la interrupción y guarda el contexto del proceso que ejecutaba. Pasa a modo kernel y corre el manejador, que mueve al proceso bloqueado a Ready. Si el algoritmo es con desalojo, el planificador compara prioridades y puede desalojar al que estaba ejecutando. Por último se restaura el contexto del proceso elegido y se vuelve a modo usuario.

**8. V o F: con jacketing, usar ULT es lo mismo que usar KLT.**

> Falso. El jacketing solo evita que una syscall bloqueante frene a todo el proceso. Los ULT siguen siendo invisibles para el SO: los planifica la biblioteca y no pueden ejecutar en paralelo en varios procesadores.

**9. ¿Qué es la inanición? Dé dos algoritmos con desalojo que la sufran y cómo solucionarla.**

> Es cuando a un proceso se le niega la CPU indefinidamente porque siempre aparece otro con más prioridad. **SRT**: los procesos de ráfaga larga pueden no ejecutar nunca; se soluciona con aging, subiendo la prioridad con la espera, que es la idea de HRRN. **Prioridades con desalojo**: los de prioridad baja pueden quedar relegados para siempre; se soluciona haciendo la prioridad dinámica según el tiempo en Ready.

**10. V o F: en un algoritmo con desalojo, la interrupción de fin de E/S de un KLT solo se atiende si ese hilo tiene más prioridad que el que ejecuta.**

> Falso. Las interrupciones se atienden siempre al terminar la instrucción en curso, sin importar prioridades. La prioridad recién se usa **después**, para decidir si el hilo que pasó a Ready desaloja al actual.

**11. V o F: la transición Running → Ready solo existe en algoritmos con quantum.**

> Falso. Cualquier algoritmo con desalojo la tiene. Por ejemplo, en SRT un proceso vuelve a Ready si llega otro con ráfaga más corta, y SRT no usa quantum.

**12. V o F: si un sistema sufre inversión de prioridades, se soluciona pasando a Virtual Round Robin.**

> El resumen la da como **Verdadera**. Inversión de prioridades es cuando un proceso de baja prioridad retiene un recurso que necesita uno de alta prioridad, y el de baja no ejecuta porque siempre hay otros antes. Con VRR todos reciben quantum en algún momento, así que el de baja prioridad termina ejecutando y libera el recurso. Ojo: en rigor, VRR no tiene prioridades explícitas, así que lo que hace es eliminar el escenario más que "solucionar" el problema.

**13. ¿Qué implica usar un planificador sin desalojo en un sistema de tiempo compartido?**

> Que un proceso solo suelta la CPU si se bloquea o termina. Si entra en un loop o nunca hace E/S, el resto de los usuarios queda sin CPU y el sistema deja de responder. En tiempo compartido esto es inaceptable.

**14. ¿Qué diferencias hay entre algoritmos con y sin desalojo? ¿Dónde usaría cada uno?**

> Los algoritmos con desalojo reevalúan cada vez que llega un proceso a Ready y pueden quitarle la CPU al actual. Eso da más equidad y mejor respuesta, pero con más overhead. Los sin desalojo son más simples y livianos. Los primeros convienen en sistemas multitarea o interactivos; los segundos, en sistemas por lotes o donde minimizar el overhead importa más que el tiempo de respuesta.

**15. V o F: todos los planificadores (largo, mediano y corto plazo) modifican el grado de multiprogramación.**

> Falso. Solo lo modifican el de largo plazo (admite o finaliza procesos) y el de mediano plazo (swap in/out). El de corto plazo elige entre procesos que ya están en memoria.

**16. ¿Qué es el envejecimiento (aging) y para qué sirve?**

> Es aumentar la prioridad de un proceso a medida que espera. Sirve para evitar la inanición: tarde o temprano, el proceso que espera supera en prioridad a los recién llegados. El ejemplo típico es HRRN, donde el término `w` del ratio crece con la espera.

_Fuente: Sistemas Operativos for Dummies (págs. 24–38) y Guía de Ejercicios de Planificación v.2C2026._
