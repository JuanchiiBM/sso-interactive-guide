import { describe, expect, it } from 'vitest'
import { arista, atributosEl, bloque, insignia, nodo, tarjeta } from './primitivas-procesos'

describe('primitivas de procesos', () => {
  it('la marca de oculto va justo después del data-el, y sin data-el no hay marca', () => {
    expect(atributosEl({ el: 'b', oculto: true })).toBe(' data-el="b" data-rc-oculto')
    expect(atributosEl({ oculto: true })).toBe('')
    expect(nodo(0, 0, 10, 10, 'B', 'PID 1', { el: 'b', oculto: true })).toContain(
      'data-el="b" data-rc-oculto',
    )
  })

  it('nodo y tarjeta exponen sus líneas cambiantes con data-val y escapan el texto', () => {
    expect(nodo(0, 0, 10, 10, '<A>', 'x', { val: 'pid-a' })).toMatch(/data-val="pid-a">x</)
    expect(nodo(0, 0, 10, 10, '<A>', 'x')).toContain('&lt;A&gt;')
    const t = tarjeta(0, 0, 10, 10, 'PCB', [{ t: 'a', val: 'va' }, { t: 'b' }])
    expect(t).toContain('data-val="va"')
    expect(t.match(/class="rp-sub"/g)).toHaveLength(2)
  })

  it('la arista lleva punta solo si se pide (el cliente la cambia al resaltar)', () => {
    expect(arista('M0,0 L1,1')).not.toContain('marker-end')
    expect(arista('M0,0 L1,1', { punta: true, etiqueta: 'x' })).toContain(
      'marker-end="url(#dg-punta)"',
    )
  })

  it('bloque e insignia se ubican por atributos', () => {
    expect(bloque(10, 50, 100, 20, 'P1')).toContain('x="10" y="40" width="100"')
    expect(insignia(50, 50, 'Z')).toContain('width="18"')
  })
})
