// src/modules/infrastructure/router.js — solo children
export const infrastructureRoutes = [
  {
    path: '/infrastructure',
    name: 'infrastructure',
    component: () => import('./views/InfrastructureView.vue'),
    meta: { title: 'Supervisión de infraestructura', icon: '🖥️', requiresAuth: true },
  },
]
