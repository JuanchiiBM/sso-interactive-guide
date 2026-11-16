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
actualizado: 2026-11-12
---

# Huecos de la Teoría detectados resolviendo

Punteo de lo que trabó al resolver la guía **con la teoría del sitio en la mano**: cosas que la
teoría da por sabidas, explica en una línea o no conecta con el ejercicio. Cada ítem dice **dónde
debería ir** y trae el ejemplo que destrabó. Al incorporarlo a `src/content/temas/`, se borra de acá.

## Memoria real (`temas/parcial-2/memoria-real.md`)

- **Hexa ↔ binario, de a 4 bits.** No está en ningún lado y es prerrequisito de Real 4 y 5. Falta
  la tabla 0–F con su binario (pesos 8 4 2 1) y la regla: 1 dígito hexa = 4 bits, siempre.
  → recuadro antes de "Segmentación" o en una sección de "Herramientas".
- **Cortar una dirección cuando el corte no cae en un dígito hexa.** Al tomar 3 bits de segmento
  sobran 13 de desplazamiento, y "siempre me sobra un bit". Regla: reagrupar **desde la derecha** y
  rellenar con ceros el bit suelto. Atajo: solo se parte el **primer** dígito; los otros se copian.
  Ejemplo: `3ABC` = `001·1 1010 1011 1100` → seg 1, desplazamiento `1ABC`. Tabla útil: 0–1 → seg 0,
  2–3 → seg 1, 4–5 → seg 2… (3 bits de seg sobre 16). → "Segmentación".
- **Si el enunciado no dice cuántos bits son de segmento, se deducen** de un dato del tipo "la DL X
  es del segmento N" (probar 1, 2, 3 bits). No se explicó por qué importa: con 000Eh da igual, pero
  con 201Eh cortar en 2 bits da base negativa. → "Segmentación" o "Preguntas de parcial".
- **Traducción inversa: base = física − desplazamiento.** Real 5 entero es el Real 4 al revés y la
  teoría solo muestra el sentido directo. Límite (convención cátedra = DF final) se deduce de: "X
  anda y X+1 da fault", "segmentos adyacentes" (límite = base del siguiente − 1) o "al final de la
  memoria" (FFFF con 16 bits). → "Segmentación".
- **Analogía base/límite/desplazamiento** ("la calle empieza en la base, el desplazamiento es
  cuántas casas caminás, el límite es la última casa") funcionó mejor que la definición.
- **Tabla de permisos R/W/X por protección** (Read only, Exec only, Read write × leer/escribir/
  ejecutar). La teoría dice "código RX, datos RW" pero no la tabla para chequear un acceso.
- **Segmentation fault ≠ page fault.** Se confundieron. Uno es error (pasarse del límite), el otro
  no (la página está en disco y se trae). → aviso en "Segmentación" con link a Memoria virtual.

## Memoria virtual (`temas/parcial-2/memoria-virtual.md`)

- **Con memoria virtual la RAM no limita el tamaño del programa.** En Virtual 2 a) se usó la RAM
  (32 KiB, distractor) y dio 2048 en vez de 128. Decirlo explícito: el máximo es
  `2^bits de DL / tamaño de página`. → "Qué es".
- **Unidades: KiB → bytes → potencia de 2.** "¿Cómo saco los bytes de 0,5 KiB?". Falta la tabla
  1 KiB = 2^10, 1 MiB = 2^20, 1 GiB = 2^30 y el truco de dividir restando exponentes
  (2^16 / 2^9 = 2^7). → recuadro de herramientas, compartido con Memoria real.
- **Tabla de páginas vs. mapa de bits de frames libres: son dos tablas distintas.** Una por proceso
  ("¿dónde está cada página?") y una del sistema ("¿qué frames están libres?"). El número de página
  no se guarda (es el índice); el bit P hace falta porque el frame 0 es válido. Tamaño del bitmap =
  frames / 8 bytes. → "La tabla de páginas en memoria virtual", con un dibujo de ambas.
- **Pasar el mapa de memoria a tabla de páginas es invertirlo.** El enunciado ordena por frame
  ("A1 en el frame 3") y la tabla por página. Página que no aparece → P = 0 → Fault.
- **Traducción en decimal paso a paso.** La teoría la tiene en una línea (Memoria real →
  "Traducción") y un ejemplo con 4096; no alcanzó. El que funcionó:

  > Páginas de 1024 B, DV **2100**: 2100 ÷ 1024 = **2** (2 × 1024 = 2048 entra, 3072 se pasa),
  > resto 2100 − 2048 = **52**. Si la página 2 está en el frame 3 → 3 × 1024 + 52 = **3124**. Si
  > tiene "–" → page fault, no hay DF.

  Y el truco de los rangos: página 0 = 0–1023, página 1 = 1024–2047, página 2 = 2048–3071…
  → ampliar "Traducción" con tabla de 4 pasos y llevar un resumen a "Los tres casos de una
  referencia".

- **Clock: quién sube y quién baja la U.** La teoría dice la regla pero no separa los dos actores,
  y la U "aparece y desaparece" sin explicación. Falta la tabla: **hardware** la pone en 1 en cada
  uso (entrada por PF **o** acierto); **puntero** la pone en 0 al pasar buscando víctima. Nombre
  que ayuda: "segunda oportunidad". Ejemplo que destrabó (secuencia de clase, refs. 9–11): en la 9
  el puntero baja la U del 2; en la 10 el 2 acierta y el HW se la devuelve; en la 11 esa U lo salva
  y sale el 4. → "Reemplazo", junto al recorrido, narrando 9–11.
- **Clock: el puntero NO es la víctima, es dónde arranca la búsqueda.** Se creyó que "el puntero
  está en F0 → reemplaza F0 directo". Solo sale un frame con U = 0; si todos tienen U = 1, el
  puntero da **la vuelta entera** bajándolas y vuelve al primero (ref. 5 de la secuencia de clase:
  `2U 3U 1U`, entra 5 → baja las tres, vuelve a F0, sale el 2, quedan `5U 3 1`). Por eso después
  de una vuelta completa el resto queda con U = 0. → mismo lugar, narrando la ref. 5.
- **Clock: "un acierto no mueve el puntero" se leyó como "el puntero va al frame del acierto".**
  El puntero queda donde lo dejó el **último reemplazo**; los aciertos no lo tocan. Ej. Virtual 4
  (guía Ej. 8), ref. 14: tras el PF de la ref. 9 el puntero quedó en F2; los aciertos 10–13 (en F0,
  F1, F3) no lo mueven, así que arranca en F2, el 7 tiene U = 0 y sale de una. → mostrar la fila
  del puntero también en los aciertos.

- **LRU: el instante de referencia es solo para LRU**, y el de la tabla inicial solo da el **orden**
  (3, 15, 28 son "raros" porque hubo usos antes de la foto). Se arranca desde la foto, sin
  reconstruir el pasado; las páginas no se reacomodan por instante, cada una sigue en su frame.
  Herramienta que destrabó: fila "más vieja → más nueva" al costado de la grilla, y un **acierto
  también la mueve al final** (diferencia con FIFO).
- **"Páginas escritas a disco" ≠ referencias de escritura.** Se contaron las (E) de la secuencia
  como escrituras a disco (dio 3 en vez de 2 en Virtual 5 / guía Ej. 9). Una (E) escribe en **RAM**
  y solo pone M = 1; a disco se escribe recién cuando esa página **sale como víctima con M = 1**.
  Falta una tabla L/E × acierto/PF → efecto en M, y la frase explícita. → "Los tres casos de una
  referencia" y "Reemplazo".

## Filesystem (`temas/parcial-2/filesystem.md`, `fat-ufs.md`)

_Pendiente: anotar lo que salga al resolver la guía de FS._

## Patrones que se repiten

- Lo que más destrabó fue **dar el ejercicio "al revés" como espejo del anterior** (Real 5 = Real 4
  invertido) y **un ejemplo con números que no son los del ejercicio**.
- Las herramientas de cuenta (hexa/binario, potencias de 2, división con resto) aparecen en varios
  temas y no viven en ninguno: candidatas a una sección común linkeada desde Memoria real, Memoria
  virtual y FAT/UFS.

**Conectado con:** [[Contenido]], [[Formato de un Tema de Teoría]], [[Convenciones de la Cátedra FRBA]]
