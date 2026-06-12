<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !mainStore.sidebarOpen }">

    <!-- Logo -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-icon">SC</div>
      <transition name="fade">
        <span v-if="mainStore.sidebarOpen" class="sidebar__logo-name">SuiteCore</span>
      </transition>
    </div>

    <!-- Nav items -->
    <nav class="sidebar__nav">
      <RouterLink
        v-for="route in navRoutes"
        :key="route.path"
        :to="route.path"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': isActive(route.path) }"
        :title="!mainStore.sidebarOpen ? route.meta.title : ''"
      >
        <span class="sidebar__item-icon">{{ route.meta.icon }}</span>
        <transition name="fade">
          <span v-if="mainStore.sidebarOpen" class="sidebar__item-label">
            {{ route.meta.title }}
          </span>
        </transition>
      </RouterLink>
    </nav>

    <!-- Collapse toggle button — al fondo -->
    <button class="sidebar__toggle" @click="mainStore.toggleSidebar">
      <span>{{ mainStore.sidebarOpen ? '◀' : '▶' }}</span>
    </button>

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMainStore } from '@/modules/main/store.js'

const mainStore = useMainStore()
const route     = useRoute()
const router    = useRouter()

// Extrae las rutas hijas del layout que tienen meta.title
const navRoutes = computed(() =>
  router.options.routes
    .find(r => r.path === '/dashboard')
    ?.children ?? []
)

function isActive(path) {
  return route.path === path || (path === '' && route.path === '/dashboard')
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #304156;
  display: flex;
  flex-direction: column;
  transition: width .25s ease;
  flex-shrink: 0;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
}
.sidebar--collapsed { width: 56px; }

/* Logo */
.sidebar__logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: #2b2f3a;
  overflow: hidden;
  flex-shrink: 0;
}
.sidebar__logo-icon {
  width: 32px; height: 32px;
  background: #409eff;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: .72rem; font-weight: 800; color: #fff;
  flex-shrink: 0;
}
.sidebar__logo-name {
  font-size: .95rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  letter-spacing: -.2px;
}

/* Nav */
.sidebar__nav {
  flex: 1;
  padding: 8px 6px;
  overflow-y: auto;
  overflow-x: hidden;
}
.sidebar__nav::-webkit-scrollbar { width: 4px; }
.sidebar__nav::-webkit-scrollbar-thumb { background: #263445; border-radius: 99px; }

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 6px;
  color: #bfcbd9;
  text-decoration: none;
  font-size: .88rem;
  transition: background .15s, color .15s;
  white-space: nowrap;
  overflow: hidden;
  margin-bottom: 2px;
}
.sidebar__item:hover { background: #263445; color: #fff; }
.sidebar__item--active { background: #263445; color: #409eff; font-weight: 600; }

.sidebar__item-icon { font-size: 1.1rem; flex-shrink: 0; width: 24px; text-align: center; }
.sidebar__item-label { overflow: hidden; }

/* Toggle */
.sidebar__toggle {
  height: 44px;
  background: #263445;
  border: none;
  color: #bfcbd9;
  cursor: pointer;
  font-size: .85rem;
  transition: background .15s, color .15s;
  flex-shrink: 0;
}
.sidebar__toggle:hover { background: #1f2d3d; color: #fff; }

/* Fade transition para labels */
.fade-enter-active { transition: opacity .2s .05s; }
.fade-leave-active { transition: opacity .1s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>