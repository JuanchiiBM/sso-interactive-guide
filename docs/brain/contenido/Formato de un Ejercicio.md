---
tipo: referencia
aliases: [ejercicio, frontmatter, enunciado, formato ejercicio, codigo-columnas, agregar ejercicio]
tags: [contenido, ejercicios]
actualizado: 2026-09-23
---

# Formato de un Ejercicio

**Ubicación:** `src/content/ejercicios/<tema>/ej-NN.md` (NN con cero a la izquierda).

```yaml
---
titulo: Prioridades con y sin desalojo
tema: parcial-1/planificacion # id de la colección temas
fuente: { guia: Guía de Ejercicios – Planificación (v.2C2026), numero: 5 }
tipo: practico # teorico | practico | codigo | verdadero-falso | multiple-choice
dificultad: media # facil | media | dificil
tags: [prioridades, gantt]
simulaciones: [] # ver [[Simulador de Planificación]]
---
```

El **cuerpo** es el enunciado tal cual la guía (tablas, código, incisos). Sin resolución en el cuerpo:
la resolución sale de `simulaciones` (Gantt) o de `preguntas` (multiple choice):

```yaml
preguntas:
  - enunciado: "a) ¿Qué problema se presenta?"
    opciones:
      - texto: Deadlock
        explicacion: Una línea; se muestra como pista si la eligen mal.
      - texto: Livelock
        explicacion: ...
    correcta: 0            # índice base 0
    justificacion: |
      Markdown completo (listas, `código`, ```grafo). Se ve recién al acertar.
```
Ver [[Patrón — Desafío antes de la Resolución]].

**Código de varios procesos lado a lado:** envolver en `<div class="codigo-columnas">` con líneas en
blanco alrededor de cada bloque (si no, el markdown de adentro no se procesa):

````md
<div class="codigo-columnas">

**Proceso A**

```c
while(TRUE){ ... }
```

</div>
````

**Notas aclaratorias** propias (no de la guía): `> **Nota:** …`.
**Grafos dados como dato:** bloque ` ```grafo ` (ver [[Bloques SVG grafo y diagrama]]; ej. Deadlock Ej. 1). Si el grafo es la respuesta,
no se dibuja en el enunciado.

**Gotchas:** la carga inicial se generó con un script desde la extracción de los PDFs; los 38
archivos ya se editan a mano, el script no es parte del repo.
**Conectado con:** [[Contenido]], [[Content Collections Temas y Ejercicios]]

## `nota`: conceptos que la teoría no explica
Si el enunciado usa un término que **no aparece en la teoría del sitio** (p. ej. "afinidad de
procesador" en Planificación Ej. 3), el ejercicio lleva `nota:` (markdown) con la explicación.
Se muestra como bloque **Nota** entre el enunciado y "Resolución". Regla del dueño: vale para
los ejercicios de **guía**; explicar el concepto sin resolver el ejercicio.

