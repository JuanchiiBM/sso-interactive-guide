---
tipo: home
aliases: [home, índice, indice, brain, cerebro, vault]
tags: [moc, home]
alcance: sso-interactive-guide/**
actualizado: 2026-09-25
---

# Brain — SO Interactivo (UTN FRBA)

Guía interactiva de Sistemas Operativos: teoría + ejercicios de las guías de la cátedra con
resoluciones paso a paso. Sitio estático, sin backend.

**Stack:** Astro 7 (SSG) · Tailwind v4 · TypeScript en JS plano (sin React) · vitest · pnpm.
**Alcance:** todo el repo. Deriva de la arquitectura de alg0.dev, pero este brain no la cubre.

## Módulos

- [[Arquitectura]] — cómo fluye el contenido desde markdown hasta el simulador en el navegador.
- [[Simuladores]] — resolvedores paso a paso (lógica pura + visualizador).
- [[Contenido]] — teoría y ejercicios: formato, schema, fuentes.
- [[Simulacros]] — los parciales reales como examen con reloj, nota y mejor resultado.
- [[Dominio SO]] — convenciones de la cátedra que el código tiene que respetar.

## Fuera del brain

- `AGENTS.md` — reglas operativas cortas (comandos, tokens, DOM helpers).
- `src/content.config.ts` — el schema real; si una nota contradice al schema, gana el schema.
