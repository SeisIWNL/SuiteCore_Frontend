// src/stores/session.js
//
// Maneja el estado de la alerta de sesión:
//  - warning: "tu sesión expira en X minutos"
//  - expired: "tu sesión ha expirado, vuelve a iniciar sesión"
//
// El LoginView lee `expiredReason` para mostrar el banner al redirigir.

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionStore = defineStore('session', () => {
  // Estado del aviso de "por expirar"
  const warningVisible  = ref(false)
  const warningMinutes  = ref(5)

  // Razón de redirección al login
  // null | 'expired' | 'forced'
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
