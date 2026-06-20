// src/modules/backups/services/backups.service.js
import http from '@/services/http.js'

/**
 * Oxidized — respaldos de configuración de dispositivos.
 *
 * GET /api/oxidized/devices                    → lista de dispositivos
 * GET /api/oxidized/backups                    → lista de backups
 * GET /api/oxidized/devices/:deviceName/backup → config de un dispositivo
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
   * @param {string} deviceName
   * @returns {Promise<{ deviceName, config, retrievedAt }>}
   */
  async getDeviceBackup(deviceName) {
    const { data } = await http.get(`/oxidized/devices/${encodeURIComponent(deviceName)}/backup`)
    return data
  },
}
