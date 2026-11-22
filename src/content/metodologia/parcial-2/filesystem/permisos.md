---
titulo: Permisos rwx
tema: parcial-2/filesystem
orden: 2
reconocer: da permisos rwx de archivos y directorios y pregunta si un usuario puede leer, entrar o borrar
resumen: Te dan los permisos y el usuario; te piden qué puede hacer y por qué.
trampas:
  - '**Una sola terna:** si entrás por el grupo, mirás solo la del grupo; no la de otros ni la tuya "en general".'
  - '**Los permisos de adentro no te dejan entrar:** para llegar a un archivo hace falta x en cada directorio del camino.'
  - '**Borrar no mira el archivo:** borrar o crear es modificar el directorio; hace falta w (y x) en el directorio.'
teoria:
  - protección
  - formas-de-guardar-los-permisos
---

### Receta

1. **¿Quién sos respecto del archivo?** Dueño, **grupo del archivo** u otros.
2. **Usá solo esa terna.**
3. **Entrar** a un directorio pide **x** del directorio; **listarlo**, **r**.
4. **Borrar o crear** un archivo pide **w y x en el directorio**, no en el archivo.

### De dónde sale cada valor

|                  |                                                                                  |
| ---------------- | -------------------------------------------------------------------------------- |
| una terna        | El SO elige la terna una vez: primero dueño, después grupo, si no otros.         |
| x del directorio | Atravesar un directorio es buscar el nombre en sus entradas.                     |
| w del directorio | Borrar un archivo es sacar su entrada del directorio, que es lo que se modifica. |

### Ejemplo chico

`drwxr-x--- ana sistemas /tp` y `-rw-rw-r-- ana sistemas /tp/notas.txt`. Luis está en el grupo `sistemas`; Eva, no.

```pasos
titulo: Permisos de Luis y Eva sobre /tp/notas.txt
pasos:
  - titulo: ¿Quién sos?
    texto: 'Luis entra por el **grupo** del archivo (sistemas); Eva, por **otros**. Cada uno mira solo su terna.'
    tabla:
      titulo: Ternas
      columnas: [Usuario, Terna, /tp, notas.txt]
      filas: [[Luis, grupo, r-x, rw-], [Eva, otros, '---', r--]]
  - titulo: ¿Luis lee?
    texto: 'Para llegar al archivo necesita **x** en /tp (la tiene) y para leerlo, **r** en notas.txt (la tiene). **Sí** puede.'
    tabla:
      titulo: Camino de Luis (grupo)
      columnas: [Paso, Pide, Tiene]
      filas: [['entrar a /tp', x, r-x], ['leer notas.txt', r, rw-]]
      marca: [0, 1]
    chequeo: { ok: true, texto: 'x en /tp y r en el archivo' }
  - titulo: ¿Luis borra?
    texto: 'Borrar es sacar la entrada del directorio: pide **w en /tp**, no en el archivo. El grupo tiene r-x: **no** puede.'
    tabla:
      titulo: Camino de Luis (grupo)
      columnas: [Paso, Pide, Tiene]
      filas: [['borrar en /tp', 'w y x', r-x]]
      marca: 0
      foco: 2
    chequeo: { ok: false, texto: 'falta w en /tp' }
  - titulo: ¿Eva lee?
    texto: 'Para otros, /tp es ---: ni siquiera puede entrar. **No** lee, aunque notas.txt tenga r para otros.'
    tabla:
      titulo: Camino de Eva (otros)
      columnas: [Paso, Pide, Tiene]
      filas: [['entrar a /tp', x, '---'], ['leer notas.txt', r, r--]]
      marca: 0
      foco: 2
    chequeo: { ok: false, texto: 'sin x en /tp no llega' }
```
