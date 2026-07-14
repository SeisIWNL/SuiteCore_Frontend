// src/modules/inventory/services/inventory.service.js
import http from '@/services/http.js'

/**
 * Inventario NetBox.
 *
 * IMPORTANTE: el backend actualmente sólo expone endpoints GET (solo lectura).
 * Los verbos POST/PATCH/DELETE están comentados en el NetboxController, así
 * como los endpoints de `regions` y `cables`.
 *
 * Endpoints ACTIVOS:
 *   GET /netbox/ip-addresses
 *   GET /netbox/vlans
 *   GET /netbox/sites
 *   GET /netbox/manufacturers
 *   GET /netbox/device-roles
 *   GET /netbox/device-types
 *   GET /netbox/devices
 *   GET /netbox/racks
 *   GET /netbox/virtual-machines
 *   GET /netbox/clusters
 *
 * Endpoints INACTIVOS (comentados en el backend):
 *   /netbox/regions (todos los verbos), /netbox/cables (todos los verbos)
 */

const BASE = '/netbox'

export const inventoryService = {
  // ── Direccionamiento ───────────────────────────────────────
  /** → [{ id, address, status:{value,label}, dnsName, description }] */
  async getIpAddresses() {
    const { data } = await http.get(`${BASE}/ip-addresses`)
    return data
  },

  /** → [{ id, vid, name, status:{value,label}, description }] */
  async getVlans() {
    const { data } = await http.get(`${BASE}/vlans`)
    return data
  },

  // ── Infraestructura física ─────────────────────────────────
  /** → [{ id, name, slug, status:{value,label}, facility, description }] */
  async getSites() {
    const { data } = await http.get(`${BASE}/sites`)
    return data
  },

  /** → [{ id, name, site:{id,name}, status, width:{value,label}, uHeight, startingUnit, description, deviceCount }] */
  async getRacks() {
    const { data } = await http.get(`${BASE}/racks`)
    return data
  },

  // ── Dispositivos ───────────────────────────────────────────
  /** → [{ id, name, deviceType:{...}, role:{id,name}, site:{id,name}, rack:{id,name}|null, status }] */
  async getDevices() {
    const { data } = await http.get(`${BASE}/devices`)
    return data
  },

  /** → [{ id, manufacturer:{id,slug}, model, slug, uHeight, airflow, weight, weightUnit, description, deviceCount }] */
  async getDeviceTypes() {
    const { data } = await http.get(`${BASE}/device-types`)
    return data
  },

  /** → [{ id, name, slug, color, vmRole, description, deviceCount, virtualMachineCount }] */
  async getDeviceRoles() {
    const { data } = await http.get(`${BASE}/device-roles`)
    return data
  },

  /** → [{ id, name, slug, description }] */
  async getManufacturers() {
    const { data } = await http.get(`${BASE}/manufacturers`)
    return data
  },

  // ── Virtualización ─────────────────────────────────────────
  /** → [{ id, name, role, status, site, cluster, primaryIp, vcpus, memory, disk, description }] */
  async getVirtualMachines() {
    const { data } = await http.get(`${BASE}/virtual-machines`)
    return data
  },

  /** → [{ id, name, type:{id,name}, status, description, deviceCount, virtualMachineCount, allocatedVcpus, allocatedMemory, allocatedDisk }] */
  async getClusters() {
    const { data } = await http.get(`${BASE}/clusters`)
    return data
  },

  // ── Regiones (INACTIVO en el backend) ──────────────────────
  /**
   * El endpoint está comentado en el NetboxController. Se mantiene la llamada
   * para que, si el backend lo reactiva, la pestaña vuelva a funcionar sola.
   */
  async getRegions() {
    const { data } = await http.get(`${BASE}/regions`)
    return data
  },
}

/**
 * Extrae el prefijo/subred a partir de una dirección CIDR.
 * "172.16.20.1/24" → "172.16.20.0/24"
 */
export function subnetOf(address) {
  if (!address || typeof address !== 'string') return 'Otros'
  const [ip, maskStr] = address.split('/')
  const mask = Number(maskStr)
  const octets = ip.split('.').map(Number)
  if (octets.length !== 4 || octets.some(o => Number.isNaN(o)) || Number.isNaN(mask)) {
    return 'Otros'
  }
  const ipInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  const maskInt = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0
  const netInt = (ipInt & maskInt) >>> 0
  const netOctets = [
    (netInt >>> 24) & 255, (netInt >>> 16) & 255,
    (netInt >>> 8) & 255, netInt & 255,
  ]
  return `${netOctets.join('.')}/${mask}`
}

/** Genera un slug URL-friendly. "Lima Metropolitana" → "lima-metropolitana" */
export function generateSlug(name) {
  return (name ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Formatea bytes/MB de NetBox (memory viene en MB, disk en MB). */
export function formatMB(mb) {
  if (mb == null || Number.isNaN(mb)) return '—'
  if (mb < 1024) return `${mb} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}
