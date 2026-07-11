// src/modules/network/composables/useGrafanaPanels.js
import { ref, computed } from 'vue'
import { grafanaService, GRAFANA_CATEGORY } from '@/services/grafana.service.js'
import { useLoaderStore } from '@/stores/loader.js'

/**
 * Carga los dashboards embebidos de Grafana filtrados por categoría de vista.
 * @param {string} category  GRAFANA_CATEGORY.NETWORK | GRAFANA_CATEGORY.INFRASTRUCTURE
 */
export function useGrafanaPanels(category = GRAFANA_CATEGORY.NETWORK) {
  const loader = useLoaderStore()

  const panels  = ref([])
  const error   = ref(null)
  const loading = ref(false)

  const expandedPanel = ref(null)
  const panelStates = ref({})

  const hasPanels = computed(() => panels.value.length > 0)

  async function fetchPanels() {
    loading.value = true
    error.value   = null
    try {
      loader.show('Cargando dashboards...')
      const data = await grafanaService.getPanelsByCategory(category)
      panels.value = data
      data.forEach(p => {
        panelStates.value[p.id] = { loaded: false, error: false }
      })
    } catch (err) {
      error.value = err.message ?? 'No se pudieron obtener los dashboards de Grafana.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  function onIframeLoad(id) {
    if (panelStates.value[id]) {
      panelStates.value[id].loaded = true
      panelStates.value[id].error  = false
    }
  }
  function onIframeError(id) {
    if (panelStates.value[id]) {
      panelStates.value[id].error  = true
      panelStates.value[id].loaded = true
    }
  }

  function toggleExpand(id) {
    expandedPanel.value = expandedPanel.value === id ? null : id
  }
  function isExpanded(id) { return expandedPanel.value === id }
  function isPanelLoaded(id) { return panelStates.value[id]?.loaded ?? false }
  function isPanelError(id) { return panelStates.value[id]?.error ?? false }

  return {
    panels, error, loading, hasPanels,
    expandedPanel, panelStates,
    fetchPanels,
    onIframeLoad, onIframeError,
    toggleExpand, isExpanded,
    isPanelLoaded, isPanelError,
  }
}
