Diagramas fijos (```diagrama <id>) por tema: cada `.ts` exporta `diagramas: Record<id, () => string>`
y `../index.ts` los junta solo. No importar `../index` desde acá (import circular).
