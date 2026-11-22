---
titulo: Hard links y soft links
tema: parcial-2/fat-ufs
orden: 9
reconocer: crea hard links o soft links, borra nombres y pregunta qué queda o cuántos inodos hay
resumen: Te dan operaciones ln, ln -s y rm; te piden el contador de cada inodo y qué archivo sigue existiendo.
trampas:
  - '**Un hard link con otro nombre** es el mismo archivo: para borrarlo hay que borrar todos los nombres con ese inodo.'
  - '**El soft link no suma** al contador del original.'
  - '**El hard link no cruza volúmenes**; el soft link sí, y puede quedar colgado.'
teoria:
  - links-hard-y-soft
  - directorios
---

### Receta

1. **Inodo = el archivo**; **entrada de directorio = un nombre** que apunta a un inodo.
2. **Hard link:** otra entrada al **mismo inodo**. El contador sube 1 y no se distingue del original.
3. **Soft link:** un **inodo propio**, de tipo soft link, cuyo bloque guarda **la ruta**.
4. **rm** borra una entrada y baja 1 el contador. El archivo se libera cuando el contador llega a 0.

### De dónde sale cada valor

|                    |                                                                                |
| ------------------ | ------------------------------------------------------------------------------ |
| contador de links  | Cuenta las entradas que apuntan al inodo; con 0 nadie lo puede nombrar.        |
| soft link colgado  | Guarda una ruta, no un inodo: si la ruta deja de existir, no lleva a nada.     |
| no cruza volúmenes | Los números de inodo son de cada volumen: en otro, ese número es otro archivo. |

Analogía: el inodo es la persona; cada entrada de directorio, un contacto en la agenda; el soft link, un papelito con la dirección.

### Ejemplo chico

```links
titulo: Links de /tp/notas.txt
inicial: [{ ruta: /tp/notas.txt, inodo: 7 }]
operaciones:
  - { ln: /tp/notas.txt, a: /tp/copia.txt }
  - { lns: /tp/notas.txt, a: /tp/acceso.txt, inodo: 9 }
  - { rm: /tp/notas.txt }
```
