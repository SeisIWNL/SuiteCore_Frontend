<template>
  <header class="navbar" :class="{ 'navbar--collapsed': !mainStore.sidebarOpen }">

    <!-- Izquierda: breadcrumb -->
    <div class="navbar__left">
      <div class="navbar__breadcrumb">
        <span class="navbar__breadcrumb-root">SuiteCore</span>
        <span class="navbar__breadcrumb-sep">/</span>
        <span class="navbar__breadcrumb-page">{{ currentTitle }}</span>
      </div>
    </div>

    <!-- Derecha: acciones + user -->
    <div class="navbar__right">

      <!-- Notificaciones -->
      <button class="navbar__icon-btn" @click="$router.push('/alerts')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="navbar__notif-badge" />
      </button>

      <!-- Alterna tema -->
      <ThemeToggle />

      <!-- Divider -->
      <div class="navbar__vdiv" />

      <!-- Usuario -->
      <div class="navbar__user" ref="userRef" @click="toggleMenu">
        <div class="navbar__user-avatar">{{ authStore.userInitials || 'US' }}</div>
        <div class="navbar__user-info">
          <span class="navbar__user-name">{{ fullName }}</span>
          <span class="navbar__user-role">{{ user?.username }}</span>
        </div>
        <svg class="navbar__user-caret" :class="{ 'navbar__user-caret--open': menuOpen }"
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div v-if="menuOpen" class="navbar__dropdown">
          <div class="navbar__dropdown-user">
            <div class="navbar__dropdown-avatar">{{ authStore.userInitials || 'US' }}</div>
            <div>
              <div class="navbar__dropdown-name">{{ fullName }}</div>
              <div class="navbar__dropdown-username">{{ user?.username }}</div>
            </div>
          </div>
          <div class="navbar__dropdown-sep" />
          <button class="navbar__dropdown-item" @click="$router.push('/settings'); menuOpen = false">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Ajustes de cuenta
          </button>
          <button class="navbar__dropdown-item navbar__dropdown-item--danger" @click="handleLogout">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
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
import { useLoaderStore } from '@/stores/loader.js'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

const authStore = useAuthStore()
const mainStore = useMainStore()
const loader    = useLoaderStore()
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
function handleOutsideClick(e) {
  if (userRef.value && !userRef.value.contains(e.target)) menuOpen.value = false
}
onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))

async function handleLogout() {
  menuOpen.value = false
  loader.show('Cerrando sesión...')
  try {
    // Garantiza que el loader sea visible al menos un instante,
    // aunque el logout responda de inmediato (evita parpadeo).
    await Promise.all([
      authStore.logout(),
      new Promise(resolve => setTimeout(resolve, 600)),
    ])
    // replace para que el dashboard no quede en el historial del navegador
    await router.replace({ name: 'login' })
  } finally {
    loader.hide()
  }
}
</script>

<style scoped>
.navbar {
  position: fixed; top: 0; right: 0;
  left: 220px;
  height: 56px;
  background: var(--bg-1);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px 0 20px;
  z-index: 99;
  transition: left .22s cubic-bezier(.4,0,.2,1);
}
.navbar--collapsed { left: 56px; }

/* Breadcrumb */
.navbar__breadcrumb { display: flex; align-items: center; gap: 7px; font-size: .75rem; }
.navbar__breadcrumb-root { color: var(--text-3); }
.navbar__breadcrumb-sep  { color: var(--border-mid); }
.navbar__breadcrumb-page { color: var(--text-1); font-weight: 600; }

/* Right */
.navbar__right { display: flex; align-items: center; gap: 12px; position: relative; }

/* Divider */
.navbar__vdiv { width: 1px; height: 22px; background: var(--border); }

/* Icon button */
.navbar__icon-btn {
  position: relative;
  background: none; border: none;
  color: var(--text-2); cursor: pointer; padding: 6px;
  border-radius: var(--radius); transition: color .12s, background .12s;
}
.navbar__icon-btn:hover { color: var(--text-1); background: var(--bg-hover); }
.navbar__notif-badge {
  position: absolute; top: 5px; right: 5px;
  width: 8px; height: 8px;
  background: var(--danger);
  border-radius: 50%;
  border: 1.5px solid var(--bg-1);
}

/* User */
.navbar__user {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; padding: 5px 8px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  transition: background .12s, border-color .12s;
  user-select: none;
}
.navbar__user:hover { background: var(--bg-hover); border-color: var(--border); }
.navbar__user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-dim), #2563eb);
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700; color: var(--bg); flex-shrink: 0;
}
.navbar__user-info { display: flex; flex-direction: column; gap: 1px; }
.navbar__user-name { font-size: .78rem; font-weight: 600; color: var(--text-1); line-height: 1; }
.navbar__user-role { font-size: .65rem; color: var(--text-3); }
.navbar__user-caret { color: var(--text-3); transition: transform .2s; }
.navbar__user-caret--open { transform: rotate(180deg); }

/* Dropdown */
.navbar__dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 210px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
  padding: 6px 0; z-index: 200;
  overflow: hidden;
}
.navbar__dropdown-user {
  display: flex; align-items: center; gap: 9px;
  padding: 10px 12px 8px;
}
.navbar__dropdown-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-dim), #2563eb);
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 700; color: var(--bg); flex-shrink: 0;
}
.navbar__dropdown-name { font-size: .8rem; font-weight: 600; color: var(--text-1); }
.navbar__dropdown-username { font-size: .68rem; color: var(--text-3); margin-top: 1px; }
.navbar__dropdown-sep { height: 1px; background: var(--border); margin: 4px 0; }
.navbar__dropdown-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 12px; background: none; border: none;
  font-family: var(--font-mono); font-size: .78rem;
  color: var(--text-2); cursor: pointer;
  transition: background .12s, color .12s; text-align: left;
}
.navbar__dropdown-item:hover { background: var(--bg-hover); color: var(--text-1); }
.navbar__dropdown-item--danger { color: var(--danger); }
.navbar__dropdown-item--danger:hover { background: var(--danger-muted); color: var(--danger); }

/* Transition */
.dropdown-enter-active { transition: opacity .15s, transform .15s; }
.dropdown-leave-active { transition: opacity .12s, transform .12s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>