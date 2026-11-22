---
titulo: Reconstruir la tabla de segmentos
tema: parcial-2/memoria-real
orden: 5
reconocer: 'da pares "DL → DF", "última dirección válida" o "al final de la memoria" y pide la tabla'
resumen: Te dan pistas sueltas de traducciones; te piden la base y el tamaño de cada segmento.
trampas:
  - '**Segmentación pura no tiene páginas:** la DL es `| seg | offset |`.'
  - '**No confundas fin con tamaño:** el fin es base + tamaño.'
  - '**Acarreo en hexa:** D000h + 3000h = **10000h**, no F000h.'
  - '**El primer dígito no se tira entero:** los bits que no son de segmento siguen siendo offset.'
teoria:
  - traducción-inversa-reconstruir-la-tabla
  - deducir-cuántos-bits-son-de-segmento
---

### Receta

1. **Bits de segmento**, si no los dan: tomá una DL de segmento conocido, pasá el primer dígito a binario y mirá cuántos bits de arriba hacen falta para leer ese número. Verificalo con las otras DL.
2. **Cortá cada DL** en `| seg | offset |`.
3. **Aplicá la pista:**
   - "DL x → DF y": **base = DF − offset**;
   - "última dirección válida": **tamaño = offset + 1**;
   - "al final de la memoria": **tamaño = fin de la memoria − base**.
4. **Sumá y restá en hexa** con cuidado del acarreo.

### De dónde sale cada valor

|                       |                                                                               |
| --------------------- | ----------------------------------------------------------------------------- |
| `base = DF − offset`  | La MMU hace DF = base + offset; se despeja la base.                           |
| `tamaño = offset + 1` | El offset cuenta desde 0: si la última válida tiene offset 2FFFh, mide 3000h. |
| `tamaño = fin − base` | El segmento termina justo donde termina la memoria (64 KiB = 10000h).         |

### Ejemplo chico

16 bits: 2 de segmento y 14 de offset; memoria de 64 KiB. La DL `4A00h` da la DF `C200h`, y la última dirección válida del mismo segmento es `6FFFh`.

```traduccion
sentido: pasos
titulo: Base y tamaño del segmento 1
bitsSegmento: 2
bitsOffset: 14
pistas:
  - { dl: 0x4A00, df: 0xC200 }
  - { ultima: 0x6FFF }
```
