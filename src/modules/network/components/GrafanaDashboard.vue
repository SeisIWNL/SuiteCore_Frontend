<template>
  <div class="gdash" :class="{ 'gdash--expanded': expanded }">

    <!-- Header -->
    <div class="gdash__head">
      <div class="gdash__meta">
        <span class="gdash__icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
          </svg>
        </span>
        <span class="gdash__title">{{ panel.title }}</span>
        <span
          class="gdash__status"
          :class="{
            'gdash__status--loading': !loaded && !hasError,
            'gdash__status--ok':      loaded && !hasError,
            'gdash__status--error':   hasError,
          }"
        >
          {{ hasError ? 'Error' : loaded ? 'Live' : 'Cargando' }}
        </span>
      </div>

      <div class="gdash__actions">
        <a :href="panel.url" target="_blank" rel="noopener noreferrer"
          class="gdash__btn" title="Abrir en Grafana">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <button class="gdash__btn" @click="$emit('toggle-expand')"
          :title="expanded ? 'Contraer' : 'Expandir'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <template v-if="!expanded">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </template>
            <template v-else>
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="3" y2="21"/><line x1="14" y1="10" x2="21" y2="3"/>
            </template>
          </svg>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="gdash__body">
      <!-- Skeleton -->
      <div v-if="!loaded && !hasError" class="gdash__skeleton">
        <div class="sk-bar" style="width:40%;height:10px"/>
        <div class="sk-bar" style="width:100%;height:calc(100% - 60px);margin-top:14px"/>
      </div>

      <!-- Error -->
      <div v-if="hasError" class="gdash__error">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>No se pudo cargar el dashboard de Grafana</span>
        <span class="gdash__error-sub">Verifica que Grafana esté disponible en la red</span>
      </div>

      <!-- Iframe -->
      <iframe
        :src="panel.url"
        :title="panel.title"
        class="gdash__iframe"
        :class="{ 'gdash__iframe--hidden': !loaded }"
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
  panel:    { type: Object,  required: true },   // { id, title, url }
  loaded:   { type: Boolean, default: false },
  hasError: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
})
defineEmits(['toggle-expand', 'iframe-load', 'iframe-error'])
</script>

<style scoped>
.gdash {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
  display: flex; flex-direction: column;
  transition: border-color .15s, box-shadow .15s;
}
.gdash:hover { border-color: var(--border-mid); }
.gdash--expanded { grid-column: 1 / -1; border-color: var(--accent); }

.gdash__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.gdash__meta { display: flex; align-items: center; gap: 9px; min-width: 0; }
.gdash__icon {
  width: 26px; height: 26px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-muted); color: var(--accent);
}
.gdash__title {
  font-family: var(--font-display); font-size: .86rem; font-weight: 700; color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gdash__status {
  font-size: .6rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 99px; flex-shrink: 0;
}
.gdash__status--loading { background: var(--bg-3); color: var(--text-3); animation: blink 1.2s ease infinite; }
.gdash__status--ok { background: var(--success-muted); color: var(--success); }
.gdash__status--error { background: var(--danger-muted); color: var(--danger); }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }

.gdash__actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.gdash__btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-3); cursor: pointer; text-decoration: none;
  transition: color .12s, background .12s, border-color .12s;
}
.gdash__btn:hover { color: var(--text-1); background: var(--bg-hover); border-color: var(--border-mid); }

/* Body — más alto porque son dashboards completos */
.gdash__body { position: relative; flex: 1; min-height: 520px; }
.gdash--expanded .gdash__body { min-height: 760px; }

.gdash__skeleton { position: absolute; inset: 0; padding: 18px; display: flex; flex-direction: column; }
.sk-bar { background: var(--bg-3); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

.gdash__error {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; color: var(--text-3); text-align: center; padding: 20px;
}
.gdash__error svg { color: var(--danger); opacity: .6; }
.gdash__error-sub { font-size: .72rem; color: var(--text-3); }

.gdash__iframe { width: 100%; height: 100%; border: none; display: block; background: transparent; }
.gdash__iframe--hidden { opacity: 0; }

@media (max-width: 700px) {
  .gdash__body { min-height: 400px; }
}
</style>
