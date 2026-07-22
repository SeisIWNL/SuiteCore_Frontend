// src/modules/sdn/composables/useOnboarding.js
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

  // ── Acciones ─────────────────────────────────────────────────

  /** Extrae un mensaje legible de la respuesta cruda del SCNO (objeto o texto). */
  function extractMessage(raw) {
    if (raw == null) return 'Operación completada.'
    if (typeof raw === 'string') return raw
    return raw.message ?? raw.status ?? raw.detail ?? JSON.stringify(raw)
  }

  /**
   * Busca hosts candidatos en la red (GET /onboarding/candidates) y
   * actualiza la tabla de "Hosts administrados" con lo que devuelva.
   * Devuelve la respuesta cruda para que la vista arme el mensaje del
   * popup (cuántos hosts se encontraron).
   */
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

  // ── Flujo de onboarding en 3 pasos ──────────────────────────
  // Estado del diálogo: confirmación → progreso (con mensaje por paso) →
  // resultado final (éxito o error). Un solo objeto reactivo controla las
  // 3 fases para que la vista renderice un único modal.
  const onboardFlow = reactive({
    open: false,
    mode: 'confirm',   // 'confirm' | 'progress' | 'result'
    tone: 'ok',        // 'ok' | 'error' (solo aplica en mode 'result')
    title: '',
    message: '',
    candidate: null,
  })

  /** Abre el modal de confirmación para un candidato puntual. */
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

  /**
   * Extrae el plan_id de la respuesta (o del error) del paso 1. El endpoint
   * SIEMPRE responde en estado de error a propósito (no puede autoaprobarse),
   * así que se revisa tanto la respuesta exitosa como la adjunta al error.
   */
  function extractPlanId(payload) {
    return payload?.detail?.plan?.plan_id ?? payload?.plan?.plan_id ?? null
  }

  /** Corre los 3 pasos en secuencia tras la confirmación del usuario. */
  async function confirmStartOnboarding() {
    const candidate = onboardFlow.candidate
    if (!candidate) return
    const candidateId = candidate.candidate_id
    const hostLabel = candidate.name || candidate.hostname || 'el host'

    onboardFlow.mode = 'progress'
    onboardFlow.title = 'Procesando onboarding'
    onboardFlow.message = 'Generando el plan...'

    // Paso 1: generar el planId (se ignora el "status" de este paso a propósito)
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
    let approveData
    try {
      approveData = await onboardingService.approvePlan(planId)
    } catch (err) {
      approveData = err.data
    }

    if (approveData?.status !== 'approved') {
      onboardFlow.mode = 'result'
      onboardFlow.tone = 'error'
      onboardFlow.title = `Estado: ${approveData?.status ?? 'desconocido'}`
      onboardFlow.message = approveData?.message ?? 'No se pudo aprobar el plan de onboarding.'
      await loadAll(true)
      return
    }

    // Paso 3: ejecutar el plan
    onboardFlow.message = 'Ejecutando plan de onboarding...'
    let execData
    try {
      execData = await onboardingService.executePlan(planId)
    } catch (err) {
      execData = err.data
    }

    if (execData?.status !== 'completed') {
      onboardFlow.mode = 'result'
      onboardFlow.tone = 'error'
      onboardFlow.title = `Estado: ${execData?.status ?? 'desconocido'}`
      onboardFlow.message = execData?.message ?? execData?.reason ?? 'No se pudo ejecutar el plan de onboarding.'
      await loadAll(true)
      return
    }

    onboardFlow.mode = 'result'
    onboardFlow.tone = 'ok'
    onboardFlow.title = 'Onboarding completado'
    onboardFlow.message = `El proceso de onboarding para ${hostLabel} se completó con éxito.`
    await loadAll(true) // refresca candidatos/planes con el nuevo estado
  }

  // ── Flujo de retiro (decommission) ──────────────────────────
  // Confirmación → motivo (texto libre) → progreso → resultado.
  const decommissionFlow = reactive({
    open: false,
    mode: 'confirm',   // 'confirm' | 'reason' | 'progress' | 'result'
    tone: 'ok',        // 'ok' | 'error' (solo en mode 'result')
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

  /** El usuario confirmó "Sí" en el paso de confirmación → pasa a pedir el motivo. */
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

  /** Envía el motivo y ejecuta el retiro contra el SCNO. */
  async function submitDecommission() {
    const candidate = decommissionFlow.candidate
    if (!candidate) return
    const candidateId = candidate.candidate_id
    const hostLabel = candidate.name || candidate.hostname || 'el host'
    const reason = decommissionFlow.reason?.trim()

    if (!reason) return // el botón ya está deshabilitado sin motivo, por seguridad

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

    let data
    try {
      data = await onboardingService.decommission(planId, candidateId, reason)
    } catch (err) {
      data = err.data
    }

    decommissionFlow.mode = 'result'
    if (data?.status === 'completed') {
      decommissionFlow.tone = 'ok'
      decommissionFlow.title = 'Retiro completado'
      decommissionFlow.message = data?.message ?? `${hostLabel} fue retirado correctamente.`
    } else {
      decommissionFlow.tone = 'error'
      decommissionFlow.title = `Estado: ${data?.status ?? 'desconocido'}`
      decommissionFlow.message = data?.message ?? 'No se pudo completar el retiro del host.'
    }
    await loadAll(true) // refresca candidatos/planes con el nuevo estado
  }

  return {
    status, candidates, plans, readiness, executions,
    anyLoading,
    candidateItems, candidateTotal, stageOf, lifecycle,
    planItems, planTotal, plansByStatus,
    executionItems, executionTotal, executionsByOperation,
    isExecutionReady,
    loadAll,
    // Acciones
    searchHosts,
    onboardFlow, askStartOnboarding, cancelOnboarding,
    confirmStartOnboarding, closeOnboardResult,
    decommissionFlow, askDecommission, cancelDecommission,
    proceedToDecommissionReason, submitDecommission, closeDecommissionResult,
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