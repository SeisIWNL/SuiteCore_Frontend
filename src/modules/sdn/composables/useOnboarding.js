// src/modules/sdn/composables/useOnboarding.js
import { ref, computed } from 'vue'
import { onboardingService } from '@/modules/sdn/services/onboarding.service.js'

export function useOnboarding() {
  const status     = ref({ data: null, loading: false, error: null })
  const candidates = ref({ data: null, loading: false, error: null })
  const plans      = ref({ data: null, loading: false, error: null })
  const readiness  = ref({ data: null, loading: false, error: null })
  const executions = ref({ data: null, loading: false, error: null })

  async function loadOne(refObj, fn, silent = false) {
    if (!silent) refObj.value.loading = true
    refObj.value.error = null
    try {
      refObj.value.data = await fn()
    } catch (err) {
      refObj.value.error = err.message ?? 'No se pudo cargar la información.'
    } finally {
      if (!silent) refObj.value.loading = false
    }
  }

  async function loadAll(silent = false) {
    await Promise.all([
      loadOne(status,     () => onboardingService.getStatus(), silent),
      loadOne(candidates, () => onboardingService.getCandidates(), silent),
      loadOne(plans,      () => onboardingService.getPlans(), silent),
      loadOne(readiness,  () => onboardingService.getExecutionReadiness(), silent),
      loadOne(executions, () => onboardingService.getExecutions(), silent),
    ])
  }

  const anyLoading = computed(() =>
    status.value.loading || candidates.value.loading || plans.value.loading ||
    readiness.value.loading || executions.value.loading
  )

  // ── Candidatos ─────────────────────────────────────────────
  const candidateItems = computed(() => candidates.value.data?.items ?? [])
  const candidateTotal = computed(() =>
    candidates.value.data?.total ?? candidateItems.value.length
  )

  /** Normaliza el estado/elegibilidad de un candidato a una etapa del ciclo. */
  function stageOf(c) {
    const state = (c.state ?? '').toLowerCase()
    const elig  = (c.eligibility ?? '').toLowerCase()
    if (state.includes('retir') || state.includes('decommission')) return 'retirados'
    if (state.includes('onboard') && !state.includes('pend'))      return 'onboarded'
    if (elig.includes('elegible') || elig.includes('eligible'))    return 'elegibles'
    return 'detectados'
  }

  // ── Planes ─────────────────────────────────────────────────
  const planItems = computed(() => plans.value.data?.items ?? [])
  const planTotal = computed(() => plans.value.data?.total ?? planItems.value.length)

  // Conteos del ciclo de vida (tarjeta + dona del wireframe)
  const lifecycle = computed(() => {
    const acc = { detectados: 0, elegibles: 0, onboarded: 0, retirados: 0, pendientes: 0 }
    for (const c of candidateItems.value) {
      const s = stageOf(c)
      acc[s] = (acc[s] ?? 0) + 1
    }
    // "Detectados" en el wireframe es el total descubierto
    acc.detectados = candidateItems.value.length
    // Pendientes = planes que esperan aprobación
    acc.pendientes = planItems.value.filter(p =>
      (p.status ?? '').toLowerCase().includes('pend')
    ).length
    return acc
  })

  const plansByStatus = computed(() => {
    const acc = {}
    for (const p of planItems.value) {
      const k = (p.status ?? 'desconocido').toLowerCase()
      acc[k] = (acc[k] ?? 0) + 1
    }
    return acc
  })

  // ── Ejecuciones (schema abierto: proxy del SCNO) ───────────
  const executionItems = computed(() => {
    const d = executions.value.data
    if (!d) return []
    // El SCNO puede devolver { items: [] }, { executions: [] } o el array directo
    if (Array.isArray(d)) return d
    return d.items ?? d.executions ?? d.datos ?? []
  })

  const executionTotal = computed(() => executionItems.value.length)

  // Conteo por operación para el gráfico de ejecuciones automáticas
  const executionsByOperation = computed(() => {
    const acc = {}
    for (const e of executionItems.value) {
      const op = (e.operation ?? e.operacion ?? e.type ?? 'otros').toLowerCase()
      acc[op] = (acc[op] ?? 0) + 1
    }
    return acc
  })

  // ── Readiness / salud del sistema ──────────────────────────
  const isExecutionReady = computed(() =>
    readiness.value.data?.overallExecutionReady === true ||
    readiness.value.data?.executionAvailable === true
  )

  const latestScan = computed(() => status.value.data?.latestScan ?? null)

  return {
    status, candidates, plans, readiness, executions,
    anyLoading,
    candidateItems, candidateTotal, stageOf, lifecycle,
    planItems, planTotal, plansByStatus,
    executionItems, executionTotal, executionsByOperation,
    isExecutionReady, latestScan,
    loadAll,
  }
}

/** Formatea una fecha ISO a "DD/MM/YYYY HH:mm:ss". */
export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}
