/** Cada `traza:` de los ejercicios se puede resolver; con TRAZA_RESUMEN=1 imprime PF, disco y estado final. */
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { trazaDesdeYaml, trazaEsperada } from './traza'

const casos = globSync('src/content/ejercicios/**/*.md').flatMap((archivo) => {
  const fm = readFileSync(archivo, 'utf8').split(/^---$/m)[1]
  const data = parse(fm, { merge: true }) as { calculos?: { traza?: Record<string, unknown> }[] }
  return (data.calculos ?? []).flatMap((c, i) =>
    c.traza
      ? [{ nombre: `${archivo.replace(/\\/g, '/')} · calculo ${i}`, spec: trazaDesdeYaml(c.traza) }]
      : [],
  )
})

describe('trazas de los ejercicios', () => {
  it.each(casos)('$nombre', ({ nombre, spec }) => {
    for (const alg of spec.algoritmos) {
      const t = trazaEsperada(spec, alg)
      expect(t).toHaveLength(spec.referencias.length)
      if (process.env.TRAZA_RESUMEN) {
        const pf = t.filter((c) => c.resultado === 'pf').length
        const disco = t.filter((c) => c.disco).length
        const fin = t.at(-1)!
        console.log(
          `${nombre} · ${alg}: ${pf} PF, ${disco} a disco · final [${fin.paginas.map((p) => p ?? '-').join(', ')}] puntero ${fin.puntero}`,
        )
      }
    }
  })
})
