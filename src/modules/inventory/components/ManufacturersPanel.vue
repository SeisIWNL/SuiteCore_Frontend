<template>
  <div class="mfr-panel">
    <div class="stats">
      <StatChip :value="total" label="Fabricantes" />
    </div>

    <InvToolbar
      v-model:search="searchQuery"
      v-model:statusValue="statusFilter"
      :status-options="statusOptions"
      placeholder="Buscar fabricante..."
      :shown="filteredItems.length"
      :total="total"
    />

    <ResourceState
      :loading="loading" :error="error"
      :has-data="hasData" :has-results="hasResults"
      empty-text="No hay fabricantes registrados en NetBox"
      @clear="clearFilters"
    >
      <table class="tbl">
        <thead>
          <tr>
            <th class="tbl__th">Fabricante</th>
            <th class="tbl__th">Slug</th>
            <th class="tbl__th">Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in filteredItems" :key="m.id" class="tbl__tr">
            <td class="tbl__td">
              <div class="icon-cell">
                <span class="icon-cell__ico">{{ initials(m.name) }}</span>
                <span class="strong">{{ m.name }}</span>
              </div>
            </td>
            <td class="tbl__td"><code class="mono">{{ m.slug }}</code></td>
            <td class="tbl__td"><span class="desc">{{ m.description || '—' }}</span></td>
          </tr>
        </tbody>
      </table>
    </ResourceState>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { inventoryService } from '@/modules/inventory/services/inventory.service.js'
import { useNetboxResource } from '@/modules/inventory/composables/useNetboxResource.js'
import InvToolbar    from '@/modules/inventory/components/InvToolbar.vue'
import StatChip      from '@/modules/inventory/components/StatChip.vue'
import ResourceState from '@/modules/inventory/components/ResourceState.vue'
import { useLoaderStore } from '@/stores/loader.js'

const loader = useLoaderStore()

const {
  error, loading,
  searchQuery, statusFilter, statusOptions,
  filteredItems, total, hasData, hasResults,
  fetchItems, clearFilters,
} = useNetboxResource(() => inventoryService.getManufacturers(), {
  searchFields: ['name', 'slug', 'description'],
  loaderMessage: 'Cargando fabricantes...',
})

function initials(name) {
  return (name ?? '').trim().slice(0, 2).toUpperCase() || '··'
}

onMounted(() => fetchItems())

function refresh() {
  loader.show('Actualizando fabricantes...')
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
.tbl__tr:hover { background: var(--bg-2); }
.tbl__td { padding: 10px 14px; font-size: .82rem; color: var(--text-1); border-bottom: 1px solid var(--border); }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }

.strong { font-weight: 600; color: var(--text-1); }
.mono { font-family: var(--font-mono); font-size: .78rem; color: var(--text-2); }
.desc { font-size: .78rem; color: var(--text-3); }

.icon-cell { display: flex; align-items: center; gap: 9px; }
.icon-cell__ico {
  width: 28px; height: 28px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-muted); color: var(--accent);
  font-family: var(--font-mono); font-size: .68rem; font-weight: 700;
}
</style>