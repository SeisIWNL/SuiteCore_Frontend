<template>
  <div class="network">

    <!-- Header -->
    <div class="network__head">
      <div>
        <h1 class="network__title">Red y tráfico</h1>
        <p class="network__sub">
          Paneles en tiempo real vía Grafana 
        </p>
      </div>
      <div class="network__head-actions">
        <!-- Último refresh -->
        <span v-if="lastRefresh" class="network__refresh-time">
          Actualizado {{ lastRefresh }}
        </span>
        <!-- Botón recargar -->
        <button
          class="network__btn-refresh"
          :class="{ 'network__btn-refresh--loading': loading }"
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
      <div v-if="error" class="network__error-banner">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <button class="network__error-close" @click="error = null">✕</button>
      </div>
    </Transition>

    <!-- Skeleton global (primera carga sin paneles aún) -->
    <div v-if="loading && !hasPanels" class="panels-grid">
      <div
        v-for="i in 4" :key="i"
        class="panel-skeleton"
      />
    </div>

    <!-- Sin paneles -->
    <div v-else-if="!loading && !hasPanels && !error" class="network__empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="2" width="6" height="6"/>
        <rect x="9" y="16" width="6" height="6"/>
        <rect x="2" y="9" width="6" height="6"/>
        <rect x="16" y="9" width="6" height="6"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <span>No se encontraron paneles configurados en Grafana</span>
      <button class="network__btn-refresh" @click="handleRefresh">Reintentar</button>
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

const {
  panels, error, loading, hasPanels,
  fetchPanels,
  onIframeLoad, onIframeError,
  toggleExpand, isExpanded,
  isPanelLoaded, isPanelError,
} = useGrafanaPanels()

const lastRefresh = ref(null)

async function handleRefresh() {
  await fetchPanels()
  lastRefresh.value = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}

onMounted(handleRefresh)
</script>

<style scoped>
.network { max-width: 1400px; }

/* Header */
.network__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.network__title {
  font-family: var(--font-display);
  font-size: 1.25rem; font-weight: 700;
  color: var(--text-1); letter-spacing: -.3px;
}
.network__sub { font-size: .75rem; color: var(--text-3); margin-top: 4px; }

.network__head-actions {
  display: flex; align-items: center; gap: 12px;
}
.network__refresh-time {
  font-size: .7rem; color: var(--text-3);
}
.network__btn-refresh {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-mono); font-size: .78rem;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.network__btn-refresh:hover:not(:disabled) {
  background: var(--bg-hover); border-color: var(--border-mid);
}
.network__btn-refresh:disabled { opacity: .5; cursor: not-allowed; }
.network__btn-refresh--loading { border-color: var(--accent); }

/* Spin animation para el ícono de refresh */
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Error banner */
.network__error-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; margin-bottom: 16px;
  background: var(--danger-muted);
  border: 1px solid rgba(248,81,73,.25);
  border-radius: var(--radius);
  font-size: .78rem; color: var(--danger);
}
.network__error-close {
  margin-left: auto;
  background: none; border: none;
  color: var(--danger); cursor: pointer; opacity: .7;
}
.network__error-close:hover { opacity: 1; }

/* Empty state */
.network__empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; padding: 60px 20px;
  color: var(--text-3); font-size: .82rem;
  text-align: center;
}

/* Panels grid */
.panels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(560px, 1fr));
  gap: 14px;
}

/* Skeleton cards */
.panel-skeleton {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  height: 520px;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%,100% { opacity: .4; }
  50%      { opacity: .7; }
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 700px) {
  .panels-grid { grid-template-columns: 1fr; }
  .network__head { flex-direction: column; gap: 12px; }
}
</style>
