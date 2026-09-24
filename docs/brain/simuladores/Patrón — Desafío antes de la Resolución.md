---
tipo: patron
aliases: [desafío, desafio, challenge, verificar, respuesta, leetcode, codewars, bloqueo, gating, me rindo, ver resolución, progreso, multiple choice]
tags: [patron, simuladores, ux]
actualizado: 2026-09-23
---
# Patrón — Desafío antes de la Resolución

**Cuándo aplicarlo:** todo ejercicio con resolución. Requisito del proyecto: la respuesta **no se ve
hasta que el alumno da con el resultado** (estilo LeetCode / Codewars).

## Botón de resolución (compartido)
`src/lib/desafios/boton-resolucion.ts` → `controlarResolucion({ boton, clave, mostrar, ocultar })`.

| Estado                        | Botón                              |
| ----------------------------- | ---------------------------------- |
| Sin resolver                  | **Me rindo** (rojo), pide 2º clic   |
| Resuelto antes (localStorage) | **Ver resolución** (verde), directo |
| Resolución visible            | **Ocultar resolución**: oculta y limpia la respuesta para reintentar |

Un ejercicio resuelto **no** arranca con la resolución abierta: se puede volver a practicar.
Progreso por navegador en `src/lib/progreso.ts` (`so:resuelto:<path>#<id>`).

## Gantt (planificación)
- Click = CPU (una por instante; marcar otra la saca), click derecho = E/S. En celular, selector de
  "pincel" CPU/E/S. Con 2 procesadores los pinceles son CPU 1 / CPU 2 / E/S (una marca por CPU e
  instante; la celda muestra el número). Con varios dispositivos se marca solo "E/S".
- Verifica **CPU y uso efectivo del dispositivo** por proceso y tick (`verificar.ts`,
  `grillaEsperada`). Esperar el dispositivo o estar en listos = celda vacía.
- Feedback: **solo correcto / incorrecto**, sin decir dónde ni cuántas celdas fallan (pedido
  explícito: el alumno prefiere buscar el error solo). `verificarGantt` igual calcula `primerError`
  y `correctos` por si se quiere un modo pista más adelante.

## Multiple choice (teóricos / prácticos no-Gantt)
- `preguntas:` en el frontmatter (ver [[Formato de un Ejercicio]]), componente `MultipleChoice.astro`.
- Error → muestra la `explicacion` de la opción elegida como pista (no revela la correcta).
- Acierto/ver → marca correcta/incorrectas, muestra todas las explicaciones y la `justificacion`
  (markdown renderizado en build con `marked`, con los mismos bloques ```grafo / ```diagrama).
- ⚠️ Cuidar que la correcta no sea sistemáticamente la opción más larga (regala la respuesta).

**Ayuda:** ícono "info" junto a "Resolución" con popover nativo (`popover` + CSS anchor positioning).

**Abierto:** la grilla revela la duración total; faltan desafíos para ejercicios de código (semáforos).
**Conectado con:** [[Simuladores]], [[Patrón — Steps y Playback]], [[Cómo agregar un simulador]]

## Ejercicio resuelto (sidebar, cards y filtro)
Un ejercicio cuenta como **resuelto** cuando están resueltas **todas** sus partes interactivas.
Las claves se arman en build con `clavesEjercicio(ejercicioHref(id), data)` (`src/lib/progreso.ts`)
y van en `data-claves` de las cards y de los links del sidebar; `initProgreso` les pone
`data-resuelto` (borde verde, punto verde) y el filtro "Solo no resueltos" lo lee.

- ⚠️ Las claves tienen que coincidir con las de cada desafío: `ruta#N` (Gantt, N = orden de las
  simulaciones), `ruta#mc-N`, `ruta#sem-N`, con `rutaActual()` (barra final). Si un desafío cambia
  su clave, cambiala también en `clavesEjercicio`.
- `marcarResuelto` dispara `so:progreso` y se repinta en vivo (el sidebar se pone verde al acertar la
  última parte).

