import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/modules/auth/services/auth.service.js'
import { usePermissionsStore } from '@/stores/permissions.js'

// Resuelve el gidNumber del usuario desde las distintas formas en que
// puede venir del backend (gidNumber directo, o anidado).
function resolveGid(user) {
  if (!user) return null
  const gid =
    user.gidNumber ??
    user.gid ??
    user.groupId ??
    user.role ??
    // a veces viene anidado en el primer grupo
    user.groups?.[0]?.gidNumber ??
    user.groups?.[0]?.id ??
    null
  // Normaliza: descarta cadenas vacías
  if (gid === '' || gid == null) return null
  return String(gid)
}

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

    // Log para confirmar que llegó bien
    console.log('[auth] login OK → user:', response.user)

    // Carga los módulos permitidos para el rol del usuario
    try {
      const perms = usePermissionsStore()
      const gid = resolveGid(response.user)
      console.log('[auth] gidNumber resuelto:', gid, '← de user:', response.user)
      if (!gid) {
        console.warn('[auth] ⚠ El usuario NO tiene gidNumber directo; intentando resolver por username...')
      }
      // ensurePermissions aplica el fallback por username si hace falta
      await ensurePermissions(true)
      console.log('[auth] permisos cargados → slugs permitidos:', perms.allowedSlugs)
    } catch (err) {
      console.warn('[auth] no se pudieron cargar permisos:', err)
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
      console.log('[auth] token expirado → logout')
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
        console.log('[auth] user recuperado de storage:', user.value)
      } catch {
        console.warn('[auth] auth_user en storage está corrupto → logout')
        _clearState()
      }
    } else {
      // Token existe pero no hay user → estado inconsistente → limpia
      console.warn('[auth] token sin user en storage → logout')
      _clearState()
    }
  }

  // ensurePermissions — garantiza que los módulos permitidos del usuario
  // estén cargados (p. ej. tras un F5). Idempotente: no recarga si ya están.
  async function ensurePermissions(force = false) {
    if (!user.value) return
    const perms = usePermissionsStore()
    let gid = resolveGid(user.value)

    // Fallback: si el usuario no trae gidNumber, lo descubrimos cruzando
    // su username contra GET /Permission/Roles (que incluye users[]).
    if (!gid) {
      gid = await resolveGidByUsername(user.value.username)
      if (gid) console.log('[auth] gidNumber resuelto por username:', gid)
    }

    await perms.loadForGid(gid, force)
  }

  // Busca el gidNumber del usuario en la lista de roles, por username.
  async function resolveGidByUsername(username) {
    if (!username) return null
    try {
      const { permissionService } = await import('@/modules/users/services/permission.service.js')
      const data = await permissionService.getRoles()
      for (const role of data.roles ?? []) {
        const match = (role.users ?? []).some(u => u.username === username)
        if (match) return String(role.id)   // role.id === gidNumber
      }
    } catch (err) {
      console.warn('[auth] no se pudo resolver gid por username:', err)
    }
    return null
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