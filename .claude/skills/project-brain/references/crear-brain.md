# Crear un brain nuevo

Procedimiento para inicializar y sembrar un vault desde cero. Leelo cuando te piden crear un brain, o
cuando ofreciste crearlo y te dijeron que sí.

El objetivo no es documentar el repo: es dejar un vault **chico, correcto y encontrable** que a partir de
mañana se llene por uso. Un brain de 60 notas generadas de un tirón envejece mal, nadie lo lee y termina
mintiendo. Uno de 12 notas curadas se usa y crece solo.

## 1. Decidir ubicación y alcance

- **Un brain por repo** es el default. Va en `docs/brain/` dentro del repo, para que viaje con el código
  y se versione en la misma historia.
- **Brain a nivel workspace** (arriba de varios repos) solo si hay conocimiento genuinamente compartido:
  glosario de dominio, contrato entre back y front, decisiones que aplican a todo el producto. Si el
  workspace ya tiene un `docs/` compartido, ahí va.
- Si el repo ya usa otra convención (`brain/`, `.brain/`, `docs/vault/`), respetala en vez de imponer la
  tuya. Chequealo antes con un Glob.
- Si el humano no dijo dónde, proponé la ubicación en una línea junto al plan del paso 3 y seguí.

## 2. Inventario barato del repo

Antes de escribir nada, armate un mapa con lecturas caras-cero. No abras `src/` entero:

- `README.md` y `CLAUDE.md` → propósito, stack, comandos, reglas ya escritas.
- `package.json` / `pom.xml` / `pyproject.toml` → dependencias y scripts (delatan el stack real y las
  integraciones externas).
- `Glob` de la estructura a 2 niveles (`src/*/`, `src/app/*/`) → los módulos del proyecto.
- Carpetas `shared/`, `common/`, `core/`, `components/`, `utils/` → acá vive lo reutilizable, que es
  justo el conocimiento de más valor.
- Migraciones, `docker-compose`, `.env.example`, CI → infra y gotchas de entorno.
- Docs que ya existen (`docs/*.md`, glosarios, ADRs) → **no los dupliques**: el brain los linkea.

## 3. Proponer el plan antes de escribir

Mostrale al humano la lista de notas que vas a crear (títulos + una línea cada una) y esperá el OK. Son
archivos que van a su repo y él es el que va a navegarlos; que el índice tenga su forma vale más que tu
velocidad. Si te dijo "creá el brain y listo", tomá eso como el OK y seguí.

## 4. Sembrar, en este orden de valor

1. **`Home.md`** — el índice raíz (plantilla abajo).
2. **3–6 MOCs de módulo** — los módulos reales del repo, no categorías inventadas.
3. **8–15 notas atómicas**, empezando por lo que más se busca:
   - componentes y servicios compartidos (lo que evita que reimplementes),
   - convenciones del repo (naming, estructura de carpetas, cómo se testea),
   - integraciones externas (APIs, colas, auth) con sus gotchas,
   - infra/DB (motor, migraciones, trampas conocidas),
   - glosario de dominio si el proyecto tiene vocabulario propio.
4. **Parar ahí.** Lo que no entró se agrega cuando una tarea lo toque.

Cada nota nace con frontmatter completo (`tipo`, `aliases`, `tags`, `actualizado` con la fecha real de
hoy), con `Ubicación` apuntando a una ruta que **verificaste** que existe, y linkeada desde su MOC.

## 5. Cerrar

- Verificá que todo wikilink `[[X]]` apunte a una nota que existe o que valga la pena existir.
- Verificá que `Home.md` liste todos los MOCs y que cada MOC liste sus notas.
- Contale al humano qué creaste y qué dejaste afuera a propósito.
- El commit es decisión suya: no committees si no te lo pidió.

## Plantilla de `Home.md`

~~~markdown
---
tipo: home
aliases: [home, índice, indice, brain, cerebro, vault]
tags: [moc, home]
alcance: <glob de lo que cubre este brain, ej. proteus-frontend/**>
actualizado: AAAA-MM-DD
---
# Brain — <Nombre del proyecto>

<Una línea: qué es este repo/producto.>

**Stack:** <lenguaje, framework, DB.>
**Alcance de este brain:** <qué cubre y qué no; si hay otro brain hermano, linkealo o nombralo.>

## Módulos
- [[<MOC 1>]] — qué agrupa.
- [[<MOC 2>]] — qué agrupa.

## Transversal
- [[Convenciones del Repo]] — naming, estructura, tests.
- [[Glosario de Dominio]] — vocabulario del negocio.

## Fuera del brain
- `CLAUDE.md` — reglas operativas del repo.
- `docs/planes/` — planes de trabajo por tarea.
~~~

El campo `alcance` no es decorativo: es lo que hace que, con varios brains en el workspace, el próximo
agente sepa en una sola lectura si este brain es el indicado.

## Auditar o reorganizar un brain existente

Si lo que te piden es ordenar un vault que ya existe, mismo espíritu, distinto foco:

- **Notas huérfanas**: sin ningún link entrante → colgalas de un MOC o borralas.
- **Wikilinks rotos**: `[[X]]` sin nota destino → creá la nota si hace falta, o corregí el link.
- **Notas gordas** (> ~200 líneas) → partilas en atómicas bajo un MOC.
- **Notas que mienten**: `Ubicación` que ya no existe, snippet con API vieja → verificá contra el código
  y corregí o borrá. Esto es lo más importante de la auditoría.
- **Notas sin aliases** → agregales aliases; son invisibles a la búsqueda.
- **Duplicados**: dos notas del mismo concepto → mergealas y dejá un solo título canónico.

Reportá los hallazgos antes de borrar en masa.
