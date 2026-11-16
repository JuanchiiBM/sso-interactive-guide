---
tipo: referencia
aliases:
  [
    huecos de la teoría,
    gotchas de estudio,
    pendientes de teoría,
    backlog de teoría,
    qué falta explicar,
    dudas de alumno,
    mejoras de contenido,
  ]
tags: [contenido, backlog, memoria, filesystem]
actualizado: 2026-11-16
---

# Huecos de la Teoría detectados resolviendo

Punteo de lo que trabó al resolver la guía **con la teoría del sitio en la mano**: cosas que la
teoría da por sabidas, explica en una línea o no conecta con el ejercicio. Cada ítem dice **dónde
debería ir** y trae el ejemplo que destrabó. Al incorporarlo a `src/content/temas/`, se borra de acá.

## Memoria real y virtual

Todo lo detectado con la guía de Memoria (2016) ya se incorporó a la teoría:

- **Memoria real:** sección "Herramientas de cuenta" (hexa ↔ binario, potencias de 2); en
  Segmentación, permisos, cortar la dirección, deducir los bits de segmento y traducción inversa;
  en Paginación → Traducción, los 4 pasos en decimal con el ejemplo del 2100.
- **Memoria virtual:** máximo de páginas (la RAM no limita), tabla de páginas vs. tabla de frames
  libres, bit M (E escribe en RAM; a disco solo la víctima con M = 1), "LRU a mano" y "Clock a
  mano: quién toca la U" (refs. 5 y 9–11 de la secuencia de clase).

Si aparece algo nuevo al resolver los ejercicios de parcial, va acá abajo.

## Filesystem (`temas/parcial-2/filesystem.md`, `fat-ufs.md`)

_Pendiente: anotar lo que salga al resolver la guía de FS._

## Patrones que se repiten

- Lo que más destrabó fue **dar el ejercicio "al revés" como espejo del anterior** (Real 5 = Real 4
  invertido) y **un ejemplo con números que no son los del ejercicio**.
- Las herramientas de cuenta viven en Memoria real ("Herramientas de cuenta") y Memoria virtual las
  enlaza. Si FAT/UFS necesita las mismas cuentas, que enlace ahí en lugar de repetirlas.

**Conectado con:** [[Contenido]], [[Formato de un Tema de Teoría]], [[Convenciones de la Cátedra FRBA]]
