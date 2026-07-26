import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let nextId = 1

  /**
   * @param {object} opts
   * @param {'success'|'error'|'info'} opts.type
   * @param {string} opts.title     
   * @param {string} [opts.message] 
   * @param {number} [opts.duration] 
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
