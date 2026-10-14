---
tipo: componente
aliases: [content collections, colecciones, catalogo, getCatalogo, temas, ejercicios, rutas, ids, astro content]
tags: [componente, contenido, rutas]
actualizado: 2026-10-14
---

# Content Collections Temas y Ejercicios

**Propósito:** cargar y validar la teoría y los enunciados, y agruparlos para navegación.
**Ubicación:** schema en `src/content.config.ts`; queries en `src/lib/catalogo.ts`.

| Colección    | Carpeta                          | id de ejemplo             | URL                                |
| ------------ | -------------------------------- | ------------------------- | ---------------------------------- |
| `temas`      | `src/content/temas/parcial-N/`   | `parcial-1/planificacion` | `/teoria/parcial-1/planificacion/` |
| `ejercicios` | `src/content/ejercicios/<tema>/` | `planificacion/ej-05`     | `/ejercicios/planificacion/ej-05/` |

**Uso:**

```ts
import { getCatalogo, temaHref, ejercicioHref } from '@lib/catalogo'
const catalogo = await getCatalogo(1) // [{ tema, ejercicios }] del 1er parcial, ordenado
const porParcial = await getCatalogoPorParcial() // [{ numero, temas }], solo parciales con temas
parcialUI(2) // '2do parcial'
```

La home, el sidebar, el índice de teoría y el de ejercicios agrupan por parcial con
`getCatalogoPorParcial`: un tema con `parcial: 2` aparece solo. En `/ejercicios/` se omiten los
temas sin ejercicios, y los filtros ocultan el título de un parcial si no queda ningún tema visible.

**Gotchas:**

- El id sale de la ruta del archivo (loader `glob`). Mover un archivo cambia su URL.
- `tema:` del ejercicio es un `reference('temas')`: si el tema no existe, el build rompe al
  renderizar el ejercicio (no al validar).
- Orden de ejercicios: `fuente.numero` con comparación numérica (`'10'` va después de `'9'`).

**Conectado con:** [[Arquitectura]], [[Formato de un Ejercicio]]
