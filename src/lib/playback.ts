/**
 * Motor de reproducción paso a paso (JS plano), derivado de alg0.dev.
 * Cada simulador produce `Step<S>[]`; el motor solo sabe avanzar/retroceder/reproducir.
 */

export const SPEED_MS: Record<number, number> = { 1: 1600, 2: 900, 3: 500, 4: 220, 5: 80 }
export const SPEED_LABELS: Record<number, string> = {
  1: '0.5×',
  2: '1×',
  3: '2×',
  4: '4×',
  5: '8×',
}

export interface Step<S = unknown> {
  /** Estado completo a pintar en este paso (inmutable). */
  state: S
  /** Explicación en lenguaje de cátedra de qué pasó en este paso. */
  descripcion: string
}

export interface PlaybackSnapshot<S> {
  steps: Step<S>[]
  current: number
  isPlaying: boolean
  speed: number
  step: Step<S> | null
}

export interface Playback<S> {
  subscribe: (listener: (snap: PlaybackSnapshot<S>) => void) => () => void
  getSnapshot: () => PlaybackSnapshot<S>
  setSteps: (steps: Step<S>[]) => void
  forward: () => void
  backward: () => void
  goTo: (index: number) => void
  togglePlay: () => void
  setSpeed: (speed: number) => void
  dispose: () => void
}

export function createPlayback<S>(initial: Step<S>[] = []): Playback<S> {
  let steps = initial
  let current = 0
  let isPlaying = false
  let speed = 2
  let timer: ReturnType<typeof setInterval> | null = null
  const listeners = new Set<(snap: PlaybackSnapshot<S>) => void>()

  const snapshot = (): PlaybackSnapshot<S> => ({
    steps,
    current,
    isPlaying,
    speed,
    step: steps[current] ?? null,
  })

  const emit = () => {
    const snap = snapshot()
    for (const l of listeners) l(snap)
  }

  const stopTimer = () => {
    if (timer != null) clearInterval(timer)
    timer = null
  }

  const syncTimer = () => {
    stopTimer()
    if (!isPlaying || steps.length === 0) return
    timer = setInterval(() => {
      if (current >= steps.length - 1) {
        isPlaying = false
        stopTimer()
      } else {
        current += 1
      }
      emit()
    }, SPEED_MS[speed] ?? 500)
  }

  const goTo = (index: number) => {
    current = Math.max(0, Math.min(index, steps.length - 1))
    emit()
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      listener(snapshot())
      return () => listeners.delete(listener)
    },
    getSnapshot: snapshot,
    setSteps(next) {
      steps = next
      current = 0
      isPlaying = false
      syncTimer()
      emit()
    },
    forward: () => goTo(current + 1),
    backward: () => goTo(current - 1),
    goTo,
    togglePlay() {
      if (steps.length === 0) return
      if (current >= steps.length - 1) current = 0
      isPlaying = !isPlaying
      syncTimer()
      emit()
    },
    setSpeed(next) {
      speed = next
      syncTimer()
      emit()
    },
    dispose() {
      stopTimer()
      listeners.clear()
    },
  }
}
