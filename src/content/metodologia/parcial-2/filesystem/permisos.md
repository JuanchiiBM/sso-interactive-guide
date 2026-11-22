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

| Pregunta               | Terna                                    | Respuesta                                                           |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| ¿Luis lee notas.txt?   | grupo: `r-x` en /tp, `rw-` en el archivo | **Sí**: tiene x en /tp y r en el archivo                            |
| ¿Luis borra notas.txt? | grupo en /tp: `r-x`                      | **No**: le falta w en /tp                                           |
| ¿Eva lee notas.txt?    | otros en /tp: `---`                      | **No**: no puede entrar a /tp, aunque el archivo tenga r para otros |
