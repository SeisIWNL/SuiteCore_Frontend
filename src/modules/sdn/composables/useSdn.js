// src/modules/sdn/composables/useSdn.js
import { ref, computed } from 'vue'
import { sdnService } from '@/modules/sdn/services/sdn.service.js'

export function useSdn() {
  const health     = ref({ data: null, loading: false, error: null })
  const topology   = ref({ data: null, loading: false, error: null })
  const statistics = ref({ data: null, loading: false, error: null })
  const flows      = ref({ data: null, loading: false, error: null })
  const mkInfo     = ref({ data: null, loading: false, error: null })
  const mkIfaces   = ref({ data: null, loading: false, error: null })

  async function loadOne(refObj, fn) {
    refObj.value.loading = true
    refObj.value.error = null
    try {
      refObj.value.data = await fn()
    } catch (err) {
      refObj.value.error = err.message ?? 'No se pudo cargar la información.'
    } finally {
      refObj.value.loading = false
    }
  }

  async function loadAll() {
    await Promise.all([
      loadOne(health,     () => sdnService.getHealth()),
      loadOne(topology,   () => sdnService.getTopology()),
      loadOne(statistics, () => sdnService.getStatistics()),
      loadOne(flows,      () => sdnService.getFlows()),
      loadOne(mkInfo,     () => sdnService.getMikrotikInfo()),
      loadOne(mkIfaces,   () => sdnService.getMikrotikInterfaces()),
    ])
  }

  const anyLoading = computed(() =>
    health.value.loading || topology.value.loading || statistics.value.loading ||
    flows.value.loading || mkInfo.value.loading || mkIfaces.value.loading
  )

  // ── Derivados MikroTik ─────────────────────────────────────
  const memoryUsed = computed(() => {
    const d = mkInfo.value.data
    if (!d) return null
    return d.totalMemory - d.freeMemory
  })
  const memoryPct = computed(() => {
    const d = mkInfo.value.data
    if (!d || !d.totalMemory) return 0
    return Math.round(((d.totalMemory - d.freeMemory) / d.totalMemory) * 100)
  })

  const interfaces = computed(() => mkIfaces.value.data?.interfaces ?? [])
  const flowsList  = computed(() => flows.value.data?.flows ?? [])
  const flowCount  = computed(() => flows.value.data?.flowCount ?? 0)
  const statPorts  = computed(() => statistics.value.data?.ports ?? [])

  // ¿El servicio está en línea? (status suele ser "online"/"ok")
  const isOnline = computed(() => {
    const s = (health.value.data?.status ?? '').toLowerCase()
    return s === 'online' || s === 'ok' || s === 'healthy'
  })

  // ── Acciones: seguridad (bloquear/desbloquear IP) ──────────
  const security = ref({
    ip: '',
    loading: false,
    error: null,
    message: null,
    messageType: null,   // 'success' | 'error'
  })

  function isValidIp(ip) {
    const s = (ip ?? '').trim()
    // IPv4 simple (con posible /máscara)
    return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(s)
  }

  async function runBlockIp(block = true) {
    const ip = security.value.ip.trim()
    security.value.error = null
    security.value.message = null
    if (!isValidIp(ip)) {
      security.value.error = 'Ingresa una dirección IP válida (ej. 192.168.1.100).'
      return
    }
    security.value.loading = true
    try {
      const res = block
        ? await sdnService.blockIp(ip)
        : await sdnService.unblockIp(ip)
      security.value.messageType = 'success'
      security.value.message =
        res?.message ??
        `IP ${ip} ${block ? 'bloqueada' : 'desbloqueada'} correctamente.`
    } catch (err) {
      security.value.messageType = 'error'
      security.value.message = err.message ?? 'No se pudo completar la acción.'
    } finally {
      security.value.loading = false
    }
  }

  // ── Acciones: automatización ───────────────────────────────
  const automation = ref({
    action: '',
    loading: false,
    message: null,
    messageType: null,
  })

  async function runAutomation() {
    const action = automation.value.action.trim()
    automation.value.message = null
    if (!action) {
      automation.value.messageType = 'error'
      automation.value.message = 'Ingresa el nombre de la acción a ejecutar.'
      return
    }
    automation.value.loading = true
    try {
      const res = await sdnService.executeAutomation(action)
      automation.value.messageType = 'success'
      automation.value.message = res?.message ?? `Acción "${action}" ejecutada correctamente.`
    } catch (err) {
      automation.value.messageType = 'error'
      automation.value.message = err.message ?? 'No se pudo ejecutar la acción.'
    } finally {
      automation.value.loading = false
    }
  }

  return {
    health, topology, statistics, flows, mkInfo, mkIfaces,
    anyLoading, isOnline,
    memoryUsed, memoryPct, interfaces, flowsList, flowCount, statPorts,
    security, automation,
    runBlockIp, runAutomation,
    loadAll,
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
  return `${val.toFixed(val < 10 ? 1 : 0)} ${units[i]}`
}

/** Etiqueta legible del tipo de interfaz MikroTik. */
export function ifaceTypeLabel(type) {
  const t = (type ?? '').toLowerCase()
  const map = {
    ether: 'Ethernet',
    loopback: 'Loopback',
    bridge: 'Bridge',
    vlan: 'VLAN',
    wg: 'WireGuard',
    wireguard: 'WireGuard',
    ppp: 'PPP',
    pppoe: 'PPPoE',
    wlan: 'Wireless',
  }
  return map[t] ?? (type || '—')
}
