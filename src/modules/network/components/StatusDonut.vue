<template>
  <div class="donut">
    <div class="donut__canvas">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div class="donut__center">
        <span class="donut__total">{{ total }}</span>
        <span class="donut__label">Total</span>
      </div>
    </div>
    <div class="donut__legend">
      <div v-for="seg in segments" :key="seg.label" class="donut__legend-item">
        <span class="donut__dot" :style="{ background: seg.color }" />
        <span class="donut__legend-label">{{ seg.label }}</span>
        <span class="donut__legend-val">{{ seg.value }} ({{ pct(seg.value) }}%)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps({
  // segments: [{ label, value, color }]
  segments: { type: Array, default: () => [] },
})

const total = computed(() => props.segments.reduce((s, x) => s + (x.value ?? 0), 0))

function pct(v) {
  if (!total.value) return 0
  return Math.round((v / total.value) * 100)
}

const chartData = computed(() => ({
  labels: props.segments.map(s => s.label),
  datasets: [{
    data: props.segments.map(s => s.value),
    backgroundColor: props.segments.map(s => s.color),
    borderWidth: 0,
    hoverOffset: 4,
  }],
}))

const chartOptions = computed(() => {
  const theme = readChartTheme()
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.bg2, titleColor: theme.text1, bodyColor: theme.text2,
        borderColor: theme.border, borderWidth: 1, padding: 10,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` },
      },
    },
  }
})
</script>

<style scoped>
.donut { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.donut__canvas { position: relative; width: 160px; height: 160px; }
.donut__center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.donut__total { font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-1); line-height: 1; }
.donut__label { font-size: .68rem; color: var(--text-3); margin-top: 2px; }

.donut__legend { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 200px; }
.donut__legend-item { display: flex; align-items: center; gap: 8px; font-size: .78rem; }
.donut__dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.donut__legend-label { color: var(--text-2); }
.donut__legend-val { margin-left: auto; color: var(--text-1); font-weight: 600; font-family: var(--font-mono); font-size: .74rem; }
</style>
