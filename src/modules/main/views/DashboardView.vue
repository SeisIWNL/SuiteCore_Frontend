<template>
  <div class="dashboard">

    <!-- Bienvenida -->
    <div class="dashboard__welcome">
      <div>
        <h1 class="dashboard__title">Bienvenido, {{ firstName }} 👋</h1>
        <p class="dashboard__sub">Resumen del estado de la infraestructura</p>
      </div>
      <span class="dashboard__date">{{ currentDate }}</span>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-card--green">
        <div class="kpi-card__icon">🖥️</div>
        <div class="kpi-card__body">
          <div class="kpi-card__value">12 / 14</div>
          <div class="kpi-card__label">Servidores activos</div>
        </div>
      </div>
      <div class="kpi-card kpi-card--yellow">
        <div class="kpi-card__icon">⚡</div>
        <div class="kpi-card__body">
          <div class="kpi-card__value">67%</div>
          <div class="kpi-card__label">CPU promedio</div>
        </div>
      </div>
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-card__icon">💾</div>
        <div class="kpi-card__body">
          <div class="kpi-card__value">128 GB</div>
          <div class="kpi-card__label">RAM en uso</div>
        </div>
      </div>
      <div class="kpi-card kpi-card--red">
        <div class="kpi-card__icon">🔔</div>
        <div class="kpi-card__body">
          <div class="kpi-card__value">5</div>
          <div class="kpi-card__label">Alertas activas</div>
        </div>
      </div>
    </div>

    <!-- Gráficos — clickeables, llevan a la sección -->
    <div class="charts-grid">

      <!-- CPU -->
      <div class="chart-card" @click="$router.push('/servers')" title="Ver detalle de servidores">
        <div class="chart-card__header">
          <div>
            <div class="chart-card__title">CPU por servidor</div>
            <div class="chart-card__sub">Uso promedio últimas 24h</div>
          </div>
          <span class="chart-card__link">Ver servidores →</span>
        </div>
        <div class="chart-card__body">
          <BarChart :data="cpuData" :options="barOptions" />
        </div>
      </div>

      <!-- Tráfico de red -->
      <div class="chart-card" @click="$router.push('/network')" title="Ver detalle de red">
        <div class="chart-card__header">
          <div>
            <div class="chart-card__title">Tráfico de red</div>
            <div class="chart-card__sub">Mbps — última hora</div>
          </div>
          <span class="chart-card__link">Ver red →</span>
        </div>
        <div class="chart-card__body">
          <LineChart :data="networkData" :options="lineOptions" />
        </div>
      </div>

      <!-- Estado de servicios -->
      <div class="chart-card chart-card--sm" @click="$router.push('/alerts')" title="Ver alertas">
        <div class="chart-card__header">
          <div>
            <div class="chart-card__title">Estado de servicios</div>
            <div class="chart-card__sub">Distribución actual</div>
          </div>
          <span class="chart-card__link">Ver alertas →</span>
        </div>
        <div class="chart-card__body chart-card__body--center">
          <DoughnutChart :data="statusData" :options="doughnutOptions" />
        </div>
      </div>

      <!-- Logs recientes -->
      <div class="chart-card chart-card--sm" @click="$router.push('/logs')" title="Ver logs">
        <div class="chart-card__header">
          <div>
            <div class="chart-card__title">Logs recientes</div>
            <div class="chart-card__sub">Últimos eventos</div>
          </div>
          <span class="chart-card__link">Ver logs →</span>
        </div>
        <div class="chart-card__body">
          <div class="log-list">
            <div v-for="log in recentLogs" :key="log.id" class="log-item">
              <span class="log-item__badge" :class="`log-item__badge--${log.level}`">
                {{ log.level }}
              </span>
              <span class="log-item__msg">{{ log.message }}</span>
              <span class="log-item__time">{{ log.time }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar as BarChart, Line as LineChart, Doughnut as DoughnutChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement, LineElement, PointElement, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { useAuthStore } from '@/modules/auth/store.js'

ChartJS.register(
  BarElement, LineElement, PointElement, ArcElement,
  CategoryScale, LinearScale,
  Tooltip, Legend, Filler,
)

const authStore = useAuthStore()
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')
const currentDate = new Date().toLocaleDateString('es-PE', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

// ── CPU BarChart ──────────────────────────────────────────────
const cpuData = {
  labels: ['web-01', 'web-02', 'db-master', 'cache-01', 'api-gw', 'auth-svc'],
  datasets: [{
    label: 'CPU %',
    data: [45, 94, 38, 12, 22, 67],
    backgroundColor: [
      '#67c23a', '#f56c6c', '#67c23a', '#67c23a', '#67c23a', '#e6a23c',
    ],
    borderRadius: 4,
  }],
}
const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { max: 100, grid: { color: '#f0f2f5' }, ticks: { callback: v => v + '%' } },
    x: { grid: { display: false } },
  },
}

// ── Network LineChart ─────────────────────────────────────────
const labels = Array.from({ length: 12 }, (_, i) => `-${60 - i * 5}m`)
const networkData = {
  labels,
  datasets: [
    {
      label: 'IN (Mbps)',
      data: [120, 145, 132, 178, 165, 190, 210, 198, 220, 205, 230, 215],
      borderColor: '#409eff',
      backgroundColor: 'rgba(64,158,255,.08)',
      fill: true, tension: 0.4, pointRadius: 2,
    },
    {
      label: 'OUT (Mbps)',
      data: [80, 95, 88, 110, 102, 125, 140, 130, 148, 135, 155, 142],
      borderColor: '#67c23a',
      backgroundColor: 'rgba(103,194,58,.08)',
      fill: true, tension: 0.4, pointRadius: 2,
    },
  ],
}
const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
  scales: {
    y: { grid: { color: '#f0f2f5' } },
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// ── Status DoughnutChart ──────────────────────────────────────
const statusData = {
  labels: ['Online', 'Warning', 'Error'],
  datasets: [{
    data: [10, 2, 2],
    backgroundColor: ['#67c23a', '#e6a23c', '#f56c6c'],
    borderWidth: 0,
    hoverOffset: 6,
  }],
}
const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
}

// ── Logs recientes (mock — reemplazar con API) ────────────────
const recentLogs = [
  { id: 1, level: 'error', message: 'CPU crítica en web-prod-03 (94%)', time: '3m' },
  { id: 2, level: 'warn',  message: 'RAM alta en db-master-01 (87%)',   time: '12m' },
  { id: 3, level: 'error', message: 'auth-service no responde',          time: '18m' },
  { id: 4, level: 'warn',  message: 'Disco lleno en storage-01 (91%)',  time: '45m' },
  { id: 5, level: 'info',  message: 'Backup completado en db-replica',  time: '1h' },
]
</script>

<style scoped>
.dashboard { max-width: 1400px; }

/* Welcome */
.dashboard__welcome {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}
.dashboard__title { font-size: 1.3rem; font-weight: 700; color: #2c3e50; }
.dashboard__sub   { font-size: .83rem; color: #909399; margin-top: 3px; }
.dashboard__date  { font-size: .78rem; color: #c0c4cc; margin-top: 4px; }

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.kpi-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  border-left: 4px solid transparent;
}
.kpi-card--green  { border-left-color: #67c23a; }
.kpi-card--yellow { border-left-color: #e6a23c; }
.kpi-card--blue   { border-left-color: #409eff; }
.kpi-card--red    { border-left-color: #f56c6c; }

.kpi-card__icon  { font-size: 1.8rem; }
.kpi-card__value { font-size: 1.4rem; font-weight: 800; color: #2c3e50; }
.kpi-card__label { font-size: .75rem; color: #909399; margin-top: 2px; }

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.chart-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  padding: 16px;
  cursor: pointer;
  transition: box-shadow .2s, transform .15s;
  border: 1px solid transparent;
}
.chart-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  transform: translateY(-2px);
  border-color: #409eff;
}
.chart-card--sm { /* misma altura */ }

.chart-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}
.chart-card__title { font-size: .9rem; font-weight: 700; color: #2c3e50; }
.chart-card__sub   { font-size: .75rem; color: #909399; margin-top: 2px; }
.chart-card__link  { font-size: .75rem; color: #409eff; white-space: nowrap; }

.chart-card__body { height: 200px; }
.chart-card__body--center {
  display: flex; align-items: center; justify-content: center;
}

/* Log list */
.log-list { display: flex; flex-direction: column; gap: 8px; height: 200px; overflow-y: auto; }
.log-item {
  display: flex; align-items: center; gap: 8px;
  font-size: .78rem; padding: 6px 0;
  border-bottom: 1px solid #f5f5f5;
}
.log-item:last-child { border-bottom: none; }
.log-item__badge {
  padding: 2px 6px; border-radius: 4px; font-size: .68rem;
  font-weight: 700; flex-shrink: 0; text-transform: uppercase;
}
.log-item__badge--error { background: #fef0f0; color: #f56c6c; }
.log-item__badge--warn  { background: #fdf6ec; color: #e6a23c; }
.log-item__badge--info  { background: #ecf5ff; color: #409eff; }
.log-item__msg  { flex: 1; color: #606266; }
.log-item__time { color: #c0c4cc; flex-shrink: 0; }

/* Responsive */
@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
}
</style>