<template>
  <div class="res-card">
    <!-- Cargando (primera vez) -->
    <div v-if="loading && !hasData" class="res-card__sk">
      <div v-for="i in 5" :key="`sk-${i}`" class="sk-row">
        <span class="skeleton" style="width:100%;height:14px"/>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="res-card__error">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Sin datos en absoluto -->
    <div v-else-if="!hasData" class="res-card__empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
      <span>{{ emptyText }}</span>
    </div>

    <!-- Filtro sin resultados -->
    <div v-else-if="!hasResults" class="res-card__empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span>No se encontraron resultados con esos criterios</span>
      <button class="link-btn" @click="$emit('clear')">Limpiar filtros</button>
    </div>

    <!-- Contenido -->
    <div v-else class="res-card__table">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading:    { type: Boolean, default: false },
  error:      { type: String,  default: null },
  hasData:    { type: Boolean, default: false },
  hasResults: { type: Boolean, default: false },
  emptyText:  { type: String,  default: 'No hay registros' },
})
defineEmits(['clear'])
</script>

<style scoped>
.res-card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.res-card__table { overflow-x: auto; }

.res-card__sk { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.sk-row { display: flex; }
.skeleton {
  border-radius: 4px; background: var(--bg-3);
  animation: shimmer 1.4s ease infinite; display: inline-block;
}
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

.res-card__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; font-size: .82rem; color: var(--danger);
  background: var(--danger-muted);
}
.res-card__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; text-align: center;
  color: var(--text-3); font-size: .84rem;
}
.res-card__empty svg { opacity: .4; }
.link-btn {
  background: none; border: none; cursor: pointer;
  color: var(--accent); font-size: .76rem; font-weight: 600; padding: 0;
}
.link-btn:hover { text-decoration: underline; }
</style>
