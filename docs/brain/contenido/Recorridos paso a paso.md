---
tipo: componente
aliases: [recorrido, recorridos, paso a paso, stepper, diagrama interactivo, gráfico interactivo, animación, ficha, RECORRIDOS, renderRecorrido, initRecorridos, midudev]
tags: [componente, contenido, svg, interactivo]
actualizado: 2026-09-26
---
# Recorridos paso a paso

**Propósito:** diagramas de teoría que se recorren de a un paso (Anterior / Siguiente, puntos,
flechas del teclado): lo que no participa queda tenue, una ficha se mueve, cambian valores y
aparecen elementos. Estilo "explicado paso a paso" (issue #13).
**Ubicación:**

| Qué | Dónde |
| --- | --- |
| Tipos y render en build | `src/lib/diagramas/recorrido.ts` |
| Registro por id | `src/lib/diagramas/recorridos/index.ts` (`RECORRIDOS`, se arma solo) |
| Un archivo por tema | `src/lib/diagramas/recorridos/<tema>.ts`, que exporta `recorridos: Record<id, Recorrido>` |
| Primitivas SVG | `src/lib/diagramas/svg.ts` (`caja`, `flecha`, `rombo`, `grupo`, `texto`, `lienzo`) |
| Cliente | `src/lib/recorridos.ts` (`initRecorridos`, en `src/scripts/client.ts`) |
| Estilos | `src/styles/diagramas.css`, sección "Recorridos" |
| Test genérico | `src/lib/diagramas/recorrido.test.ts` (recorre todo `RECORRIDOS`) |

**Uso en markdown:**

````md
```recorrido estados-proceso
```
````

## Cómo se arma uno

```ts
export const miRecorrido: Recorrido = {
  ancho: 720, alto: 290, titulo: 'Qué muestra',   // el título es el aria-label
  cuerpo: [
    caja(250, 70, 112, 40, 'Ready', 'dg-listo', 'ready'),        // último arg = data-el
    flecha('M…', 'dispatch', 360, 9, '', 'dispatch'),
    grupo('nota', texto(360, 260, 'deadlock'), { oculto: true }), // aparece con `mostrar`
    texto(600, 30, 's = 1', { val: 's' }),                        // cambia con `valores`
  ],
  fichas: { p1: 'P1' },                            // fichas que se mueven
  lugares: { ready: { x: 302, y: 52 } },           // coordenadas del viewBox
  pasos: [
    { titulo: 'Dispatch.', texto: 'Lo elige el planificador de `corto plazo`.',
      resaltar: ['dispatch', 'running'], fichas: { p1: 'running' },
      valores: { s: 's = 0' }, clases: { running: 'rc-ok' }, mostrar: ['nota'] },
  ],
  // o, en vez de `pasos`, pestañas: variantes: [{ nombre: 'Directa', pasos: […] }, …]
}
```

Y sumarlo al `export const recorridos = { 'mi-id': miRecorrido }` del archivo de su tema: `index.ts`
los junta con `import.meta.glob` (un id repetido falla en build).

- **Qué se hereda:** `fichas`, `valores`, `clases` y lo visible (`mostrar`/`ocultar`) pasan al paso
  siguiente; `resaltar` no. El estado completo de cada paso se calcula en build (`estados()`) y va
  en `data-estado` de su `<li>`: ir para atrás no necesita lógica en el cliente.
- **Clases de estado:** `rc-ok`, `rc-mal`, `rc-aviso` (o `''` para sacarla).
- **Texto de un paso:** 1–2 oraciones; admite `código` y **negrita**. Cada paso dice *por qué*
  pasa, no solo qué pasa.
- **Sin JS** se ve el diagrama completo y la lista numerada de pasos.
- Reusar un dibujo existente: exportar su `Lienzo` (como `lienzoEstadosProceso`) y usarlo en el
  diagrama fijo y en el recorrido.

## Reglas de diseño

- Colores solo por clase CSS con tokens (`dg-activo`, `dg-listo`, `dg-bloqueado`, `dg-neutro`,
  `rc-*`): se ven bien en claro y oscuro. Nada de colores en el SVG, nada de imágenes.
- Tamaño pensado para ~720 de ancho de viewBox; en celular el SVG tiene `min-width: 540px` y
  scrollea dentro del recuadro.
- 4 a 10 pasos. Si hace falta más, son dos recorridos o dos variantes.
- El contenido tiene que ser correcto para la cátedra (ver [[Convenciones de la Cátedra FRBA]]).

## Gotchas

- **Sätteri descarta `style` inline** del HTML de build: posiciones por atributos; la ficha la mueve
  el cliente con `style.transform` (eso sí anda, porque es en el navegador).
- **La punta de la flecha resaltada** usa otro marcador (`dg-punta-on`): el cliente cambia el
  `marker-end`. Un `<path>` sin `marker-end` no lleva punta.
- **Imports relativos** en `src/lib/diagramas/**` (no `@lib/`): los importa `bloques-svg.ts`, que
  también carga vitest sin el alias. El cliente (`src/lib/recorridos.ts`) sí usa `@lib/`.
- **Caché de content collections:** si cambiás un recorrido y el HTML no cambia,
  `rm -rf .astro node_modules/.astro` antes de `pnpm build`.

**Conectado con:** [[Bloques SVG grafo y diagrama]], [[Patrón — Steps y Playback]] (el paso a paso
de los simuladores, que es otro mecanismo), [[Contenido]].
