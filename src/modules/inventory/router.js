export const inventoryRoutes = [
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('./views/InventoryView.vue'),
    meta: { title: 'Inventario y documentación', icon: '📁' },
  },
]
