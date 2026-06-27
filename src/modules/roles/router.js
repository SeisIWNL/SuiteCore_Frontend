// src/modules/roles/router.js
// Solo exporta children — el DashboardLayout lo provee router/index.js

export const rolesRoutes = [
  {
    path: '/roles',
    name: 'roles',
    component: () => import('./views/RolesListView.vue'),
    meta: { title: 'Gestión de roles', icon: '🛡️' },
  },
  {
    path: '/roles/:gidNumber/permissions',
    name: 'role-permissions',
    component: () => import('./views/RolePermissionsView.vue'),
    meta: { title: 'Editar permisos', icon: '🛡️' },
    props: true,
  },
]
