---
titulo: Métodos de asignación
tema: parcial-2/filesystem
orden: 3
reconocer: pide elegir o comparar asignación contigua, encadenada o indexada para un caso
resumen: Te dan cómo se usan los archivos; te piden qué método conviene y qué fragmentación tiene.
trampas:
  - '**Contigua es la de fragmentación externa:** las tres tienen interna en el último bloque.'
  - '**Encadenada no sirve para acceso directo:** para llegar al bloque k hay que leer los k anteriores.'
  - '**FAT es encadenada** con la tabla aparte; **ext2 es indexada** con indirecciones.'
teoria:
  - métodos-de-asignación
  - contigua
  - encadenada-enlazada
  - indexada
---

### Receta

1. **¿Los archivos crecen?** Contigua sufre: sin el bloque siguiente libre, hay que mover el archivo.
2. **¿Se lee una parte del medio?** Hace falta acceso directo: contigua o indexada.
3. **¿Hay mucho espacio libre suelto?** Contigua tiene fragmentación externa; encadenada e indexada, no.
4. **Justificá con el caso del enunciado**, no en abstracto.

### De dónde sale cada valor

| Método     | Fragmentación               | Acceso directo                 | Cuándo conviene                             |
| ---------- | --------------------------- | ------------------------------ | ------------------------------------------- |
| Contigua   | externa (hay que compactar) | sí: bloque inicial + k         | archivos grandes que ya existen y no crecen |
| Encadenada | interna                     | no: hay que recorrer la cadena | archivos que se leen enteros y en orden     |
| Indexada   | interna                     | sí: una entrada del índice     | archivos que crecen y se leen por partes    |

### Ejemplo chico

Un disco guarda videos grandes que no cambian y se ven salteando partes.

- **Contigua:** el bloque k está en inicial + k, así que saltar es una cuenta; como los videos no crecen, la fragmentación externa casi no aparece. **Conviene.**
- **Encadenada:** para saltar al minuto 40 hay que recorrer todos los bloques anteriores. **No conviene.**
- **Indexada:** también salta directo, pero gasta bloques de índice que acá no hacen falta.
