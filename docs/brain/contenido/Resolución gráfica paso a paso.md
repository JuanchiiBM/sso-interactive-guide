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
  ]
tags: [contenido, recorrido, memoria, decision]
actualizado: 2026-11-21
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
memoria-real ej-10 a). Falta el sentido **directo** (DL → DF chequeando el límite, segfault).

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
