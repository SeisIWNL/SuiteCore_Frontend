// src/services/grafana.service.js
import http from '@/services/http.js'

/**
 * Servicio compartido de dashboards embebidos de Grafana.
 * GET /api/monitoring/grafana-embed-links
 *
 * Respuesta (dashboards completos, ya no paneles sueltos):
 * [
 *   { title: "SuiteCore SCNO - Tráfico de Red",  embedUrl: "http://.../d/...?orgId=1&kiosk" },
 *   { title: "SuiteCore SCNO - Recursos de Hosts", embedUrl: "http://.../d/...?orgId=1&kiosk" },
 * ]
 *
 * El response ya no trae `category`. El reparto entre las vistas de Red e
 * Infraestructura se hace por título, con el mapeo editable de abajo.
 */

// Categorías de vista
export const GRAFANA_CATEGORY = {
  NETWORK: 'Red',
  INFRASTRUCTURE: 'Infraestructura',
}

/**
 * Mapeo fijo y EDITABLE: qué dashboards se muestran en la vista de Red.
 * La coincidencia es por subcadena del título (tolerante a may/acentos),
 * así que basta con una palabra clave distintiva.
 * Todo lo que NO esté aquí se considera de Infraestructura.
 */
const NETWORK_TITLES = [
  'Tráfico de Red',
  'Seguridad y Accesos',
]

function normalizeText(s) {
  return (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quita acentos
}

/** Deriva una clave estable a partir del embedUrl (el slug del dashboard). */
function deriveKey(embedUrl, index) {
  try {
    const u = new URL(embedUrl)
    // /d/<slug>?... → usamos el slug del dashboard como clave
    const parts = u.pathname.split('/').filter(Boolean)
    const dIdx = parts.indexOf('d')
    if (dIdx !== -1 && parts[dIdx + 1]) return parts[dIdx + 1]
    return u.pathname || `idx-${index}`
  } catch {
    return `idx-${index}`
  }
}

/** ¿Este dashboard pertenece a la vista de Red? */
function isNetwork(title) {
  const t = normalizeText(title)
  return NETWORK_TITLES.some(key => t.includes(normalizeText(key)))
}

/** Limpia el título quitando el prefijo repetitivo "SuiteCore SCNO - ". */
function cleanTitle(title) {
  return (title ?? '').replace(/^\s*SuiteCore\s+SCNO\s*[-–]\s*/i, '').trim() || title
}

/** Normaliza un dashboard del response a la forma que consume la vista. */
function normalizeDashboard(d, index) {
  return {
    id: deriveKey(d.embedUrl, index),
    title: cleanTitle(d.title),
    rawTitle: d.title,
    url: d.embedUrl,
    category: isNetwork(d.title) ? GRAFANA_CATEGORY.NETWORK : GRAFANA_CATEGORY.INFRASTRUCTURE,
  }
}

export const grafanaService = {
  /**
   * Devuelve todos los dashboards normalizados.
   * @returns {Promise<Array<{ id, title, rawTitle, url, category }>>}
   */
  async getPanels() {
    const { data } = await http.get('/monitoring/grafana-embed-links')
    return (data ?? []).map(normalizeDashboard)
  },

  /**
   * Devuelve solo los dashboards de una categoría de vista.
   * @param {string} category  GRAFANA_CATEGORY.NETWORK | GRAFANA_CATEGORY.INFRASTRUCTURE
   */
  async getPanelsByCategory(category) {
    const all = await this.getPanels()
    return filterByCategory(all, category)
  },
}

/** Filtra dashboards ya normalizados por categoría de vista. */
export function filterByCategory(panels, category) {
  const target = normalizeText(category)
  return (panels ?? []).filter(p => normalizeText(p.category) === target)
}
