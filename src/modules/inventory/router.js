// src/modules/inventory/router.js
// Solo exporta los children — el DashboardLayout lo provee router/index.js

export const inventoryRoutes = [
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('./views/InventoryView.vue'),
    meta: { title: 'Inventario y documentación', icon: '📁' },
  },
]
