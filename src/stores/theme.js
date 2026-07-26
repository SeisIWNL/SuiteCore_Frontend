import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const stored = localStorage.getItem('sc_theme') ?? 'light'
  const theme  = ref(stored)

  const isDark  = computed(() => theme.value === 'dark')
  const isLight = computed(() => theme.value === 'light')

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

  applyTheme(stored)

  watch(theme, applyTheme)

  return { theme, isDark, isLight, setTheme, toggleTheme }
})
