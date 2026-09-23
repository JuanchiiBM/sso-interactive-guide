---
tipo: patron
aliases: [agregar simulador, nuevo simulador, nuevo kind, extender, add solver]
tags: [patron, simuladores]
actualizado: 2026-09-23
---

# Cómo agregar un simulador

**Cuándo aplicarlo:** un tipo de ejercicio nuevo necesita resolución paso a paso (banquero, VRR,
traza de semáforos, paginación…).

**Cómo:**

1. **Schema** — agregar una variante a `simulacionSchema` en `src/content.config.ts` con
   `kind: z.literal('<tipo>')` y `etiqueta` opcional.
2. **Lógica pura** — `src/lib/simuladores/<tipo>/simular.ts` + `tipos.ts`. Sin DOM, sin `window`.
3. **Tests** — `simular.test.ts` con al menos un caso de resultado conocido (libro o resuelto a mano).
4. **Pasos** — `pasos.ts`: `config → Step<Estado>[]`, con `descripcion` en lenguaje de cátedra.
5. **Visualizador** — `src/lib/visualizers/<tipo>.ts`: `render(root, estado)`, solo tokens de color.
6. **Desafío** — `verificar.ts` puro con test + widget en `src/lib/desafios/<tipo>.ts`
   (ver [[Patrón — Desafío antes de la Resolución]]).
7. **Registro** — sumar la entrada en `SIMULADORES` de `src/lib/simulador-page.ts`.
8. **Contenido** — cargar `simulaciones:` en el frontmatter de los ejercicios que lo usan.
9. **Brain** — nota del simulador + actualizar la tabla de cobertura en [[Simuladores]].

**Cuándo NO usarlo:** si el algoritmo es una variante de uno existente (ej. VRR sobre RR), extender
el simulador existente con una opción en vez de crear un `kind` nuevo.
**Conectado con:** [[Simuladores]], [[Patrón — Steps y Playback]]
