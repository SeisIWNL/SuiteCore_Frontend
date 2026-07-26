export const networkRoutes = [
  {
    path: '/network',
    name: 'network',
    component: () => import('./views/NetworkView.vue'),
    meta: { title: 'Red', icon: '🌐', requiresAuth: true },
  },
]
