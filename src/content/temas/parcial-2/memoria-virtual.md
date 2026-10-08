---
titulo: Memoria virtual
parcial: 2
orden: 2
resumen: Page fault y su atención, bits de la tabla de páginas, localidad, tablas multinivel e invertidas, TLB, políticas del SO, algoritmos de reemplazo, thrashing y copy-on-write.
aliases:
  [
    memoria virtual,
    page fault,
    fallo de página,
    PF,
    swap,
    área de swap,
    bit de presencia,
    bit de modificado,
    bit de uso,
    localidad,
    TLB,
    tabla invertida,
    paginación jerárquica,
    reemplazo de páginas,
    LRU,
    clock,
    clock mejorado,
    Belady,
    thrashing,
    sobrepaginación,
    working set,
    copy-on-write,
  ]
---

En [memoria real](/teoria/parcial-2/memoria-real/) el proceso tiene que estar **entero** en RAM. Pero mientras ejecuta casi nunca usa todas sus partes a la vez: hay código de errores que no corre, estructuras que no se llenan. La memoria virtual aprovecha eso: en la RAM quedan solo las páginas que se están usando y el resto espera en disco.

## Qué es

La **memoria virtual** es un espacio de almacenamiento secundario (el disco) que se puede direccionar **como si fuera memoria**. Es el **área de swap**: en Windows, un archivo de paginación (_pagefile_) que el FS maneja como cualquier otro; en Linux, una **partición de tipo swap**, de tamaño fijo.

Para que exista hacen falta dos cosas que ya aparecieron en memoria real:

- **Traducción de direcciones en tiempo de ejecución**, que es la que permite que una página cambie de lugar.
- **El proceso dividido en partes** no necesariamente contiguas: páginas o segmentos. Todos los ejemplos son con paginación, pero se puede hacer con segmentación.

| Ventaja                            | Por qué                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------ |
| Procesos más grandes que la RAM    | Solo tiene que estar en RAM lo que se usa.                               |
| Más grado de multiprogramación     | Cada proceso ocupa menos marcos, así que entran más.                     |
| Menos restricciones al programador | Se programa contra el espacio virtual, que alcanza para todo el proceso. |

Las direcciones lógicas pasan a referirse al **espacio virtual** (son más largas) y las físicas a la memoria real. La MMU sigue traduciendo, ahora con un dato más: si la página está o no en RAM.

## La tabla de páginas en memoria virtual

Cada entrada de la tabla gana bits. No todos los esquemas usan todos, pero estos son los que aparecen en la materia:

| Campo                      | Para qué sirve                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **Número de marco**        | Dónde está la página. Con P = 0 el valor no significa nada: es lo que quedó de antes.       |
| **Bit de presencia (P)**   | 1 si la página está en RAM. Si es 0 y se la referencia, hay **page fault**.                 |
| **Bit de modificado (M)**  | 1 si se escribió desde que se cargó: antes de sacarla hay que actualizar su copia en disco. |
| **Bit de uso (U)**         | Se pone en 1 cada vez que se la referencia. Lo usan clock y clock mejorado.                 |
| **Instante de referencia** | Cuándo se usó por última vez. Lo necesita LRU.                                              |
| **Bit de bloqueo**         | La página no se puede reemplazar (se usa, por ejemplo, para marcos del SO).                 |
| **Protección**             | Permisos R/W/X.                                                                             |

### Los tres casos de una referencia

```recorrido casos-tabla-paginas

```

| Caso                          | Accesos a disco                         |
| ----------------------------- | --------------------------------------- |
| La página está (P = 1)        | 0 (2 accesos a memoria)                 |
| Page fault con un marco libre | 1: leer la página                       |
| Page fault, víctima con M = 0 | 1: leer la página                       |
| Page fault, víctima con M = 1 | 2: escribir la víctima y leer la página |

## Atención de un page fault

El **page fault** (fallo de página) es una excepción que lanza la MMU cuando se referencia una página con el bit de presencia en 0. Es una excepción de tipo **fallo**: se corrige y la instrucción se vuelve a ejecutar (ver [Repaso de arquitectura](/teoria/parcial-1/arquitectura/)).

```recorrido page-fault

```

1. **Se referencia memoria** y la tabla de páginas dice P = 0.
2. **Interrupción por fallo de página:** se bloquea el proceso y, mientras tanto, otro puede usar la CPU.
3. **Se solicita la página:** el SO elige el marco (si no hay libre, corre el algoritmo de reemplazo) y pide la página al disco.
4. **Se carga** en el marco y el disco produce una **interrupción** para que el SO retome el control.
5. **El SO atiende la interrupción:** actualiza la tabla de páginas y pasa el proceso a **Listo**.
6. **Se reejecuta** la instrucción que provocó el fallo.

## Eficiencia y localidad

La memoria virtual por sí sola **empeora** el rendimiento: más accesos a memoria, más accesos a disco, y un proceso que se bloquea en cada page fault. Lo que la hace viable es el **principio de localidad**: durante un intervalo de tiempo, un proceso usa activamente solo un conjunto chico de páginas (su "localidad"), y ese conjunto cambia despacio. Si esas páginas están en RAM, casi no hay fallos.

Ejemplo de la cátedra: en un juego de 10 niveles, mientras se juega el nivel 2 solo se usan sus páginas; los fallos aparecen todos juntos al pasar al nivel 3.

> **Complemento (Stallings):** la localidad puede ser **temporal** (lo que se acaba de usar se va a volver a usar pronto, como las variables de un bucle) o **espacial** (se va a usar lo que está cerca, como el elemento siguiente de un arreglo).

## Estructuras de la tabla de páginas

Las tablas pueden ser enormes. Con páginas de 4 KiB (12 bits de desplazamiento) y direcciones de 64 bits quedan **52 bits** de número de página: 2<sup>52</sup> entradas por proceso. El tamaño de página lo define el SO y siempre es una potencia de 2.

### Paginación jerárquica

Se **pagina la tabla de páginas**: una tabla externa apunta a los pedazos de la tabla, y en RAM solo quedan los pedazos que se usan. La tabla externa tiene que estar siempre en memoria.

```recorrido paginacion-jerarquica

```

- Cada acceso cuesta **cantidad de niveles + 1** accesos a memoria.
- Puede haber page fault por un pedazo de la tabla que está en disco: en el peor caso, **dos page faults** para una referencia (uno por la tabla y otro por la página).

### Tabla de páginas invertida

Una **única tabla para todos los procesos**, con una entrada por **marco** (en lugar de una por página): cada entrada dice qué página de qué proceso hay en ese marco.

```recorrido tabla-invertida

```

- **Ventaja:** su tamaño es fijo y chico, depende de la RAM y no del espacio virtual.
- **Desventajas:** buscar secuencialmente es lento y hay que comparar también el PID; compartir páginas es complicado; y no tiene bit de presencia, así que el page fault se detecta recién al no encontrar la página.
- Con **hash** sobre (página, PID) se va directo a una entrada; las colisiones se encadenan con un puntero (PTR). Llegar a NULL sin encontrarla es page fault.

## TLB

La **TLB** (_Translation Lookaside Buffer_) es una caché de la tabla de páginas, en el hardware de la MMU. Su etiqueta es el número de página y su dato el número de marco. Es de **acceso por contenido**: no se indexa, compara la página con todas las entradas a la vez.

```recorrido tlb

```

- **Hit:** la traducción sale de la TLB y el acceso cuesta 1 acceso a memoria en lugar de 2.
- **Miss:** se pierde el tiempo de la búsqueda y se va a la tabla de páginas. Si la página está, se carga la entrada en la TLB; si no, es page fault.
- Es muy rápida pero tiene **pocas entradas**.
- **ASID** (identificador de espacio de direcciones): cada entrada lleva el proceso dueño. Sin ASID, la TLB se vacía en cada cambio de proceso.

> **Complemento (Stallings / Silberschatz), tiempo efectivo de acceso.** Con una tasa de aciertos `α`, búsqueda en la TLB `ε` y acceso a memoria `m`:
>
> `EAT = α × (ε + m) + (1 − α) × (ε + 2m)`
>
> Con `ε = 20 ns`, `m = 100 ns` y `α = 0,8`: `0,8 × 120 + 0,2 × 220 = 140 ns`. Con page faults, si `p` es la probabilidad de fallo: `EAT = (1 − p) × m + p × tiempo de atender el PF`. Con `m = 200 ns`, un PF de `8 ms` y `p = 0,001`, da `≈ 8,2 µs`: un fallo cada mil accesos hace la memoria 40 veces más lenta.

## Diseño del SO: políticas

El hardware decide si hay memoria virtual y si es con paginación, segmentación o ambas. El resto lo decide el SO con sus **políticas**, todas con un mismo objetivo: **reducir los page faults**, que es lo que más demora.

| Política                    | Pregunta                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| **Recuperación** (fetch)    | ¿Cuándo traigo las páginas a RAM?                                  |
| **Ubicación**               | ¿Dónde las pongo?                                                  |
| **Reemplazo** (sustitución) | ¿A quién saco cuando no hay lugar?                                 |
| **Conjunto residente**      | ¿Cuántos marcos le doy a cada proceso y de dónde elijo la víctima? |
| **Limpieza**                | ¿Cuándo escribo en disco las páginas modificadas?                  |

### Recuperación

- **Paginación bajo demanda:** se trae cada página cuando se la pide; si no está, se espera.
- **Paginación adelantada (prepaging):** se trae la pedida y algunas más (si pidió la 0, también la 1, 2 y 3). Es una ventaja si se usan, y un gasto si no.

Se suelen combinar: prepaging al arrancar el proceso y después bajo demanda.

### Ubicación

Con paginación da lo mismo: un marco libre es igual a cualquier otro. Solo importa con **segmentación pura**, porque los segmentos miden distinto: ahí se usan primer, siguiente, mejor y peor ajuste, como en memoria real.

### Reemplazo

Corre **solo** si hubo un page fault y no hay un marco libre para la página. Elige una **víctima** según el algoritmo. Con el **bloqueo de marcos**, las páginas con el bit de bloqueo no pueden ser víctimas. Los algoritmos se comparan por la cantidad de page faults que generan.

| Algoritmo          | Víctima                                                                                     | Qué necesita en la tabla                                                   |
| ------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Óptimo**         | La que se va a usar más lejos en el futuro.                                                 | Conocer el futuro: **no se puede implementar**. Sirve de referencia.       |
| **FIFO**           | La que hace más tiempo que está en memoria.                                                 | Solo un puntero a la próxima víctima.                                      |
| **LRU**            | La que hace más tiempo que no se usa.                                                       | El instante de la última referencia de cada página. Es el de más overhead. |
| **Clock**          | Recorre con un puntero: si U = 1, lo pone en 0 y sigue; la primera con U = 0 es la víctima. | Bit de uso. El puntero no está en la tabla.                                |
| **Clock mejorado** | Igual, pero mirando U y M: prefiere una víctima no modificada.                              | Bits de uso y de modificado.                                               |

```recorrido reemplazo-paginas

```

Con la secuencia `2 3 2 1 5 2 4 5 3 2 5 2` y 3 marcos: **Óptimo 6 PF, LRU 7, Clock 8, FIFO 9**.

**Convenciones de la cátedra para estas tablas:**

- Los marcos arrancan vacíos y los fallos de la **carga inicial también cuentan** (se anota "3 PF + N PF = total").
- En FIFO y clock se marca dónde queda el puntero después de cada referencia. En un **acierto el puntero no se mueve**.
- En clock, una página que entra lo hace con U = 1, y el puntero queda en el marco **siguiente** al que se reemplazó. Se anota "2 U" si la página 2 tiene U = 1.

#### Clock mejorado

Clasifica cada marco por (U, M), de mejor a peor víctima: **(0,0)** no usada ni modificada, **(0,1)** no usada pero modificada, **(1,0)** usada y no modificada, **(1,1)** usada y modificada.

1. Recorre los marcos y elige el primero con (0,0), **sin tocar los bits**.
2. Si no hay, recorre buscando el primero con (0,1), y a medida que pasa **baja el bit de uso** de 1 a 0.
3. Si tampoco hay, repite el paso 1 y, si hace falta, el 2. Como mucho son cuatro pasadas.

No reduce los page faults: lo que ahorra es **escrituras a disco**, porque evita sacar páginas modificadas.

```recorrido clock-mejorado

```

#### Anomalía de Belady

Uno esperaría que con más marcos haya menos fallos. Con **FIFO** no siempre: hay secuencias que fallan **más** con más marcos. Con `1 2 3 4 1 2 5 1 2 3 4 5`:

```recorrido belady-3

```

```recorrido belady-4

```

Con 3 marcos hay **9 PF** y con 4, **10 PF**. LRU y el óptimo no sufren la anomalía: con la misma secuencia, LRU pasa de 10 a 8.

### Conjunto residente

El **conjunto residente** son las páginas del proceso que están en RAM. Hay dos decisiones: cuántos marcos tiene cada proceso (**asignación**) y de dónde sale la víctima (**alcance**).

|                                                             | Reemplazo local                  | Reemplazo global                                                                 |
| ----------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| **Asignación fija** (los marcos de cada proceso no cambian) | La víctima es del mismo proceso. | **No es posible**: si saca una página de otro, el proceso supera su máximo.      |
| **Asignación variable** (los marcos pueden cambiar)         | La víctima es del mismo proceso. | La víctima puede ser de cualquiera: cada reemplazo puede afectar a otro proceso. |

Con asignación fija se saca una página cuando no hay marcos libres **o** cuando el proceso ya llegó a su máximo, aunque la RAM tenga lugar. Con asignación variable se busca darle a cada proceso los marcos que minimicen sus fallos.

### Limpieza

- **Bajo demanda:** no se limpia; una página modificada se escribe en disco recién cuando se la elige como víctima.
- **Adelantada:** cada tanto el SO escribe en disco las páginas modificadas, así cuando se reemplazan ya están al día y se evita la **doble E/S** (escribir la víctima y leer la nueva).

Relacionado: el **buffering de páginas**. La víctima va primero a un buffer del SO en lugar de escribirse ya en disco; las modificadas se escriben juntas, y si alguien la vuelve a pedir antes se recupera sin tocar el disco.

## Bloqueo de páginas

El problema que resuelve el bit de bloqueo, con PA de alta prioridad y PB de baja:

1. PB provoca un page fault y se bloquea hasta tener su página.
2. PA pasa a ejecutar y también provoca un page fault.
3. La página de PB llega y PB se desbloquea, pero no ejecuta: PA tiene más prioridad.
4. La página de PA reemplaza a la de PB, que **nunca llegó a usarse**. PB vuelve a fallar, y puede sufrir inanición.

El **bit de bloqueo de marcos** evita que se reemplace una página que todavía no se usó. También se usa para los marcos del SO.

## Thrashing

El **thrashing** (sobrepaginación) es cuando se pasa más tiempo atendiendo page faults que ejecutando: todo el tiempo se piden páginas que no están. Puede venir de un algoritmo de reemplazo que saca páginas que se van a usar enseguida, pero la causa típica es un **grado de multiprogramación demasiado alto**: muchos procesos, cada uno con muy pocos marcos.

```recorrido thrashing

```

### Conjunto de trabajo y PFF

> **Complemento (Stallings / Silberschatz):** el resumen y las PPTs no los desarrollan, pero son las soluciones clásicas.

- **Conjunto de trabajo** (_working set_) `W(t, Δ)`: las páginas distintas que el proceso usó en sus últimas `Δ` referencias. Es una buena estimación de su localidad: si a cada proceso se le dan los marcos de su conjunto de trabajo y no alcanzan para todos, se **suspende** alguno en lugar de seguir sumando procesos.
- **PFF** (frecuencia de fallos de página): se mide la tasa de fallos de cada proceso. Si es muy alta se le dan más marcos; si es muy baja, se le sacan.

```recorrido working-set

```

## Tamaño de página

|                               | Página chica      | Página grande  |
| ----------------------------- | ----------------- | -------------- |
| **Tabla de páginas**          | Muchas entradas   | Pocas entradas |
| **Page faults**               | Más               | Menos          |
| **TLB**                       | Más fallos de TLB | Más aciertos   |
| **Fragmentación interna**     | Menos             | Más            |
| **Localidad**                 | Más precisa       | Menos precisa  |
| **Cada transferencia de E/S** | Menos datos       | Más datos      |

## Copy-on-write

La paginación hace fácil compartir memoria, y eso se aprovecha en `fork()`: en lugar de copiar toda la memoria del padre, el hijo **comparte sus páginas** marcadas como solo lectura. Recién cuando uno de los dos escribe en una página, el SO copia **esa** página.

```recorrido copy-on-write

```

## Otros detalles

- **Archivos mapeados en memoria:** se asocia un archivo a una región de memoria (`mmap`) y se lo usa como si fuera un arreglo; el SO lo pagina como al resto. Es eficiente para archivos grandes. `msync` fuerza la escritura y `munmap` lo desasocia.
- **Memoria virtual y estados suspendidos:** con memoria virtual, en la práctica no se suspenden procesos enteros. El proceso siempre está activo, con una parte en RAM y otra en disco, y **al menos una página** en memoria real. Los estados Ready/Suspended y Blocked/Suspended del [modelo de 7 estados](/teoria/parcial-1/procesos/) quedan para el swapping de procesos completos.

## Preguntas de parcial

**1. Explique al menos dos maneras que tiene el hardware para mejorar la eficiencia del sistema de gestión de memoria.**

> La **MMU**, que traduce las direcciones en hardware sin cargar a la CPU y detecta los page faults; la **TLB**, que evita leer la tabla de páginas en cada acceso; y el **disco de swap**, que da el espacio para la memoria virtual.

**2. V o F: la corrupción total de la tabla de páginas de un proceso no impediría que siga ejecutando, si el SO usa memoria virtual, el proceso no escribió páginas y hay RAM libre.**

> **Verdadero.** El SO puede frenar el proceso, armarle una tabla nueva con todas las páginas en P = 0 y dejar que los page faults las vuelvan a traer desde el disco. Hace falta RAM libre porque los marcos viejos no se pueden identificar ni liberar, y que no haya páginas modificadas para que la copia del disco esté al día.

**3. ¿Cuántos accesos a disco puede requerir un page fault?**

> Uno si hay un marco libre o la víctima no está modificada (leer la página). Dos si la víctima tiene el bit de modificado en 1: hay que escribirla y después leer la nueva. Con tablas multinivel puede haber además un page fault por la propia tabla.

**4. ¿Por qué no se puede usar reemplazo global con asignación fija?**

> Porque con asignación fija cada proceso tiene un máximo de marcos. Si un proceso que ya llegó a su máximo reemplazara una página de otro, quedaría con más marcos de los permitidos.

**5. ¿Qué es la anomalía de Belady y qué algoritmo la sufre?**

> Que al aumentar los marcos aumenten los page faults. Le pasa a FIFO: con `1 2 3 4 1 2 5 1 2 3 4 5` da 9 PF con 3 marcos y 10 PF con 4. LRU y el óptimo no la sufren.

**6. ¿Qué es el thrashing y cómo lo resuelve el SO?**

> Una situación en que los procesos pasan más tiempo esperando páginas que ejecutando, normalmente por un grado de multiprogramación tan alto que cada proceso tiene menos marcos que su localidad. El uso de CPU cae, y si el SO reacciona sumando procesos lo empeora. Se resuelve **bajando** el grado de multiprogramación (suspendiendo procesos) o asignando marcos según el conjunto de trabajo o la frecuencia de fallos.

**7. ¿Qué gana el clock mejorado respecto del clock?**

> No reduce la cantidad de page faults. Prefiere víctimas no modificadas (M = 0), que se pueden descartar sin escribirlas en disco, así que ahorra accesos a disco.

_Fuente: PPT Memoria Virtual de la cátedra y Sistemas Operativos for Dummies (págs. 85–99, 111–112 y 127). Lo marcado como complemento sale de Stallings y Silberschatz._
