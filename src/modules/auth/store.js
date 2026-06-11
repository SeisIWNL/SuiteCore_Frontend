import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// import { authService } from '@/modules/auth/services/auth.service.js'
import { authService } from '@/services/auth.mock'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────
  const user        = ref(null)
  const token       = ref(localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token'))
  const initialized = ref(false)

  // ── Getters ────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const userInitials = computed(() => {
    if (!user.value) return ''
    const first = user.value.firstName?.[0] ?? ''
    const last  = user.value.lastName?.[0]  ?? ''
    return (first + last).toUpperCase()
  })

  // ── Actions ────────────────────────────────────────────
  async function login({ username, password, rememberMe }) {
    const response = await authService.login(username, password)

    token.value = response.token
    user.value  = response.user

    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('auth_token', response.token)
  }

  async function logout() {
    try { await authService.logout() } catch { /* silent */ }
    user.value  = null
    token.value = null
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
  }

  // Valida el token almacenado al cargar la app
  async function fetchMe() {
    if (!token.value) { initialized.value = true; return }
    try {
      user.value = await authService.me()
    } catch {
      token.value = null
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
    } finally {
      initialized.value = true
    }
  }

  return { user, token, initialized, isAuthenticated, userInitials, login, logout, fetchMe }
})
