---
tipo: servicio
aliases: [semáforos, semaforos, wait, signal, semaphore, sincronización, verificador, model checking, intercalaciones, tests, leetcode, verificarSemaforos]
tags: [simulador, sincronizacion, deadlock]
actualizado: 2026-09-23
---
# Verificador de Semáforos

**Propósito:** ejercicios de código estilo LeetCode: el alumno escribe texto libre (declaraciones +
`wait`/`signal`) y se corren tests que prueban **todas las intercalaciones posibles**.
**Ubicación:** `src/lib/semaforos/` — `parser.ts`, `explorar.ts`, `tipos.ts`, `schema.ts`, tests
(`explorar.test.ts`, `contenido.test.ts`). UI: `SemaforosDesafio.astro` + `src/lib/desafios/semaforos.ts`.

## Sintaxis que acepta
```c
semaphore mutex = 1, lugares = M;   // globales, arriba; M sale de `constantes`

// Compilador (2 instancias en los tests)
void Compilador() {                 // una función por proceso: identificador(nombre)
  while(TRUE){
    wait(lugares);
    depositar_resultado(r, lista);  // líneas del enunciado: no se cambian ni reordenan
    signal(mutex);
  }
}
```
- Nombre de la función = `identificador(nombre)` en `parser.ts` ("De Paul" → `De_Paul`), sin
  distinguir mayúsculas.
- Lo que va **antes** del `while(TRUE)` es un prólogo que corre **una vez** por instancia; el cuerpo
  del while se repite; lo que va **después** es inalcanzable (cuenta como código escrito, no se
  ejecuta). Una función sin while **termina** (no cuenta como deadlock). Todo esto es C válido:
  **no** es error de sintaxis, lo juzgan los tests.
- **Nombres de semáforos libres**: se verifica comportamiento, no texto.

## Linter (mismo `parsear`, en vivo en el editor)
`;` faltante · llaves que faltan/sobran · `semaphore`/`wait`/`signal` mal escritos o en mayúscula ·
semáforo sin declarar, duplicado o negativo · instrucción fuera del `while` · función desconocida ·
línea que no está en el enunciado. Los errores de línea 0 (código original alterado, función
faltante) solo aparecen al correr los tests. **Nunca** marca errores de lógica ni de ubicación de
`wait`/`signal` (decisión explícita del usuario: si es C válido, que falle en los tests).

## Motivos de falla
Cada test que falla trae `motivo`: **por qué** está mal, sin dar la solución (qué líneas se
superponen, dónde queda bloqueado cada proceso, qué acción nunca corre, qué semáforo nadie devuelve).
Si el `wait` que traba está en el prólogo, se explica que corre una sola vez.

## Editor
CodeMirror 6 (`src/lib/editor/editor-c.ts`), importado lazy (~165 KB gzip) sobre el `<textarea>`
de respaldo. Resaltado C con tokens `--code-*` de `global.css` (ambos temas); `semaphore`, `wait`,
`signal` y `TRUE` se marcan aparte con un `MatchDecorator` (no son C estándar). Borradores en
localStorage con clave versionada (`so:borrador:v2:`): si cambia la sintaxis, subir la versión.

## Semántica del modelo
- Cada línea del enunciado es una **acción atómica**. Un proceso "está en" una acción cuando su
  contador de programa apunta a ella (ya pasó los `wait` previos): eso define exclusión y capacidad.
- `wait` bloquea si el valor es 0; `signal` suma. Sin cola de bloqueados (irrelevante para seguridad).
- Instancias por proceso: `instancias` (1–4). Instancias del mismo proceso son intercambiables →
  **reducción por simetría** (se ordenan sus pcs en la clave del estado).
- BFS con tope: 250 000 estados, semáforos ≤ 12, variables ≤ 8. Si se corta, la UI avisa
  "exploración acotada" (pasa en productor-consumidor sin límite).
- **Poda por violación:** un estado que ya viola un test de seguridad (`exclusion`, `capacidad`,
  `concurrencia-max`, `rango`) no se expande y queda optimista. Sin esto, el código sin sincronizar
  de LyL (Ej. 23) llegaba al tope en >5 s. Consecuencias: si hubo poda, los tests de
  alcanzabilidad (`*-alcanzable`, `valor-alcanzable`, `simultaneas`, `todas-ejecutan`) se reportan
  OK (no son concluyentes, y el fallo de seguridad ya alcanza). La inanición **sí** se sigue
  buscando: al ser optimistas los podados, la que aparece es real (el test de las trazas del
  1R 1C2025 lo necesita).
- Costo de referencia: LyL (6 instancias, 7 semáforos) ≈ 3 s la solución correcta. Más de eso en
  el navegador ya molesta: al cargar parciales, bajá instancias/constantes antes de agregar tests.

## Tests disponibles (`tests:` del frontmatter)
`exclusion` (recurso) · `capacidad` / `capacidad-alcanzable` (recurso, N) · `concurrencia-max` /
`concurrencia-alcanzable` (acción, N) · `secuencia` (acciones en ciclo) · `rango` (variable con
`efecto` de acciones) · `sin-deadlock` · `todas-ejecutan` · `max-semaforos` · `sin-inanicion`
(**se agrega solo a todos**).

**Inanición:** se guarda el grafo de estados; un proceso en `pc` sufre inanición si desde algún estado
alcanzable no existe **ningún camino** en que una instancia de su grupo avance desde ese `pc`
(backward BFS por etiqueta `grupo:pc`). Los estados cortados por cota se toman optimistas (pueden
avanzar), para no dar falsos positivos. Sin este test, un `wait` antes del while "pasaba" (un solo
hilo trabajando para siempre no es deadlock).
Los "alcanzable" evitan que un mutex pase por solución de un contador.

Todo test acepta `motivo:` propio. **Usalo en los `rango`**: el genérico ("posA llega a valer -1")
expone contadores internos que el alumno no conoce.

## Motor v2 (arrays, locales, azar, recursos implícitos)
| Spec del ejercicio                 | Para qué                                               | Ejemplo            |
| ---------------------------------- | ------------------------------------------------------ | ------------------ |
| `semaphore r[N] = v;` / `= {a,b}`  | arrays; `N` puede ser constante; `wait(r[i]);`         | Sinc. 9            |
| `locales: [id_recurso]`            | variables por instancia (arrancan en 0); `id` siempre existe (0..n-1) | Sinc. 9, 13 |
| `asigna: {variables, valores, distintos}` | asignación **no determinista**: se exploran todas | `pedir_recurso()` |
| `recursos: ['recurso[id_recurso]']` + test `recurso[*]` | capacidad/exclusión **por índice**   | Sinc. 9            |
| `recursosImplicitos` + `adquiere`/`libera` | acciones que bloquean como un semáforo oculto  | `syscall_pedir()` (Deadlock 7) |
| `funciones: {actual(): {variable}}` + `modulos` | funciones del enunciado usables como índice | Sinc. 13      |
| `Proceso::accion` en `acciones`    | misma línea con spec distinta según el proceso         | `posicionarse()`   |
| test `orden-instancias`            | las instancias hacen una acción en orden de `id`      | pateadores         |

- Índice fuera de rango = **error de ejecución** (`ejecucion: true`, UI: "Falla al ejecutar"), no
  de sintaxis.
- Si el código o los tests usan `id`, se **apaga la simetría** (las instancias ya no son iguales).
- `if (...) { … } else { … }` se une en **una** acción atómica (`unirCondicionales`): importa cuándo
  se lee la condición, no qué rama corre. Si el alumno mete `wait`/`signal` adentro del if, no matchea.

## Contenido y garantías
- `contenido.test.ts` recorre **todos** los `.md`: la `solucion` de referencia tiene que pasar todo,
  la plantilla sin sincronizar tiene que fallar algo y ninguna solución puede usar la sintaxis vieja.
- `inicial:` precarga declaraciones (ejercicios de "corregí este código", ej. Deadlock Ej. 6).
- ⚠️ **Frontmatter: separarlo por líneas `---` completas** (`/^---\n([\s\S]*?)\n---\n/`), nunca con
  `split('---')`: las tablas markdown de las justificaciones tienen `---` adentro. Ese bug dejó el
  Ej. 10b sin validar y con la sintaxis vieja. Al generar YAML con PyYAML, sin anclas
  (`ignore_aliases`) y con `newline='\n'`.

## Límites conocidos / pendiente
- Sin creación dinámica de procesos: `fork()` (Sinc. Ej. 12) divide el mismo código en padre e hijo
  por `if (pid == 0)`; modelarlo exige crear instancias en ejecución.
- Escala reducida en los tests (2 aviones/1 pista, 3 jugadores): la `nota` del desafío lo aclara.

**Conectado con:** [[Simuladores]], [[Patrón — Desafío antes de la Resolución]], [[Convenciones de la Cátedra FRBA]]
