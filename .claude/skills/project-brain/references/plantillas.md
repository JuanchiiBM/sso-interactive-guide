# Plantillas de notas

Las de `componente`/`servicio` y `modulo` están en el SKILL.md porque son el 90% de los casos. Acá están
las demás. Son andamios, no formularios: si un campo no aporta nada en tu caso, borralo — un campo vacío
le hace creer al que lee que no hay nada que decir ahí.

Todas comparten la misma regla: frontmatter completo, título rico en keywords, `aliases` generosos,
`actualizado` con la fecha real de hoy, y wikilinks a las notas vecinas.

## `decision` — decisión de arquitectura

Lo valioso de esta nota no es la decisión: es el **por qué** y lo que se descartó. Eso es exactamente lo
que no se puede reconstruir leyendo el código, y lo que evita que alguien "arregle" en seis meses algo
que era deliberado.

~~~markdown
---
tipo: decision
aliases: [tema, sigla, término-en-inglés]
tags: [decision, arquitectura]
actualizado: AAAA-MM-DD
---
# Decisión — <Qué se decidió>

**Fecha:** AAAA-MM-DD
**Estado:** vigente | reemplazada por [[...]]

**Contexto:** qué problema había que resolver.
**Decisión:** qué se eligió, en una o dos líneas.
**Por qué:** las razones reales, incluida la que era política o de plazos si es la verdadera.
**Descartado:** las otras opciones y por qué no. Esto le ahorra la relectura al próximo.
**Consecuencias:** con qué hay que vivir ahora (costos, límites, deuda asumida).
**Conectado con:** [[Módulo]], [[...]]
~~~

## `patron` — patrón / convención que se repite

~~~markdown
---
tipo: patron
aliases: [nombre del patrón, sinónimos, término-en-inglés]
tags: [patron]
actualizado: AAAA-MM-DD
---
# Patrón — <Nombre>

**Cuándo aplicarlo:** la situación que lo dispara.
**Cómo:**
```ts
// el ejemplo canónico, copiado de un archivo real del repo
```
**Ejemplos en el repo:** `src/...`, `src/...`
**Cuándo NO usarlo:** el límite. Sin esto, el patrón se aplica donde no va.
**Conectado con:** [[Módulo]], [[Convenciones del Repo]]
~~~

## `integracion` — sistema externo

~~~markdown
---
tipo: integracion
aliases: [nombre del sistema, siglas, nombre del proveedor, protocolo]
tags: [integracion, externo]
actualizado: AAAA-MM-DD
---
# Integración — <Sistema>

**Qué hace:** una línea.
**Cómo se habla:** REST / SOAP / cola / scraping; endpoints o topics principales.
**Auth y credenciales:** el mecanismo y **dónde** se configuran (nombre de la env var, no el valor).
**Código nuestro:** `src/...` (cliente, adapter, worker).
**Formatos y rarezas:** códigos propios, fechas, encodings, límites de rate.
**Gotchas:** cómo falla en la vida real y qué hacer cuando falla.
**Conectado con:** [[Módulo]]
~~~

Nunca pongas secretos, tokens ni credenciales en una nota: el brain se committea y se comparte. Nombrá
dónde viven, no cuánto valen.

## `dominio` — concepto del negocio

~~~markdown
---
tipo: dominio
aliases: [término, plural, sigla, cómo lo llama el cliente, cómo se llama en el código]
tags: [dominio, glosario]
actualizado: AAAA-MM-DD
---
# <Concepto>

**Qué es:** definición en lenguaje del negocio, sin jerga técnica.
**Cómo se llama en el código:** entidad / tabla / campo (suelen no coincidir, y ahí está el valor).
**Reglas del negocio:** las que un dev tiene que saber para no romper nada.
**Conectado con:** [[Glosario de Dominio]], [[Módulo]]
~~~

## `referencia` — puntero a algo externo

Sirve para no volver a buscar la misma cosa. Si es un link, decí qué hay ahí adentro; un link sin
contexto obliga a abrirlo para saber si sirve.

~~~markdown
---
tipo: referencia
aliases: [tema, herramienta, siglas]
tags: [referencia]
actualizado: AAAA-MM-DD
---
# Referencia — <Tema>

**Para qué sirve:** una línea.
**Dónde:** URL, ruta del repo, ticket, documento.
**Qué hay ahí:** lo que vas a encontrar y lo que no.
**Conectado con:** [[...]]
~~~
