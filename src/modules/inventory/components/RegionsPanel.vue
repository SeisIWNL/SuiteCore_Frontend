<template>
  <div class="reg-panel">

    <!-- El endpoint está deshabilitado en el backend -->
    <div v-if="unavailable" class="reg-unavailable">
      <span class="reg-unavailable__ico">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </span>
      <div class="reg-unavailable__title">Regiones no disponible por ahora</div>
      <p class="reg-unavailable__text">
        El endpoint de regiones está temporalmente deshabilitado en el backend.
        En cuanto se reactive, esta pestaña volverá a mostrar el listado sin
        necesidad de cambios.
      </p>
      <button class="reg-unavailable__retry" @click="retry">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reintentar
      </button>
    </div>

    <!-- Si el backend responde, se muestra el listado normal -->
    <template v-else>
      <div class="stats">
        <StatChip :value="total" label="Regiones" />
      </div>

      <InvToolbar
        v-model:search="searchQuery"
        v-model:statusValue="statusFilter"
        :status-options="statusOptions"
        placeholder="Buscar región..."
        :shown="filteredItems.length"
        :total="total"
      />

      <ResourceState
        :loading="loading" :error="null"
        :has-data="hasData" :has-results="hasResults"
        empty-text="No hay regiones registradas"
        @clear="clearFilters"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Región</th>
              <th class="tbl__th">Slug</th>
              <th class="tbl__th tbl__th--center">Sitios</th>
              <th class="tbl__th">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredItems" :key="r.id" class="tbl__tr">
              <td class="tbl__td">
                <div class="icon-cell">
                  <span class="icon-cell__ico">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span class="strong">{{ r.name }}</span>
                </div>
              </td>
              <td class="tbl__td"><code class="mono">{{ r.slug }}</code></td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ r.siteCount ?? 0 }}</span>
              </td>
              <td class="tbl__td"><span class="desc">{{ r.description || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { inventoryService } from '@/modules/inventory/services/inventory.service.js'
import { useNetboxResource } from '@/modules/inventory/composables/useNetboxResource.js'
import InvToolbar    from '@/modules/inventory/components/InvToolbar.vue'
import StatChip      from '@/modules/inventory/components/StatChip.vue'
import ResourceState from '@/modules/inventory/components/ResourceState.vue'

const {
  error, loading, loaded,
  searchQuery, statusFilter, statusOptions,
  filteredItems, total, hasData, hasResults,
  fetchItems, clearFilters,
} = useNetboxResource(() => inventoryService.getRegions(), {
  searchFields: ['name', 'slug', 'description'],
  loaderMessage: 'Cargando regiones...',
})

// Si la llamada falló (endpoint comentado en el backend → 404/405),
// mostramos el estado "no disponible" en vez de un error crudo.
const unavailable = computed(() => !loading.value && !!error.value)

function retry() {
  fetchItems(true)
}

onMounted(() => fetchItems())
</script>

<style scoped>
.reg-unavailable {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 60px 24px; text-align: center;
  background: var(--bg-1); border: 1px dashed var(--border-mid);
  border-radius: var(--radius-lg);
}
.reg-unavailable__ico { color: var(--text-3); opacity: .5; }
.reg-unavailable__title {
  font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-2);
}
.reg-unavailable__text {
  font-size: .82rem; color: var(--text-3); max-width: 440px; line-height: 1.55;
}
.reg-unavailable__retry {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; margin-top: 4px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.reg-unavailable__retry:hover { background: var(--bg-hover); border-color: var(--border-mid); }

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
.mono { font-family: var(--font-mono); font-size: .78rem; color: var(--text-2); }
.desc { font-size: .78rem; color: var(--text-3); }
.count-badge {
  font-family: var(--font-mono); font-size: .74rem; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
  background: var(--bg-3); color: var(--text-2); min-width: 26px; display: inline-block;
}
.icon-cell { display: flex; align-items: center; gap: 9px; }
.icon-cell__ico {
  width: 26px; height: 26px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-muted); color: var(--accent);
}
</style>
