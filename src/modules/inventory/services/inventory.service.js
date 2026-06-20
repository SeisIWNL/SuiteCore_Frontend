// src/modules/inventory/services/inventory.service.js
import http from '@/services/http.js'

const BASE = '/monitoring/netbox-regions'

/**
 * CRUD de regiones de NetBox.
 *
 * GET    /monitoring/netbox-regions       → lista todas
 * GET    /monitoring/netbox-regions/:id   → una región
 * POST   /monitoring/netbox-regions       → crea  { name, slug, description }
 * PATCH  /monitoring/netbox-regions/:id   → edita { name, slug, description }
 * DELETE /monitoring/netbox-regions/:id   → elimina
 */
export const inventoryService = {
  async getRegions() {
    const { data } = await http.get(BASE)
    return data
  },

  async getRegion(id) {
    const { data } = await http.get(`${BASE}/${id}`)
    return data
  },

  async createRegion(payload) {
    // payload = { name, slug, description }
    const { data } = await http.post(BASE, payload)
    return data
  },

  async updateRegion(id, payload) {
    // payload = { name, slug, description }
    const { data } = await http.patch(`${BASE}/${id}`, payload)
    return data
  },

  async deleteRegion(id) {
    await http.delete(`${BASE}/${id}`)
  },
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
