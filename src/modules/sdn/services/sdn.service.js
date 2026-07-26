import http from '@/services/http.js'

export const sdnService = {
  /** @returns {Promise<{ status, service, version, controller, bridge, openflow, timestamp }>} */
  async getHealth() {
    const { data } = await http.get('/sdn/health')
    return data
  },

  /** @returns {Promise<{ status, bridge, controller, ovsVersion, ports: string[] }>} */
  async getTopology() {
    const { data } = await http.get('/sdn/topology')
    return data
  },

  /** @returns {Promise<{ status, ports: object[] }>} */
  async getStatistics() {
    const { data } = await http.get('/sdn/statistics')
    return data
  },

  /** @returns {Promise<{ status, flowCount, flows: object[] }>} */
  async getFlows() {
    const { data } = await http.get('/sdn/flows')
    return data
  },

  /** @returns {Promise<{ status, identity, version, platform, cpu, cpuLoad, architecture, uptime, totalMemory, freeMemory }>} */
  async getMikrotikInfo() {
    const { data } = await http.get('/sdn/mikrotik/info')
    return data
  },

  /** @returns {Promise<{ status, interfaces: Array<{ name, type, running, disabled, comment }> }>} */
  async getMikrotikInterfaces() {
    const { data } = await http.get('/sdn/mikrotik/interfaces')
    return data
  },

  /**
   * @param {string} ip
   * @returns {Promise<object>}
   */
  async blockIp(ip) {
    const { data } = await http.post('/sdn/security/block-ip', { ip })
    return data
  },

  /**
   * @param {string} ip
   * @returns {Promise<object>}
   */
  async unblockIp(ip) {
    const { data } = await http.delete('/sdn/security/block-ip', { data: { ip } })
    return data
  },

  /**
   * @param {string} action  nombre de la acción/script
   * @returns {Promise<object>}
   */
  async executeAutomation(action) {
    const { data } = await http.post('/sdn/automation/execute', { action })
    return data
  },
}
