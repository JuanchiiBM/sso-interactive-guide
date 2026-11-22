---
titulo: Deducir qué algoritmo eligió la víctima
tema: parcial-2/memoria-virtual
orden: 4
reconocer: 'da una traducción con PF y la tabla de antes, y pregunta qué algoritmo pudo ser'
resumen: Te dan qué página salió y el estado anterior; te piden qué algoritmos la explican y cuáles no.
trampas:
  - '**TC y TUR son instantes, no cantidades:** el número más chico es el más viejo.'
  - '**Solo cuentan las páginas con P = 1:** una fila con P = 0 no es candidata.'
  - '**Con sustitución global** la víctima puede ser de otro proceso; con local, no.'
  - '**Justificá también los descartados**, no solo el que aplica.'
teoria:
  - reemplazo
  - clock-mejorado
  - conjunto-residente
---

### Receta

1. **Decodificá la DL y la DF:** con el tamaño de página salen la página pedida y el **frame** donde entró.
2. **La víctima** es la página que tenía ese frame con P = 1.
3. **Probá cada algoritmo** solo entre las páginas con P = 1:
   - **FIFO:** menor tiempo de carga (TC);
   - **LRU:** menor tiempo de última referencia (TUR);
   - **Clock:** la primera con U = 0 desde el puntero; sin puntero, probá desde qué posiciones llega;
   - **Clock mejorado:** la primera (0,0); si hay alguna (0,0) y la víctima no lo es, queda descartado.
4. **Justificá** los que aplican y los descartados. Puede haber más de uno.

### De dónde sale cada valor

|                            |                                                                            |
| -------------------------- | -------------------------------------------------------------------------- |
| menor TC / TUR             | Son marcas de tiempo: el instante más chico es el que pasó hace más.       |
| "si el puntero estaba en…" | Clock depende de dónde arranca; si no te lo dan, se prueba cada posición.  |
| Clock mejorado descartado  | Busca (0,0) primero en toda la vuelta: si había una, no puede elegir otra. |

### Ejemplo chico

Páginas de 4 KiB. A pide su página 5 (DL 5123h) y entra en la DF 1123h. Estado de antes (TC = carga, TUR = última referencia):

```deducir
titulo: ¿Qué algoritmo sacó a A1?
bitsOffset: 12
bitsDL: 16
bitsDF: 14
uso: TUR
marcos:
  - { frame: 0, proceso: A, pagina: 0, tc: 3, tur: 9, u: 1, m: 0 }
  - { frame: 1, proceso: A, pagina: 1, tc: 5, tur: 6, u: 0, m: 1 }
  - { frame: 2, proceso: A, pagina: 2, tc: 7, tur: 8, u: 0, m: 0 }
referencias: [{ proceso: A, dl: 0x5123, df: 0x1123 }]
algoritmos: [fifo, lru, clock, clock-mejorado]
```
