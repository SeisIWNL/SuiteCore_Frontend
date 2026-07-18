// src/modules/infrastructure/services/infrastructure.service.js
import http from '@/services/http.js'

/**
 * Módulo de Infraestructura — datos nativos del backend (Proxmox/LibreNMS),
 * sin Grafana.
 *
 * GET /infrastructure/summary           → tarjetas: nodos, VMs, memoria, almacenamiento
 * GET /infrastructure/charts/resources  → dona/uso: CPU, memoria, almacenamiento
 */
const BASE = '/infrastructure'

export const infrastructureService = {
  /** → { estado, nodosActivos, maquinasVirtuales, memoriaUso, almacenamientoUso } */
  async getSummary() {
    const { data } = await http.get(`${BASE}/summary`)
    return data
  },

  /** → { titulo, tipo, datos: { cpu, memoria, almacenamiento } } */
  async getResourcesChart() {
    const { data } = await http.get(`${BASE}/charts/resources`)
    return data
  },
}
