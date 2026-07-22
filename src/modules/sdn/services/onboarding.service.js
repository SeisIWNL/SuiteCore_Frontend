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

  /**
   * Ejecuta un plan de onboarding ya generado. Este paso integra en cadena
   * NetBox, LibreNMS, Oxidized, Graylog, auditoría y notificaciones — puede
   * tardar más que el timeout por defecto de la app, así que se le da un
   * margen más amplio (60s) para evitar que el frontend marque error por
   * timeout mientras el backend sigue trabajando y termina bien igual.
   */
  async executePlan(planId) {
    const { data } = await http.post(`${BASE}/plans/${encodeURIComponent(planId)}/execute`, undefined, { timeout: 60_000 })
    return data
  },

  // ── Flujo de onboarding en 3 pasos ──────────────────────────

  /**
   * Paso 1: genera el plan de onboarding para un candidato (endpoint SCNO,
   * fuera del namespace /onboarding). Este endpoint SIEMPRE responde con un
   * estado de error a propósito (no puede autoaprobarse a sí mismo) — lo
   * único que interesa de la respuesta es `detail.plan.plan_id`.
   */
  async generateOnboardPlan(candidateId) {
    const { data } = await http.post('/scno/lifecycle/onboard', { candidate_id: candidateId })
    return data
  },

  /** Paso 2: aprueba un plan ya generado. */
  async approvePlan(planId) {
    const { data } = await http.post(`${BASE}/plans/${encodeURIComponent(planId)}/approve`)
    return data
  },

  // ── Retiro (decommission) ───────────────────────────────────
  /**
   * Retira un host ya onboarded (endpoint SCNO, fuera del namespace
   * /onboarding). Requiere el plan_id de la asociación ya existente del
   * candidato (el mismo con el que se onboardeó). Igual que executePlan,
   * integra varios sistemas en cadena, así que se le da más margen de tiempo.
   */
  async decommission(planId, candidateId, reason) {
    const { data } = await http.post('/scno/lifecycle/decommission', {
      plan_id: planId,
      candidate_id: candidateId,
      reason,
    }, { timeout: 60_000 })
    return data
  },
}