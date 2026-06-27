<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !mainStore.sidebarOpen }">

    <!-- Logo -->
    <div class="sidebar__logo">
      <div class="sidebar__logo-mark">
        <svg width="28" height="28" viewBox="0 0 42 42" fill="none">
          <path d="M8 1h26l7 7v26l-7 7H8L1 34V8L8 1z"
            fill="none" stroke="var(--accent)" stroke-width="1.2"/>
          <text x="21" y="26" text-anchor="middle"
            font-family="'Syne', sans-serif"
            font-weight="800" font-size="14"
            fill="var(--accent)" letter-spacing="-1">SC</text>
        </svg>
      </div>
      <Transition name="fade-label">
        <div v-if="mainStore.sidebarOpen" class="sidebar__logo-text">
          <span class="sidebar__logo-name">SuiteCore</span>
          <span class="sidebar__logo-sub">NOC</span>
        </div>
      </Transition>
    </div>

    <!-- Nav -->
    <nav class="sidebar__nav">

      <!-- Item suelto: Dashboard -->
      <RouterLink
        to="/dashboard"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': isActive('/dashboard') }"
        :title="!mainStore.sidebarOpen ? 'Dashboard' : undefined"
      >
        <span class="sidebar__item-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </span>
        <Transition name="fade-label">
          <span v-if="mainStore.sidebarOpen" class="sidebar__item-label">Dashboard</span>
        </Transition>
      </RouterLink>

      <!-- Grupos colapsables -->
      <template v-for="group in navGroups" :key="group.id">

        <!-- Divider cuando está colapsado -->
        <div v-if="!mainStore.sidebarOpen" class="sidebar__group-divider" />

        <!-- Header del grupo (solo visible expandido) -->
        <Transition name="fade-label">
          <button
            v-if="mainStore.sidebarOpen"
            class="sidebar__group-header"
            :class="{ 'sidebar__group-header--open': openGroups[group.id] }"
            @click="toggleGroup(group.id)"
          >
            <span class="sidebar__group-icon" v-html="group.icon" />
            <span class="sidebar__group-label">{{ group.label }}</span>
            <svg
              class="sidebar__group-chevron"
              :class="{ 'sidebar__group-chevron--open': openGroups[group.id] }"
              width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </Transition>

        <!-- Items del grupo -->
        <template v-if="mainStore.sidebarOpen">
          <Transition name="group-expand">
            <div v-if="openGroups[group.id]" class="sidebar__group-items">
              <RouterLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="sidebar__item sidebar__item--child"
                :class="{ 'sidebar__item--active': isActive(item.to) }"
              >
                <span class="sidebar__item-dot">
                  <span class="sidebar__item-dot-inner"
                    :class="{ 'sidebar__item-dot-inner--active': isActive(item.to) }" />
                </span>
                <span class="sidebar__item-label">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="sidebar__item-badge"
                  :class="`sidebar__item-badge--${item.badgeType}`"
                >{{ item.badge }}</span>
              </RouterLink>
            </div>
          </Transition>
        </template>

        <!-- Cuando está colapsado: items como iconos directos -->
        <template v-else>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="sidebar__item"
            :class="{ 'sidebar__item--active': isActive(item.to) }"
            :title="item.label"
          >
            <span class="sidebar__item-icon" v-html="item.icon" />
            <span
              v-if="item.badge"
              class="sidebar__item-badge sidebar__item-badge--dot"
              :class="`sidebar__item-badge--${item.badgeType}`"
            />
          </RouterLink>
        </template>

      </template>
    </nav>

    <!-- Collapse toggle -->
    <button class="sidebar__toggle" @click="mainStore.toggleSidebar">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline v-if="mainStore.sidebarOpen" points="15 18 9 12 15 6"/>
        <polyline v-else points="9 18 15 12 9 6"/>
      </svg>
    </button>

  </aside>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store.js'
import { useMainStore } from '@/modules/main/store.js'

const authStore = useAuthStore()
const mainStore = useMainStore()
const route     = useRoute()
const router    = useRouter()

const user         = computed(() => authStore.user)
const userInitials = computed(() => authStore.userInitials || 'US')
const fullName     = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
})

// ── Estado de grupos abiertos/cerrados ────────────────────────
// true = abierto por defecto
const openGroups = reactive({
  monitoreo:      true,
  red:            true,
  seguridad:      false,
  inventario:     false,
  configuracion:  false,
})

function toggleGroup(id) {
  openGroups[id] = !openGroups[id]
}

// ── Definición de grupos y módulos ────────────────────────────
// roles: [] = visible para todos
// roles: ['admin'] = solo visible para admin (se filtrará cuando se implementen roles)
const navGroups = [
  {
    id: 'monitoreo',
    label: 'Monitoreo',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    items: [
      {
        to: '/infrastructure',
        label: 'Supervisión de infraestructura',
        badge: null,
        roles: [],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
      },
      {
        to: '/network',
        label: 'Red',
        badge: null,
        roles: [],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/><rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      },
      {
        to: '/sdn',
        label: 'Supervisión SDN',
        badge: null,
        roles: ['admin', 'operator'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="5" y2="16"/><line x1="12" y1="8" x2="19" y2="16"/></svg>`,
      },
      {
        to: '/noc',
        label: 'Indicadores NOC',
        badge: null,
        roles: ['admin', 'supervisor'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      },
    ],
  },
  {
    id: 'red',
    label: 'Red y seguridad',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    items: [
      {
        to: '/access',
        label: 'Accesos remotos',
        badge: null,
        roles: ['admin', 'security'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      },
      {
        to: '/alerts',
        label: 'Centralización de alertas',
        badge: '5',
        badgeType: 'warning',
        roles: [],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      },
      {
        to: '/notifications',
        label: 'Notificación de incidentes',
        badge: null,
        roles: ['admin', 'operator'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.09 6.09l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
      },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    items: [
      {
        to: '/inventory',
        label: 'Inventario y documentación',
        badge: null,
        roles: ['admin', 'operator'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
      },
    ],
  },
  {
    id: 'seguridad',
    label: 'Auditoría',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    items: [
      {
        to: '/logs',
        label: 'Logs y eventos',
        badge: null,
        roles: [],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
      },
      {
        to: '/backups',
        label: 'Respaldos de configuración',
        badge: null,
        roles: ['admin'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 7 20 3 4 3 4 7"/><path d="M20 21H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
      },
    ],
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    items: [
      {
        to: '/settings',
        label: 'Accesos remotos',
        badge: null,
        roles: ['admin'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      },
      {
        to: '/roles',
        label: 'Gestión de roles',
        badge: null,
        roles: ['admin'],
        icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11l-3 3-2-2"/></svg>`,
      },
    ],
  },
]

function isActive(to) {
  return route.path === to
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* ── Sidebar base ── */
.sidebar {
  width: 220px;
  height: 100vh;
  background: var(--sidebar-bg);          /* siempre oscuro */
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0;
  z-index: 100;
  transition: width .22s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
}
.sidebar--collapsed { width: 56px; }

/* ── Logo ── */
.sidebar__logo {
  display: flex; align-items: center; gap: 10px;
  height: 56px; padding: 0 14px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0; overflow: hidden;
}
.sidebar__logo-mark {
  flex-shrink: 0;
  filter: drop-shadow(0 0 8px rgba(96,165,250,.3));
}
.sidebar__logo-text { display: flex; flex-direction: column; gap: 1px; white-space: nowrap; }
.sidebar__logo-name {
  font-family: var(--font-display);
  font-size: .9rem; font-weight: 800;
  color: #fff;                            /* blanco siempre */
  letter-spacing: -.3px; line-height: 1;
}
.sidebar__logo-sub {
  font-size: .6rem; color: var(--sidebar-accent);
  letter-spacing: .12em; text-transform: uppercase;
}

/* ── Nav ── */
.sidebar__nav {
  flex: 1; padding: 8px 8px;
  overflow-y: auto; overflow-x: hidden;
  display: flex; flex-direction: column; gap: 1px;
}
.sidebar__nav::-webkit-scrollbar { width: 3px; }
.sidebar__nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-border); border-radius: 99px;
}

.sidebar__group-divider {
  height: 1px; background: var(--sidebar-border); margin: 6px 4px;
}

/* ── Group header ── */
.sidebar__group-header {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 8px;
  background: none; border: none;
  color: var(--sidebar-text);
  cursor: pointer; border-radius: var(--radius);
  transition: background .12s, color .12s;
  white-space: nowrap; overflow: hidden;
  margin-top: 6px;
}
.sidebar__group-header:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-active);
}
.sidebar__group-header--open { color: rgba(255,255,255,.65); }

.sidebar__group-icon {
  flex-shrink: 0; width: 16px;
  display: flex; align-items: center; justify-content: center;
}
.sidebar__group-label {
  flex: 1; text-align: left;
  font-size: .65rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
}
.sidebar__group-chevron {
  flex-shrink: 0; color: var(--sidebar-text);
  transition: transform .2s cubic-bezier(.4,0,.2,1);
}
.sidebar__group-chevron--open { transform: rotate(180deg); }

/* ── Group items ── */
.sidebar__group-items {
  display: flex; flex-direction: column; gap: 1px;
  padding-left: 10px;
  border-left: 1px solid var(--sidebar-border);
  margin-left: 16px; margin-bottom: 2px;
}

/* ── Nav items ── */
.sidebar__item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 8px;
  border-radius: var(--radius);
  color: var(--sidebar-text); text-decoration: none;
  font-size: .82rem;
  transition: background .12s, color .12s;
  white-space: nowrap; overflow: hidden;
  position: relative; border: 1px solid transparent;
}
.sidebar__item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-active);
}
.sidebar__item--active {
  background: var(--sidebar-active);
  color: var(--sidebar-accent);
  border-color: rgba(96,165,250,.2);
}
.sidebar__item--child { font-size: .8rem; padding: 6px 8px; }

/* Dot */
.sidebar__item-dot {
  flex-shrink: 0; width: 16px;
  display: flex; align-items: center; justify-content: center;
}
.sidebar__item-dot-inner {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--sidebar-border);
  transition: background .12s, box-shadow .12s;
}
.sidebar__item--active .sidebar__item-dot-inner,
.sidebar__item-dot-inner--active {
  background: var(--sidebar-accent);
  box-shadow: 0 0 6px var(--sidebar-accent);
}
.sidebar__item:hover .sidebar__item-dot-inner {
  background: rgba(255,255,255,.4);
}

.sidebar__item-icon {
  flex-shrink: 0; width: 20px;
  display: flex; align-items: center; justify-content: center;
}
.sidebar__item-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }

/* Badge */
.sidebar__item-badge {
  font-size: .6rem; font-weight: 700;
  padding: 1px 5px; border-radius: 99px; flex-shrink: 0;
}
.sidebar__item-badge--dot {
  position: absolute; top: 5px; right: 5px;
  width: 7px; height: 7px; padding: 0; border-radius: 50%;
}
.sidebar__item-badge--warning { background: rgba(251,191,36,.2); color: #fbbf24; }
.sidebar__item-badge--danger  { background: rgba(248,113,113,.2); color: #f87171; }

/* ── Footer ── */
.sidebar__footer {
  border-top: 1px solid var(--sidebar-border);
  padding: 10px; display: flex; align-items: center;
  gap: 8px; flex-shrink: 0; overflow: hidden;
}
.sidebar__user { display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden; }
.sidebar__user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700; color: #fff; flex-shrink: 0;
}
.sidebar__user-info { overflow: hidden; display: flex; flex-direction: column; gap: 1px; }
.sidebar__user-name {
  font-size: .75rem; font-weight: 600; color: rgba(255,255,255,.9);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar__user-role {
  font-size: .65rem; color: var(--sidebar-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sidebar__logout {
  flex-shrink: 0; background: none; border: none;
  color: var(--sidebar-text); cursor: pointer; padding: 4px;
  border-radius: var(--radius-sm); transition: color .12s, background .12s;
}
.sidebar__logout:hover { color: #f87171; background: rgba(248,113,113,.15); }

/* ── Toggle ── */
.sidebar__toggle {
  position: absolute; top: 50%; right: 0;
  transform: translateY(-50%);
  width: 16px; height: 32px;
  background: var(--sidebar-border); border: 1px solid rgba(255,255,255,.08);
  border-right: none; border-radius: 4px 0 0 4px;
  color: var(--sidebar-text); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .12s, background .12s; opacity: 0;
}
.sidebar:hover .sidebar__toggle { opacity: 1; }
.sidebar__toggle:hover { color: #fff; background: rgba(255,255,255,.1); }

/* ── Transitions ── */
.fade-label-enter-active { transition: opacity .18s .05s, transform .18s .05s; }
.fade-label-leave-active { transition: opacity .1s, transform .1s; }
.fade-label-enter-from, .fade-label-leave-to { opacity: 0; transform: translateX(-6px); }

.group-expand-enter-active { transition: opacity .2s, transform .2s; }
.group-expand-leave-active { transition: opacity .15s, transform .15s; }
.group-expand-enter-from, .group-expand-leave-to { opacity: 0; transform: translateY(-4px); }
</style>