<template>
  <div class="virt-panel">

    <div class="subtabs">
      <button class="subtab" :class="{ 'subtab--active': sub === 'vms' }" @click="sub = 'vms'">
        Máquinas virtuales
        <span class="subtab__count">{{ vmTotal }}</span>
      </button>
      <button class="subtab" :class="{ 'subtab--active': sub === 'clusters' }" @click="sub = 'clusters'">
        Clústeres
        <span class="subtab__count">{{ clTotal }}</span>
      </button>
    </div>

    <!-- ══════ Máquinas virtuales ══════ -->
    <template v-if="sub === 'vms'">
      <div class="stats">
        <StatChip :value="vmTotal" label="Máquinas virtuales" />
        <StatChip :value="totalVcpus" label="vCPUs asignadas" tone="info" />
        <StatChip :value="formatMB(totalMemory)" label="Memoria asignada" tone="ok" />
      </div>

      <InvToolbar
        v-model:search="vmSearch"
        v-model:statusValue="vmStatus"
        :status-options="vmStatusOptions"
        placeholder="Buscar por nombre, clúster, rol, IP..."
        :shown="vmItems.length"
        :total="vmTotal"
      />

      <ResourceState
        :loading="vmLoading" :error="vmError"
        :has-data="vmHasData" :has-results="vmHasResults"
        empty-text="No hay máquinas virtuales registradas"
        @clear="vmClear"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Máquina virtual</th>
              <th class="tbl__th">Clúster</th>
              <th class="tbl__th">Rol</th>
              <th class="tbl__th">IP primaria</th>
              <th class="tbl__th tbl__th--center">vCPU</th>
              <th class="tbl__th tbl__th--center">Memoria</th>
              <th class="tbl__th tbl__th--center">Disco</th>
              <th class="tbl__th">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="vm in vmItems" :key="vm.id" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ vm.name }}</span></td>
              <td class="tbl__td">{{ vm.cluster?.name || '—' }}</td>
              <td class="tbl__td">{{ vm.role?.name || '—' }}</td>
              <td class="tbl__td">
                <code v-if="primaryIp(vm)" class="mono">{{ primaryIp(vm) }}</code>
                <span v-else class="dash">—</span>
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ vm.vcpus ?? '—' }}</span>
              </td>
              <td class="tbl__td tbl__td--center">{{ formatMB(vm.memory) }}</td>
              <td class="tbl__td tbl__td--center">{{ formatMB(vm.disk) }}</td>
              <td class="tbl__td"><StatusBadge :status="vm.status" /></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

    <!-- ══════ Clústeres ══════ -->
    <template v-else>
      <div class="stats">
        <StatChip :value="clTotal" label="Clústeres" />
        <StatChip :value="totalClVms" label="VMs alojadas" tone="info" />
      </div>

      <InvToolbar
        v-model:search="clSearch"
        v-model:statusValue="clStatus"
        :status-options="clStatusOptions"
        placeholder="Buscar clúster..."
        :shown="clItems.length"
        :total="clTotal"
      />

      <ResourceState
        :loading="clLoading" :error="clError"
        :has-data="clHasData" :has-results="clHasResults"
        empty-text="No hay clústeres registrados"
        @clear="clClear"
      >
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Clúster</th>
              <th class="tbl__th">Tipo</th>
              <th class="tbl__th tbl__th--center">Dispositivos</th>
              <th class="tbl__th tbl__th--center">VMs</th>
              <th class="tbl__th tbl__th--center">vCPUs</th>
              <th class="tbl__th tbl__th--center">Memoria</th>
              <th class="tbl__th">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clItems" :key="c.id" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ c.name }}</span></td>
              <td class="tbl__td">{{ c.type?.name || '—' }}</td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ c.deviceCount ?? 0 }}</span>
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="count-badge">{{ c.virtualMachineCount ?? 0 }}</span>
              </td>
              <td class="tbl__td tbl__td--center">{{ c.allocatedVcpus ?? '—' }}</td>
              <td class="tbl__td tbl__td--center">{{ formatMB(c.allocatedMemory) }}</td>
              <td class="tbl__td"><StatusBadge :status="c.status" /></td>
            </tr>
          </tbody>
        </table>
      </ResourceState>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { inventoryService, formatMB } from '@/modules/inventory/services/inventory.service.js'
import { useNetboxResource } from '@/modules/inventory/composables/useNetboxResource.js'
import InvToolbar    from '@/modules/inventory/components/InvToolbar.vue'
import StatusBadge   from '@/modules/inventory/components/StatusBadge.vue'
import StatChip      from '@/modules/inventory/components/StatChip.vue'
import ResourceState from '@/modules/inventory/components/ResourceState.vue'

const sub = ref('vms')

const {
  items: vmRaw, error: vmError, loading: vmLoading,
  searchQuery: vmSearch, statusFilter: vmStatus, statusOptions: vmStatusOptions,
  filteredItems: vmItems, total: vmTotal, hasData: vmHasData, hasResults: vmHasResults,
  fetchItems: vmFetch, clearFilters: vmClear,
} = useNetboxResource(() => inventoryService.getVirtualMachines(), {
  searchFields: ['name', 'cluster.name', 'role.name', 'site.name', 'primaryIp.address', 'description'],
  loaderMessage: 'Cargando máquinas virtuales...',
})

const {
  items: clRaw, error: clError, loading: clLoading,
  searchQuery: clSearch, statusFilter: clStatus, statusOptions: clStatusOptions,
  filteredItems: clItems, total: clTotal, hasData: clHasData, hasResults: clHasResults,
  fetchItems: clFetch, clearFilters: clClear,
} = useNetboxResource(() => inventoryService.getClusters(), {
  searchFields: ['name', 'type.name', 'description'],
  loaderMessage: 'Cargando clústeres...',
})

// La IP primaria puede venir en primaryIp o primaryIp4
function primaryIp(vm) {
  return vm.primaryIp?.address ?? vm.primaryIp4?.address ?? null
}

const totalVcpus = computed(() =>
  vmRaw.value.reduce((s, vm) => s + (vm.vcpus ?? 0), 0)
)
const totalMemory = computed(() =>
  vmRaw.value.reduce((s, vm) => s + (vm.memory ?? 0), 0)
)
const totalClVms = computed(() =>
  clRaw.value.reduce((s, c) => s + (c.virtualMachineCount ?? 0), 0)
)

onMounted(() => {
  vmFetch()
  clFetch()
})
</script>

<style scoped>
.virt-panel { display: flex; flex-direction: column; }

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
.dash { color: var(--text-3); }
.count-badge {
  font-family: var(--font-mono); font-size: .74rem; font-weight: 700;
  padding: 2px 8px; border-radius: 99px;
  background: var(--bg-3); color: var(--text-2); min-width: 26px; display: inline-block;
}
</style>
