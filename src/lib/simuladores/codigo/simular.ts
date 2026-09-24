/** Gantt de código: planificador + sentencias con duración + semáforos/recursos. Ver docs/brain/simuladores/Simulador de Gantt de Código.md */
import type {
  EstadoProceso,
  MetricasProceso,
  ResultadoPlanificacion,
  Tick,
} from '../planificacion/tipos'
import type { ConfigCodigo, ProgramaCodigo, Sentencia } from './tipos'

const MAX_TICKS = 400
const RE_CICLO = /^while\s*\(\s*(true|1)\s*\)\s*\{?$/i

export function parsearCodigo(codigo: string, config: ConfigCodigo): ProgramaCodigo {
  const sentencias: Sentencia[] = []
  let inicioCiclo: number | null = null
  const porDefecto = config.duracion ?? 1
  for (const cruda of codigo.split('\n')) {
    const m = cruda.match(/^(.*?)(?:\/\/\s*(\d+)[^\n]*)?$/)!
    const linea = m[1].trim().replace(/;$/, '').trim()
    const duracion = m[2] != null ? Number(m[2]) : undefined
    if (!linea || linea === '{' || linea === '}') continue
    if (RE_CICLO.test(linea)) {
      inicioCiclo = sentencias.length
      continue
    }
    let s: RegExpMatchArray | null
    if ((s = linea.match(/^(wait|signal)\s*\(\s*(\w+)\s*\)$/i))) {
      const tipo = s[1].toLowerCase() as 'wait' | 'signal'
      sentencias.push({ tipo, sem: s[2], texto: linea, duracion: duracion ?? porDefecto })
    } else if ((s = linea.match(/^(get|release)\s*\(\s*(\w+)\s*\)$/i))) {
      const tipo = s[1].toLowerCase() as 'get' | 'release'
      sentencias.push({ tipo, recurso: s[2], texto: linea, duracion: duracion ?? porDefecto })
    } else if ((s = linea.match(/^sleep\s*\(\s*(\d+)/i))) {
      sentencias.push({
        tipo: 'sleep',
        bloqueo: Number(s[1]),
        texto: linea,
        duracion: duracion ?? 0,
      })
    } else if (config.detector && linea === config.detector.sentencia) {
      sentencias.push({ tipo: 'detectar', texto: linea, duracion: duracion ?? porDefecto })
    } else {
      sentencias.push({ tipo: 'accion', texto: linea, duracion: duracion ?? porDefecto })
    }
  }
  return { sentencias, inicioCiclo }
}

interface Proc {
  id: string
  llegada: number
  prioridad: number
  programa: ProgramaCodigo
  pc: number
  /** Unidades que le faltan a la sentencia actual. */
  resta: number
  estado: EstadoProceso
  /** Hasta cuándo duerme (sleep). */
  despierta?: number
  bloqueoEn?: string
  fin?: number
  primeraCpu?: number
  espera: number
}

const ATOMICAS = new Set(['wait', 'signal', 'get', 'release'])

export function simularCodigo(config: ConfigCodigo): ResultadoPlanificacion {
  const procs: Proc[] = config.procesos.map((p) => {
    const programa = parsearCodigo(p.codigo, config)
    return {
      id: p.id,
      llegada: p.llegada,
      prioridad: p.prioridad ?? 0,
      programa,
      pc: 0,
      resta: programa.sentencias[0]?.duracion ?? 0,
      estado: 'nuevo',
      espera: 0,
    }
  })
  const porId = new Map(procs.map((p) => [p.id, p]))
  const sems = new Map(
    Object.entries(config.semaforos ?? {}).map(([n, v]) => [n, { valor: v, cola: [] as string[] }]),
  )
  const recs = new Map(
    Object.entries(config.recursos ?? {}).map(([n, v]) => [
      n,
      { libres: v, duenos: [] as string[], cola: [] as string[] },
    ]),
  )
  const listos: string[] = []
  const ticks: Tick[] = []
  let corriendo: Proc | null = null
  let quantumUsado = 0
  /** Despertados por fin de sleep en este instante: entran a Listos después del desalojado por clock. */
  let despertados: string[] = []
  let eventos: string[] = []

  const sentencia = (p: Proc): Sentencia | undefined => p.programa.sentencias[p.pc]
  const enAtomica = (p: Proc) => {
    const s = sentencia(p)
    return !!config.atomicas && !!s && ATOMICAS.has(s.tipo) && p.resta > 0 && p.resta < s.duracion
  }

  /** Pasa a la sentencia siguiente (o termina) y resuelve las de duración 0. */
  function avanzar(p: Proc, t: number) {
    p.pc++
    const { sentencias, inicioCiclo } = p.programa
    if (p.pc >= sentencias.length) {
      if (inicioCiclo == null) {
        p.estado = 'fin'
        p.fin = t
        eventos.push(`${p.id} termina.`)
        return
      }
      p.pc = inicioCiclo
    }
    p.resta = sentencias[p.pc].duracion
    if (p.resta === 0) completar(p, t)
  }

  // un signal/release es una syscall del que ejecuta: termina antes del clock, así que el
  // despertado entra a Listos antes que el desalojado por fin de quantum (1R 1C2026 TM, t=13)
  function despertar(id: string, porTimer = false) {
    const q = porId.get(id)!
    q.estado = 'listo'
    q.bloqueoEn = undefined
    ;(porTimer ? despertados : listos).push(id)
  }

  /** Efecto de la sentencia al terminar de ejecutarla (la condición del wait/get se evalúa acá). */
  function completar(p: Proc, t: number) {
    const s = sentencia(p)!
    if (s.tipo === 'wait') {
      const sem = sems.get(s.sem)!
      if (sem.valor > 0) {
        sem.valor--
      } else {
        sem.cola.push(p.id)
        bloquear(p, `${s.sem}`)
        eventos.push(`${p.id} termina ${s.texto} con ${s.sem} = 0: se bloquea.`)
        p.pc++ // al despertar ya tiene el semáforo: sigue con la próxima sentencia
        normalizarPc(p)
        return
      }
    } else if (s.tipo === 'signal') {
      const sem = sems.get(s.sem)!
      const sig = sem.cola.shift()
      if (sig) {
        despertar(sig)
        eventos.push(`${p.id} hace ${s.texto}: despierta a ${sig}.`)
      } else sem.valor++
    } else if (s.tipo === 'get') {
      const r = recs.get(s.recurso)!
      if (r.libres > 0) {
        r.libres--
        r.duenos.push(p.id)
      } else {
        r.cola.push(p.id)
        bloquear(p, s.recurso)
        eventos.push(`${p.id} termina ${s.texto} con ${s.recurso} ocupado: se bloquea.`)
        p.pc++
        normalizarPc(p)
        return
      }
    } else if (s.tipo === 'release') {
      liberar(p, s.recurso)
    } else if (s.tipo === 'sleep') {
      if (s.bloqueo > 0) {
        p.despierta = t + s.bloqueo
        bloquear(p, 'sleep')
        eventos.push(`${p.id} hace ${s.texto}: bloqueado hasta t=${p.despierta}.`)
        p.pc++
        normalizarPc(p)
        return
      }
    } else if (s.tipo === 'detectar') {
      detectar(t)
    }
    avanzar(p, t)
  }

  /** Tras bloquearse ya avanzó el pc: acomodar ciclo/fin sin ejecutar nada. */
  function normalizarPc(p: Proc) {
    const { sentencias, inicioCiclo } = p.programa
    if (p.pc >= sentencias.length) p.pc = inicioCiclo ?? sentencias.length
    p.resta = sentencias[p.pc]?.duracion ?? 0
  }

  function bloquear(p: Proc, en: string) {
    p.estado = 'bloqueado'
    p.bloqueoEn = en
    if (corriendo === p) corriendo = null
  }

  function liberar(p: Proc, recurso: string) {
    const r = recs.get(recurso)!
    const i = r.duenos.indexOf(p.id)
    if (i >= 0) r.duenos.splice(i, 1)
    const sig = r.cola.shift()
    if (sig) {
      r.duenos.push(sig)
      despertar(sig)
      eventos.push(`${p.id} libera ${recurso}: se lo asigna a ${sig}.`)
    } else r.libres++
  }

  /** Tiempo de CPU que le falta (ciclo infinito = Infinity). */
  function restante(p: Proc): number {
    const { sentencias, inicioCiclo } = p.programa
    if (inicioCiclo != null) return Infinity
    return (
      sentencias.slice(p.pc).reduce((a, s) => a + s.duracion, 0) -
      (sentencias[p.pc] ? sentencias[p.pc].duracion - p.resta : 0)
    )
  }

  function detectar(t: number) {
    // espera circular entre procesos bloqueados en recursos con dueño
    const espera = (p: Proc) => {
      if (p.estado !== 'bloqueado' || !p.bloqueoEn || !recs.has(p.bloqueoEn)) return []
      return recs.get(p.bloqueoEn)!.duenos
    }
    for (const inicio of procs) {
      const camino: string[] = []
      let actual: Proc | undefined = inicio
      while (actual && !camino.includes(actual.id)) {
        camino.push(actual.id)
        actual = porId.get(espera(actual)[0] ?? '')
      }
      if (!actual) continue
      const ciclo = camino.slice(camino.indexOf(actual.id)).map((id) => porId.get(id)!)
      const victima = ciclo.reduce((a, b) => (restante(b) > restante(a) ? b : a))
      eventos.push(
        `El detector encuentra deadlock entre ${ciclo.map((p) => p.id).join(' y ')}: finaliza a ${victima.id} (mayor tiempo restante).`,
      )
      matar(victima, t)
      return
    }
    eventos.push('El detector no encuentra deadlock.')
  }

  function matar(p: Proc, t: number) {
    for (const [n, r] of recs) {
      const i = r.cola.indexOf(p.id)
      if (i >= 0) r.cola.splice(i, 1)
      while (r.duenos.includes(p.id)) liberar(p, n)
    }
    const i = listos.indexOf(p.id)
    if (i >= 0) listos.splice(i, 1)
    p.estado = 'fin'
    p.fin = t
    p.bloqueoEn = undefined
    if (corriendo === p) corriendo = null
  }

  const terminoTodo = () =>
    config.hastaQueTerminen
      ? config.hastaQueTerminen.every((id) => porId.get(id)!.estado === 'fin')
      : procs.every((p) => p.estado === 'fin')

  const elegir = (): Proc | undefined => {
    if (!listos.length) return undefined
    let k = 0
    if (config.algoritmo.startsWith('prioridades')) {
      for (let i = 1; i < listos.length; i++) {
        if (porId.get(listos[i])!.prioridad < porId.get(listos[k])!.prioridad) k = i
      }
    }
    return porId.get(listos.splice(k, 1)[0])
  }

  for (let t = 0; t < MAX_TICKS; t++) {
    if (config.hasta != null && t >= config.hasta) break
    // 1. fin de quantum del que venía ejecutando (antes que los despertados y los nuevos)
    if (
      corriendo &&
      config.algoritmo === 'rr' &&
      quantumUsado >= config.quantum! &&
      !enAtomica(corriendo)
    ) {
      listos.push(corriendo.id)
      corriendo.estado = 'listo'
      eventos.push(`Fin de quantum de ${corriendo.id}.`)
      corriendo = null
    }
    // 2. despiertan los de sleep, entran los despertados y después los que llegan
    for (const p of procs) {
      if (p.estado === 'bloqueado' && p.bloqueoEn === 'sleep' && p.despierta === t) {
        despertar(p.id, true)
        eventos.push(`${p.id} termina su sleep.`)
      }
    }
    listos.push(...despertados)
    despertados = []
    for (const p of procs) {
      if (p.estado === 'nuevo' && p.llegada === t) {
        p.estado = 'listo'
        listos.push(p.id)
        eventos.push(`Llega ${p.id}.`)
      }
    }
    // 3. desalojo por prioridad
    if (corriendo && config.algoritmo === 'prioridades-desalojo' && !enAtomica(corriendo)) {
      const mejor = listos.some((id) => porId.get(id)!.prioridad < corriendo!.prioridad)
      if (mejor) {
        listos.push(corriendo.id)
        corriendo.estado = 'listo'
        eventos.push(`${corriendo.id} es desalojado por un proceso más prioritario.`)
        corriendo = null
      }
    }
    if (terminoTodo()) break
    while (!corriendo) {
      const p = elegir()
      if (!p) break
      if (!sentencia(p)) {
        // despertó de su última sentencia (sin ciclo): no le queda nada por ejecutar
        p.estado = 'fin'
        p.fin = t
        eventos.push(`${p.id} termina.`)
        continue
      }
      corriendo = p
      p.estado = 'ejecutando'
      quantumUsado = 0
      p.primeraCpu ??= t
    }
    const nadieMas = procs.every(
      (p) => p.estado === 'fin' || (p.estado === 'bloqueado' && p.bloqueoEn !== 'sleep'),
    )
    if (!corriendo && nadieMas) {
      const bloqueados = procs.filter((p) => p.estado === 'bloqueado')
      if (bloqueados.length) {
        eventos.push(
          `Nadie puede avanzar: ${bloqueados.map((p) => `${p.id} (en ${p.bloqueoEn})`).join(', ')} quedan bloqueados para siempre.`,
        )
      }
      break
    }

    // 4. ejecutar el tick
    const estados: Record<string, EstadoProceso> = {}
    const sentencias: Record<string, string> = {}
    for (const p of procs) {
      estados[p.id] = p.estado
      if (p.estado === 'listo') p.espera++
    }
    if (corriendo) sentencias[corriendo.id] = sentencia(corriendo)!.texto
    ticks.push({
      t,
      cpu: corriendo?.id ?? null,
      cpus: [corriendo?.id ?? null],
      io: procs.filter((p) => p.estado === 'bloqueado').map((p) => p.id),
      colaIO: [],
      listos: [...listos],
      estados,
      eventos,
      sentencias,
      sincro: [
        ...[...sems].map(([nombre, s]) => ({ nombre, valor: s.valor, cola: [...s.cola] })),
        ...[...recs].map(([nombre, r]) => ({
          nombre,
          valor: r.libres,
          cola: [...r.cola],
          duenos: [...r.duenos],
        })),
      ],
    })
    eventos = []
    if (corriendo) {
      const p: Proc = corriendo
      p.resta--
      quantumUsado++
      if (p.resta <= 0) completar(p, t + 1)
      if (p.estado !== 'ejecutando' && corriendo === p) corriendo = null
    }
  }

  if (eventos.length && ticks.length) ticks[ticks.length - 1].eventos.push(...eventos)
  const fin = ticks.length
  // los que quedan bloqueados para siempre (o siguen en su ciclo) no tienen fin: no van a la tabla
  const metricas: MetricasProceso[] = procs
    .filter((p) => p.fin != null)
    .map((p) => {
      const finalizacion = p.fin!
      return {
        id: p.id,
        llegada: p.llegada,
        finalizacion,
        retorno: finalizacion - p.llegada,
        espera: p.espera,
        respuesta: (p.primeraCpu ?? finalizacion) - p.llegada,
      }
    })
  const prom = (f: (m: MetricasProceso) => number) =>
    metricas.length ? metricas.reduce((a, m) => a + f(m), 0) / metricas.length : 0
  return {
    ticks,
    metricas,
    promedioRetorno: prom((m) => m.retorno),
    promedioEspera: prom((m) => m.espera),
    fin,
    procesadores: 1,
    hilos: procs.map((p) => p.id),
    bloqueoSincro: true,
  }
}
