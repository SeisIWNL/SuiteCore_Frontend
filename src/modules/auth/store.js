import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/modules/auth/services/auth.service.js'
import { usePermissionsStore } from '@/stores/permissions.js'

export const useAuthStore = defineStore('auth', () => {

  // ── Helpers para leer storage ────────────────────────────────
  function fromStorage(key) {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? null
  }

  // ── State — se inicializa desde storage al arrancar ──────────
  const token     = ref(fromStorage('auth_token'))
  const expiresAt = ref(fromStorage('auth_expires'))
  const user      = ref((() => {
    const raw = fromStorage('auth_user')
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  })())

  // ── Getters ──────────────────────────────────────────────────
  const isAuthenticated = computed(() => {
    if (!token.value || !user.value) return false
    if (!expiresAt.value) return false
    return new Date() < new Date(expiresAt.value)
  })

  const msUntilExpiry = computed(() => {
    if (!expiresAt.value) return 0
    return Math.max(0, new Date(expiresAt.value).getTime() - Date.now())
  })

  const userInitials = computed(() => {
    if (!user.value) return ''
    const first = user.value.firstName?.[0] ?? ''
    const last  = user.value.lastName?.[0]  ?? ''
    return (first + last).toUpperCase()
  })

  // ── Actions ──────────────────────────────────────────────────
  async function login({ username, password, rememberMe }) {
    // authService.login ya retorna response.data gracias al { data } de axios
    const response = await authService.login(username, password)

    // Guarda en estado reactivo
    token.value     = response.token
    expiresAt.value = response.expiresAt
    user.value      = response.user

    // Persiste en storage
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('auth_token',   response.token)
    storage.setItem('auth_expires', response.expiresAt)
    storage.setItem('auth_user',    JSON.stringify(response.user))

    // Carga los módulos permitidos para el usuario (resuelto por el backend
    // vía el token, sin necesidad de conocer su gidNumber)
    try {
      await ensurePermissions(true)
    } catch {
      /* silent */
    }
  }

  async function logout() {
    try { await authService.logout() } catch { /* silent */ }
    try { usePermissionsStore().clear() } catch { /* silent */ }
    _clearState()
  }

  // fetchMe — se llama desde el router guard al cargar cada página
  // NO llama al backend porque /auth/me puede no existir
  // Confía en el storage + expiresAt de la API
  function fetchMe() {
    // Sin token → no hay sesión
    if (!token.value) return

    // Token expirado → limpia
    if (expiresAt.value && new Date() >= new Date(expiresAt.value)) {
      _clearState()
      return
    }

    // Si user ya está en memoria (mismo tab) → nada que hacer
    if (user.value) return

    // Si no hay user en memoria, intenta recuperarlo desde storage
    const raw = fromStorage('auth_user')
    if (raw) {
      try {
        user.value = JSON.parse(raw)
      } catch {
        _clearState()
      }
    } else {
      // Token existe pero no hay user → estado inconsistente → limpia
      _clearState()
    }
  }

  // ensurePermissions — garantiza que los módulos permitidos del usuario
  // estén cargados (p. ej. tras un F5). Idempotente: no recarga si ya están.
  // El backend resuelve el rol a partir del token, así que no hace falta
  // averiguar el gidNumber del usuario en el front.
  async function ensurePermissions(force = false) {
    if (!user.value) return
    const perms = usePermissionsStore()
    await perms.loadMenus(force)
  }

  function _clearState() {
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

  return {
    user, token, expiresAt,
    isAuthenticated, userInitials, msUntilExpiry,
    login, logout, fetchMe, ensurePermissions,
  }
})