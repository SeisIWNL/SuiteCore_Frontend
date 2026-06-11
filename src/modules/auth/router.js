// src/modules/auth/router.js

export const authRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { requiresGuest: true },
  }
]
