// src/modules/main/router.js
import MainLayout from './layouts/MainLayout.vue'

export const mainRoutes = [
  {
    path: '/dashboard',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
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
        path: '/network',
        name: 'network',
        component: () => import('./views/NetworkView.vue'),
        meta: { title: 'Red', icon: '🌐' },
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
    ],
  },
]