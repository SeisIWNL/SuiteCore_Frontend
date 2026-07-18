// src/modules/sdn/services/onboarding.service.js
import http from '@/services/http.js'

/**
 * Onboarding SCNO — ciclo de vida automatizado de hosts (descubrimiento,
 * planes, ejecuciones y retiro).
 *
 * GET /onboarding/status                       → estado del servicio + último escaneo
 * GET /onboarding/discovery/local              → descubrimiento en red local
 * GET /onboarding/discovery/tailscale          → descubrimiento vía Tailscale
 * GET /onboarding/candidates                   → candidatos detectados
 * GET /onboarding/plans                        → planes de onboarding
 * GET /onboarding/plans/:planId                → detalle de un plan
 * GET /onboarding/execution/readiness          → si la ejecución está habilitada
 * GET /onboarding/executions                   → historial de ejecuciones (proxy crudo)
 * GET /onboarding/executions/:id               → detalle de ejecución (proxy crudo)
 * GET /onboarding/executions/:id/steps         → pasos de una ejecución (proxy crudo)
 *
 * Nota: los endpoints de `executions` son un proxy directo del SCNO, sin DTO
 * tipado en el backend, por lo que su estructura puede variar.
 */
const BASE = '/onboarding'

export const onboardingService = {
  /** → { status, integrity, candidateCount, scanCount, latestScan } */
  async getStatus() {
    const { data } = await http.get(`${BASE}/status`)
    return data
  },

  /** → { status, source, mode, checkedAt, summary, excludedSummary, candidates[] } */
  async getLocalDiscovery() {
    const { data } = await http.get(`${BASE}/discovery/local`)
    return data
  },

  /** → igual que local, pero desde Tailscale */
  async getTailscaleDiscovery() {
    const { data } = await http.get(`${BASE}/discovery/tailscale`)
    return data
  },

  /** → { status, count, total, state, items[] } */
  async getCandidates() {
    const { data } = await http.get(`${BASE}/candidates`)
    return data
  },

  /** → { status, count, total, filterStatus, items[] } */
  async getPlans() {
    const { data } = await http.get(`${BASE}/plans`)
    return data
  },

  /** → OnboardingPlanDto */
  async getPlanById(planId) {
    const { data } = await http.get(`${BASE}/plans/${encodeURIComponent(planId)}`)
    return data
  },

  /** → { success, executionScope, overallExecutionReady, executionAvailable, ... } */
  async getExecutionReadiness() {
    const { data } = await http.get(`${BASE}/execution/readiness`)
    return data
  },

  /** → respuesta cruda del SCNO (schema abierto) */
  async getExecutions() {
    const { data } = await http.get(`${BASE}/executions`)
    return data
  },

  async getExecutionById(executionId) {
    const { data } = await http.get(`${BASE}/executions/${encodeURIComponent(executionId)}`)
    return data
  },

  async getExecutionSteps(executionId) {
    const { data } = await http.get(`${BASE}/executions/${encodeURIComponent(executionId)}/steps`)
    return data
  },

  // ── Acciones (POST — proxies puros del SCNO, sin body) ─────
  // El backend reenvía la respuesta cruda del SCNO tal cual (status +
  // contenido, sin deserializar), así que el resultado puede ser texto u
  // objeto según lo que el SCNO devuelva en cada caso.

  /** Dispara un escaneo de descubrimiento en la red local. */
  async triggerLocalScan() {
    const { data } = await http.post(`${BASE}/discovery/local/scan`)
    return data
  },

  /** Dispara un escaneo de descubrimiento en la malla Tailscale. */
  async triggerTailscaleScan() {
    const { data } = await http.post(`${BASE}/discovery/tailscale/scan`)
    return data
  },

  /** Genera el plan de onboarding para un candidato. */
  async createPlanForCandidate(candidateId) {
    const { data } = await http.post(`${BASE}/candidates/${encodeURIComponent(candidateId)}/plan`)
    return data
  },

  /** Ejecuta un plan de onboarding ya generado. */
  async executePlan(planId) {
    const { data } = await http.post(`${BASE}/plans/${encodeURIComponent(planId)}/execute`)
    return data
  },
}
