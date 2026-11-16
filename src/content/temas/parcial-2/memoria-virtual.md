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
| Más grado de multiprogramación     | Cada proceso ocupa menos frames, así que entran más.                     |
| Menos restricciones al programador | Se programa contra el espacio virtual, que alcanza para todo el proceso. |

Las direcciones lógicas pasan a referirse al **espacio virtual** (son más largas) y las físicas a la memoria real. La MMU sigue traduciendo, ahora con un dato más: si la página está o no en RAM.

Los bits se calculan igual que en [memoria real](/teoria/parcial-2/memoria-real/#cuántos-bits-tiene-cada-dirección), con una diferencia: la RAM **ya no limita** a la DL. La DL sale de lo que el proceso tiene que poder direccionar (`log₂` de ese tamaño) y la DF sigue saliendo del tamaño de la RAM.

**¿Cuántas páginas puede tener como máximo un programa?** Con memoria virtual, lo que no entra en RAM queda en disco, así que el tamaño de la RAM **no** pone el límite. El límite es cuántas direcciones distintas puede escribir el programa:

`máximo de páginas = 2^(bits de la DL) / tamaño de página`

Con direcciones de 16 bits y páginas de 512 bytes: 2<sup>16</sup> / 2<sup>9</sup> = 2<sup>7</sup> = **128 páginas**, tenga la RAM 32 KiB o 1 GiB. Si el enunciado da el tamaño de la RAM, es para calcular otra cosa (los frames, la DF) o es un distractor. Las cuentas en potencias de 2 están en [Herramientas de cuenta](/teoria/parcial-2/memoria-real/#herramientas-de-cuenta).

## La tabla de páginas en memoria virtual

Cada entrada de la tabla gana bits. No todos los esquemas usan todos, pero estos son los que aparecen en la materia:

| Campo                      | Para qué sirve                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **Número de frame**        | Dónde está la página. Con P = 0 el valor no significa nada: es lo que quedó de antes.       |
| **Bit de presencia (P)**   | 1 si la página está en RAM. Si es 0 y se la referencia, hay **page fault**.                 |
| **Bit de modificado (M)**  | 1 si se escribió desde que se cargó: antes de sacarla hay que actualizar su copia en disco. |
| **Bit de uso (U)**         | Se pone en 1 cada vez que se la referencia. Lo usan clock y clock mejorado.                 |
| **Instante de referencia** | Cuándo se usó por última vez. Lo necesita LRU.                                              |
| **Bit de bloqueo**         | La página no se puede reemplazar (se usa, por ejemplo, para frames del SO).                 |
| **Protección**             | Permisos R/W/X.                                                                             |

**Quién lee y quién escribe cada bit** (la pregunta aparece en parciales):

| Bit   | Lo lee                                                         | Lo escribe                                                                                   |
| ----- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **P** | La **MMU** al traducir (P = 0 dispara el page fault).          | El **SO** al cargar la página (1) o al sacarla (0).                                          |
| **U** | El **SO**, en clock, al buscar víctima.                        | El **HW** lo pone en 1 al referenciar la página; el **SO** lo pone en 0 al pasar el puntero. |
| **M** | El **SO** al reemplazar: si es 1, escribe la víctima en disco. | La **MMU** lo pone en 1 cuando el proceso escribe; el **SO** lo vuelve a 0 al cargarla.      |

### Tabla de páginas y tabla de frames libres

Son **dos tablas distintas** y se preguntan juntas, así que conviene no mezclarlas:

|                  | Tabla de páginas                         | Tabla de frames libres              |
| ---------------- | ---------------------------------------- | ----------------------------------- |
| **Cuántas hay**  | Una **por proceso**                      | Una **sola**, del sistema           |
| **Qué responde** | ¿Dónde está cada página de este proceso? | ¿Qué frames de la RAM están libres? |
| **Una fila por** | Página                                   | Frame                               |

```
Tabla de páginas (proceso A)        Bitmap de frames (sistema)
         P   Frame                  frame: 0 1 2 3 4 5 6 …
pág 0 →  1   0                      bit:   1 1 0 1 1 0 1 …
pág 1 →  1   3                             (1 = ocupado, 0 = libre)
pág 2 →  0   –    ← en disco
```

- **El número de página no se guarda**: es la posición de la entrada en la tabla, como el número de renglón de un cuaderno.
- **El bit P hace falta** porque el frame 0 es un frame válido: no se puede usar "frame = 0" para decir "no está".
- **Bits del campo frame:** `log₂(cantidad de frames)`, con `frames = RAM / tamaño de página`.
- **Tamaño del bitmap:** 1 bit por frame, así que `frames / 8` bytes. Con 128 frames: 128 bits = 16 bytes. Una alternativa es una **lista de frames libres**, que ocupa menos cuando quedan pocos libres pero cambia de tamaño todo el tiempo.
- **El formato de una entrada se arma con el enunciado:** P y frame siempre; U si el algoritmo es clock; U y M si es clock mejorado; el instante de referencia si es LRU; R/W/X si habla de permisos. Cada requisito del enunciado es un campo.

**Del mapa de la memoria a la tabla de páginas.** Muchos enunciados dan qué hay en cada frame (`A1` en el frame 3 = la página 1 de A está en el frame 3). La tabla de páginas es ese mapa **dado vuelta**: ordenada por página en lugar de por frame. Una página que no aparece en el mapa no está en RAM: P = 0, y referenciarla es page fault. Las páginas de un proceso no tienen que estar en orden: la página 5 puede estar en un frame anterior a la página 1.

### Los tres casos de una referencia

```recorrido casos-tabla-paginas

```

| Caso                          | Accesos a disco                         |
| ----------------------------- | --------------------------------------- |
| La página está (P = 1)        | 0 (2 accesos a memoria)                 |
| Page fault con un frame libre | 1: leer la página                       |
| Page fault, víctima con M = 0 | 1: leer la página                       |
| Page fault, víctima con M = 1 | 2: escribir la víctima y leer la página |

> **No todo fallo es un page fault.** Si la dirección cae en una página que **no existe** en el proceso (un proceso de 20 páginas que referencia la 21), no hay nada que traer del disco: es una **dirección inválida**, que el SO trata como un segmentation fault. No carga nada en memoria ni cuenta como PF.

### El bit M: escribir en RAM no es escribir en disco

Los enunciados marcan cada referencia como **lectura (L)** o **escritura (E)**. Una (E) es el proceso modificando la página que tiene cargada: pasa en **RAM** y el disco ni se entera. Lo único que hace es dejar **M = 1**, una marca de "la copia del disco quedó vieja".

| Referencia | Si la página ya está (acierto) | Si entra por PF |
| ---------- | ------------------------------ | --------------- |
| **(L)**    | M no cambia                    | entra con M = 0 |
| **(E)**    | M pasa a 1                     | entra con M = 1 |

M no vuelve a 0 mientras la página siga en RAM: una lectura posterior no la baja. Se escribe **a disco** recién cuando la página **sale como víctima con M = 1**. Por eso, cuando piden "páginas escritas a disco", se cuentan las **víctimas con M = 1**, no las referencias (E). Una página escrita 50 veces genera una sola escritura a disco cuando sale, o ninguna si nunca sale.

## Atención de un page fault

El **page fault** (fallo de página) es una excepción que lanza la MMU cuando se referencia una página con el bit de presencia en 0. Es una interrupción **sincrónica** (la provoca la instrucción que se está ejecutando, no un dispositivo) de tipo **fallo**: se corrige y la instrucción se vuelve a ejecutar (ver [Repaso de arquitectura](/teoria/parcial-1/arquitectura/)).

```recorrido page-fault

```

1. **Se referencia memoria** y la tabla de páginas dice P = 0.
2. **Interrupción por fallo de página:** el proceso pasa a **Bloqueado** y, mientras tanto, otro puede usar la CPU.
3. **Se solicita la página:** el SO elige el frame (si no hay libre, corre el algoritmo de reemplazo; si la víctima tiene M = 1, primero se escribe en disco) y pide la página al disco.
4. **Se carga** en el frame por **DMA**, sin usar la CPU, y al terminar el disco produce una **interrupción de fin de E/S** (asincrónica) para que el SO retome el control.
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

Una **única tabla para todos los procesos**, con una entrada por **frame** (en lugar de una por página): cada entrada dice qué página de qué proceso hay en ese frame.

```recorrido tabla-invertida

```

- **Ventaja:** su tamaño es fijo y chico, depende de la RAM y no del espacio virtual.
- **Desventajas:** buscar secuencialmente es lento y hay que comparar también el PID; compartir páginas es complicado; y no tiene bit de presencia, así que el page fault se detecta recién al no encontrar la página.
- Con **hash** sobre (página, PID) se va directo a una entrada; las colisiones se encadenan con un puntero (PTR). Llegar a NULL sin encontrarla es page fault.

## TLB

La **TLB** (_Translation Lookaside Buffer_) es una caché de la tabla de páginas, en el hardware de la MMU. Su etiqueta es el número de página y su dato el número de frame. Es de **acceso por contenido**: no se indexa, compara la página con todas las entradas a la vez.

```recorrido tlb

```

- **Hit:** la traducción sale de la TLB y el acceso cuesta 1 acceso a memoria en lugar de 2.
- **Miss:** se pierde el tiempo de la búsqueda y se va a la tabla de páginas. Si la página está, se carga la entrada en la TLB; si no, es page fault.
- Es muy rápida pero tiene **pocas entradas**. Cuando está llena, se elige qué entrada sacar con un algoritmo de reemplazo, igual que con las páginas (por ejemplo, FIFO).
- **Para contar accesos:** cada referencia consulta la TLB (**1 acceso a la TLB**). Con hit hay 1 acceso a memoria; con miss, 2 (tabla + dato); y si además es page fault se suman los accesos a disco de la tabla de arriba.
- **ASID** (identificador de espacio de direcciones): cada entrada lleva el proceso dueño. Sin ASID, la TLB se vacía en cada cambio de proceso. Si no se vaciara, un proceso podría encontrar la entrada de una página con el mismo número pero de **otro** proceso, y la traducción daría una dirección física de memoria ajena.

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
| **Conjunto residente**      | ¿Cuántos frames le doy a cada proceso y de dónde elijo la víctima? |
| **Limpieza**                | ¿Cuándo escribo en disco las páginas modificadas?                  |

### Recuperación

- **Paginación bajo demanda:** se trae cada página cuando se la pide; si no está, se espera.
- **Paginación adelantada (prepaging):** se trae la pedida y algunas más (si pidió la 0, también la 1, 2 y 3). Es una ventaja si se usan, y un gasto si no.

Se suelen combinar: prepaging al arrancar el proceso y después bajo demanda.

### Ubicación

Con paginación da lo mismo: un frame libre es igual a cualquier otro. Solo importa con **segmentación pura**, porque los segmentos miden distinto: ahí se usan primer, siguiente, mejor y peor ajuste, como en memoria real.

### Reemplazo

Corre **solo** si hubo un page fault y no hay un frame libre para la página. Elige una **víctima** según el algoritmo. Con el **bloqueo de frames**, las páginas con el bit de bloqueo no pueden ser víctimas. Los algoritmos se comparan por la cantidad de page faults que generan.

| Algoritmo          | Víctima                                                                                     | Qué necesita en la tabla                                                   |
| ------------------ | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Óptimo**         | La que se va a usar más lejos en el futuro.                                                 | Conocer el futuro: **no se puede implementar**. Sirve de referencia.       |
| **FIFO**           | La que hace más tiempo que está en memoria.                                                 | Solo un puntero a la próxima víctima.                                      |
| **LRU**            | La que hace más tiempo que no se usa.                                                       | El instante de la última referencia de cada página. Es el de más overhead. |
| **Clock**          | Recorre con un puntero: si U = 1, lo pone en 0 y sigue; la primera con U = 0 es la víctima. | Bit de uso. El puntero no está en la tabla.                                |
| **Clock mejorado** | Igual, pero mirando U y M: prefiere una víctima no modificada.                              | Bits de uso y de modificado.                                               |

```recorrido reemplazo-paginas

```

Con la secuencia `2 3 2 1 5 2 4 5 3 2 5 2` y 3 frames: **Óptimo 6 PF, LRU 7, Clock 8, FIFO 9**.

**Convenciones de la cátedra para estas tablas:**

- Los frames arrancan vacíos y los fallos de la **carga inicial también cuentan** (se anota "3 PF + N PF = total").
- En FIFO y clock se marca dónde queda el puntero después de cada referencia. En un **acierto el puntero no se mueve**.
- En clock, una página que entra lo hace con U = 1, y el puntero queda en el frame **siguiente** al que se reemplazó. Se anota "2 U" si la página 2 tiene U = 1.

Consejo para simular a mano: antes de empezar, escribí la fila de **páginas** (con su L o E) arriba de la grilla y simulá mirando esa fila, no las direcciones. Y anotá el puntero **en todas las columnas**, también en los aciertos (copiando la misma posición), para no reconstruir de memoria dónde quedó.

#### LRU a mano

En la tabla, LRU guarda el **instante de referencia** de cada página. Para simular no hace falta calcularlo: alcanza con llevar, al costado de la grilla, una **fila ordenada de la usada hace más tiempo a la más reciente**.

```
  SALE ←  [más vieja] → … → [más nueva]  ← entra / se usa
```

- La víctima es siempre **la primera** de la fila.
- Cada vez que una página se usa, va **al final**. Eso incluye los **aciertos**: es la diferencia con FIFO, donde un acierto no cambia nada.
- Si el enunciado arranca de un estado dado con instantes de referencia (por ejemplo 28, 3 y 15), esos números solo dan el **orden inicial** (el más chico es el más viejo). No hay que reconstruir qué pasó antes, y cada página sigue en su frame: la fila es aparte de la grilla.

#### Clock a mano: quién toca la U

La U cambia por dos motivos, cada uno con su responsable:

| Quién        | Cuándo                                                    | Qué hace                              |
| ------------ | --------------------------------------------------------- | ------------------------------------- |
| **Hardware** | Cada vez que se **usa** la página: entra por PF o acierta | La pone en **1**                      |
| **Puntero**  | Cuando **pasa por encima** buscando víctima               | Si está en 1, la baja a **0** y sigue |

Por eso se le dice **algoritmo de la segunda oportunidad**: U = 1 es una vida extra. Y por eso **el puntero no es la víctima**: es **dónde empieza a buscar**. Solo sale una página que tenga U = 0 cuando el puntero llega a ella.

Con la secuencia de arriba (3 frames, puntero en F0 al empezar):

- **Ref. 5, entra el 5.** Los frames tienen `2 U | 3 U | 1 U`, con el puntero en F0. Todas tienen U = 1, así que el puntero da **la vuelta entera** bajándolas y vuelve a F0, donde ahora el 2 tiene U = 0: sale. Queda `5 U | 3 | 1` con el puntero en F1. Si todas tienen U = 1, clock se comporta como FIFO en ese reemplazo.
- **Ref. 9, entra el 3.** Estado `5 U | 2 U | 4 U`, puntero en F0: otra vuelta entera, sale el 5. Queda `3 U | 2 | 4` con el puntero en F1: **el 2 perdió su U**.
- **Ref. 10, acierta el 2.** El hardware le **devuelve U = 1**. El puntero no se mueve (sigue en F1): un acierto no lo lleva al frame del acierto ni lo avanza.
- **Ref. 11, entra el 5.** El puntero arranca en F1: el 2 tiene U = 1 (gracias al acierto), se la baja y sigue. En F2, el 4 tiene U = 0: sale. **El acierto de la ref. 10 salvó al 2.**

#### Clock mejorado

Clasifica cada frame por (U, M), de mejor a peor víctima: **(0,0)** no usada ni modificada, **(0,1)** no usada pero modificada, **(1,0)** usada y no modificada, **(1,1)** usada y modificada.

1. Recorre los frames y elige el primero con (0,0), **sin tocar los bits**.
2. Si no hay, recorre buscando el primero con (0,1), y a medida que pasa **baja el bit de uso** de 1 a 0.
3. Si tampoco hay, repite el paso 1 y, si hace falta, el 2. Como mucho son cuatro pasadas.

No reduce los page faults: lo que ahorra es **escrituras a disco**, porque evita sacar páginas modificadas.

```recorrido clock-mejorado

```

#### Anomalía de Belady

Uno esperaría que con más frames haya menos fallos. Con **FIFO** no siempre: hay secuencias que fallan **más** con más frames. Con `1 2 3 4 1 2 5 1 2 3 4 5`:

```recorrido belady-3

```

```recorrido belady-4

```

Con 3 frames hay **9 PF** y con 4, **10 PF**. LRU y el óptimo no sufren la anomalía: con la misma secuencia, LRU pasa de 10 a 8.

### Conjunto residente

El **conjunto residente** son las páginas del proceso que están en RAM. Hay dos decisiones: cuántos frames tiene cada proceso (**asignación**) y de dónde sale la víctima (**alcance**).

|                                                             | Reemplazo local                  | Reemplazo global                                                                 |
| ----------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| **Asignación fija** (los frames de cada proceso no cambian) | La víctima es del mismo proceso. | **No es posible**: si saca una página de otro, el proceso supera su máximo.      |
| **Asignación variable** (los frames pueden cambiar)         | La víctima es del mismo proceso. | La víctima puede ser de cualquiera: cada reemplazo puede afectar a otro proceso. |

Con asignación fija se saca una página cuando no hay frames libres **o** cuando el proceso ya llegó a su máximo, aunque la RAM tenga lugar. Con asignación variable se busca darle a cada proceso los frames que minimicen sus fallos.

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

El **bit de bloqueo de frames** evita que se reemplace una página que todavía no se usó. También se usa para los frames del SO.

## Thrashing

El **thrashing** (sobrepaginación) es cuando se pasa más tiempo atendiendo page faults que ejecutando: todo el tiempo se piden páginas que no están. Puede venir de un algoritmo de reemplazo que saca páginas que se van a usar enseguida, pero la causa típica es un **grado de multiprogramación demasiado alto**: muchos procesos, cada uno con muy pocos frames.

```recorrido thrashing

```

### Conjunto de trabajo y PFF

> **Complemento (Stallings / Silberschatz):** el resumen y las PPTs no los desarrollan, pero son las soluciones clásicas.

- **Conjunto de trabajo** (_working set_) `W(t, Δ)`: las páginas distintas que el proceso usó en sus últimas `Δ` referencias. Es una buena estimación de su localidad: si a cada proceso se le dan los frames de su conjunto de trabajo y no alcanzan para todos, se **suspende** alguno en lugar de seguir sumando procesos.
- **PFF** (frecuencia de fallos de página): se mide la tasa de fallos de cada proceso. Si es muy alta se le dan más frames; si es muy baja, se le sacan.

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

> **Verdadero.** El SO puede frenar el proceso, armarle una tabla nueva con todas las páginas en P = 0 y dejar que los page faults las vuelvan a traer desde el disco. Hace falta RAM libre porque los frames viejos no se pueden identificar ni liberar, y que no haya páginas modificadas para que la copia del disco esté al día.

**3. ¿Cuántos accesos a disco puede requerir un page fault?**

> Uno si hay un frame libre o la víctima no está modificada (leer la página). Dos si la víctima tiene el bit de modificado en 1: hay que escribirla y después leer la nueva. Con tablas multinivel puede haber además un page fault por la propia tabla.

**4. ¿Por qué no se puede usar reemplazo global con asignación fija?**

> Porque con asignación fija cada proceso tiene un máximo de frames. Si un proceso que ya llegó a su máximo reemplazara una página de otro, quedaría con más frames de los permitidos.

**5. ¿Qué es la anomalía de Belady y qué algoritmo la sufre?**

> Que al aumentar los frames aumenten los page faults. Le pasa a FIFO: con `1 2 3 4 1 2 5 1 2 3 4 5` da 9 PF con 3 frames y 10 PF con 4. LRU y el óptimo no la sufren.

**6. ¿Qué es el thrashing y cómo lo resuelve el SO?**

> Una situación en que los procesos pasan más tiempo esperando páginas que ejecutando, normalmente por un grado de multiprogramación tan alto que cada proceso tiene menos frames que su localidad. El uso de CPU cae, y si el SO reacciona sumando procesos lo empeora. Se resuelve **bajando** el grado de multiprogramación (suspendiendo procesos) o asignando frames según el conjunto de trabajo o la frecuencia de fallos.

**7. ¿Qué gana el clock mejorado respecto del clock?**

> No reduce la cantidad de page faults. Prefiere víctimas no modificadas (M = 0), que se pueden descartar sin escribirlas en disco, así que ahorra accesos a disco.

_Fuente: PPT Memoria Virtual de la cátedra y Sistemas Operativos for Dummies (págs. 85–99, 111–112 y 127). Lo marcado como complemento sale de Stallings y Silberschatz._
