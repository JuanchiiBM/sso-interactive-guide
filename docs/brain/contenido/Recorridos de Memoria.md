---
tipo: componente
aliases:
  [
    memoria,
    recorridos de memoria,
    reemplazo de páginas,
    recorridoReemplazo,
    memoria.ts,
    primitivas-memoria,
    barraMemoria,
    celdaM,
    tablaM,
    buddy,
    particionamientoDinamico,
    clockMejorado,
    fotogramas,
  ]
tags: [componente, contenido, svg, interactivo, memoria]
actualizado: 2026-10-08
---

# Recorridos de Memoria

**Propósito:** los diagramas paso a paso de Memoria real y Memoria virtual. Los números no se
escriben a mano: salen de algoritmos puros testeados, así que cambiar un ejemplo es cambiar los datos.

**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Algoritmos puros (reemplazo, clock mejorado, buddy, particiones dinámicas, ubicación, traducción, working set) | `src/lib/diagramas/memoria.ts` + `memoria.test.ts` |
| Generador de recorridos de reemplazo (grilla de la cátedra) | `src/lib/diagramas/recorrido-reemplazo.ts` |
| Primitivas: barra de memoria, celdas y tablas | `src/lib/diagramas/primitivas-memoria.ts` |
| Recorridos | `recorridos/memoria-real.ts` (9), `recorridos/memoria-virtual.ts` (12) |
| Estilos | `src/styles/diagramas.css`, sección "memoria real y virtual" (`rm-*`) |

**Uso:**

```ts
// una variante por algoritmo; el paso 1 junta la carga inicial y después va una referencia por paso
recorridoReemplazo({ refs: [2, 3, 2, 1, 5], marcos: 3, algoritmos: ['fifo', 'lru'], titulo: '…' })
// barra de memoria: un "fotograma" por estado, oculto hasta que un paso lo muestra
barraMemoria('f3', x, y, w, h, total, segmentos, { oculto: true, marcas: true })
```

## Técnica: fotogramas

Un recorrido no puede cambiar el tamaño de un rectángulo: solo resalta, muestra/oculta y cambia
textos. Cuando la memoria cambia de forma (particiones, buddy), se dibuja **una barra por estado**,
todas ocultas, y cada paso muestra la suya y oculta las demás. Para marcar un hueco dentro de una
barra (sus partes no tienen `data-el`) se superpone un contorno aparte (`rm-sel`), oculto hasta su paso.

## Gotchas

- **La grilla de reemplazo resalta todas las columnas pasadas** para que no se atenúen; por eso sus
  celdas llevan `rm-grilla`, que apaga el acento del resaltado. El paso actual se marca con clases:
  `rc-mal` donde entró la página (PF), `rc-ok` en un acierto, `rc-aviso` en la referencia.
- **Óptimo, empate:** si varias páginas no se vuelven a usar, sale la del **primer marco**. Así da la
  tabla de la diapositiva (ref. 10 de la secuencia de clase).
- **Clock:** la página entra con U = 1 y el puntero queda en el marco siguiente; en un acierto el
  puntero no se mueve. FIFO usa el mismo puntero. `memoria.test.ts` fija la fila del puntero de la PPT.
- **Belady** necesita dos recorridos (`belady-3`, `belady-4`): las variantes comparten lienzo y la
  cantidad de filas depende de los marcos.
- Un `nodo` que hace falta ocultar y después mostrar tiene que nacer con `oculto: true`: el test
  genérico exige que todo lo que se oculta en un paso sea un grupo oculto.

**Depende de:** [[Recorridos paso a paso]]
**Conectado con:** [[Convenciones de la Cátedra FRBA]] (sección Memoria), [[Contenido]]
