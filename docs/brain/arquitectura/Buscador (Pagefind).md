---
tipo: componente
aliases:
  [buscador, búsqueda, search, pagefind, Ctrl+K, índice de búsqueda, SiteSearch, initBuscador, data-pagefind-body, data-pagefind-ignore]
tags: [componente, ui, build]
actualizado: 2026-10-08
---

# Buscador (Pagefind)

**Propósito:** buscar por palabra clave en la teoría y los enunciados, sin backend. El índice se arma
en el build y la búsqueda corre en el navegador, que baja solo los pedazos del índice que necesita.

**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Indexar al terminar el build (hook `astro:build:done`, API de Node) | `src/lib/buscador/integracion.ts`, registrada en `astro.config.mjs` |
| Agrupar y elegir secciones (puro, testeado) | `src/lib/buscador/resultados.ts` |
| Diálogo, carga diferida, teclado | `src/lib/buscador/cliente.ts` (`initBuscador`, en `src/scripts/client.ts`) |
| Markup | `src/components/SiteSearch.astro` (dentro de `SiteHeader`) |
| Estilos | `src/styles/buscador.css` |

**Uso:** botón "Buscar" del header, `Ctrl+K` / `Cmd+K` o `/`. Flechas para moverse y Enter para ir.

## Qué se indexa

- Solo lo que está adentro de `data-pagefind-body`: el `<article>` de cada tema y de cada ejercicio.
  Las demás páginas (home, índices, simulacros) no entran.
- Afuera, con `data-pagefind-ignore="all"`: la sección **Resolución** de los ejercicios (MC,
  semáforos, simuladores), la navegación y los "Ejercicios de este tema". Un resultado nunca tiene
  que mostrar una respuesta.
- `excludeSelectors: ['figure', 'svg', 'script']`: los diagramas repiten como texto suelto lo que ya
  dice la prosa.
- Metadatos: `tipo` (Teoría / Ejercicio) y `fuente` (la guía o el parcial), que se muestran como chips.
  La fila de metadatos del ejercicio tiene `data-pagefind-ignore` sin `all`: no se indexa su texto,
  pero sí el `data-pagefind-meta="fuente"` de adentro.

## Ranking

Pagefind pone muy arriba las páginas cortas con la palabra en el título: buscar "interrupciones" daba
tres ejercicios (17,5) antes que Repaso de arquitectura (7,6). Se probó `ranking.pageLength` (de 0,75
a 0) y casi no cambia. **Decisión:** se agrupa: primero "Teoría" (hasta 4) y después "Ejercicios"
(hasta 6), cada grupo en el orden de Pagefind. Las secciones de un tema se eligen primero por
nombrar lo buscado (sin tildes, por raíz) y después por cantidad de coincidencias.

## Gotchas

- **En `pnpm dev` no hay índice:** se genera al final del build. El diálogo avisa; para probar,
  `pnpm build && pnpm preview`.
- **Las tildes no importan:** "semaforos" encuentra "semáforos".
- **Lo oculto no aparece:** lo que filtra `getEjercicios` (ver [[Simulacros]], exámenes ocultos) no
  llega a `dist/`, así que tampoco al índice.
- **Tamaño:** `dist/pagefind` pesa ~1,2 MB, pero cada búsqueda baja unos pocos KB.

**Conectado con:** [[Arquitectura]], [[Decisión — Astro SSG sin backend ni React]]
