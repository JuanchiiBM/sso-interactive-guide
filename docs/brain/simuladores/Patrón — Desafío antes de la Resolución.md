---
tipo: patron
aliases: [desafío, desafio, challenge, verificar, respuesta, leetcode, codewars, bloqueo, gating, me rindo, ver resolución, progreso, multiple choice, calculos, cálculo, CalculoDesafio, resultado exacto, fault]
tags: [patron, simuladores, ux]
actualizado: 2026-10-14
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
- La grilla tiene **`COLUMNAS_EXTRA` (5) columnas de más** sobre la variante válida más larga
  (`grillasDesafio` en `verificar.ts`), para que su largo no delate cuándo termina el Gantt (issue #7).
  Las esperadas se rellenan con vacías: pintar de más da incorrecto, y en simulacros las celdas
  vacías en ambas no cuentan para `porcentajeGantt`. La resolución paso a paso no cambia de ancho.

## Multiple choice (teóricos / prácticos no-Gantt)
- `preguntas:` en el frontmatter (ver [[Formato de un Ejercicio]]), componente `MultipleChoice.astro`.
- Error → muestra la `explicacion` de la opción elegida como pista (no revela la correcta).
- Acierto/ver → marca correcta/incorrectas, muestra todas las explicaciones y la `justificacion`
  (markdown renderizado en build con `marked`, con los mismos bloques ```grafo / ```diagrama).
- ⚠️ Cuidar que la correcta no sea sistemáticamente la opción más larga (regala la respuesta).

## Cálculo (resultado exacto)
Para números, direcciones o faults: **no usar multiple choice**, que regala la respuesta por
descarte. `calculos:` en el frontmatter (ver [[Formato de un Ejercicio]]), componente
`CalculoDesafio.astro`, cliente `src/lib/desafios/calculo.ts`, verificación pura en
`src/lib/calculos/verificar.ts`.

- **Verificar** compara todos los campos juntos y dice solo correcto o incorrecto (igual que el Gantt).
  Al acertar, las filas se ponen en verde; "Me rindo" muestra el valor correcto al lado de cada campo.
- **Normaliza** la entrada: decimal con coma o punto; hexa (`base: 16`) acepta `0FAFh`, `0x0FAF`,
  `faf` y ceros a la izquierda. `unidad` es un sufijo fijo, así el número se compara exacto.
- **Fault:** `respuesta: fault` + `fault: true` en el desafío. El botón aparece en **todos** los campos:
  si estuviera solo donde va el fault, regalaría la respuesta. Activado, bloquea el campo; marcarlo
  donde va un número es error aunque el número esté bien.
- ⚠️ Respuestas hexa: YAML convierte `30000` sin comillas en número **decimal**; `esperado()` lo
  relee como texto en base 16. Una respuesta que no se puede leer **rompe el build** (a propósito).
- Las respuestas viajan en `data-calc-campos`, igual que `data-mc-correcta` en el MC.
- Clave de progreso `ruta#calc-N`. Lo categórico (fault por límite vs. por permiso) sigue en MC.
- **Pendiente:** modo examen (simulacros); hoy el componente es solo de práctica.

**Ayuda:** ícono "info" junto a "Resolución" con popover nativo (`popover` + CSS anchor positioning).

**Abierto:** faltan desafíos para ejercicios de código (semáforos).
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

**Modo examen:** los mismos componentes con `modo="examen"`, sin feedback hasta finalizar: ver [[Simulacros]].
