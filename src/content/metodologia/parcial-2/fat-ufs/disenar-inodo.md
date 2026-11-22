---
titulo: Diseñar un inodo con requisitos
tema: parcial-2/fat-ufs
orden: 8
reconocer: da requisitos (accesos, tamaños, cantidad de punteros) y pide cuántos punteros de cada tipo
resumen: Te dan condiciones sobre el inodo; cada una decide una pieza del diseño.
trampas:
  - '**Verificá, no supongas:** "archivos de al menos S" se comprueba con la fórmula del archivo máximo.'
  - '**El byte X** se pasa a bloque (X div bloque) antes de ubicarlo en una zona.'
  - '**Pocos directos** hacen que el simple empiece antes: mirá que el byte pedido siga cayendo donde tiene que caer.'
teoria:
  - el-inodo
  - cuentas-en-ufs
---

### Receta

| Requisito                                              | Qué decide                                        |
| ------------------------------------------------------ | ------------------------------------------------- |
| "archivos de hasta N con la menor cantidad de accesos" | ceil(N / bloque) punteros **directos**            |
| "el byte X en ≤ 2 accesos"                             | el bloque de X cae en el **simple**               |
| "ningún byte en más de k accesos"                      | el nivel máximo: k = 3 deja usar hasta el doble   |
| "como máximo m punteros en el inodo"                   | la suma de todos                                  |
| "archivos de al menos S"                               | se **verifica** con la fórmula del archivo máximo |
| "FS teórico de T con bloque B"                         | se despejan los bits del puntero                  |

### De dónde sale cada valor

|                     |                                                                              |
| ------------------- | ---------------------------------------------------------------------------- |
| directos primero    | Un directo es 1 acceso: los archivos chicos se leen sin bloques de punteros. |
| nivel = accesos − 1 | Cada nivel de indirección agrega una lectura antes del dato.                 |

### Ejemplo chico

Bloques de 1 KiB, P = 256. Requisitos: archivos de hasta 12 KiB con la menor cantidad de accesos; el byte 200.000 en ≤ 2 accesos; ningún byte en más de 3; archivos de al menos 60 MiB.

```pasos
titulo: Un requisito, una pieza del inodo
pasos:
  - titulo: Hasta 12 KiB
    texto: 'Para leerlos con 1 acceso por bloque, todos sus bloques van en directos: 12 KiB / 1 KiB = **12 PD**.'
    tabla: { titulo: Inodo, columnas: [Punteros, Cubre bloques], filas: [['12 PD', '0 a 11']], marca: 0, foco: 0 }
    resultado: 12 PD
  - titulo: Byte 200.000
    texto: 'Está en el bloque 200.000 div 1024 = 195. Con 12 PD, el simple cubre del 12 al 267: cae ahí, **2 accesos**. Hace falta **1 IS**.'
    tabla: { titulo: Inodo, columnas: [Punteros, Cubre bloques], filas: [['12 PD', '0 a 11'], ['1 IS', '12 a 267']], marca: 1, foco: 1 }
    chequeo: { ok: true, texto: 'bloque 195 en el IS' }
    resultado: 1 IS
  - titulo: Máximo 3 accesos
    texto: 'El doble son 3 accesos y el triple 4: se puede usar hasta el **doble**, sin triple.'
    tabla: { titulo: Inodo, columnas: [Punteros, Cubre bloques], filas: [['12 PD', '0 a 11'], ['1 IS', '12 a 267'], ['1 ID', '268 a 65.803']], marca: 2, foco: 0 }
    resultado: 1 ID
  - titulo: Al menos 60 MiB
    texto: 'Se verifica con el archivo máximo: (12 + 256 + 65.536) × 1 KiB = 65.804 KiB ≈ 64,3 MiB. Alcanza.'
    grande: '65.804 KiB ≈ **64,3 MiB** ≥ 60 MiB'
    chequeo: { ok: true, texto: '12 PD + 1 IS + 1 ID alcanza' }
```
