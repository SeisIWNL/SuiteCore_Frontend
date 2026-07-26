import http from '@/services/http.js'

const BASE = '/dashboard'

export const dashboardApiService = {
  /** → { estado, indicadores: { alertasActivas, checksTotales, checksActivos, maquinasVirtuales, servicios } } */
  async getSummary() {
    const { data } = await http.get(`${BASE}/summary`)
    return data
  },

  /** → { titulo, tipo, datos: { operativos, advertencia, criticos } } */
  async getModulesStatusChart() {
    const { data } = await http.get(`${BASE}/charts/modules-status`)
    return data
  },

  /** → { titulo, tipo, datos: { operativos, caidos } } */
  async getServicesStatusChart() {
    const { data } = await http.get(`${BASE}/charts/services-status`)
    return data
  },
}
