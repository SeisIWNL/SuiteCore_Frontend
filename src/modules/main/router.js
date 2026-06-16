// src/modules/main/router.js
export const mainRoutes = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: { title: 'Dashboard', icon: '🏠' },
  },
  {
    path: '/servers',
    name: 'servers',
    component: () => import('./views/ServersView.vue'),
    meta: { title: 'Servidores', icon: '🖥️' },
  },
  {
    path: '/logs',
    name: 'logs',
    component: () => import('./views/LogsView.vue'),
    meta: { title: 'Logs', icon: '📋' },
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('./views/AlertsView.vue'),
    meta: { title: 'Alertas', icon: '🔔' },
  },
]