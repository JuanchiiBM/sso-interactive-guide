---
tipo: modulo
aliases: [simuladores, resolvedores, solvers, simulación, paso a paso]
tags: [moc, simuladores]
actualizado: 2026-09-23
---

# Simuladores

Resolvedores paso a paso: lógica pura en `src/lib/simuladores/<tipo>/` + visualizador DOM.

- [[Simulador de Planificación]] — Gantt de corto plazo (FIFO, SJF, SRT, RR, prioridades, HRRN).
- [[Patrón — Desafío antes de la Resolución]] — la respuesta se ve recién al acertar.
- [[Cómo agregar un simulador]] — receta para un `kind` nuevo.

## Cobertura contra la guía de Planificación

| Soportado hoy                                   | Falta modelar (ejercicios que lo piden)          |
| ----------------------------------------------- | ------------------------------------------------ |
| FIFO, SJF, SRT, RR, prioridades ±desalojo, HRRN | Varios dispositivos de E/S nombrados (Ej. 2)     |
| E/S única con cola FIFO o E/S en paralelo       | 2 procesadores con y sin afinidad (Ej. 3)        |
| Desempate de la cátedra                         | Grado de multiprogramación / largo plazo (Ej. 4) |
|                                                 | Estimación de ráfagas con α (Ej. 7)              |
|                                                 | Virtual Round Robin (Ej. 9b)                     |
|                                                 | Colas multinivel y feedback (Ej. 10, 11)         |
|                                                 | Hilos ULT/KLT, jacketing (Hilos 1–5)             |

Otros simuladores candidatos: grafo de asignación (deadlock), banquero/detección con matrices (teoría
de deadlock; la guía no trae numéricos), traza de semáforos (sincronización).
