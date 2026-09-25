---
tipo: componente
aliases: [a calcular, (a calcular), campo a calcular, celdas a calcular, input en tabla, estimaciones, celdasACalcularPlugin]
tags: [componente, contenido, markdown]
actualizado: 2026-09-25
---

# Celdas a calcular en enunciados

**Propósito:** en las tablas de los enunciados, una celda cuyo texto es exactamente `(a calcular)`
se convierte en un `<input>` chico para que el alumno anote el valor mientras resuelve (issue #9,
p. ej. las estimaciones de ráfaga de Planificación Ej. 7).
**Ubicación:** `src/lib/markdown/celdas-a-calcular.ts` (+ test), registrado en `astro.config.mjs`
junto a `bloquesSVGPlugin`; estilos `.campo-a-calcular` en `src/styles/prose.css`.

## Cómo se marca una celda
No hay sintaxis nueva: se escribe la celda como ya estaba en la guía, `_(a calcular)_` o
`(a calcular)`. El plugin mdast de Sätteri visita `tableCell` y compara el texto completo de la
celda (sin mayúsculas ni espacios extra). Celdas que solo **mencionan** la frase
(`3 (a calcular)`) y el texto fuera de tablas no se tocan.

- El nombre accesible sale del encabezado de la columna + la primera celda de la fila
  (`"Est. CPU de A"`).
- `inputmode="decimal"` + `pattern` que acepta coma o punto; si el valor no es un número, el borde
  se pinta con `--bad` vía `:user-invalid` (solo después de que el alumno interactúa). Sin JS.

## Decisiones
- **Solo para anotar, sin verificación.** El dueño lo pidió así: es para no escribir a mano, no un
  desafío. Verificar contra el simulador (que ya calcula las estimaciones con `alfa`) podría
  sumarse después siguiendo [[Patrón — Desafío antes de la Resolución]].
- **Sin persistencia:** nada de localStorage; al recargar la página los campos quedan vacíos.
- En [[Simulacros]] el mismo `Content` también muestra los campos: no puntúan ni se leen.

## Gotchas
- Caché de content collections: si cambiás el plugin y el HTML no cambia,
  `rm -rf .astro node_modules/.astro` (igual que en [[Bloques SVG grafo y diagrama]]).
- La tabla ya scrollea sola en ≤ 640 px (`prose.css`); el input tiene ancho fijo chico para no
  agrandarla.

**Conectado con:** [[Contenido]], [[Formato de un Ejercicio]], [[Bloques SVG grafo y diagrama]]
