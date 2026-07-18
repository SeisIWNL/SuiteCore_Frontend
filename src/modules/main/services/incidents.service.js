// src/modules/main/services/incidents.service.js
import http from '@/services/http.js'

/**
 * Incidentes / eventos (Graylog).
 *
 * GET /incidents/events           → eventos recientes
 * GET /incidents/security-events  → eventos de seguridad
 * GET /incidents/summary          → resumen
 * GET /incidents/charts/severity  → alertas por severidad
 * GET /incidents/charts/modules   → alertas por módulo
 */
const BASE = '/incidents'

export const incidentsService = {
  /**
   * → {
   *     success, service, query, builtQuery, rangeSeconds, limit,
   *     totalResults, messagesCount,
   *     items: [{ id, index, timestamp, source, level, facility,
   *               applicationName, message, fullMessage, remoteIp, streams[] }]
   *   }
   */
  async getEvents() {
    const { data } = await http.get(`${BASE}/events`)
    return data
  },

  async getSecurityEvents() {
    const { data } = await http.get(`${BASE}/security-events`)
    return data
  },
}

/**
 * Traduce el nivel syslog numérico a una etiqueta y un tono visual.
 * 0 Emergency · 1 Alert · 2 Critical · 3 Error · 4 Warning
 * 5 Notice · 6 Informational · 7 Debug
 */
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

/** Fecha corta para la lista de eventos: "17/07 03:49:10". */
export function shortTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}
