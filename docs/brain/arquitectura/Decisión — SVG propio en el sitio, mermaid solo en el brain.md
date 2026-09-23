---
tipo: decision
aliases: [mermaid, diagramas, grafos, svg, visualizaciones, gráficos, graficos]
tags: [decision, ui, contenido]
actualizado: 2026-09-23
---
# Decisión — SVG propio en el sitio, mermaid solo en el brain

**Fecha:** 2026-09-23
**Estado:** vigente

**Contexto:** la primera versión dibujaba en el sitio los grafos de asignación y los diagramas de
teoría con mermaid (render en el cliente). Se veían genéricos y "horribles" en el tema oscuro. Además,
en `pnpm dev` el import dinámico podía fallar y dejaba una caja vacía.
**Decisión:** **mermaid se usa solo en `docs/brain/`** (lo lee Obsidian/GitHub). En el sitio, todo lo
visual es SVG propio al estilo de alg0.dev, generado **en build** con tokens del tema:
[[Bloques SVG grafo y diagrama]]. Lo interactivo (Gantt) sigue siendo DOM propio.
**Por qué:** control total del estilo, ambos temas sin JS, sin 600 KB de mermaid y sin render en el
cliente que pueda fallar.
**Descartado:** tematizar mermaid con `themeVariables`: sigue siendo su layout y su estética.
**Consecuencias:** cada diagrama conceptual nuevo se dibuja a mano en `src/lib/diagramas/`; los grafos
de asignación salen de datos con el bloque ```grafo.
**Conectado con:** [[Arquitectura]], [[Decisión — Tokens semánticos para modo claro y oscuro]]
