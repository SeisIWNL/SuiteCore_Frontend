<template>
  <div class="dash">

    <!-- Welcome bar -->
    <div class="dash__welcome">
      <div>
        <h1 class="dash__title">
          Bienvenido, <span class="dash__title-name">{{ firstName }}</span>
        </h1>
        <p class="dash__sub">Centro de operaciones de red — estado en tiempo real</p>
      </div>
      <div class="dash__status">
        <span class="dash__status-dot" />
        <span>Todos los sistemas operacionales</span>
      </div>
    </div>

    <!-- ══════ Resumen nativo del sistema (SCNO) ══════ -->
    <div class="dash__kpis">
      <div class="skpi">
        <span class="skpi__icon skpi__icon--amber">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <div class="skpi__value">{{ indicadores?.alertasActivas ?? '—' }}</div>
        <div class="skpi__label">Alertas activas</div>
      </div>
      <div class="skpi">
        <span class="skpi__icon skpi__icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </span>
        <div class="skpi__value">{{ indicadores ? `${indicadores.checksActivos}/${indicadores.checksTotales}` : '—' }}</div>
        <div class="skpi__label">Checks activos</div>
      </div>
      <div class="skpi">
        <span class="skpi__icon skpi__icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </span>
        <div class="skpi__value">{{ indicadores?.maquinasVirtuales ?? '—' }}</div>
        <div class="skpi__label">Máquinas virtuales</div>
      </div>
      <div class="skpi">
        <span class="skpi__icon skpi__icon--accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
        </span>
        <div class="skpi__value">{{ indicadores?.servicios ?? '—' }}</div>
        <div class="skpi__label">Servicios monitoreados</div>
      </div>
    </div>

    <!-- Gráficos nativos del sistema -->
    <div class="dash__charts">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Estado de módulos</span></div>
        <div v-if="modules.loading" class="panel__body"><div class="chart-sk" /></div>
        <div v-else-if="modules.error" class="panel__err">{{ modules.error }}</div>
        <div v-else class="panel__body">
          <ModulesStatusChart
            :operativos="modules.data?.datos?.operativos ?? 0"
            :advertencia="modules.data?.datos?.advertencia ?? 0"
            :criticos="modules.data?.datos?.criticos ?? 0"
          />
        </div>
        <div class="panel__foot">Estado de los módulos del sistema</div>
      </div>

      <div class="panel">
        <div class="panel__head"><span class="panel__title">Estado de servicios</span></div>
        <div v-if="services.loading" class="panel__body"><div class="chart-sk" /></div>
        <div v-else-if="services.error" class="panel__err">{{ services.error }}</div>
        <div v-else class="panel__body panel__body--center">
          <StatusDonut :segments="serviceSegments" />
        </div>
        <div class="panel__foot">Servicios operativos vs. caídos</div>
      </div>
    </div>

    <!-- Sin widgets para este rol -->
    <div v-if="!hasWidgets" class="dash__empty">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
      </svg>
      <div class="dash__empty-title">No hay paneles disponibles para tu rol</div>
      <p class="dash__empty-sub">
        Tu rol no tiene módulos de monitoreo asignados. Si crees que es un error,
        contacta a un administrador para revisar tus permisos.
      </p>
    </div>

    <!-- Grid de widgets dinámicos -->
    <div v-else class="dash__widgets">

      <!-- Incidentes (Graylog) -->
      <IncidentEventsWidget
        v-if="has('incidents')"
        :data="incidents.data"
        :loading="incidents.loading"
        :error="incidents.error"
      />

      <!-- Oxidized (respaldos) -->
      <BackupsStatusWidget
        v-if="has('backups')"
        :data="backups.data"
        :loading="backups.loading"
        :error="backups.error"
      />
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/modules/auth/store.js'
import { useDashboardWidgets } from '@/modules/main/composables/useDashboardWidgets.js'
import { useDashboardData } from '@/modules/main/composables/useDashboardData.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import IncidentEventsWidget from '@/modules/main/components/widgets/IncidentEventsWidget.vue'
import BackupsStatusWidget from '@/modules/main/components/widgets/BackupsStatusWidget.vue'
import ModulesStatusChart  from '@/modules/main/components/ModulesStatusChart.vue'
import StatusDonut         from '@/modules/network/components/StatusDonut.vue'

const authStore = useAuthStore()
const firstName = computed(() => authStore.user?.firstName ?? 'Operador')

const {
  hasWidgets, has,
  incidents, backups,
  loadAll,
} = useDashboardWidgets()

// Datos nativos del sistema (nuevo Dashboard API, reemplaza Grafana)
const {
  summary, modules, services, indicadores,
  loadAll: loadDashboardData,
} = useDashboardData()

const serviceSegments = computed(() => {
  const theme = readChartTheme()
  const d = services.value.data?.datos ?? { operativos: 0, caidos: 0 }
  return [
    { label: 'Operativos', value: d.operativos ?? 0, color: theme.success },
    { label: 'Caídos',     value: d.caidos ?? 0,     color: theme.danger },
  ]
})

let timer = null
onMounted(async () => {
  await Promise.all([loadAll(), loadDashboardData()])
  timer = setInterval(() => loadDashboardData(true), 30000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.dash { max-width: auto; }

/* KPIs nativos */
.dash__kpis {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px; margin-bottom: 16px;
}
.skpi {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px; text-align: center;
}
.skpi__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%; margin-bottom: 8px;
}
.skpi__icon--amber  { background: var(--warning-muted); color: var(--warning); }
.skpi__icon--green  { background: var(--success-muted); color: var(--success); }
.skpi__icon--blue   { background: var(--blue-muted); color: var(--blue); }
.skpi__icon--accent { background: var(--accent-muted); color: var(--accent); }
.skpi__value { font-family: var(--font-display); font-size: 1.7rem; font-weight: 800; color: var(--text-1); line-height: 1.1; }
.skpi__label { font-size: .72rem; color: var(--text-3); margin-top: 4px; }

/* Gráficos nativos */
.dash__charts { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-bottom: 22px; }
.panel { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
.panel__head { padding: 12px 16px; border-bottom: 1px solid var(--border); }
.panel__title { font-family: var(--font-display); font-size: .82rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .03em; }
.panel__body { padding: 18px; flex: 1; }
.panel__body--center { display: flex; align-items: center; justify-content: center; }
.panel__foot { padding: 10px 16px; border-top: 1px solid var(--border); font-size: .72rem; color: var(--text-3); text-align: center; }
.panel__err { padding: 16px; font-size: .8rem; color: var(--danger); }
.chart-sk { width: 100%; height: 180px; background: var(--bg-3); border-radius: var(--radius); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

@media (max-width: 900px) {
  .dash__charts { grid-template-columns: 1fr; }
}

/* Welcome */
.dash__welcome {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; margin-bottom: 22px;
}
.dash__title {
  font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 700; color: var(--text-1);
}
.dash__title-name { color: var(--accent); }
.dash__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }
.dash__status {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  font-size: .76rem; color: var(--text-2);
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: 99px; padding: 7px 14px;
}
.dash__status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 8px var(--success);
  animation: pulse 2s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Empty */
.dash__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 70px 24px; text-align: center;
  background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg);
  color: var(--text-3);
}
.dash__empty svg { opacity: .4; }
.dash__empty-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-2); }
.dash__empty-sub { font-size: .82rem; color: var(--text-3); max-width: 420px; line-height: 1.5; }

/* Widgets grid */
.dash__widgets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 860px) {
  .dash__widgets { grid-template-columns: 1fr; }
  .dash__welcome { flex-direction: column; }
}
</style>