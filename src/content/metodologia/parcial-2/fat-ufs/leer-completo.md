---
titulo: Leer el archivo completo en ext2
tema: parcial-2/fat-ufs
orden: 6
reconocer: pide cuántos bloques ocupa un archivo o cuántos accesos hacen falta para leerlo entero
resumen: Te dan el tamaño del archivo; te piden bloques de datos más bloques de punteros.
trampas:
  - '**Contar solo hojas:** las cajas (bloques de punteros) también ocupan y se leen.'
  - '**Contar solo las cajas del último nivel:** el doble tiene además la caja grande.'
  - '**Redondear para abajo:** una caja con un solo puntero usado igual se lee.'
teoria:
  - cuentas-en-ufs
  - leer-el-byte-n-de-un-archivo
---

### Receta

1. **Hojas** = tamaño del archivo / tamaño de bloque.
2. **Llená las zonas en orden** (PD, IS, ID, IT) hasta agotar las hojas.
3. **Cajas por zona, de abajo para arriba**, redondeando para arriba:
   - cajas de último nivel = hojas de la zona / P;
   - nivel de arriba = esas cajas / P;
   - … hasta llegar a 1.
4. **Total** = hojas + cajas.

### De dónde sale cada valor

| Te preguntan                            | Contás                                            |
| --------------------------------------- | ------------------------------------------------- |
| Tamaño máximo de archivo                | solo hojas                                        |
| Leer el archivo completo o lo que ocupa | hojas + **todas** las cajas                       |
| Leer un rango de bytes                  | hojas del rango + las cajas de las zonas que toca |
| Leer un byte                            | un solo camino                                    |

### Ejemplo chico

Archivo de 1 MiB, bloques de 1 KiB, P = 256, inodo con 10 PD + IS + ID. Hojas = 1 MiB / 1 KiB = 1024.

```inodo
titulo: Leer el archivo de 1 MiB entero
bloque: 1024
puntero: 4
punteros: { directos: 10, simples: 1, dobles: 1 }
bloques: [0, 1023]
```

PD 10 hojas; IS 256 hojas y 1 caja; ID las 758 que faltan: 758 / 256 = 2,96 → 3 cajas chicas + 1 grande. Total = 1024 + 1 + 4 = **1029**.
