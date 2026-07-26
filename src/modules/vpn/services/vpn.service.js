import http from '@/services/http.js'

export const vpnService = {
  /** @returns {Promise<{ server, managementIp, uptime, isOnline }>} */
  async getStatus() {
    const { data } = await http.get('/vpn/status')
    return data
  },

  /** @returns {Promise<{ interface, network, serverIp, isActive, connectedPeers, peers: [] }>} */
  async getWireguard() {
    const { data } = await http.get('/vpn/wireguard')
    return data
  },

  /** @returns {Promise<{ interface, rxBytes, txBytes, rxPackets, txPackets, rxErrors, txErrors, timestamp }>} */
  async getWireguardStats() {
    const { data } = await http.get('/vpn/wireguard/stats')
    return data
  },

  /** @returns {Promise<{ isConnected, meshIp, nodeName, derpActive, peers: [] }>} */
  async getTailscale() {
    const { data } = await http.get('/vpn/tailscale')
    return data
  },

  /** @returns {Promise<{ origin, destinations: [] }>} */
  async getAccessPolicy() {
    const { data } = await http.get('/vpn/access-policy')
    return data
  },
}
