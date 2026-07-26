<template>
  <AppLoader />
  <AppToast />
  <SessionBanner />
  <RouterView />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore }       from '@/modules/auth/store.js'
import { useSessionWatcher }  from '@/composables/useSessionWatcher.js'
import AppLoader    from '@/components/ui/AppLoader.vue'
import AppToast     from '@/components/ui/AppToast.vue'
import SessionBanner from '@/components/ui/SessionBanner.vue'

const authStore = useAuthStore()
const { start, clearTimers } = useSessionWatcher()

onMounted(() => {
  if (authStore.isAuthenticated) start()
})

watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    start()
  } else {
    clearTimers()
  }
})
</script>
