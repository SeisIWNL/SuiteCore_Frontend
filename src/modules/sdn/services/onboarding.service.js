import http from '@/services/http.js'

const BASE = '/onboarding'

export const onboardingService = {
  async getStatus() {
    const { data } = await http.get(`${BASE}/status`)
    return data
  },

  async getLocalDiscovery() {
    const { data } = await http.get(`${BASE}/discovery/local`)
    return data
  },

  async getTailscaleDiscovery() {
    const { data } = await http.get(`${BASE}/discovery/tailscale`)
    return data
  },

  async getCandidates() {
    const { data } = await http.get(`${BASE}/candidates`)
    return data
  },

  async getPlans() {
    const { data } = await http.get(`${BASE}/plans`)
    return data
  },

  async getPlanById(planId) {
    const { data } = await http.get(`${BASE}/plans/${encodeURIComponent(planId)}`)
    return data
  },

  async getExecutionReadiness() {
    const { data } = await http.get(`${BASE}/execution/readiness`)
    return data
  },

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

  async triggerLocalScan() {
    const { data } = await http.post(`${BASE}/discovery/local/scan`)
    return data
  },

  async triggerTailscaleScan() {
    const { data } = await http.post(`${BASE}/discovery/tailscale/scan`)
    return data
  },

  async createPlanForCandidate(candidateId) {
    const { data } = await http.post(`${BASE}/candidates/${encodeURIComponent(candidateId)}/plan`)
    return data
  },


  async executePlan(planId) {
    const { data } = await http.post(`${BASE}/plans/${encodeURIComponent(planId)}/execute`, undefined, { timeout: 60_000 })
    return data
  },

  async generateOnboardPlan(candidateId) {
    const { data } = await http.post('/scno/lifecycle/onboard', { candidate_id: candidateId })
    return data
  },

  async approvePlan(planId) {
    const { data } = await http.post(`${BASE}/plans/${encodeURIComponent(planId)}/approve`)
    return data
  },

  async decommission(planId, candidateId, reason) {
    const { data } = await http.post('/scno/lifecycle/decommission', {
      plan_id: planId,
      candidate_id: candidateId,
      reason,
    }, { timeout: 60_000 })
    return data
  },
}