// src/modules/inventory/composables/useIpAddresses.js
import { ref, reactive, computed } from 'vue'
import { inventoryService, subnetOf } from '@/modules/inventory/services/inventory.service.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useIpAddresses() {
  const loader = useLoaderStore()

  const ips     = ref([])
  const error   = ref(null)
  const loading = ref(false)
  const loaded  = ref(false)   // evita refetch innecesario al cambiar de pestaña

  // ── Filtros ────────────────────────────────────────────────
  const searchQuery  = ref('')
  const statusFilter = ref('all')   // 'all' | valor de status (active, reserved, ...)

  // Subredes colapsadas (Set de claves de subred)
  const collapsed = reactive(new Set())

  // ── Fetch ──────────────────────────────────────────────────
  async function fetchIpAddresses(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value   = null
    try {
      loader.show('Cargando direcciones IP...')
      ips.value = await inventoryService.getIpAddresses()
      loaded.value = true
    } catch (err) {
      error.value = err.message ?? 'No se pudieron obtener las direcciones IP de NetBox.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  // ── Opciones de estado disponibles (para el filtro) ────────
  const statusOptions = computed(() => {
    const map = new Map()
    for (const ip of ips.value) {
      const v = ip.status?.value
      if (v && !map.has(v)) map.set(v, ip.status?.label ?? v)
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  })

  // ── Lista filtrada (búsqueda + estado) ─────────────────────
  const filteredIps = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return ips.value.filter(ip => {
      if (statusFilter.value !== 'all' && ip.status?.value !== statusFilter.value) return false
      if (!q) return true
      return (
        ip.address?.toLowerCase().includes(q) ||
        ip.dnsName?.toLowerCase().includes(q) ||
        ip.description?.toLowerCase().includes(q)
      )
    })
  })

  // ── Agrupación por subred ──────────────────────────────────
  const groupedIps = computed(() => {
    const groups = new Map()
    for (const ip of filteredIps.value) {
      const key = subnetOf(ip.address)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(ip)
    }
    // Ordena las IPs dentro de cada grupo y los grupos por nombre
    const result = [...groups.entries()].map(([subnet, items]) => ({
      subnet,
      items: items.slice().sort((a, b) => a.address.localeCompare(b.address, undefined, { numeric: true })),
    }))
    result.sort((a, b) => a.subnet.localeCompare(b.subnet, undefined, { numeric: true }))
    return result
  })

  // ── Métricas ───────────────────────────────────────────────
  const totalIps      = computed(() => ips.value.length)
  const totalSubnets  = computed(() => new Set(ips.value.map(ip => subnetOf(ip.address))).size)
  const activeIps     = computed(() => ips.value.filter(ip => ip.status?.value === 'active').length)
  const hasData       = computed(() => ips.value.length > 0)
  const hasResults    = computed(() => filteredIps.value.length > 0)

  // ── Helpers de UI ──────────────────────────────────────────
  function toggleSubnet(subnet) {
    if (collapsed.has(subnet)) collapsed.delete(subnet)
    else collapsed.add(subnet)
  }
  function isCollapsed(subnet) {
    return collapsed.has(subnet)
  }
  function expandAll() {
    collapsed.clear()
  }
  function collapseAll() {
    for (const g of groupedIps.value) collapsed.add(g.subnet)
  }
  function clearFilters() {
    searchQuery.value  = ''
    statusFilter.value = 'all'
  }

  return {
    ips, error, loading, loaded,
    searchQuery, statusFilter, statusOptions,
    filteredIps, groupedIps,
    totalIps, totalSubnets, activeIps, hasData, hasResults,
    fetchIpAddresses,
    toggleSubnet, isCollapsed, expandAll, collapseAll, clearFilters,
  }
}