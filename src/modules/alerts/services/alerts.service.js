// src/modules/alerts/services/alerts.service.js
import http from '@/services/http.js'

/**
 * Notificación de incidentes — alertas normalizadas (LibreNMS + Alert Manager
 * SCNO) y eventos operativos/de seguridad (Graylog).
 *
 * GET /incidents/summary          → estado del sistema + indicadores
 * GET /incidents/charts/severity  → alertas por severidad
 * GET /incidents/charts/modules   → alertas por módulo/servicio (dict dinámico)
 * GET /incidents/events           → eventos recientes (Graylog)
 * GET /incidents/security-events  → eventos de seguridad (Graylog)
 */
const BASE = '/incidents'

export const alertsService = {
  /** → { titulo, estado, indicadores: { alertasActivas, incidentesHistoricos, notificaciones: { telegram, correo } } } */
  async getSummary() {
    const { data } = await http.get(`${BASE}/summary`)
    return data
  },

  /** → { titulo, tipo, datos: { criticas, advertencias, informativas } } */
  async getSeverityChart() {
    const { data } = await http.get(`${BASE}/charts/severity`)
    return data
  },

  /** → { titulo, tipo, datos: { [nombreModulo]: cantidad, ... } } */
  async getModulesChart() {
    const { data } = await http.get(`${BASE}/charts/modules`)
    return data
  },

  /** → { success, service, query, totalResults, messagesCount, items[] } */
  async getEvents() {
    const { data } = await http.get(`${BASE}/events`)
    return data
  },

  /** → igual forma que getEvents(), filtrado a eventos de seguridad */
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
  if (n <= 3) return { label: 'Crítica', tone: 'danger' }
  if (n === 4) return { label: 'Advertencia', tone: 'warning' }
  if (n === 5 || n === 6) return { label: 'Informativa', tone: 'info' }
  return { label: 'Debug', tone: 'muted' }
}

/** Fecha completa: "17/07/2026 04:05:27". */
export function formatDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}
