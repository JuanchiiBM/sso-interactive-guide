/** Diagramas fijos del tema Arquitectura. */
import { flecha, marco, texto } from '../svg'

// niveles de la tabla de la teoría, de arriba (más rápido) hacia abajo (más grande)
const NIVELES = [
  { nombre: 'Registros', ejemplo: 'dentro de la CPU', volatil: true },
  { nombre: 'Caché', ejemplo: 'L1 · L2 · L3', volatil: true },
  { nombre: 'Memoria principal', ejemplo: 'RAM', volatil: true },
  { nombre: 'Almacenamiento secundario', ejemplo: 'disco, SSD', volatil: false },
  { nombre: 'Almacenamiento terciario', ejemplo: 'cintas, ópticos', volatil: false },
]

function jerarquiaMemoria(): string {
  const cx = 360
  const y0 = 40
  const alto = 58
  const mitad = (y: number) => (80 + ((y - y0) * 400) / 290) / 2
  const niveles = NIVELES.map((n, i) => {
    const a = y0 + i * alto
    const b = a + alto - 4
    const d = `M${cx - mitad(a)},${a} L${cx + mitad(a)},${a} L${cx + mitad(b)},${b} L${cx - mitad(b)},${b} z`
    const m = (a + b) / 2
    return (
      `<g class="t3s-nivel ${n.volatil ? 't3s-volatil' : 't3s-persistente'}"><path d="${d}"/>` +
      texto(cx, m - 8, n.nombre) +
      texto(cx, m + 10, n.ejemplo, { clase: 'rp-sub' }) +
      `</g>`
    )
  })
  const corte = y0 + 3 * alto - 2
  return marco({
    ancho: 720,
    alto: 380,
    titulo:
      'Jerarquía de memoria: arriba lo más rápido y caro por byte, abajo lo más grande; la RAM y lo de arriba son volátiles',
    cuerpo: [
      ...niveles,
      `<line class="t3s-corte" x1="60" y1="${corte}" x2="662" y2="${corte}"/>`,
      texto(655, corte - 12, 'volátil', { clase: 't3s-nota t3s-der t3s-clave' }),
      texto(655, corte + 14, 'no volátil', { clase: 't3s-nota t3s-der t3s-clave' }),
      flecha('M40,330 L40,46'),
      flecha('M684,44 L684,328'),
      `<text class="t3s-eje" x="24" y="188" transform="rotate(-90 24 188)">más rápida · más cara por byte</text>`,
      `<text class="t3s-eje" x="700" y="188" transform="rotate(90 700 188)">más grande · más barata por byte</text>`,
      texto(360, 360, 'Volátil: se pierde al cortar la energía. No volátil: se conserva.', {
        clase: 't3s-pie',
      }),
    ],
  })
}

export const diagramas: Record<string, () => string> = {
  'jerarquia-memoria': jerarquiaMemoria,
}
