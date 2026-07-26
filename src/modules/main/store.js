import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  const sidebarOpen = ref(localStorage.getItem('sidebar') !== 'closed')

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
    localStorage.setItem('sidebar', sidebarOpen.value ? 'open' : 'closed')
  }
  function closeSidebar() {
    sidebarOpen.value = false
    localStorage.setItem('sidebar', 'closed')
  }
  function openSidebar() {
    sidebarOpen.value = true
    localStorage.setItem('sidebar', 'open')
  }

  return { sidebarOpen, toggleSidebar, closeSidebar, openSidebar }
})
