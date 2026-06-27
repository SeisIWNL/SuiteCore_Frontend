// src/modules/roles/composables/useRolePermissions.js
import { ref, reactive, computed } from 'vue'
import { permissionService } from '@/modules/roles/services/permission.service.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useRolePermissions(gidNumber) {
  const loader = useLoaderStore()

  // Catálogo maestro agrupado por bloque
  const blocks = ref([])
  // Estado de cada menú: { [menuId]: boolean }
  const checked = reactive({})
  // Snapshot inicial para detectar cambios
  const initial = ref({})
  // Ids de menús bloqueados (no editables) — ej. Dashboard
  const lockedIds = reactive(new Set())

  const roleName = ref('')
  const error    = ref(null)
  const loading  = ref(false)
  const saving   = ref(false)
  const saved    = ref(false)

  // El Dashboard siempre visible y no editable.
  function isDashboard(menu) {
    return menu?.slug === '/dashboard' || /dashboard/i.test(menu?.name ?? '')
  }
  function isLocked(menuId) {
    return lockedIds.has(menuId)
  }

  // ── Carga: el endpoint ya devuelve TODOS los módulos con isAssigned ──
  async function fetchPermissions() {
    loading.value = true
    error.value   = null
    try {
      loader.show('Cargando permisos...')
      const data = await permissionService.getRoleMenus(gidNumber)

      // Ordena los bloques por su campo order
      blocks.value = (data.menus ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .map(b => ({
          block: b.block,
          order: b.order ?? 99,
          menus: b.menus ?? [],
        }))

      // Inicializa el estado de checkboxes a partir de isAssigned
      const snapshot = {}
      lockedIds.clear()
      for (const block of blocks.value) {
        for (const m of block.menus ?? []) {
          // El Dashboard siempre está activo y no es editable
          const locked = isDashboard(m)
          if (locked) lockedIds.add(m.id)
          const isOn = locked ? true : m.isAssigned === true
          checked[m.id] = isOn
          snapshot[m.id] = isOn
        }
      }
      initial.value = snapshot
    } catch (err) {
      error.value = err.message ?? 'No se pudieron obtener los permisos.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  // ── Guardar ────────────────────────────────────────────────
  async function save() {
    saving.value = true
    error.value  = null
    saved.value  = false
    try {
      loader.show('Guardando permisos...')
      const ids = new Set(
        Object.entries(checked)
          .filter(([, on]) => on)
          .map(([id]) => Number(id))
      )
      // Garantiza que los módulos bloqueados (Dashboard) siempre se envíen
      for (const id of lockedIds) ids.add(Number(id))
      const menuIds = [...ids]

      await permissionService.updateRoleMenus(gidNumber, menuIds)

      // Actualiza el snapshot al estado guardado
      initial.value = { ...checked }
      saved.value = true
      setTimeout(() => { saved.value = false }, 2500)
    } catch (err) {
      error.value = err.message ?? 'No se pudieron guardar los permisos.'
    } finally {
      saving.value = false
      loader.hide()
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  function toggle(menuId) {
    if (isLocked(menuId)) return        // Dashboard no editable
    checked[menuId] = !checked[menuId]
  }

  // Marca/desmarca un bloque completo (respeta los bloqueados)
  function toggleBlock(block, value) {
    for (const m of block.menus ?? []) {
      if (isLocked(m.id)) continue
      checked[m.id] = value
    }
  }

  function blockState(block) {
    const ids = (block.menus ?? []).map(m => m.id)
    const on = ids.filter(id => checked[id]).length
    if (on === 0) return 'none'
    if (on === ids.length) return 'all'
    return 'some'
  }

  function resetChanges() {
    for (const id of Object.keys(checked)) {
      checked[id] = initial.value[id] ?? false
    }
  }

  // ── Computeds ──────────────────────────────────────────────
  const hasChanges = computed(() =>
    Object.keys(checked).some(id => checked[id] !== initial.value[id])
  )

  const totalSelected = computed(() =>
    Object.values(checked).filter(Boolean).length
  )

  const totalMenus = computed(() =>
    blocks.value.reduce((sum, b) => sum + (b.menus?.length ?? 0), 0)
  )

  const hasData = computed(() => blocks.value.length > 0)

  return {
    blocks, checked, roleName,
    error, loading, saving, saved,
    hasChanges, totalSelected, totalMenus, hasData,
    fetchPermissions, save,
    toggle, toggleBlock, blockState, resetChanges, isLocked,
  }
}

/**
 * Mapea un nombre de bloque a un ícono SVG y un acento.
 * El catálogo real usa: Principal, Monitoreo, Red y Seguridad,
 * Inventario, Auditoría, Usuarios.
 */
export function blockVisual(blockName) {
  const n = (blockName ?? '').toLowerCase()
  if (n.includes('principal'))
    return { code: 'B0 / MAIN_VIEW', icon: 'grid' }
  if (n.includes('monitoreo'))
    return { code: 'B1 / MONITOR', icon: 'activity' }
  if (n.includes('red') && n.includes('seguridad'))
    return { code: 'B2 / NET_SEC', icon: 'shield' }
  if (n.includes('red'))
    return { code: 'B2 / NETWORK', icon: 'network' }
  if (n.includes('inventario'))
    return { code: 'B3 / INVENTORY', icon: 'box' }
  if (n.includes('auditor'))
    return { code: 'B4 / AUDIT', icon: 'file' }
  if (n.includes('usuario'))
    return { code: 'B5 / USERS', icon: 'users' }
  return { code: 'B· / MODULE', icon: 'box' }
}