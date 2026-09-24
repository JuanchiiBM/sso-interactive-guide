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

## Contenido y garantías
- `contenido.test.ts` recorre **todos** los `.md`: la `solucion` de referencia tiene que pasar todo y
  la plantilla sin sincronizar tiene que fallar algo. Si agregás un ejercicio y falla, el test está mal
  planteado o la solución está mal.
- `inicial:` precarga declaraciones (ejercicios de "corregí este código", ej. Deadlock Ej. 6).

## Límites conocidos / pendiente
- Sin arrays de semáforos ni valores no deterministas por iteración (`id = pedir_recurso()`):
  bloquea Sinc. Ej. 9 y Deadlock Ej. 7.
- Sin creación dinámica de procesos (`fork`, Sinc. Ej. 12) ni handshakes con variables de control
  (`actual()/siguiente()`, Ej. 13; controladores del Ej. 11).

**Conectado con:** [[Simuladores]], [[Patrón — Desafío antes de la Resolución]], [[Convenciones de la Cátedra FRBA]]
