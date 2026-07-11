<template>
  <div class="infra">

    <!-- Header -->
    <div class="infra__head">
      <div>
        <h1 class="infra__title">Supervisión de infraestructura</h1>
        <p class="infra__sub">Paneles en tiempo real vía Grafana</p>
      </div>
      <div class="infra__head-actions">
        <span v-if="lastRefresh" class="infra__refresh-time">Actualizado {{ lastRefresh }}</span>
        <button
          class="infra__btn-refresh"
          :class="{ 'infra__btn-refresh--loading': loading }"
          :disabled="loading"
          @click="handleRefresh"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"
            :class="{ 'spin': loading }">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Actualizar
        </button>
      </div>
    </div>

    <!-- Error global -->
    <Transition name="fade">
      <div v-if="error" class="infra__error-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <button class="infra__error-close" @click="error = null">✕</button>
      </div>
    </Transition>

    <!-- Skeleton primera carga -->
    <div v-if="loading && !hasPanels" class="panels-grid">
      <div v-for="i in 4" :key="i" class="panel-skeleton" />
    </div>

    <!-- Sin paneles -->
    <div v-else-if="!loading && !hasPanels && !error" class="infra__empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
      <span>No se encontraron paneles de infraestructura configurados en Grafana</span>
      <button class="infra__btn-refresh" @click="handleRefresh">Reintentar</button>
    </div>

    <!-- Grid de dashboards -->
    <div v-else class="panels-grid">
      <GrafanaDashboard
        v-for="panel in panels"
        :key="panel.id"
        :panel="panel"
        :loaded="isPanelLoaded(panel.id)"
        :has-error="isPanelError(panel.id)"
        :expanded="isExpanded(panel.id)"
        @toggle-expand="toggleExpand(panel.id)"
        @iframe-load="onIframeLoad(panel.id)"
        @iframe-error="onIframeError(panel.id)"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GrafanaDashboard    from '@/modules/network/components/GrafanaDashboard.vue'
import { useGrafanaPanels } from '@/modules/network/composables/useGrafanaPanels.js'
import { GRAFANA_CATEGORY } from '@/services/grafana.service.js'

const {
  panels, error, loading, hasPanels,
  fetchPanels,
  onIframeLoad, onIframeError,
  toggleExpand, isExpanded,
  isPanelLoaded, isPanelError,
} = useGrafanaPanels(GRAFANA_CATEGORY.INFRASTRUCTURE)

const lastRefresh = ref(null)

async function handleRefresh() {
  await fetchPanels()
  lastRefresh.value = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

onMounted(handleRefresh)
</script>

<style scoped>
.infra { max-width: 1400px; }

.infra__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.infra__title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--text-1); letter-spacing: -.3px; }
.infra__sub { font-size: .75rem; color: var(--text-3); margin-top: 4px; }

.infra__head-actions { display: flex; align-items: center; gap: 12px; }
.infra__refresh-time { font-size: .7rem; color: var(--text-3); }
.infra__btn-refresh {
  display: flex; align-items: center; gap: 6px; padding: 7px 14px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-mono); font-size: .78rem;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.infra__btn-refresh:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-mid); }
.infra__btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
.infra__btn-refresh--loading { border-color: var(--accent); }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.infra__error-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; margin-bottom: 16px;
  background: var(--danger-muted); border: 1px solid rgba(248,81,73,.25);
  border-radius: var(--radius); font-size: .78rem; color: var(--danger);
}
.infra__error-close { margin-left: auto; background: none; border: none; color: var(--danger); cursor: pointer; opacity: .7; }
.infra__error-close:hover { opacity: 1; }

.infra__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 60px 20px; color: var(--text-3); font-size: .82rem; text-align: center;
}

.panels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(560px, 1fr)); gap: 14px; }
.panel-skeleton {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); height: 520px; animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0%,100% { opacity: .4; } 50% { opacity: .7; } }

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 700px) {
  .panels-grid { grid-template-columns: 1fr; }
  .infra__head { flex-direction: column; gap: 12px; }
}
</style>
