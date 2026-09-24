---
titulo: Repaso de arquitectura
parcial: 1
orden: 1
resumen: Registros de la CPU, instrucciones privilegiadas, ciclo de instrucción, interrupciones y jerarquía de memoria.
aliases: [arquitectura, registros, interrupciones, ciclo de instrucción, PSW]
---

Antes de meternos con el sistema operativo conviene repasar el hardware sobre el que corre. Casi todo lo que se ve después (modos de ejecución, cambios de contexto, planificación, condiciones de carrera) se explica a partir de tres ideas de este tema: qué guarda cada registro, cómo avanza el ciclo de instrucción y cómo hace una interrupción para cortarlo.

## Componentes básicos

| Componente                  | Qué hace                                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Procesador**              | Tiene registros, una ALU que opera sobre los datos y una unidad de control que coordina todo.                   |
| **Memoria principal (RAM)** | Un arreglo lineal de direcciones. Solo se puede ejecutar lo que está cargado en RAM.                            |
| **Módulos de E/S**          | Conectan la computadora con discos, red, teclado, etc.                                                          |
| **Bus**                     | Mueve información entre CPU, memoria y E/S. Se divide en bus de **datos**, de **direcciones** y de **control**. |

## Registros

Los registros son la memoria más rápida que existe, y está dentro del procesador. Hay dos familias:

- **Visibles al usuario (de uso general)**: el programa los lee y escribe, directa o indirectamente. Por ejemplo AX o BX, donde queda el resultado de una cuenta.
- **De control y estado**: el programador no puede modificarlos (a lo sumo consultarlos). Los usan el hardware y el SO.

| Registro                          | Contenido                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **PC** (Program Counter)          | Dirección de la **próxima** instrucción a ejecutar.                                                                   |
| **IR** (Instruction Register)     | La instrucción que se está ejecutando (la instrucción en sí, no su dirección).                                        |
| **MAR** (Memory Address Register) | Dirección de memoria que se va a leer o escribir.                                                                     |
| **MBR** (Memory Buffer Register)  | El dato leído o por escribir en la dirección que indica el MAR.                                                       |
| **PSW** (Program Status Word)     | Flags de la última operación (carry, overflow, cero…), bit de **modo de ejecución** y habilitación de interrupciones. |

> El PSW aparece todo el tiempo en el parcial: ahí se consulta si la CPU está en modo usuario o kernel, y es de lo primero que se guarda (junto con el PC) cuando llega una interrupción.

## Instrucciones

Una línea de código de alto nivel suele traducirse en **varias** instrucciones de máquina. Por ejemplo, `i = i + 1` queda así:

```text
MOV AC, [100Ah]   ; trae i de memoria al acumulador
ADD AC, 1         ; le suma 1
MOV [100Ah], AC   ; guarda el resultado en memoria
```

Esto importa mucho en sincronización: una interrupción puede caer entre cualquiera de esas tres instrucciones y otro proceso puede meterse en el medio.

Según quién puede ejecutarlas, las instrucciones son:

- **No privilegiadas**: cualquier programa (`MOV`, `ADD`, `SUB`, `JZ`, `JNZ`, `CALL`…).
- **Privilegiadas**: solo en modo kernel, o sea solo el SO. Por ejemplo habilitar o deshabilitar interrupciones (`STI`, `CLI`), detener la CPU (`HLT`) y operar directamente sobre dispositivos.

## Ciclo de instrucción

En su versión simplificada, la CPU repite sin parar tres etapas:

1. **Fetch**: usa el PC para traer de memoria la próxima instrucción.
2. **Decode**: la interpreta (qué operación es y qué operandos usa) y la deja en el IR.
3. **Execute**: la ejecuta.

Después el PC avanza a la siguiente instrucción, salvo que haya un salto (`JMP`, `CALL`…), en cuyo caso toma la dirección destino.

### Con interrupciones

El ciclo real le agrega una cuarta etapa, la **etapa de interrupción**, que ocurre **después de terminar** cada instrucción. Fetch, decode y execute no se cortan a la mitad.

```diagrama ciclo-instruccion

```

En esa etapa, la CPU:

1. Revisa si hay una interrupción **no enmascarable**. Si la hay, la atiende sí o sí.
2. Si no hay, se fija si las enmascarables están habilitadas y si hay alguna pendiente.
3. Si no hay nada que atender, sigue con la próxima instrucción.

## Interrupciones

Una **interrupción** es un aviso por hardware de que ocurrió un evento (terminó una E/S, venció el quantum, hubo un error…). Siempre se atiende **en modo kernel**, porque la rutina de atención es código del SO. Todas las interrupciones terminan siendo atendidas en algún momento.

### Clasificaciones

| Criterio     | Tipos                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Origen       | **Hardware** (externas a la CPU) / **Software** (las genera la propia CPU al ejecutar, como una división por cero).                                                             |
| Postergables | **Enmascarables** (se pueden ignorar por un rato, no son críticas) / **No enmascarables** (críticas, se atienden ya, como las fallas de hardware).                              |
| Momento      | **Sincrónicas** (consecuencia de la instrucción que se ejecuta) / **Asincrónicas** (llegan en cualquier momento desde afuera).                                                  |
| Causa        | **De E/S** (terminó un evento de un dispositivo), **de clock** (sirve para desalojar al proceso y es la base de la multiprogramación), **fallas de hardware**, **excepciones**. |

Las **excepciones** vienen de errores o situaciones anómalas del programa, como un fallo de página. El resumen de la cátedra las ubica como las de mayor prioridad. Se dividen en:

- **Aborts**: error grave, no se puede seguir.
- **Fallos (faults)**: se corrigen y la instrucción se reintenta. El fallo de página es el ejemplo típico.
- **Traps**: se usan, por ejemplo, para debugging.

### Qué pasa cuando llega una interrupción

**Parte del hardware:**

1. Se produce la interrupción (puede ser en cualquier momento).
2. La CPU termina la instrucción en curso.
3. Detecta que hay una interrupción y de qué dispositivo viene.
4. Guarda el **PC** y el **PSW** del programa interrumpido.
5. Carga en el PC la dirección del **manejador de interrupciones**. A partir de acá ejecuta el SO, en modo kernel.

**Parte del SO (manejador):**

6. Guarda el resto de los registros.
7. Si corresponde, deshabilita las interrupciones.
8. Atiende la interrupción.
9. Restaura los registros.
10. Restaura **primero el PSW y después el PC**: apenas se restaura el PC, la CPU sigue ejecutando el programa, así que el PSW tiene que estar listo antes.
11. Vuelve a habilitar las interrupciones.

### Interrupciones múltiples

Si llega una interrupción mientras se atiende otra, hay tres estrategias posibles:

- **Secuencial**: se atienden en orden de llegada, una atrás de la otra.
- **Por prioridad**: una de mayor prioridad puede interrumpir el manejador de una de menor prioridad.
- **Deshabilitar**: mientras se procesa una, no se aceptan otras.

## Jerarquía de memoria

Las memorias forman una pirámide. Arriba están las más rápidas, chicas y caras; abajo, las más lentas, grandes y baratas.

| Nivel                     | Ejemplo          | Volátil |
| ------------------------- | ---------------- | ------- |
| Registros                 | Dentro de la CPU | Sí      |
| Caché                     | L1/L2/L3         | Sí      |
| Memoria principal         | RAM              | Sí      |
| Almacenamiento secundario | Disco, SSD       | No      |
| Almacenamiento terciario  | Cintas, ópticos  | No      |

- **Volátil**: la información se pierde al cortar la energía.
- **No volátil**: la información se conserva.
- **Suspender** la máquina significa mantener energizada (o volcar) la memoria para poder retomar el estado al "despertar".

## Preguntas de parcial

**1. ¿En qué consiste el ciclo de ejecución de una instrucción? ¿Puede surgir una interrupción como consecuencia de ese ciclo?**

> El ciclo es fetch (traer la instrucción que indica el PC), decode (interpretarla y dejarla en el IR) y execute (ejecutarla), seguido de la verificación de interrupciones pendientes. Sí puede surgir una interrupción por el propio ciclo: son las interrupciones de software o sincrónicas. Ejemplos: una división por cero durante el execute, o un fallo de página al buscar la instrucción o un operando.

**2. ¿Por qué se restaura el PSW antes que el PC al volver de una interrupción?**

> Porque en cuanto se restaura el PC, la CPU retoma el programa interrumpido. Si el PSW todavía no estuviera restaurado, el programa seguiría con flags o un modo de ejecución equivocados (por ejemplo, en modo kernel).

**3. ¿Una interrupción puede cortar una instrucción a la mitad?**

> No. Fetch, decode y execute forman una unidad. La CPU recién revisa si hay interrupciones pendientes cuando termina la instrucción en curso.

_Fuente: Sistemas Operativos for Dummies (págs. 3–8)._
