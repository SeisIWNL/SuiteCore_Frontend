// src/modules/backups/composables/useVersionHistory.js
import { ref, computed, unref } from 'vue'
import { backupsService } from '@/modules/backups/services/backups.service.js'
import { useLoaderStore } from '@/stores/loader.js'

/**
 * Maneja el historial de versiones de un dispositivo y la carga
 * de la configuración de cada versión.
 *
 * @param {string | import('vue').Ref<string>} deviceNameRef
 *        Nombre del dispositivo (acepta string o ref reactiva).
 */
export function useVersionHistory(deviceNameRef) {
  const loader = useLoaderStore()
  const getName = () => unref(deviceNameRef)

  // ── Estado: lista de versiones ─────────────────────────────
  const versions        = ref([])
  const versionsError   = ref(null)
  const versionsLoading = ref(false)

  // ── Estado: config de la versión seleccionada ──────────────
  const backup        = ref(null)
  const backupError   = ref(null)
  const backupLoading = ref(false)
  const selectedVersion = ref(null)

  // ── Computeds ──────────────────────────────────────────────
  const hasVersions   = computed(() => versions.value.length > 0)
  const totalVersions = computed(() => versions.value.length)
  const latestVersion = computed(() => versions.value[0] ?? null)

  const isLatestSelected = computed(() =>
    !selectedVersion.value ||
    selectedVersion.value.oid === latestVersion.value?.oid
  )

  const configLines = computed(() =>
    backup.value?.config ? backup.value.config.split('\n') : []
  )
  const lineCount = computed(() => configLines.value.length.toLocaleString('es-PE'))
  const configSize = computed(() => {
    if (!backup.value?.config) return '0 B'
    const bytes = new Blob([backup.value.config]).size
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  })

  // ── Fetch historial ────────────────────────────────────────
  async function fetchVersions() {
    versionsLoading.value = true
    versionsError.value   = null
    versions.value        = []
    try {
      loader.show('Cargando historial de versiones...')
      const result = await backupsService.getDeviceVersions(getName())
      versions.value = result.versions ?? []
    } catch (err) {
      versionsError.value = err.message ?? 'No se pudo obtener el historial de versiones.'
    } finally {
      versionsLoading.value = false
      loader.hide()
    }
  }

  // ── Fetch config de una versión ────────────────────────────
  async function fetchBackup(version = null) {
    backupLoading.value   = true
    backupError.value     = null
    backup.value          = null
    selectedVersion.value = version
    try {
      loader.show(version ? `Cargando versión #${version.num}...` : 'Cargando respaldo actual...')
      const params = version
        ? { oid: version.oid, epoch: version.epoch, num: version.num }
        : {}
      backup.value = await backupsService.getDeviceBackup(getName(), params)
    } catch (err) {
      backupError.value = err.message ?? 'No se pudo obtener la configuración de esta versión.'
    } finally {
      backupLoading.value = false
      loader.hide()
    }
  }

  // Reinicia todo el estado (al cerrar/cambiar de dispositivo)
  function reset() {
    versions.value = []
    versionsError.value = null
    versionsLoading.value = false
    backup.value = null
    backupError.value = null
    backupLoading.value = false
    selectedVersion.value = null
  }

  return {
    versions, versionsError, versionsLoading, hasVersions, totalVersions,
    latestVersion, isLatestSelected,
    backup, backupError, backupLoading, selectedVersion,
    configLines, lineCount, configSize,
    fetchVersions, fetchBackup, reset,
  }
}
