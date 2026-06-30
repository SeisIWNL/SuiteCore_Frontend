// src/modules/roles/router.js
// Solo exporta children — el DashboardLayout lo provee router/index.js

export const usersRoutes = [
  // ── Gestión de roles ──────────────────────────────────────
  {
    path: '/users',
    name: 'users',
    component: () => import('./views/RolesListView.vue'),
    meta: { title: 'Gestión de usuarios y roles', icon: '🛡️' },
  },
  {
    path: '/users/:gidNumber/permissions',
    name: 'users-permissions',
    component: () => import('./views/RolePermissionsView.vue'),
    meta: { title: 'Editar permisos', icon: '🛡️' },
    props: true,
  },
]
