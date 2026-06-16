<template>
  <div class="gpanel" :class="{ 'gpanel--expanded': expanded }">

    <!-- Header del panel -->
    <div class="gpanel__head">
      <div class="gpanel__meta">
        <span class="gpanel__id">{{ String(panel.panelId).padStart(2, '0') }}</span>
        <span class="gpanel__name">{{ panel.name }}</span>
        <!-- Indicador de estado -->
        <span
          class="gpanel__status"
          :class="{
            'gpanel__status--loading': !loaded && !hasError,
            'gpanel__status--ok':      loaded && !hasError,
            'gpanel__status--error':   hasError,
          }"
        >
          {{ hasError ? 'Error' : loaded ? 'Live' : 'Cargando' }}
        </span>
      </div>

      <div class="gpanel__actions">
        <!-- Abrir en Grafana -->
        <a
          :href="panel.url"
          target="_blank"
          rel="noopener noreferrer"
          class="gpanel__btn"
          title="Abrir en Grafana"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <!-- Expandir / contraer -->
        <button class="gpanel__btn" @click="$emit('toggle-expand')" :title="expanded ? 'Contraer' : 'Expandir'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <template v-if="!expanded">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </template>
            <template v-else>
              <polyline points="4 14 10 14 10 20"/>
              <polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="3" y2="21"/>
              <line x1="14" y1="10" x2="21" y2="3"/>
            </template>
          </svg>
        </button>
      </div>
    </div>

    <!-- Iframe wrapper -->
    <div class="gpanel__body">

      <!-- Skeleton mientras carga -->
      <div v-if="!loaded && !hasError" class="gpanel__skeleton">
        <div class="gpanel__skeleton-bar" style="width:60%;height:8px"/>
        <div class="gpanel__skeleton-bar" style="width:100%;height:80px;margin-top:10px"/>
        <div class="gpanel__skeleton-bar" style="width:80%;height:8px;margin-top:10px"/>
      </div>

      <!-- Error state -->
      <div v-if="hasError" class="gpanel__error">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>No se pudo cargar el panel de Grafana</span>
        <span class="gpanel__error-sub">Verifica que Grafana esté disponible en la red</span>
      </div>

      <!-- Iframe real -->
      <iframe
        :src="embedUrl"
        :title="panel.name"
        class="gpanel__iframe"
        :class="{ 'gpanel__iframe--hidden': !loaded }"
        frameborder="0"
        allowtransparency="true"
        allow="fullscreen"
        @load="$emit('iframe-load')"
        @error="$emit('iframe-error')"
      />
    </div>

  </div>
</template>

<script setup>
defineProps({
  panel:    { type: Object,  required: true },
  embedUrl: { type: String,  required: true },
  loaded:   { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
})

defineEmits(['toggle-expand', 'iframe-load', 'iframe-error'])
</script>

<style scoped>
.gpanel {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: border-color .15s, box-shadow .15s, grid-column .3s;
}
.gpanel:hover { border-color: var(--border-bright); }
.gpanel--expanded {
  grid-column: 1 / -1;   /* ocupa todo el ancho al expandir */
  border-color: var(--accent);
}

/* Header */
.gpanel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.gpanel__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gpanel__id {
  font-size: .62rem;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: .08em;
  opacity: .7;
}
.gpanel__name {
  font-size: .82rem;
  font-weight: 600;
  color: var(--text-1);
}
.gpanel__status {
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 99px;
}
.gpanel__status--loading {
  background: var(--bg-3);
  color: var(--text-3);
  animation: blink 1.2s ease infinite;
}
.gpanel__status--ok {
  background: var(--accent-muted);
  color: var(--accent);
  border: 1px solid rgba(57,211,83,.15);
}
.gpanel__status--error {
  background: var(--danger-muted);
  color: var(--danger);
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Actions */
.gpanel__actions { display: flex; align-items: center; gap: 4px; }
.gpanel__btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  background: none; border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-3); cursor: pointer;
  text-decoration: none;
  transition: color .12s, background .12s, border-color .12s;
}
.gpanel__btn:hover {
  color: var(--text-1);
  background: var(--bg-hover);
  border-color: var(--border-mid);
}

/* Body */
.gpanel__body {
  position: relative;
  flex: 1;
  min-height: 280px;
}
.gpanel--expanded .gpanel__body { min-height: 500px; }

/* Skeleton */
.gpanel__skeleton {
  position: absolute; inset: 0;
  padding: 16px;
  display: flex; flex-direction: column;
}
.gpanel__skeleton-bar {
  background: var(--bg-3);
  border-radius: 4px;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0%,100% { opacity: .4; }
  50%      { opacity: .8; }
}

/* Error */
.gpanel__error {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px;
  color: var(--danger);
  font-size: .78rem;
}
.gpanel__error-sub { font-size: .68rem; color: var(--text-3); }

/* Iframe */
.gpanel__iframe {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  background: transparent;
  transition: opacity .3s;
}
.gpanel__iframe--hidden { opacity: 0; pointer-events: none; }
</style>
