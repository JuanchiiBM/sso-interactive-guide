---
tipo: decision
aliases: [astro, ssg, static, sin backend, no react, vanilla, plain js, framework]
tags: [decision, arquitectura]
actualizado: 2026-09-23
---

# Decisión — Astro SSG sin backend ni React

**Fecha:** 2026-09-23
**Estado:** vigente

**Contexto:** el sitio es contenido de estudio + simuladores deterministas. No hay usuarios, ni
persistencia compartida, ni datos que cambien en runtime.
**Decisión:** Astro en modo estático, JS plano en el cliente, deploy en Vercel. Se copió el enfoque de
alg0.dev, que migró de React a Astro + JS plano (`09a2853` en ese repo).
**Por qué:** los simuladores son funciones puras baratas: correrlas en el cliente evita mandar cada
paso serializado. El HTML queda indexable y la página pesa poco. Un framework de UI no aporta nada
para repintar un grid chico por paso.
**Descartado:**

- _Backend / API_ — no hay nada que calcular del lado del servidor.
- _React/Preact islands_ — hidratación y bundle extra para un repintado trivial.
- _Precalcular los steps en build y embeberlos_ (como hace alg0) — el Gantt repite el resultado
  completo en cada paso; mandar solo la config es órdenes de magnitud más chico.

**Consecuencias:** el estado de la UI vive en módulos de `src/lib/` suscritos al playback. Si algún
  día hace falta progreso del alumno, va en `localStorage` o se reevalúa esta decisión.

**Conectado con:** [[Arquitectura]], [[Patrón — Steps y Playback]]
