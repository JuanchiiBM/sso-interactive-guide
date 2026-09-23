---
name: project-brain
description: >-
  Segundo cerebro del proyecto: un vault de notas markdown estilo Obsidian (por defecto `docs/brain/`)
  con el conocimiento durable del repo — componentes reutilizables, servicios, patrones, decisiones de
  arquitectura, integraciones y gotchas. Usala AL EMPEZAR cualquier tarea de desarrollo en un repo
  (ubicá el brain que cubre los archivos que vas a tocar y leé 1–3 notas dirigidas antes de escanear
  código) y DE NUEVO AL TERMINAR si la tarea dejó algo reutilizable o una decisión que otro yo-futuro
  querría encontrar. Usala también cuando te pidan crear, inicializar, sembrar, reorganizar o auditar un
  brain/vault/cerebro de proyecto. Cuando hay varios repos o varios vaults, esta skill define cuál es el
  brain indicado y evita leer o escribir en el equivocado. Define además dónde va cada explicación: los
  comentarios en el código son cortos y al hueso (una o dos líneas), y el texto largo — el porqué, el
  cómo se usa, los gotchas — vive en el brain; consultala antes de escribir un comentario de más de dos
  renglones o cuando dudes si algo va en el código o en una nota. Palabras clave: brain, cerebro, segundo
  cerebro, vault, obsidian, MOC, wikilinks, notas del proyecto, contexto del proyecto, componente
  reutilizable, comentarios en el código, documentar código, "¿ya existe algo para X?", "¿dónde está X?",
  "documentá esto para la próxima".
---

# Project Brain

Un **brain** es el segundo cerebro de un repo: un vault de markdown estilo Obsidian con conocimiento
durable, navegable por el humano y versionado junto al código. Tratalo como TU memoria de ese proyecto.

Lo que justifica su existencia es que guarda lo que **no podés grepear**: por qué se decidió algo, el
gotcha que te va a morder, y sobre todo *"esto ya existe, no lo rehagas"*. Una nota que solo reescribe
lo que el código ya dice es ruido y te cuesta tokens dos veces (al escribirla y al leerla).

> No lo confundas con: `docs/planes/` (planes de trabajo concretos), `CLAUDE.md` (reglas operativas que
> ya se te cargan solas) ni tu memoria personal auto-generada. El brain es conocimiento del proyecto,
> curado y committeado en el repo.

## Regla de oro

**Antes** de una tarea: buscá en el brain indicado. **Después**: si la tarea dejó algo reutilizable o
una decisión, escribilo. Un cerebro que no se lee no sirve; uno que no se actualiza, miente — y un
brain que miente es peor que no tener ninguno, porque te hace confiar en algo falso.

---

## Comentarios en el código: al hueso. El texto largo va al brain

**La prueba es contar renglones, no juzgar contenido.** Un comentario son **una o dos líneas**. Si te
sale la tercera, eso ya no es un comentario: es una nota del brain que se metió en el archivo
equivocado. Movela y dejá un puntero de un renglón: `// ver docs/brain/<Nota>.md`.

Es un conteo y no un criterio a propósito. "¿Esto amerita explicación?" siempre se contesta que sí
—por eso escribiste el comentario—, y con esa pregunta cada bloque parece justificado uno por uno
mientras el archivo se llena. El renglón se cuenta igual sin importar lo valioso que sea el texto.

⚠️ **La trampa es creer que un texto importante merece más espacio ACÁ.** Al revés: cuanto más
importante, más lo estás escondiendo. Un párrafo dentro de un `.ts` nadie lo grepea, envejece sin que
nadie lo note, y se paga en tokens cada vez que alguien abre el archivo. La misma explicación como
nota se busca por título, se linkea desde su MOC y se corrige en un solo lugar. **El brain no es el
premio consuelo del comentario que no entró: es el lugar donde ese texto rinde.**

El reparto:

- **El código muestra QUÉ hace.** Un comentario que lo repite en prosa es ruido.
- **El brain explica POR QUÉ, cómo se usa, qué se descartó y qué te va a morder.** Ahí el texto largo
  es bienvenido: para eso está.

**Cuándo un comentario sí vale** — cuando el dato no cabe en el nombre del símbolo y quien lee lo
necesita ahí mismo:

- un renglón que define un campo de un DTO, un enum o una constante de nombre ambiguo;
- el porqué de una línea que parece un bug y no lo es (`// el back manda 0 cuando no hay cupo`);
- un workaround, con su motivo y la condición para borrarlo;
- un `TODO`/`FIXME` corto y accionable;
- el doc de una API pública que se va a consumir sin abrir la implementación.

**Cuándo no** — repetir en prosa el nombre de la función o de la variable; contar la historia del
cambio ("antes usaba X"), que es del commit o del brain; banners, separadores y comentarios
decorativos de sección; explicar sintaxis del lenguaje o del framework; dejar código comentado "por
si acaso", que para eso está git.

Y en código ajeno vale doble: **no agregues comentarios a líneas que no tocaste.** Si ves algo que
merece explicación, va al brain.

### ⚠️ Chequealo antes de commitear, no confíes en acordarte

Esta regla se lee al empezar la tarea y se viola al final, escribiendo código, cuando queda lejos. Y
se viola de a un bloque razonable por vez: nadie decide "voy a escribir un docblock de nueve
renglones", se llega ahí.

Antes de commitear, contá los renglones de lo que agregaste:

```bash
python <dir-de-esta-skill>/scripts/check_comentarios.py            # working tree
python <dir-de-esta-skill>/scripts/check_comentarios.py --staged   # lo que va al commit
python <dir-de-esta-skill>/scripts/check_comentarios.py --contra main   # toda la rama
```

Lista los bloques de 3+ renglones que **agrega** el diff, con archivo y línea, y sale con código 1 si
encontró algo. Ignora los delimitadores (`/**`, `*/`), así que un JSDoc de dos frases no lo marca.

Si no podés correrlo, el fallback es mirar tu propio diff y contar a ojo — el punto no es el script,
es **mirar el diff con esta pregunta puesta** antes de que el texto quede committeado.

Lo que el chequeo saque no se borra: **es exactamente lo que va al brain**, y probablemente sea lo
mejor que ibas a escribir en esa nota.

## Paso 0 — Encontrar el brain INDICADO

Nunca asumas `docs/brain/`. Un workspace puede tener un brain por repo, uno compartido arriba, ambos, o
ninguno. Escribir en el brain equivocado es peor que no escribir: rompe la ruta de búsqueda del próximo
que lo consulte.

El acelerador: una sola llamada resuelve descubrimiento + ruteo + match de keywords, e imprime el
`NEXT` que corresponda (`scripts/brain_find.py`, relativo al directorio de esta skill):

```bash
python <dir-de-esta-skill>/scripts/brain_find.py --root <raíz-del-workspace> --for <archivo-o-carpeta-que-vas-a-tocar> <kw1> <kw2> ...
```

Devuelve los brains encontrados, cuál es el indicado para ese archivo, el contexto compartido que suma,
y las notas que matchean ordenadas por relevancia (ignora `node_modules` y compañía, y matchea sin
acentos: `notificacion` encuentra `notificación`).

Si el script no corre (no hay python, `python3` en vez de `python`, path raro), no insistas: el fallback
nativo son dos llamadas y siempre funciona.

1. `Glob` de candidatos: `**/docs/brain/**/*.md`, `**/brain/**/*.md`, `**/.brain/**/*.md`.
2. `Grep` de tus keywords sobre esos directorios.

Con los candidatos en mano, elegí así:

- **Cero brains** → no hay. Resolvé la tarea normalmente. Mencionalo **una vez** y ofrecé crear uno.
  No lo crees sin luz verde: son varios archivos que van al repo del humano.
- **Uno** → ese es.
- **Varios** → el indicado es el que **cubre los archivos que vas a tocar**:
  - *Proximidad*: el brain cuyo repo/carpeta es el ancestro más cercano de esos archivos. Si la tarea
    habla de un repo (p. ej. una pantalla → el frontend), ese repo manda.
  - Si un `Home.md` declara `alcance:` en el frontmatter, eso pisa la proximidad.
  - **Tarea cross-repo** (back + front): consultá los dos, y después escribí cada cambio en el brain
    del repo que cambió. No mezcles.
  - Si además hay un brain a nivel workspace, sus MOCs relevantes son contexto **compartido** que suma
    al del repo; no lo reemplaza.
- **Ambigüedad real que no podés resolver** → para *leer*, leé los dos (es barato). Para *escribir*,
  preguntá en una línea cuál usar; no adivines.

---

## ANTES de la tarea — buscar (cheap-first)

1. Sacá 2–5 **palabras clave** de la tarea ("agregar un toast al guardar" → `toast`, `notificación`,
   `mensaje`). Incluí sinónimos y el término en inglés.
2. Matcheá esas keywords contra los **nombres de archivo** de las notas (Glob es gratis; los títulos son
   la superficie de búsqueda principal, por eso las convenciones de abajo insisten en títulos ricos).
3. Sin match claro → `Grep` los `aliases:` / `tags:` del frontmatter.
4. Abrí **solo** las 1–3 notas que matchean y seguí sus `[[wikilinks]]` a las conectadas (una nota
   atómica → su MOC de módulo → notas hermanas que quizá ya resuelven parte del problema).
5. Todavía nada → leé `Home.md` (el índice raíz) para orientarte, y recién ahí caé al código.

No leas el vault entero: eso deshace todo el ahorro. La gracia es abrir 2 notas dirigidas en lugar de
escanear medio `src/`.

**Si al leer una nota ves que miente** (ruta que ya no existe, API cambiada, gotcha ya arreglado),
corregila ahí mismo. Es el momento más barato para hacerlo: ya tenés el contexto cargado.

---

## DESPUÉS de la tarea — mantener

El filtro es una sola pregunta: **¿otro yo-futuro, en otra sesión, querría encontrar esto?** Si sí:

1. **Creá o actualizá** la nota atómica, con `Ubicación` (ruta real del archivo) y `Uso` (snippet mínimo).
2. **Linkeala** desde el MOC de su módulo y dejá el back-link en la nota.
3. Módulo nuevo → agregalo a `Home.md`.
4. Actualizá `actualizado:` en el frontmatter con la fecha real de hoy.
5. Nota > ~200 líneas → partila en notas atómicas colgadas de un MOC. Las notas gordas no se leen.

Merece nota: componente o servicio reutilizable, patrón que se va a repetir, decisión de arquitectura
(con el *por qué* y lo que se descartó), integración externa, gotcha de infra/DB/build, pieza de dominio
con vocabulario propio.

No merece nota: un fix puntual, un TODO, el estado de hoy de una rama, o algo que el código ya dice
solo. Tampoco copies `CLAUDE.md` ni un plan adentro del brain — linkealos.

Y si durante la tarea te contuviste de escribir un comentario largo en el código, ese texto
es exactamente lo que va acá. ⚠️ **Antes de commitear, verificá que efectivamente te contuviste:**
`scripts/check_comentarios.py` sobre tu diff. Lo que marque es material de nota, no de archivo
fuente.

---

## Convenciones

- **Nombre de archivo = título de la nota**, rico en palabras clave, en el idioma en que el equipo
  documenta (por defecto español). Es lo primero que se busca, así que `Componente Toast.md` le gana a
  `toast.md` y a `notas-ui-3.md`.
- **Frontmatter** en toda nota:
  ```yaml
  ---
  tipo: componente | servicio | modulo | patron | decision | dominio | integracion | referencia | home
  aliases: [sinónimos, siglas, términos-en-inglés, nombres-de-clase]
  tags: [componente, ui]
  actualizado: 2026-07-28
  ---
  ```
- **`aliases` es lo que hace encontrable la nota.** Poné todos los términos con los que la buscarías
  dentro de seis meses: sinónimos, la sigla, el inglés, el identificador exacto del código
  (`[toast, notificación, mensaje, alerta, MessageService]`). Una nota sin aliases es una nota perdida.
- Conectá con `[[Nombre de la Nota]]`, generosamente. Un wikilink a una nota que todavía no existe es
  válido: marca algo que vale la pena escribir.
- Un concepto por nota. Si el título necesita un "y", son dos notas.
- Nada transitorio. El brain es conocimiento, no bitácora.

### Tipos de nota

- **Home** (`Home.md`): índice raíz del vault; lista los MOCs y declara el `alcance` del brain.
- **MOC / módulo** (`Componentes Reutilizables.md`): hub que agrupa y linkea notas atómicas.
- **Atómica** (`Componente Toast.md`): un solo concepto — componente, servicio, patrón, decisión,
  integración o pieza de dominio.

---

## Plantillas

Las dos que se usan el 90% del tiempo. El resto (`decision`, `patron`, `dominio`, `integracion`,
`referencia`, `Home`) está en `references/plantillas.md` — leelo cuando escribas una de esas.

### Nota de componente / servicio

~~~markdown
---
tipo: componente
aliases: [nombre, sinónimo, NombreDeLaClase]
tags: [componente]
actualizado: AAAA-MM-DD
---
# <Nombre>

**Propósito:** una línea.
**Ubicación:** `src/app/...`
**Uso:**
```ts
// el snippet mínimo que hace falta para usarlo
```
**Depende de:** [[...]]
**Conectado con:** [[Módulo]]
**Gotchas:** lo no obvio, lo que te va a hacer perder una hora.
~~~

### Nota de módulo (MOC)

~~~markdown
---
tipo: modulo
aliases: [...]
tags: [moc]
actualizado: AAAA-MM-DD
---
# <Módulo>

Qué agrupa, en una línea. Después la lista:
- [[Componente Toast]] — notificaciones y alertas.
- [[...]] — ...
~~~

---

## Crear un brain nuevo

Solo cuando te lo piden (o cuando ofreciste y te dijeron que sí). Sembrar un vault bien es un
procedimiento con decisiones propias — ubicación, alcance, qué documentar primero, cuándo parar:
leé `references/crear-brain.md` y seguilo.

La trampa a evitar: intentar documentar todo el repo de una. Un brain nace chico (Home + 3–6 MOCs +
las notas de lo más reutilizado) y crece por uso, tarea a tarea.

---

## Ejemplo

Tarea: *"en el front, agregá un toast cuando se guarda el paciente"*.

Keywords → `toast`, `notificación`, `mensaje`. El script (o Glob) encuentra dos brains: uno en
`proteus-frontend/docs/brain` y uno en `docs/brain` a nivel workspace. La tarea es de front → el
indicado es el del frontend. Ahí matchea `Componente Toast.md`: dice cómo
(`inject(MessageService).add(...)`), dónde vive el `<p-toast>` y que un interceptor **ya** toastea los
errores HTTP — así que no hay que manejar el error a mano. Dos notas leídas, cero escaneo de `src/`.

Al terminar, si aparecieron reglas nuevas de cuándo toastear, van a esa misma nota; si no, el brain
queda como está. No todo cambio merece una escritura.
