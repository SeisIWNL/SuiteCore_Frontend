// src/modules/main/store.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('main', () => {
  // Sidebar abierto/cerrado — persiste en localStorage
  const sidebarOpen = ref(localStorage.getItem('sidebar') !== 'closed')

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
    localStorage.setItem('sidebar', sidebarOpen.value ? 'open' : 'closed')
  }

  function closeSidebar() {
    sidebarOpen.value = false
    localStorage.setItem('sidebar', 'closed')
  }

  return { sidebarOpen, toggleSidebar, closeSidebar }
})