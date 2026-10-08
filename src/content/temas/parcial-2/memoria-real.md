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

## Particionamiento fijo

La memoria se divide **una vez** en particiones, todas del mismo tamaño o de tamaños distintos, y no cambia más. Cada proceso tiene que entrar **entero y contiguo** en una partición de tamaño mayor o igual. El SO lleva una tabla con cada partición, si está libre u ocupada y, si son distintas, su tamaño.

- **Grado de multiprogramación fijo:** a lo sumo tantos procesos como particiones.
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

Cuando hay varios huecos donde entra el proceso, el SO elige uno con alguno de estos criterios:

| Algoritmo            | Elige                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Primer ajuste**    | El primer hueco donde entra, buscando desde el comienzo.     |
| **Siguiente ajuste** | El primero donde entra, buscando desde la última asignación. |
| **Mejor ajuste**     | El hueco más chico donde entra.                              |
| **Peor ajuste**      | El hueco más grande.                                         |

```recorrido algoritmos-ubicacion

```

Según el resumen de la cátedra, el mejor ajuste es el que **peor** fragmentación externa crea (deja huecos tan chicos que no sirven para nada) y el peor ajuste el que menos crea (lo que sobra todavía sirve).

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
- Cada segmento puede tener permisos de **lectura (R), escritura (W) y ejecución (X)**: lo típico es código RX, datos y pila RW.
- Sin fragmentación interna; con fragmentación **externa**, aunque menos que el particionamiento dinámico porque se ubican pedazos y no procesos enteros.

```recorrido traduccion-segmentacion

```

## Paginación

Tanto los procesos como la memoria se dividen en partes **del mismo tamaño**: **páginas** en el proceso y **marcos** (frames) en la memoria. Cualquier página puede ir a cualquier marco, y no hace falta que estén en orden ni contiguas. Cada proceso tiene una **tabla de páginas** que dice en qué marco está cada página.

- **Sin fragmentación externa:** un marco libre sirve para cualquier página.
- **Fragmentación interna solo en la última página** del proceso: como mucho, el tamaño de página − 1 byte.
- Cada acceso a un dato son **2 accesos a memoria**: uno a la tabla de páginas y otro al dato.
- Con una DL de `x` bits de página y `y` de desplazamiento: hasta 2<sup>x</sup> páginas por proceso, de 2<sup>y</sup> bytes.

### Traducción

La página se reemplaza por el marco y el desplazamiento **se copia igual**: en binario es concatenar, no sumar. En decimal: `DF = marco × tamaño de página + desplazamiento`. Si la DL viene en decimal, `DL / tamaño de página` da el número de página y el **resto** es el desplazamiento.

```recorrido traduccion-paginacion

```

### Protección y compartición

- Se pueden poner permisos por página, pero cuesta, porque la división no respeta dónde termina el código y empieza la pila.
- Cada entrada tiene un **bit de válido/inválido** (presencia).
- **Compartir es muy simple:** alcanza con que las tablas de dos procesos apunten al **mismo marco**, aunque sea con distinto número de página. Así se comparte una biblioteca.
- Para saber qué marcos están libres, el SO usa una estructura aparte; lo más cómodo es un **bitmap**, un bit por marco.

## Segmentación paginada

Intenta quedarse con lo mejor de los dos esquemas: el proceso se divide en segmentos y **cada segmento se pagina**. Hay una tabla de segmentos por proceso y una tabla de páginas por segmento; la dirección lógica es `(segmento, página, desplazamiento)`.

```recorrido segmentacion-paginada

```

No tiene fragmentación externa y los permisos se ponen bien (por segmento), pero tiene más overhead: son 3 accesos a memoria, y fragmentación interna en la última página de **cada** segmento.

## Comparación

| Esquema                   | Estructuras del SO                                     | Overhead                | Accesos a memoria | Fragmentación                                 | Grado de multiprogramación limitado por |
| ------------------------- | ------------------------------------------------------ | ----------------------- | ----------------- | --------------------------------------------- | --------------------------------------- |
| **Particiones fijas**     | Tabla global de particiones                            | Muy bajo                | 2                 | Interna                                       | La cantidad de particiones              |
| **Particiones dinámicas** | Tabla de particiones + tabla de huecos                 | Muy alto si se compacta | 2                 | Externa                                       | La RAM                                  |
| **Buddy system**          | Lista de bloques libres + tabla de ocupados            | Alto                    | 2                 | Interna y externa (poca)                      | La RAM                                  |
| **Segmentación**          | Tabla de segmentos por proceso                         | Medio                   | 2                 | Externa                                       | La RAM                                  |
| **Paginación**            | Tabla de páginas por proceso (+ marcos libres)         | Bajo                    | 2                 | Interna, en la última página                  | La cantidad de páginas por proceso      |
| **Segmentación paginada** | Tabla de segmentos + una tabla de páginas por segmento | Medio-alto              | 3                 | Interna, en la última página de cada segmento | La cantidad de páginas por proceso      |

En la tabla de la cátedra solo la paginación y la segmentación paginada figuran como aptas para **compartir** memoria. La bibliografía también muestra segmentos compartidos; en un multiple choice, conviene seguir a la cátedra. Y en cualquier esquema, el grado de multiprogramación termina limitado por el tamaño de la RAM.

## Preguntas de parcial

**1. ¿Qué diferencia hay entre fragmentación interna y externa? ¿Qué esquemas tienen cada una?**

> La interna es memoria asignada a un proceso que no usa (y nadie más puede usar): la tienen las particiones fijas, el buddy system y la paginación (en la última página). La externa es memoria libre suficiente pero partida en huecos no contiguos: la tienen las particiones dinámicas, la segmentación y, en menor medida, el buddy system. La paginación no tiene externa porque cualquier marco libre sirve.

**2. ¿Por qué el address binding en tiempo de ejecución es el que permite reubicar procesos? ¿Quién paga su costo?**

> Porque la dirección se traduce en cada acceso: si el proceso se mueve, alcanza con cambiar el registro de reubicación (o la tabla de páginas o segmentos). En compilación o en carga, la dirección física queda fija en el código. El costo de traducir lo paga el hardware (la MMU), no la CPU.

**3. Con páginas de 4 KiB, ¿a qué dirección física corresponde la lógica 10832 si la página 2 está en el marco 9?**

> 10832 / 4096 = 2, con resto 2640: página 2, desplazamiento 2640. La física es 9 × 4096 + 2640 = 39504. En hexa: 0x2A50 → 0x9A50; el desplazamiento (0xA50) se copia igual.

**4. ¿Qué diferencia la traducción en segmentación de la de paginación?**

> En segmentación se suma el desplazamiento al inicio del segmento y se valida contra el límite, porque los segmentos son de tamaño variable. En paginación todas las páginas miden lo mismo, así que se reemplaza el número de página por el de marco y el desplazamiento se concatena; no puede pasarse de la página.

**5. ¿La compactación resuelve la fragmentación interna?**

> No. Junta los huecos libres, que son la fragmentación externa. Lo que sobra adentro de una partición sigue asignado a su proceso.

**6. ¿Por qué el buddy system tiene fragmentación interna y externa a la vez?**

> Interna, porque redondea cada pedido a una potencia de 2 (un proceso de 200 MB ocupa un bloque de 256). Externa, porque dos bloques libres que no son compañeros no se pueden unir aunque estén al lado.

_Fuente: PPT Memoria Real de la cátedra y Sistemas Operativos for Dummies (págs. 71–84)._
