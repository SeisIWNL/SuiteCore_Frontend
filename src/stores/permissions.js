// src/stores/permissions.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { permissionService } from '@/modules/users/services/permission.service.js'

const SLUGS_KEY  = 'perm_slugs'
const BLOCKS_KEY = 'perm_blocks'

// Rutas siempre accesibles para cualquier usuario autenticado, sin importar
// lo que devuelva /Permission/Menus:
// - '/dashboard': página de inicio garantizada para todos los roles.
// Cualquier página que NO sea un módulo de negocio (ej. una futura pantalla
// de "Ajustes de cuenta" que no dependa de RBAC) debe agregarse aquí de forma
// explícita. Todo lo que no esté en esta lista y no venga en la respuesta del
// backend queda BLOQUEADO — el guard es la barrera principal de acceso.
const ALWAYS_ALLOWED = ['/dashboard']

export const usePermissionsStore = defineStore('permissions', () => {
  // Slugs que el backend devolvió para este usuario en /Permission/Menus.
  // El backend ya filtra por isEnable y por el rol del token: todo lo que
  // aparece aquí es, por definición, lo que este usuario puede ver.
  const allowedSlugs = ref(loadJson(SLUGS_KEY))
  // Estructura completa devuelta por /Permission/Menus (bloques + menús),
  // ya ordenada por `order`. El sidebar la usa para renderizarse dinámicamente.
  const menuBlocks   = ref(loadJson(BLOCKS_KEY))
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
   * Carga los módulos/menús del usuario autenticado desde
   * GET /Permission/Menus (el backend resuelve el rol por el token, no hace
   * falta pasar ningún id). Si ya se cargaron y no se fuerza, no repite la
   * llamada.
   */
  async function loadMenus(force = false) {
    if (!force && ready.value && menuBlocks.value) return

    loading.value = true
    error.value   = null
    try {
      const data = await permissionService.getMenus()
      const blocks = [...(data.menus ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

      // No se filtra por `isAssigned` — ese campo viene fijo/no confiable.
      // El filtrado real ya lo hizo el backend antes de responder: cada
      // slug presente aquí es un módulo habilitado Y asignado a este rol.
      const slugs = []
      for (const block of blocks) {
        for (const m of block.menus ?? []) {
          if (!m.slug) continue
          slugs.push(m.slug)
        }
      }

      menuBlocks.value   = blocks
      allowedSlugs.value = slugs
      persist()
    } catch (err) {
      // En caso de error NO abrimos todo: por seguridad dejamos solo dashboard,
      // y sin estructura de menús (el sidebar mostrará solo Dashboard + aviso).
      error.value = err.message ?? 'No se pudieron cargar los módulos del usuario.'
      allowedSlugs.value = allowedSlugs.value ?? []
      menuBlocks.value   = menuBlocks.value ?? []
    } finally {
      ready.value   = true
      loading.value = false
    }
  }

  function persist() {
    sessionStorage.setItem(SLUGS_KEY, JSON.stringify(allowedSlugs.value ?? []))
    sessionStorage.setItem(BLOCKS_KEY, JSON.stringify(menuBlocks.value ?? []))
  }

  /**
   * ¿El usuario puede ver esta ruta (slug)?
   * - Si los permisos no se cargaron aún → permitir (fail-open solo durante
   *   el brevísimo instante antes de que resuelva la primera carga).
   * - Una vez cargados: SOLO se permite si está en ALWAYS_ALLOWED o si vino
   *   en la respuesta de /Permission/Menus para este usuario. Cualquier otra
   *   cosa queda bloqueada (fail-closed) — el backend ya nos confirmó que
   *   esta respuesta está correctamente filtrada por rol.
   */
  function canAccess(slug) {
    if (!slug) return true
    if (allowedSlugs.value === null) return true   // aún sin cargar
    return allowedSet.value.has(slug)
  }

  function clear() {
    allowedSlugs.value = null
    menuBlocks.value   = null
    ready.value        = false
    error.value        = null
    sessionStorage.removeItem(SLUGS_KEY)
    sessionStorage.removeItem(BLOCKS_KEY)
  }

  return {
    allowedSlugs, allowedSet, menuBlocks, loading, error, ready,
    loadMenus, canAccess, clear,
  }
})