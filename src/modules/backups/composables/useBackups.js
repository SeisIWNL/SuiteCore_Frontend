import { ref, computed } from 'vue'
import { backupsService } from '@/modules/backups/services/backups.service.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useBackups() {
  const loader = useLoaderStore()

  const devices = ref([])
  const error   = ref(null)
  const loading = ref(false)

  const searchQuery = ref('')

  // ── Fetch lista de dispositivos ─────────────────────────────
  async function fetchDevices() {
    loading.value = true
    error.value   = null
    try {
      loader.show('Cargando respaldos...')
      const data = await backupsService.getDevices()
      devices.value = data.devices ?? []
    } catch (err) {
      error.value = err.message ?? 'No se pudo obtener la lista de dispositivos.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  // ── Filtrado por búsqueda ───────────────────────────────────
  const filteredDevices = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return devices.value
    return devices.value.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.ip?.toLowerCase().includes(q) ||
      d.model?.toLowerCase().includes(q) ||
      d.group?.toLowerCase().includes(q)
    )
  })

  // ── Estadísticas ────────────────────────────────────────────
  const totalDevices = computed(() => devices.value.length)
  const successCount = computed(() =>
    devices.value.filter(d => d.status === 'success').length)
  const failedCount  = computed(() =>
    devices.value.filter(d => d.status !== 'success').length)

  // Última sincronización global (el mtime más reciente)
  const lastSync = computed(() => {
    if (!devices.value.length) return null
    const dates = devices.value
      .map(d => d.last?.end ?? d.mtime)
      .filter(Boolean)
      .map(d => new Date(d.replace(' UTC', 'Z').replace(' ', 'T')))
    if (!dates.length) return null
    return new Date(Math.max(...dates))
  })

  const hasResults = computed(() => filteredDevices.value.length > 0)
  const hasData    = computed(() => devices.value.length > 0)

  function clearSearch() { searchQuery.value = '' }

  return {
    devices, error, loading, searchQuery,
    filteredDevices, totalDevices, successCount, failedCount, lastSync,
    hasResults, hasData,
    fetchDevices, clearSearch,
  }
}