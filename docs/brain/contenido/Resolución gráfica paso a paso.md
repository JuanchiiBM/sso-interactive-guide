---
tipo: decision
aliases:
  [
    resolución gráfica,
    resolucion grafica,
    bloque memoria,
    memoria-bloque,
    barra de memoria,
    huecos,
    best fit,
    worst fit,
    first fit,
    compactación,
    agranda,
    agrandar partición,
    particiones dinámicas,
    asignación contigua en disco,
    marca DF,
    regla de DL,
    lectura de bloques,
    recorridoMemoria,
    simularHuecos,
    recorridoTraza,
    recorridoReemplazoEstado,
    traza paso a paso,
    Me rindo,
    bloque traduccion,
    recorridoTraduccion,
    traducción directa,
    recorridoTraduccionDirecta,
    segmentation fault,
    chequeo de límite,
    protección,
    segmentación paginada,
    tabla de páginas,
    inversa con búsqueda,
    recorridoTraduccionBusqueda,
    cadena FAT,
    bloque fat,
    recorridoCadenaFat,
    seguir la cadena,
    bloque links,
    recorridoLinks,
    simularLinks,
    hard link,
    soft link,
    contador de hard links,
    bloque locks,
    locks,
    cerrojo,
    lock obligatorio,
    lock sugerido,
    recorridoLocks,
    simularLocks,
  ]
tags: [contenido, recorrido, memoria, decision]
actualizado: 2026-11-22
---

# Resolución gráfica paso a paso

**Decisión (issues #55 y #56):** en el 2do parcial, la **Resolución** (la que ve quien toca
*Me rindo* o acierta) es gráfica y paso a paso, para que no deje lugar a dudas. La forma de
**resolver** no cambia: el alumno sigue completando campos (`calculos`).

**Diseño aprobado:** alternativa **A + tabla de C** del lienzo
https://claude.ai/artifact/UWHNdM7jhVXWvscHSWgvP1 (artboard *Main*, privado del dueño). La copia
local y la auditoría completa están en `docs/designs/grafico-memoria/` (fuera de git). Todo gráfico
nuevo de resolución (traducción, inodo, FAT, links, locks) sigue este patrón: un paso por decisión,
qué opciones había y por qué se elige una, el estado antes → después, y la tabla que el alumno tenía
que completar, tal como queda en ese paso.

## Barra de memoria: bloque ` ```memoria `

Dentro de una `justificacion` (o un tema), YAML. Acepta hexa (`0x2000`):

````md
```memoria
titulo: Segmentos de B con Best Fit y compactación (64 KiB)
total: 0x10000
algoritmo: mejor        # mejor | peor | primer | siguiente
unidad: hexa            # hexa (por defecto: 2000h, KiB) | decimal (8192, B)
tabla: B                # proceso cuya tabla de segmentos se muestra en cada paso
textoInicial: Sale del inciso a).
inicial:
  - { nombre: A.S2, inicio: 0x0000, tam: 0x2000 }   # proceso = lo de antes del punto
operaciones:
  - { carga: B.S0, tam: 0x4000 }
  - { libera: A, texto: 'Texto extra del autor.' }  # proceso entero o un segmento
  - carga: B.S3
    tam: 0x4000
    compactar: [{ mover: B.S1, a: 0x0000 }]        # los movimientos los elige el autor
```
````

| Qué | Dónde |
| --- | --- |
| Simulación pura (huecos, candidatos, compactar) | `src/lib/diagramas/memoria-huecos.ts` + test |
| Recorrido (fotogramas, chips, flecha, tabla) | `src/lib/diagramas/recorrido-memoria.ts` + test |
| Bloque markdown | `src/lib/diagramas/memoria-bloque.ts` (enganchado en `bloques-svg.ts`) |
| Estilos | `diagramas.css`, `rm-rayado`, `rm-chip-*`, `rm-flecha`, `rm-fila-*` |

- El texto de cada paso se **genera** de la simulación (candidatos, criterio del algoritmo, cuánto
  sobra, fragmentación externa). `texto:` en la operación agrega el porqué que el algoritmo no sabe
  (p. ej. por qué se mueve B.S1 y no B.S2).
- **Compactar no se calcula solo:** la cátedra pide "mover lo mínimo" y eso no es único. Si una
  carga no entra y no trae `compactar`, o un movimiento pisa otro segmento, **rompe el build**.
- Empates de Best/Worst Fit: se toma el primero y el otro sale como "✓ también vale (empate)".
- Usado en: memoria-real ej-07, 08, 10; fat-ufs ej-32, 34, 37; filesystem ej-07, 08.

### Extensiones de #59 (FAT/UFS y Filesystem)

Diseño: página "#59 Memoria en FS" del tablero
https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P#page-fs59 (A en bloques + extensiones de A).

```yaml
unidad: KiB            # KiB | MiB | bloques: números del enunciado sin convertir (KiB justo → "1 MiB")
tabla: particiones     # o un proceso | todos (segmentos de todos) | directorio (Archivo | Inicio | Bloques)
lectura:               # solo en bloques: el paso inicial cuenta qué bloques se leen (ej-07 a)
  { archivo: notas, desde: 8000, bytes: 10240, bloque: 8192, completar: [[Campo, valor, ok]] }
operaciones:
  - { agranda: P2, tam: 1538, etiqueta: lo leído, compactar: [{ mover: P2, a: 8192 }] }
  - { carga: PC, segmentos: [{ nombre: PC.S0, tam: 100 }, { nombre: PC.S1, tam: 100 }], compactar: … }
  - { marca: P2, dl: 4096, df: 'DF …', titulo: …, texto: …, chips: [{ ok: … }], completar: [[…]] }
```

- **bloques:** rango inclusivo bajo cada nombre (21–26), rejilla por bloque, la flecha dice el rango.
- **agranda:** crece al final del bloque; si el hueco de atrás no alcanza, exige `compactar` (y
  rompe si aun así no entra). Chips: el hueco de atrás primero ("✗ faltan N"), el resto "✗ no está
  al lado", y el total. La parte nueva se dibuja aparte (`+1538 KiB`, rótulo `etiqueta`).
- **segmentos juntos:** el hueco que admite uno solo va en ámbar ("entra uno solo").
- **marca:** paso sin cambios con la barra del paso anterior (con sus bordes), la línea de la DF y
  la regla de DL bajo el bloque; título, texto y chips son del autor. Con `completar`, la tabla es
  "Lo que había que completar"; sin, la tabla normal con el bloque en verde.
- Marcas y tabla se ubican **por fotograma**: solo bajan en el paso con regla o cajas.
- El reproductor pone título y texto en el mismo renglón: el texto no repite el título.
- Colores por orden de aparición del proceso (no por bloque), como el resto de las barras.
- Supuestos (ej-07: el disco no está en el enunciado) se dicen en el `texto` del paso.

## Traducción inversa: bloque ` ```traduccion `

Diseño "Común" del lienzo: por cada dirección, el **corte de bits** (segmento | offset), la cuenta
**base = DF − offset** y el segmento ubicado en la barra con la DF marcada (lo desconocido, con "?").
Al final, la tabla y los huecos.

```yaml
titulo: Tabla de segmentos de A desde sus traducciones
total: 0x10000
bitsSegmento: 2
bitsOffset: 14
proceso: A
direcciones:
  - { dl: 0x51FA, df: 0xE1FA, tam: 0x3000, texto: 'Está al final de la memoria: …' }
```

El `tam` lo pone el autor (dato, última dirección válida, fin de memoria) y lo justifica en `texto`.
Ubicación: `recorrido-traduccion.ts` + `traduccion-bloque.ts`; estilos `tr-*`. Usado en
memoria-real ej-10 a).

## Traducción directa: ` ```traduccion ` con `sentido: directo`

Diseño **B · bits + tabla + checklist** (issue #60, tablero
https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P#artboard-trad-B). Un paso por dirección: **1.**
corte bit a bit (los de segmento en `--warn`), **2.** la tabla con la fila del segmento marcada y el
dato que falla en `--bad`, **3.** los chequeos de la MMU en orden (límite → permiso → DF; el que falla
con ✗ y lo que sigue "no se llega"), y abajo los chips con el resultado de cada dirección.

```yaml
sentido: directo
titulo: Escrituras en 18 bits con segmentación y protección
bitsSegmento: 2          # sin bits: cada dirección viene como { seg, desp } (ej-03)
bitsOffset: 16
unidad: hexa             # hexa | decimal
acceso: escritura        # lectura | escritura | ejecucion; sin acceso no hay chequeo de permiso
segmentos:
  - { seg: 0, base: 0x00000, largo: 0x0ABCD, permisos: r }   # r Read only · x Exec only · rw Read write
direcciones:
  - { dl: 0x0BEEF, texto: 'Texto extra del autor.' }
```

- Cada segmento lleva `largo` (se compara con <, ej-03/04) o `limite` (última dirección válida,
  con ≤, ej-09): es lo que dice el enunciado, no se convierte uno en otro.
- `permisos` en minúsculas se muestra como etiqueta (`r` → Read only); en mayúsculas o con guiones
  (`RW-`) se muestra tal cual, como en el enunciado.
- "(además es Read only)" sale solo cuando el permiso también hubiera fallado.
- Rompe el build: una DL que no entra en los bits, un segmento que no está en la tabla, permisos con
  otra letra que r/w/x, una dirección sin `dl` ni `{ seg, desp }`.
- Ubicación: `recorrido-traduccion-directa.ts` (+ test); `traduccion-bloque.ts` elige por `sentido`.
  Estilos `tr-bit-*`, `tr-fila-*`, `tr-chk-*`, `tr-chip-*`. Usado en memoria-real ej-03 y ej-04.

### Segmentación paginada (mismo `sentido: directo`)

Diseños `trad-P1` (hexa) y `trad-P2` (decimal) del mismo tablero, extensión de B. Con `bitsPagina`
cada segmento lleva `paginas: { pág: frame }` (puede ser parcial) y `bitsOffset` pasa a ser el offset
dentro de la página.

- Hexa: corte en 3 colores (segmento `--warn`, página `--p5`, offset neutro); DF = frame | offset.
- Decimal: corte por división (DL = seg × 2^(pág+off) + desplazamiento; desplazamiento = pág × tamaño
  + offset); DF = frame × tamaño + offset.
- La tabla de segmentos solo aparece si hay límite/largo o `acceso`; si no (ej-06), los permisos van
  como columna de la tabla de páginas. Chequeos: límite → permiso → la página tiene frame → DF; si
  falla algo de la tabla de segmentos, la de páginas se atenúa (`tr-tabla-no`).
- Página sin frame → "Fault (página)". Usado en memoria-real ej-06 y ej-09.

## Inversa con búsqueda: ` ```traduccion ` con `sentido: busqueda`

Diseño `trad-I`. DF → frame | offset → se busca el frame en **todas** las tablas de páginas (la que
lo tiene, marcada; las otras, atenuadas) → DL = segmento | página | offset.

```yaml
sentido: busqueda
bitsSegmento: 1
bitsPagina: 3
bitsOffset: 12
bitsFrame: 4
procesos:
  - pid: PID1
    segmentos:
      - { seg: 0, nombre: RO, paginas: { 0: 7, 1: 6, 2: 10 } }
direcciones:
  - { df: 0x5111 }
```

Frame en ninguna tabla → "libre". Frame en dos tablas (compartido) **rompe el build**: la DL no
sería única. Ubicación: `recorrido-traduccion-busqueda.ts` (+ test); estilos `tr-caja-*`,
`tr-bit-frame`. Usado en memoria-real ej-11 a).

## Cadena FAT: bloque ` ```fat `

Diseño **B · Cadena de cajas con rangos** (issue #62, tablero
https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P#artboard-fat-B). Entrada de directorio → cajas
en el orden de la cadena → EOF; bajo cada caja, "lógico k" y su rango de bytes. El bloque del paso
va en `--ok`, los ya pasados en `--accent`, los que faltan atenuados (borde punteado).

```yaml
titulo: c) Seguir la cadena hasta el byte 12000
tabla: { 2: 4, 3: Fin de Archivo, 5: 10, 6: 8, 8: 3, 10: 6 }   # EOF / FIN / Fin de Archivo
inicio: 5
bloque: 8192
byte: 12000            # opcional
desde: 1               # opcional: lógicos desde 1 (ej-46)
completar: fat         # opcional, sin byte: completa FAT[N] en vez de "k.º bloque" (ej-41)
contenido: { 3: SIST, 8: EMAS }   # opcional (ej-30): bajo cada caja, y se arma el del archivo
```

- **Con `byte`:** un paso por bloque hasta el que lo tiene ("bloque 5 (lógico 0): 0–8191 · 12000 >
  8191 → seguir", "FAT[5] = 10 … ✓ está acá") y uno final "leer el bloque N → 1 bloque leído" (la
  FAT se supone en memoria). La marca "byte X · offset Y" va desde el paso 1 bajo la caja donde cae.
  Completa "Bloque del FS" y "Bloques leídos".
- **Sin `byte`:** un paso por bloque, "FAT[N] = M → seguir", y el último "FAT[N] = EOF → fin" con
  `n bloques × tamaño = asignado`.
- Rompe el build: una entrada que no está en la tabla, un ciclo, una cadena que pasa por un 0 (libre),
  un byte después del último bloque, un cluster de la cadena sin `contenido`.
- Ubicación: `recorrido-cadena-fat.ts` (+ test), `fat-bloque.ts`; estilos `fat-*`. Usado en fat-ufs
  ej-02, 24 a) c) d), 30 a), 41 b), 46.
- **Fuera:** ej-34 b-ii) (no da la FAT: dibujar bloques sería inventar), ej-48, 35 y 50 (directorios
  o inodo). El recorrido de teoría `cadena-fat` (PPT, con pestañas y "agrandar") sigue aparte.

## Punteros del inodo: bloque ` ```inodo `

Byte → bloque → accesos, un paso por puntero (PD, PIS, PID, PIT). Ver [[Resolución gráfica del inodo]].

## Links: bloque ` ```links `

Diseño **links-A · Directorio → inodos** (issue #63, tablero
https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P#artboard-links-A) con la flecha del soft link **por
adentro** (de la tarjeta a la entrada que nombra, puede cruzar las otras) y, con varios directorios,
**M1**: cajas apiladas a la izquierda, inodos a la derecha. Un paso por operación.

```yaml
titulo: Links de /datos/informe.txt
volumenes:                     # opcional; con dos o más, una columna por volumen
  - { nombre: A, directorios: [/datos] }
inicial: [{ ruta: /datos/informe.txt, inodo: I }]
operaciones:
  - { ln: /datos/informe.txt, a: /datos/copia.txt }
  - { lns: /datos/informe.txt, a: /datos/acceso.txt, inodo: S }   # ln -s: el autor nombra el inodo
  - { rm: /datos/informe.txt, texto: 'Texto extra del autor.' }
escenarios:                    # opcional: una pestaña por inciso que arranca del mismo estado
  - { nombre: 'c) rm java17', operaciones: [{ rm: ... }] }
```

- Va en la justificación del **último inciso**: la secuencia completa responde los anteriores.
- Textos generados; el del `rm` es el del tablero. Inodo con letras → "el contador de I", con
  números → "del inodo 5"; con varios directorios, "quita esa entrada de /etc".
- La entrada borrada queda tachada en `--bad` en su paso y atenuada después (la flecha del soft link
  siempre tiene a dónde llegar). Inodo en 0: tarjeta atenuada, "se liberan".
- Dos volúmenes: el dibujo es más ancho que 820 y se ve a ~80%. El soft link a otro volumen sube
  por un carril arriba y baja junto a la entrada.
- La caja del directorio se ensancha con rutas largas (`/usr/lib/java17/bin`).
- Rompe el build: hard link entre volúmenes, `rm`/`ln` de una ruta que no existe, crear una que ya
  existe, inodo de `ln -s` repetido, directorio fuera de `volumenes`.
- Ubicación: `links.ts` (simulación pura) + `recorrido-links.ts` + `links-bloque.ts`, con tests;
  estilos `lk-*`. Usado en fat-ufs ej-19, 20, 21, 22 (pestañas en 21 y 22) y 49. A mano: ej-25, 48.

## Locks en el tiempo: bloque ` ```locks `

Diseño **B · Código lado a lado** (issue #64, tablero
https://claude.ai/artifact/NsqCw5ihjtsM2XFgVb5h9P#artboard-locks-B). Un paso por **turno de RR**: una
columna de código por proceso (`--p1…`, estado arriba: ready · con lock / bloqueado / ejecuta /
terminó), la línea donde terminó el turno en `--accent`, "✗ sin lock" en `--warn` y "espera ✗" en
`--bad`; abajo los recuadros **Cerrojo** (modo, dueños, cola), **Archivo** y **Pantalla** (lo nuevo en
`--warn`), y "Tabla a completar en este paso" con la fila del paso en `--ok`.

```yaml
titulo: Locks obligatorios compartidos con RR
cerrojo: obligatorio     # obligatorio | sugerido
modo: compartido         # compartido: el modo sale del open (read → compartido) | exclusivo: siempre
archivo: { nombre: f, contenido: A }
procesos:                # en el orden de Ready
  - { nombre: P1, codigo: ["open(f, read)", "var = '-'", "lock(f)", "read(f, var)", "print(var)", "unlock(f)"] }
```

- Reglas (las de la cátedra en ej-09/10): el clock llega **después de cada `print`**; un `lock`
  incompatible bloquea y va a la cola; un compartido entra aunque haya un exclusivo esperando (no hay
  prioridad al escritor); `unlock` despierta a la cola en orden mientras sea compatible y los pasa a
  Ready con el lock ya tomado. Con **obligatorio**, `read`/`write` sin lock mientras otro lo tiene
  **falla sin bloquear** (las syscalls de archivo no son bloqueantes); con **sugerido**, pasa.
- Se corta en el último `print`: los `unlock` que siguen no cambian la tabla. Por eso ej-09 da 7
  pasos y no los 6 del tablero (el tablero juntaba los dos `unlock`).
- El texto del paso se genera de los eventos (toma / bloquea / falla / pasa / libera e imprime).
- Rompe el build: una instrucción que no sea `open`, `var = '…'`, `lock`, `unlock`, `read`, `write`
  o `print`; otro archivo; `unlock` sin tener el lock; un `cerrojo` o `modo` inventado.
- Ubicación: `locks-rr.ts` (simulación pura, + test), `recorrido-locks.ts` (+ test),
  `locks-bloque.ts`; estilos `ck-*`. Usado en filesystem ej-09 y ej-10.
- **Fuera:** ej-02, 03, 05 y 06 (MC teóricos sin línea de tiempo: P1 tiene el lock y P2 pide).

## TLB y deducir el algoritmo: bloques ` ```tlb ` y ` ```deducir `

Camino de cada referencia por la TLB, y víctima real contra cada algoritmo. Ver [[Resolución gráfica de la TLB]].

## Traza: recorrido automático

`TrazaDesafio` dibuja `recorridoTraza(traza, alg)` arriba de la justificación, para **todas** las
trazas, sin tocar los `.md`. **Reusa la grilla de la cátedra que ya tenían la teoría y la guía**
(no hacer otra): `recorrido-traza.ts` es solo un adaptador.

- Frames vacíos, páginas numéricas y solo lecturas (u Óptimo) → `recorridoReemplazo`.
- Desde un estado dado (páginas como `P2p0`, escrituras, inválidas) → `recorridoReemplazoEstado`,
  que acepta `rotulos` y FIFO/Clock además de LRU y Clock mejorado; la columna se ensancha sola.
- Los textos de Clock y Clock mejorado recorren el puntero frame por frame ("1.ª vuelta busca
  (0,0): F5 (1,1)…", "2.ª vuelta busca (0,1) bajando U: F1 → U=0…") y dicen dónde queda.

## Gotchas

- `astro dev` a veces sigue sirviendo la versión vieja de un `.md` después de editarlo ("An error
  happened during full reload"): `astro dev stop` y levantarlo de nuevo.

- Un fotograma por paso (`paso-i` / `col-j`, ocultos): el recorrido no cambia tamaños, solo muestra
  y oculta. Ver la técnica en [[Recorridos de Memoria]].
- Si una flecha llega al principio de la barra, los rótulos Antes/Después pasan a la derecha.
- Memoria virtual ej-04 y ej-05 además tienen el recorrido comparativo de la guía (`guia-mem-ej8/9`)
  en la última traza: el último algoritmo aparece dos veces.
- Con `encadenado`, el inciso b) está oculto hasta resolver el a): para verlo en el navegador hay
  que resolverlo o destapar el contenedor.

**Conectado con:** [[Recorridos paso a paso]], [[Traza de reemplazo a completar]],
[[Formato de un Ejercicio]], [[Contenido]]
