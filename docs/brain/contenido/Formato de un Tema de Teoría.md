---
tipo: referencia
aliases: [tema, teoría, teoria, resumen, formato tema, preguntas de parcial]
tags: [contenido, teoria]
actualizado: 2026-09-25
---

# Formato de un Tema de Teoría

**Ubicación:** `src/content/temas/parcial-N/<slug>.md`.

```yaml
---
titulo: Planificación de CPU
parcial: 1
orden: 4 # orden dentro del parcial (sidebar, home, prev/next)
resumen: Una línea, se muestra en cards y como meta description.
aliases: [scheduling, planificador]
---
```

Estructura del cuerpo:

- **Sin `#` H1**: el título lo pone la página desde el frontmatter.
- `##` para secciones (arman el índice lateral "En esta página"), `###` para subsecciones.
- Tablas para comparar; ` ```grafo ` o ` ```diagrama <id> ` solo si el diagrama explica algo (estados de un proceso,
  grafo de asignación). **Nunca mermaid en el sitio.**
- Fórmulas en `código inline` (no hay KaTeX).
- **Subíndices/superíndices**: no hay renderer de math (ni KaTeX ni MathJax), así que `T_{i-1}`, `$…$` o `\alpha`
  se ven literales. Fuera de código escribí `T<sub>i−1</sub>` / `x<sup>2</sup>` (el HTML pasa tanto en el cuerpo
  como en los campos de frontmatter que van por `marked`); dentro de `código inline` usá `T(i−1)`. Vale también
  para ejercicios. Lo vigila `src/lib/markdown/formulas.test.ts` (ignora bloques de código y campos `codigo`/`solucion`).
- Cierre: `## Preguntas de parcial` (pregunta en negrita + respuesta en `>`) y una línea de fuente.

**Redacción:** con palabras propias sobre el Resumen SO (Sistemas Operativos for Dummies); el repo es público.
**Conectado con:** [[Contenido]], [[Fuentes y Derechos del Material]]
