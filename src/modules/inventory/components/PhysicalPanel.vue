<template>
  <div class="phys-panel">

    <div class="subtabs">
      <button class="subtab" :class="{ 'subtab--active': sub === 'sites' }" @click="sub = 'sites'">
        Sitios
        <span class="subtab__count">{{ siTotal }}</span>
      </button>
      <button class="subtab" :class="{ 'subtab--active': sub === 'racks' }" @click="sub = 'racks'">
        Racks
        <span class="subtab__count">{{ rkTotal }}</span>
      </button>
    </div>

    <!-- ══════ Sitios ══════ -->
    <template v-if="sub === 'sites'">
      <div class="stats">
        <StatChip :value="siTotal" label="Sitios" />
      </div>

      <InvToolbar
        v-model:search="siSearch"
        v-model:statusValue="siStatus"
        :status-options="siStatusOptions"
        placeholder="Buscar por nombre o instalación..."
        :shown="siItems.length"
        :total="siTotal"
      />

      <ResourceState
        :loading="siLoading" :error="siError"
        :has-data="siHasData" :has-results="siHasResults"
        empty-text="No hay sitios registrados"
        @clear="siClear"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Sitio</th>
              <th class="tbl__th">Slug</th>
              <th class="tbl__th">Instalación</th>
              <th class="tbl__th">Estado</th>
              <th class="tbl__th">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in siItems" :key="s.id" class="tbl__tr">
              <td class="tbl__td">
                <div class="icon-cell">
                  <span class="icon-cell__ico">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
                    </svg>
                  </span>
                  <span class="strong">{{ s.name }}</span>
                </div>
              </td>
              <td class="tbl__td"><code class="mono">{{ s.slug }}</code></td>
              <td class="tbl__td">
                <span v-if="s.facility" class="facility">{{ s.facility }}</span>
                <span v-else class="dash">—</span>
              </td>
              <td class="tbl__td"><StatusBadge :status="s.status" /></td>
              <td class="tbl__td"><span class="desc">{{ s.description || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

    <!-- ══════ Racks ══════ -->
    <template v-else>
      <div class="stats">
        <StatChip :value="rkTotal" label="Racks" />
        <StatChip :value="totalRackDevices" label="Dispositivos alojados" tone="ok" />
      </div>

      <InvToolbar
        v-model:search="rkSearch"
        v-model:statusValue="rkStatus"
        :status-options="rkStatusOptions"
        placeholder="Buscar por nombre o sitio..."
        :shown="rkItems.length"
        :total="rkTotal"
      />

      <ResourceState
        :loading="rkLoading" :error="rkError"
        :has-data="rkHasData" :has-results="rkHasResults"
        empty-text="No hay racks registrados"
        @clear="rkClear"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Rack</th>
              <th class="tbl__th">Sitio</th>
              <th class="tbl__th tbl__th--center">Altura</th>
              <th class="tbl__th tbl__th--center">Ancho</th>
              <th class="tbl__th tbl__th--center">Dispositivos</th>
              <th class="tbl__th tbl__th--center">Ocupación</th>
              <th class="tbl__th">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rkItems" :key="r.id" class="tbl__tr">
              <td class="tbl__td">
                <div class="icon-cell">
                  <span class="icon-cell__ico">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
                      <line x1="8" y1="18" x2="16" y2="18"/>
                    </svg>
                  </span>
                  <span class="strong">{{ r.name }}</span>
                </div>
              </td>
              <td class="tbl__td">{{ r.site?.name || '—' }}</td>
              <td class="tbl__td tbl__td--center">
                <span class="u-badge">{{ r.uHeight ?? 0 }}U</span>
              </td>
              <td class="tbl__td tbl__td--center">
                {{ r.width?.label || (r.width?.value ? r.width.value + '"' : '—') }}
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ r.deviceCount ?? 0 }}</span>
              </td>
              <td class="tbl__td tbl__td--center">
                <div class="occ">
                  <div class="occ__bar">
                    <div class="occ__fill" :class="occTone(occPct(r))" :style="{ width: occPct(r) + '%' }" />
                  </div>
                  <span class="occ__pct">{{ occPct(r) }}%</span>
                </div>
              </td>
              <td class="tbl__td"><StatusBadge :status="r.status" /></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inventoryService } from '@/modules/inventory/services/inventory.service.js'
import { useNetboxResource } from '@/modules/inventory/composables/useNetboxResource.js'
import { useLoaderStore } from '@/stores/loader.js'
import InvToolbar    from '@/modules/inventory/components/InvToolbar.vue'
import StatusBadge   from '@/modules/inventory/components/StatusBadge.vue'
import StatChip      from '@/modules/inventory/components/StatChip.vue'
import ResourceState from '@/modules/inventory/components/ResourceState.vue'

const loader = useLoaderStore()

const sub = ref('sites')

const {
  error: siError, loading: siLoading,
  searchQuery: siSearch, statusFilter: siStatus, statusOptions: siStatusOptions,
  filteredItems: siItems, total: siTotal, hasData: siHasData, hasResults: siHasResults,
  fetchItems: siFetch, clearFilters: siClear,
} = useNetboxResource(() => inventoryService.getSites(), {
  searchFields: ['name', 'slug', 'facility', 'description'],
  loaderMessage: 'Cargando sitios...',
})

const {
  items: rkRaw, error: rkError, loading: rkLoading,
  searchQuery: rkSearch, statusFilter: rkStatus, statusOptions: rkStatusOptions,
  filteredItems: rkItems, total: rkTotal, hasData: rkHasData, hasResults: rkHasResults,
  fetchItems: rkFetch, clearFilters: rkClear,
} = useNetboxResource(() => inventoryService.getRacks(), {
  searchFields: ['name', 'site.name', 'description'],
  loaderMessage: 'Cargando racks...',
})

const totalRackDevices = computed(() =>
  rkRaw.value.reduce((s, r) => s + (r.deviceCount ?? 0), 0)
)

// Ocupación aproximada: dispositivos / unidades disponibles
function occPct(rack) {
  const h = rack.uHeight ?? 0
  if (!h) return 0
  const pct = Math.round(((rack.deviceCount ?? 0) / h) * 100)
  return Math.min(pct, 100)
}
function occTone(pct) {
  if (pct >= 85) return 'occ__fill--danger'
  if (pct >= 60) return 'occ__fill--warn'
  return 'occ__fill--ok'
}

onMounted(() => {
  loader.show('Cargando infraestructura física...')
  Promise.all([siFetch(false, true), rkFetch(false, true)])
    .finally(() => loader.hide())
})

function refresh() {
  loader.show('Actualizando infraestructura física...')
  return Promise.all([siFetch(true, true), rkFetch(true, true)])
    .finally(() => loader.hide())
}
defineExpose({ refresh })
</script>

<style scoped>
.phys-panel { display: flex; flex-direction: column; }

.subtabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.subtab {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 14px; background: none; border: none;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  color: var(--text-3); font-family: var(--font-sans);
  font-size: .82rem; font-weight: 600; cursor: pointer;
  transition: color .12s, border-color .12s;
}
.subtab:hover { color: var(--text-1); }
.subtab--active { color: var(--accent); border-bottom-color: var(--accent); }
.subtab__count {
  font-size: .66rem; font-weight: 700;
  padding: 1px 7px; border-radius: 99px;
  background: var(--bg-3); color: var(--text-3);
}
.subtab--active .subtab__count { background: var(--accent-muted); color: var(--accent); }

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
.dash { color: var(--text-3); }

.icon-cell { display: flex; align-items: center; gap: 9px; }
.icon-cell__ico {
  width: 26px; height: 26px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-muted); color: var(--accent);
}
.facility {
  font-family: var(--font-mono); font-size: .74rem;
  background: var(--bg-3); color: var(--text-2);
  padding: 2px 8px; border-radius: 4px;
}
.u-badge {
  font-family: var(--font-mono); font-size: .72rem; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
  background: var(--blue-muted); color: var(--blue);
}
.count-badge {
  font-family: var(--font-mono); font-size: .74rem; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
  background: var(--bg-3); color: var(--text-2); min-width: 26px; display: inline-block;
}

.occ { display: flex; align-items: center; gap: 8px; justify-content: center; }
.occ__bar { width: 60px; height: 6px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
.occ__fill { height: 100%; border-radius: 99px; transition: width .3s ease; }
.occ__fill--ok     { background: var(--success); }
.occ__fill--warn   { background: var(--warning); }
.occ__fill--danger { background: var(--danger); }
.occ__pct { font-family: var(--font-mono); font-size: .7rem; color: var(--text-3); min-width: 32px; }
</style>