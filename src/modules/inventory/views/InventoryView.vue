<template>
  <div class="inventory">

    <!-- Header -->
    <div class="inventory__head">
      <div>
        <div class="inventory__eyebrow">NETBOX</div>
        <h1 class="inventory__title">Inventario y documentación</h1>
        <p class="inventory__sub">{{ activeTabMeta.subtitle }}</p>
      </div>
    </div>

    <!-- Pestañas -->
    <div class="inventory__tabs">
      <button
        v-for="t in TABS"
        :key="t.key"
        class="inv-tab"
        :class="{ 'inv-tab--active': activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <span class="inv-tab__ico" v-html="t.icon" />
        {{ t.label }}
      </button>
    </div>

    <!-- Contenido -->
    <KeepAlive>
      <DevicesPanel       v-if="activeTab === 'devices'" />
      <VirtualizationPanel v-else-if="activeTab === 'virt'" />
      <PhysicalPanel      v-else-if="activeTab === 'physical'" />
      <IpAddressesPanel   v-else-if="activeTab === 'ips'" />
      <VlansPanel         v-else-if="activeTab === 'vlans'" />
      <ManufacturersPanel v-else-if="activeTab === 'manufacturers'" />
      <RegionsPanel       v-else />
    </KeepAlive>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DevicesPanel        from '@/modules/inventory/components/DevicesPanel.vue'
import VirtualizationPanel from '@/modules/inventory/components/VirtualizationPanel.vue'
import PhysicalPanel       from '@/modules/inventory/components/PhysicalPanel.vue'
import IpAddressesPanel    from '@/modules/inventory/components/IpAddressesPanel.vue'
import VlansPanel          from '@/modules/inventory/components/VlansPanel.vue'
import ManufacturersPanel  from '@/modules/inventory/components/ManufacturersPanel.vue'
import RegionsPanel        from '@/modules/inventory/components/RegionsPanel.vue'

const svg = (paths) =>
  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

const TABS = [
  {
    key: 'devices', label: 'Dispositivos',
    subtitle: 'Equipos, tipos y roles registrados en NetBox',
    icon: svg('<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'),
  },
  {
    key: 'virt', label: 'Virtualización',
    subtitle: 'Máquinas virtuales y clústeres',
    icon: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'),
  },
  {
    key: 'physical', label: 'Infraestructura física',
    subtitle: 'Sitios y racks',
    icon: svg('<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>'),
  },
  {
    key: 'ips', label: 'Direcciones IP',
    subtitle: 'Direccionamiento agrupado por subred',
    icon: svg('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  },
  {
    key: 'vlans', label: 'VLANs',
    subtitle: 'Redes virtuales configuradas',
    icon: svg('<rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/><rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>'),
  },
  {
    key: 'manufacturers', label: 'Fabricantes',
    subtitle: 'Fabricantes de los equipos inventariados',
    icon: svg('<path d="M2 20h20M4 20V8l5 3V8l5 3V8l5 3v9"/>'),
  },
  //{
  //  key: 'regions', label: 'Regiones',
  //  subtitle: 'Regiones geográficas del inventario',
  //  icon: svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  //},
]

const activeTab = ref('devices')

const activeTabMeta = computed(() =>
  TABS.find(t => t.key === activeTab.value) ?? TABS[0]
)
</script>

<style scoped>
.inventory { max-width: 1200px; }

.inventory__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 18px;
}
.inventory__eyebrow {
  font-family: var(--font-mono);
  font-size: .64rem; font-weight: 700; color: var(--accent);
  letter-spacing: .12em; margin-bottom: 6px;
}
.inventory__title {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700; color: var(--text-1);
}
.inventory__sub { font-size: .8rem; color: var(--text-3); margin-top: 5px; }
.inventory__ro {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 5px 11px; border-radius: 99px;
  background: var(--bg-3); color: var(--text-3);
  font-family: var(--font-mono); font-size: .66rem; font-weight: 600;
}

.inventory__tabs {
  display: flex; gap: 4px; margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}
.inv-tab {
  display: flex; align-items: center; gap: 7px; white-space: nowrap;
  padding: 10px 14px; background: none; border: none;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  color: var(--text-3); font-family: var(--font-sans);
  font-size: .84rem; font-weight: 600; cursor: pointer;
  transition: color .12s, border-color .12s;
}
.inv-tab:hover { color: var(--text-1); }
.inv-tab--active { color: var(--accent); border-bottom-color: var(--accent); }
.inv-tab__ico { display: flex; }

@media (max-width: 720px) {
  .inventory__head { flex-direction: column; }
}
</style>
