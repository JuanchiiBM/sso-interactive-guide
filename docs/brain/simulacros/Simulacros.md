---
tipo: modulo
aliases: [simulacros, simulacro, parciales simulados, examen, modo examen, nota, cronómetro, parcial real, ItemExamen, crearMCExamen, crearSemaforosExamen, crearSimuladorExamen, puntaje, banda]
tags: [moc, simulacros, examen]
actualizado: 2026-09-25
---

# Simulacros

Cada parcial real (13, del 1er parcial) como un examen con reloj: teoría y práctica juntas, sin
feedback hasta **Finalizar**, con nota y el mejor resultado guardado en el navegador.

**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Armar los parciales desde el contenido | `src/lib/parciales/catalogo.ts` (`armarParciales`), `getParciales()` en `src/lib/catalogo.ts` |
| Página de un simulacro | `src/pages/simulacros/[id].astro` |
| Controlador (Empezar, reloj, Finalizar, marcas) | `src/lib/parciales/examen.ts` |
| Nota, pesos y bandas | `src/lib/parciales/nota.ts` |
| Puntaje de Gantt y de semáforos | `puntaje-gantt.ts`, `puntaje-semaforos.ts` |
| Mejor resultado (localStorage) | `src/lib/parciales/resultados.ts` |
| Listado con cards y filtros | `src/pages/simulacros/index.astro`, `SimulacroCard.astro`, `filtros.ts` |

## De dónde sale cada parcial

No hay un archivo por parcial: se arma solo desde lo que ya está cargado.

- **Teoría:** las preguntas de los ejercicios `<tema>/simulacro(-N)` (los MC de "Teoría de
  parciales") citan el examen en el prefijo del enunciado: `(1P 2C2025 TM, 1P 1C2026 TM) ¿…?`.
  Una pregunta que cita dos exámenes entra en los dos. En el simulacro se muestra sin el prefijo.
- **Práctica:** los ejercicios con `dificultad: parcial`, por su `fuente.guia`
  (`1° Parcial 1C2025 · TM y 1C2026 · TM`). Cada ejercicio entra completo, con todas sus partes.
- Orden: teoría y práctica por tema (el orden de `getTemas`), los parciales cronológicos.
- `firmaParcial` es un hash de la composición: si cambia el contenido de un parcial, el resultado
  guardado deja de valer (la card vuelve a "Sin rendir").

⚠️ **Nombres:** los ejercicios `simulacro-N` son la teoría de parciales en la sección Ejercicios; la
sección Simulacros son los exámenes armados. Es un choque de nombres conocido y sin resolver.

## Modo examen de los componentes

`MultipleChoice`, `SemaforosDesafio` y `SimuladorStage` reciben `modo="examen"` (atributo
`data-mc-modo` / `data-sem-modo` / `data-sim-modo`). En examen no hay Verificar, Me rindo ni
"Correr tests", ni borradores ni marcas de resuelto. Los `init*` de práctica solo toman
`modo="practica"`; los de examen los crea el controlador con:

```ts
interface ItemExamen {
  puntaje: () => Promise<number> // 0 a 1
  detalle: () => string // "Correcta", "72 % de celdas", "Correcto, sección crítica de más"…
  revelar: () => void // bloquea la respuesta y muestra la resolución
}
// crearMCExamen(box) · crearSemaforosExamen(box) · crearSimuladorExamen(host)
```

Un tipo interactivo nuevo tiene que implementar su `crearXExamen`, sumar su `data-item-tipo` en la
página y en `crearItem` de `examen.ts`, y entrar en `referencia.test.ts`.

Cada ítem de la página va envuelto en `data-item` con `data-item-tipo` (mc | sem | gantt),
`data-item-seccion` (teoria | practica) y `data-item-ejercicio` (índice del ejercicio, para repartir
su peso). Al finalizar, `marcar()` le pone `data-estado` (ok | parcial | mal) y una línea con el
resultado y los puntos arriba del ítem. No hay tabla de resumen: se decidió marcar en el lugar.

## Puntaje y nota

- **Nota:** `10 × (0,4 · teoría + 0,6 · práctica)`, redondeada a 0,5. Cada pregunta de teoría pesa
  igual; cada ejercicio de práctica pesa igual y sus partes se reparten su peso. `pesosDeItems` da
  cuánto vale cada ítem en puntos de nota (suman 10).
- **Multiple choice:** 1 o 0.
- **Gantt:** % de celdas bien sobre las no vacías (de la esperada o de la respuesta), contra la
  mejor variante válida (2 CPUs → varias). Menos del 80 % vale 0; de 80 % a 100 %, lineal de 0 a 1.
- **Semáforos:** **todo o nada.** 1 si pasa todos los tests; 0,75 si además la sección crítica es
  más grande que la de la solución de referencia ([[Verificador de Semáforos]]: acciones que no
  tocan nada compartido entre `wait` y `signal` del mismo mutex); 0 si falla algo o no compila.
  - Se probó puntaje parcial (tests pasados / total, y después "lo ganado sobre la plantilla") y se
    descartó: el verificador poda al primer fallo y los demás tests salen "ok" sin comprobarse.
- **Bandas:** 8–10 verde, 6–7,5 amarillo, 4–5,5 naranja, 0–3,5 rojo (tokens `--banda-*`).
- `referencia.test.ts` rinde cada parcial con las resoluciones de referencia y exige 10.

## Estado y persistencia

- Nada se guarda mientras se rinde. Salir o cancelar pierde todo (`beforeunload` avisa).
- Solo se guarda al finalizar, y solo si mejora: más nota, o la misma en menos tiempo.
  Clave `so:simulacro:<id>` → `{ nota, tiempoMs, fecha, firma }`.

## Gotchas

- **Los ítems se montan al tocar Empezar**, con el contenido ya visible: CodeMirror y la grilla del
  Gantt miden el DOM y montados ocultos quedan mal.
- **`simulador.css` está en la capa `components`:** los bordes por estado o banda llevan
  `!important` para ganarle a la utilidad `border-line` (capa `utilities`).
- **La card se pinta con un script inline** en `simulacros/index.astro` que duplica la lógica de
  `banda`, `formatearNota` y `formatearTiempo`, para no parpadear. Si cambia una, cambiar las dos.
- **2do parcial:** `numero` ya existe en `Parcial`, y el listado agrupa y filtra por él. Pero el
  parseo asume 1er parcial: `RE_CITA` solo acepta `1[PR]`, `examenesDeFuente` arma `1P`/`1R` y
  `tituloDe` escribe "1°". Hay que generalizar esas tres cosas antes de cargar exámenes del 2do.

**Conectado con:** [[Patrón — Desafío antes de la Resolución]] (el modo práctica de los mismos
componentes), [[Verificador de Semáforos]], [[Simulador de Planificación]], [[Home]].
