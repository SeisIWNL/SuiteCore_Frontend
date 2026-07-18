<template>
  <div class="wcard" @click="$router.push('/inventory')">
    <div class="wcard__head">
      <div>
        <div class="wcard__title">{{ title }}</div>
        <div class="wcard__sub">{{ subtitle }}</div>
      </div>
      <span class="wcard__link">Ver inventario →</span>
    </div>

    <div class="wcard__body">
      <!-- Loading -->
      <div v-if="loading" class="wcard__state">
        <div class="spinner" />
        <span>Cargando datos de NetBox...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="wcard__state wcard__state--error">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Sin datos -->
      <div v-else-if="!hasData" class="wcard__state">
        <span>No hay direcciones IP registradas</span>
      </div>

      <!-- Gráfico -->
      <div v-else class="wcard__chart-row">
        <div class="wcard__donut">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="wcard__donut-center">
            <span class="wcard__donut-value">{{ data.totalIps }}</span>
            <span class="wcard__donut-label">IPs</span>
          </div>
        </div>
        <div class="wcard__stats">
          <div class="wstat">
            <span class="wstat__value">{{ data.totalSubnets }}</span>
            <span class="wstat__label">Subredes</span>
          </div>
          <div class="wstat">
            <span class="wstat__value wstat__value--ok">{{ data.activeIps }}</span>
            <span class="wstat__label">Activas</span>
          </div>
          <div class="wstat">
            <span class="wstat__value">{{ data.totalRegions }}</span>
            <span class="wstat__label">Regiones</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { readChartTheme, categoricalPalette } from '@/modules/main/composables/useChartTheme.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  title:    { type: String, default: 'Direcciones IP por subred' },
  subtitle: { type: String, default: 'Distribución del inventario · NetBox' },
  data:     { type: Object, default: null },
  loading:  { type: Boolean, default: false },
  error:    { type: String, default: null },
})

const hasData = computed(() => props.data && props.data.bySubnet?.length > 0)

// Limita a top 6 subredes + "Otras" para no saturar la dona
const top = computed(() => {
  if (!hasData.value) return { labels: [], counts: [] }
  const items = props.data.bySubnet
  const MAX = 6
  if (items.length <= MAX) {
    return { labels: items.map(i => i.subnet), counts: items.map(i => i.count) }
  }
  const head = items.slice(0, MAX)
  const rest = items.slice(MAX).reduce((s, i) => s + i.count, 0)
  return {
    labels: [...head.map(i => i.subnet), 'Otras'],
    counts: [...head.map(i => i.count), rest],
  }
})

const chartData = computed(() => {
  const theme = readChartTheme()
  const palette = categoricalPalette(theme, top.value.labels.length)
  return {
    labels: top.value.labels,
    datasets: [{
      data: top.value.counts,
      backgroundColor: palette,
      borderColor: theme.bg1,
      borderWidth: 2,
      hoverOffset: 4,
    }],
  }
})

const chartOptions = computed(() => {
  const theme = readChartTheme()
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: theme.text2,
          font: { size: 11, family: 'JetBrains Mono, monospace' },
          boxWidth: 10, boxHeight: 10, padding: 8,
        },
      },
      tooltip: {
        backgroundColor: theme.bg2,
        titleColor: theme.text1,
        bodyColor: theme.text2,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} IPs`,
        },
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

.wcard__chart-row { display: flex; align-items: center; gap: 18px; }
.wcard__donut { position: relative; width: 160px; height: 160px; flex-shrink: 0; }
.wcard__donut-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; pointer-events: none;
}
.wcard__donut-value { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--text-1); line-height: 1; }
.wcard__donut-label { font-size: .66rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }

.wcard__stats { display: flex; flex-direction: column; gap: 12px; flex: 1; }
.wstat { display: flex; flex-direction: column; }
.wstat__value { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--text-1); line-height: 1; }
.wstat__value--ok { color: var(--success); }
.wstat__label { font-size: .68rem; color: var(--text-3); margin-top: 2px; }

.spinner {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2.5px solid var(--bg-3); border-top-color: var(--accent);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 560px) {
  .wcard__chart-row { flex-direction: column; }
  .wcard__stats { flex-direction: row; width: 100%; justify-content: space-around; }
}
</style>
