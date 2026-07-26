// src/modules/inventory/composables/useNetboxResource.js
import { ref, computed } from 'vue'
import { useLoaderStore } from '@/stores/loader.js'

/**
 *
 * @param {Function} fetchFn      función del servicio que devuelve el array
 * @param {object}   options
 * @param {string[]} options.searchFields  campos por los que se busca (soporta
 *                                          rutas anidadas: 'site.name')
 * @param {string}   options.loaderMessage mensaje del loader global
 */
export function useNetboxResource(fetchFn, options = {}) {
  const {
    searchFields = ['name', 'description'],
    loaderMessage = 'Cargando datos...',
  } = options

  const loader = useLoaderStore()

  const items   = ref([])
  const error   = ref(null)
  const loading = ref(false)
  const loaded  = ref(false)  

  const searchQuery  = ref('')
  const statusFilter = ref('all')

  async function fetchItems(force = false, silent = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value   = null
    try {
      if (!silent) loader.show(loaderMessage)
      const data = await fetchFn()
      items.value = Array.isArray(data) ? data : []
      loaded.value = true
    } catch (err) {
      error.value = err.message ?? 'No se pudo obtener la información de NetBox.'
      items.value = []
    } finally {
      loading.value = false
      if (!silent) loader.hide()
    }
  }

  // Lee un campo posiblemente anidado: getPath(obj, 'site.name')
  function getPath(obj, path) {
    return path.split('.').reduce((acc, k) => acc?.[k], obj)
  }

  // Estados presentes en los datos (para los chips de filtro)
  const statusOptions = computed(() => {
    const map = new Map()
    for (const it of items.value) {
      const v = it.status?.value
      if (v && !map.has(v)) map.set(v, it.status?.label ?? v)
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
  })

  const hasStatus = computed(() => statusOptions.value.length > 0)

  const filteredItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return items.value.filter(it => {
      if (statusFilter.value !== 'all' && it.status?.value !== statusFilter.value) return false
      if (!q) return true
      return searchFields.some(f => {
        const val = getPath(it, f)
        return val != null && String(val).toLowerCase().includes(q)
      })
    })
  })

  const total      = computed(() => items.value.length)
  const hasData    = computed(() => items.value.length > 0)
  const hasResults = computed(() => filteredItems.value.length > 0)

  function clearFilters() {
    searchQuery.value  = ''
    statusFilter.value = 'all'
  }

  return {
    items, error, loading, loaded,
    searchQuery, statusFilter, statusOptions, hasStatus,
    filteredItems, total, hasData, hasResults,
    fetchItems, clearFilters,
  }
}