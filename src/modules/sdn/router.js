export const sdnRoutes = [
  {
    path: '/sdn',
    name: 'sdn',
    component: () => import('./views/SdnView.vue'),
    meta: { title: 'Controlador SDN', icon: '🔀' },
  },
]
  