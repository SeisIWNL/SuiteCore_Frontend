import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { permissionService } from '@/modules/users/services/permission.service.js'

const SLUGS_KEY  = 'perm_slugs'
const BLOCKS_KEY = 'perm_blocks'

const ALWAYS_ALLOWED = ['/dashboard']

export const usePermissionsStore = defineStore('permissions', () => {
  const allowedSlugs = ref(loadJson(SLUGS_KEY))
  const menuBlocks   = ref(loadJson(BLOCKS_KEY))
  const loading      = ref(false)
  const error        = ref(null)
  const ready        = ref(allowedSlugs.value !== null)

  function loadJson(key) {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  const allowedSet = computed(() => {
    const set = new Set(ALWAYS_ALLOWED)
    for (const s of allowedSlugs.value ?? []) set.add(s)
    return set
  })

  async function loadMenus(force = false) {
    if (!force && ready.value && menuBlocks.value) return

    loading.value = true
    error.value   = null
    try {
      const data = await permissionService.getMenus()
      const blocks = [...(data.menus ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

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