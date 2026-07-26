<template>
  <div class="wg-chart">
    <div v-if="!history.length" class="wg-chart__empty">
      <span>Actualiza para registrar tráfico en el tiempo</span>
    </div>
    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import { formatBytes } from '@/modules/vpn/composables/useVpn.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const props = defineProps({
  history: { type: Array, default: () => [] },  
})

const chartData = computed(() => {
  const theme = readChartTheme()
  return {
    labels: props.history.map(h => h.label),
    datasets: [
      {
        label: 'RX (descarga)',
        data: props.history.map(h => h.rx),
        backgroundColor: theme.success,
        borderRadius: 3,
        maxBarThickness: 22,
      },
      {
        label: 'TX (subida)',
        data: props.history.map(h => h.tx),
        backgroundColor: theme.blue,
        borderRadius: 3,
        maxBarThickness: 22,
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
        position: 'top', align: 'end',
        labels: { color: theme.text2, font: { size: 10 }, boxWidth: 10, boxHeight: 10, padding: 10 },
      },
      tooltip: {
        backgroundColor: theme.bg2, titleColor: theme.text1, bodyColor: theme.text2,
        borderColor: theme.border, borderWidth: 1, padding: 10,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatBytes(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: theme.text3, font: { size: 9, family: 'JetBrains Mono, monospace' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
      y: { beginAtZero: true, grid: { color: theme.border }, ticks: { color: theme.text3, font: { size: 9 }, callback: (v) => formatBytes(v) } },
    },
  }
})
</script>

<style scoped>
.wg-chart { height: 200px; }
.wg-chart__empty {
  height: 100%; display: flex; align-items: center; justify-content: center;
  color: var(--text-3); font-size: .8rem; text-align: center;
}
</style>
