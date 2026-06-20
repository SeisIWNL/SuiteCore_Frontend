// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store.js'

// ── Importa las rutas de cada módulo ──────────────────────────
import { authRoutes }    from '@/modules/auth/router.js'
import { mainRoutes } from '@/modules/main/router.js'
import { networkRoutes } from '@/modules/network/router.js'
import { inventoryRoutes } from '@/modules/inventory/router.js'
import { backupsRoutes } from '@/modules/backups/router.js'

// ── Importar el Dashboard layout ──────────────────────────────
import DashboardLayout from '@/layouts/DashboardLayout.vue'

// ── Ensambla todas las rutas ──────────────────────────────────
const routes = [
  { path: '/', redirect: '/dashboard' },
  
  // Auth — sin layout del dashboard
  ...authRoutes,

  // Dashboard — layout global compartido, todos los módulos como hijos
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      ...mainRoutes,
      ...networkRoutes,
      ...inventoryRoutes,
      ...backupsRoutes,
      // ...serversRoutes,   ← cada módulo nuevo se agrega aquí
    ],
  },

  // 404 — siempre al final
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ── Navigation guard global ───────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) await auth.fetchMe()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Evita redirigir si ya estamos yendo al login
    if (to.name === 'login') return
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    // Evita redirigir si ya estamos yendo al dashboard
    if (to.name === 'dashboard') return
    return { name: 'dashboard' }
  }
})