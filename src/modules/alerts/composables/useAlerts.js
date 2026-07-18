// src/modules/alerts/composables/useAlerts.js
import { ref, computed } from 'vue'
import { alertsService, levelInfo, formatDateTime } from '@/modules/alerts/services/alerts.service.js'

export function useAlerts() {
  const summary        = ref({ data: null, loading: false, error: null })
  const severityChart  = ref({ data: null, loading: false, error: null })
  const modulesChart   = ref({ data: null, loading: false, error: null })
  const events         = ref({ data: null, loading: false, error: null })
  const securityEvents = ref({ data: null, loading: false, error: null })

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
      loadOne(summary,        () => alertsService.getSummary(), silent),
      loadOne(severityChart,  () => alertsService.getSeverityChart(), silent),
      loadOne(modulesChart,   () => alertsService.getModulesChart(), silent),
      loadOne(events,         () => alertsService.getEvents(), silent),
      loadOne(securityEvents, () => alertsService.getSecurityEvents(), silent),
    ])
    lastRefresh.value = new Date().toLocaleString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
  }

  const anyLoading = computed(() =>
    summary.value.loading || severityChart.value.loading || modulesChart.value.loading ||
    events.value.loading || securityEvents.value.loading
  )

  // ── Indicadores del summary ─────────────────────────────────
  const indicadores = computed(() => summary.value.data?.indicadores ?? null)
  const notificaciones = computed(() => indicadores.value?.notificaciones ?? null)

  // ── Alertas por módulo (dict dinámico → array ordenado) ────
  const moduleBars = computed(() => {
    const dict = modulesChart.value.data?.datos ?? {}
    return Object.entries(dict)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  })

  // ── Eventos enriquecidos con severidad + hora ──────────────
  const eventItems = computed(() => {
    const items = events.value.data?.items ?? []
    return items.map(ev => {
      const info = levelInfo(ev.level)
      return { ...ev, _label: info.label, _tone: info.tone, _time: formatDateTime(ev.timestamp) }
    })
  })

  const recentEvents = computed(() => eventItems.value.slice(0, 6))

  /**
   * Tabla de "últimos incidentes" derivada de los eventos de Graylog.
   * Nota: Graylog no entrega un estado de resolución (resuelto/pendiente);
   * ese campo no se muestra para no inventar datos que el backend no envía.
   */
  const incidentRows = computed(() =>
    eventItems.value.map(ev => ({
      id: ev.id,
      time: ev._time,
      service: ev.source || ev.applicationName || '—',
      module: ev.facility || ev.applicationName || '—',
      severityLabel: ev._label,
      severityTone: ev._tone,
      detail: ev.message || '—',
    }))
  )

  return {
    summary, severityChart, modulesChart, events, securityEvents,
    anyLoading, lastRefresh,
    indicadores, notificaciones,
    moduleBars, eventItems, recentEvents, incidentRows,
    loadAll,
  }
}
