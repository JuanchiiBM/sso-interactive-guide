---
titulo: Sistemas operativos
parcial: 1
orden: 2
resumen: Qué es un SO, sus funciones, syscalls vs wrappers, modos de ejecución, cambio de modo y arquitecturas de kernel.
aliases:
  [
    SO,
    syscall,
    llamada al sistema,
    wrapper,
    modo kernel,
    modo usuario,
    mode switch,
    kernel,
    microkernel,
    monolítico,
  ]
---

El sistema operativo es el software que se para entre las aplicaciones y el hardware. Este tema define qué hace el SO y cómo le pide cosas un programa (las **syscalls**). También explica por qué la CPU distingue un **modo usuario** de un **modo kernel** y qué formas puede tener el kernel por dentro.

## ¿Qué es un sistema operativo?

Un **SO** es un programa, o un conjunto de programas, que administra los recursos de la computadora: hardware, software, archivos y usuarios. Además ofrece una interfaz para usarlos. También se administra a sí mismo y protege al sistema, para que un programa no haga cosas que no le corresponden.

### Funciones principales

- Administrar la ejecución de programas (procesos).
- Ofrecer una interfaz a usuarios y programadores.
- Administrar y asignar los recursos de hardware y software.
- Manejar los dispositivos de E/S y abstraerlos (ser "la interfaz" de los dispositivos).
- Gestionar archivos.
- Permitir la comunicación entre programas.
- Dar protección y seguridad.
- Administrarse a sí mismo.

### Capas

- **Kernel (núcleo)**: tiene las funciones esenciales. Gestiona el hardware, sincroniza y comunica procesos.
- **Distribución**: un kernel más paquetes de software. Por ejemplo, Ubuntu es una distribución basada en el kernel Linux.
  - **Aplicaciones**: las usa el usuario final. Nunca tocan el hardware directamente: siempre pasan por el SO.
  - **Utilidades**: herramientas del programador, como la terminal, el compilador o el debugger.

### Evolución

| Etapa                      | Idea                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monoprogramación**       | Un único programa por vez, dueño de todos los recursos. Incluye el procesamiento en serie y los lotes simples (una cola de trabajos que corren uno tras otro). |
| **Lotes multiprogramados** | Mientras un programa espera una E/S, otro usa la CPU.                                                                                                          |
| **Tiempo compartido**      | Muchos usuarios interactivos a la vez. Administrar se vuelve mucho más complejo (permisos, recursos distintos por usuario).                                    |

## Llamadas al sistema (syscalls)

Una **syscall** es una función del kernel a través de la cual un programa le pide un servicio al SO. Es **la única vía** para que una aplicación use el hardware o recursos que solo maneja el SO.

| Categoría    | Ejemplos                      |
| ------------ | ----------------------------- |
| Archivos     | `open()`, `read()`, `write()` |
| Procesos     | `fork()`, `exit()`, `kill()`  |
| Dispositivos | `release()`, `eject()`        |
| Otras        | `time()`, `sem_wait()`        |

Cada SO define sus propias syscalls, con nombres y parámetros distintos. Por eso un programa que las usa directamente no es portable.

### Wrappers

Un **wrapper** es una función de biblioteca (por ejemplo, de la biblioteca estándar de C) que envuelve una o más syscalls y presenta una interfaz estándar. Cada SO implementa esa biblioteca a su manera, y el programa que usa los wrappers compila en cualquiera de ellos.

|                              | Syscall directa                      | Wrapper                                     |
| ---------------------------- | ------------------------------------ | ------------------------------------------- |
| **Simplicidad**              | Baja: muchos parámetros específicos. | Alta: interfaz más simple.                  |
| **Flexibilidad / precisión** | Alta: se controla todo.              | Menor.                                      |
| **Portabilidad**             | Nula: depende del SO.                | Alta: alcanza con que exista la biblioteca. |

> **Ojo:** el wrapper **no** hace el cambio de modo. Es código de usuario que en algún momento invoca la syscall, y es la syscall la que pasa a modo kernel.

## Modos de ejecución

La CPU tiene "anillos de protección" (típicamente del 0 al 3). En la práctica se habla de dos:

- **Modo kernel (anillo 0)**: puede ejecutar **cualquier** instrucción, incluidas las privilegiadas. Ahí corre el SO.
- **Modo usuario (anillo 3)**: solo instrucciones no privilegiadas. Ahí corren todas las aplicaciones.

El modo actual queda indicado en un bit del **PSW**.

### ¿Qué pasa si un programa intenta una instrucción privilegiada?

No lo logra. El hardware detecta el intento y genera una interrupción (excepción), el SO toma el control y normalmente termina el proceso (el clásico _segmentation fault_ o similar). Si un programa necesita algo privilegiado, tiene que pedírselo al SO con una syscall.

## Cambio de modo (mode switch)

Es el paso de modo usuario a kernel o al revés. Reglas clave:

- Las aplicaciones siempre corren en modo usuario y el SO siempre en modo kernel.
- Entre la ejecución de una aplicación y la de otra **siempre** hay un paso por modo kernel, porque el SO es quien decide quién sigue.
- Solo dos cosas llevan a modo kernel: una **interrupción** (que se decide atender) o una **syscall**.
- Un proceso de usuario no puede cambiar de modo por su cuenta.

### Recorrido de una syscall

1. El proceso invoca la syscall. Se guarda su contexto y se pasa a modo kernel.
2. El kernel busca en la **tabla de syscalls** la rutina que corresponde y la ejecuta.
3. Si la operación es bloqueante, el proceso pasa a _Blocked_ y el planificador elige otro.
4. Cuando termina, el resultado queda disponible para el proceso (por ejemplo, en su stack), se vuelve a modo usuario y el proceso sigue cuando lo vuelvan a elegir.

## Arquitecturas de kernel

| Tipo            | Idea                                                                                                                                                          | A favor                                                                             | En contra                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Monolítico**  | Todo el SO es un único bloque en modo kernel; cualquier parte puede llamar a cualquier otra.                                                                  | Muy eficiente, casi sin overhead de comunicación.                                   | Difícil de mantener y depurar; un cambio chico puede romper todo.                                      |
| **En capas**    | El kernel se divide en capas con interfaces bien definidas; cada una usa a la de abajo.                                                                       | Más ordenado y fácil de mantener; los cambios quedan acotados.                      | Menos fluidez: una operación puede atravesar muchas capas.                                             |
| **Microkernel** | En modo kernel queda solo lo mínimo (interrupciones, E/S básica, comunicación, planificación). El resto de los servicios corre como procesos en modo usuario. | Flexible y robusto: se agregan o sacan módulos, y una falla no tira abajo al resto. | Más overhead: los módulos se comunican por mensajes a través del kernel, y eso pega en la performance. |

## Preguntas de parcial

**1. ¿Cuál es la diferencia entre una syscall y un wrapper? ¿Cuándo conviene cada uno?**

> La syscall es la puerta de entrada al kernel: es propia de cada SO, tiene muchos parámetros y da control fino, pero no es portable. El wrapper es una función de biblioteca estándar que por dentro llama a la syscall; es más simple y portable, a cambio de algo de flexibilidad. Conviene la syscall directa cuando se necesita precisión o una opción específica del SO, y el wrapper cuando se busca portabilidad y simpleza.

**2. En un sistema con modos de ejecución, ¿cuál es la forma correcta de operar sobre el hardware? ¿Cuál sería una incorrecta?**

> La correcta es pedírselo al SO con una syscall: el SO pasa a modo kernel y ejecuta la operación privilegiada. La incorrecta es que el programa intente ejecutar él mismo la instrucción privilegiada en modo usuario. El hardware no lo permite: genera una excepción y el SO interviene.

**3. Describa qué ocurre al invocar una syscall desde modo usuario.**

> Se guarda el contexto del proceso y se pasa a modo kernel. El kernel busca la rutina en la tabla de syscalls y la ejecuta; si la operación es bloqueante, el proceso queda en Blocked. Al terminar se entrega el resultado, se vuelve a modo usuario y el proceso sigue cuando el planificador lo vuelva a elegir.

**4. V o F: los wrappers permiten el cambio de modo de usuario a kernel.**

> Falso. El wrapper es código común de usuario. El cambio de modo lo produce la syscall que el wrapper invoca por dentro.

**5. V o F: nunca puede haber un cambio de contexto sin un cambio de proceso.**

> Falso. Un ejemplo: mientras se atiende una syscall llega una interrupción y se pasa a la rutina del manejador, sin cambiar de proceso. Otro: un cambio entre dos KLT del mismo proceso.

**6. V o F: si se está ejecutando una syscall y llega una interrupción, se espera a que termine la syscall porque es código del SO.**

> Falso. Las interrupciones se chequean al final de cada instrucción, sin importar si el código es del SO o de un usuario. Se atiende la interrupción y después se retoma la syscall.

**7. ¿Qué relación hay entre syscalls, modos de ejecución e instrucciones privilegiadas?**

> Solo el modo kernel puede ejecutar instrucciones privilegiadas. La syscall es el mecanismo controlado para pasar a ese modo: el proceso no ejecuta la instrucción privilegiada, se la pide al SO.

**8. V o F: una de las mayores desventajas de los microkernels es la performance.**

> Verdadero. Como la mayoría de los servicios corren como procesos de usuario, se comunican con mensajes que pasan por el kernel. Eso agrega cambios de modo y overhead que un kernel monolítico no tiene.

_Fuente: Sistemas Operativos for Dummies (págs. 9–14 y 45–47)._
