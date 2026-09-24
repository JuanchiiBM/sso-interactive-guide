---
tipo: componente
aliases: [grafo, grafo de asignación, resource allocation graph, RAG, diagrama, svg, bloques, bloqueSVG, renderGrafo, renderDiagrama, satteri, gantt, gantt estático, gantt inverso, renderGanttEstatico]
tags: [componente, contenido, svg]
actualizado: 2026-09-24
---
# Bloques SVG grafo y diagrama

**Propósito:** escribir grafos y diagramas en markdown y obtener SVG estático en build.
**Ubicación:** `src/lib/markdown/bloques-svg.ts` (entrada única `bloqueSVG`), `src/lib/grafos/asignacion.ts`
(+ test), `src/lib/diagramas/` (fijos), estilos en `src/styles/diagramas.css`.

## ```grafo — grafo de asignación de recursos
```text
procesos: P1, P2, P3
recursos: R1, R2=2, R3      # =N instancias (puntos dentro del cuadrado)
R1 -> P1                    # recurso → proceso = asignación (flecha llena)
P1 -> R2                    # proceso → recurso = solicitud (punteada)
resaltar-ciclo              # opcional: pinta en rojo las aristas que forman ciclo
```
Layout automático: procesos arriba, recursos abajo ordenados por baricentro. Aristas opuestas entre el
mismo par se curvan. ⚠️ No usar `resaltar-ciclo` en un enunciado donde detectar el ciclo sea la pregunta.

## ```diagrama <id> — diagramas fijos de teoría
Registro en `DIAGRAMAS` (`src/lib/diagramas/index.ts`): `estados-proceso`, `ciclo-instruccion`,
`hilos-ult-klt`. Se dibujan a mano con las primitivas de `svg.ts` (`caja`, `rombo`, `flecha`, `marco`).

## ```gantt — Gantt ya resuelto (enunciados de Gantt inverso)
El cuerpo es la **misma config YAML** que una `simulaciones:` de planificación (sin `kind`, con
`titulo` opcional). En build corre `simularPlanificacion` y dibuja solo **CPU y E/S** (como en el
examen; Listo no se dibuja para no regalar la cola). Filas = `r.hilos`, con prefijo de KLT si hay ULTs.
Código: `src/lib/diagramas/gantt-estatico.ts`. Se usa en planificación Ej. 17–19 e hilos Ej. 11–13.

- La config tiene que reproducir el Gantt **oficial**: copiala de un caso ya validado en
  `catedra.test.ts` / `hilos.test.ts`. Antes de escribir el MC, corré los distractores en el
  simulador: ninguno tiene que dar el mismo Gantt.
- Imports **relativos** (no `@lib/`): lo importa `bloques-svg.ts`, que también carga vitest sin el alias.

## Dónde se engancha
- Colecciones (`.md`): plugin mdast de **Sätteri** (`bloquesSVGPlugin`) en `astro.config.mjs` →
  `markdown.processor: satteri({ mdastPlugins })`. Astro 7 usa Sätteri por defecto; `remarkPlugins` ya
  no funciona sin instalar `@astrojs/markdown-remark`.
- Justificaciones del multiple choice: renderer de `marked` en `MultipleChoice.astro`.

## Gotchas
- **Sätteri descarta `style` inline** del HTML crudo: el tamaño va por atributos `width`/`height`
  (con `ESCALA`) y el CSS solo pone `max-width: 100%`.
- **Caché de content collections:** Astro guarda el markdown renderizado según el contenido del `.md`.
  Si cambiás el código de un bloque y el HTML no cambia: `rm -rf .astro node_modules/.astro`.
- Colores siempre por clase CSS con tokens, nunca en el SVG.

**Conectado con:** [[Decisión — SVG propio en el sitio, mermaid solo en el brain]], [[Contenido]],
[[Formato de un Ejercicio]]
