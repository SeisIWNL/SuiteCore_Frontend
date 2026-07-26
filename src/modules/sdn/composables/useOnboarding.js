import { ref, reactive, computed } from 'vue'
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

  const candidateItems = computed(() => candidates.value.data?.items ?? [])
  const candidateTotal = computed(() =>
    candidates.value.data?.total ?? candidateItems.value.length
  )

  function stageOf(c) {
    const state = (c.state ?? '').toLowerCase()
    const elig  = (c.eligibility ?? '').toLowerCase()
    if (state.includes('retir') || state.includes('decommission')) return 'retirados'
    if (state.includes('onboard') && !state.includes('pend'))      return 'onboarded'
    if (elig.includes('elegible') || elig.includes('eligible'))    return 'elegibles'
    return 'detectados'
  }

  const planItems = computed(() => plans.value.data?.items ?? [])
  const planTotal = computed(() => plans.value.data?.total ?? planItems.value.length)

  const lifecycle = computed(() => {
    const acc = { detectados: 0, elegibles: 0, onboarded: 0, retirados: 0, pendientes: 0 }
    for (const c of candidateItems.value) {
      const s = stageOf(c)
      acc[s] = (acc[s] ?? 0) + 1
    }
    acc.detectados = candidateItems.value.length
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

  const executionItems = computed(() => {
    const d = executions.value.data
    if (!d) return []
    if (Array.isArray(d)) return d
    return d.items ?? d.executions ?? d.datos ?? []
  })

  const executionTotal = computed(() => executionItems.value.length)

  const executionsByOperation = computed(() => {
    const acc = {}
    for (const e of executionItems.value) {
      const op = (e.operation ?? e.operacion ?? e.type ?? 'otros').toLowerCase()
      acc[op] = (acc[op] ?? 0) + 1
    }
    return acc
  })

  const isExecutionReady = computed(() =>
    readiness.value.data?.overallExecutionReady === true ||
    readiness.value.data?.executionAvailable === true
  )

  function extractMessage(raw) {
    if (raw == null) return 'Operación completada.'
    if (typeof raw === 'string') return raw
    return raw.message ?? raw.status ?? raw.detail ?? JSON.stringify(raw)
  }

  async function searchHosts() {
    candidates.value.loading = true
    candidates.value.error = null
    try {
      const data = await onboardingService.getCandidates()
      candidates.value.data = data
      return data
    } catch (err) {
      candidates.value.error = err.message ?? 'No se pudo buscar hosts en la red.'
      throw err
    } finally {
      candidates.value.loading = false
    }
  }

  const onboardFlow = reactive({
    open: false,
    mode: 'confirm',   
    tone: 'ok',        
    title: '',
    message: '',
    candidate: null,
  })

  function askStartOnboarding(candidate) {
    onboardFlow.open = true
    onboardFlow.mode = 'confirm'
    onboardFlow.tone = 'ok'
    onboardFlow.candidate = candidate
    onboardFlow.title = 'Iniciar onboarding'
    onboardFlow.message =
      `¿Deseas iniciar el proceso de onboarding para "${candidate.name || candidate.hostname || 'este host'}"?`
  }

  function cancelOnboarding() {
    onboardFlow.open = false
    onboardFlow.candidate = null
  }

  function closeOnboardResult() {
    onboardFlow.open = false
    onboardFlow.candidate = null
  }

  function extractPlanId(payload) {
    return payload?.detail?.plan?.plan_id ?? payload?.plan?.plan_id ?? null
  }

  async function callLifecycle(fn, successStatus) {
    let data = null
    let httpFailed = false
    let httpStatus = null
    let httpMessage = null
    try {
      data = await fn()
    } catch (err) {
      httpFailed = true
      httpStatus = err.status
      httpMessage = err.message
      data = err.data
    }
    const ok = !httpFailed && data?.status === successStatus
    return { ok, data, httpFailed, httpStatus, httpMessage }
  }

  async function confirmStartOnboarding() {
    const candidate = onboardFlow.candidate
    if (!candidate) return
    const candidateId = candidate.candidate_id
    const hostLabel = candidate.name || candidate.hostname || 'el host'

    onboardFlow.mode = 'progress'
    onboardFlow.title = 'Procesando onboarding'
    onboardFlow.message = 'Generando el plan...'

    // Paso 1: generar el planId
    let planId = null
    try {
      const data = await onboardingService.generateOnboardPlan(candidateId)
      planId = extractPlanId(data)
    } catch (err) {
      planId = extractPlanId(err.data)
    }

    if (!planId) {
      onboardFlow.mode = 'result'
      onboardFlow.tone = 'error'
      onboardFlow.title = 'No se pudo generar el plan'
      onboardFlow.message = `El servicio no devolvió un plan válido para ${hostLabel}.`
      return
    }

    // Paso 2: aprobar el plan
    onboardFlow.message = 'Aprobando plan...'
    const approve = await callLifecycle(() => onboardingService.approvePlan(planId), 'approved')

    if (!approve.ok) {
      onboardFlow.mode = 'result'
      onboardFlow.tone = 'error'
      onboardFlow.title = approve.httpFailed
        ? `Error HTTP ${approve.httpStatus ?? ''}`.trim()
        : `Estado: ${approve.data?.status ?? 'desconocido'}`
      onboardFlow.message =
        approve.data?.message ?? approve.httpMessage ?? 'No se pudo aprobar el plan de onboarding.'
      await loadAll(true)
      return
    }

    // Paso 3: ejecutar el plan
    onboardFlow.message = 'Ejecutando plan de onboarding...'
    const exec = await callLifecycle(() => onboardingService.executePlan(planId), 'completed')

    if (!exec.ok) {
      onboardFlow.mode = 'result'
      onboardFlow.tone = 'error'
      onboardFlow.title = exec.httpFailed
        ? `Error HTTP ${exec.httpStatus ?? ''}`.trim()
        : `Estado: ${exec.data?.status ?? 'desconocido'}`
      onboardFlow.message =
        exec.data?.message ?? exec.data?.reason ?? exec.httpMessage ?? 'No se pudo ejecutar el plan de onboarding.'
      await loadAll(true)
      return
    }

    onboardFlow.mode = 'result'
    onboardFlow.tone = 'ok'
    onboardFlow.title = 'Onboarding completado'
    onboardFlow.message = `El proceso de onboarding para ${hostLabel} se completó con éxito.`
    await loadAll(true)
  }

  const decommissionFlow = reactive({
    open: false,
    mode: 'confirm',   
    tone: 'ok',        
    title: '',
    message: '',
    candidate: null,
    reason: '',
  })

  /** Busca el plan_id ya existente asociado a un candidato (el mismo con el que se onboardeó). */
  function findPlanIdForCandidate(candidateId) {
    const plan = planItems.value.find(p => (p.candidate_id ?? p.candidateId) === candidateId)
    return plan?.plan_id ?? plan?.planId ?? null
  }

  function askDecommission(candidate) {
    decommissionFlow.open = true
    decommissionFlow.mode = 'confirm'
    decommissionFlow.tone = 'ok'
    decommissionFlow.candidate = candidate
    decommissionFlow.reason = ''
    decommissionFlow.title = 'Retirar host'
    decommissionFlow.message =
      `¿Deseas retirar el host "${candidate.name || candidate.hostname || 'seleccionado'}"?`
  }

  function cancelDecommission() {
    decommissionFlow.open = false
    decommissionFlow.candidate = null
    decommissionFlow.reason = ''
  }

  function proceedToDecommissionReason() {
    decommissionFlow.mode = 'reason'
    decommissionFlow.title = 'Motivo del retiro'
    decommissionFlow.message = 'Indica el motivo por el que se retira este host.'
  }

  function closeDecommissionResult() {
    decommissionFlow.open = false
    decommissionFlow.candidate = null
    decommissionFlow.reason = ''
  }

  async function submitDecommission() {
    const candidate = decommissionFlow.candidate
    if (!candidate) return
    const candidateId = candidate.candidate_id
    const hostLabel = candidate.name || candidate.hostname || 'el host'
    const reason = decommissionFlow.reason?.trim()

    if (!reason) return

    const planId = findPlanIdForCandidate(candidateId)
    if (!planId) {
      decommissionFlow.mode = 'result'
      decommissionFlow.tone = 'error'
      decommissionFlow.title = 'No se encontró el plan'
      decommissionFlow.message =
        `No se encontró un plan asociado a ${hostLabel}. Actualiza la lista y vuelve a intentar.`
      return
    }

    decommissionFlow.mode = 'progress'
    decommissionFlow.title = 'Procesando retiro'
    decommissionFlow.message = 'Retirando host...'

    const result = await callLifecycle(
      () => onboardingService.decommission(planId, candidateId, reason),
      'completed'
    )

    const exec = result.data?.execution
    const execFailed = !!(exec?.status && exec.status !== 'completed')
    const ok = result.ok && !execFailed

    decommissionFlow.mode = 'result'
    if (ok) {
      decommissionFlow.tone = 'ok'
      decommissionFlow.title = 'Retiro completado'
      decommissionFlow.message = result.data?.message ?? `${hostLabel} fue retirado correctamente.`
    } else {
      decommissionFlow.tone = 'error'
      decommissionFlow.title = result.httpFailed
        ? `Error HTTP ${result.httpStatus ?? ''}`.trim()
        : execFailed
          ? `Estado: ${exec.status}`
          : `Estado: ${result.data?.status ?? 'desconocido'}`
      decommissionFlow.message =
        exec?.message ?? exec?.reason ?? result.data?.message ?? result.httpMessage ?? 'No se pudo completar el retiro del host.'
    }
    await loadAll(true)
  }

  return {
    status, candidates, plans, readiness, executions,
    anyLoading,
    candidateItems, candidateTotal, stageOf, lifecycle,
    planItems, planTotal, plansByStatus,
    executionItems, executionTotal, executionsByOperation,
    isExecutionReady,
    loadAll,
    searchHosts,
    onboardFlow, askStartOnboarding, cancelOnboarding,
    confirmStartOnboarding, closeOnboardResult,
    decommissionFlow, askDecommission, cancelDecommission,
    proceedToDecommissionReason, submitDecommission, closeDecommissionResult,
  }
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}