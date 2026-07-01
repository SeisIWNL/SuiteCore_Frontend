<template>
  <div class="dash">

    <!-- Welcome bar -->
    <div class="dash__welcome">
      <div>
        <h1 class="dash__title">
          Bienvenido, <span class="dash__title-name">{{ firstName }}</span>
        </h1>
        <p class="dash__sub">Centro de operaciones de red — estado en tiempo real</p>
      </div>
      <div class="dash__status">
        <span class="dash__status-dot" />
        <span>Todos los sistemas operacionales</span>
      </div>
    </div>

    <!-- Sin widgets para este rol -->
    <div v-if="!hasWidgets" class="dash__empty">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
      </svg>
      <div class="dash__empty-title">No hay paneles disponibles para tu rol</div>
      <p class="dash__empty-sub">
        Tu rol no tiene módulos de monitoreo asignados. Si crees que es un error,
        contacta a un administrador para revisar tus permisos.
      </p>
    </div>

    <!-- Grid de widgets dinámicos -->
    <div v-else class="dash__widgets">

      <!-- Grafana (red / infraestructura) -->
      <GrafanaPanelsWidget
        v-if="has('grafana')"
        :panels="grafana.data"
        :loading="grafana.loading"
        :error="grafana.error"
      />

      <!-- NetBox (inventario) -->
      <NetboxIpsWidget
        v-if="has('netbox-ips')"
        :data="netbox.data"
        :loading="netbox.loading"
        :error="netbox.error"
      />

      <!-- Oxidized (respaldos) -->
      <BackupsStatusWidget
        v-if="has('backups')"
        :data="backups.data"
        :loading="backups.loading"
        :error="backups.error"
      />
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/store.js'
import { useDashboardWidgets } from '@/modules/main/composables/useDashboardWidgets.js'
import GrafanaPanelsWidget from '@/modules/main/components/widgets/GrafanaPanelsWidget.vue'
import NetboxIpsWidget     from '@/modules/main/components/widgets/NetboxIpsWidget.vue'
import BackupsStatusWidget from '@/modules/main/components/widgets/BackupsStatusWidget.vue'

const authStore = useAuthStore()
const firstName = computed(() => authStore.user?.firstName ?? 'Operador')

const {
  hasWidgets, has,
  netbox, backups, grafana,
  loadAll,
} = useDashboardWidgets()

onMounted(loadAll)
</script>

<style scoped>
.dash { max-width: auto; }

/* Welcome */
.dash__welcome {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; margin-bottom: 22px;
}
.dash__title {
  font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 700; color: var(--text-1);
}
.dash__title-name { color: var(--accent); }
.dash__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }
.dash__status {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  font-size: .76rem; color: var(--text-2);
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: 99px; padding: 7px 14px;
}
.dash__status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 8px var(--success);
  animation: pulse 2s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Empty */
.dash__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 70px 24px; text-align: center;
  background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg);
  color: var(--text-3);
}
.dash__empty svg { opacity: .4; }
.dash__empty-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-2); }
.dash__empty-sub { font-size: .82rem; color: var(--text-3); max-width: 420px; line-height: 1.5; }

/* Widgets grid */
.dash__widgets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 860px) {
  .dash__widgets { grid-template-columns: 1fr; }
  .dash__welcome { flex-direction: column; }
}
</style>