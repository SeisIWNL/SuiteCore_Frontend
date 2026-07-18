<template>
  <div class="mod-chart">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip,
} from 'chart.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps({
  operativos:  { type: Number, default: 0 },
  advertencia: { type: Number, default: 0 },
  criticos:    { type: Number, default: 0 },
})

const chartData = computed(() => {
  const theme = readChartTheme()
  return {
    labels: ['Operativos', 'Advertencia', 'Críticos'],
    datasets: [{
      data: [props.operativos, props.advertencia, props.criticos],
      backgroundColor: [theme.success, theme.warning, theme.danger],
      borderRadius: 5,
      maxBarThickness: 64,
    }],
  }
})

const chartOptions = computed(() => {
  const theme = readChartTheme()
  const maxVal = Math.max(props.operativos, props.advertencia, props.criticos, 4)
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.bg2, titleColor: theme.text1, bodyColor: theme.text2,
        borderColor: theme.border, borderWidth: 1, padding: 10,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: theme.text2, font: { size: 11, weight: '600' } } },
      y: {
        beginAtZero: true, suggestedMax: maxVal,
        grid: { color: theme.border },
        ticks: { color: theme.text3, font: { size: 10 }, stepSize: 1, precision: 0 },
      },
    },
  }
})
</script>

<style scoped>
.mod-chart { height: 190px; }
</style>
