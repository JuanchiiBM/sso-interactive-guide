---
titulo: Deadlock
parcial: 1
orden: 7
resumen: Interbloqueo, grafo de asignación, condiciones de Coffman, prevención, evasión (banquero), detección y recuperación, y livelock.
aliases:
  [
    interbloqueo,
    abrazo mortal,
    banquero,
    Coffman,
    espera circular,
    livelock,
    inanición,
    grafo de asignación de recursos,
  ]
---

Un **deadlock** (interbloqueo) aparece cuando un grupo de procesos queda trabado para siempre: cada uno espera algo que solo puede darle otro proceso del mismo grupo, que también está esperando. Suele ser consecuencia de una mala sincronización o de un mal manejo de los recursos compartidos. En este tema se ve cuándo puede ocurrir, cómo reconocerlo en un grafo y cuáles son las cuatro estrategias para enfrentarlo, con el **algoritmo del banquero** y el **algoritmo de detección** en detalle.

## Definición y recursos

**Deadlock**: bloqueo **permanente** de un conjunto de procesos, en el que cada uno espera un evento que solo puede provocar otro proceso del conjunto.

Los recursos se **piden, se usan y se liberan**. Si no están disponibles, el proceso se bloquea. Se distinguen dos tipos:

- **Reutilizables**: después de usarse se liberan y otro los puede usar (CPU, memoria, archivos, semáforos, dispositivos). Son los que aparecen en los problemas típicos de deadlock.
- **Consumibles**: se producen y se consumen una sola vez (mensajes, señales, interrupciones).

### No confundir

| Situación                  | ¿Qué pasa?                                                                                              | ¿Consume CPU? |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ------------- |
| **Deadlock**               | Los procesos quedan **bloqueados** esperándose entre sí y nada cambia.                                  | No            |
| **Livelock**               | Los procesos **cambian de estado todo el tiempo** en respuesta a los otros, pero ninguno progresa.      | Sí            |
| **Inanición (starvation)** | A un proceso se le niega un recurso indefinidamente mientras **los demás sí avanzan**.                  | Los demás, sí |
| **Espera activa**          | Un proceso espera dentro de un bucle consultando una condición. Es una forma de esperar, no un bloqueo. | Sí            |

## Grafo de asignación de recursos

Representa el estado de asignación de los recursos en un instante:

- **Círculos** = procesos. **Rectángulos** = recursos, con un punto por cada instancia.
- **Proceso → recurso**: el proceso **solicita** ese recurso.
- **Recurso → proceso**: una instancia está **asignada** a ese proceso.

Ejemplo con dos recursos de una sola instancia cada uno y un ciclo: P1 tiene R1 y pide R2, y P2 tiene R2 y pide R1.

```grafo
procesos: P1, P2
recursos: R1, R2
R1 -> P1
P1 -> R2
R2 -> P2
P2 -> R1
resaltar-ciclo
```

**Cómo leer el grafo:**

- **Sin ciclos**: no hay deadlock.
- **Con un ciclo y todos los recursos del ciclo con una sola instancia**: **hay** deadlock.
- **Con un ciclo y recursos con varias instancias**: **puede o no** haber deadlock. Para saberlo hay que correr el algoritmo de detección.

El grafo muestra la situación, pero para **justificar** un deadlock en el parcial hace falta un algoritmo. El mismo estado se puede escribir como matrices de asignación y de peticiones.

## Condiciones para que exista deadlock (Coffman)

| #   | Condición              | Significado                                                                            | Tipo                                 |
| --- | ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| 1   | **Mutua exclusión**    | Un recurso solo lo puede usar un proceso a la vez.                                     | Necesaria                            |
| 2   | **Retención y espera** | Un proceso conserva los recursos que tiene mientras espera otros.                      | Necesaria                            |
| 3   | **Sin desalojo**       | No se le puede quitar un recurso a un proceso; lo tiene que soltar él.                 | Necesaria                            |
| 4   | **Espera circular**    | Hay una cadena cerrada de procesos en la que cada uno espera un recurso del siguiente. | Junto con las otras tres, suficiente |

Las tres primeras son **necesarias** pero no alcanzan. Con las **cuatro**, se produce el deadlock. Si falta cualquiera, no puede haberlo.

## Las cuatro estrategias

| Estrategia                   | ¿Puede ocurrir deadlock? | Idea                                                                                   |
| ---------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| **Prevención**               | No                       | Diseñar el sistema para que **nunca** se cumpla alguna de las 4 condiciones.           |
| **Evasión (predicción)**     | No                       | Analizar cada solicitud y conceder solo las que dejan al sistema en **estado seguro**. |
| **Detección y recuperación** | Sí                       | Dejar que pase, detectarlo periódicamente y recuperarse.                               |
| **No hacer nada**            | Sí                       | Ignorar el problema. Es lo que hacen la mayoría de los SO de uso general.              |

### 1. Prevención

Se ataca una de las condiciones:

- **Mutua exclusión**: en general **no se puede evitar**, porque hay recursos que por naturaleza no se comparten (una impresora, una escritura).
- **Retención y espera**: el proceso pide **todos** sus recursos juntos, y si falta alguno no se le da ninguno. Tiene un costo: recursos tomados mucho tiempo sin usarse, poca eficiencia y posible **inanición** de quien necesita muchos recursos.
- **Sin desalojo → permitir el desalojo**: si un proceso que tiene recursos pide otro y queda bloqueado, se le pueden quitar los que tiene para dárselos a otro. Solo sirve para recursos cuyo estado se puede guardar y restaurar.
- **Espera circular**: se **numeran los recursos** y se exige pedirlos siempre en **orden creciente**. Así no se puede cerrar un ciclo.

### 2. Evasión (predicción)

Cada proceso declara de antemano la **cantidad máxima** de cada recurso que va a necesitar. Hay dos técnicas:

- **Negar el inicio** de un proceso si sus necesidades, sumadas a las de los que ya están corriendo, podrían superar lo que existe.
- **Negar una asignación** con el **algoritmo del banquero**: antes de conceder una solicitud se **simula** y se verifica que el sistema quede en **estado seguro**.

**Estado seguro**: existe al menos una **secuencia segura**, es decir, un orden en el que todos los procesos pueden terminar con los recursos disponibles más los que van liberando los que terminan. **Estado inseguro** no significa que haya deadlock, sino que **podría** haberlo. El banquero no lo permite.

#### Estructuras

- **Recursos totales** (vector `T`).
- **Asignados** (matriz `A`): qué tiene cada proceso.
- **Necesidad máxima** (matriz `Max`).
- **Necesidad pendiente**: `Pend = Max − A`.
- **Disponibles**: `D = T − (suma de columnas de A)`.

#### ¿El estado es seguro?

1. Calcular `Pend = Max − A` y el vector `D`.
2. Buscar un proceso no terminado cuyo `Pend ≤ D` (componente a componente).
3. "Terminarlo": `D = D + A[proceso]`. Anotarlo en la secuencia.
4. Repetir desde el paso 2.
5. Si todos pudieron terminar, el estado es **seguro** y la secuencia encontrada es una secuencia segura. Si en algún momento ninguno puede avanzar, es **inseguro**.

#### ¿Se puede conceder una solicitud? (por ejemplo, "P2 pide 2 instancias de R2")

1. Verificar que `Solicitud ≤ Pend[P2]`. Si pide más de lo que declaró, es un error.
2. Verificar que `Solicitud ≤ D`. Si no hay disponibles, P2 espera.
3. **Simular**: `D = D − Sol`, `A[P2] = A[P2] + Sol`, `Pend[P2] = Pend[P2] − Sol`.
4. Correr el chequeo de estado seguro sobre el estado simulado. Si es seguro, se concede. Si es inseguro, **no se concede**: se deshace la simulación y P2 espera. **No se desaloja nada.**

### 3. Detección y recuperación

No se restringe la asignación: si el recurso está libre, se da. Cada cierto tiempo se corre el **algoritmo de detección**, que usa las **peticiones actuales**. No necesita las necesidades máximas.

#### Algoritmo de detección

1. Si no dan `D`, calcular `D = T − (suma de A)`.
2. Descartar los procesos que **no tienen nada asignado**: no pueden ser parte de un deadlock.
3. Buscar un proceso cuyas **peticiones pendientes** sean `≤ D`. Si no pide nada, también califica.
4. Suponer que termina y libera todo: `D = D + A[proceso]`.
5. Repetir desde el paso 3 hasta que ningún proceso pueda avanzar.
6. **Los procesos que quedan sin marcar están en deadlock.**

#### Recuperación

Opciones, de la más drástica a la más fina:

- Terminar a **todos** los procesos involucrados.
- **Retroceder** los procesos a un punto de control (checkpoint) anterior. Es complejo.
- Terminar procesos **de a uno** hasta que se rompa el deadlock, volviendo a correr la detección después de cada uno.
- **Expropiar recursos** de a uno hasta que se rompa el deadlock.

Para elegir a la **víctima** se usan criterios como estos:

- menos tiempo de CPU consumido;
- menos salida producida;
- mayor tiempo restante estimado;
- menos recursos asignados;
- menor prioridad.

Si siempre se elige a la misma víctima, se le provoca **inanición**.

### 4. No hacer nada

Se asume que el deadlock es raro y que el costo de prevenirlo, evitarlo o detectarlo no vale la pena. Si pasa, lo resuelve el usuario o el administrador (reiniciando o matando procesos).

### Comparación rápida

|                             | Prevención                                         | Evasión                                      | Detección                       |
| --------------------------- | -------------------------------------------------- | -------------------------------------------- | ------------------------------- |
| **¿Hay deadlock?**          | Nunca                                              | Nunca                                        | Puede ocurrir                   |
| **Cuándo actúa**            | En el diseño o en cada solicitud, por reglas fijas | En **cada** solicitud (simulación)           | Periódicamente                  |
| **Overhead**                | Bajo o medio, según la regla                       | Muy alto                                     | Bajo, más el costo de recuperar |
| **Flexibilidad al asignar** | Baja                                               | Baja: rechaza lo que deja un estado inseguro | Alta: no controla nada          |
| **Información previa**      | No                                                 | Sí, las necesidades máximas                  | No                              |

## Preguntas de parcial

**1. ¿Qué diferencia hay entre prevención y detección? ¿Cuándo conviene cada una?**

> La prevención garantiza que el deadlock nunca ocurra, porque impide por diseño alguna de las condiciones. Conviene en sistemas críticos donde un deadlock es inaceptable (control de vuelo, equipos médicos). La detección deja que ocurra y después lo resuelve, con menos restricciones y overhead mientras todo anda bien. Conviene donde un deadlock ocasional se tolera, como una PC de uso general.

**2. V o F: matar a todos los procesos involucrados en un deadlock suele ser una buena solución.**

> Falso. Funciona, pero se pierde el trabajo de todos. Suele ser mejor terminar o expropiar de a un proceso, eligiendo la víctima con algún criterio, hasta que se rompa el ciclo.

**3. V o F: con evasión, si todos los procesos piden su máximo a la vez podría haber deadlock.**

> Falso. El banquero justamente considera ese peor caso: solo concede lo que deja un estado seguro, en el que existe un orden para que todos terminen aun pidiendo su máximo.

**4. ¿Cuáles son las condiciones necesarias y suficientes para el deadlock?**

> Las necesarias son mutua exclusión, retención y espera, y sin desalojo. Sumándoles la espera circular, las cuatro juntas son suficientes.

**5. V o F: tanto la prevención como la detección y recuperación pueden provocar inanición.**

> Verdadero. En prevención, por ejemplo al exigir que se pidan todos los recursos juntos: un proceso que necesita muchos puede no conseguirlos nunca a la vez. En recuperación, si siempre se elige como víctima al mismo proceso.

**6. ¿Cómo se previene atacando la retención y espera, y la falta de desalojo?**

> Retención y espera: cada proceso pide todos sus recursos de una sola vez, y se le dan todos o ninguno. Sin desalojo: si un proceso que tiene recursos queda esperando otro, se le pueden quitar los que tiene para asignárselos a quien los necesita.

**7. V o F: no puede haber deadlock en un SO que ejecuta procesos sin concurrencia.**

> Verdadero. Si los procesos ejecutan uno por vez y de principio a fin, cada uno libera todo al terminar y nunca hay dos procesos reteniendo y esperando recursos al mismo tiempo. No se puede formar espera circular. La excepción serían los hilos dentro de un mismo proceso.

**8. ¿Qué diferencia hay entre evasión y prevención?**

> Las dos garantizan que no haya deadlock. La prevención impone reglas fijas que anulan alguna condición, sin mirar el estado del sistema. La evasión permite que se cumplan las cuatro condiciones, pero analiza cada solicitud y solo la concede si el sistema queda en estado seguro. Eso requiere conocer las necesidades máximas y tiene más overhead.

**9. V o F: con semáforos con espera activa puede haber deadlock sin que se cumplan las cuatro condiciones.**

> Falso. Sin las cuatro condiciones no hay deadlock, sin importar cómo se implemente la espera. Con espera activa, lo que cambia es que los procesos trabados consumen CPU mientras esperan.

**10. V o F: si el procesador es poco potente, hay muchos recursos y hay que garantizar que no ocurra deadlock, conviene la evasión.**

> Falso. La evasión corre el banquero en cada solicitud, con matrices que crecen con la cantidad de procesos y recursos, y eso es mucho overhead para un procesador débil. Conviene la **prevención**, que también garantiza la ausencia de deadlock con reglas simples como el orden de recursos.

**11. Compare evasión y detección.**

> La evasión se ejecuta en **cada solicitud**, tiene overhead muy alto y poca flexibilidad, porque rechaza pedidos que dejarían un estado inseguro. Como nunca hay deadlock, sirve para sistemas críticos. La detección se ejecuta periódicamente, tiene overhead bajo y asigna con total libertad. A cambio, el deadlock ocurre, y recuperarse (matando o expropiando) puede costar mucho.

**12. V o F: con el banquero, si se detecta un deadlock se pueden desalojar recursos.**

> Falso. El banquero no detecta deadlocks, porque nunca los deja ocurrir. Si una solicitud lleva a un estado inseguro, simplemente no se concede y el proceso espera. No se desaloja nada.

**13. ¿Qué es un estado seguro en el algoritmo del banquero?**

> Es un estado para el que existe al menos una secuencia en la que todos los procesos pueden terminar, cada uno con lo disponible más lo que liberan los anteriores. Si el banquero está bien implementado, el sistema nunca pasa a un estado inseguro, porque rechaza las solicitudes que lo llevarían ahí.

**14. V o F: los ULT de un mismo proceso pueden quedar en deadlock usando semáforos.**

> El resumen la da como **Falsa**: si un ULT se bloquea en un `wait`, el SO bloquea todo el proceso, así que no llegan a "retenerse y esperarse" entre ellos como entidades independientes. Ojo: el proceso igual queda trabado para siempre si el `signal` lo tenía que hacer otro ULT del mismo proceso. Conviene aclarar el razonamiento si aparece.

**15. ¿Cómo diferenciaría un deadlock de un livelock mirando el sistema?**

> En un deadlock los procesos están **bloqueados** y no consumen CPU. En un livelock están **ejecutando**, cambiando de estado sin progresar, y consumen CPU. Es la pista del ejercicio 9 de la guía: un livelock afecta a otros procesos que compiten por la CPU, aunque usen recursos distintos. Un deadlock, en cambio, no los afecta.

_Fuente: Resumen SO (págs. 63–70) y Guía de Ejercicios de Deadlock v.2C2026._
