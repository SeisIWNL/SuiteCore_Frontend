import http from '@/services/http.js'

const BASE = '/ldap/users'

export const usersService = {
  /**
   * @param {{ firstName, lastName?, username, password, gidNumber, department?, title? }} payload
   */
  async createUser(payload) {
    await http.post(BASE, payload)
  },

  /**
   * @param {string} username
   * @param {{ firstName, lastName, gidNumber }} payload
   */
  async updateUser(username, payload) {
    await http.put(`${BASE}/${encodeURIComponent(username)}`, payload)
  },

  /**
   * @param {string} username
   * @returns {Promise<{ message: string }>}
   */
  async disableUser(username) {
    const { data } = await http.delete(`${BASE}/${encodeURIComponent(username)}`)
    return data
  },

  /**
   * @param {string} username
   * @returns {Promise<{ message: string }>}
   */
  async enableUser(username) {
    const { data } = await http.patch(`${BASE}/${encodeURIComponent(username)}/enable`)
    return data
  },
}
