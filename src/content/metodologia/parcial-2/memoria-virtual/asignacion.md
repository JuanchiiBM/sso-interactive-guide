---
titulo: Asignación y sustitución
tema: parcial-2/memoria-virtual
orden: 5
reconocer: da una secuencia con PF y pregunta qué asignación y qué sustitución usa, o cuántos frames tiene el proceso
resumen: Te dan cómo se comporta un proceso; te piden si la asignación es fija o variable, si el reemplazo es local o global y su cupo.
trampas:
  - '**Fija + global no es posible:** robarle a otro proceso cambia los cupos.'
  - '**"Reemplaza aunque hay frames libres"** solo se explica con un tope: es fija (y por lo tanto local).'
  - '**Mala performance con cualquier algoritmo** es un tema de localidad, no del algoritmo.'
teoria:
  - conjunto-residente
  - eficiencia-y-localidad
---

### Receta

1. **Fija** = el cupo de frames es constante; **variable** = crece y se achica.
2. **Local** = la víctima es del mismo proceso; **global** = puede ser de cualquiera.
3. **¿Reemplaza con frames libres?** Entonces tiene un tope: es fija, y por lo tanto local.
4. **Cupo** = las páginas que tenía justo antes del primer reemplazo.
5. **Peor caso:** un proceso que usa en ciclo **cupo + 1** páginas falla siempre, con cualquier algoritmo.

### De dónde sale cada valor

|                          |                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------- |
| fija → local             | Si la víctima fuera de otro, uno ganaría un frame y el otro lo perdería.           |
| cupo antes del reemplazo | Mientras no llega al tope, cada PF suma un frame; al llegar, empieza a reemplazar. |
| cupo + 1                 | Siempre hay una página afuera, y es la próxima que se pide.                        |

### Ejemplo chico

Un proceso arranca con 2 páginas en RAM y hay frames libres todo el tiempo.

```pasos
titulo: ¿Fija o variable? ¿Local o global?
pasos:
  - titulo: Arranque
    texto: 'El proceso tiene 2 páginas en RAM.'
    tabla: { titulo: Frames del proceso, columnas: [Frame, Página], filas: [[F4, P0], [F7, P1]] }
  - titulo: PF sin reemplazo
    texto: 'Page fault y entra en un frame libre: todavía no llegó a su tope.'
    tabla: { titulo: Frames del proceso, columnas: [Frame, Página], filas: [[F4, P0], [F7, P1], [F2, P2]], marca: 2 }
    resultado: 3 frames
  - titulo: PF sin reemplazo
    texto: 'Otro page fault, otro frame libre: ya tiene **4**.'
    tabla: { titulo: Frames del proceso, columnas: [Frame, Página], filas: [[F4, P0], [F7, P1], [F2, P2], [F9, P3]], marca: 3 }
    resultado: 4 frames
  - titulo: PF que reemplaza
    texto: 'El siguiente PF **reemplaza aunque hay frames libres**: solo se explica con un tope. Es **fija**, con cupo **4**, y por lo tanto **local**.'
    tabla: { titulo: Frames del proceso, columnas: [Frame, Página], filas: [[F4, P4], [F7, P1], [F2, P2], [F9, P3]], marca: 0, foco: 1 }
    chequeo: { ok: false, texto: 'reemplaza con frames libres' }
    grande: 'fija · cupo **4** · local'
  - titulo: Peor caso
    texto: 'Si recorre en ciclo **5** páginas (cupo + 1), siempre hay una afuera y es la próxima que pide: falla en todas las referencias. Es un problema de localidad.'
    grande: 'ciclo de **5** páginas → PF siempre'
```
