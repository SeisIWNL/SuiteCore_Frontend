import http from '@/services/http.js'

const BASE = '/incidents'

export const incidentsService = {
  async getEvents() {
    const { data } = await http.get(`${BASE}/events`)
    return data
  },

  async getSecurityEvents() {
    const { data } = await http.get(`${BASE}/security-events`)
    return data
  },
}

export function levelInfo(level) {
  const n = Number(level)
  if (Number.isNaN(n)) return { label: 'Desconocido', tone: 'muted' }
  if (n <= 2) return { label: 'Crítico', tone: 'danger' }
  if (n === 3) return { label: 'Error', tone: 'danger' }
  if (n === 4) return { label: 'Advertencia', tone: 'warning' }
  if (n === 5) return { label: 'Aviso', tone: 'info' }
  if (n === 6) return { label: 'Info', tone: 'info' }
  return { label: 'Debug', tone: 'muted' }
}

export function shortTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}
