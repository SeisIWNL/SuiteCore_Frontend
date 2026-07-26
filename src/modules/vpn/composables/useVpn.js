import { ref, computed } from 'vue'
import { vpnService } from '@/modules/vpn/services/vpn.service.js'

export function useVpn() {
  const status    = ref({ data: null, loading: false, error: null })
  const wireguard = ref({ data: null, loading: false, error: null })
  const wgStats   = ref({ data: null, loading: false, error: null })
  const tailscale = ref({ data: null, loading: false, error: null })
  const policy    = ref({ data: null, loading: false, error: null })

  const searchQuery  = ref('')
  const statusFilter = ref('all')

  const trafficHistory = ref([])   // [{ t, rx, tx }]
  const MAX_POINTS = 16
  let lastSample = null

  function pushTrafficSample(stats) {
    if (!stats) return
    const now = new Date(stats.timestamp ?? Date.now())
    const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    // Si tenemos medición previa, graficamos el delta (tráfico en el intervalo);
    // si no, mostramos 0 para el primer punto.
    let rx = 0, tx = 0
    if (lastSample) {
      rx = Math.max(0, stats.rxBytes - lastSample.rxBytes)
      tx = Math.max(0, stats.txBytes - lastSample.txBytes)
    }
    lastSample = { rxBytes: stats.rxBytes, txBytes: stats.txBytes }
    trafficHistory.value.push({ label, rx, tx })
    if (trafficHistory.value.length > MAX_POINTS) trafficHistory.value.shift()
  }

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
      loadOne(status,    () => vpnService.getStatus(), silent),
      loadOne(wireguard, () => vpnService.getWireguard(), silent),
      loadOne(wgStats,   () => vpnService.getWireguardStats(), silent),
      loadOne(tailscale, () => vpnService.getTailscale(), silent),
      loadOne(policy,    () => vpnService.getAccessPolicy(), silent),
    ])
    if (wgStats.value.data) pushTrafficSample(wgStats.value.data)
  }

  // ── Auto-refresh ───────────────────────────────────────────
  let refreshTimer = null
  const autoRefresh = ref(true)
  const REFRESH_MS = 15000

  function startAutoRefresh() {
    stopAutoRefresh()
    refreshTimer = setInterval(() => {
      if (autoRefresh.value) loadAll(true) 
    }, REFRESH_MS)
  }
  function stopAutoRefresh() {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
  }
  function toggleAutoRefresh() {
    autoRefresh.value = !autoRefresh.value
  }

  // ── Tailscale: máquinas filtradas ──────────────────────────
  const peers = computed(() => tailscale.value.data?.peers ?? [])

  const onlineCount  = computed(() => peers.value.filter(p => p.isOnline).length)
  const offlineCount = computed(() => peers.value.filter(p => !p.isOnline).length)
  const totalPeers   = computed(() => peers.value.length)

  const filteredPeers = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return peers.value.filter(p => {
      if (statusFilter.value === 'online'  && !p.isOnline) return false
      if (statusFilter.value === 'offline' &&  p.isOnline) return false
      if (!q) return true
      return (
        p.hostname?.toLowerCase().includes(q) ||
        p.ip?.toLowerCase().includes(q) ||
        p.user?.toLowerCase().includes(q) ||
        p.os?.toLowerCase().includes(q)
      )
    })
  })

  function clearFilters() {
    searchQuery.value = ''
    statusFilter.value = 'all'
  }

  return {
    status, wireguard, wgStats, tailscale, policy,
    searchQuery, statusFilter, trafficHistory,
    peers, filteredPeers, onlineCount, offlineCount, totalPeers,
    loadAll, clearFilters,
    autoRefresh, startAutoRefresh, stopAutoRefresh, toggleAutoRefresh,
  }
}

/** Convierte bytes a una unidad legible (B, KB, MB, GB). */
export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let val = bytes / 1024
  let i = 0
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  return `${val.toFixed(1)} ${units[i]}`
}

export function osLabel(os) {
  const o = (os ?? '').toLowerCase()
  if (o.includes('win')) return 'Windows'
  if (o.includes('mac') || o.includes('darwin')) return 'macOS'
  if (o.includes('linux')) return 'Linux'
  if (o.includes('android')) return 'Android'
  if (o.includes('ios')) return 'iOS'
  return os || 'Desconocido'
}