// src/modules/network/composables/useGrafanaPanels.js
import { ref, computed } from 'vue'
import { networkService } from '@/modules/network/services/network.service.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useGrafanaPanels() {
  const loader = useLoaderStore()

  const panels  = ref([])
  const error   = ref(null)
  const loading = ref(false)

  // Panel actualmente expandido (null = ninguno)
  const expandedPanel = ref(null)

  // Paneles con estado de carga individual por iframe
  const panelStates = ref({})

  const hasPanels = computed(() => panels.value.length > 0)

  async function fetchPanels() {
    loading.value = true
    error.value   = null

    try {
      loader.show('Cargando paneles de red...')
      const data = await networkService.getGrafanaPanels()
      panels.value = data

      // Inicializa el estado de cada panel
      data.forEach(p => {
        panelStates.value[p.panelId] = { loaded: false, error: false }
      })
    } catch (err) {
      error.value = err.message ?? 'No se pudieron obtener los paneles de Grafana.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  function onIframeLoad(panelId) {
    if (panelStates.value[panelId]) {
      panelStates.value[panelId].loaded = true
      panelStates.value[panelId].error  = false
    }
  }

  function onIframeError(panelId) {
    if (panelStates.value[panelId]) {
      panelStates.value[panelId].error  = true
      panelStates.value[panelId].loaded = true
    }
  }

  function toggleExpand(panelId) {
    expandedPanel.value = expandedPanel.value === panelId ? null : panelId
  }

  function isExpanded(panelId) {
    return expandedPanel.value === panelId
  }

  function isPanelLoaded(panelId) {
    return panelStates.value[panelId]?.loaded ?? false
  }

  function isPanelError(panelId) {
    return panelStates.value[panelId]?.error ?? false
  }

  // Añade parámetros de tema oscuro y oculta controles de Grafana
  // para que encaje con el diseño del dashboard
  function buildEmbedUrl(url) {
    try {
      const u = new URL(url)
      u.searchParams.set('theme', 'dark')
      u.searchParams.set('kiosk',  '')       // oculta header de Grafana
      u.searchParams.set('refresh', '30s')   // auto-refresh cada 30s
      return u.toString()
    } catch {
      return url
    }
  }

  return {
    panels, error, loading, hasPanels,
    expandedPanel, panelStates,
    fetchPanels,
    onIframeLoad, onIframeError,
    toggleExpand, isExpanded,
    isPanelLoaded, isPanelError,
    buildEmbedUrl,
  }
}
