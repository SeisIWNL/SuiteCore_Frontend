// src/modules/inventory/services/inventory.service.js
import http from '@/services/http.js'

const BASEREGIONS = '/netbox/regions'
const BASEIPADDRESSES = '/netbox/ip-addresses'
/**
 * CRUD de regiones de NetBox.
 *
 * GET    /netbox/regions       → lista todas
 * GET    /netbox/regions/:id   → una región
 * POST   /netbox/regions       → crea  { name, slug, description }
 * PATCH  /netbox/regions/:id   → edita { name, slug, description }
 * DELETE /netbox/regions/:id   → elimina
 */
export const inventoryService = {
  async getRegions() {
    const { data } = await http.get(BASEREGIONS)
    return data
  },

  async getRegion(id) {
    const { data } = await http.get(`${BASEREGIONS}/${id}`)
    return data
  },

  async createRegion(payload) {
    // payload = { name, slug, description }
    const { data } = await http.post(BASEREGIONS, payload)
    return data
  },

  async updateRegion(id, payload) {
    // payload = { name, slug, description }
    const { data } = await http.patch(`${BASEREGIONS}/${id}`, payload)
    return data
  },

  async deleteRegion(id) {
    await http.delete(`${BASEREGIONS}/${id}`)
  },

  /**
   * Direcciones IP de NetBox (solo lectura).
   * GET /netbox/ip-addresses
   * → [{ id, address, status: { value, label }, dnsName, description }]
   */
  async getIpAddresses() {
    const { data } = await http.get(BASEIPADDRESSES)
    return data
  },
}

/**
 * Extrae el prefijo/subred a partir de una dirección CIDR.
 * "172.16.20.1/24" → "172.16.20.0/24"
 * "100.124.54.117/32" → "100.124.54.117/32"
 * Si no se puede parsear, devuelve un grupo "Otros".
 */
export function subnetOf(address) {
  if (!address || typeof address !== 'string') return 'Otros'
  const [ip, maskStr] = address.split('/')
  const mask = Number(maskStr)
  const octets = ip.split('.').map(Number)
  if (octets.length !== 4 || octets.some(o => Number.isNaN(o)) || Number.isNaN(mask)) {
    return 'Otros'
  }
  // Calcula la dirección de red aplicando la máscara
  const ipInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
  const maskInt = mask === 0 ? 0 : (0xffffffff << (32 - mask)) >>> 0
  const netInt = (ipInt & maskInt) >>> 0
  const netOctets = [
    (netInt >>> 24) & 255,
    (netInt >>> 16) & 255,
    (netInt >>> 8) & 255,
    netInt & 255,
  ]
  return `${netOctets.join('.')}/${mask}`
}

/**
 * Genera un slug URL-friendly a partir del nombre.
 * "Lima Metropolitana" → "lima-metropolitana"
 */
export function generateSlug(name) {
  return (name ?? '')
    .toString()
    .normalize('NFD')                   // separa acentos
    .replace(/[\u0300-\u036f]/g, '')    // elimina acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')       // quita caracteres especiales
    .replace(/\s+/g, '-')               // espacios → guiones
    .replace(/-+/g, '-')                // colapsa guiones múltiples
}