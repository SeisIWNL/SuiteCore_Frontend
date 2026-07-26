<template>
  <div class="vlan-panel">
    <div class="stats">
      <StatChip :value="total" label="VLANs" />
      <StatChip :value="activeCount" label="Activas" tone="ok" />
    </div>

    <InvToolbar
      v-model:search="searchQuery"
      v-model:statusValue="statusFilter"
      :status-options="statusOptions"
      placeholder="Buscar por VID, nombre o descripción..."
      :shown="filteredItems.length"
      :total="total"
    />

    <ResourceState
      :loading="loading" :error="error"
      :has-data="hasData" :has-results="hasResults"
      empty-text="No hay VLANs registradas en NetBox"
      @clear="clearFilters"
    >
      <table class="tbl">
        <thead>
          <tr>
            <th class="tbl__th tbl__th--center">VID</th>
            <th class="tbl__th">Nombre</th>
            <th class="tbl__th">Estado</th>
            <th class="tbl__th">Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in filteredItems" :key="v.id" class="tbl__tr">
            <td class="tbl__td tbl__td--center">
              <span class="vid-badge">{{ v.vid }}</span>
            </td>
            <td class="tbl__td">
              <div class="icon-cell">
                <span class="icon-cell__ico">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/>
                    <rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/>
                    <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </span>
                <span class="strong">{{ v.name }}</span>
              </div>
            </td>
            <td class="tbl__td"><StatusBadge :status="v.status" /></td>
            <td class="tbl__td"><span class="desc">{{ v.description || '—' }}</span></td>
          </tr>
        </tbody>
      </table>
    </ResourceState>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { inventoryService } from '@/modules/inventory/services/inventory.service.js'
import { useNetboxResource } from '@/modules/inventory/composables/useNetboxResource.js'
import InvToolbar    from '@/modules/inventory/components/InvToolbar.vue'
import StatusBadge   from '@/modules/inventory/components/StatusBadge.vue'
import StatChip      from '@/modules/inventory/components/StatChip.vue'
import ResourceState from '@/modules/inventory/components/ResourceState.vue'
import { useLoaderStore } from '@/stores/loader.js'

const loader = useLoaderStore()

const {
  items, error, loading,
  searchQuery, statusFilter, statusOptions,
  filteredItems, total, hasData, hasResults,
  fetchItems, clearFilters,
} = useNetboxResource(() => inventoryService.getVlans(), {
  searchFields: ['name', 'vid', 'description'],
  loaderMessage: 'Cargando VLANs...',
})

const activeCount = computed(() =>
  items.value.filter(v => v.status?.value === 'active').length
)

onMounted(() => fetchItems())

function refresh() {
  loader.show('Actualizando VLANs...')
  return fetchItems(true, true).finally(() => loader.hide())
}
defineExpose({ refresh })
</script>

<style scoped>
.stats { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }

.tbl { width: 100%; border-collapse: collapse; }
.tbl__th {
  text-align: left; padding: 10px 14px;
  font-size: .64rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2);
}
.tbl__th--center { text-align: center; }
.tbl__tr:hover { background: var(--bg-2); }
.tbl__td { padding: 10px 14px; font-size: .82rem; color: var(--text-1); border-bottom: 1px solid var(--border); }
.tbl__td--center { text-align: center; }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }

.strong { font-weight: 600; color: var(--text-1); }
.desc { font-size: .78rem; color: var(--text-3); }

.vid-badge {
  font-family: var(--font-mono); font-size: .8rem; font-weight: 700;
  padding: 3px 10px; border-radius: 6px;
  background: var(--accent-muted); color: var(--accent);
}
.icon-cell { display: flex; align-items: center; gap: 9px; }
.icon-cell__ico {
  width: 26px; height: 26px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--blue-muted); color: var(--blue);
}
</style>