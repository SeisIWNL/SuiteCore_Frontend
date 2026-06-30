// src/modules/roles/services/permission.service.js
import http from '@/services/http.js'

/**
 * Permission — administración de roles (grupos LDAP) y sus módulos.
 *
 * GET  /api/Permission/Roles                       → roles con usuarios
 * GET  /api/Permission/Menus                       → catálogo maestro de módulos
 * GET  /api/Permission/Roles/:gidNumber/menus      → módulos asignados a un rol
 * PUT  /api/Permission/Roles/:gidNumber/menus      → asignar módulos a un rol
 */
export const permissionService = {
  /**
   * Lista de roles (grupos). El campo `id` es el gidNumber.
   * @returns {Promise<{ total, roles: Array<{
   *   id, name, description, totalUsers, users: Array<object>
   * }> }>}
   */
  async getRoles() {
    const { data } = await http.get('/Permission/Roles')
    return data
  },

  /**
   * Catálogo maestro de módulos del dashboard, agrupados por bloque.
   * @returns {Promise<{ role, total, menus: Array<{
   *   block, order, menus: Array<{ id, name, slug }>
   * }> }>}
   */
  async getMenus() {
    const { data } = await http.get('/Permission/Menus')
    return data
  },

  /**
   * Módulos a los que un rol tiene acceso, agrupados por bloque.
   * @param {string} gidNumber
   * @returns {Promise<{ gidNumber, total, menus: Array<{
   *   block, order, menus: Array<{ id, name, slug }>
   * }> }>}
   */
  async getRoleMenus(gidNumber) {
    const { data } = await http.get(
      `/Permission/Roles/${encodeURIComponent(gidNumber)}/menus`
    )
    return data
  },

  /**
   * Asigna los módulos visibles para un rol.
   * @param {string} gidNumber
   * @param {number[]} menuIds
   * @returns {Promise<{ message, gidNumber }>}
   */
  async updateRoleMenus(gidNumber, menuIds) {
    const { data } = await http.put(
      `/Permission/Roles/${encodeURIComponent(gidNumber)}/menus`,
      { menuIds }
    )
    return data
  },
}
