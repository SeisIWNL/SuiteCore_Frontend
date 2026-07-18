<template>
  <div class="wcard">
    <div class="wcard__head">
      <div>
        <div class="wcard__title">Últimos incidentes</div>
        <div class="wcard__sub">Eventos recientes · Graylog</div>
      </div>
      <span class="wcard__count" v-if="hasData">{{ totalResults }} eventos</span>
    </div>

    <div class="wcard__body">
      <!-- Cargando -->
      <div v-if="loading" class="wcard__state">
        <div class="spinner" />
        <span>Cargando eventos...</span>
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

      <!-- Sin eventos -->
      <div v-else-if="!hasData" class="wcard__state wcard__state--ok">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span>No hay incidentes registrados</span>
      </div>

      <!-- Contenido -->
      <div v-else class="wcard__content">
        <!-- Dona por severidad -->
        <div class="wcard__donut-col">
          <div class="wcard__donut">
            <Doughnut :data="chartData" :options="chartOptions" />
            <div class="wcard__donut-center">
              <span class="wcard__donut-value">{{ items.length }}</span>
              <span class="wcard__donut-label">Eventos</span>
            </div>
          </div>
          <div class="legend">
            <div v-for="s in severitySegments" :key="s.label" class="legend__item">
              <span class="legend__dot" :style="{ background: s.color }" />
              <span class="legend__label">{{ s.label }}</span>
              <span class="legend__val">{{ s.value }}</span>
            </div>
          </div>
        </div>

        <!-- Lista de eventos recientes -->
        <div class="events">
          <div v-for="ev in recentEvents" :key="ev.id" class="event">
            <span class="event__bar" :class="`event__bar--${ev._tone}`" />
            <div class="event__body">
              <div class="event__top">
                <span class="event__sev" :class="`event__sev--${ev._tone}`">{{ ev._label }}</span>
                <span class="event__time">{{ ev._time }}</span>
              </div>
              <div class="event__msg" :title="ev.message">{{ ev.message || '(sin mensaje)' }}</div>
              <div class="event__meta">
                <span class="event__src">{{ ev.source || '—' }}</span>
                <span v-if="ev.applicationName" class="event__app">· {{ ev.applicationName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { levelInfo, shortTime } from '@/modules/main/services/incidents.service.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps({
  data:    { type: Object,  default: null },
  loading: { type: Boolean, default: false },
  error:   { type: String,  default: null },
})

const items = computed(() => props.data?.items ?? [])
const hasData = computed(() => items.value.length > 0)
const totalResults = computed(() => props.data?.totalResults ?? items.value.length)

// Enriquecemos cada evento con su severidad y hora legible
const enriched = computed(() =>
  items.value.map(ev => {
    const info = levelInfo(ev.level)
    return { ...ev, _label: info.label, _tone: info.tone, _time: shortTime(ev.timestamp) }
  })
)

// Los 5 más recientes (asumimos que Graylog ya los devuelve ordenados)
const recentEvents = computed(() => enriched.value.slice(0, 5))

// Conteo por severidad para la dona
const severitySegments = computed(() => {
  const theme = readChartTheme()
  const toneColor = {
    danger:  theme.danger,
    warning: theme.warning,
    info:    theme.blue,
    muted:   theme.text3,
  }
  const acc = new Map()
  for (const ev of enriched.value) {
    const key = ev._label
    if (!acc.has(key)) acc.set(key, { label: key, value: 0, color: toneColor[ev._tone] ?? theme.text3 })
    acc.get(key).value++
  }
  return [...acc.values()].sort((a, b) => b.value - a.value)
})

const chartData = computed(() => ({
  labels: severitySegments.value.map(s => s.label),
  datasets: [{
    data: severitySegments.value.map(s => s.value),
    backgroundColor: severitySegments.value.map(s => s.color),
    borderWidth: 0,
    hoverOffset: 4,
  }],
}))

const chartOptions = computed(() => {
  const theme = readChartTheme()
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
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
.wcard {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
  display: flex; flex-direction: column;
}
.wcard__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.wcard__title { font-family: var(--font-display); font-size: .9rem; font-weight: 700; color: var(--text-1); }
.wcard__sub { font-size: .72rem; color: var(--text-3); margin-top: 2px; }
.wcard__count { font-family: var(--font-mono); font-size: .68rem; color: var(--text-3); white-space: nowrap; }
.wcard__body { padding: 16px; flex: 1; }

.wcard__state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 9px; padding: 34px 16px; color: var(--text-3); font-size: .82rem; text-align: center;
}
.wcard__state--error { color: var(--danger); }
.wcard__state--ok { color: var(--success); }
.spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--border); border-top-color: var(--accent);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.wcard__content { display: grid; grid-template-columns: auto 1fr; gap: 18px; align-items: start; }

.wcard__donut-col { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.wcard__donut { position: relative; width: 118px; height: 118px; }
.wcard__donut-center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; pointer-events: none;
}
.wcard__donut-value { font-family: var(--font-display); font-size: 1.45rem; font-weight: 800; color: var(--text-1); line-height: 1; }
.wcard__donut-label { font-size: .62rem; color: var(--text-3); margin-top: 2px; }

.legend { display: flex; flex-direction: column; gap: 5px; width: 100%; }
.legend__item { display: flex; align-items: center; gap: 6px; font-size: .72rem; }
.legend__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend__label { color: var(--text-2); }
.legend__val { margin-left: auto; font-family: var(--font-mono); font-weight: 700; color: var(--text-1); }

/* Lista de eventos */
.events { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.event {
  display: flex; gap: 9px; align-items: stretch;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 8px 10px; min-width: 0;
}
.event__bar { width: 3px; border-radius: 99px; flex-shrink: 0; }
.event__bar--danger  { background: var(--danger); }
.event__bar--warning { background: var(--warning); }
.event__bar--info    { background: var(--blue); }
.event__bar--muted   { background: var(--text-3); }
.event__body { min-width: 0; flex: 1; }
.event__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.event__sev { font-size: .62rem; font-weight: 700; padding: 1px 7px; border-radius: 99px; }
.event__sev--danger  { background: var(--danger-muted);  color: var(--danger); }
.event__sev--warning { background: var(--warning-muted); color: var(--warning); }
.event__sev--info    { background: var(--blue-muted);    color: var(--blue); }
.event__sev--muted   { background: var(--bg-3);          color: var(--text-3); }
.event__time { font-family: var(--font-mono); font-size: .64rem; color: var(--text-3); white-space: nowrap; }
.event__msg {
  font-size: .76rem; color: var(--text-1); margin-top: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.event__meta { font-size: .66rem; color: var(--text-3); margin-top: 2px; }
.event__app { color: var(--text-3); }

@media (max-width: 640px) {
  .wcard__content { grid-template-columns: 1fr; }
}
</style>
