<template>
  <button
    class="theme-toggle"
    :title="themeStore.isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
    @click="themeStore.toggleTheme()"
  >
    <!-- Sol (tema claro activo) -->
    <Transition name="theme-icon" mode="out-in">
      <svg v-if="themeStore.isDark" key="moon" width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
      <svg v-else key="sun" width="15" height="15" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    </Transition>
  </button>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme.js'
const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  background: none; border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-2);
  cursor: pointer; transition: background .12s, color .12s, border-color .12s;
}
.theme-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-1);
  border-color: var(--border-mid);
}

.theme-icon-enter-active, .theme-icon-leave-active { transition: opacity .15s, transform .15s; }
.theme-icon-enter-from { opacity: 0; transform: rotate(-30deg) scale(.8); }
.theme-icon-leave-to   { opacity: 0; transform: rotate(30deg)  scale(.8); }
</style>
