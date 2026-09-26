import { describe, expect, it } from 'vitest'
import { DIAGRAMAS } from './index'

describe.each(Object.keys(DIAGRAMAS))('diagrama fijo %s', (id) => {
  it('genera un SVG con título accesible', () => {
    const html = DIAGRAMAS[id]()
    expect(html).toMatch(/^<figure class="diagrama[^"]*">/)
    expect(html).toMatch(/<svg [^>]*role="img" aria-label="[^"]+"/)
    expect(html).not.toMatch(/style="/)
  })
})
