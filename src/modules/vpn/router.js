// src/modules/vpn/router.js
// Solo exporta children — el DashboardLayout lo provee router/index.js

export const vpnRoutes = [
  {
    path: '/vpn',
    name: 'vpn',
    component: () => import('./views/VpnView.vue'),
    meta: { title: 'VPN y conectividad', icon: '🔒' },
  },
]
