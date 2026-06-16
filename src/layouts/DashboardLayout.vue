<template>
  <div class="app-wrapper">
    <TheSidebar />
    <div
      class="app-body"
      :class="{ 'app-body--collapsed': !mainStore.sidebarOpen }"
    >
      <TheNavbar />
      <div
        v-if="isMobile && mainStore.sidebarOpen"
        class="app-overlay"
        @click="mainStore.closeSidebar()"
      />
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

// ── Ajusta estas rutas a donde tengas los archivos físicamente ──
import TheSidebar from '@/components/TheSidebar.vue'
import TheNavbar  from '@/components/TheNavbar.vue'

import { useMainStore } from '@/modules/main/store.js'

const mainStore = useMainStore()
const isMobile  = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) mainStore.closeSidebar()
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app-wrapper {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  width: 100%;        /* ← agrega esto */
  overflow-x: hidden; /* ← y esto */
}
.app-body {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left .22s cubic-bezier(.4,0,.2,1);
  min-width: 0;        /* ← esta línea */
  overflow-x: hidden;  /* ← y esta */
}

/* Debe coincidir con el width colapsado del sidebar */
.app-body--collapsed {
  margin-left: 56px;
}

.app-main {
  margin-top: 56px;
  padding: 24px;
  flex: 1;
  /* Importante: evita que el contenido empuje el layout */
  min-width: 0;
}

.app-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 99;
}

.page-enter-active, .page-leave-active {
  transition: opacity .18s, transform .18s;
}
.page-enter-from, .page-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>