import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store.js'

// ── Importa las rutas de cada módulo ──────────────────────────
import { authRoutes }    from '@/modules/auth/router.js'
import { mainRoutes } from '@/modules/main/router.js'
import { networkRoutes } from '@/modules/network/router.js'
import { infrastructureRoutes } from '@/modules/infrastructure/router.js'
import { inventoryRoutes } from '@/modules/inventory/router.js'
import { backupsRoutes } from '@/modules/backups/router.js'
import { usersRoutes } from '@/modules/users/router.js'
import { vpnRoutes } from '@/modules/vpn/router.js'
import { sdnRoutes } from '@/modules/sdn/router.js'
import { alertsRoutes } from '@/modules/alerts/router.js'

// ── Importar el Dashboard layout ──────────────────────────────
import DashboardLayout from '@/layouts/DashboardLayout.vue'

// ── Ensambla todas las rutas ──────────────────────────────────
const routes = [
  { path: '/', redirect: '/dashboard' },
  ...authRoutes,

  // Dashboard — layout global compartido
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      ...mainRoutes,
      ...networkRoutes,
      ...infrastructureRoutes,
      ...inventoryRoutes,
      ...backupsRoutes,
      ...usersRoutes,
      ...vpnRoutes,
      ...sdnRoutes,
      ...alertsRoutes,
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

import { usePermissionsStore } from '@/stores/permissions.js'

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) await auth.fetchMe()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    if (to.name === 'login') return
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    if (to.name === 'dashboard') return
    return { name: 'dashboard' }
  }

  // ── Control de acceso por módulo (RBAC) ─────────────────────
  if (to.meta.requiresAuth && auth.isAuthenticated) {
    await auth.ensurePermissions()

    const perms = usePermissionsStore()
    const baseSlug = '/' + (to.path.split('/').filter(Boolean)[0] ?? '')

    if (baseSlug !== '/dashboard' && !perms.canAccess(baseSlug)) {
      return { name: 'dashboard', query: { denied: baseSlug } }
    }
  }
})