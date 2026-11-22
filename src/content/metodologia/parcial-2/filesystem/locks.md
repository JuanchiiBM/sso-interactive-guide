---
titulo: Locks con procesos y planificación
tema: parcial-2/filesystem
orden: 1
reconocer: da código con open, lock, read, write y print de varios procesos con RR, y pide qué imprime cada uno
resumen: Te dan el código de cada proceso y el tipo de cerrojo; te piden la salida y quién se bloquea.
trampas:
  - '**Imprimir el valor inicial de var** cuando el read funcionó: el read lo pisa.'
  - '**Soltar el lock por clock:** el lock se suelta solo con unlock; el proceso vuelve a Ready con el lock tomado.'
  - '**Con sugerido**, el que no pide el lock lee igual; **con obligatorio**, el SO rechaza la operación.'
teoria:
  - locks-cerrojos
  - puede-entrar-un-segundo-proceso
---

### Receta

1. **Seguí var:** si el `read` funciona, pisa el valor inicial; el inicial se imprime solo si el read falla.
2. **Mirá dónde corta el clock:** si es antes del `unlock`, el proceso vuelve a Ready **con el lock tomado**.
3. **Compartido** (lectura) convive con otros lectores; **exclusivo** (escritura) espera a que no haya nadie.
4. **Sugerido** solo frena a quien también pide el lock; **obligatorio** lo impone el SO, lo pida o no.
5. **Syscall rechazada:** si no es bloqueante, devuelve error y el proceso sigue; si es bloqueante, se duerme.

### De dónde sale cada valor

|                           |                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------- |
| el read pisa var          | `read(f, var)` copia el contenido del archivo en var.                            |
| el lock sigue tomado      | El clock saca al proceso de la CPU, pero no ejecuta su unlock.                   |
| sugerido no frena a todos | Es un acuerdo entre procesos: el que no pide el lock no se entera de que existe. |

### Ejemplo chico

Lock **sugerido**, modo **compartido**, RR con el clock después de cada `print`. El archivo dice `Z`.

```locks
titulo: Lock sugerido con un escritor y un lector sin lock
cerrojo: sugerido
modo: compartido
archivo: { nombre: f, contenido: Z }
procesos:
  - { nombre: P1, codigo: ["open(f, read)", "var = '-'", "lock(f)", "read(f, var)", "print(var)", "unlock(f)"] }
  - { nombre: P2, codigo: ["open(f, write)", "var = 'X'", "lock(f)", "write(f, var)", "print(var)", "unlock(f)"] }
  - { nombre: P3, codigo: ["open(f, read)", "var = '-'", "read(f, var)", "print(var)"] }
```
