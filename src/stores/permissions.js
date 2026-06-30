// src/stores/permissions.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { permissionService } from '@/modules/users/services/permission.service.js'

const SLUGS_KEY = 'perm_slugs'
const GID_KEY   = 'perm_gid'
const KNOWN_KEY = 'perm_known'

// El Dashboard siempre es accesible para cualquier rol.
const ALWAYS_ALLOWED = ['/dashboard']

export const usePermissionsStore = defineStore('permissions', () => {
  // Slugs que el usuario puede ver (además de los always-allowed)
  const allowedSlugs = ref(loadJson(SLUGS_KEY))
  // Slugs que existen en el catálogo maestro (módulos gestionados por RBAC).
  // Un slug que NO está aquí no se filtra (no es un módulo controlado).
  const knownSlugs   = ref(loadJson(KNOWN_KEY))
  const loadedGid    = ref(sessionStorage.getItem(GID_KEY) || null)
  const loading      = ref(false)
  const error        = ref(null)
  // Marca si ya intentamos cargar (para evitar parpadeo en el guard)
  const ready        = ref(allowedSlugs.value !== null)

  function loadJson(key) {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  // Conjunto efectivo de slugs permitidos (incluye always-allowed)
  const allowedSet = computed(() => {
    const set = new Set(ALWAYS_ALLOWED)
    for (const s of allowedSlugs.value ?? []) set.add(s)
    return set
  })

  /**
   * Carga los menús permitidos para el gidNumber del usuario.
   * Si ya están cargados para ese gid y no se fuerza, no vuelve a pedir.
   */
  async function loadForGid(gidNumber, force = false) {
    if (!gidNumber) {
      // Sin gid no podemos filtrar; dejamos el set vacío (solo dashboard)
      allowedSlugs.value = []
      ready.value = true
      persist(gidNumber)
      return
    }
    if (!force && loadedGid.value === String(gidNumber) && allowedSlugs.value) {
      ready.value = true
      return
    }

    loading.value = true
    error.value   = null
    try {
      const assigned = await permissionService.getRoleMenus(gidNumber)

      // El endpoint ahora devuelve TODOS los módulos con un flag isAssigned.
      // - allowedSlugs: solo los que tienen isAssigned === true
      // - knownSlugs:  todos los slugs que aparecen (catálogo gestionado)
      const slugs = []
      const known = []
      for (const block of assigned.menus ?? []) {
        for (const m of block.menus ?? []) {
          if (!m.slug) continue
          known.push(m.slug)
          if (m.isAssigned === true) slugs.push(m.slug)
        }
      }
      allowedSlugs.value = slugs
      knownSlugs.value   = known

      loadedGid.value = String(gidNumber)
      persist(gidNumber)
    } catch (err) {
      // En caso de error NO abrimos todo: por seguridad dejamos solo dashboard.
      error.value = err.message ?? 'No se pudieron cargar los permisos del usuario.'
      allowedSlugs.value = allowedSlugs.value ?? []
    } finally {
      ready.value   = true
      loading.value = false
    }
  }

  function persist(gidNumber) {
    sessionStorage.setItem(SLUGS_KEY, JSON.stringify(allowedSlugs.value ?? []))
    sessionStorage.setItem(KNOWN_KEY, JSON.stringify(knownSlugs.value ?? []))
    if (gidNumber) sessionStorage.setItem(GID_KEY, String(gidNumber))
  }

  /**
   * ¿El usuario puede ver esta ruta (slug)?
   * - Si los permisos no se cargaron aún → permitir (fail-open en arranque).
   * - Si el slug NO es un módulo gestionado (no está en el catálogo) → permitir.
   * - Si es gestionado → solo si está en los permitidos (o es always-allowed).
   */
  function canAccess(slug) {
    if (!slug) return true
    if (allowedSlugs.value === null) return true        // aún sin cargar
    if (allowedSet.value.has(slug)) return true          // permitido explícito
    // Si el slug no es un módulo gestionado por RBAC, no lo bloqueamos
    const known = knownSlugs.value
    if (known && !known.includes(slug)) return true
    return false
  }

  function clear() {
    allowedSlugs.value = null
    knownSlugs.value   = null
    loadedGid.value    = null
    ready.value        = false
    error.value        = null
    sessionStorage.removeItem(SLUGS_KEY)
    sessionStorage.removeItem(KNOWN_KEY)
    sessionStorage.removeItem(GID_KEY)
  }

  return {
    allowedSlugs, allowedSet, knownSlugs, loadedGid, loading, error, ready,
    loadForGid, canAccess, clear,
  }
})