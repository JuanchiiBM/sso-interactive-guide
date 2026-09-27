---
tipo: componente
aliases: [diagrama de colas, colas, fichas, cola de listos visual, renderColas, colas-dom, moverFichas, quantumPorTick, animación de colas, mostrar diagrama]
tags: [componente, simuladores, visualizador]
actualizado: 2026-09-27
---
# Diagrama de Colas

**Propósito:** en la resolución paso a paso de un Gantt, mostrar dónde está cada proceso en cada
instante (Ready, CPU, E/S, cola de E/S, bibliotecas de ULTs…) como fichas que se mueven entre
cajas. Arranca **oculto** detrás del botón "Mostrar diagrama"; abierto, reemplaza a los chips de
texto del Gantt (se ocultan con `[data-sim-diagrama="abierto"]`).

**Alcance:** solo ejercicios **de guía** con `kind: planificacion` (`fuente.guia` empieza con
"Guía de Ejercicios"). Parciales y simulacros siguen con los chips. El flag lo calcula
`src/pages/ejercicios/[...id].astro` y llega como prop `diagrama` a `SimuladorStage.astro`
(`data-sim-diagrama`, botón `data-sim-accion="diagrama"` + contenedor `data-sim-colas`).

**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Fichas SVG persistentes (`moverFichas`, `fichaSvg`, tipos `Ficha`/`Zona`) | `src/lib/visualizers/colas-dom.ts` |
| Lienzo general: modelo, layouts, render (`renderColas`) | `src/lib/visualizers/colas.ts` |
| Quantum restante y ráfaga restante derivados de la traza | `src/lib/visualizers/colas-derivar.ts` (+ test) |
| Lienzo de hilos (`renderColasHilos`) | `src/lib/visualizers/colas-hilos.ts` |
| Registro + botón Mostrar/Ocultar | `colas` en `SIMULADORES.planificacion` y `conectarPlayback` de `src/lib/simulador-page.ts` |
| Estilos | `src/styles/simulador.css`, sección "Diagrama de colas" (+ clases de recorridos en `diagramas.css`) |

**Cómo funciona:** es un visualizador más del [[Patrón — Steps y Playback]] con el look de los
recorridos de teoría ([[Recorridos paso a paso]]): SVG con `svg.ts`, clases `dg-*`/`rl-*` y la
figura `diagrama recorrido rc-activo` (resaltado `rc-on` + `data-rc-foco`, fichas `rc-ficha`).
El lienzo (fondo + capa de fichas) se monta una vez por `resultado`; en cada paso se repinta el fondo
y las fichas —una `<g>` por clave, persistente— se deslizan con la transición de `transform`.
**Botón:** siempre arranca cerrado (no se recuerda). Cerrado no se repinta; al abrir se vacía el
contenedor y se monta con el paso actual (sin animar desde lo que mostraba antes).

## Planificación (lienzo general)

**Layout:** estable para toda la traza (capacidad de cada cola = su máximo en los ticks, tope 6 con
"+n"). Dos disposiciones según el ancho del contenedor (< 600 px → `colas-compacto`, se re-dispone
con `ResizeObserver`):
- **Escritorio:** New → Ready (colas apiladas, frente a la derecha) → CPU(s) → Fin en una fila; los
  dispositivos abajo. Vuelta a Ready por un **bus** a la izquierda de las colas: "fin de quantum /
  desalojo" por arriba, "fin de E/S" por abajo, "admisión" desde New.
- **Celular:** lo mismo apilado (Ready, CPU + Fin, dispositivos); el SVG escala con el viewBox
  (~350 de ancho, texto ≈ 11 px a 375 px). Los promedios finales van bajo el reloj.

**Qué zona sale de qué campo del `Tick`:**

| Zona | Campo |
| --- | --- |
| Ready (una por cola) | `colas[i].procesos` (VRR: Auxiliar/Principal; multinivel/feedback: "Cola n · alg") o `listos` |
| New / Suspendidos | `nuevos` / `suspendidos` (solo si algún tick los trae) |
| CPU k | `cpus[k]`; `so[k]` → "SO". Pie: `restan n` (ráfaga real) y `Q r/L` |
| Un dispositivo por nombre | `dispositivos` (orden de aparición); lo que no cae en ninguno → "E/S" con `io`/`colaIO` |
| Fin | `estados[id] === 'fin'`, en orden de finalización; en el paso final todos + promedios |

**Resaltado:** se compara la zona de cada ficha con la del tick anterior; la zona destino y el
camino (`entra-i`, `disp-i-k`, `vuelve`, `pide-io`, `a-disp-j`, `usa-j`, `sale-j`, `fin-io`,
`admision`, `termina-k`) quedan `rc-on` y la ficha que se movió lleva un aro (`colas-mueve`).

**Gotchas (planificación):**
- El `Tick` no trae el quantum (salvo con ULTs): `quantumPorTick(config, resultado)` lo reconstruye
  repitiendo las reglas de cola destino del simulador (VRR acumulado de Stallings, feedback baja/
  promoción, multinivel fija). El test lo coteja con los avisos "agota su quantum (L)" y "quantum
  restante: N" de los Ej. 9–11. Por eso `renderColas` recibe la `config` (tercer parámetro).
- `restan n` sale de contar hacia adelante los ticks `ejecutando` (saltando `listo` por desalojo) o
  `bloqueado`: es la ráfaga **real**, no la estimación (Ej. 7).
- Los dispositivos nombrados aparecen en `Tick.dispositivos` recién cuando alguien los usa: el
  modelo junta los nombres de toda la traza.
- El gancho de hilos se importa como namespace (`hilos.renderColasHilos?.(root, state)`) para que
  compile antes y después del merge de su rama.

## Comunes

**Gotchas:**
- `simulador.css` se importa en `layer(components)`: para pisar una utility de Tailwind (p. ej.
  `flex`) hace falta `!important`.
- Con ULTs, `Tick.listos` son **KLTs** y `Tick.cpus` son **ULTs**: el KLT no es una fila del Gantt,
  así que no tiene color propio en `procesos`.

**Conectado con:** [[Simulador de Planificación]], [[Simuladores]], [[Patrón — Steps y Playback]]
