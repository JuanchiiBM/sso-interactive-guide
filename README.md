# SO Interactivo · UTN FRBA

Guía interactiva de **Sistemas Operativos** (UTN FRBA): teoría resumida por tema y los ejercicios de
las guías de la cátedra, con resoluciones que se reproducen paso a paso (Gantt instante por instante,
con la decisión del planificador explicada en cada tick).

> Proyecto de estudio de alumnos, **no oficial**. Los enunciados pertenecen a las guías de la cátedra
> (v.2C2026) y se citan con su fuente. Si encontrás un error en una resolución, abrí un issue.

## Qué hay

- **Teoría · 1er parcial:** arquitectura, SO, procesos, planificación, hilos, sincronización, deadlock.
- **Ejercicios:** 38 enunciados de las guías de Planificación, Sincronización y Deadlock.
- **Resolución paso a paso:** simulador de planificación (FIFO, SJF, SRT, RR, prioridades, HRRN)
  con los criterios de desempate de la cátedra.
- Modo claro y oscuro.

## Desarrollo

Requisitos: Node 22+ y pnpm.

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm test     # tests de los simuladores
pnpm build    # sitio estático en dist/
```

## Estructura

```
src/
  content/            teoría (temas/) y enunciados (ejercicios/) en markdown
  content.config.ts   schema de las colecciones
  lib/simuladores/    lógica pura de cada resolvedor (+ tests)
  lib/visualizers/    render DOM de cada estado (Gantt, …)
  lib/playback.ts     motor paso a paso
  components/ pages/ layouts/
docs/brain/           documentación de arquitectura y decisiones (vault Obsidian)
```

Para contribuir, empezá por [`docs/brain/Home.md`](docs/brain/Home.md).

## Créditos

- Arquitectura inspirada en [alg0.dev](https://github.com/midudev/alg0.dev) (midudev).
- Tipografías Geist (Vercel), licencia SIL OFL.

## Licencia

Código bajo MIT. El contenido de los enunciados es de sus autores (cátedra de SO, UTN FRBA).
