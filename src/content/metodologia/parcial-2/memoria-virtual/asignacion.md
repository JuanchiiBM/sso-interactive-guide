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

Un proceso arranca con 2 páginas en RAM. Hay frames libres todo el tiempo.

| Evento            | Páginas en RAM | Qué dice                                                                |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| PF, sin reemplazo | 3              | todavía no llegó al tope                                                |
| PF, sin reemplazo | 4              | todavía no llegó al tope                                                |
| PF, **reemplaza** | 4              | hay frames libres y reemplaza: es **fija**, con cupo **4**, y **local** |

Si ese proceso recorre en ciclo **5** páginas, falla en todas las referencias.
