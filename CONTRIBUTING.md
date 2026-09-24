# Cómo contribuir

¡Gracias por querer sumar! Este es un proyecto de estudio de alumnos, **no oficial**, de Sistemas
Operativos (UTN FRBA). Todo aporte que ayude a estudiar mejor es bienvenido.

## Cómo aportar

Nadie de afuera tiene permiso de escritura: se aporta **forkeando y abriendo un PR contra `main`**.
`main` está protegida (sin push directo ni force push) y **solo el mantenedor mergea**.

1. Forkeá el repo y cloná tu fork.
2. Creá una rama con un nombre descriptivo:

   ```bash
   git checkout -b feat/sincronizacion-ej-33
   git checkout -b fix/errata-planificacion-ej-07
   ```

3. Hacé tus cambios, corré los checks (ver abajo) y abrí el PR contra `main` de este repo,
   explicando qué cambia y por qué (si corregís una resolución, citá de dónde sale la corrección).

**Qué se busca:**

- Ejercicios nuevos de las guías o de parciales, con su resolución interactiva.
- Correcciones de teoría (conceptos mal explicados, imprecisiones).
- Erratas en enunciados o resoluciones.
- Bugs de los simuladores (Gantt, verificador de semáforos, grafos).

Para **cambios grandes** (un simulador nuevo, reorganizar contenido, tocar la arquitectura) abrí un
issue antes y charlémoslo: te ahorra trabajo si la idea no encaja.

## Setup local

Requisitos: **Node 22** (el que usa el CI) y **pnpm 11** (`packageManager: pnpm@11.20.0`; con
`corepack enable` se usa esa versión sola).

```bash
pnpm install
pnpm dev        # http://localhost:4321
```

Antes de abrir el PR, corré lo mismo que corre el CI (`.github/workflows/ci.yml`, en cada PR y en
cada push a `main`):

```bash
pnpm test       # vitest: simuladores y validación del contenido
pnpm check      # astro check: tipos y schema de las colecciones
pnpm build      # build estático a dist/
```

**Formato:** el hook `pre-commit` de husky corre `lint-staged`, que pasa **Prettier** sobre los
archivos staged. Si commiteás sin el hook, corré `pnpm format` a mano. También está `pnpm lint`
(ESLint), que no corre en el CI pero conviene pasar.

Si tocás código, los comentarios van cortos (1–2 renglones); el porqué largo va al brain
(`docs/brain/`). Hay un chequeo opcional:
`python .claude/skills/project-brain/scripts/check_comentarios.py --staged`.

## Commits

No hay commitlint. El historial usa prefijos al estilo Conventional Commits (`feat:`, `chore:`,
`fix:`…) con la descripción en español; seguir esa línea ayuda a leer el historial.

## Reglas de contenido

- **Español** en la UI, el contenido y el código de dominio.
- **Nada de PDFs ni material con copyright** en el repo (`*.pdf` está en `.gitignore`). Los
  enunciados se transcriben **citando la fuente** en el campo `fuente:` (guía o examen, versión y
  número). La teoría se redacta con palabras propias. Ver la nota
  `docs/brain/contenido/Fuentes y Derechos del Material.md`.
- **Visuales del sitio = SVG propio**, con los bloques ` ```grafo ` y ` ```diagrama ` en el markdown.
  **Mermaid solo en `docs/brain/`**, nunca en el sitio.
- **Colores solo por tokens** (`bg-surface`, `text-fg`, `border-line`, `var(--p1)`…) definidos en
  `src/styles/global.css`. Nada de hex fijo en componentes: rompe el modo claro/oscuro.
- Para aclaraciones propias (que no son de la guía), usá `> **Nota:** …` en el cuerpo.

Las reglas completas están en [`AGENTS.md`](AGENTS.md) y la documentación de arquitectura en
[`docs/brain/Home.md`](docs/brain/Home.md).

## Cómo agregar un ejercicio

**Ubicación:** `src/content/ejercicios/<tema>/ej-NN.md` (NN con cero a la izquierda; una carpeta por
tema, p. ej. `planificacion`, `hilos`, `sincronizacion`, `deadlock`). Las preguntas de teoría de
parciales van en `simulacro.md` / `simulacro-N.md` del tema, con `numero: S` / `SN`. El schema real está en
`src/content.config.ts` (si una nota del brain lo contradice, gana el schema).

```yaml
---
titulo: FIFO básico
tema: parcial-1/planificacion # id de la colección temas
fuente: { guia: Guía de Ejercicios – Planificación (v.2C2026), numero: 1 }
tipo: practico # teorico | practico | codigo | verdadero-falso | multiple-choice
dificultad: facil # facil | media | dificil | parcial (tomado de un examen)
tags: [fifo, gantt]
---
```

El **cuerpo** es el enunciado tal cual la fuente (tablas, código, incisos), **sin la resolución**: la
resolución sale del frontmatter, con uno de estos tres tipos (una entrada por inciso):

**1. Simulación de Gantt** (`simulaciones:`), ej. `planificacion/ej-01.md`:

```yaml
simulaciones:
  - kind: planificacion
    algoritmo: fifo # sjf | srt | rr | prioridades | hrrn | vrr | multinivel | feedback…
    procesos:
      - { id: A, llegada: 0, rafagas: [5, 1, 3] } # CPU, E/S, CPU…
      - { id: B, llegada: 1, rafagas: [4] }
```

**2. Desafío de semáforos** (`semaforos:`), ej. `sincronizacion/ej-01.md`: el alumno escribe
`wait`/`signal` y el verificador prueba todas las intercalaciones contra los `tests`.

```yaml
semaforos:
  - procesos:
      - nombre: Hilo
        instancias: 3
        codigo: | # el código del enunciado, sin sincronizar
          while(TRUE){
            contador++;
          }
    acciones:
      contador++: { recursos: [contador] }
    tests:
      - { tipo: exclusion, recurso: contador }
      - { tipo: sin-deadlock }
    solucion: | # solución de referencia: tiene que pasar todos los tests
      semaphore mutex = 1;

      void Hilo() {
        while(TRUE){
          wait(mutex);
          contador++;
          signal(mutex);
        }
      }
    justificacion: | # markdown: tipo de semáforo, valores iniciales, por qué ese orden
      ...
```

La sintaxis aceptada, los tipos de test y las opciones avanzadas (arrays, locales, bolsas, `nota`)
están en `docs/brain/simuladores/Verificador de Semáforos.md`.

**3. Multiple choice** (`preguntas:`), ej. `deadlock/ej-01.md`:

```yaml
preguntas:
  - enunciado: 'a) ¿Qué situación representa el grafo?'
    opciones:
      - texto: Deadlock entre P1 y P2
        explicacion: Una línea; se muestra como pista si la eligen mal.
      - texto: Espera sin deadlock
        explicacion: ...
    correcta: 1 # índice base 0
    justificacion: |
      Markdown completo (listas, `código`, ```grafo). Se ve recién al acertar.
```

**Lo que chequean los tests** (`src/lib/semaforos/contenido.test.ts` recorre todos los `.md`):

- La `solucion` de cada desafío de semáforos **pasa todos sus tests**.
- La plantilla **sin sincronizar falla** al menos uno (si pasa, los tests no exigen nada).
- En los multiple choice, **el largo no delata la respuesta**: ordenando las opciones por largo, la
  correcta tiene que caer repartida entre los 4 lugares (cada uno entre 15% y 35% del total). Además,
  **su posición varía** entre preguntas. Escribí distractores creíbles y de largo parejo.
- Además, `astro check`/`build` validan el frontmatter contra el schema.

**Si una resolución oficial de la cátedra está mal**, no la cambies en silencio: corregila y
dejá una nota visible que explique la diferencia, como en `hilos/ej-08.md`:

```md
> **Nota (errata de la resolución oficial):** en t = 9 la resolución ejecuta ULT2.1 […]. Con SJF
> con desalojo corresponde ULT2.2, y así se corrige acá.
```

## Revisión

El mantenedor revisa que el PR pase el CI, que la resolución sea correcta (idealmente contrastada con
la resolución de la cátedra), que se respeten las reglas de contenido y que el cambio sea acotado a
lo que describe. Los PRs desde forks pueden necesitar que el mantenedor apruebe la ejecución de los
workflows antes de que corra el CI: si ves los checks en espera, es eso.

Sé respetuoso en issues y PRs: estamos todos estudiando.
