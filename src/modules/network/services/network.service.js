// src/modules/network/services/network.service.js
import http from '@/services/http.js'

/**
 * Obtiene los paneles de Grafana configurados en el backend.
 * GET /api/monitoring/grafana-panels
 *
 * Respuesta esperada:
 * [
 *   { name: "Panel WAN", panelId: 2, url: "http://grafana.../..." },
 *   { name: "RAM Firewall", panelId: 1, url: "http://grafana.../..." },
 * ]
 */
export const networkService = {
  async getGrafanaPanels() {
    const { data } = await http.get('/monitoring/grafana-panels')
    return data
  },
}
