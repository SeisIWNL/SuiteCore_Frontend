<template>
  <AppLoader />
  <SessionBanner />
  <RouterView />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore }       from '@/modules/auth/store.js'
import { useSessionWatcher }  from '@/composables/useSessionWatcher.js'
import AppLoader    from '@/components/ui/AppLoader.vue'
import SessionBanner from '@/components/ui/SessionBanner.vue'

const authStore = useAuthStore()
const { start, clearTimers } = useSessionWatcher()

onMounted(() => {
  // Arranca el watcher solo si el usuario ya está autenticado al cargar
  if (authStore.isAuthenticated) start()
})

// Si el usuario hace login después (en la misma pestaña), arranca el watcher
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    start()
  } else {
    clearTimers()
  }
})
</script>
