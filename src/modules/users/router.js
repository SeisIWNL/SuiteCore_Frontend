export const usersRoutes = [
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
