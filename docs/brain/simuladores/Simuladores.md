---
tipo: modulo
aliases: [simuladores, resolvedores, solvers, simulación, paso a paso]
tags: [moc, simuladores]
actualizado: 2026-09-23
---

# Simuladores

Resolvedores paso a paso: lógica pura en `src/lib/simuladores/<tipo>/` + visualizador DOM.

- [[Simulador de Planificación]] — Gantt de corto plazo (FIFO, SJF, SRT, RR, VRR, prioridades,
  HRRN, multinivel, feedback; varios dispositivos, grado de multiprogramación, 2 CPUs).
- [[Patrón — Desafío antes de la Resolución]] — la respuesta se ve recién al acertar.
- [[Verificador de Semáforos]] — ejercicios de código con tests sobre todas las intercalaciones.
- [[Cómo agregar un simulador]] — receta para un `kind` nuevo.

## Cobertura contra la guía de Planificación

| Soportado hoy                                           | Ejercicios con simulación      |
| ------------------------------------------------------- | ------------------------------ |
| FIFO, SJF, SRT, RR, prioridades ±desalojo, HRRN          | 1, 5, 6, 8, 9a                 |
| Varios dispositivos de E/S nombrados                     | 2                              |
| 2 procesadores con y sin afinidad (dura)                 | 3a, 3b                         |
| Grado de multiprogramación / largo plazo (New)           | 4                              |
| Estimación de ráfagas con α (SJF/SRT)                    | 7a, 7b                         |
| Virtual Round Robin (Stallings)                          | 9b                             |
| Colas multinivel y feedback multinivel                   | 10, 11                         |
| E/S única FIFO o en paralelo · desempate de la cátedra  | todos                          |

**Falta modelar:** Hilos ULT/KLT, jacketing (Hilos 1–5). Pendiente cotejar las resoluciones generadas
contra resoluciones de la cátedra (ver ⚠️ en [[Simulador de Planificación]]).

Otros simuladores candidatos: grafo de asignación (deadlock), banquero/detección con matrices (teoría
de deadlock; la guía no trae numéricos), traza de semáforos (sincronización).
