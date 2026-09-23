---
tipo: servicio
aliases: [planificación, planificacion, scheduler, scheduling, gantt, simularPlanificacion, fifo, sjf, srt, rr, round robin, hrrn, prioridades]
tags: [simulador, planificacion]
actualizado: 2026-09-23
---

# Simulador de Planificación

**Propósito:** simular la planificación de corto plazo tick a tick y producir el Gantt + métricas.
**Ubicación:** `src/lib/simuladores/planificacion/` (`simular.ts`, `pasos.ts`, `tipos.ts`,
`simular.test.ts`); visualizador `src/lib/visualizers/gantt.ts`.

**Uso** (desde el frontmatter de un ejercicio):

```yaml
simulaciones:
  - kind: planificacion
    etiqueta: a. Con desalojo
    algoritmo: srt # fifo | sjf | srt | rr | prioridades | prioridades-desalojo | hrrn
    quantum: 3 # solo rr
    ioUnica: true # default
    procesos:
      - { id: A, llegada: 0, rafagas: [5, 1, 3], prioridad: 1 } # CPU, E/S, CPU…
```

## Modelo de un tick

Cada tick `t` representa el intervalo `[t, t+1)`. Orden dentro del tick:

1. Entran a listos los **pendientes** del instante `t` (llegadas + fines de E/S + fin de quantum),
   ordenados por el desempate de la cátedra (ver [[Convenciones de la Cátedra FRBA]]).
2. Si el algoritmo desaloja (SRT, prioridades con desalojo) y hay alguien estrictamente mejor que el
   que ejecuta, lo desaloja; el desalojado va al final de listos.
3. Si la CPU está libre, se elige de listos. **Empate del criterio → el primero de la cola**, que ya
   refleja simultaneidad y orden alfabético.
4. Con `ioUnica`, si el dispositivo está libre toma el primero de la cola de E/S.
5. Se ejecuta: suman espera los que están en listos; la CPU y la E/S descuentan 1.
6. Al final (`t+1`): fin de ráfaga de CPU → E/S o fin; fin de E/S → pendiente para `t+1`;
   quantum agotado → pendiente con origen `desalojo`.

## Decisiones y gotchas

- **`ioUnica` es default `true`**: la guía trata la E/S como un único dispositivo salvo que diga lo
  contrario (el Ej. 2 recién introduce dos dispositivos distintos).
- **Prioridad:** número menor = mayor prioridad (`prioridadMenorEsMejor`). La guía no lo explicita;
  se infiere del Ej. 10 ("prioridad < 1 = crítico").
- **HRRN:** `w` se mide desde que el proceso entró a listos _por última vez_; `s` es la ráfaga
  completa actual.
- **Espera** = ticks en la cola de listos (no incluye esperar el dispositivo de E/S).
- **Respuesta** = primer instante en CPU − llegada.
- Tests con resultados conocidos: Silberschatz cap. 5 (FIFO, SJF, SRT, RR, prioridades) y el
  **Ej. 1 de la guía resuelto a mano** (`AAAAABBBBCCCAAABBBBCCAAAACCC`).
- ⚠️ Las resoluciones de los Ej. 5, 6, 8 y 9a salen del simulador y **todavía no se cotejaron** contra
  una resolución de la cátedra.

**Conectado con:** [[Simuladores]], [[Patrón — Steps y Playback]], [[Convenciones de la Cátedra FRBA]]
