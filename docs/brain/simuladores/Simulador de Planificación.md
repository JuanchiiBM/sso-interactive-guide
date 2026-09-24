---
tipo: servicio
aliases: [planificación, planificacion, scheduler, hilos, ult, klt, jacketing, wrapper, biblioteca de hilos, scheduling, gantt, simularPlanificacion, fifo, sjf, srt, rr, round robin, hrrn, prioridades, vrr, virtual round robin, multinivel, feedback, afinidad, multiprocesador, multiprogramación, estimación, dispositivos, suspensión, mediano plazo, overhead, interrupción, fila SO]
tags: [simulador, planificacion]
actualizado: 2026-09-24
---

# Simulador de Planificación

**Propósito:** simular la planificación de corto plazo tick a tick y producir el Gantt + métricas.
**Ubicación:** `src/lib/simuladores/planificacion/` (`simular.ts`, `pasos.ts`, `tipos.ts`,
`verificar.ts`; tests `simular.test.ts`, `variantes.test.ts`, `catedra.test.ts` y `hilos.test.ts`); visualizador
`src/lib/visualizers/gantt.ts`; desafío `src/lib/desafios/gantt.ts`.

**Uso** (desde el frontmatter de un ejercicio; todo lo opcional tiene un default que deja el
comportamiento de siempre):

```yaml
simulaciones:
  - kind: planificacion
    etiqueta: a. Con desalojo
    algoritmo: srt # fifo | sjf | srt | rr | prioridades | prioridades-desalojo | hrrn | vrr | multinivel | feedback
    quantum: 3 # rr y vrr
    ioUnica: true # default: un único dispositivo FIFO; false = E/S en paralelo
    multiprogramacion: 2 # opcional: máximo de admitidos (procesos); el resto espera en New
    suspensionPorPrioridad: true # opcional: ver "Suspensión por prioridad"
    overheadInterrupcion: 2 # opcional: u.t. de CPU del SO por fin de E/S (fila "SO")
    alfa: 0.5 # opcional (sjf/srt): el criterio pasa a ser la estimación
    procesadores: 2 # opcional, 1 o 2
    afinidad: true # con 2 procesadores
    colas: # multinivel / feedback, de mayor a menor prioridad
      - { algoritmo: rr, quantum: 2 }
      - { algoritmo: fifo }
    desalojoEntreColas: true # default true
    trasIO: primera # feedback: primera | misma (default misma)
    procesos:
      - id: A
        llegada: 0
        rafagas: [5, 1, 3] # CPU, E/S, CPU…
        prioridad: 1
        dispositivos: [Placa de Red] # uno por ráfaga de E/S; cada nombre es un FIFO propio
        cola: 1 # multinivel: cola fija, 1 = mayor prioridad
        estimacionAnterior: 4 # con alfa: T_1 = α·4 + (1−α)·5
        rafagaAnterior: 5 # (o estimacionInicial: 4.5 directo)
        proceso: PA # opcional: agrupa KLTs en un proceso para el grado (default: su id)
```

## Modelo de un tick

Cada tick `t` representa el intervalo `[t, t+1)`. Orden dentro del tick:

1. **Largo plazo:** los que llegan en `t` entran a New (FIFO; por nombre si llegan juntos). Con
   `multiprogramacion`, se admiten mientras los admitidos (listos + ejecutando + bloqueados +
   esperando dispositivo) sean menos que el grado. Sin grado, todo el que llega se admite en el acto.
2. Entran a su cola de listos los **pendientes** del instante `t` (admitidos + fines de E/S + fin de
   quantum), ordenados por el desempate de la cátedra (ver [[Convenciones de la Cátedra FRBA]]).
   Cada pendiente ya trae su cola destino (ver Variantes).
3. **Desalojo**, por CPU: (a) multinivel/feedback con `desalojoEntreColas` y hay alguien en una cola
   de mayor prioridad que la del que ejecuta; (b) misma cola, algoritmo desalojante (SRT, prioridades
   con desalojo) y hay alguien estrictamente mejor. El desalojado va **al final de su misma cola**.
4. Cada CPU libre (en orden: CPU 1, CPU 2) elige: primera cola no vacía y, dentro de ella, el mejor
   según el algoritmo de esa cola. **Empate del criterio → el primero de la cola**, que ya refleja
   simultaneidad y orden alfabético.
5. Cada dispositivo libre toma el primero de su cola FIFO.
6. Se ejecuta: suman espera los que están en listos; cada CPU y cada dispositivo descuentan 1.
7. Al final (`t+1`): fin de ráfaga de CPU → cola del dispositivo (o fin); fin de E/S → pendiente
   `io`; quantum agotado → pendiente `desalojo`. Estos avisos se muestran en el paso siguiente.

`Tick` trae `cpu` (CPU 1) y `cpus` (todos), `io` (uso efectivo de cualquier dispositivo), `colaIO`,
`listos` (todas las colas aplanadas por prioridad) y, según la variante, `colas`, `dispositivos` y
`nuevos`. `ResultadoPlanificacion.procesadores` le dice al visualizador y al desafío cuántas CPUs hay.

## Variantes

- **Varios dispositivos (Ej. 2):** `dispositivos` por proceso, uno por ráfaga de E/S. Cada nombre es
  una cola FIFO independiente; sin nombre se usa el dispositivo único `E/S` (o paralelo si
  `ioUnica: false`). El desafío marca solo "E/S", sin distinguir dispositivo.
- **Grado de multiprogramación (Ej. 4):** estado `espera-admision` ("En New"). El bloqueado ocupa
  lugar. La espera en New **no** suma a la métrica de espera (solo la cola de listos); el retorno se
  mide desde la llegada original. El admitido entra a listos con origen `nuevo`.
- **Estimación SJF/SRT (Ej. 7):** con `alfa`, el criterio es la estimación, no la ráfaga real. La
  estimación de cada ráfaga se calcula cuando el proceso entra a listos con ráfaga nueva (llegada o
  fin de E/S) con la fórmula de la guía `T_i = α·T_{i-1} + (1−α)·R_{i-1}` y el paso muestra la cuenta.
  SRT compara **estimación restante = estimación − lo ya ejecutado de esa ráfaga** (puede quedar
  negativa si la ráfaga real supera la estimada; no se trunca).
- **VRR (Ej. 9b), definición de Stallings:** cola auxiliar con prioridad sobre la principal. Al volver
  de E/S, si el CPU usado desde que se lo eligió por última vez **de la principal** es < Q, va a la
  auxiliar; desde ahí ejecuta con `Q − usado` (acumulado). Si agota ese resto, va a la principal y
  al volver a elegirse de ahí arranca con Q completo. Sin desalojo: que alguien llegue a la auxiliar
  no interrumpe al que ejecuta.
- **Multinivel (Ej. 10):** `colas` + `cola` fija por proceso (1 = mayor prioridad). El mapeo
  prioridad → cola lo escribe el autor en el frontmatter siguiendo la regla del enunciado.
- **Feedback (Ej. 11):** nuevos a la cola 1; fin de quantum baja una cola (tope: la última); tras E/S
  `trasIO: primera` (promoción a la cola 1) o `misma`; desalojado por cola superior → final de su cola.
- **2 procesadores (Ej. 3):** cola de listos global. Sin afinidad, toma el CPU libre de menor número.
  Con afinidad (**dura**) el proceso queda atado al CPU donde ejecutó por primera vez y lo espera
  aunque el otro esté libre. El Gantt agrega una fila por CPU arriba y el número de CPU en la celda;
  el desafío tiene pinceles CPU 1 / CPU 2 / E/S (`Marca`: `'cpu'` = CPU 1, `'cpu2'` = CPU 2).

## Hilos (ULT sobre KLT)

**Modelo:** el SO planifica **KLTs** (cualquier `algoritmo`); un KLT sin `hilos` es un proceso de
siempre. Un KLT con `hilos` tiene una **biblioteca** que elige el ULT **solo mientras el KLT tiene
la CPU**. Las filas del Gantt (y del desafío) son los hilos planificables: cada ULT, etiquetado
"KA · UA1", y cada KLT simple. `Tick.cpus`, `io`, `estados` y las métricas son por hilo;
`listos`/`colas` son KLTs. Con ULTs, `Tick.bibliotecas` (ULT elegido + cola de cada biblioteca) y
`Tick.quantum` (lo que le queda al KLT de cada CPU) alimentan el panel del paso a paso.

```yaml
procesos:
  - id: KA
    biblioteca: sjf # fifo (default) | sjf | srt ("SJF con desalojo") | rr | prioridades | prioridades-desalojo
    quantumBiblioteca: 2 # solo con biblioteca rr
    modoIO: jacketing # directa | wrapper (default) | jacketing
    hilos: # los que llegan juntos entran a la biblioteca en este orden
      - { id: UA1, llegada: 0, rafagas: [3, 1, 2] }
      - { id: UA2, llegada: 0, rafagas: [1, 1, 1], prioridad: 1 }
  - { id: KC, llegada: 0, rafagas: [1, 1, 2] } # KLT simple
```

**Reglas (salen de las resoluciones oficiales):**

- **El quantum es del KLT:** cambiar de ULT (fin de ULT, desalojo de la biblioteca, jacketing) no lo
  reinicia (1P 1C2024 TT t4). VRR cuenta el CPU del KLT, no del ULT.
- **Modos de E/S** (`modoIO`, por KLT):
  - `directa`: bloquea **todo el KLT**; al volver la biblioteca no se enteró y **sigue el mismo ULT**
    aunque haya otros listos antes (1R 1C2026 TT, KLT B).
  - `wrapper`: bloquea **todo el KLT**; el ULT vuelve al final de la cola de la biblioteca, que
    **replanifica** al volver a ejecutar (1R 1C2026 TT, KLT A; 1P 1C2026 TT Ej. 2).
  - `jacketing`: solo se bloquea el ULT; el KLT sigue con otro. Si no le queda ninguno listo, **deja
    la CPU** y vuelve a listos (origen `io`, como un desbloqueo) cuando un ULT termina su E/S o llega
    uno nuevo (origen `nuevo`). No hay paralelismo entre ULTs del mismo KLT.
- La E/S sigue siendo el **dispositivo único FIFO**, compartido por ULTs y KLTs.
- **Biblioteca sin desalojo** (fifo, sjf, prioridades): si el SO desaloja al KLT, al volver sigue el
  mismo ULT. **Desalojante** (srt, prioridades-desalojo): revisa solo cuando entra un ULT a su cola
  (llegada, fin de E/S con jacketing, vuelta del KLT con wrapper) — en el tick en que llega si el KLT
  ejecuta, o al redespacharlo. Empate → no desaloja.
- **SJF/SRT/HRRN del SO:** la ráfaga de un KLT es la (restante) del ULT que su biblioteca elegiría en
  ese momento (1R 1C2026 TM Ej. 2: en t4 KA gana con la ráfaga 1 de U1). SO no consume tiempo.
- 2 CPUs: cada KLT en su CPU → cargar `afinidad: true` (1P 2C2025 TT Ej. 2).

**Decisiones de interpretación:**

- `modoIO` default **`wrapper`** (sin jacketing, convención de la cátedra). Directa vs wrapper no lo
  fija ninguna regla; el único enunciado que no lo dice y distingue (1P 1C2026 TT Ej. 2, KB) da
  wrapper. Los Ej. 2, 3 y 5 de la guía lo asumen con una nota visible.
- ULTs simultáneos: **orden de declaración** (no alfabético): los inversos deducen el orden
  (1P 1C2026 TT Ej. 2: UB2 antes que UB1). Entre KLTs sigue el desempate alfabético.
- En la cola de la biblioteca rige el mismo desempate: clock (quantum de la biblioteca) > E/S > nuevo.
- Quantum de biblioteca RR: corre solo mientras el ULT ejecuta y **sobrevive** al desalojo del KLT.
- Un ULT que llega con el KLT bloqueado por E/S (directa/wrapper) espera en la cola de la biblioteca.
- Métricas por hilo: "espera" de un ULT = instantes listo en su biblioteca (esté o no su KLT en listos).
- KLT "termina" cuando terminaron todos sus ULTs; admisión (`multiprogramacion`) cuenta **procesos**:
  cada KLT es su propio proceso salvo que se agrupen con `proceso` (ver abajo).
- ULTs listos de un KLT en New o suspendido se muestran en ese estado (no suman espera).
- No soportado con ULTs: estimación con `alfa`, HRRN en la biblioteca.

**Validación:** `hilos.test.ts` compara 10 Gantt oficiales (instante por instante, más los fines) y
las 4 preguntas "¿desde qué instante cambia si…?" de esas resoluciones (todas coinciden); en P-12 y
P-15 también las suspensiones, la E/S y el uso de CPU del SO. Saltado: 1R 1C2026 TM Ej. 4 (Gantt de
un estudiante con error a propósito).

**Erratas de resoluciones** (se testea lo correcto, con comentario):

- 1P 2C2025 TM Ej. 2, t9: la biblioteca SRT de P2 corre ULT2.1 (restan 3) con ULT2.2 lista (ráfaga
  2, volvió de E/S por jacketing en t7). Oficial `aaaacdcbbcccbaadd`; correcto `aaaacdcbbddcbaacc`.

## Suspensión por prioridad (1P 1C2025 TT Ej. 3, `hilos/ej-15`)

`multiprogramacion` + `suspensionPorPrioridad: true` + `proceso` en cada KLT. Un **proceso** (grupo
de KLTs, prioridad = la de su primer KLT) ocupa un lugar; un KLT nuevo de un proceso ya admitido
entra sin ocupar otro. Semántica, deducida del Gantt oficial:

- Un proceso que llega con el grado completo va a New. **Cada vez que cambia Ready** se reevalúa New
  (FIFO): si hay en Ready un proceso de prioridad **estrictamente peor**, se suspende al **peor** y el
  nuevo entra en ese momento (origen `nuevo`, a la cola en ese punto).
- "Cambia Ready" = al empezar el instante y después de **cada** entrada, procesadas en el orden del
  desempate (clock > E/S > nuevo). Por eso en t7 se suspende PB y no PA: entra primero KLT3 (clock),
  PC lo suspende, y recién después entra KLT1 (fin de E/S); la cola queda KLT4, KLT1 (como la oficial).
  Con "entran todos y después se evalúa" el suspendido sería PA (prioridad 3) y el Gantt no coincide.
- Solo es candidato un proceso con **todos** sus KLTs vivos en Ready (ni ejecutando ni bloqueados).
  En t9 PA recién es candidato cuando KLT2 vuelve de E/S; en t6 Ready está vacío y PC espera.
- Suspender saca de Ready a sus KLTs (estado `suspendido`, no suman espera) y libera su lugar.
- Al liberarse un lugar (termina un proceso) vuelven **primero los suspendidos** (mejor prioridad;
  empate: el primero suspendido) y después los de New (FIFO). El que vuelve entra con origen `nuevo`.
  En P-12 PB vuelve en t14 y PA en t22 (las dos lecturas de orden coinciden acá).
- Suspender no es una syscall (lo decide el SO); el panel muestra `Suspendidos`.

## Tiempo del SO por interrupción (1P 1C2026 TT Ej. 3, `hilos/ej-16`)

`overheadInterrupcion: n`: cada **fin de E/S** es una interrupción que el SO atiende durante `n` u.t.
de CPU. Solo fin de E/S: el quantum de una biblioteca no usa HW y el del SO no se modela como
interrupción con costo.

- El hilo que terminó la E/S queda en `espera-so` (celda vacía con borde) y recién al terminar el SO
  vuelve a listos / a la cola de su biblioteca (en P-15 ULT1 termina la E/S en t5, SO t5–6, PA en t7).
- **CPU de la interrupción:** la del proceso afectado (afinidad) si está libre; si no, otra libre (la
  de menor número); si no, la del proceso (o la CPU 1): el que ejecuta ahí queda **pausado** (se
  muestra listo, no consume quantum) y sigue después. La resolución oficial solo tiene el primer caso.
- Varias interrupciones en la misma CPU se atienden en fila.
- `Tick.so[k]` y `ResultadoPlanificacion.so`: el visualizador pinta "SO" en la fila de la CPU y agrega
  una **fila "SO"** (`FILA_SO`, reservado como id); `grillaEsperada` la incluye y el desafío la marca
  con el pincel de CPU (click derecho/E/S no aplica). Limitación: si el SO usa las dos CPUs en el mismo
  instante, la fila guarda solo la CPU 1.
- P-15 reproduce el oficial con `fifo` + `afinidad` (el algoritmo del SO no se da). El inciso b) de la
  resolución lista intervenciones de la biblioteca en 2, 3, 6, 9, 12 y 16; el t16 es discutible (en
  t15 termina ULT1 y pasa a ULT2) y omite t7/t13 (PA vuelve y la biblioteca replanifica): se discute en
  el MC, el simulador no modela "intervenciones".

## Decisiones de interpretación (la guía no las fija)

- **Prioridad:** número menor = mayor prioridad. Se infiere del Ej. 10 ("prioridad < 1 = crítico").
- **VRR, quantum restante:** acumulado desde la última elección de la principal (Stallings). La otra
  lectura (Q − lo usado solo en la última ráfaga) cambia el Ej. 9b: en t=14 C sale de la auxiliar
  con 1 de quantum en vez de 2 y el Gantt final difiere.
- **VRR, prioridad entre colas:** al elegir, auxiliar antes que principal; el desempate clock > E/S >
  nuevo se aplica dentro de cada cola.
- **Multinivel (Ej. 10):** el enunciado no dice si hay desalojo entre colas; se asume **con desalojo**
  (Silberschatz: prioridad fija entre colas, desalojante). Cambia el Gantt desde t=1 (A desaloja a
  C). El desalojado vuelve al final de su cola y recupera Q completo cuando se lo vuelve a elegir.
- **Desalojo por prioridad/SRT/cola:** el desalojado entra a la cola **después** de los que llegaron
  en ese mismo instante (no es una interrupción de clock).
- **Afinidad:** dura y asignada en la primera ejecución; si los dos CPUs están libres gana el CPU 1.
  Una afinidad "blanda" (preferir el CPU propio pero usar el otro si está libre) no cambia los
  tiempos respecto de sin afinidad con cola global; solo cambiaría en qué CPU ejecuta cada uno.
- **Estimación:** fórmula de la guía (α pondera la estimación anterior). Con α = 0,5 las dos fórmulas
  coinciden (Ej. 7). Las columnas "Est. Ant / Real Ant" del Ej. 7 son la ráfaga previa a la traza.
- **E/S única compartida** también con 2 procesadores y en multinivel/feedback (no se aclara otra cosa).
- **Ej. 2:** "la primera E/S es la Placa de Red y la segunda la Pantalla" se lee por proceso (primera y
  segunda ráfaga de E/S de cada uno).

## Gotchas

- **`ioUnica` es default `true`**: la guía trata la E/S como un único dispositivo salvo que diga lo
  contrario.
- **HRRN:** `w` se mide desde que el proceso entró a listos _por última vez_; `s` es la ráfaga
  completa actual (sin estimación).
- **Espera** = ticks en la cola de listos (no incluye esperar el dispositivo ni New).
- **Respuesta** = primer instante en CPU − llegada.
- Con 2 CPUs el aviso "CPU n ociosa" solo aparece cuando cambia, para no repetirlo en cada paso.
- El Ej. 2 da el **mismo Gantt de CPU que el Ej. 1** (coincidencia de la traza); lo que cambia son
  las celdas de E/S, que el desafío también verifica.

## Tests con resultado conocido

- Silberschatz cap. 5 (FIFO, SJF, SRT, RR, prioridades) y el **Ej. 1 de la guía** resuelto a mano.
- `variantes.test.ts`: casos chicos resueltos a mano que distinguen cada variante de su base
  (RR vs VRR, VRR acumulado de Stallings, dispositivos nombrados vs único, grado 1 vs sin límite,
  SJF/SRT por estimación vs real y la cuenta de α ≠ 0,5, 2 CPUs con y sin afinidad) y los
  **Ej. 10 y 11 resueltos a mano** (`CAAAABAAAAACBBBCCCB-----BBBBB`, `AABBCCABCCCCBACCCAAC--CCCCC`).
- **Hilos 1–5 de la guía:** el Ej. 1 (directa / wrapper / jacketing) está resuelto a mano en
  `hilos.test.ts`; el modelo de hilos se validó contra 8 resoluciones oficiales (ver Hilos).
- ⚠️ Las resoluciones de los Ej. 2–9 salen del simulador y **todavía no se cotejaron** contra una
  resolución de la cátedra (7a/7b y 9b se revisaron tick a tick a mano).

**Conectado con:** [[Simuladores]], [[Patrón — Steps y Playback]], [[Convenciones de la Cátedra FRBA]],
[[Patrón — Desafío antes de la Resolución]]
