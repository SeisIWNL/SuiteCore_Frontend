// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/modules/auth/store.js'

// ── Importa las rutas de cada módulo ──────────────────────────
import { authRoutes }    from '@/modules/auth/router.js'
import { mainRoutes } from '@/modules/main/router.js'

// ── Ensambla todas las rutas ──────────────────────────────────
const routes = [
  { path: '/', redirect: '/dashboard' },
  
  ...authRoutes,
  ...mainRoutes,

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