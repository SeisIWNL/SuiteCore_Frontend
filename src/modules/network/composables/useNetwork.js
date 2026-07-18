// src/modules/network/composables/useNetwork.js
import { ref, computed } from 'vue'
import { networkService } from '@/modules/network/services/network.service.js'

export function useNetwork() {
  const summary    = ref({ data: null, loading: false, error: null })
  const devChart   = ref({ data: null, loading: false, error: null })
  const ifChart    = ref({ data: null, loading: false, error: null })
  const alertChart = ref({ data: null, loading: false, error: null })
  const devTable   = ref({ data: null, loading: false, error: null })
  const ifTable    = ref({ data: null, loading: false, error: null })
  const alertTable = ref({ data: null, loading: false, error: null })

  const lastRefresh = ref(null)

  async function loadOne(refObj, fn, silent = false) {
    if (!silent) refObj.value.loading = true
    refObj.value.error = null
    try {
      refObj.value.data = await fn()
    } catch (err) {
      refObj.value.error = err.message ?? 'No se pudo cargar la información.'
    } finally {
      if (!silent) refObj.value.loading = false
    }
  }

  async function loadAll(silent = false) {
    await Promise.all([
      loadOne(summary,    () => networkService.getSummary(), silent),
      loadOne(devChart,   () => networkService.getDevicesStatusChart(), silent),
      loadOne(ifChart,    () => networkService.getInterfacesStatusChart(), silent),
      loadOne(alertChart, () => networkService.getAlertsStatusChart(), silent),
      loadOne(devTable,   () => networkService.getDevicesTable(), silent),
      loadOne(ifTable,    () => networkService.getInterfacesTable(), silent),
      loadOne(alertTable, () => networkService.getAlertsTable(), silent),
    ])
    lastRefresh.value = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
  }

  const anyLoading = computed(() =>
    summary.value.loading || devChart.value.loading || ifChart.value.loading ||
    alertChart.value.loading || devTable.value.loading || ifTable.value.loading ||
    alertTable.value.loading
  )

  // ── Derivados del summary ──────────────────────────────────
  const devicesDown = computed(() => {
    const s = summary.value.data
    if (!s) return 0
    return Math.max(0, (s.dispositivos ?? 0) - (s.dispositivosActivos ?? 0))
  })

  // Disponibilidad = activos / total (el backend no la envía)
  const availability = computed(() => {
    const s = summary.value.data
    if (!s || !s.dispositivos) return null
    return (s.dispositivosActivos / s.dispositivos) * 100
  })

  // ── Datos de tablas ────────────────────────────────────────
  const devices = computed(() => devTable.value.data?.datos ?? [])
  const interfaces = computed(() => ifTable.value.data?.datos ?? [])
  const alerts = computed(() => alertTable.value.data?.datos ?? [])

  // Mapa deviceId → nombre, para resolver el dispositivo de cada interfaz
  const deviceNameById = computed(() => {
    const map = new Map()
    for (const d of devices.value) {
      map.set(d.deviceId, d.display || d.hostname || d.sysName || `#${d.deviceId}`)
    }
    return map
  })

  function deviceNameFor(deviceId) {
    return deviceNameById.value.get(deviceId) ?? '—'
  }

  return {
    summary, devChart, ifChart, alertChart, devTable, ifTable, alertTable,
    anyLoading, lastRefresh,
    devicesDown, availability,
    devices, interfaces, alerts, deviceNameFor,
    loadAll,
  }
}

/** Formatea uptime en segundos a algo legible (ej. "24d 8h"). */
export function formatUptime(seconds) {
  if (!seconds || seconds <= 0) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
