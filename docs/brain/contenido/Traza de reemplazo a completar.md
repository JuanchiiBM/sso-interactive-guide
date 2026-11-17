---
tipo: componente
aliases:
  [
    traza,
    traza de reemplazo,
    grilla de reemplazo,
    tabla de reemplazo a completar,
    TrazaDesafio,
    trazaEsperada,
    verificarTraza,
    crearTrazaExamen,
    hit,
    puntero,
    page fault,
  ]
tags: [componente, contenido, desafio, memoria]
actualizado: 2026-11-17
---

# Traza de reemplazo a completar

**Propósito:** el alumno completa la grilla de la cátedra (frames × referencias) en lugar de
escribir solo los totales: página de cada frame, **H** (hit), bits **U**/**M**, puntero **P**,
**PF** / **INV** por referencia y **Disco** (víctima con M = 1). Las respuestas **no se escriben a
mano**: salen en build del mismo algoritmo que arma los recorridos.

**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Lógica pura (esperada, comparación, puntaje) | `src/lib/calculos/traza.ts` + `traza.test.ts` |
| Componente | `src/components/TrazaDesafio.astro` |
| Cliente (práctica y `crearTrazaExamen`) | `src/lib/desafios/traza.ts` |
| Algoritmos | `reemplazoConEstado` (LRU, FIFO, Clock, Clock mejorado) y `reemplazo` (Óptimo) en `src/lib/diagramas/memoria.ts` |
| Estilos | `src/styles/simulador.css`, sección "Traza de reemplazo" (`traza-*`) |

**Uso:** es una variante de `calculos` (`traza:` en lugar de `campos`/`tabla`), así que progreso
(`ruta#calc-N`), `encadenado` y simulacros funcionan igual.

```yaml
encadenado: true
calculos:
  - enunciado: 'a) Completá la traza con **LRU**: páginas, hits, bit M, page faults y escrituras a disco.'
    traza: &traza
      marcos: # estado inicial; `marcos: 4` = frames 0–3 vacíos
        - { marco: 1, pagina: 14, u: true, m: true, ultimoUso: 28 }
        - { marco: 8 } # libre
      puntero: 1 # POSICIÓN en la lista de marcos, no el número de frame
      referencias: # `[0, 1, 7]` = lecturas de esas páginas
        - { etiqueta: '122950', pagina: 15, acceso: E }
        - { etiqueta: '172100', pagina: null } # dirección inválida
      algoritmos: [lru] # optimo | fifo | lru | clock | clock-mejorado
      invalida: true # muestra INV en todas las columnas
    justificacion: |
      ...
  - enunciado: 'a) … con **Clock mejorado** …'
    traza:
      <<: *traza # ancla YAML: mismo estado y referencias
      algoritmos: [clock-mejorado]
    justificacion: |
      ...
```

- **Reemplazo global con varios procesos:** las páginas van como rótulo de texto (`pagina: A3`) en
  marcos y referencias; la etiqueta de la referencia, lo que dice el enunciado (`'PA 6195'`). Se
  comparan sin mayúsculas ni espacios. Con rótulos, los atajos de teclado van con Alt.
- **Qué marca cada algoritmo** (`marcarDe`): H siempre; U y P en Clock y Clock mejorado; M y Disco
  solo si hay escrituras o algún frame arranca con M = 1. FIFO no pide puntero.
- La cabecera muestra la **página** en grande y, si difiere, la etiqueta (dirección) chica.

## Decisiones

- **Una parte por algoritmo**, no pestañas (pedido del dueño): se verifica cada traza por su lado.
  Con `algoritmos: [a, b]` igual se muestran pestañas.
- **Encadenar:** la grilla delata páginas, frames y PF. Si un inciso anterior pide calcularlos
  (página de cada dirección, DF, cantidad de PF), la traza va **después** y el ejercicio lleva
  `encadenado: true`. La justificación con el recorrido de **todos** los algoritmos va solo en la
  **última** traza; las anteriores explican el suyo en texto.
- **Sin marca = hit.** No hay botón "Acierto": PF e INV son las excepciones.
- **Feedback** solo correcto/incorrecto, como el resto ([[Patrón — Desafío antes de la Resolución]]).
  En simulacros el puntaje es la fracción de **columnas** bien y al corregir cada cabecera se pinta.
- "Copiar columna anterior" (⇥) trae páginas, U, M y P; nunca H, resultado ni disco.

## Gotchas

- `marcos` con páginas cargadas + `optimo` rompe el build: Óptimo solo arranca de frames vacíos.
- LRU desde un estado necesita `ultimoUso` en cada marco cargado (el instante de referencia).
- Clock simple y FIFO desde un estado usan el puntero como la cátedra: la víctima de FIFO es la
  del puntero; en Clock, el puntero baja los U = 1 que encuentra.

**Depende de:** [[Recorridos de Memoria]]
**Conectado con:** [[Formato de un Ejercicio]], [[Patrón — Desafío antes de la Resolución]], [[Simulacros]]
