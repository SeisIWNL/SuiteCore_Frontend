// src/modules/network/services/network.service.js
import http from '@/services/http.js'

/**
 * Módulo de Red — datos nativos desde el backend (LibreNMS), sin Grafana.
 *
 * GET /network/summary                    → 4 tarjetas de resumen
 * GET /network/charts/devices-status      → dona activos/caídos
 * GET /network/charts/interfaces-status   → dona activas/inactivas
 * GET /network/charts/alerts-status       → barras críticas/advertencias
 * GET /network/tables/devices             → tabla de dispositivos
 * GET /network/tables/interfaces          → tabla de interfaces
 * GET /network/tables/alerts              → tabla de alertas
 */
const BASE = '/network'

export const networkService = {
  /** → { estado, dispositivos, dispositivosActivos, interfaces, alertasActivas } */
  async getSummary() {
    const { data } = await http.get(`${BASE}/summary`)
    return data
  },

  /** → { titulo, tipo, datos: { activos, caidos } } */
  async getDevicesStatusChart() {
    const { data } = await http.get(`${BASE}/charts/devices-status`)
    return data
  },

  /** → { titulo, tipo, datos: { activas, inactivas } } */
  async getInterfacesStatusChart() {
    const { data } = await http.get(`${BASE}/charts/interfaces-status`)
    return data
  },

  /** → { titulo, tipo, datos: { criticas, advertencias } } */
  async getAlertsStatusChart() {
    const { data } = await http.get(`${BASE}/charts/alerts-status`)
    return data
  },

  /** → { titulo, datos: [{ deviceId, hostname, display, sysName, ip, os, type, status, statusLabel, uptime, lastPolled, lastPing, location }] } */
  async getDevicesTable() {
    const { data } = await http.get(`${BASE}/tables/devices`)
    return data
  },

  /** → { titulo, datos: [{ portId, ifName, ifDescr, ifAlias, ifOperStatus, ifAdminStatus, deviceId }] } */
  async getInterfacesTable() {
    const { data } = await http.get(`${BASE}/tables/interfaces`)
    return data
  },

  /** → { titulo, datos: [] }  (schema abierto por ahora) */
  async getAlertsTable() {
    const { data } = await http.get(`${BASE}/tables/alerts`)
    return data
  },
}
