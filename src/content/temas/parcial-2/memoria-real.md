---
titulo: Memoria real
parcial: 2
orden: 1
resumen: Requisitos de la gestión de memoria, address binding y MMU, particiones fijas y dinámicas, buddy system, segmentación, paginación y segmentación paginada.
aliases:
  [
    memoria real,
    memoria principal,
    memoria física,
    MMU,
    address binding,
    reubicación,
    particionamiento,
    fragmentación,
    compactación,
    buddy system,
    segmentación,
    paginación,
    tabla de páginas,
    marco,
    frame,
  ]
---

Para ejecutarse, un programa tiene que estar cargado en memoria como proceso. La RAM es, para el SO, un **gran vector de direcciones** que él administra; la memoria en sí no sabe qué tiene adentro. En este tema se ve cómo el SO reparte ese vector entre los procesos sin que se pisen, cómo se traduce lo que el proceso cree que es una dirección a la dirección real, y las técnicas de asignación, desde particiones fijas hasta paginación.

En todo este tema el proceso se carga **entero** en memoria. Cargar solo una parte es lo que agrega la [memoria virtual](/teoria/parcial-2/memoria-virtual/).

## Herramientas de cuenta

Los ejercicios de memoria (real y virtual) usan siempre las mismas tres cuentas. Conviene tenerlas a mano antes de empezar.

### Hexa ↔ binario

Cada dígito hexa son **exactamente 4 bits**, siempre. Se convierte **dígito por dígito**, sin hacer cuentas con el número entero. Para armar cada fila se suman los pesos **8 4 2 1** (B = 11 = 8 + 2 + 1 → `1011`).

| Hexa | Binario | Hexa | Binario | Hexa | Binario | Hexa | Binario |
| ---- | ------- | ---- | ------- | ---- | ------- | ---- | ------- |
| 0    | `0000`  | 4    | `0100`  | 8    | `1000`  | C    | `1100`  |
| 1    | `0001`  | 5    | `0101`  | 9    | `1001`  | D    | `1101`  |
| 2    | `0010`  | 6    | `0110`  | A    | `1010`  | E    | `1110`  |
| 3    | `0011`  | 7    | `0111`  | B    | `1011`  | F    | `1111`  |

Ejemplo: `2F0A` = `0010 1111 0000 1010`. Para volver a hexa, se agrupa de a 4 **desde la derecha**.

### Tamaños en potencias de 2

| Unidad | Bytes    | Potencia       |
| ------ | -------- | -------------- |
| 1 KiB  | 1024     | 2<sup>10</sup> |
| 1 MiB  | 1024 KiB | 2<sup>20</sup> |
| 1 GiB  | 1024 MiB | 2<sup>30</sup> |

Cualquier otro tamaño sale sumando exponentes: 4 KiB = 2<sup>2</sup> × 2<sup>10</sup> = 2<sup>12</sup>; 64 KiB = 2<sup>16</sup>; 0,5 KiB = 512 bytes = 2<sup>9</sup>. Y **dividir es restar exponentes**: 64 KiB / 512 B = 2<sup>16</sup> / 2<sup>9</sup> = 2<sup>7</sup> = 128. Trabajar en potencias de 2 evita las cuentas con números grandes.

Para numerar `N` cosas hacen falta `log₂ N` bits: 128 frames → 7 bits. Si `N` no es potencia de 2, se redondea para arriba (20 páginas → 5 bits).

### División entera con resto

Cuando la dirección viene en **decimal**, cortarla en "número de página + desplazamiento" es **dividir**: el cociente es el número y el resto, el desplazamiento. Está en [Traducción](#traducción), con un ejemplo.

## Requisitos de la gestión de memoria

| Requisito                        | Qué pide                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reubicación**                  | Poder mover un proceso de un lugar de la RAM a otro cuando le convenga al SO. Por ejemplo, un proceso suspendido casi nunca vuelve al mismo lugar.                                            |
| **Protección**                   | Que cada proceso acceda solo a su memoria. Lo controla el **hardware** (la MMU) en cada acceso: si la dirección no es válida, lanza una interrupción y el SO decide (normalmente lo termina). |
| **Compartición**                 | Lo opuesto a la protección: permitir que varios procesos usen la misma porción (una biblioteca, datos), siempre con el SO de intermediario.                                                   |
| **Organización física y lógica** | La física es la RAM en sí (rápida y volátil); la lógica, cómo la ven los procesos. Entre las dos hay una **traducción de direcciones**, transparente para el proceso.                         |

### Protección con registros base y límite

La forma más simple de proteger: dos registros con el **inicio** del proceso (base) y su **longitud** (límite). Los carga el SO cada vez que le da la CPU a un proceso, y el hardware compara cada dirección: tiene que cumplir `base ≤ dirección < base + límite`.

```recorrido proteccion-base-limite

```

## Address binding

Asociar las variables del programa con direcciones de memoria se llama **address binding** (asignación de direcciones). El camino es `programa.c` → compilador → `programa.o` → enlazador → ejecutable → cargador → memoria, y la pregunta es **en qué paso** se decide la dirección.

| Cuándo             | Cómo queda la referencia                                    | Problema                                                                                          |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **En compilación** | Dirección absoluta desde el `.o`.                           | Hay que cargar siempre en el mismo lugar; dos instancias se pisan; reubicar es recompilar.        |
| **En carga**       | Relativa (`inicio + 34`) hasta que el cargador la resuelve. | La posición queda fija toda la vida del proceso: si se suspende, tiene que volver al mismo lugar. |
| **En ejecución**   | Relativa incluso en memoria; se traduce en **cada** acceso. | Mucho trabajo de traducción, que hace el hardware (MMU) y no la CPU. Es lo que se usa hoy.        |

```recorrido binding-direcciones

```

### MMU y tipos de direcciones

La **MMU** (Memory Management Unit) es el hardware que traduce direcciones lógicas a físicas, y lo hace muy rápido. En su versión más simple tiene un **registro de reubicación** que se suma a cada dirección lógica: la CPU emite 34, el registro vale 1200 y la memoria recibe 1234.

| Dirección             | Qué es                                                                        |
| --------------------- | ----------------------------------------------------------------------------- |
| **Lógica**            | La que usa el proceso. No depende de dónde está cargado; necesita traducción. |
| **Relativa**          | Un tipo de lógica, expresada desde un punto conocido (`inicio + 34`).         |
| **Física (absoluta)** | Una posición real de la memoria. El proceso normalmente no la conoce.         |

Traducir solo tiene sentido con binding en ejecución: con binding en compilación ya se usa la física, y en carga se resuelve una sola vez.

## Carga y enlace

| Enlace                               | Cómo funciona                                                                                         | Ventaja                                                            | Desventaja                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Estático**                         | Las bibliotecas se copian adentro del ejecutable (`.lib` en Windows, `.a` en Linux).                  | El programa es autónomo: se distribuye solo.                       | Ejecutables mucho más grandes; cada proceso carga su copia. |
| **Dinámico (biblioteca compartida)** | La biblioteca queda aparte y se carga en ejecución cuando se usa (`.dll` en Windows, `.so` en Linux). | Ejecutables chicos; una sola copia en RAM para todos los procesos. | La máquina destino tiene que tener las bibliotecas.         |

**Overlays (superposiciones).** Antes de la memoria virtual, un programa más grande que la RAM se partía a mano en partes que no se usan al mismo tiempo. En memoria queda una parte común y las demás se van cargando **una encima de la otra** en la misma zona, cuando se necesitan. Lo organiza el **programador**, no el SO. Es la alternativa a la [memoria virtual](/teoria/parcial-2/memoria-virtual/) que aparece en los parciales, por ejemplo cuando una dirección lógica no entra en la RAM.

## Particionamiento fijo

La memoria se divide **una vez** en particiones, todas del mismo tamaño o de tamaños distintos, y no cambia más. Cada proceso tiene que entrar **entero y contiguo** en una partición de tamaño mayor o igual. El SO lleva una tabla con cada partición, si está libre u ocupada y, si son distintas, su tamaño.

- **Grado de multiprogramación fijo:** a lo sumo tantos procesos como particiones.
- **Proceso más grande posible:** el tamaño de la partición **más grande**.
- **Dónde ubicar:** en la partición más chica donde entre. Se puede tener **una cola por partición** (cada proceso espera la que le corresponde, aunque otras estén libres) o **una única cola** (va a cualquier libre, aunque desperdicie una grande en un proceso chico).

```recorrido particionamiento-fijo

```

> **Fragmentación interna:** memoria asignada a un proceso que el proceso no usa, y que nadie más puede usar. En particionamiento fijo es lo que sobra adentro de cada partición.

## Particionamiento dinámico

Las particiones se crean **a demanda**: cada proceso recibe exactamente lo que pide, siempre que haya un espacio libre contiguo suficiente. No hay un número fijo de particiones ni fragmentación interna, pero cuando los procesos terminan dejan **huecos** de tamaños variados. El SO lleva una tabla de procesos (inicio y tamaño) y una **tabla de huecos**.

```recorrido particionamiento-dinamico

```

> **Fragmentación externa:** hay memoria libre suficiente sumando los huecos (`Σ huecos ≥ tamaño del proceso`), pero ninguno alcanza solo porque no es contigua.

La solución es la **compactación**: mover todos los procesos para juntar los huecos en uno. Es muy cara: hay que copiar memoria y, mientras tanto, los procesos movidos no pueden ejecutar. Además, el particionamiento dinámico se lleva mal con procesos que crecen durante la ejecución.

### Algoritmos de ubicación

Cuando hay varios huecos donde entra el proceso, el SO elige uno con alguno de estos criterios. Esa elección es la **política de ubicación**. Solo hace falta cuando las unidades son de tamaño variable (particiones dinámicas, segmentos): en paginación cualquier frame libre sirve. Los enunciados suelen usar los nombres en inglés.

| Algoritmo                         | Elige                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| **Primer ajuste** (_First Fit_)   | El primer hueco donde entra, buscando desde el comienzo.     |
| **Siguiente ajuste** (_Next Fit_) | El primero donde entra, buscando desde la última asignación. |
| **Mejor ajuste** (_Best Fit_)     | El hueco más chico donde entra.                              |
| **Peor ajuste** (_Worst Fit_)     | El hueco más grande.                                         |

```recorrido algoritmos-ubicacion

```

Según el resumen de la cátedra, el mejor ajuste es el que **peor** fragmentación externa crea (deja huecos tan chicos que no sirven para nada) y el peor ajuste el que menos crea (lo que sobra todavía sirve).

<p class="en-ejercicios">↳ En ejercicios: <a href="/metodologia/parcial-2/memoria-real/#huecos">Huecos y compactación</a></p>

## Buddy system

También llamado **descomposición binaria**: combina el particionamiento fijo y el dinámico para compensar sus desventajas. Los bloques tienen tamaños que son potencias de 2. El pedido se **redondea** a la potencia siguiente y, si el bloque libre más chico que alcanza es más grande, se parte por la mitad (en dos **compañeros**) las veces que haga falta. Al liberar, si el compañero también está libre, se unen, y así hacia arriba.

El SO lleva una lista de bloques libres y una tabla de bloques ocupados con sus tamaños. Tiene fragmentación **interna** (por el redondeo) y algo de **externa**.

```recorrido buddy-system

```

## Segmentación

El proceso se divide en **segmentos de tamaño variable**, según la visión del programador: código, pila, datos, heap, bibliotecas. Los segmentos no necesitan estar contiguos entre sí, pero cada uno sí es contiguo. Sin memoria virtual, tienen que estar **todos** en RAM para ejecutar.

- Cada proceso tiene una **tabla de segmentos**, en RAM y apuntada por un registro, con el inicio y el límite de cada segmento. En los ejemplos de la cátedra el límite es la **dirección final** del segmento, no su tamaño.
- La dirección lógica es `(segmento, desplazamiento)` y la física se calcula **sumando**: `DF = inicio + desplazamiento`. Si se pasa del límite, hay **segmentation fault**.
- Con una DL de `x` bits de segmento y `y` de desplazamiento: hasta 2<sup>x</sup> segmentos por proceso, de hasta 2<sup>y</sup> bytes cada uno.
- Si la tabla da el **largo** (tamaño) del segmento en lugar del límite, la validación es contra el desplazamiento: vale si `desplazamiento < largo`. Es la misma idea que el registro límite de la protección con base y límite.
- Cada segmento puede tener permisos de **lectura (R), escritura (W) y ejecución (X)**: lo típico es código RX, datos y pila RW.
- La MMU hace **dos chequeos**, y cualquiera que falle lanza una interrupción: primero el **límite** (si se pasa → segmentation fault) y después el **permiso** del acceso (escribir en un segmento de solo lectura → **interrupción por modo de acceso inválido**).
- Sin fragmentación interna; con fragmentación **externa**, aunque menos que el particionamiento dinámico porque se ubican pedazos y no procesos enteros.

```recorrido traduccion-segmentacion

```

Una forma de pensarlo: el segmento es una **calle**. La **base** es el número donde empieza, el **desplazamiento** es cuántas casas caminás desde la esquina y el **límite** es la última casa. `DF = base + desplazamiento` es la casa a la que llegás; si te pasás de la última, te caés de la calle (segmentation fault).

### Permisos

El enunciado dice qué operación hace el proceso (leer, escribir, ejecutar). Esa operación tiene que estar permitida en el segmento al que cae la dirección:

| Protección     | Leer | Escribir | Ejecutar |
| -------------- | ---- | -------- | -------- |
| **Read only**  | ✓    | ✗        | ✗        |
| **Exec only**  | ✗    | ✗        | ✓        |
| **Read write** | ✓    | ✓        | ✗        |
| **RX**         | ✓    | ✗        | ✓        |

Una dirección puede estar **dentro** del segmento y fallar igual por permiso: escribir en el desplazamiento 0 de un segmento de código no se pasa del límite, pero da **interrupción por modo de acceso inválido**.

> **Segmentation fault no es page fault.** El segmentation fault es un **error**: la dirección se sale del segmento y el proceso normalmente termina. El [page fault](/teoria/parcial-2/memoria-virtual/) es de memoria virtual y **no es un error**: la página existe pero está en disco, el SO la trae y el proceso sigue.

### Cortar la dirección

Para traducir, primero hay que separar la DL en segmento y desplazamiento. Con la DL en binario (ver [Hexa ↔ binario](#hexa--binario)), los bits de arriba son el segmento y los de abajo, el desplazamiento.

**Si el corte cae justo entre dígitos hexa** (por ejemplo, 2 bits de segmento sobre 18 en total, o 4 sobre 16), ni hace falta pasar a binario: el primer dígito es el segmento y los demás, el desplazamiento.

**Si el corte cae en el medio de un dígito**, ese dígito queda partido. Ejemplo: 16 bits con **3 de segmento** y 13 de desplazamiento, DL `3ABC`:

```
3ABC = 0011 1010 1011 1100
       001 | 1 1010 1011 1100
       seg   desplazamiento (13 bits)
```

- Segmento: `001` = **1**.
- Desplazamiento: se agrupa de a 4 **desde la derecha** (`1100` = C, `1011` = B, `1010` = A) y el bit que sobra a la izquierda se completa con ceros (`1` → `0001` = 1). Queda **1ABC**.

Si se agrupa desde la izquierda da cualquier cosa. Atajo: con 3 bits de segmento sobre 16, solo se parte el **primer** dígito. Sus 3 bits de arriba son el segmento y el de abajo pasa al desplazamiento; los otros 3 dígitos se copian tal cual.

| Primer dígito | 0   | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | …   |
| ------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Segmento      | 0   | 0   | 1   | 1   | 2   | 2   | 3   | 3   | 4   | …   |
| Bit que pasa  | 0   | 1   | 0   | 1   | 0   | 1   | 0   | 1   | 0   | …   |

<p class="en-ejercicios">↳ En ejercicios: <a href="/metodologia/parcial-2/memoria-real/#dl-df-hexa">DL → DF en hexa</a> · <a href="/metodologia/parcial-2/memoria-real/#dl-df-decimal">DL → DF en decimal</a></p>

### Deducir cuántos bits son de segmento

A veces el enunciado no lo dice y da una pista del tipo _"la DL X pertenece al segmento N"_. Se pasa X a binario y se prueba tomando 1, 2, 3… bits de arriba hasta que den N.

Ejemplo: _"la DL `6004h` es del segmento 3"_, con 16 bits. `6004h` = `0110 0000 0000 0100`. Con 1 bit da `0`; con 2, `01` = 1; con 3, `011` = **3** ✓. Son **3 bits de segmento** y 13 de desplazamiento.

Hay que hacerlo **antes** de cualquier otra cuenta. Con un corte equivocado, una dirección se asigna al segmento que no es: `201Eh` con 2 bits sería segmento 0 con desplazamiento `201E`, y con 3 bits es segmento 1 con desplazamiento `01E`.

### Traducción inversa: reconstruir la tabla

Es la traducción al revés: el enunciado da traducciones ya hechas ("la DL X genera la DF Y") y pide la tabla de segmentos.

- **Base:** de `DF = base + desplazamiento` se despeja `base = DF − desplazamiento`. Ejemplo: si `4010h` (segmento 2, desplazamiento `0010h` con 3 bits de segmento) genera `7020h`, la base del segmento 2 es `7020h − 0010h` = **7010h**.
- **Límite** (dirección física final), según la pista que haya:
  - _"X anda y X + 1 da segmentation fault"_ → el último byte válido es la DF de X.
  - _"los segmentos A y B están adyacentes"_ (A antes que B) → A termina justo antes de que empiece B: `límite de A = base de B − 1`.
  - _"el segmento está al final de la memoria"_ → termina en la última dirección: `FFFFh` con 16 bits.
- **Permisos:** si _"escribir en X da modo de acceso inválido"_ y X está dentro del segmento, ese segmento no admite escritura. Si hay que adivinar cuál es, el que no se escribe es el de **código**: datos y pila se modifican todo el tiempo.

<p class="en-ejercicios">↳ En ejercicios: <a href="/metodologia/parcial-2/memoria-real/#reconstruir-tabla">Reconstruir la tabla de segmentos</a></p>

## Paginación

Tanto los procesos como la memoria se dividen en partes **del mismo tamaño**: **páginas** en el proceso y **frames** en la memoria (la cátedra a veces les dice **marcos**; en el sitio se usa siempre "frame"). Cualquier página puede ir a cualquier frame, y no hace falta que estén en orden ni contiguas. Cada proceso tiene una **tabla de páginas** que dice en qué frame está cada página.

- **Sin fragmentación externa:** un frame libre sirve para cualquier página.
- **Fragmentación interna solo en la última página** del proceso: como mucho, el tamaño de página − 1 byte.
- Cada acceso a un dato son **2 accesos a memoria**: uno a la tabla de páginas y otro al dato.
- Con una DL de `x` bits de página y `y` de desplazamiento: hasta 2<sup>x</sup> páginas por proceso, de 2<sup>y</sup> bytes.

### Cuántos bits tiene cada dirección

La cuenta va al revés de la de arriba: de cantidades y tamaños a bits. Para numerar `N` cosas hacen falta `log₂ N` bits (si `N` no es potencia de 2, se redondea para arriba: 20 páginas piden 5 bits).

| Parte                     | Bits                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Desplazamiento**        | `log₂(tamaño de página)`. Es igual en la DL y en la DF, porque página y frame miden lo mismo.                                                       |
| **Número de página**      | `log₂(cantidad de páginas)`; las páginas son `tamaño del espacio lógico / tamaño de página`.                                                        |
| **Número de frame**       | `log₂(cantidad de frames)`; los frames son `tamaño de la RAM / tamaño de página`. Es también lo que ocupa el campo de frame en la tabla de páginas. |
| **Dirección lógica (DL)** | página + desplazamiento = `log₂(tamaño del espacio lógico)`.                                                                                        |
| **Dirección física (DF)** | frame + desplazamiento = `log₂(tamaño de la RAM)`.                                                                                                  |

Ejemplo: páginas de 4 KiB (2<sup>12</sup> → 12 bits de desplazamiento), un espacio lógico de 16 páginas (4 bits) y una RAM de 256 KiB = 64 frames (6 bits). La DL tiene 4 + 12 = **16 bits** y la DF, 6 + 12 = **18 bits**.

Sin memoria virtual el proceso tiene que estar **entero** en RAM, así que el espacio lógico útil nunca supera al físico: la DL es **menor o igual** que la DF, y el programa más grande que se puede ejecutar es el **menor** entre 2<sup>bits de la DL</sup> y el tamaño de la RAM. La [memoria virtual](/teoria/parcial-2/memoria-virtual/) es justamente lo que permite una DL más larga que la DF.

<p class="en-ejercicios">↳ En ejercicios: <a href="/metodologia/parcial-2/memoria-real/#formato-direccion">Formato de la dirección</a></p>

### Traducción

La página se reemplaza por el frame y el desplazamiento **se copia igual**: en binario es concatenar, no sumar. En decimal: `DF = frame × tamaño de página + desplazamiento`. Si la DL viene en decimal, `DL / tamaño de página` da el número de página y el **resto** es el desplazamiento.

**En decimal, cortar es dividir.** Los cuatro pasos:

| Paso                | Cuenta                                                       |
| ------------------- | ------------------------------------------------------------ |
| 1. Número de página | `DL ÷ tamaño de página`, división **entera** (sin decimales) |
| 2. Desplazamiento   | el **resto** de esa división                                 |
| 3. Frame            | se busca en la tabla de páginas con el número de página      |
| 4. Dirección física | `frame × tamaño de página + desplazamiento`                  |

Ejemplo con páginas de 1024 bytes y DL **2100**:

1. 2100 ÷ 1024 = **2** (2 × 1024 = 2048 entra; 3 × 1024 = 3072 se pasa).
2. Resto: 2100 − 2048 = **52**.
3. Si la tabla dice que la página 2 está en el frame 3…
4. …la DF es 3 × 1024 + 52 = **3124**.

Si en el paso 3 la página no tiene frame ("–" o bit de presencia en 0), no hay DF: con memoria virtual es un **page fault**.

Para no dividir cada vez, sirve armar la lista de rangos y ver en cuál cae cada dirección:

```
página 0:    0 – 1023
página 1: 1024 – 2047
página 2: 2048 – 3071
página 3: 3072 – 4095
…
```

```recorrido traduccion-paginacion

```

### Protección y compartición

- Se pueden poner permisos por página, pero cuesta, porque la división no respeta dónde termina el código y empieza la pila.
- Cada entrada tiene un **bit de válido/inválido** (presencia).
- **Compartir es muy simple:** alcanza con que las tablas de dos procesos apunten al **mismo frame**, aunque sea con distinto número de página. Así se comparte una biblioteca.
- Para saber qué frames están libres, el SO usa una estructura aparte; lo más cómodo es un **bitmap**, un bit por frame.

## Segmentación paginada

Intenta quedarse con lo mejor de los dos esquemas: el proceso se divide en segmentos y **cada segmento se pagina**. Hay una tabla de segmentos por proceso y una tabla de páginas por segmento; la dirección lógica es `(segmento, página, desplazamiento)`.

```recorrido segmentacion-paginada

```

No tiene fragmentación externa y los permisos se ponen bien (por segmento), pero tiene más overhead: son 3 accesos a memoria, y fragmentación interna en la última página de **cada** segmento.

<p class="en-ejercicios">↳ En ejercicios: <a href="/metodologia/parcial-2/memoria-real/#df-dl">DF → DL</a> · <a href="/metodologia/parcial-2/memoria-real/#dl-df-hexa">DL → DF en hexa</a></p>

## Comparación

| Esquema                   | Estructuras del SO                                     | Overhead                | Accesos a memoria | Fragmentación                                 | Grado de multiprogramación limitado por |
| ------------------------- | ------------------------------------------------------ | ----------------------- | ----------------- | --------------------------------------------- | --------------------------------------- |
| **Particiones fijas**     | Tabla global de particiones                            | Muy bajo                | 2                 | Interna                                       | La cantidad de particiones              |
| **Particiones dinámicas** | Tabla de particiones + tabla de huecos                 | Muy alto si se compacta | 2                 | Externa                                       | La RAM                                  |
| **Buddy system**          | Lista de bloques libres + tabla de ocupados            | Alto                    | 2                 | Interna y externa (poca)                      | La RAM                                  |
| **Segmentación**          | Tabla de segmentos por proceso                         | Medio                   | 2                 | Externa                                       | La RAM                                  |
| **Paginación**            | Tabla de páginas por proceso (+ frames libres)         | Bajo                    | 2                 | Interna, en la última página                  | La cantidad de páginas por proceso      |
| **Segmentación paginada** | Tabla de segmentos + una tabla de páginas por segmento | Medio-alto              | 3                 | Interna, en la última página de cada segmento | La cantidad de páginas por proceso      |

En la tabla de la cátedra solo la paginación y la segmentación paginada figuran como aptas para **compartir** memoria. La bibliografía también muestra segmentos compartidos; en un multiple choice, conviene seguir a la cátedra. Y en cualquier esquema, el grado de multiprogramación termina limitado por el tamaño de la RAM.

## Preguntas de parcial

**1. ¿Qué diferencia hay entre fragmentación interna y externa? ¿Qué esquemas tienen cada una?**

> La interna es memoria asignada a un proceso que no usa (y nadie más puede usar): la tienen las particiones fijas, el buddy system y la paginación (en la última página). La externa es memoria libre suficiente pero partida en huecos no contiguos: la tienen las particiones dinámicas, la segmentación y, en menor medida, el buddy system. La paginación no tiene externa porque cualquier frame libre sirve.

**2. ¿Por qué el address binding en tiempo de ejecución es el que permite reubicar procesos? ¿Quién paga su costo?**

> Porque la dirección se traduce en cada acceso: si el proceso se mueve, alcanza con cambiar el registro de reubicación (o la tabla de páginas o segmentos). En compilación o en carga, la dirección física queda fija en el código. El costo de traducir lo paga el hardware (la MMU), no la CPU.

**3. Con páginas de 4 KiB, ¿a qué dirección física corresponde la lógica 10832 si la página 2 está en el frame 9?**

> 10832 / 4096 = 2, con resto 2640: página 2, desplazamiento 2640. La física es 9 × 4096 + 2640 = 39504. En hexa: 0x2A50 → 0x9A50; el desplazamiento (0xA50) se copia igual.

**4. ¿Qué diferencia la traducción en segmentación de la de paginación?**

> En segmentación se suma el desplazamiento al inicio del segmento y se valida contra el límite, porque los segmentos son de tamaño variable. En paginación todas las páginas miden lo mismo, así que se reemplaza el número de página por el de frame y el desplazamiento se concatena; no puede pasarse de la página.

**5. ¿La compactación resuelve la fragmentación interna?**

> No. Junta los huecos libres, que son la fragmentación externa. Lo que sobra adentro de una partición sigue asignado a su proceso.

**6. ¿Por qué el buddy system tiene fragmentación interna y externa a la vez?**

> Interna, porque redondea cada pedido a una potencia de 2 (un proceso de 200 MB ocupa un bloque de 256). Externa, porque dos bloques libres que no son compañeros no se pueden unir aunque estén al lado.

_Fuente: PPT Memoria Real de la cátedra y Sistemas Operativos for Dummies (págs. 71–84)._
