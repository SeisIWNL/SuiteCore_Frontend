<template>
  <header class="navbar" :class="{ 'navbar--expanded': !mainStore.sidebarOpen }">

    <!-- Izquierda: breadcrumb -->
    <div class="navbar__left">
      <span class="navbar__page-title">{{ currentTitle }}</span>
    </div>

    <!-- Derecha: usuario -->
    <div class="navbar__right">
      <!-- Nombre y avatar -->
      <div class="navbar__user" @click="toggleMenu" ref="userRef">
        <div class="navbar__avatar">{{ authStore.userInitials || 'US' }}</div>
        <div class="navbar__user-info">
          <span class="navbar__user-name">{{ fullName }}</span>
          <span class="navbar__user-role">{{ user?.username ?? '' }}</span>
        </div>
        <span class="navbar__caret">▾</span>
      </div>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div v-if="menuOpen" class="navbar__dropdown">
          <div class="navbar__dropdown-header">
            <div class="navbar__avatar navbar__avatar--lg">{{ authStore.userInitials || 'US' }}</div>
            <div>
              <div class="navbar__dropdown-name">{{ fullName }}</div>
              <div class="navbar__dropdown-email">{{ user?.username ?? '' }}</div>
            </div>
          </div>
          <div class="navbar__dropdown-divider" />
          <button class="navbar__dropdown-item navbar__dropdown-item--danger" @click="handleLogout">
            🚪 Cerrar sesión
          </button>
        </div>
      </Transition>
    </div>

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store.js'
import { useMainStore } from '@/modules/main/store.js'

const authStore = useAuthStore()
const mainStore = useMainStore()
const route     = useRoute()
const router    = useRouter()

const menuOpen = ref(false)
const userRef  = ref(null)

const user     = computed(() => authStore.user)
const fullName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
})

const currentTitle = computed(() => route.meta?.title ?? 'Dashboard')

function toggleMenu() { menuOpen.value = !menuOpen.value }

// Cierra el dropdown al hacer click fuera
function handleOutsideClick(e) {
  if (userRef.value && !userRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}
onMounted(()  => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.navbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8eaf0;
  box-shadow: 0 1px 4px rgba(0,21,41,.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 16px;
  position: fixed;
  top: 0;
  left: 220px;  /* mismo ancho que el sidebar */
  right: 0;
  z-index: 99;
  transition: left .25s ease;
}
.navbar--expanded { left: 56px; }

/* Izquierda */
.navbar__page-title { font-size: .95rem; font-weight: 700; color: #2c3e50; }

/* Usuario */
.navbar__right { position: relative; }
.navbar__user {
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background .15s;
}
.navbar__user:hover { background: #f5f7fa; }

.navbar__avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #764ba2);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: .75rem; font-weight: 700;
  flex-shrink: 0;
}
.navbar__avatar--lg { width: 40px; height: 40px; font-size: .85rem; }

.navbar__user-info { display: flex; flex-direction: column; line-height: 1.3; }
.navbar__user-name { font-size: .83rem; font-weight: 600; color: #2c3e50; }
.navbar__user-role { font-size: .72rem; color: #909399; }
.navbar__caret { font-size: .7rem; color: #909399; }

/* Dropdown */
.navbar__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 230px;
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  padding: 8px 0;
  z-index: 200;
}
.navbar__dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 8px;
}
.navbar__dropdown-name { font-size: .85rem; font-weight: 600; color: #2c3e50; }
.navbar__dropdown-email { font-size: .75rem; color: #909399; margin-top: 1px; }

.navbar__dropdown-divider { height: 1px; background: #f0f2f5; margin: 6px 0; }

.navbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  background: none;
  border: none;
  font-size: .85rem;
  color: #606266;
  cursor: pointer;
  transition: background .15s;
  text-align: left;
}
.navbar__dropdown-item:hover { background: #f5f7fa; }
.navbar__dropdown-item--danger { color: #f56c6c; }
.navbar__dropdown-item--danger:hover { background: #fff0f0; }

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity .15s, transform .15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>