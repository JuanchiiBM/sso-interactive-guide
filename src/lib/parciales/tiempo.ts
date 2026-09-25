/** `mm:ss`, o `h:mm:ss` desde la hora. */
export function formatearTiempo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const dos = (n: number) => String(n).padStart(2, '0')
  const mmss = `${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}`
  return h ? `${h}:${mmss}` : mmss
}
