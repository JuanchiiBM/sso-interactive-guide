---
titulo: Hilos
parcial: 1
orden: 5
resumen: Hilos y TCB, qué comparten, KLT vs ULT, doble planificación, syscalls bloqueantes, wrappers y jacketing.
aliases: [threads, hilo, KLT, ULT, TCB, jacketing, multihilo]
---

Un proceso "clásico" tiene un único camino de ejecución. Los **hilos** (threads) permiten que un mismo proceso tenga **varios caminos de ejecución concurrentes**, todos sobre los mismos recursos. En el parcial importa sobre todo qué comparten y qué no, en qué se diferencian los hilos de kernel (KLT) de los de usuario (ULT) y cómo se comportan en un Gantt cuando hacen E/S.

## ¿Qué es un hilo?

Un hilo es una **línea de ejecución dentro de un proceso**. Cuando el SO soporta hilos, lo que planifica es cada hilo y no el proceso entero.

| Compartido entre los hilos del proceso | Propio de cada hilo                                                         |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Código                                 | **Stack**: cada hilo llama a funciones distintas y necesita su propia pila. |
| Datos (variables globales)             | **TCB (Thread Control Block)**                                              |
| Heap                                   | Registros y PC (guardados en el TCB)                                        |
| Archivos abiertos y demás recursos     | Estado del hilo                                                             |
| PCB del proceso                        |                                                                             |

El **TCB** guarda, entre otras cosas, el ID del hilo (**TID**), su **estado**, su **prioridad** y su **contexto de ejecución** (PC, flags, registros).

Consecuencias directas:

- Las **variables locales no se comparten** entre hilos, porque viven en el stack de cada uno. Las **globales y el heap sí**, así que ahí hace falta sincronizar.
- Cambiar de un hilo a otro implica un **cambio de contexto**, aunque más liviano que cambiar de proceso.

## Ventajas y desventajas

**Ventajas:**

- **Capacidad de respuesta**: un hilo puede seguir atendiendo mientras otro espera.
- **Menos overhead que tener varios procesos**: crear un hilo o cambiar entre hilos es más barato, porque comparten la memoria.
- **Compartir recursos** sin mecanismos extra.
- **Comunicación eficiente** a través de memoria compartida, sin pasar por el SO.
- **Paralelismo real** en multiprocesadores, si son KLT.

**Desventajas:**

- Menos aislamiento: cualquier hilo puede leer o romper la memoria de otro hilo del mismo proceso.
- Un error en un hilo (por ejemplo un memory leak en el heap) afecta a todo el proceso.

## Hilos de kernel (KLT)

El **SO conoce los hilos**: los crea, los destruye y los planifica mediante syscalls. El planificador de corto plazo elige entre KLT, sin importar a qué proceso pertenece cada uno.

| Ventajas                                                                                  | Desventajas                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Una syscall bloqueante bloquea **solo a ese hilo**.                                       | Toda operación de hilos (crear, cambiar, terminar) pasa por el kernel e implica un cambio de modo. Tiene más overhead que un ULT.           |
| Varios hilos del mismo proceso pueden ejecutar **en paralelo** en distintos procesadores. | Menos estable que usar procesos separados. Si un hilo pierde memoria del heap, esa memoria recién se libera cuando termina todo el proceso. |
| Tiene menos overhead que usar procesos separados.                                         |                                                                                                                                             |

## Hilos de usuario (ULT)

Los maneja una **biblioteca en espacio de usuario** que el proceso incluye. El SO **no sabe que existen**: para el SO hay un solo proceso, con un único hilo planificable. Hay una **doble planificación**: el SO planifica al proceso y la biblioteca decide qué ULT corre dentro de él.

| Ventajas                                                                                        | Desventajas                                                                                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Overhead muy bajo: crear un hilo o cambiar entre hilos no requiere syscalls ni cambios de modo. | **No hay paralelismo**: el SO asigna una sola CPU al proceso, así que dos ULT del mismo proceso nunca ejecutan a la vez. |
| El proceso puede usar **su propio algoritmo de planificación**.                                 | Si un ULT hace una **syscall bloqueante**, se bloquea **todo el proceso** con todos sus ULT (salvo que haya jacketing).  |
| Es **portable**: depende de la biblioteca, no del SO.                                           |                                                                                                                          |

```diagrama hilos-ult-klt

```

### Syscalls bloqueantes, wrappers y jacketing

Esto es lo que más se evalúa en los ejercicios de hilos (ver la guía: ULT con syscalls directas, con wrappers y con jacketing).

1. **Syscall directa del SO.** El ULT llama a la syscall bloqueante y el SO bloquea al proceso entero. Cuando se desbloquea, el PC guardado sigue apuntando **al mismo ULT**, que continúa ejecutando. La biblioteca no llegó a intervenir, así que **se pierde la planificación interna**.
2. **Wrappers de la biblioteca.** La biblioteca envuelve la syscall (algo como un `write_ult`). Antes de hacer la syscall real, la biblioteca registra el bloqueo y deja preparado cuál es el próximo ULT según su algoritmo. El proceso **se sigue bloqueando entero**, pero al volver se respeta la planificación de la biblioteca.
3. **Jacketing (revestimiento).** La biblioteca convierte la syscall bloqueante en su **versión no bloqueante**. Marca como "bloqueado" solo al ULT que la pidió, sigue ejecutando otros ULT y cada tanto le pregunta al SO si la operación terminó. Así **el proceso no se bloquea** y los demás ULT siguen avanzando.

> Convención de la cátedra para los ejercicios: **se asume que NO hay jacketing** salvo que el enunciado lo diga.

Aun con jacketing, los ULT siguen siendo invisibles para el SO: no hay paralelismo y hay dos niveles de planificación.

### Combinación ULT + KLT

Un proceso puede tener varios KLT y, sobre cada uno, varios ULT. Así se busca lo mejor de los dos modelos: paralelismo y bloqueo independiente entre KLT, con cambios baratos entre los ULT de un mismo KLT. En un Gantt, cada KLT es una entidad que planifica el SO; dentro de cada KLT, la biblioteca planifica sus ULT.

## Comparación general

|                                    | ULT                                        | KLT                                       | Procesos                    |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------- | --------------------------- |
| **Overhead de creación y cambio**  | Bajo, sin intervención del SO              | Medio-alto, por syscalls y cambio de modo | El más alto                 |
| **Paralelismo en multiprocesador** | No                                         | Sí                                        | Sí                          |
| **Si una syscall bloquea…**        | Se bloquea todo el proceso (sin jacketing) | Se bloquea solo ese hilo                  | Se bloquea solo ese proceso |
| **Quién planifica**                | La biblioteca, dentro del proceso          | El SO                                     | El SO                       |
| **Memoria**                        | Compartida                                 | Compartida                                | Separada, con aislamiento   |

## Preguntas de parcial

**1. V o F: con semáforos en hilos ULT, `wait` y `signal` no requieren cambio de modo.**

> Falso. Los semáforos del SO se usan mediante syscalls, que siempre implican pasar a modo kernel, sin importar si quien las llama es un ULT, un KLT o un proceso.

**2. V o F: para compartir memoria entre procesos o entre KLT hace falta intervención del SO; entre ULT no, porque se gestionan en espacio de usuario.**

> Falso para los KLT. Los hilos de un mismo proceso, sean ULT o KLT, comparten directamente las variables globales y el heap, sin intervención del SO. Lo que sí necesita al SO es compartir memoria **entre procesos distintos**.

**3. V o F: usar KLT en lugar de procesos, aunque su cambio sea más rápido, puede generar problemas de memory leaks.**

> Verdadero. Los KLT comparten el heap del proceso. Si un hilo reserva memoria y no la libera, esa memoria queda ocupada hasta que termina todo el proceso. Con procesos separados, el leak se libera al terminar ese proceso y no afecta a los demás.

**4. Ventajas y desventajas de usar ULT en lugar de KLT.**

> **Ventajas:** crear hilos y cambiar entre ellos es rápido y barato, sin syscalls ni cambios de modo. El proceso puede elegir su propio algoritmo de planificación y el programa es portable. **Desventajas:** no hay paralelismo entre hilos del mismo proceso y, sin jacketing, una syscall bloqueante frena a todos los hilos.

**5. V o F: los KLT no pueden causar memory leaks porque el TCB no tiene referencia al heap.**

> Falso. Que el TCB no apunte al heap no importa: todos los hilos del proceso usan el mismo heap. Si un hilo pide memoria y no la devuelve, hay leak.

**6. V o F: los KLT de un mismo proceso pueden competir por el procesador, pero los ULT de un mismo proceso no.**

> Falso. Los KLT compiten en el planificador del SO. Los ULT también compiten, pero en el planificador de la biblioteca, para ver cuál usa la CPU que el SO le dio al proceso.

**7. ¿Qué operaciones hay en un cambio entre dos KLT del mismo proceso?**

> El hardware guarda el PC y los flags. El SO toma el control, guarda el resto de los registros y decide cambiar de hilo. Copia ese contexto al TCB del hilo saliente, elige el próximo hilo, carga el contexto desde su TCB y vuelve a modo usuario. No se tocan las referencias a código, datos ni heap, porque son del proceso y todos sus hilos las comparten. Por eso es más barato que un cambio de proceso.

**8. Compare procesos, KLT y ULT en overhead, multiprocesamiento y protección.**

> - **ULT**: overhead bajo porque el SO no interviene. No hay multiprocesamiento, porque el SO solo ve al proceso. La protección entre hilos depende de la biblioteca: comparten todo.
> - **KLT**: overhead mayor, porque cada operación pasa por el SO. Tienen multiprocesamiento. Los gestiona el SO, pero comparten la memoria del proceso.
> - **Procesos**: el overhead más alto, con multiprocesamiento y la mejor protección, porque cada uno tiene su propio espacio de memoria.

**9. ¿Cuándo convienen los ULT frente a los KLT? Mencione dos atributos del TCB.**

> Convienen cuando se quiere una planificación propia, cuando se crean y alternan muchos hilos (porque es barato), cuando importa la portabilidad o cuando los hilos hacen poca E/S bloqueante. Dos atributos del TCB son el TID y el estado del hilo; también la prioridad y el contexto (PC y registros).

_Fuente: Sistemas Operativos for Dummies (págs. 39–44)._
