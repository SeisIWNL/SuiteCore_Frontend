<template>
  <div class="dev-panel">

    <!-- Sub-pestañas -->
    <div class="subtabs">
      <button
        v-for="t in SUBTABS"
        :key="t.key"
        class="subtab"
        :class="{ 'subtab--active': sub === t.key }"
        @click="sub = t.key"
      >
        {{ t.label }}
        <span class="subtab__count">{{ countOf(t.key) }}</span>
      </button>
    </div>

    <!-- ══════ Dispositivos ══════ -->
    <template v-if="sub === 'devices'">
      <div class="stats">
        <StatChip :value="devTotal" label="Dispositivos" />
        <StatChip :value="rackedCount" label="En rack" tone="ok" />
      </div>

      <InvToolbar
        v-model:search="devSearch"
        v-model:statusValue="devStatus"
        :status-options="devStatusOptions"
        placeholder="Buscar por nombre, modelo, rol, sitio..."
        :shown="devItems.length"
        :total="devTotal"
      />

      <ResourceState
        :loading="devLoading"
        :error="devError"
        :has-data="devHasData"
        :has-results="devHasResults"
        empty-text="No hay dispositivos registrados en NetBox"
        @clear="devClear()"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Dispositivo</th>
              <th class="tbl__th">Modelo</th>
              <th class="tbl__th">Rol</th>
              <th class="tbl__th">Sitio</th>
              <th class="tbl__th">Rack</th>
              <th class="tbl__th">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in devItems" :key="d.id" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ d.name || '—' }}</span></td>
              <td class="tbl__td"><code class="mono">{{ d.deviceType?.model || '—' }}</code></td>
              <td class="tbl__td">{{ d.role?.name || '—' }}</td>
              <td class="tbl__td">{{ d.site?.name || '—' }}</td>
              <td class="tbl__td">
                <span v-if="d.rack?.name" class="mono">{{ d.rack.name }}</span>
                <span v-else class="dash">—</span>
              </td>
              <td class="tbl__td"><StatusBadge :status="d.status" /></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

    <!-- ══════ Tipos de dispositivo ══════ -->
    <template v-else-if="sub === 'types'">
      <div class="stats">
        <StatChip :value="typTotal" label="Tipos de dispositivo" />
      </div>

      <InvToolbar
        v-model:search="typSearch"
        v-model:statusValue="typStatus"
        :status-options="typStatusOptions"
        placeholder="Buscar por modelo o fabricante..."
        :shown="typItems.length"
        :total="typTotal"
      />

      <ResourceState
        :loading="typLoading"
        :error="typError"
        :has-data="typHasData"
        :has-results="typHasResults"
        empty-text="No hay tipos de dispositivo registrados"
        @clear="typClear()"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Modelo</th>
              <th class="tbl__th">Fabricante</th>
              <th class="tbl__th tbl__th--center">Altura (U)</th>
              <th class="tbl__th">Airflow</th>
              <th class="tbl__th tbl__th--center">Dispositivos</th>
              <th class="tbl__th">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in typItems" :key="t.id" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ t.model || '—' }}</span></td>
              <td class="tbl__td">
                <code class="mono">{{ t.manufacturer?.slug || '—' }}</code>
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="u-badge">{{ t.uHeight ?? 0 }}U</span>
              </td>
              <td class="tbl__td">{{ t.airflow?.label || '—' }}</td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ t.deviceCount ?? 0 }}</span>
              </td>
              <td class="tbl__td"><span class="desc">{{ t.description || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

    <!-- ══════ Roles de dispositivo ══════ -->
    <template v-else>
      <div class="stats">
        <StatChip :value="rolTotal" label="Roles" />
        <StatChip :value="vmRolesCount" label="Roles de VM" tone="info" />
      </div>

      <InvToolbar
        v-model:search="rolSearch"
        v-model:statusValue="rolStatus"
        :status-options="rolStatusOptions"
        placeholder="Buscar rol..."
        :shown="rolItems.length"
        :total="rolTotal"
      />

      <ResourceState
        :loading="rolLoading"
        :error="rolError"
        :has-data="rolHasData"
        :has-results="rolHasResults"
        empty-text="No hay roles de dispositivo registrados"
        @clear="rolClear()"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Rol</th>
              <th class="tbl__th">Slug</th>
              <th class="tbl__th tbl__th--center">Dispositivos</th>
              <th class="tbl__th tbl__th--center">VMs</th>
              <th class="tbl__th tbl__th--center">Rol de VM</th>
              <th class="tbl__th">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rolItems" :key="r.id" class="tbl__tr">
              <td class="tbl__td">
                <div class="role-cell">
                  <span class="role-dot" :style="{ background: '#' + (r.color || '888888') }" />
                  <span class="strong">{{ r.name }}</span>
                </div>
              </td>
              <td class="tbl__td"><code class="mono">{{ r.slug }}</code></td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ r.deviceCount ?? 0 }}</span>
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ r.virtualMachineCount ?? 0 }}</span>
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="yn" :class="r.vmRole ? 'yn--yes' : 'yn--no'">
                  {{ r.vmRole ? 'Sí' : 'No' }}
                </span>
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
import { ref, computed, onMounted } from 'vue'
import { inventoryService } from '@/modules/inventory/services/inventory.service.js'
import { useNetboxResource } from '@/modules/inventory/composables/useNetboxResource.js'
import InvToolbar    from '@/modules/inventory/components/InvToolbar.vue'
import StatusBadge   from '@/modules/inventory/components/StatusBadge.vue'
import StatChip      from '@/modules/inventory/components/StatChip.vue'
import ResourceState from '@/modules/inventory/components/ResourceState.vue'

const SUBTABS = [
  { key: 'devices', label: 'Dispositivos' },
  { key: 'types',   label: 'Tipos' },
  { key: 'roles',   label: 'Roles' },
]

const sub = ref('devices')

const {
  items: devRaw, error: devError, loading: devLoading,
  searchQuery: devSearch, statusFilter: devStatus, statusOptions: devStatusOptions,
  filteredItems: devItems, total: devTotal, hasData: devHasData, hasResults: devHasResults,
  fetchItems: devFetch, clearFilters: devClear,
} = useNetboxResource(() => inventoryService.getDevices(), {
  searchFields: ['name', 'deviceType.model', 'role.name', 'site.name', 'rack.name'],
  loaderMessage: 'Cargando dispositivos...',
})

const {
  error: typError, loading: typLoading,
  searchQuery: typSearch, statusFilter: typStatus, statusOptions: typStatusOptions,
  filteredItems: typItems, total: typTotal, hasData: typHasData, hasResults: typHasResults,
  fetchItems: typFetch, clearFilters: typClear,
} = useNetboxResource(() => inventoryService.getDeviceTypes(), {
  searchFields: ['model', 'slug', 'manufacturer.slug', 'description'],
  loaderMessage: 'Cargando tipos de dispositivo...',
})

const {
  items: rolRaw, error: rolError, loading: rolLoading,
  searchQuery: rolSearch, statusFilter: rolStatus, statusOptions: rolStatusOptions,
  filteredItems: rolItems, total: rolTotal, hasData: rolHasData, hasResults: rolHasResults,
  fetchItems: rolFetch, clearFilters: rolClear,
} = useNetboxResource(() => inventoryService.getDeviceRoles(), {
  searchFields: ['name', 'slug', 'description'],
  loaderMessage: 'Cargando roles...',
})

const rackedCount  = computed(() => devRaw.value.filter(d => d.rack?.name).length)
const vmRolesCount = computed(() => rolRaw.value.filter(r => r.vmRole).length)

function countOf(key) {
  if (key === 'devices') return devTotal.value
  if (key === 'types')   return typTotal.value
  return rolTotal.value
}

onMounted(() => {
  devFetch()
  typFetch()
  rolFetch()
})
</script>

<style scoped>
.dev-panel { display: flex; flex-direction: column; }

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

/* Tabla */
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
.yn { font-size: .72rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; }
.yn--yes { background: var(--success-muted); color: var(--success); }
.yn--no  { background: var(--bg-3); color: var(--text-3); }

.role-cell { display: flex; align-items: center; gap: 8px; }
.role-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
</style>
