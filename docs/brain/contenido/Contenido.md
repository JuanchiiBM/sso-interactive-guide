---
tipo: modulo
aliases: [contenido, teoría, teoria, ejercicios, markdown, guías]
tags: [moc, contenido]
actualizado: 2026-11-10
---

# Contenido

Teoría (`src/content/temas/`) y enunciados (`src/content/ejercicios/`), todo en markdown.

- [[Formato de un Ejercicio]] — frontmatter, convenciones de markdown y columnas de código.
- [[Formato de un Tema de Teoría]] — estructura de cada tema del resumen.
- [[Bloques SVG grafo y diagrama]] — ```grafo y ```diagrama en markdown.
- [[Recorridos paso a paso]] — diagramas de teoría interactivos (```recorrido <id>).
- [[Celdas a calcular en enunciados]] — celdas `(a calcular)` de tablas → campo para anotar.
- [[Fuentes y Derechos del Material]] — de dónde sale cada cosa y qué no se sube.
- [[Content Collections Temas y Ejercicios]] — cómo se cargan y rutean.
- [[Recorridos de Memoria]] — algoritmos y generadores de los diagramas de memoria.
- [[Recorridos y cálculos de Filesystem]] — FAT, ext2, links; lib pura de cuentas de FS.

## Inventario 1er parcial

| Tema           | Ejercicios | Fuente                                 |
| -------------- | ---------- | -------------------------------------- |
| Planificación  | 11         | Guía Planificación v.2C2026, Parte 1–2 |
| Hilos          | 5          | Guía Planificación v.2C2026, Hilos     |
| Sincronización | 13         | Guía Sincronización v.2C2026           |
| Deadlock       | 9          | Guía Deadlock v.2C2026                 |

Las tres guías (y la de Filesystem v.2C2026) cierran con un link a Google Forms de "ejercicios avanzados" que no está en los PDFs.

## Inventario 2do parcial

| Tema | Ejercicios | Fuente |
| --- | --- | --- |
| Memoria real | 5 + 6 de parcial | Guía de Ejercicios – Memoria (2016, Rev. 1): Ej. 1–4 y 11 |
| Memoria virtual | 6 + 15 de parcial | Guía de Ejercicios – Memoria (2016, Rev. 1): Ej. 5–10 |
| Filesystem | 6 + 4 de parcial | Guía de Ejercicios – Filesystem (v.2C2026): Ej. 23–28 (locks) |
| FAT y UFS (ext2) | 22 + 30 de parcial | Guía de Ejercicios – Filesystem (v.2C2026): Ej. 1–22 (FAT, ext2 y links) |

**Parciales del 2do (1C2024 → 1C2026, 15 exámenes):** teoría en `simulacro(-N)` de cada tema (28, 41, 30 y
30 preguntas) y práctica desde el número que sigue a la guía. Los ejercicios que mezclan memoria y
FAT/ext2 van en FAT y UFS. Los desarrollos se pasaron a MC; se descartó 2R 2C2024 V/F 4a (la cátedra acepta
V y F).

Los **links** van en FAT y UFS, no en Filesystem: la teoría (y la PPT FAT-UFS) los explica sobre el
inodo. En ese tema el número de cada ejercicio coincide con el de la guía.

Teoría: PPT Memoria Real + Resumen SO págs. 71–84; PPT Memoria Virtual + Resumen SO págs. 85–99;
PPT FileSystem + Resumen SO págs. 100–112; PPT FAT-UFS + Resumen SO págs. 113–121.
Los ejercicios se numeran **por tema** y el número original va en `guia: '… · Ej. N'` (ver
[[Formato de un Ejercicio]]). Casi todos se resuelven con `calculos` (resultado exacto); ver
[[Patrón — Desafío antes de la Resolución]].
