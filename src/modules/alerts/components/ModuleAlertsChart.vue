<template>
  <div class="mod-bars" :style="{ height: chartHeight + 'px' }">
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
  // items: [{ label, value }]
  items: { type: Array, default: () => [] },
})

const chartHeight = computed(() => Math.max(180, props.items.length * 34))

const chartData = computed(() => {
  const theme = readChartTheme()
  return {
    labels: props.items.map(i => i.label),
    datasets: [{
      data: props.items.map(i => i.value),
      backgroundColor: theme.blue,
      borderRadius: 4,
      maxBarThickness: 20,
    }],
  }
})

const chartOptions = computed(() => {
  const theme = readChartTheme()
  const maxVal = Math.max(...props.items.map(i => i.value ?? 0), 2)
  return {
    indexAxis: 'y',
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
      x: {
        beginAtZero: true, suggestedMax: maxVal,
        grid: { color: theme.border },
        ticks: { color: theme.text3, font: { size: 10 }, stepSize: 1, precision: 0 },
        title: { display: true, text: 'Cantidad de alertas', color: theme.text3, font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: theme.text2, font: { size: 11, weight: '600' } },
      },
    },
  }
})
</script>

<style scoped>
.mod-bars { width: 100%; }
</style>
