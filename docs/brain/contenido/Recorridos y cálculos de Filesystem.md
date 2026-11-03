---
tipo: componente
aliases:
  [
    filesystem,
    file system,
    FAT,
    ext2,
    UFS,
    inodo,
    punteros indirectos,
    cadena FAT,
    hard link,
    soft link,
    filesystem.ts,
    accesosByte,
    accesosRango,
    espacioFat,
    maxArchivoExt2,
    ubicarByte,
  ]
tags: [componente, contenido, svg, interactivo, filesystem]
actualizado: 2026-11-03
---

# Recorridos y cálculos de Filesystem

**Propósito:** cuentas de FAT y ext2 verificadas con tests, y los recorridos de los temas
_Filesystem_ y _FAT y UFS (ext2)_.

## Cálculos puros

**Ubicación:** `src/lib/diagramas/filesystem.ts` (+ `filesystem.test.ts`, con valores de la guía y de
resoluciones de parciales).

```ts
espacioFat(32, 4 * KiB, 8 * GiB) // { teorico, real, entradas, tamanoTabla }
maxArchivoExt2({ directos: 12, simples: 1, dobles: 1, triples: 1 }, 1 * KiB, 4)
accesosByte(conf, 4 * KiB, 8, 16777227) // punteros + datos, sin el inodo
```

Cada número de las resoluciones de `ejercicios/fat-ufs/` sale de acá. Los criterios (28 bits en FAT32,
el inodo no cuenta) están en [[Convenciones de la Cátedra FRBA]].

## Recorridos

| id | Archivo | Tema / sección |
| --- | --- | --- |
| `archivos-abiertos` | `recorridos/filesystem.ts` | Filesystem · Apertura y modos de apertura |
| `metodos-asignacion` | `recorridos/filesystem.ts` | Filesystem · Métodos de asignación (3 pestañas) |
| `cadena-fat` | `recorridos/fat-ufs.ts` | FAT y UFS · La tabla FAT (ejemplo de la PPT) |
| `byte-inodo` | `recorridos/fat-ufs.ts` | FAT y UFS · Leer el byte N (PD, IS, ID, IT) |
| `hard-soft-link` | `recorridos/fat-ufs.ts` | FAT y UFS · Links (hard y soft) |

- `byte-inodo` usa el inodo de la PPT (4 PD, bloque 1 KiB, puntero 4 B), no el 12 PD por defecto.
  `ubicarByte()` (interna de `fat-ufs.ts`) devuelve la entrada de cada nivel para dibujar; no es un
  duplicado de `accesosByte`, que solo cuenta.
- `cadena-fat` asume clusters de 1 KiB (la PPT no lo dice; 2000 B en 2 clusters y 3000 B en 3
  cierran). En "agrandar tp.c" dice "supongamos la 2": la PPT marca libres la 0 y la 1, que en una
  FAT real están reservadas.

## Gotchas

- Si `valores` vacía el `val` de un `nodo`, se pierde el subtítulo: reescribí el texto completo
  (`'nivel 1 · entrada 0'`).
- Flechas que dependen de la pestaña: una por caso, ocultas (`a-p4-n1`, `a-pd2-dato`), porque el
  dibujo es el mismo para todas las variantes.
- Ej. 11 (links) va **todo en MC**, también el "cuántos archivos": la página ordena cálculos antes que
  MC y un cálculo del b) quedaría arriba del MC del a), delatándolo.

**Depende de:** [[Recorridos paso a paso]]
**Conectado con:** [[Contenido]], [[Recorridos de Memoria]], [[Convenciones de la Cátedra FRBA]]
