export const vpnRoutes = [
  {
    path: '/vpn',
    name: 'vpn',
    component: () => import('./views/VpnView.vue'),
    meta: { title: 'VPN y conectividad', icon: '🔒' },
  },
]
