---
tipo: dominio
aliases: [convenciones, cátedra, catedra, desempate, tie-break, simultaneidad, reglas de oro, semáforos, utn, frba, parciales, resoluciones]
tags: [dominio, catedra]
actualizado: 2026-11-03
---

# Convenciones de la Cátedra FRBA

**Qué es:** criterios que la cátedra fija en las guías y en las **resoluciones oficiales de parciales**,
y que cambian el resultado de un ejercicio.

**Fuente de verdad:** `src/lib/simuladores/planificacion/catedra.test.ts` compara el simulador contra
7 Gantt de resoluciones oficiales (1C2024–1C2026). Si cambiás el simulador y uno falla, el que está
mal es el simulador. El relevamiento completo de 13 parciales (transcripción, catálogo sin repetidos,
convenciones citadas examen por examen) está **fuera del repo** —tiene material de cátedra— en la
carpeta de trabajo local `Sistemas Operativos/Claude/relevamiento-parciales/`.

## Planificación

Si varios procesos llegan a listos **en el mismo instante**, entran en este orden (guía, y explícito
en 1P 2C2025 TT):

1. Interrupción de clock (fin de quantum) → en código `origen: 'desalojo'`
2. Fin de evento (E/S) → `'io'`
3. Llamada al sistema, proceso nuevo → `'nuevo'`
4. Si sigue el empate: nombre / número ascendente (en parciales: "listos en orden numérico").

Implementado en `DESEMPATE_DEFAULT` de `simular.ts`. Confirmado por las resoluciones:

- Si vence el quantum y no hay nadie más listo, **sigue el mismo**.
- E/S: **un único dispositivo FIFO** salvo aclaración (nunca hay dos E/S simultáneas en ninguna
  resolución) → `ioUnica: true`. Esperar el dispositivo **no** cuenta como espera en Ready.
- Prioridad: **menor número = mayor prioridad** (explícito en tres enunciados).
- SJF/SRT: un **empate no desaloja**; al agotarse la estimación el proceso **sigue** hasta terminar su
  ráfaga real; SRT desaloja solo ante alguien con estimación **estrictamente** menor.
- ⚠️ **Estimador: la fórmula cambia entre exámenes.** La guía usa α sobre la estimación anterior
  (default del simulador); 1R 1C2025 TM y 1R 1C2026 TM usan α sobre la ráfaga **real** →
  `alfaSobre: 'real'`. Con α = 0,5 dan igual. **Cargar siempre la que diga el enunciado.**
- VRR: quantum remanente (Stallings); la cola auxiliar va antes que la común; si el proceso usó el
  quantum **completo** antes de la E/S, vuelve a la cola **común**.
- Multinivel / feedback: ⚠️ el **desalojo entre colas no es regla de la cátedra** (el Ej. 10 de la guía asume desalojo y lo aclara con una nota visible): el único Gantt
  oficial lo aclara en el enunciado, y un diseño oficial dice "sin desalojo entre colas". Es parámetro
  (`desalojoEntreColas`) y cada ejercicio tiene que decirlo. Un proceso que vuelve a la **misma** cola
  del que ejecuta no lo desaloja.
- Otras decisiones donde la guía no dice nada (afinidad dura, etc.): [[Simulador de Planificación]].

## Sincronización (Guía v.2C2026, "Tips")

- Solo WAIT/SIGNAL, **todo semáforo inicializado**, nunca en negativo.
- Un mutex por recurso compartido; los de orden entre tareas suelen arrancar en 0.
- Importa el orden de los WAIT, no el de los SIGNAL.
- Tope de M instancias: WAIT antes de depositar, inicializado en M. Contar instancias: SIGNAL después
  de depositar, WAIT antes de consumir, inicializado en 0.
- En parciales: el valor negativo de un semáforo = cantidad de bloqueados en él.
- Un mutex sobra si los semáforos de orden ya impiden el acceso simultáneo (resoluciones 1C2026).
- Inversión de prioridades → **herencia de prioridades** (1C2026). El Resumen dice "pasar a VRR":
  la teoría del sitio da la de la cátedra y menciona la del Resumen.

## Deadlock

Livelock, deadlock, inanición y espera activa son conceptos distintos; 4 estrategias: prevención,
evasión, detección y recupero, no hacer nada. En las resoluciones, solo los procesos del **ciclo**
están en deadlock; un bloqueado que espera algo del ciclo sin retener nada "sufre inanición".
Flexibilidad: prevención baja, **evasión media** (solo exige declarar máximos), detección alta.

## Memoria (PPTs Memoria Real y Memoria Virtual)

- **Vocabulario: "frame", no "marco".** Es lo que domina en el Resumen y la PPT de Memoria Real; la
  guía 2016 y la PPT de Virtual mezclan. Teoría, resoluciones y recorridos dicen "frame"; los
  enunciados transcriptos quedan textuales (la guía dice "marcos" en los Ej. 7 y 8).
- **Reemplazo:** los PF de la carga inicial **cuentan** ("3 PF + N PF = total"). Tabla: una fila por
  marco, columna inicial con "–", "PF" abajo de cada fallo y el puntero marcado en FIFO y clock.
  Secuencia de clase `2 3 2 1 5 2 4 5 3 2 5 2` con 3 marcos: Óptimo 6, LRU 7, Clock 8, FIFO 9.
- **Clock:** entra con U = 1, el puntero va al marco siguiente, un acierto no lo mueve. Se anota
  "2 U". **Clock mejorado:** pasada 1 busca (0,0) sin tocar bits; pasada 2 busca (0,1) bajando U.
- **Segmentación:** la columna "límite" es la **dirección final** del segmento, no el tamaño;
  `DF > límite` ⇒ segmentation fault. Direcciones en **hexa**.
- **Accesos a memoria:** 2 en todos los esquemas, 3 en segmentación paginada; jerárquica = niveles + 1.
- **Page fault:** 1 acceso a disco con marco libre o víctima con M = 0; 2 con víctima modificada.
- **Asignación fija + reemplazo global = "No es posible".**
- **Compartición:** la tabla resumen solo marca aptas paginación y segmentación paginada
  (segmentación pura con "x"); la teoría lo aclara.
- Errata de la PPT: en el ejemplo de particionamiento dinámico los inicios de la tabla están corridos;
  el recorrido usa los tamaños. Las PPTs y el resumen **no** traen EAT, working set, PFF ni el
  ejemplo de Belady: en la teoría van marcados como "Complemento (Stallings)".

### Guía de Ejercicios de Memoria (2016)

Decisiones al resolverla (no hay resolución oficial en el repo):

- La guía usa **"Largo"** en las tablas de segmentos (Ej. 3 y 4): se valida `desplazamiento < largo`.
  Donde pide "límite" (Ej. 11) se usa el de la cátedra: dirección física final.
- Mezcla **KB/KiB/Kb**: "64Kb" (Ej. 6) se toma como 64 KiB.
- **Dirección fuera del proceso** (Ej. 9: 172100 cae en la página 21 de un proceso de 20): error de
  dirección inválida, **no** es PF, no carga nada y el proceso **sigue** con la referencia siguiente.
- **Accesos con TLB** (Ej. 10): 1 a la TLB por referencia; acierto = 1 a memoria; fallo = 2 (tabla +
  dato); PF = +1 a disco (+1 más si la víctima tiene M = 1).

## File System (PPTs FileSystem y FAT-UFS)

Criterios de las resoluciones de 2dos parciales (1C2024–1C2026); los vigila
`src/lib/diagramas/filesystem.test.ts`.

- **FAT32 usa 28 bits** de las 32 de la entrada, también para el espacio **teórico**:
  teórico = `2^28 × cluster`; real = mínimo con el tamaño del disco (1R 2C2024, 1C2026 TT, 1R 2C2025).
- **Tamaño de la FAT** = clusters reales del disco × tamaño de entrada (1R 1C2025, 1R 1C2026). La
  PPT lo calcula con el máximo (`2^28 × 4 B`); la teoría dice "como máximo".
- **Archivo máximo en FAT = FS máximo**, sin el tope de 4 GiB (2C2024 TT). La PPT (diap. 20) dice
  4 GiB por el campo de tamaño de la entrada de directorio: los ejercicios lo aclaran en una nota.
- **Accesos en UFS/ext2:** se cuentan bloques de **punteros + datos**; el **inodo no**, porque el
  archivo ya está abierto. PD = 1, IS = 2, ID = 3, IT = 4. Bytes y bloques desde 0,
  `bloque = byte div tamaño de bloque` (1C2025 TM, 1C2026 TM, 1C2024 TM, 2C2025 TT, 1R 2C2024).
- **ext2 FS teórico** = `2^(bits del puntero) × bloque`; real = mínimo con el disco.
- **Inodo por defecto:** 12 PD + IS + ID + IT si el enunciado no dice otra cosa (la PPT usa 4 PD).
- **Clasificación:** FAT = asignación **encadenada** con la tabla aparte (algún parcial la llama
  "enlazada-indexada"); ext2 = **indexada** con indirecciones.
- **Partición ≠ volumen:** el volumen es la partición con un FS instalado.

### Guía de Ejercicios de File System (2016)

- Ej. 2b dice "128 Mib": se toma MiB; en c.2 "alto tiempo de respuesta" = responder rápido.
- Ej. 3c: bits desperdiciados = `32 − 21` = 11 (4 reservados del formato + 7 que sobran por disco chico).
- Ej. 3b pide el porcentaje **exacto** (0,09765625): el verificador de `calculos` no tiene tolerancia.
- Ej. 8a: el mínimo literal es **1 puntero** (un indirecto triple); eso le da sentido al inciso b.
- Ej. 11: `/etc/alternatives` en el mismo volumen en c); d) y e) se resuelven con hard link.

## Formato de respuestas

V/F: se responde **FALSO** o **VERDADERO** seguido de la justificación.

**Conectado con:** [[Dominio SO]], [[Simulador de Planificación]], [[Verificador de Semáforos]]
