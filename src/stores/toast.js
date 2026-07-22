// src/stores/toast.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Notificaciones tipo "toast" — mensajes flotantes de éxito/error/info que
 * aparecen brevemente y se auto-descartan. Se muestran vía <AppToast />,
 * montado globalmente en App.vue.
 */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let nextId = 1

  /**
   * @param {object} opts
   * @param {'success'|'error'|'info'} opts.type
   * @param {string} opts.title     - Encabezado corto (ej. "Escaneo iniciado")
   * @param {string} [opts.message] - Detalle opcional
   * @param {number} [opts.duration] - ms antes de auto-cerrar (0 = no se cierra solo)
   */
  function show({ type = 'info', title, message = '', duration = 6000 }) {
    const id = nextId++
    toasts.value.push({ id, type, title, message })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function success(title, message, duration) { return show({ type: 'success', title, message, duration }) }
  function error(title, message, duration)   { return show({ type: 'error',   title, message, duration }) }
  function info(title, message, duration)    { return show({ type: 'info',    title, message, duration }) }

  function dismiss(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, show, success, error, info, dismiss }
})
