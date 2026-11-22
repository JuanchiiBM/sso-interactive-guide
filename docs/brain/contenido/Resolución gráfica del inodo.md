---
tipo: componente
aliases:
  [
    bloque inodo,
    inodo-bloque,
    recorridoInodo,
    accesosPorPuntero,
    punteros del inodo,
    PD,
    PIS,
    PID,
    PIT,
    bloque de punteros,
    BP,
    BD,
    accesos a bloques,
    in-ancho,
  ]
tags: [contenido, recorrido, filesystem, svg]
actualizado: 2026-11-22
---

# Resolución gráfica del inodo

**Propósito:** bloque ` ```inodo ` en una `justificacion`: lectura de un rango por los punteros del
inodo (byte → bloque → accesos), un paso por puntero. Sigue el patrón de
[[Resolución gráfica paso a paso]].

**Diseño aprobado:** tablero https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P, página _#61 Inodo_:
`inodo-A` (paso del PID, ej-47) y sus extensiones `inodo-1` (Ubicar), `inodo-2` (PD), `inodo-3`
(PIS), `inodo-5` (Total) e `inodo-PIT` (ej-38, muchos BP).

```yaml
titulo: Leer del byte 10500 al 544767
bloque: 1024 # bytes
puntero: 4 # bytes
punteros: { directos: 10, simples: 1, dobles: 1 } # triples opcional
bytes: [10500, 544767] # o  byte: 16777227  o  bloques: [9, 4107]
texto: El bloque 8 ya está en memoria. # opcional, va al paso Ubicar
```

**Pasos:** Ubicar (cuentas byte → bloque y qué cubre cada puntero) · uno por puntero hasta el
último que se lee (los PD juntos, cada indirecto aparte, aunque no lea nada) · Total. Los punteros
que quedan después del rango se ven atenuados, sin paso propio.

**Cada paso de puntero:** inodo con el puntero marcado (`--accent`; leídos con ✓, sin leer
atenuados) → bloque del puntero (`--warn`) con sus entradas usadas y `[k..n] sin usar` → BP de 2.º
(y 3.er) nivel con una barra de cuánto se lee. Debajo, la tabla "lo que tenías que completar"
hasta ese puntero, con la fila acumulada (BD `--ok`, BP `--warn`) y la leyenda PD/PIS/PID/PIT/BP/BD.

| Qué | Dónde |
| --- | --- |
| Desglose por puntero (datos y BP por profundidad) | `accesosPorPuntero()` en `filesystem.ts`; `accesosRango` lo suma |
| Pasos y textos | `recorrido-inodo.ts` (+ test) |
| Dibujo (inodo, cajas, columnas, tabla) | `recorrido-inodo-svg.ts` |
| Bloque markdown | `inodo-bloque.ts`, enganchado en `bloques-svg.ts` |
| Estilos | `diagramas.css`, sección `in-*` |

## Decisiones

- **Marco del recorrido existente** (texto del paso debajo, controles ← · →), no el del tablero
  (texto arriba): lo decidió el dueño para que se vea igual que memoria y traducción.
- **Miles con punto desde 5 cifras** (65.801, 2.097.151), también en el tablero A que decía 65801.
- **Muchos BP:** primera, `… [1..124]` / `… N más, enteros`, última. Las del medio siempre están
  enteras, por eso no se dibujan.
- **Varios punteros del mismo nivel:** `PIS 1`, `PID 2` (con uno solo, `PID` a secas).
- Cociente **truncado** a 2 decimales (`544767 / 1024 = 531,99`): redondeado daría 532 y
  confundiría el bloque.

## Gotchas

- Rompe el build: ninguno o más de uno de `bytes`/`byte`/`bloques`, rango al revés, bloque que no
  es múltiplo del puntero, rango que pasa el máximo del archivo, o falta `titulo`/`bloque`/
  `puntero`/`punteros`.
- Escribir un archivo entero (ej-31) son los mismos bloques que leerlo: el bloque dice "se leen";
  la justificación lo aclara.
- El SVG crece de ancho con el PIT (~1070). `inodo-bloque.ts` le pone `in-ancho` a la figura para
  que en pantalla chica scrollee a 760 y no a 540 (texto de ~6 px). Sätteri descarta `style`
  inline: por eso es una clase y no un ancho calculado.
- Las cajas miden su ancho por la cantidad de caracteres (mono a 12 px ≈ 7,2 px por carácter).
- Usado en fat-ufs ej-16, 23, 29, 31, 33, 37, 38, 42 y 47. Fuera: ej-15 y ej-44 (comparar
  configuraciones), ej-35 y ej-50 (con FAT), ej-43 (mapeado).

**Depende de:** [[Recorridos y cálculos de Filesystem]], [[Recorridos paso a paso]]
**Conectado con:** [[Resolución gráfica paso a paso]], [[Formato de un Ejercicio]]
