// src/modules/roles/composables/useRoles.js
import { ref, reactive, computed } from 'vue'
import { permissionService } from '@/modules/roles/services/permission.service.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useRoles() {
  const loader = useLoaderStore()

  const roles   = ref([])
  const error   = ref(null)
  const loading = ref(false)

  const searchQuery = ref('')

  // Roles con su panel de usuarios expandido (Set de ids)
  const expanded = reactive(new Set())

  // ── Fetch ──────────────────────────────────────────────────
  async function fetchRoles() {
    loading.value = true
    error.value   = null
    try {
      loader.show('Cargando roles...')
      const data = await permissionService.getRoles()
      roles.value = data.roles ?? []
    } catch (err) {
      error.value = err.message ?? 'No se pudieron obtener los roles.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  // ── Filtro ─────────────────────────────────────────────────
  const filteredRoles = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return roles.value
    return roles.value.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.users?.some(u =>
        u.username?.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
      )
    )
  })

  // ── Métricas ───────────────────────────────────────────────
  const totalRoles = computed(() => roles.value.length)
  const totalAssignments = computed(() =>
    roles.value.reduce((sum, r) => sum + (r.totalUsers ?? 0), 0)
  )
  // Usuarios únicos (un usuario puede estar en varios roles)
  const uniqueUsers = computed(() => {
    const set = new Set()
    for (const r of roles.value) {
      for (const u of r.users ?? []) set.add(u.username)
    }
    return set.size
  })

  const hasData    = computed(() => roles.value.length > 0)
  const hasResults = computed(() => filteredRoles.value.length > 0)

  // ── Helpers UI ─────────────────────────────────────────────
  function toggleExpand(id) {
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
  }
  function isExpanded(id) {
    return expanded.has(id)
  }
  function clearSearch() {
    searchQuery.value = ''
  }

  return {
    roles, error, loading, searchQuery,
    filteredRoles, totalRoles, totalAssignments, uniqueUsers,
    hasData, hasResults,
    fetchRoles, toggleExpand, isExpanded, clearSearch,
  }
}

/**
 * Helpers de presentación para roles. Mapea ciertos roles conocidos
 * a un ícono/acento, con un fallback genérico.
 */
export function roleVisual(role) {
  const name = (role?.name ?? '').toLowerCase()
  if (name.includes('admin') && name.includes('network'))
    return { tone: 'critical', label: 'Administración' }
  if (name.includes('netadmin') || name.includes('networkadmin'))
    return { tone: 'critical', label: 'Administración' }
  if (name.includes('security') || name.includes('secadmin'))
    return { tone: 'security', label: 'Seguridad' }
  if (name.includes('supervisor') || name.includes('audit'))
    return { tone: 'audit', label: 'Supervisión' }
  if (name.includes('noc') || name.includes('operador'))
    return { tone: 'operator', label: 'Operación' }
  if (name.includes('all users') || name.includes('all'))
    return { tone: 'base', label: 'Base' }
  return { tone: 'default', label: 'Rol' }
}
