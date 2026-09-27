---
tipo: componente
aliases: [diagrama de colas, colas, fichas, cola de listos visual, renderColas, colas-dom, FLIP, animación de colas]
tags: [componente, simuladores, visualizador]
actualizado: 2026-09-27
---
# Diagrama de Colas

**Propósito:** en la resolución paso a paso de un Gantt, mostrar dónde está cada proceso en cada
instante (Listos, CPU, E/S, cola de E/S, bibliotecas de ULTs…) como fichas que se mueven entre
cajas. Reemplaza a los chips de texto del Gantt (se ocultan con CSS cuando hay diagrama).

**Alcance:** solo ejercicios **de guía** con `kind: planificacion` (`fuente.guia` empieza con
"Guía de Ejercicios"). Parciales y simulacros siguen con los chips. El flag lo calcula
`src/pages/ejercicios/[...id].astro` y llega como prop `diagrama` a `SimuladorStage.astro`
(`data-sim-diagrama` + contenedor `data-sim-colas`).

**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Primitivas (`zona`, `ficha`, `repintarAnimado`) | `src/lib/visualizers/colas-dom.ts` |
| Composición + zonas del SO | `src/lib/visualizers/colas.ts` (`renderColas`) |
| Zonas de hilos (bibliotecas, quantum del KLT) | `src/lib/visualizers/colas-hilos.ts` |
| Registro | `colas` en `SIMULADORES.planificacion` de `src/lib/simulador-page.ts` |
| Estilos | `src/styles/simulador.css`, sección "Diagrama de colas" |

**Cómo funciona:** es un visualizador más del [[Patrón — Steps y Playback]]: lee el `Tick` del paso
(`listos`, `cpus`, `io`, `colaIO`, `colas`, `bibliotecas`…) y repinta todo. No toca el simulador.
La animación es FLIP: `repintarAnimado` guarda la posición de cada `[data-ficha]` antes de repintar
y anima desde ahí; la **clave** de la ficha tiene que ser estable entre pasos (el id del hilo).

**Gotchas:**
- `simulador.css` se importa en `layer(components)`: para pisar una utility de Tailwind (p. ej.
  `flex`) hace falta `!important`.
- Con ULTs, `Tick.listos` son **KLTs** y `Tick.cpus` son **ULTs**: el KLT no es una fila del Gantt,
  así que no tiene color propio en `procesos`.

**Conectado con:** [[Simulador de Planificación]], [[Simuladores]], [[Patrón — Steps y Playback]]
