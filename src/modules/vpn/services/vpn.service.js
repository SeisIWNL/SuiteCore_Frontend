// src/modules/vpn/services/vpn.service.js
import http from '@/services/http.js'

/**
 * VPN — estado de los servicios de acceso remoto.
 *
 * GET /api/vpn/status           → estado del servidor RADIUS/VPN
 * GET /api/vpn/wireguard        → interfaz WireGuard y sus peers
 * GET /api/vpn/wireguard/stats  → estadísticas de tráfico de WireGuard
 * GET /api/vpn/tailscale        → red mesh Tailscale y todas sus máquinas
 * GET /api/vpn/access-policy    → políticas de acceso por red destino
 */
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
