// src/modules/alerts/router.js
// Solo exporta children — el DashboardLayout lo provee router/index.js

export const alertsRoutes = [
  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('./views/AlertsView.vue'),
    meta: { title: 'Alertas e incidentes', icon: '🔔' },
  },
]
