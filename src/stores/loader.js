import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoaderStore = defineStore('loader', () => {
  const isLoading = ref(false)
  const message   = ref('Cargando')

  /**
   * @param {string} msg 
   */
  function show(msg = 'Cargando') {
    message.value   = msg
    isLoading.value = true
  }

  function hide() {
    isLoading.value = false
    message.value   = 'Cargando'
  }

  async function wrap(promise, msg = 'Cargando') {
    show(msg)
    try {
      return await promise
    } finally {
      hide()
    }
  }

  return { isLoading, message, show, hide, wrap }
})
