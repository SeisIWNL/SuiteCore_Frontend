<template>
  <div class="ops-chart">
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
  // items: [{ label, value, color }]
  items: { type: Array, default: () => [] },
})

const chartData = computed(() => ({
  labels: props.items.map(i => i.label),
  datasets: [{
    data: props.items.map(i => i.value),
    backgroundColor: props.items.map(i => i.color),
    borderRadius: 5,
    maxBarThickness: 58,
  }],
}))

const chartOptions = computed(() => {
  const theme = readChartTheme()
  const maxVal = Math.max(...props.items.map(i => i.value ?? 0), 4)
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
      x: { grid: { display: false }, ticks: { color: theme.text2, font: { size: 10, weight: '600' } } },
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
.ops-chart { height: 180px; }
</style>
