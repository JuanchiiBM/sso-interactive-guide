---
titulo: Concurrencia y sincronización
parcial: 1
orden: 6
resumen: Condición de carrera, sección crítica, Bernstein, soluciones de software y hardware, semáforos, monitores y productor-consumidor.
aliases:
  [
    sincronización,
    concurrencia,
    semáforos,
    mutex,
    wait,
    signal,
    sección crítica,
    condición de carrera,
    productor consumidor,
    test and set,
    Peterson,
  ]
---

Cuando varios procesos o hilos comparten datos, el resultado puede depender del orden en que se intercalan sus instrucciones. Este tema explica ese problema (la **condición de carrera**), qué tiene que cumplir una solución y cómo resolverlo, primero con trucos de software y hardware y después con **semáforos**, la herramienta que se usa en todos los ejercicios del parcial.

## Formas de concurrencia

- **Multiprogramación**: varios procesos en memoria que se turnan una CPU.
- **Multiprocesamiento**: varios procesos ejecutando a la vez en varias CPU.
- **Procesamiento distribuido**: procesos repartidos en varias computadoras.

La concurrencia se usa para **aprovechar la CPU** (mientras uno espera una E/S, otro ejecuta) y porque muchas aplicaciones se **diseñan** naturalmente como un conjunto de actividades concurrentes.

### Cómo interactúan los procesos

| Tipo de interacción                             | ¿Se conocen?                    | ¿Quién administra los recursos? |
| ----------------------------------------------- | ------------------------------- | ------------------------------- |
| **Competencia**                                 | No saben que existen los otros. | El SO                           |
| **Cooperación indirecta** (por compartir datos) | Saben que existen otros.        | Los procesos o hilos            |
| **Cooperación directa** (por comunicación)      | Saben cuáles son.               | Los procesos o hilos            |

## Condición de carrera y sección crítica

Hay **condición de carrera** cuando dos o más procesos acceden a datos compartidos, al menos uno escribe, y el resultado final **depende del orden de ejecución**, que es impredecible. La parte del código donde se accede a esos datos es la **sección crítica (SC)**.

Ejemplo clásico con `a = 0` global:

```c
// Proceso 1          // Proceso 2
c = a;                b = a;
c = c + 1;            b = b - 1;
a = c;                a = b;
```

Ejecutados uno después del otro, el resultado es `a = 0`. Si una interrupción los intercala, `a` puede terminar en `1` o en `-1`. El problema es que `a++` "parece" atómico, pero son varias instrucciones de máquina.

> Solo hay que sincronizar si al menos uno **escribe**. Dos procesos que únicamente leen el mismo dato no generan condición de carrera.

### Requisitos de una buena solución

| Requisito              | Significa que…                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mutua exclusión**    | Nunca hay dos procesos a la vez dentro de la SC del mismo recurso.                                                                                  |
| **Progreso**           | Si la SC está libre y alguien quiere entrar, puede hacerlo. Un proceso que está fuera de la SC no puede impedirlo, y quien sale tiene que "avisar". |
| **Espera limitada**    | Ningún proceso espera para siempre para entrar.                                                                                                     |
| **Velocidad relativa** | La solución no puede suponer nada sobre cuánto tarda cada proceso, porque en cualquier momento puede llegar una interrupción.                       |

Además, la SC tiene que ser **lo más chica posible** y durar un tiempo finito. Un proceso puede tener varias SC.

### Condiciones de Bernstein

Sirven para saber si dos procesos A y B **pueden** ejecutar concurrentemente sin riesgo. Si se cumplen las tres, no hay condición de carrera:

- `R(A) ∩ W(B) = ∅`: lo que lee A no lo escribe B.
- `W(A) ∩ R(B) = ∅`: lo que escribe A no lo lee B.
- `W(A) ∩ W(B) = ∅`: no escriben las mismas variables.

`R(X)` es el conjunto de lectura de X y `W(X)` su conjunto de escritura. Si falla cualquiera de las tres, **hay una sección crítica** que proteger.

## Tipos de soluciones

1. **De software**: el programador usa variables y bucles.
2. **De hardware**: usan instrucciones especiales del procesador.
3. **Del SO**: los **semáforos**.
4. **De los lenguajes**: los **monitores**.

## Soluciones de software

Todas tienen **espera activa (busy waiting)**: el proceso da vueltas en un `while` consultando una condición y gasta CPU sin hacer trabajo útil.

| Intento                                     | Idea                                                                                              | ¿Qué falla?                                                                                                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Variable `turno`**                     | Entra solo aquel cuyo número coincide con `turno`; al salir, le pasa el turno al otro.            | Hay mutua exclusión, pero se fuerza la **alternancia estricta** y **no hay progreso**: si al otro no le interesa entrar, igual hay que esperarlo. Sirve solo para 2 procesos.                                  |
| **2. Flags "estoy adentro"**                | Antes de entrar se mira si el flag del otro está en false, y recién después se levanta el propio. | **No hay mutua exclusión**: si hay un cambio de contexto entre mirar y levantar el flag, entran los dos.                                                                                                       |
| **3. Primero me declaro interesado**        | Se levanta el propio flag y después se espera a que el otro baje el suyo.                         | Hay mutua exclusión, pero si los dos levantan el flag a la vez, esperan para siempre: **deadlock**.                                                                                                            |
| **4. Declararse, y ceder si hay conflicto** | Si el otro también está interesado, se baja el flag, se espera un rato y se reintenta.            | Sin deadlock, pero puede haber **livelock**: los dos ceden y reintentan sincronizados, cambian de estado todo el tiempo y ninguno avanza. Es como dos personas que se corren para el mismo lado en un pasillo. |

Las soluciones de software que **sí funcionan** son el **algoritmo de Dekker** y el **algoritmo de Peterson**. Combinan los flags de interés con una variable de turno que desempata. Peterson cumple mutua exclusión, progreso y espera limitada, pero sigue teniendo espera activa.

```c
// Peterson para dos procesos (i = yo, j = el otro)
interesado[i] = true;
turno = j;
while (interesado[j] && turno == j);  // espera activa
/* sección crítica */
interesado[i] = false;
```

## Soluciones de hardware

### Deshabilitar interrupciones

`deshabilitar interrupciones → SC → habilitar interrupciones`. Sin interrupciones no hay cambio de contexto, así que nadie se mete en el medio.

- **Problemas**: es una instrucción **privilegiada**, así que no está disponible para procesos de usuario (solo para el SO). Si el proceso falla dentro de la SC, las interrupciones quedan apagadas. Degrada el sistema y **no sirve en multiprocesadores**, porque solo afecta a una CPU.

### Test-and-set (instrucción atómica)

El hardware ofrece una instrucción que **lee y escribe una variable en un solo paso indivisible**:

```c
bool test_and_set(bool *lock) {   // atómica
    bool anterior = *lock;
    *lock = true;
    return anterior;
}

while (test_and_set(&lock));  // espera activa hasta obtener el lock
/* sección crítica */
lock = false;
```

- Garantiza mutua exclusión, **también con varios procesadores**, y no fuerza la alternancia.
- Sigue teniendo **espera activa**.
- La puede usar un proceso de usuario, porque no es una instrucción privilegiada.

## Semáforos

Un **semáforo** es una estructura del SO con un **contador entero** y una **cola de procesos bloqueados**. Se usa con dos syscalls atómicas:

```c
struct semaforo {
    int valor;
    cola_t bloqueados;
};

wait(s) {               // también llamado P() o down()
    s.valor--;
    if (s.valor < 0) bloquear(proceso_actual, s.bloqueados);
}

signal(s) {             // también llamado V() o up()
    s.valor++;
    if (s.valor <= 0) desbloquear(uno_de(s.bloqueados));
}
```

- `wait` **puede bloquear**; `signal` **nunca bloquea**.
- Como el proceso bloqueado duerme en una cola en lugar de dar vueltas, **no hay espera activa** (a nivel del usuario).
- La cola de bloqueados se atiende en **FIFO** por convención. Es lo más justo y es lo que se asume en los ejercicios.

### Qué significa el valor

| Valor | Interpretación                                                     |
| ----- | ------------------------------------------------------------------ |
| `> 0` | Instancias disponibles del recurso.                                |
| `= 0` | No hay instancias disponibles y nadie espera.                      |
| `< 0` | Su valor absoluto es la cantidad de procesos bloqueados esperando. |

**Nunca se inicializa en un valor negativo.**

### Tipos de semáforos

| Tipo                            | Valor inicial          | Uso                                                                                                               |
| ------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Mutex**                       | `1`                    | Mutua exclusión sobre una sección crítica. Se hace `wait` al entrar y `signal` al salir, **en el mismo proceso**. |
| **Binario** (de sincronización) | `0` o `1`              | Ordenar la ejecución: un proceso espera a que otro le "avise".                                                    |
| **Contador** (general)          | `N` (instancias) o `0` | Limitar el acceso a N instancias de un recurso, o contar elementos disponibles.                                   |

### Tres usos típicos

**Mutua exclusión:**

```c
wait(mutex);        // mutex = 1
contador++;
signal(mutex);
```

**Orden de ejecución** (A antes que B):

```c
// semáforo s = 0
// Proceso A          // Proceso B
tarea_A();            wait(s);
signal(s);            tarea_B();
```

**Limitar instancias** (por ejemplo, 3 impresoras):

```c
// impresoras = 3
wait(impresoras);
usar_impresora();
signal(impresoras);
```

### ¿Wait y signal pueden ser interrumpidos?

Tienen que ser **atómicos**: si no lo fueran, el propio contador del semáforo tendría una condición de carrera. Para eso el SO los implementa con alguna de las técnicas anteriores: deshabilitar interrupciones (puede hacerlo porque corre en modo kernel, aunque solo sirve en monoprocesador) o test-and-set. No es obligatorio deshabilitar interrupciones.

En cualquier caso, la espera activa que pueda quedar se limita a las pocas instrucciones de `wait` y `signal`, no a toda la sección crítica.

## Reglas de oro para los ejercicios

Las da la guía de ejercicios de la cátedra:

- **Cada requerimiento suele ser un semáforo.**
- **Nunca** inicializar un semáforo con un valor negativo.
- Un **mutex por cada recurso compartido**.
- Los semáforos que sincronizan tareas suelen **empezar en 0**.
- **El orden de los `wait` importa; el de los `signal`, no.**
- Para poner un **tope de M instancias**: un `wait` **justo antes** de depositar una nueva instancia; el semáforo empieza en **M**.
- Para **contar instancias** en una colección: un `signal` después de depositar y un `wait` antes de consumir; el semáforo empieza en **0**.
- La cantidad de `wait` y `signal` de un **mutex** tiene que ser la misma.
- Si los recursos tienen un **id**, suele servir un **array de semáforos** (uno por recurso).
- Salvo que el enunciado diga otra cosa, **solo se pueden usar `wait` y `signal`**, y **todos los semáforos tienen que estar inicializados**.

## Productor-consumidor

Es el problema clásico. Uno o más productores dejan elementos en un buffer compartido y uno o más consumidores los sacan. Hacen falta tres semáforos:

| Semáforo       | Tipo     | Inicial                 | Para qué                                                    |
| -------------- | -------- | ----------------------- | ----------------------------------------------------------- |
| `mutex_buffer` | Mutex    | `1`                     | Que nadie más toque el buffer mientras se agrega o se saca. |
| `lugares`      | Contador | `N` (tamaño del buffer) | Que el productor no agregue si está lleno.                  |
| `elementos`    | Contador | `0`                     | Que el consumidor no saque si está vacío.                   |

```c
// Productor                     // Consumidor
while (TRUE) {                   while (TRUE) {
    x = producir();                  wait(elementos);
    wait(lugares);                   wait(mutex_buffer);
    wait(mutex_buffer);              x = sacar(buffer);
    agregar(buffer, x);              signal(mutex_buffer);
    signal(mutex_buffer);            signal(lugares);
    signal(elementos);               consumir(x);
}                                }
```

- Si el buffer es **infinito**, sobra `lugares`: siempre hay lugar.
- **Orden de los `wait`**: primero el contador y después el mutex. Si se invierte (`wait(mutex)` y después `wait(elementos)` con el buffer vacío), el consumidor se duerme con el mutex tomado, el productor nunca puede entrar y hay **deadlock**.
- `producir()` y `consumir()` quedan **fuera** de la sección crítica, para que sea lo más chica posible.

## Monitores

Un **monitor** es una construcción del lenguaje, parecida a una clase, que encapsula datos compartidos y los procedimientos que los usan. Garantiza que **solo un proceso a la vez ejecute dentro del monitor**; el resto espera en una cola de entrada. A los datos solo se accede mediante los procedimientos del monitor. Dan mutua exclusión automática y además permiten sincronizar, con variables de condición.

## Preguntas de parcial

**1. ¿Qué es una sección crítica y qué condiciones debe cumplir una solución? Dé un ejemplo de solución de hardware dentro de `wait` y `signal`.**

> Es la porción de código donde se accede a un recurso compartido que puede provocar una condición de carrera. Una solución debe cumplir mutua exclusión, progreso y espera limitada, sin suponer nada sobre la velocidad relativa de los procesos. Ejemplo: el SO puede implementar `wait` y `signal` deshabilitando interrupciones al principio y habilitándolas al final. Así la actualización del contador y el bloqueo o desbloqueo se hacen sin interrupciones.

**2. ¿Qué tipos de semáforos hay?**

> Contador o general (se inicializa en N y controla N instancias o cuenta elementos), binario (0 o 1, se usa para ordenar la ejecución) y mutex (un binario que arranca en 1 para mutua exclusión).

**3. En productor-consumidor con buffer infinito, ¿qué semáforos hacen falta?**

> Un mutex para el buffer y un contador de elementos inicializado en 0, para que el consumidor no saque de un buffer vacío. No hace falta el semáforo de lugares libres, porque el productor nunca se queda sin espacio.

**4. V o F: aun bien usados, los semáforos pueden causar problemas con planificadores por prioridad.**

> Verdadero. Un proceso de alta prioridad puede quedar bloqueado en un `wait` esperando un `signal` que tiene que hacer uno de baja prioridad, que casi nunca obtiene la CPU. Es la **inversión de prioridades**.

**5. ¿Qué problema resuelve un mutex? ¿Hay otra forma? ¿Qué indica un valor negativo?**

> Resuelve la mutua exclusión y con eso evita la condición de carrera. Otras formas son las soluciones de software (Peterson, Dekker) o de hardware (test-and-set, deshabilitar interrupciones). Un valor negativo indica cuántos procesos están bloqueados esperando entrar.

**6. ¿Qué ventajas tienen los semáforos frente a las soluciones de software?**

> Los procesos que esperan quedan bloqueados en la cola del semáforo en lugar de consumir CPU (no hay espera activa). Además funcionan para N procesos sin reescribir el algoritmo, y es el SO quien garantiza la atomicidad.

**7. ¿Qué problema resuelve la mutua exclusión? Ejemplifique y sincronice.**

> Resuelve la condición de carrera. En el ejemplo de `a = 0` con un proceso que incrementa y otro que decrementa, el resultado puede ser 1 o -1 en lugar de 0. Se soluciona encerrando cada bloque entre `wait(mutex)` y `signal(mutex)`, con `mutex = 1`. También se podría deshabilitar interrupciones, pero eso solo lo puede hacer el SO.

**8. ¿Es eficiente buscar un bug de condición de carrera con el debugger?**

> No. La condición de carrera depende de cómo se intercalan los procesos, y el debugger cambia justamente eso: frena la ejecución. El error puede no aparecer nunca mientras se depura.

**9. V o F: si `wait` y `signal` no fueran atómicos, podría haber condición de carrera.**

> Verdadero. Los dos leen y modifican el contador del semáforo, que es un dato compartido. No cumplen las condiciones de Bernstein, así que dos llamadas intercaladas pueden dejar el contador en un valor incorrecto.

**10. V o F: usar semáforos y deshabilitar o habilitar interrupciones son técnicas que los procesos de usuario pueden usar para lograr mutua exclusión sin espera activa.**

> Falso. El resumen lo marca como verdadero, pero con duda. Los semáforos sí están disponibles para el usuario (vía syscalls) y evitan la espera activa. Deshabilitar interrupciones, en cambio, es una instrucción privilegiada: un proceso de usuario no puede usarla.

**11. ¿Por qué los semáforos son una buena solución al problema de la sección crítica? ¿Cómo se garantiza la atomicidad de `wait` y `signal`?**

> Porque, bien usados, garantizan mutua exclusión, progreso y espera limitada (con la cola FIFO) sin espera activa del usuario. La atomicidad la garantiza el SO dentro de `wait` y `signal`. Puede deshabilitar interrupciones (en monoprocesador) o usar instrucciones atómicas como test-and-set (en multiprocesador).

**12. Resuelva productor-consumidor con un buffer de 5 posiciones.**

> Se usan `lugares = 5` (contador), `mutex_buffer = 1` (mutex) y `elementos = 0` (contador). El productor hace `wait(lugares)`, `wait(mutex_buffer)`, agrega, `signal(mutex_buffer)` y `signal(elementos)`. El consumidor hace `wait(elementos)`, `wait(mutex_buffer)`, saca, `signal(mutex_buffer)` y `signal(lugares)`. Es el código de la sección de productor-consumidor con N = 5.

**13. ¿Qué implica que un semáforo tenga espera activa? Ventajas y desventajas.**

> Que, en lugar de bloquear al proceso, `wait` lo deja en un bucle consultando el valor (por ejemplo, implementado con test-and-set). La ventaja es que funciona: da mutua exclusión y progreso, y para esperas muy cortas se evita el costo de bloquear y desbloquear. La desventaja es que desperdicia CPU mientras espera.

_Fuente: Sistemas Operativos for Dummies (págs. 48–62) y Guía de Ejercicios de Sincronización v.2C2026._
