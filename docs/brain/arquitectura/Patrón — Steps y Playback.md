---
tipo: patron
aliases: [steps, pasos, playback, reproducción, paso a paso, step engine, createPlayback, Step]
tags: [patron, arquitectura]
actualizado: 2026-09-23
---

# Patrón — Steps y Playback

**Cuándo aplicarlo:** cualquier resolución que se quiera mostrar "paso a paso" (Gantt, banquero,
traza de semáforos, traducción de direcciones…).

**Cómo:** tres piezas desacopladas.

1. **Simulador** (`src/lib/simuladores/<tipo>/`) — función pura `config → resultado`, con tests.
2. **Pasos** (`pasos.ts` del mismo tipo) — `config → Step<S>[]`, donde cada step es
   `{ state, descripcion }`. `descripcion` es la explicación en lenguaje de cátedra.
3. **Visualizador** (`src/lib/visualizers/<tipo>.ts`) — `render(root, state)`: repinta todo el
   estado. Sin diffs, sin estado propio.

`src/lib/playback.ts` (`createPlayback`) solo sabe avanzar, retroceder, reproducir y la velocidad.
`src/lib/simulador-page.ts` los conecta y tiene el registro `SIMULADORES` por `kind`.

```ts
// registrar un tipo nuevo en simulador-page.ts
const SIMULADORES = {
  planificacion: { pasos: pasosPlanificacion, render: renderGantt },
  banquero: { pasos: pasosBanquero, render: renderMatrices },
}
```

**Ejemplos en el repo:** `simuladores/planificacion/pasos.ts` + `visualizers/gantt.ts`.
**Cuándo NO usarlo:** contenido estático (tablas, diagramas fijos): markdown o un bloque SVG estático (ver [[Bloques SVG grafo y diagrama]]).
**Gotchas:** el `state` de cada step puede compartir referencias (el Gantt pasa el mismo `resultado`
y un índice `hasta`); el visualizador no tiene que mutarlo nunca.
**Conectado con:** [[Arquitectura]], [[Cómo agregar un simulador]]
