import http from '@/services/http.js'

const BASE = '/netbox'

export const inventoryService = {
  // ── Direccionamiento ───────────────────────────────────────
  async getIpAddresses() {
    const { data } = await http.get(`${BASE}/ip-addresses`)
    return data
  },

  async getVlans() {
    const { data } = await http.get(`${BASE}/vlans`)
    return data
  },

  // ── Infraestructura física ─────────────────────────────────
  async getSites() {
    const { data } = await http.get(`${BASE}/sites`)
    return data
  },

  async getRacks() {
    const { data } = await http.get(`${BASE}/racks`)
    return data
  },

  // ── Dispositivos ───────────────────────────────────────────
  async getDevices() {
    const { data } = await http.get(`${BASE}/devices`)
    return data
  },

  async getDeviceTypes() {
    const { data } = await http.get(`${BASE}/device-types`)
    return data
  },

  async getDeviceRoles() {
    const { data } = await http.get(`${BASE}/device-roles`)
    return data
  },

  async getManufacturers() {
    const { data } = await http.get(`${BASE}/manufacturers`)
    return data
  },

  // ── Virtualización ─────────────────────────────────────────
  async getVirtualMachines() {
    const { data } = await http.get(`${BASE}/virtual-machines`)
    return data
  },

  async getClusters() {
    const { data } = await http.get(`${BASE}/clusters`)
    return data
  },

  // ── Regiones (INACTIVO en el backend) ──────────────────────
  async getRegions() {
    const { data } = await http.get(`${BASE}/regions`)
    return data
  },
}

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
