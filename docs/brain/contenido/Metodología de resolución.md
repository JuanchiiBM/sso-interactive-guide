---
tipo: componente
aliases:
  [
    metodología,
    metodologia,
    recetas,
    receta,
    resolución de ejercicios,
    tipos de ejercicio,
    tipo de ejercicio,
    cómo se resuelve,
    mapa de tipos,
    trampas,
    antes de entregar,
    checklist,
    metodo,
    en-ejercicios,
    getMetodologias,
    ChecklistEntrega,
  ]
tags: [componente, contenido, rutas]
actualizado: 2026-11-22
---

# Metodología de resolución

**Propósito (issue #57):** por tema, cómo **reconocer** cada tipo de ejercicio, la **receta**, **de
dónde sale** cada número y las **trampas**. Es genérica: ejemplos chicos con datos propios, nunca
resoluciones de parciales (esas están en los ejercicios, linkeados como "Practicalo en").

**Diseño aprobado:** alternativa **A · Guía lineal** del lienzo
https://claude.ai/artifact/T8mxg74oHk5xjF8BYGVtNw (privado del dueño), sin pestañas, con **E2**
(tipo en la línea de datos del ejercicio) y **T2** (línea suelta en la teoría). Registro en
`docs/designs/metodologia/README.md` (fuera de git).

| Qué | Dónde |
| --- | --- |
| Un tipo por archivo | `src/content/metodologia/<parcial>/<tema>/<id>.md` (colección `metodologia`) |
| Página | `src/pages/metodologia/[...id].astro` → `/metodologia/parcial-2/memoria-real/` |
| Checklist "Antes de entregar" (igual en todos) | `src/components/ChecklistEntrega.astro` |
| Validación de build | `src/lib/metodologia/validar.ts` (+ test) |
| Agrupar por tema | `getMetodologias()` en `src/lib/catalogo.ts` |
| Estilos | `prose.css`, `.prose.metodologia`, `.checklist-entrega`, `.en-ejercicios` |

## Un tipo

```yaml
---
titulo: DL → DF en hexa
tema: parcial-2/memoria-real
orden: 2 # orden en el mapa y en la página
reconocer: da una DL en hexa y la tabla, y pide la DF # fila del mapa "Si el enunciado…"
resumen: Te dan …; te piden … # línea bajo el título
trampas: ['**Arranque en negrita:** el resto.'] # markdown inline
teoria: [cortar-la-dirección, { ancla: traducción, texto: 'Paginación: traducción' }]
---
```

Cuerpo: `### Receta`, `### De dónde sale cada valor` (tabla con encabezados vacíos `| | |`) y
`### Ejemplo chico` (datos propios, con los bloques `traduccion`, `memoria`, `fat`, `inodo`,
`links` o `locks`).

El **id** del tipo es el nombre del archivo y es su ancla en la página (`#dl-df-hexa`). La página
arma sola, después del cuerpo: "Practicalo en …" (los ejercicios con ese `metodo`), Trampas y "En la
teoría" (el texto sale del título real de la sección si no se da `texto`).

## Cómo se llega

- **Sidebar:** Teoría · Metodología · ejercicios, solo en temas con tipos.
- **Teoría, bajo el resumen:** "¿Cómo se encaran los ejercicios? Metodología de resolución →".
- **Ejercicio:** `metodo: [dl-df-hexa]` en el frontmatter → "Tipo: … →" en la línea de datos. No
  aparece en `/simulacros/` (esa página no dibuja la línea de datos).
- **Teoría, al final de una sección (T2):** se escribe a mano en el `.md` del tema:
  `<p class="en-ejercicios">↳ En ejercicios: <a href="/metodologia/parcial-2/fat-ufs/#leer-byte">…</a></p>`.
  Astro no deja insertar nada al final de una sección de `<Content/>`, por eso no se genera.

## Qué rompe el build

- Un `metodo` de ejercicio que no es tipo de **su** tema (página del ejercicio y de la metodología).
- Un ancla de `teoria:` que no está entre los títulos del tema (`render(tema).headings`: el mismo
  slug de Sätteri/github-slugger, con tildes: `cortar-la-dirección`).
- Un link `/metodologia/<tema>/#<tipo>` en la teoría a un tipo que no existe.

## Gotchas

- **ids repetidos:** cada tipo se renderiza aparte, así que `#receta`, `#ejemplo-chico`… se repiten
  en la página. Nada los usa (el índice va por los `##` de los tipos).
- **"De dónde sale" sin encabezados:** `thead` con todas las celdas vacías se oculta, y en celular
  esas tablas y el mapa se apilan (filas en vez de columnas).
- El checklist tilda pero **no guarda**: es a propósito, sin progreso.
- Buscador: `tipo:Metodología` entra en el grupo de Teoría (`agrupar` en `resultados.ts`).
- Fuera, por decisión del dueño: §0 "Herramientas de cuenta" (ya está en la teoría de Memoria real)
  y "Teoría que falló en simulacros". Ejercicios sin tipo (TLB, tabla invertida, clasificación de
  asignación) quedan sin `metodo`.

**Conectado con:** [[Contenido]], [[Formato de un Ejercicio]], [[Resolución gráfica paso a paso]],
[[Content Collections Temas y Ejercicios]], [[Convenciones de la Cátedra FRBA]]
