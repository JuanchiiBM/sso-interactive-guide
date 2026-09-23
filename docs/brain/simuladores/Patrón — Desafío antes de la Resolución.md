---
tipo: patron
aliases: [desafío, desafio, challenge, verificar, respuesta, leetcode, codewars, bloqueo, gating, me rindo, progreso]
tags: [patron, simuladores, ux]
actualizado: 2026-09-23
---
# Patrón — Desafío antes de la Resolución

**Cuándo aplicarlo:** todo ejercicio con resolución. Requisito del proyecto: la respuesta **no se ve
hasta que el alumno da con el resultado** (estilo LeetCode / Codewars).

**Cómo:**
- `SimuladorStage.astro` renderiza el bloque `[data-desafio]` y la resolución dentro de
  `[data-sim-resolucion] hidden`.
- Cada `kind` registra en `SIMULADORES` (`src/lib/simulador-page.ts`) una función
  `desafio(root, pasos) → Desafio` (`src/lib/desafios/tipos.ts`: `verificar()` + `limpiar()`).
- La **comparación es pura y testeada** en el simulador (`planificacion/verificar.ts`); el widget DOM
  vive en `src/lib/desafios/<kind>.ts`.
- Acertar → `marcarResuelto()` (`src/lib/progreso.ts`, localStorage) y se desbloquea. Al volver,
  sigue desbloqueado. "Me rindo" pide un segundo clic (sin `confirm()`).
- Sin `desafio` registrado, la resolución se muestra directa.

**Gantt (v0):** el alumno marca qué proceso tiene la CPU en cada `t`; se verifica solo la línea de
CPU. Feedback: aciertos/total y primer `t` erróneo (resaltado).

**Abierto para discutir:**
- Hoy la grilla revela la **duración total** (cantidad de columnas) → ¿dejar que el alumno la extienda?
- ¿Verificar también métricas (retorno/espera promedio) o estados de listos/E/S?
- Ejercicios de código (semáforos) y teóricos: no se pueden verificar por comparación exacta; opciones
  a evaluar: multiple choice, validación por simulación de trazas, o autoevaluación con checklist.

**Conectado con:** [[Simuladores]], [[Patrón — Steps y Playback]], [[Cómo agregar un simulador]]
