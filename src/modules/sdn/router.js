// src/modules/sdn/router.js
// Solo exporta children — el DashboardLayout lo provee router/index.js

export const sdnRoutes = [
  {
    path: '/sdn',
    name: 'sdn',
    component: () => import('./views/SdnView.vue'),
    meta: { title: 'Controlador SDN', icon: '🔀' },
  },
]
