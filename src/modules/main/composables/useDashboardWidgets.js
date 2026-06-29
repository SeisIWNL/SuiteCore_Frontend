// src/modules/main/composables/useDashboardWidgets.js
import { ref, computed } from 'vue'
import { usePermissionsStore } from '@/stores/permissions.js'
import { dashboardService } from '@/modules/main/services/dashboard.service.js'

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
      id: 'grafana',
      title: 'Paneles de monitoreo',
      subtitle: 'Series en tiempo real · Grafana',
      requires: ['/network', '/infrastructure'],
      kind: 'grafana',
      link: '/network',
    },
    {
      id: 'netbox-ips',
      title: 'Direcciones IP por subred',
      subtitle: 'Distribución del inventario · NetBox',
      requires: ['/inventory'],
      kind: 'netbox',
      link: '/inventory',
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
  const netbox = ref({ data: null, loading: false, error: null })
  const backups = ref({ data: null, loading: false, error: null })
  const grafana = ref({ data: [], loading: false, error: null })

  async function loadNetbox() {
    if (!has('netbox-ips')) return
    netbox.value.loading = true
    netbox.value.error = null
    try {
      netbox.value.data = await dashboardService.getNetboxSummary()
    } catch (err) {
      netbox.value.error = err.message ?? 'Error al cargar datos de NetBox.'
    } finally {
      netbox.value.loading = false
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

  async function loadGrafana() {
    if (!has('grafana')) return
    grafana.value.loading = true
    grafana.value.error = null
    try {
      grafana.value.data = await dashboardService.getGrafanaPanels()
    } catch (err) {
      grafana.value.error = err.message ?? 'Error al cargar paneles de Grafana.'
    } finally {
      grafana.value.loading = false
    }
  }

  // Carga todo lo que el usuario tenga permitido, en paralelo
  async function loadAll() {
    await Promise.all([loadNetbox(), loadBackups(), loadGrafana()])
  }

  return {
    visibleWidgets, hasWidgets, has,
    netbox, backups, grafana,
    loadAll, loadNetbox, loadBackups, loadGrafana,
  }
}