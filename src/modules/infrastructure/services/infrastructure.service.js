import http from '@/services/http.js'


const BASE = '/infrastructure'

export const infrastructureService = {
 
  async getSummary() {
    const { data } = await http.get(`${BASE}/summary`)
    return data
  },

  async getResourcesChart() {
    const { data } = await http.get(`${BASE}/charts/resources`)
    return data
  },
}
