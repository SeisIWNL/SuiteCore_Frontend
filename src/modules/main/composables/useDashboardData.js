// src/modules/main/composables/useDashboardData.js
import { ref, computed } from 'vue'
import { dashboardApiService } from '@/modules/main/services/dashboardApi.service.js'

export function useDashboardData() {
  const summary  = ref({ data: null, loading: false, error: null })
  const modules  = ref({ data: null, loading: false, error: null })
  const services = ref({ data: null, loading: false, error: null })

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
      loadOne(summary,  () => dashboardApiService.getSummary(), silent),
      loadOne(modules,  () => dashboardApiService.getModulesStatusChart(), silent),
      loadOne(services, () => dashboardApiService.getServicesStatusChart(), silent),
    ])
    lastRefresh.value = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
  }

  const anyLoading = computed(() =>
    summary.value.loading || modules.value.loading || services.value.loading
  )

  const indicadores = computed(() => summary.value.data?.indicadores ?? null)

  return {
    summary, modules, services,
    anyLoading, lastRefresh, indicadores,
    loadAll,
  }
}
