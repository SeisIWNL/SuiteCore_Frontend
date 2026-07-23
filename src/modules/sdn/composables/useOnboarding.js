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

  /**
   * Llama a un endpoint de lifecycle (approve/execute/decommission) y decide
   * si fue éxito real de forma segura:
   * - Si la llamada HTTP falló (4xx/5xx), SIEMPRE se considera error, sin
   *   importar lo que diga el campo `status` dentro del cuerpo — un error
   *   HTTP es la señal más confiable de que algo salió mal, y el cuerpo de
   *   un error puede traer datos inconsistentes o de un intento previo.
   * - Solo si la llamada HTTP resolvió bien se usa el `status` del cuerpo
   *   para decidir si fue el resultado esperado (`successStatus`).
   */
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

    const result = await callLifecycle(
      () => onboardingService.decommission(planId, candidateId, reason),
      'completed'
    )

    // El backend a veces envía un status/mensaje de nivel superior engañoso
    // (ej. "completed" + "Equipo retirado correctamente") aunque el detalle
    // real de la ejecución, anidado en `execution`, indique un error (ej.
    // "Debe indicar un motivo de al menos 10 caracteres."). Por eso se
    // revisa también ese sub-objeto antes de decidir éxito/error y qué
    // mensaje mostrar.
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
      // Prioriza el detalle anidado de "execution" (más específico y
      // confiable) antes que el mensaje de nivel superior.
      decommissionFlow.message =
        exec?.message ?? exec?.reason ?? result.data?.message ?? result.httpMessage ?? 'No se pudo completar el retiro del host.'
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