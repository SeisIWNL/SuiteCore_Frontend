<template>
  <div class="wcard" @click="$router.push('/backups')">
    <div class="wcard__head">
      <div>
        <div class="wcard__title">{{ title }}</div>
        <div class="wcard__sub">{{ subtitle }}</div>
      </div>
      <span class="wcard__link">Ver respaldos →</span>
    </div>

    <div class="wcard__body">
      <div v-if="loading" class="wcard__state">
        <div class="spinner" />
        <span>Cargando estado de respaldos...</span>
      </div>

      <div v-else-if="error" class="wcard__state wcard__state--error">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <div v-else-if="!hasData" class="wcard__state">
        <span>No hay dispositivos registrados en Oxidized</span>
      </div>

      <div v-else>
        <!-- Resumen -->
        <div class="wcard__summary">
          <div class="bsum bsum--ok">
            <span class="bsum__value">{{ data.success }}</span>
            <span class="bsum__label">Exitosos</span>
          </div>
          <div class="bsum bsum--fail">
            <span class="bsum__value">{{ data.failed }}</span>
            <span class="bsum__label">Fallidos</span>
          </div>
          <div class="bsum">
            <span class="bsum__value">{{ data.total }}</span>
            <span class="bsum__label">Total</span>
          </div>
        </div>

        <!-- Barras por grupo -->
        <div class="wcard__chart">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  title:    { type: String, default: 'Estado de respaldos' },
  subtitle: { type: String, default: 'Último respaldo por grupo · Oxidized' },
  data:     { type: Object, default: null },
  loading:  { type: Boolean, default: false },
  error:    { type: String, default: null },
})

const hasData = computed(() => props.data && props.data.total > 0)

const chartData = computed(() => {
  const theme = readChartTheme()
  const groups = props.data?.byGroup ?? []
  return {
    labels: groups.map(g => g.group),
    datasets: [
      {
        label: 'Exitosos',
        data: groups.map(g => g.success),
        backgroundColor: theme.success,
        borderRadius: 4,
        stack: 'backups',
      },
      {
        label: 'Fallidos',
        data: groups.map(g => g.failed),
        backgroundColor: theme.danger,
        borderRadius: 4,
        stack: 'backups',
      },
    ],
  }
})

const chartOptions = computed(() => {
  const theme = readChartTheme()
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: theme.text2,
          font: { size: 11 },
          boxWidth: 10, boxHeight: 10, padding: 10,
        },
      },
      tooltip: {
        backgroundColor: theme.bg2,
        titleColor: theme.text1,
        bodyColor: theme.text2,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: theme.text3, font: { size: 10, family: 'JetBrains Mono, monospace' } },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: theme.border },
        ticks: { color: theme.text3, font: { size: 10 }, precision: 0, stepSize: 1 },
      },
    },
  }
})
</script>

<style scoped>
.wcard {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 18px;
  cursor: pointer; transition: border-color .12s, box-shadow .12s;
}
.wcard:hover { border-color: var(--border-mid); box-shadow: var(--shadow-card); }
.wcard__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; margin-bottom: 16px;
}
.wcard__title { font-family: var(--font-display); font-size: .95rem; font-weight: 700; color: var(--text-1); }
.wcard__sub { font-size: .72rem; color: var(--text-3); margin-top: 3px; }
.wcard__link { font-size: .72rem; color: var(--accent); white-space: nowrap; }

.wcard__body { min-height: 160px; }
.wcard__state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; min-height: 160px; color: var(--text-3); font-size: .82rem; text-align: center;
}
.wcard__state--error { color: var(--danger); }

.wcard__summary { display: flex; gap: 10px; margin-bottom: 14px; }
.bsum {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 10px; background: var(--bg-2); border-radius: var(--radius);
  border: 1px solid var(--border);
}
.bsum--ok   { border-color: color-mix(in srgb, var(--success) 30%, var(--border)); }
.bsum--fail { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
.bsum__value { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--text-1); line-height: 1; }
.bsum--ok .bsum__value   { color: var(--success); }
.bsum--fail .bsum__value { color: var(--danger); }
.bsum__label { font-size: .66rem; color: var(--text-3); margin-top: 3px; text-transform: uppercase; letter-spacing: .04em; }

.wcard__chart { height: 180px; }

.spinner {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2.5px solid var(--bg-3); border-top-color: var(--accent);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
