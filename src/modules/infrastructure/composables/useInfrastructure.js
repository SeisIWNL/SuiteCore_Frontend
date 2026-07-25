import { ref, computed } from 'vue'
import { infrastructureService } from '@/modules/infrastructure/services/infrastructure.service.js'

export function useInfrastructure() {
  const summary  = ref({ data: null, loading: false, error: null })
  const resources = ref({ data: null, loading: false, error: null })

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
      loadOne(summary,   () => infrastructureService.getSummary(), silent),
      loadOne(resources, () => infrastructureService.getResourcesChart(), silent),
    ])
    lastRefresh.value = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
  }

  const anyLoading = computed(() =>
    summary.value.loading || resources.value.loading
  )

  const cpu = computed(() => resources.value.data?.datos?.cpu ?? 0)
  const memoria = computed(() => resources.value.data?.datos?.memoria ?? 0)
  const almacenamiento = computed(() => resources.value.data?.datos?.almacenamiento ?? 0)

  return {
    summary, resources,
    anyLoading, lastRefresh,
    cpu, memoria, almacenamiento,
    loadAll,
  }
}
