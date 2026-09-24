---
tipo: dominio
aliases: [convenciones, cátedra, catedra, desempate, tie-break, simultaneidad, reglas de oro, semáforos, utn, frba, parciales, resoluciones]
tags: [dominio, catedra]
actualizado: 2026-09-23
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

## Deadlock

Livelock, deadlock, inanición y espera activa son conceptos distintos; 4 estrategias: prevención,
evasión, detección y recupero, no hacer nada. En las resoluciones, solo los procesos del **ciclo**
están en deadlock; un bloqueado que espera algo del ciclo sin retener nada "sufre inanición".

## Formato de respuestas

V/F: se responde **FALSO** o **VERDADERO** seguido de la justificación.

**Conectado con:** [[Dominio SO]], [[Simulador de Planificación]], [[Verificador de Semáforos]]
