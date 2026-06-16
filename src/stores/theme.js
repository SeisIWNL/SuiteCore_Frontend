// src/stores/theme.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Lee el tema guardado. Si no hay, usa 'light' por defecto
  const stored = localStorage.getItem('sc_theme') ?? 'light'
  const theme  = ref(stored)

  const isDark  = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

  // Aplica el atributo en el HTML al cambiar
  function applyTheme(value) {
    if (value === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  function setTheme(value) {
    theme.value = value
    localStorage.setItem('sc_theme', value)
    applyTheme(value)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  // Aplica el tema al inicializar el store
  applyTheme(stored)

  // Reactivo: si el ref cambia por cualquier razón, aplica
  watch(theme, applyTheme)

  return { theme, isDark, isLight, setTheme, toggleTheme }
})
