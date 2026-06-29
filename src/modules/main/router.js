// src/modules/main/router.js
export const mainRoutes = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: { title: 'Dashboard', icon: '🏠' },
  },
]