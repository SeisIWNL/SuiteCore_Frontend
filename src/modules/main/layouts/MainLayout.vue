<template>
  <div class="app-wrapper">

    <TheSidebar />

    <div class="main-container" :class="{ 'main-container--collapsed': !mainStore.sidebarOpen }">
      <TheNavbar />

      <!-- Overlay en mobile cuando sidebar está abierto -->
      <div
        v-if="isMobile && mainStore.sidebarOpen"
        class="drawer-overlay"
        @click="mainStore.closeSidebar()"
      />

      <main class="app-main">
        <RouterView />
      </main>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import TheSidebar from '../components/TheSidebar.vue'
import TheNavbar  from '../components/TheNavbar.vue'
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
onUnmounted(() => window.removeEventListener('resize', checkMobile))
</script>

<style scoped>
.app-wrapper {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

/* Contenido principal — se desplaza según el ancho del sidebar */
.main-container {
  flex: 1;
  margin-left: 220px;
  transition: margin-left .25s ease;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-container--collapsed { margin-left: 56px; }

/* Área de contenido — debajo del navbar */
.app-main {
  margin-top: 56px; /* altura del navbar */
  padding: 20px;
  flex: 1;
}

/* Overlay mobile */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  z-index: 99;
}
</style>