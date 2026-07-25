import http from '@/services/http.js'

const BASE = '/network'

export const networkService = {

  async getSummary() {
    const { data } = await http.get(`${BASE}/summary`)
    return data
  },

  async getDevicesStatusChart() {
    const { data } = await http.get(`${BASE}/charts/devices-status`)
    return data
  },

  async getInterfacesStatusChart() {
    const { data } = await http.get(`${BASE}/charts/interfaces-status`)
    return data
  },

  async getAlertsStatusChart() {
    const { data } = await http.get(`${BASE}/charts/alerts-status`)
    return data
  },

  async getDevicesTable() {
    const { data } = await http.get(`${BASE}/tables/devices`)
    return data
  },

  async getInterfacesTable() {
    const { data } = await http.get(`${BASE}/tables/interfaces`)
    return data
  },

  async getAlertsTable() {
    const { data } = await http.get(`${BASE}/tables/alerts`)
    return data
  },
}
