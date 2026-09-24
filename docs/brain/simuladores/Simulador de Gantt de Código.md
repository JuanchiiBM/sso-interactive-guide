---
tipo: servicio
aliases: [gantt de código, gantt de codigo, kind codigo, simularCodigo, sentencias con duración, semáforos con tiempo, detector de deadlock, inversión de prioridades gantt]
tags: [simulador, planificacion, semaforos, deadlock]
actualizado: 2026-09-24
---
# Simulador de Gantt de Código

**Propósito:** Gantt de procesos definidos como **sentencias con duración** (wait/signal, get/release,
sleep, operaciones) bajo un planificador (FIFO, RR, prioridades con/sin desalojo). Resuelve los 7
parciales "Gantt de código" (P-19…P-25 del relevamiento).

**Ubicación:** `src/lib/simuladores/codigo/` (`simular.ts`, `tipos.ts`, `pasos.ts`,
`catedra.test.ts` con las 7 resoluciones oficiales). Devuelve un `ResultadoPlanificacion`, así que
reusa **sin cambios** el Gantt (`visualizers/gantt.ts`), el paso a paso y el desafío
(`desafios/gantt.ts`); `bloqueoSincro: true` hace que `tick.io` signifique "bloqueado" (click
derecho = Bloqueado) y el panel muestre semáforos/recursos en vez de E/S.

**Uso (frontmatter):**
```yaml
simulaciones:
  - kind: codigo
    etiqueta: a. Gantt
    algoritmo: rr            # fifo | rr | prioridades | prioridades-desalojo
    quantum: 2
    duracion: 2              # default por sentencia (sleep: 0 de CPU)
    atomicas: true           # wait/signal/get/release no interrumpibles
    semaforos: { a: 1, b: 1 }
    recursos: { recurso_A: 1 }            # get/release con dueño
    detector: { sentencia: deadlock_detect() }
    hasta: 25                # o hastaQueTerminen: [A, C]
    procesos:
      - { id: KLT1, llegada: 0, prioridad: 1, codigo: "Wait(a)\nsinopsis() // 3\nSignal(a)" }
```
Una sentencia por línea; `// N` al final fija su duración; admite un `while(true){ … }`.

## Semántica (deducida de las 7 resoluciones; no cambiar sin correr `catedra.test.ts`)
- **wait/get consumen su duración y la condición se evalúa al final**: si no hay, se bloquea ahí.
  El que despierta ya tiene el semáforo/recurso y sigue con la próxima sentencia.
- **signal/release**: despierta al primero de la cola (FIFO). El despertado entra a Listos **antes**
  que el desalojado por fin de quantum en ese mismo instante: el signal es una syscall que termina
  antes del clock (1R 1C2026 TM, t = 13).
- **sleep(n)**: 0 u.t. de CPU, bloquea n. Al despertar entra **después** del desalojado por clock
  (es un timer, como una E/S: regla clock > E/S > nuevo).
- **Desalojo** (fin de quantum o llega uno más prioritario): corta la sentencia a la mitad y la
  retoma después, **salvo** una atómica en curso → se posterga hasta que termina. Con RR, si al
  vencer el quantum no hay otro listo, sigue el mismo con quantum nuevo.
- **Detector**: al terminar su sentencia busca espera circular entre procesos bloqueados en
  **recursos con dueño** (no semáforos) y mata al de **mayor tiempo restante** (ciclo = ∞),
  liberando sus recursos.
- Corta cuando terminan todos (o los de `hastaQueTerminen`), en `hasta`, o cuando nadie puede avanzar
  (todos bloqueados sin timers pendientes: deadlock o inanición). Los que no terminan no van a la
  tabla de métricas.

## Gotchas
- El desafío de semáforos (verificador) exige `wait`/`signal` en **minúscula**; el Gantt de código
  acepta cualquier caso. Si un ejercicio tiene los dos, el código del `semaforos:` va en minúscula.
- El Gantt de CASA (P-20) depende del orden inicial en Ready: la resolución elige "empieza S y
  después C"; está fijado por el orden de `procesos`.

**Conectado con:** [[Simuladores]], [[Simulador de Planificación]], [[Verificador de Semáforos]],
[[Patrón — Desafío antes de la Resolución]].
