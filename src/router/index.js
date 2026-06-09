import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

// ── Lazy imports ──────────────────────────────────────────────
const LoginView     = () => import('@/modules/auth/views/LoginView.vue')
const DashboardView = () => import('@/modules/main/views/DashboardView.vue')

const routes = [
  { path: '/',          redirect: '/dashboard' },
  { path: '/login',     name: 'login',     component: LoginView,     meta: { requiresGuest: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true  } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ── Guard ─────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) await auth.fetchMe()

  if (to.meta.requiresAuth  && !auth.isAuthenticated)
    return { name: 'login', query: { redirect: to.fullPath } }

  if (to.meta.requiresGuest && auth.isAuthenticated)
    return { name: 'dashboard' }
})
