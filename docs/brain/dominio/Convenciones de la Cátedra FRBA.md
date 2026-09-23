---
tipo: dominio
aliases: [convenciones, cátedra, catedra, desempate, tie-break, simultaneidad, reglas de oro, semáforos, utn, frba]
tags: [dominio, catedra]
actualizado: 2026-09-23
---

# Convenciones de la Cátedra FRBA

**Qué es:** criterios que la cátedra fija en las guías y que cambian el resultado de un ejercicio.

## Planificación (Guía v.2C2026, "Aclaraciones")

Si varios procesos llegan a listos **en el mismo instante**, entran en este orden:

1. Interrupción de clock (fin de quantum) → en código `origen: 'desalojo'`
2. Fin de evento (E/S) → `'io'`
3. Llamada al sistema, proceso nuevo → `'nuevo'`
4. Si sigue el empate: nombre en orden ascendente.

Ante empate del criterio del algoritmo (dos ráfagas iguales en SJF, etc.) se aplica FIFO con esos
mismos criterios. Implementado en `DESEMPATE_DEFAULT` de `simular.ts`.

- E/S: un único dispositivo salvo aclaración → `ioUnica: true`.
- Prioridad: menor número = mayor prioridad (inferido, ver [[Simulador de Planificación]]).
- Estimación SJF: la guía usa `T_i = T_{i-1}·α + R_{i-1}·(1−α)` y el resumen
  `EST(n+1) = α·TE(n) + (1−α)·EST(n)`; con α = 0,5 dan lo mismo. Con otro α, confirmar cuál aplica.

## Sincronización (Guía v.2C2026, "Tips")

- Solo WAIT/SIGNAL, **todo semáforo inicializado**, nunca en negativo.
- Un mutex por recurso compartido; los de orden entre tareas suelen arrancar en 0.
- Importa el orden de los WAIT, no el de los SIGNAL.
- Tope de M instancias: WAIT antes de depositar, inicializado en M. Contar instancias: SIGNAL después
  de depositar, WAIT antes de consumir, inicializado en 0.

## Deadlock

Livelock, deadlock, inanición y espera activa son conceptos distintos; 4 estrategias: prevención,
evasión, detección y recupero, no hacer nada.

**Conectado con:** [[Dominio SO]], [[Simulador de Planificación]]
