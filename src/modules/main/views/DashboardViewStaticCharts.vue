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

    <!-- KPIs -->
    <div class="kpi-grid">
      <div class="kpi" v-for="k in kpis" :key="k.label"
        :class="`kpi--${k.color}`"
        @click="k.to && $router.push(k.to)"
        :style="k.to ? 'cursor:pointer' : ''">
        <div class="kpi__icon" v-html="k.icon" />
        <div class="kpi__body">
          <div class="kpi__value">{{ k.value }}</div>
          <div class="kpi__label">{{ k.label }}</div>
        </div>
        <div class="kpi__trend" :class="`kpi__trend--${k.trendColor}`">
          {{ k.trend }}
        </div>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="charts-grid">

      <!-- CPU -->
      <div class="chart-card" @click="$router.push('/servers')">
        <div class="chart-card__head">
          <div>
            <div class="chart-card__title">Uso de CPU por servidor</div>
            <div class="chart-card__sub">Promedio últimas 24h · SNMP via LibreNMS</div>
          </div>
          <span class="chart-card__link">Ver servidores →</span>
        </div>
        <div class="chart-card__body">
          <!-- Placeholder barras -->
          <div class="bar-chart">
            <div v-for="(bar, i) in cpuBars" :key="i" class="bar-chart__col">
              <div class="bar-chart__bar-wrap">
                <div class="bar-chart__bar"
                  :style="{ height: bar.val + '%', background: bar.val > 85 ? 'var(--danger)' : bar.val > 65 ? 'var(--warning)' : 'var(--accent)' }"
                  :title="`${bar.label}: ${bar.val}%`"
                />
              </div>
              <div class="bar-chart__label">{{ bar.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Red -->
      <div class="chart-card" @click="$router.push('/network')">
        <div class="chart-card__head">
          <div>
            <div class="chart-card__title">Tráfico de red</div>
            <div class="chart-card__sub">Mbps IN/OUT · última hora</div>
          </div>
          <span class="chart-card__link">Ver red →</span>
        </div>
        <div class="chart-card__body">
          <div class="line-chart">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" class="line-chart__svg">
              <defs>
                <linearGradient id="g-in" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--accent)" stop-opacity=".3"/>
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="g-out" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--blue)" stop-opacity=".3"/>
                  <stop offset="100%" stop-color="var(--blue)" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <!-- IN -->
              <path :d="inPath" fill="url(#g-in)" stroke="none"/>
              <path :d="inLine" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/>
              <!-- OUT -->
              <path :d="outPath" fill="url(#g-out)" stroke="none"/>
              <path :d="outLine" fill="none" stroke="var(--blue)" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            <div class="line-chart__legend">
              <span class="line-chart__legend-item line-chart__legend-item--green">■ IN</span>
              <span class="line-chart__legend-item line-chart__legend-item--blue">■ OUT</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado de servicios -->
      <div class="chart-card chart-card--sm" @click="$router.push('/alerts')">
        <div class="chart-card__head">
          <div>
            <div class="chart-card__title">Estado de servicios</div>
            <div class="chart-card__sub">{{ totalDevices }} dispositivos registrados</div>
          </div>
          <span class="chart-card__link">Ver alertas →</span>
        </div>
        <div class="chart-card__body chart-card__body--center">
          <div class="donut-wrap">
            <svg viewBox="0 0 100 100" class="donut">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--bg-3)" stroke-width="12"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--accent)" stroke-width="12"
                :stroke-dasharray="`${onlineArc} ${circumference}`"
                stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--warning)" stroke-width="12"
                :stroke-dasharray="`${warningArc} ${circumference}`"
                :stroke-dashoffset="-onlineArc" stroke-linecap="round" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--danger)" stroke-width="12"
                :stroke-dasharray="`${downArc} ${circumference}`"
                :stroke-dashoffset="`${-(onlineArc + warningArc)}`" stroke-linecap="round" transform="rotate(-90 50 50)"/>
            </svg>
            <div class="donut__center">
              <span class="donut__value">{{ statusData.online }}</span>
              <span class="donut__label">online</span>
            </div>
          </div>
          <div class="donut-legend">
            <div class="donut-legend__item">
              <span class="donut-legend__dot donut-legend__dot--green"/>
              <span>Online</span>
              <span class="donut-legend__val">{{ statusData.online }}</span>
            </div>
            <div class="donut-legend__item">
              <span class="donut-legend__dot donut-legend__dot--yellow"/>
              <span>Warning</span>
              <span class="donut-legend__val">{{ statusData.warning }}</span>
            </div>
            <div class="donut-legend__item">
              <span class="donut-legend__dot donut-legend__dot--red"/>
              <span>Down</span>
              <span class="donut-legend__val">{{ statusData.down }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Logs recientes -->
      <div class="chart-card chart-card--sm" @click="$router.push('/logs')">
        <div class="chart-card__head">
          <div>
            <div class="chart-card__title">Eventos recientes</div>
            <div class="chart-card__sub">Últimos logs del sistema</div>
          </div>
          <span class="chart-card__link">Ver logs →</span>
        </div>
        <div class="chart-card__body">
          <div class="log-feed">
            <div v-for="log in recentLogs" :key="log.id" class="log-feed__item">
              <span class="log-feed__badge" :class="`log-feed__badge--${log.level}`">
                {{ log.level.toUpperCase() }}
              </span>
              <span class="log-feed__msg">{{ log.msg }}</span>
              <span class="log-feed__time">{{ log.time }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/modules/auth/store.js'

const authStore = useAuthStore()
const firstName = computed(() => authStore.user?.firstName ?? 'Operador')

// ── KPIs ──────────────────────────────────────────────────────
const kpis = [
  {
    label: 'Servidores activos', value: '12 / 14', color: 'green', to: '/servers',
    trend: '▲ 2 nuevos', trendColor: 'green',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`
  },
  {
    label: 'CPU promedio', value: '67%', color: 'yellow', to: '/servers',
    trend: '▲ +5%', trendColor: 'yellow',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`
  },
  {
    label: 'Tráfico de red', value: '4.2 Gbps', color: 'blue', to: '/network',
    trend: '↓ Pico hace 2h', trendColor: 'muted',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
  },
  {
    label: 'Alertas activas', value: '5', color: 'red', to: '/alerts',
    trend: '▲ +2 nuevas', trendColor: 'red',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
  },
]

// ── Bar chart data ─────────────────────────────────────────────
const cpuBars = [
  { label: 'web-01', val: 45 },
  { label: 'web-02', val: 94 },
  { label: 'db-mst', val: 38 },
  { label: 'cache',  val: 12 },
  { label: 'api-gw', val: 22 },
  { label: 'auth',   val: 67 },
  { label: 'vpn',    val: 31 },
]

// ── Line chart paths ───────────────────────────────────────────
const inVals  = [40,50,44,62,55,70,78,65,80,72,88,74]
const outVals = [28,34,30,44,38,50,58,48,56,50,62,52]
function buildPath(vals, close = false) {
  const w = 300, h = 100, n = vals.length
  const pts = vals.map((v, i) => [i * w/(n-1), h - v * h/100])
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i=1;i<pts.length;i++) {
    const [px,py] = pts[i-1], [cx,cy] = pts[i]
    d += ` C${(px+cx)/2},${py} ${(px+cx)/2},${cy} ${cx},${cy}`
  }
  if (close) d += ` L${pts[pts.length-1][0]},${h} L${pts[0][0]},${h} Z`
  return d
}
const inLine  = buildPath(inVals)
const inPath  = buildPath(inVals, true)
const outLine = buildPath(outVals)
const outPath = buildPath(outVals, true)

// ── Donut ─────────────────────────────────────────────────────
const statusData    = { online: 10, warning: 2, down: 2 }
const totalDevices  = computed(() => statusData.online + statusData.warning + statusData.down)
const circumference = 2 * Math.PI * 38
const onlineArc     = computed(() => (statusData.online  / totalDevices.value) * circumference)
const warningArc    = computed(() => (statusData.warning / totalDevices.value) * circumference)
const downArc       = computed(() => (statusData.down    / totalDevices.value) * circumference)

// ── Logs ──────────────────────────────────────────────────────
const recentLogs = [
  { id:1, level:'error', msg:'CPU crítica en web-02 (94%)',         time:'3m'  },
  { id:2, level:'warn',  msg:'RAM alta en db-master (87%)',          time:'12m' },
  { id:3, level:'error', msg:'auth-service no responde',             time:'18m' },
  { id:4, level:'warn',  msg:'Disco lleno en storage-01 (91%)',      time:'45m' },
  { id:5, level:'info',  msg:'Backup completado en db-replica',      time:'1h'  },
  { id:6, level:'info',  msg:'VPN sesión iniciada: user.noc@PE',     time:'2h'  },
]
</script>

<style scoped>
.dash { max-width: 1400px; animation: dashIn .3s ease both; }
@keyframes dashIn { from { opacity: 0; } to { opacity: 1; } }

/* Welcome */
.dash__welcome {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.dash__title {
  font-family: var(--font-display);
  font-size: 1.25rem; font-weight: 700;
  color: var(--text-1); letter-spacing: -.3px;
}
.dash__title-name { color: var(--accent); }
.dash__sub { font-size: .75rem; color: var(--text-3); margin-top: 4px; }
.dash__status {
  display: flex; align-items: center; gap: 7px;
  font-size: .72rem; color: var(--text-2);
  background: var(--accent-muted); border: 1px solid rgba(57,211,83,.15);
  padding: 5px 12px; border-radius: 99px;
}
.dash__status-dot {
  width: 6px; height: 6px; background: var(--accent); border-radius: 50%;
  box-shadow: 0 0 6px var(--accent); animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

/* KPI */
.kpi-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.kpi {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  transition: border-color .15s, box-shadow .15s;
  position: relative; overflow: hidden;
}
.kpi::before {
  content: ''; position: absolute; top: 0; left: 0;
  width: 3px; height: 100%; border-radius: 99px 0 0 99px;
}
.kpi--green::before { background: var(--accent); }
.kpi--yellow::before { background: var(--warning); }
.kpi--blue::before { background: var(--blue); }
.kpi--red::before { background: var(--danger); }
.kpi:hover { box-shadow: var(--shadow-card); }
.kpi--green:hover  { border-color: rgba(57,211,83,.3); }
.kpi--yellow:hover { border-color: rgba(210,153,34,.3); }
.kpi--blue:hover   { border-color: rgba(88,166,255,.3); }
.kpi--red:hover    { border-color: rgba(248,81,73,.3); }

.kpi__icon { color: var(--text-3); flex-shrink: 0; }
.kpi__body { flex: 1; }
.kpi__value {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1); line-height: 1;
}
.kpi__label { font-size: .7rem; color: var(--text-3); margin-top: 3px; }
.kpi__trend { font-size: .65rem; white-space: nowrap; }
.kpi__trend--green  { color: var(--accent); }
.kpi__trend--yellow { color: var(--warning); }
.kpi__trend--red    { color: var(--danger); }
.kpi__trend--muted  { color: var(--text-3); }

/* Charts grid */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 12px;
}
.chart-card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.chart-card:hover { border-color: var(--border-bright); box-shadow: var(--shadow-card); }
.chart-card__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 14px;
}
.chart-card__title { font-size: .85rem; font-weight: 600; color: var(--text-1); }
.chart-card__sub   { font-size: .68rem; color: var(--text-3); margin-top: 3px; }
.chart-card__link  { font-size: .68rem; color: var(--accent); white-space: nowrap; flex-shrink: 0; }
.chart-card__body  { height: 180px; }
.chart-card__body--center {
  display: flex; align-items: center; justify-content: center; gap: 20px;
}

/* Bar chart */
.bar-chart {
  display: flex; align-items: flex-end; gap: 6px;
  height: 100%; padding-bottom: 20px;
}
.bar-chart__col {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%;
}
.bar-chart__bar-wrap {
  flex: 1; width: 100%; display: flex; align-items: flex-end;
}
.bar-chart__bar {
  width: 100%; border-radius: 3px 3px 0 0;
  transition: height .6s cubic-bezier(.4,0,.2,1);
  min-height: 4px;
}
.bar-chart__label {
  font-size: .58rem; color: var(--text-3);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  width: 100%; text-align: center;
}

/* Line chart */
.line-chart { height: 100%; display: flex; flex-direction: column; gap: 8px; }
.line-chart__svg { flex: 1; width: 100%; }
.line-chart__legend { display: flex; gap: 14px; }
.line-chart__legend-item { font-size: .68rem; color: var(--text-3); }
.line-chart__legend-item--green { color: var(--accent); }
.line-chart__legend-item--blue  { color: var(--blue); }

/* Donut */
.donut-wrap { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
.donut { width: 100%; height: 100%; }
.donut__center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.donut__value {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700; color: var(--text-1); line-height: 1;
}
.donut__label { font-size: .6rem; color: var(--text-3); }

.donut-legend { display: flex; flex-direction: column; gap: 8px; }
.donut-legend__item {
  display: flex; align-items: center; gap: 7px;
  font-size: .72rem; color: var(--text-2);
}
.donut-legend__dot {
  width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0;
}
.donut-legend__dot--green  { background: var(--accent); }
.donut-legend__dot--yellow { background: var(--warning); }
.donut-legend__dot--red    { background: var(--danger); }
.donut-legend__val { margin-left: auto; font-weight: 600; color: var(--text-1); }

/* Log feed */
.log-feed { display: flex; flex-direction: column; gap: 6px; height: 100%; overflow-y: auto; }
.log-feed__item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius);
  background: var(--bg-2);
  font-size: .72rem;
  transition: background .12s;
}
.log-feed__item:hover { background: var(--bg-3); }
.log-feed__badge {
  padding: 1px 5px; border-radius: 3px;
  font-size: .58rem; font-weight: 700; flex-shrink: 0;
}
.log-feed__badge--error { background: var(--danger-muted);  color: var(--danger); }
.log-feed__badge--warn  { background: var(--warning-muted); color: var(--warning); }
.log-feed__badge--info  { background: var(--blue-muted);    color: var(--blue); }
.log-feed__msg  { flex: 1; color: var(--text-2); }
.log-feed__time { color: var(--text-3); flex-shrink: 0; }

/* Responsive */
@media (max-width: 960px) { .charts-grid { grid-template-columns: 1fr; } }
</style>
