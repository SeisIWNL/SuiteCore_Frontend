// src/modules/main/composables/useDashboardWidgets.js
import { ref, computed } from 'vue'
import { usePermissionsStore } from '@/stores/permissions.js'
import { dashboardService } from '@/modules/main/services/dashboard.service.js'
import { incidentsService } from '@/modules/main/services/incidents.service.js'

/**
 * Decide qué widgets del dashboard mostrar según los módulos permitidos
 * del usuario (allowedSlugs) y carga los datos de cada uno bajo demanda.
 *
 * Cada widget declara `requires`: lista de slugs; se muestra si el usuario
 * tiene acceso a AL MENOS UNO de ellos.
 */
export function useDashboardWidgets() {
  const perms = usePermissionsStore()

  // Catálogo de widgets disponibles
  const WIDGETS = [
    {
      id: 'incidents',
      title: 'Últimos incidentes',
      subtitle: 'Eventos recientes · Graylog',
      requires: ['/alerts', '/logs', '/dashboard'],
      kind: 'incidents',
      link: '/alerts',
    },
    {
      id: 'backups',
      title: 'Estado de respaldos',
      subtitle: 'Último respaldo por dispositivo · Oxidized',
      requires: ['/backups'],
      kind: 'backups',
      link: '/backups',
    },
  ]

  // Widgets visibles para este usuario
  const visibleWidgets = computed(() =>
    WIDGETS.filter(w => w.requires.some(slug => perms.canAccess(slug)))
  )

  const hasWidgets = computed(() => visibleWidgets.value.length > 0)
  const has = (id) => visibleWidgets.value.some(w => w.id === id)

  // ── Datos por fuente ───────────────────────────────────────
  const incidents = ref({ data: null, loading: false, error: null })
  const backups = ref({ data: null, loading: false, error: null })

  async function loadIncidents() {
    if (!has('incidents')) return
    incidents.value.loading = true
    incidents.value.error = null
    try {
      incidents.value.data = await incidentsService.getEvents()
    } catch (err) {
      incidents.value.error = err.message ?? 'Error al cargar eventos de Graylog.'
    } finally {
      incidents.value.loading = false
    }
  }

  async function loadBackups() {
    if (!has('backups')) return
    backups.value.loading = true
    backups.value.error = null
    try {
      backups.value.data = await dashboardService.getBackupsSummary()
    } catch (err) {
      backups.value.error = err.message ?? 'Error al cargar datos de respaldos.'
    } finally {
      backups.value.loading = false
    }
  }

  // Carga todo lo que el usuario tenga permitido, en paralelo
  async function loadAll() {
    await Promise.all([loadIncidents(), loadBackups()])
  }

  return {
    visibleWidgets, hasWidgets, has,
    incidents, backups,
    loadAll, loadBackups,
  }
}