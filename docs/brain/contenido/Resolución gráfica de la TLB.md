---
tipo: componente
aliases:
  [
    bloque tlb,
    tlb-bloque,
    recorridoTlb,
    simularTlb,
    TLB FIFO,
    LRU local,
    camino de la referencia,
    dos niveles,
    bitmap de frames,
    recorridoTlbNiveles,
    simularNiveles,
    bloque deducir,
    deducir-bloque,
    deducir el algoritmo,
    recorridoDeducir,
    comparar algoritmos,
    víctima real,
  ]
tags: [contenido, recorrido, memoria, svg]
actualizado: 2026-11-22
---

# Resolución gráfica de la TLB y deducir el algoritmo

**Propósito:** dos bloques para las `justificacion` de memoria virtual (issue #65). Siguen el patrón
de [[Resolución gráfica paso a paso]].

- ` ```tlb `: el camino de cada referencia por la TLB, un paso por referencia.
- ` ```deducir `: la víctima real (sale de la DF) contra la que elegiría cada algoritmo.

**Diseño aprobado:** tablero https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P, página _#65 TLB y
algoritmos_. `tlb-B` (ej-07 paso 4) y `tlb-D` (ej-18) son los aprobados. En la fila de abajo están
las extensiones: `tlb-1`, `tlb-2`, `tlb-3` y `tlb-5` (los otros pasos de ej-07), `tlb-06` (sin
direcciones), `tlb-08` (dos niveles), `tlb-11` (dos algoritmos, puntero libre) y `tlb-16` (varias
referencias).

## ` ```tlb `

```yaml
titulo: Referencias de A y B con TLB FIFO y LRU local
bitsPagina: 6 # sin bits (ej-06): las referencias son páginas y se cuentan accesos
bitsOffset: 14
bitsFrame: 4
entradas: 4 # capacidad; `tlb` es el contenido inicial (FIFO por `ingreso`)
tlb:
  - { pagina: 11, frame: 2, proceso: A, ingreso: 50 }
procesos: # frames de cada proceso (reemplazo local LRU); sin `pagina`, libre
  A: [{ frame: 2, pagina: 11, acc: 80 }, { frame: 5 }]
referencias:
  - { proceso: A, dl: 0x2F022, instante: 90 } # con un solo proceso: [10, 11, 0, …]
```

**Etapas** (solo las que se dan, y se renumeran): DL → TLB (hit o miss, y por qué) → tabla de
páginas (P) → LRU (víctima o frame libre) → TLB FIFO (sale / entra) → DF. Sin bits, la última etapa
es "Accesos" (TLB · memoria · disco). Debajo van "TLB después de este paso" (la nueva en `--ok`) y
"Hasta acá".

**Dos niveles (ej-08):** con `niveles: [8, 8]`, en lugar de `procesos` van `tp1` (entrada → dirección
de su tabla), `tablas` (dirección → `{ pág: { frame, p } }`) y `bitmap: { desde, bits }`. El PF toma
el primer libre del bitmap y la TLB agrega sin reemplazar.

| Qué | Dónde |
| --- | --- |
| Simulación (TLB FIFO + LRU local) | `tlb.ts` (+ test, casos en `tlb.ejemplos.ts`) |
| Etapas y textos | `recorrido-tlb.ts` (+ test) |
| Dibujo (camino, tablas, "Hasta acá") | `recorrido-tlb-svg.ts` |
| Dos niveles + bitmap | `tlb-niveles.ts` (+ test), `recorrido-tlb-niveles.ts` |
| Bloque markdown | `tlb-bloque.ts`, enganchado en `bloques-svg.ts` |
| Estilos | `diagramas.css`, secciones `tlb-*` y `ded-*` |

## ` ```deducir `

```yaml
titulo: ¿Qué algoritmo sacó a B2?
bitsOffset: 20
bitsDL: 32
bitsDF: 28
uso: TUR # nombre de la columna de última referencia (REF, TS…)
marcos: # en el orden del puntero
  - { frame: 20, proceso: B, pagina: 2, tur: 100, tc: 100, u: 0, m: 1 }
referencias: [{ proceso: A, dl: 0x00BB1233, df: 0x14B1233, acceso: E }]
algoritmos: [fifo, lru, clock, clock-mejorado] # solo los que plantea el ejercicio
puntero: 20 # opcional
```

**Pasos:** Decodificar (DL → página, DF → frame → víctima) · Comparar (tabla con una columna por
algoritmo, "¿Coincide?", una tarjeta por algoritmo con el porqué y la respuesta). Con varias
referencias (ej-16), la tabla tiene una fila por referencia y un "—" después del primer desvío.

- Las víctimas de cada algoritmo salen de `reemplazoConEstado` (`deducir.ts`): no pueden contradecir
  la traza. LRU usa `tur`. FIFO usa el menor `tc` si lo hay y, si no, el orden de los frames.
- **Puntero desconocido:** se prueba cada posición. La tarjeta dice "con el puntero en el frame N"
  o "pasa sea cual sea el puntero".

## Decisiones

- **Un paso inicial** ("Estado inicial") antes de las referencias: por eso ej-07 tiene 6 pasos.
- **Etapas que no se dan se omiten**, no se atenúan (hit: DL → TLB → DF).
- **ej-11 compara solo LRU y Clock mejorado:** Clock simple también daría ✓ (puntero en el 11) y
  confundiría con la pregunta.
- Del texto de `tlb-D` se omitió "salen de reemplazoConEstado": es una nota de diseño, no va al alumno.
- En la tabla, una sola víctima va como en D (`B2`); con varias referencias, como en el enunciado
  (`PB3`).

## Gotchas

- Rompe el build: la víctima **queda** en la TLB (si FIFO también la saca, vale: ej-06), un instante
  que no es posterior a los `acc` del proceso (LRU daría otra víctima), FIFO por TC con más de una
  referencia, un frame de la DF que no está en `marcos`, o la TLB de dos niveles llena.
- `deducir` mide su ancho por la tabla. ej-18 llega a 819, así que lleva `in-ancho` (como el inodo).
- Prettier convierte ` ` en espacios duros reales: un `\s+` de un test los normaliza.
- Después de un "Failed to load url astro:server-app.js" en dev, Astro sigue sirviendo el `.md`
  viejo: hay que reiniciar el dev server.

**Depende de:** [[Traza de reemplazo a completar]], [[Recorridos paso a paso]]
**Conectado con:** [[Resolución gráfica paso a paso]], [[Formato de un Ejercicio]]
