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
- Usado en: memoria-real ej-07, 08, 10. Pendientes con el mismo bloque: fat-ufs ej-32, 34, 37;
  filesystem ej-07, 08.

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

- Un fotograma por paso (`paso-i` / `col-j`, ocultos): el recorrido no cambia tamaños, solo muestra
  y oculta. Ver la técnica en [[Recorridos de Memoria]].
- Si una flecha llega al principio de la barra, los rótulos Antes/Después pasan a la derecha.
- Memoria virtual ej-04 y ej-05 además tienen el recorrido comparativo de la guía (`guia-mem-ej8/9`)
  en la última traza: el último algoritmo aparece dos veces.
- Con `encadenado`, el inciso b) está oculto hasta resolver el a): para verlo en el navegador hay
  que resolverlo o destapar el contenedor.

**Conectado con:** [[Recorridos paso a paso]], [[Traza de reemplazo a completar]],
[[Formato de un Ejercicio]], [[Contenido]]
