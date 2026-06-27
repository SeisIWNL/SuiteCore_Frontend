// src/modules/backups/services/backups.service.js
import http from '@/services/http.js'

/**
 * Oxidized — respaldos de configuración de dispositivos.
 *
 * GET /api/oxidized/devices                             → lista de dispositivos
 * GET /api/oxidized/backups                             → lista de backups
 * GET /api/oxidized/devices/:deviceName/backup          → config más reciente
 * GET /api/oxidized/devices/:deviceName/backup?oid=...  → config de versión específica
 * GET /api/oxidized/devices/:deviceName/versions        → historial de versiones
 */
export const backupsService = {
  /**
   * @returns {Promise<{ total, devices: [] }>}
   */
  async getDevices() {
    const { data } = await http.get('/oxidized/devices')
    return data
  },

  /**
   * @returns {Promise<{ total, backups: [] }>}
   */
  async getBackups() {
    const { data } = await http.get('/oxidized/backups')
    return data
  },

  /**
   * Config de un dispositivo. Sin parámetros devuelve el más reciente.
   * Con { oid, epoch, num } devuelve esa versión específica del historial.
   *
   * @param {string} deviceName
   * @param {{ oid?: string, epoch?: number, num?: number }} [params]
   * @returns {Promise<{ deviceName, config, backupType, oid, epoch, num, retrievedAt }>}
   */
  async getDeviceBackup(deviceName, params = {}) {
    const query = new URLSearchParams()
    if (params.oid)   query.set('oid',   params.oid)
    if (params.epoch) query.set('epoch', params.epoch)
    if (params.num)   query.set('num',   params.num)
    const qs = query.toString() ? `?${query}` : ''
    const { data } = await http.get(
      `/oxidized/devices/${encodeURIComponent(deviceName)}/backup${qs}`
    )
    return data
  },

  /**
   * Historial de versiones de un dispositivo (más reciente primero por la API).
   *
   * @param {string} deviceName
   * @returns {Promise<{ deviceName, total, versions: Array<{
   *   date, time, oid, author, message, epoch, num, backupUrl
   * }> }>}
   */
  async getDeviceVersions(deviceName) {
    const { data } = await http.get(
      `/oxidized/devices/${encodeURIComponent(deviceName)}/versions`
    )
    return data
  },
}
