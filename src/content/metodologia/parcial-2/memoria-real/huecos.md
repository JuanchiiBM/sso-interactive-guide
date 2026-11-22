---
titulo: Huecos y compactación
tema: parcial-2/memoria-real
orden: 6
reconocer: pide ubicar segmentos con First / Best / Worst Fit o compactar
resumen: Te dan la memoria ocupada y segmentos nuevos; te piden dónde va cada uno.
trampas:
  - '**Listá todos los huecos** antes de elegir, también el del principio y el del final.'
  - '**Los pedidos van en orden:** cada uno usa los huecos que dejó el anterior; no saltes a "todo compactado".'
  - '**Compactá lo mínimo:** si moviendo un solo segmento queda un único hueco, esa es la opción.'
  - '**Los segmentos se numeran desde 0.**'
teoria:
  - algoritmos-de-ubicación
  - particionamiento-dinámico
---

### Receta

1. **Fin** de cada segmento = base + tamaño.
2. **Ordená por base** y listá **todos** los huecos (desde, tamaño), incluidos el del principio y el del final.
3. **Elegí según el algoritmo:** First Fit = el primero donde entra; Best Fit = el más chico donde entra; Worst Fit = el más grande. El segmento va al inicio del hueco y lo que sobra sigue libre.
4. **Si un proceso termina**, sus segmentos pasan a ser huecos y se juntan con los vecinos libres.
5. **No entra en ningún hueco pero la suma alcanza:** es fragmentación externa. Se compacta moviendo la menor cantidad de segmentos, y se actualiza la base en la tabla.

### De dónde sale cada valor

|                                |                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `hueco = base siguiente − fin` | Lo libre es lo que queda entre dos segmentos ocupados.                         |
| Best Fit compara todos         | Para saber cuál es el más chico donde entra hay que mirarlos todos.            |
| fragmentación externa          | Los segmentos son variables y contiguos: dejan huecos sueltos que no se suman. |

### Ejemplo chico

Memoria de 32 KiB con tres segmentos de A. Llegan B.S0 (2 KiB) y B.S1 (3 KiB), con Best Fit.

```memoria
titulo: Dos segmentos de B con Best Fit (32 KiB)
total: 0x8000
algoritmo: mejor
unidad: hexa
tabla: B
inicial:
  - { nombre: A.S0, inicio: 0x0000, tam: 0x1000 }
  - { nombre: A.S1, inicio: 0x2000, tam: 0x2800 }
  - { nombre: A.S2, inicio: 0x5000, tam: 0x1800 }
operaciones:
  - { carga: B.S0, tam: 0x0800 }
  - { carga: B.S1, tam: 0x0C00 }
```
