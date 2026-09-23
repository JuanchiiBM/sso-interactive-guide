---
tipo: decision
aliases: [tema, theme, dark mode, light mode, modo oscuro, modo claro, tokens, colores, data-theme]
tags: [decision, ui, estilos]
actualizado: 2026-09-23
---

# Decisión — Tokens semánticos para modo claro y oscuro

**Fecha:** 2026-09-23
**Estado:** vigente

**Contexto:** hace falta modo claro y oscuro. alg0.dev lo resolvió pisando utilidades de Tailwind en
light (`[data-theme='light'] .bg-black {…}`), lo que obliga a mantener una lista de overrides.
**Decisión:** variables CSS semánticas en `src/styles/global.css` (`--surface`, `--fg`, `--line`,
`--accent`, `--p1…--p8` para procesos), redefinidas bajo `[data-theme='light']`, y expuestas a
Tailwind con `@theme inline` → `bg-surface`, `text-fg`, `border-line`, etc.
**Por qué:** un componente nuevo queda bien en ambos temas sin tocar CSS global.
**Cómo funciona el toggle:** `[data-theme-toggle]` → `toggleTheme()` (`src/lib/theme.ts`) guarda
cookie `theme` y emite `themechange`. Un script inline en `Layout.astro` resuelve el tema antes del
primer paint (cookie → `prefers-color-scheme`) para evitar el flash.
**Gotchas:**

- Mermaid se re-renderiza al cambiar el tema (`lib/mermaid.ts` escucha `themechange`).
- Shiki emite ambas paletas; el CSS de `global.css` elige la oscura con `[data-theme='dark']`.
- `prose.css` y `simulador.css` se importan con `layer(components)`: si quedan fuera de capa le
  ganan a las utilidades de Tailwind (ej. `max-w-none` no pisaba el `max-width` de `.prose`).
- Colores de procesos siempre `var(--pN)`, nunca hex: en light están oscurecidos para contraste.

**Conectado con:** [[Arquitectura]]
