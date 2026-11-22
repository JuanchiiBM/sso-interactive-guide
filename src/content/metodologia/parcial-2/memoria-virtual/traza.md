---
titulo: Completar una traza de reemplazo
tema: parcial-2/memoria-virtual
orden: 3
reconocer: da un estado (frames, U, M, puntero) y una secuencia de referencias, y pide cómo queda
resumen: Te dan el estado de los frames y las referencias; te piden la traza con PF, víctimas y accesos a disco.
trampas:
  - '**Correr el algoritmo en un hit:** en un hit solo se pone U = 1 (y M = 1 si escribe); el puntero no se mueve.'
  - '**Borrar la M:** el Clock solo baja la U; la M nunca.'
  - '**Tocar frames que el puntero no recorrió:** quedan igual.'
  - '**Dejar el puntero en la víctima:** queda en el frame siguiente.'
  - '**M = 1 en una lectura:** una página que entra por lectura entra con M = 0.'
  - '**Olvidar la escritura de la víctima:** si tenía M = 1, el PF cuesta 2 accesos a disco.'
teoria:
  - reemplazo
  - lru-a-mano
  - clock-a-mano-quién-toca-la-u
  - clock-mejorado
---

### Receta

0. **El algoritmo solo corre en un PF.** En un hit: U = 1 (y M = 1 si es escritura), y el puntero no se mueve.
1. **FIFO** saca la cargada hace más tiempo; **LRU**, la usada hace más tiempo.
2. **Clock:** desde el puntero, si U = 1 la baja a 0 y avanza; si U = 0, esa es la víctima.
3. **Clock mejorado:**
   - vuelta 1: busca (0,0) **sin tocar bits**, recorriendo todos los frames desde el puntero;
   - vuelta 2: busca (0,1) **bajando la U** de cada frame por el que pasa;
   - si no encontró, repite (ahora hay un (0,0) seguro).
4. **Entra la nueva** en el frame de la víctima con U = 1, y M = 1 solo si la referencia es escritura.
5. **El puntero** queda en el frame siguiente a la víctima.
6. **Accesos a disco por PF:** 1 lectura, más 1 escritura si la víctima tenía M = 1.

### De dónde sale cada valor

|                          |                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| U = 1 al entrar          | El hardware pone U = 1 cada vez que se usa la página, también cuando entra.              |
| la vuelta 1 no toca bits | Busca la víctima ideal (ni usada ni modificada) sin gastar segundas oportunidades.       |
| M no se baja             | M dice que la copia del disco quedó vieja; eso no cambia hasta que la página se escribe. |
| +1 acceso con M = 1      | Antes de pisar el frame hay que guardar la víctima en disco.                             |

### Ejemplo chico

Clock mejorado con 3 frames, puntero en F0. Estado: F0 A0 (1,0) · F1 A1 (0,1) · F2 A2 (1,1).

| Referencia | Qué pasa                                                                                   | Frames después (U,M)                    | Puntero | Disco                  |
| ---------- | ------------------------------------------------------------------------------------------ | --------------------------------------- | ------- | ---------------------- |
| A3 (L)     | PF. Vuelta 1 no encuentra (0,0). Vuelta 2: F0 (1,0) → U = 0 y sigue; F1 es (0,1): víctima. | F0 A0 (0,0) · F1 A3 (1,0) · F2 A2 (1,1) | F2      | 2 (escribe A1, lee A3) |
| A0 (E)     | Hit: U = 1 y M = 1; el puntero no se mueve.                                                | F0 A0 (1,1) · F1 A3 (1,0) · F2 A2 (1,1) | F2      | 0                      |

F2 queda igual en la primera referencia: la vuelta 2 encontró la víctima antes de llegar.
