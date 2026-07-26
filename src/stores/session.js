import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const warningVisible  = ref(false)
  const warningMinutes  = ref(5)

  const expiredReason = ref(null)

  function showWarning(minutes = 5) {
    warningMinutes.value = minutes
    warningVisible.value = true
  }

  function hideWarning() {
    warningVisible.value = false
  }

  function setExpiredReason(reason = 'expired') {
    expiredReason.value = reason
  }

  function clearExpiredReason() {
    expiredReason.value = null
  }

  return {
    warningVisible, warningMinutes,
    expiredReason,
    showWarning, hideWarning,
    setExpiredReason, clearExpiredReason,
  }
})
