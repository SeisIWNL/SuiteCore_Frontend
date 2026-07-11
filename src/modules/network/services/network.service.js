// src/modules/network/services/network.service.js
import { grafanaService } from '@/services/grafana.service.js'

/**
 * Servicio del módulo de red. Los paneles de Grafana ahora se obtienen
 * del servicio compartido (que normaliza panelId y category).
 *
 * Se mantiene este wrapper por compatibilidad con quienes ya lo importan
 * (ej. el widget del dashboard principal).
 */
export const networkService = {
  /** Todos los paneles (sin filtrar). */
  async getGrafanaPanels() {
    return grafanaService.getPanels()
  },
}
