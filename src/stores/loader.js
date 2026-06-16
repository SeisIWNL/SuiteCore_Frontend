// src/stores/loader.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoaderStore = defineStore('loader', () => {
  const isLoading = ref(false)
  const message   = ref('Cargando')

  /**
   * Muestra el loader global.
   * @param {string} msg - Texto opcional bajo el logo
   */
  function show(msg = 'Cargando') {
    message.value   = msg
    isLoading.value = true
  }

  function hide() {
    isLoading.value = false
    message.value   = 'Cargando'
  }

  /**
   * Envuelve una promesa mostrando el loader mientras dura.
   * Uso: await loader.wrap(fetchData(), 'Obteniendo datos...')
   */
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
