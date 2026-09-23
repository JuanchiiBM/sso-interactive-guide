---
tipo: dominio
aliases: [glosario, términos, nombres, naming, vocabulario, pcb, tick, ráfaga]
tags: [dominio, glosario]
actualizado: 2026-09-23
---

# Glosario de Términos del Código

| Concepto de la materia         | En el código                        | Notas                         |
| ------------------------------ | ----------------------------------- | ----------------------------- |
| Ráfaga (CPU / E/S)             | `rafagas: number[]`                 | Alternadas, empieza por CPU   |
| Unidad de tiempo               | `Tick` (`t` = intervalo `[t, t+1)`) |                               |
| Cola de listos (Ready)         | `listos`                            |                               |
| Bloqueado haciendo E/S         | estado `bloqueado`                  |                               |
| Esperando el dispositivo       | estado `espera-io`, `colaIO`        | Solo con `ioUnica`            |
| Tiempo de retorno (turnaround) | `retorno` = fin − llegada           |                               |
| Tiempo de espera               | `espera`                            | Solo tiempo en listos         |
| Response ratio (HRRN)          | `responseRatio()` = `(w + s) / s`   |                               |
| Tema / Unidad                  | colección `temas`                   | id `parcial-N/<slug>`         |
| Paso de una resolución         | `Step { state, descripcion }`       | [[Patrón — Steps y Playback]] |

**Conectado con:** [[Dominio SO]]
