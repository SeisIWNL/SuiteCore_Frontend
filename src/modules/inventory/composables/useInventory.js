// src/modules/inventory/composables/useInventory.js
import { ref, reactive, computed } from 'vue'
import { inventoryService, generateSlug } from '@/modules/inventory/services/inventory.service.js'
import { useLoaderStore } from '@/stores/loader.js'

export function useInventory() {
  const loader = useLoaderStore()

  const regions = ref([])
  const error   = ref(null)
  const loading = ref(false)

  // Búsqueda y orden
  const searchQuery = ref('')
  const sortKey = ref('name')
  const sortDir = ref('asc')

  // ── Estado del modal de formulario ──────────────────────────
  // mode: null | 'create' | 'edit'
  const modalMode = ref(null)
  const form = reactive({
    id:          null,
    name:        '',
    slug:        '',
    description: '',
  })
  const formErrors = reactive({})
  const saving     = ref(false)
  // Si el usuario tocó el slug manualmente, dejamos de autogenerarlo
  const slugTouched = ref(false)

  // ── Estado del modal de eliminación ─────────────────────────
  const deleteTarget = ref(null)   // región a eliminar
  const deleting     = ref(false)

  // ── Fetch lista ─────────────────────────────────────────────
  async function fetchRegions() {
    loading.value = true
    error.value   = null
    try {
      loader.show('Cargando inventario...')
      regions.value = await inventoryService.getRegions()
    } catch (err) {
      error.value = err.message ?? 'No se pudo obtener el inventario de NetBox.'
    } finally {
      loading.value = false
      loader.hide()
    }
  }

  // ── Filtrado + orden ────────────────────────────────────────
  const filteredRegions = computed(() => {
    let result = [...regions.value]
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      result = result.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      let av = a[sortKey.value], bv = b[sortKey.value]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir.value === 'asc' ? -1 : 1
      if (av > bv) return sortDir.value === 'asc' ? 1 : -1
      return 0
    })
    return result
  })

  const totalRegions = computed(() => regions.value.length)
  const totalSites   = computed(() =>
    regions.value.reduce((sum, r) => sum + (r.siteCount ?? 0), 0))
  const hasResults = computed(() => filteredRegions.value.length > 0)
  const hasData    = computed(() => regions.value.length > 0)

  function setSort(key) {
    if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    else { sortKey.value = key; sortDir.value = 'asc' }
  }
  function clearSearch() { searchQuery.value = '' }

  // ── Modal: abrir para crear ─────────────────────────────────
  function openCreate() {
    modalMode.value = 'create'
    form.id = null
    form.name = ''
    form.slug = ''
    form.description = ''
    slugTouched.value = false
    _clearFormErrors()
  }

  // ── Modal: abrir para editar ────────────────────────────────
  function openEdit(region) {
    modalMode.value = 'edit'
    form.id = region.id
    form.name = region.name ?? ''
    form.slug = region.slug ?? generateSlug(region.name)
    form.description = region.description ?? ''
    slugTouched.value = true   // en edición no autogeneramos
    _clearFormErrors()
  }

  function closeModal() {
    modalMode.value = null
  }

  // Autogenera slug mientras se escribe el nombre (solo en create)
  function onNameInput() {
    if (!slugTouched.value) {
      form.slug = generateSlug(form.name)
    }
  }
  function onSlugInput() {
    slugTouched.value = true
    form.slug = generateSlug(form.slug)
  }

  function _validateForm() {
    _clearFormErrors()
    let ok = true
    if (!form.name.trim()) { formErrors.name = 'El nombre es requerido.'; ok = false }
    if (!form.slug.trim()) { formErrors.slug = 'El slug es requerido.'; ok = false }
    return ok
  }
  function _clearFormErrors() {
    delete formErrors.name
    delete formErrors.slug
    delete formErrors.general
  }

  // ── Guardar (crear o editar) ────────────────────────────────
  async function saveRegion() {
    if (!_validateForm()) return false

    saving.value = true
    _clearFormErrors()
    const payload = {
      name:        form.name.trim(),
      slug:        form.slug.trim(),
      description: form.description.trim(),
    }

    try {
      if (modalMode.value === 'create') {
        loader.show('Creando región...')
        await inventoryService.createRegion(payload)
      } else {
        loader.show('Actualizando región...')
        await inventoryService.updateRegion(form.id, payload)
      }
      await fetchRegions()
      closeModal()
      return true
    } catch (err) {
      formErrors.general = err.message ?? 'No se pudo guardar la región.'
      return false
    } finally {
      saving.value = false
      loader.hide()
    }
  }

  // ── Eliminar ────────────────────────────────────────────────
  function confirmDelete(region) {
    deleteTarget.value = region
  }
  function cancelDelete() {
    deleteTarget.value = null
  }
  async function deleteRegion() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
      loader.show('Eliminando región...')
      await inventoryService.deleteRegion(deleteTarget.value.id)
      await fetchRegions()
      deleteTarget.value = null
    } catch (err) {
      error.value = err.message ?? 'No se pudo eliminar la región.'
    } finally {
      deleting.value = false
      loader.hide()
    }
  }

  return {
    // datos
    regions, error, loading,
    searchQuery, sortKey, sortDir,
    filteredRegions, totalRegions, totalSites, hasResults, hasData,
    // tabla
    fetchRegions, setSort, clearSearch,
    // modal form
    modalMode, form, formErrors, saving, slugTouched,
    openCreate, openEdit, closeModal,
    onNameInput, onSlugInput, saveRegion,
    // delete
    deleteTarget, deleting,
    confirmDelete, cancelDelete, deleteRegion,
  }
}
