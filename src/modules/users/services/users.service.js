// src/modules/users/services/users.service.js
import http from '@/services/http.js'

/**
 * Users — gestión de usuarios del directorio LDAP.
 *
 * POST   /api/ldap/users                  → crear usuario
 * PUT    /api/ldap/users/:username        → editar (firstName, lastName, gidNumber)
 * DELETE /api/ldap/users/:username        → deshabilitar (no elimina; pierde contraseña)
 * PATCH  /api/ldap/users/:username/enable → reactivar (asigna contraseña por defecto)
 *
 * El listado de usuarios NO sale de aquí: se obtiene de
 * GET /Permission/Roles (los users[] anidados por rol).
 *
 * `username` es la clave primaria; una vez creado, se usa en el resto
 * de operaciones.
 */
const BASE = '/ldap/users'

export const usersService = {
  /**
   * Crea un usuario. Esenciales: firstName, username, password, gidNumber.
   * @param {{ firstName, lastName?, username, password, gidNumber, department?, title? }} payload
   */
  async createUser(payload) {
    await http.post(BASE, payload)
  },

  /**
   * Edita un usuario. Solo nombres, apellidos y rol (gidNumber).
   * @param {string} username
   * @param {{ firstName, lastName, gidNumber }} payload
   */
  async updateUser(username, payload) {
    await http.put(`${BASE}/${encodeURIComponent(username)}`, payload)
  },

  /**
   * Deshabilita un usuario (no se elimina; pierde la contraseña registrada).
   * @param {string} username
   * @returns {Promise<{ message: string }>}
   */
  async disableUser(username) {
    const { data } = await http.delete(`${BASE}/${encodeURIComponent(username)}`)
    return data
  },

  /**
   * Reactiva un usuario deshabilitado (se le asigna una contraseña por defecto).
   * @param {string} username
   * @returns {Promise<{ message: string }>}
   */
  async enableUser(username) {
    const { data } = await http.patch(`${BASE}/${encodeURIComponent(username)}/enable`)
    return data
  },
}
