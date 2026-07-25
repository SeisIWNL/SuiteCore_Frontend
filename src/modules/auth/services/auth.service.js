import http from '@/services/http.js'

export const authService = {
  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login(username, password) {
    const { data } = await http.post('/auth/login', { username, password })
    return data
  },

  /**
   * @returns {Promise<void>}
   */
  async logout() {
    await http.post('/auth/logout')
  },

  /**
   * @returns {Promise<object>} usuario actual
   */
  async me() {
    const { data } = await http.get('/auth/me')
    return data
  },
}
