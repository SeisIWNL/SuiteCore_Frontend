// src/composables/useSessionWatcher.js
//
// Monitorea la expiración del token JWT en segundo plano.
// Se llama UNA sola vez desde App.vue al montar la aplicación.
//
// Lógica:
//  - Lee la fecha de expiración guardada en storage (auth_expires)
//  - Calcula cuánto tiempo falta para que expire
//  - 5 minutos antes → muestra aviso de "sesión por expirar"
//  - Al expirar → cierra sesión y redirige al login con mensaje

import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore }    from '@/modules/auth/store.js'
import { useSessionStore } from '@/stores/session.js'

export function useSessionWatcher() {
  const router       = useRouter()
  const authStore    = useAuthStore()
  const sessionStore = useSessionStore()

  let warningTimer  = null
  let expiredTimer  = null

  function clearTimers() {
    clearTimeout(warningTimer)
    clearTimeout(expiredTimer)
  }

function start() {
  clearTimers()
  if (!authStore.isAuthenticated) return

  const msLeft         = authStore.msUntilExpiry
  const WARN_BEFORE_MS = 5 * 60 * 1000

  if (msLeft <= 0) { handleExpired(); return }

  const warnIn = msLeft - WARN_BEFORE_MS
  if (warnIn > 0) {
    warningTimer = setTimeout(() => {
      sessionStore.showWarning(Math.ceil(WARN_BEFORE_MS / 60000))
    }, warnIn)
  } else {
    // Menos de 5 min restantes al abrir la app
    sessionStore.showWarning(Math.ceil(msLeft / 60000))
  }

  expiredTimer = setTimeout(handleExpired, msLeft)
}

  async function handleExpired() {
    clearTimers()
    await authStore.logout()
    sessionStore.setExpiredReason()
    router.push({ name: 'login' })
  }

  // Reinicia los timers (ej: si el usuario renueva el token)
  function restart() {
    start()
  }

  onUnmounted(clearTimers)

  return { start, restart, clearTimers }
}
