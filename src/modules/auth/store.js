import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
//import { authService } from '@/services/auth.mock'
import { authService } from '@/modules/auth/services/auth.service.js'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────
  const user        = ref(null)
  const token       = ref(localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token'))
  const expiresAt   = ref(localStorage.getItem('auth_expires') ?? null)
  const initialized = ref(false)

  // ── Getters ────────────────────────────────────────────
  const isAuthenticated = computed(() => {
    if (!token.value || !user.value) return false
    // Verifica que el token no haya expirado
    if (expiresAt.value && new Date() > new Date(expiresAt.value)) return false
    return true
  })

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
    expiresAt.value = response.expiresAt
    user.value  = response.user

    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('auth_token', response.token)
    storage.setItem('auth_expires', response.expiresAt)
    // Guarda el user para no perderlo al recargar la página
    storage.setItem('auth_user',    JSON.stringify(response.user))
  }

  async function logout() {
    try { await authService.logout() } catch { /* silent si no existe el endpoint */ }
    user.value      = null
    token.value     = null
    expiresAt.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_expires')
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_expires')
    sessionStorage.removeItem('auth_user')
  }

  // Valida el token almacenado al cargar la app
  async function fetchMe() {
    if (!token.value) { initialized.value = true; return }

    // Si el token ya expiró, limpia y sal
    if (expiresAt.value && new Date() > new Date(expiresAt.value)) {
      await logout()
      initialized.value = true
      return
    }

    // Intenta recuperar el user desde storage para evitar una llamada al backend
    const storedUser =
      localStorage.getItem('auth_user') ??
      sessionStorage.getItem('auth_user')

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
        initialized.value = true
        return
      } catch { /* si el JSON está corrupto, cae al fetchMe real */ }
    }

    // Si no hay user en storage, consulta /auth/me al backend
    try {
      user.value = await authService.me()
    } catch {
      await logout()
    } finally {
      initialized.value = true
    }
  }

  return {
    user, token, expiresAt, initialized,
    isAuthenticated, userInitials,
    login, logout, fetchMe,
  }
})
