import http from '@/services/http.js'

export const permissionService = {
  /**
   * @returns {Promise<{ total, roles: Array<{
   *   id, name, description, totalUsers, users: Array<object>
   * }> }>}
   */
  async getRoles() {
    const { data } = await http.get('/Permission/Roles')
    return data
  },

  /**
   * @returns {Promise<{ role, total, menus: Array<{
   *   block, order, menus: Array<{ id, name, slug }>
   * }> }>}
   */
  async getMenus() {
    const { data } = await http.get('/Permission/Menus')
    return data
  },

  /**
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
