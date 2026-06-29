<template>
  <div class="gwidget">
    <div class="gwidget__head">
      <div>
        <div class="gwidget__title">{{ title }}</div>
        <div class="gwidget__sub">{{ subtitle }}</div>
      </div>
      <span class="gwidget__link" @click="$router.push('/network')">Ver red →</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="gwidget__state">
      <div class="spinner" />
      <span>Cargando paneles de Grafana...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="gwidget__state gwidget__state--error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Sin paneles -->
    <div v-else-if="!panels.length" class="gwidget__state">
      <span>No hay paneles de Grafana configurados</span>
    </div>

    <!-- Paneles embebidos (máx 2) -->
    <div v-else class="gwidget__grid">
      <div v-for="panel in shownPanels" :key="panel.panelId" class="gpanel-mini">
        <div class="gpanel-mini__bar">
          <span class="gpanel-mini__id">{{ String(panel.panelId).padStart(2, '0') }}</span>
          <span class="gpanel-mini__name">{{ panel.name }}</span>
          <a :href="panel.url" target="_blank" rel="noopener noreferrer"
            class="gpanel-mini__ext" title="Abrir en Grafana">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <div class="gpanel-mini__frame">
          <iframe
            :src="panel.url"
            frameborder="0"
            loading="lazy"
            class="gpanel-mini__iframe"
          />
        </div>
      </div>
    </div>

    <div v-if="panels.length > maxPanels" class="gwidget__more" @click="$router.push('/network')">
      + {{ panels.length - maxPanels }} paneles más en el módulo de Red
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title:    { type: String, default: 'Paneles de monitoreo' },
  subtitle: { type: String, default: 'Series en tiempo real · Grafana' },
  panels:   { type: Array, default: () => [] },
  loading:  { type: Boolean, default: false },
  error:    { type: String, default: null },
  maxPanels:{ type: Number, default: 2 },
})

const shownPanels = computed(() => props.panels.slice(0, props.maxPanels))
</script>

<style scoped>
.gwidget {
  grid-column: 1 / -1;     /* ocupa toda la fila */
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 18px;
}
.gwidget__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; margin-bottom: 16px;
}
.gwidget__title { font-family: var(--font-display); font-size: .95rem; font-weight: 700; color: var(--text-1); }
.gwidget__sub { font-size: .72rem; color: var(--text-3); margin-top: 3px; }
.gwidget__link { font-size: .72rem; color: var(--accent); white-space: nowrap; cursor: pointer; }
.gwidget__link:hover { text-decoration: underline; }

.gwidget__state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; min-height: 180px; color: var(--text-3); font-size: .82rem; text-align: center;
}
.gwidget__state--error { color: var(--danger); }

.gwidget__grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 14px;
}
.gpanel-mini {
  border: 1px solid var(--border); border-radius: var(--radius);
  overflow: hidden; background: var(--bg-2);
}
.gpanel-mini__bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-bottom: 1px solid var(--border);
}
.gpanel-mini__id {
  font-family: var(--font-mono); font-size: .68rem; font-weight: 700;
  color: var(--accent); background: var(--accent-muted);
  padding: 1px 6px; border-radius: 4px;
}
.gpanel-mini__name { font-size: .78rem; font-weight: 600; color: var(--text-1); flex: 1; }
.gpanel-mini__ext {
  display: flex; color: var(--text-3); transition: color .12s;
}
.gpanel-mini__ext:hover { color: var(--accent); }
.gpanel-mini__frame { height: 200px; background: var(--bg-1); }
.gpanel-mini__iframe { width: 100%; height: 100%; border: none; display: block; }

.gwidget__more {
  margin-top: 12px; text-align: center;
  font-size: .74rem; color: var(--accent); cursor: pointer;
  padding: 8px; border: 1px dashed var(--border); border-radius: var(--radius);
}
.gwidget__more:hover { background: var(--bg-2); }

.spinner {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2.5px solid var(--bg-3); border-top-color: var(--accent);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
