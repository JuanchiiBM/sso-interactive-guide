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

La página nueva entró en F1. Estado de antes:

| Frame | Página | TC  | TUR | U   | M   |
| ----- | ------ | --- | --- | --- | --- |
| F0    | X      | 3   | 9   | 1   | 0   |
| F1    | Y      | 5   | 6   | 0   | 1   |
| F2    | Z      | 7   | 8   | 0   | 0   |

La víctima es **Y**.

| Algoritmo      | ¿Aplica?                            | Por qué                                                              |
| -------------- | ----------------------------------- | -------------------------------------------------------------------- |
| FIFO           | No                                  | La de menor TC es X (3).                                             |
| LRU            | Sí                                  | La de menor TUR es Y (6).                                            |
| Clock          | Sí, si el puntero estaba en F0 o F1 | Desde F0 baja la U de X y sigue; F1 tiene U = 0. Desde F2 saldría Z. |
| Clock mejorado | No                                  | Z es (0,0) y Y es (0,1): tendría que haber salido Z.                 |
