// src/modules/backups/router.js
// Solo exporta children — el DashboardLayout lo provee router/index.js

export const backupsRoutes = [
  {
    path: '/backups',
    name: 'backups',
    component: () => import('./views/BackupsListView.vue'),
    meta: { title: 'Respaldos de configuración', icon: '💾' },
  },
  {
    path: '/backups/:deviceName',
    name: 'backup-detail',
    component: () => import('./views/BackupDetailView.vue'),
    meta: { title: 'Detalle de respaldo', icon: '💾' },
    props: true,
  },
]
