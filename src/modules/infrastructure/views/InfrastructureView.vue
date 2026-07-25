<template>
  <div class="infra">

    <!-- Header -->
    <div class="infra__head">
      <div>
        <h1 class="infra__title">Supervisión de infraestructura</h1>
        <p class="infra__sub">Estado de nodos, máquinas virtuales y uso de recursos</p>
      </div>
      <div class="infra__head-right">
        <span v-if="lastRefresh" class="infra__updated">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" :class="{ spin: anyLoading }">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Última actualización: {{ lastRefresh }}
        </span>
        <button class="infra__auto" :class="{ 'infra__auto--on': autoOn }" @click="autoOn = !autoOn">
          <span class="infra__auto-dot" />
          {{ autoOn ? 'En vivo' : 'Pausado' }}
        </button>
      </div>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="infra__cards">
      <div class="kpi kpi--blue">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
        </span>
        <div class="kpi__label">NODOS ACTIVOS</div>
        <div class="kpi__value">{{ summary.data?.nodosActivos ?? '—' }}</div>
        <div class="kpi__foot"><span class="kpi__muted">Hipervisores en línea</span></div>
      </div>

      <div class="kpi kpi--green">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </span>
        <div class="kpi__label">MÁQUINAS VIRTUALES</div>
        <div class="kpi__value">{{ summary.data?.maquinasVirtuales ?? '—' }}</div>
        <div class="kpi__foot"><span class="kpi__muted">VMs gestionadas</span></div>
      </div>

      <div class="kpi kpi--amber">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
            <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
            <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
            <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
            <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
          </svg>
        </span>
        <div class="kpi__label">USO DE MEMORIA</div>
        <div class="kpi__value">{{ fmtPct(summary.data?.memoriaUso) }}</div>
        <div class="kpi__foot"><span class="kpi__muted">Memoria RAM del clúster</span></div>
      </div>

      <div class="kpi kpi--purple">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        </span>
        <div class="kpi__label">ALMACENAMIENTO</div>
        <div class="kpi__value">{{ fmtPct(summary.data?.almacenamientoUso) }}</div>
        <div class="kpi__foot"><span class="kpi__muted">Uso de disco del clúster</span></div>
      </div>
    </div>

    <!-- Uso de recursos -->
    <div class="infra__body">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Uso de recursos</span></div>
        <div v-if="resources.loading" class="panel__body"><div class="chart-sk" /></div>
        <div v-else-if="resources.error" class="panel__err">{{ resources.error }}</div>
        <div v-else class="panel__body">
          <div class="rings">
            <div v-for="r in resourceRings" :key="r.key" class="ring">
              <div class="ring__label">{{ r.label }}</div>
              <div class="ring__circle">
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-3)" stroke-width="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke-width="10"
                    stroke-linecap="round"
                    :stroke="r.color"
                    :stroke-dasharray="RING_CIRCUMFERENCE"
                    :stroke-dashoffset="ringOffset(r.value)"
                    transform="rotate(-90 60 60)"
                    class="ring__fill"
                  />
                </svg>
                <div class="ring__center">{{ r.value.toFixed(0) }}%</div>
              </div>
              <div class="ring__caption">{{ r.caption }}</div>
            </div>
          </div>
        </div>
        <div class="panel__foot">Uso actual de recursos del clúster de virtualización</div>
      </div>

      <!-- Distribución (dona) -->
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Distribución de recursos</span></div>
        <div v-if="resources.loading" class="panel__body"><div class="chart-sk" /></div>
        <div v-else-if="resources.error" class="panel__err">{{ resources.error }}</div>
        <div v-else class="panel__body panel__body--center">
          <StatusDonut :segments="resourceSegments" />
        </div>
        <div class="panel__foot">Comparativa de uso entre recursos</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInfrastructure } from '@/modules/infrastructure/composables/useInfrastructure.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import StatusDonut from '@/modules/network/components/StatusDonut.vue'
import { useLoaderStore } from '@/stores/loader.js'

const {
  summary, resources, anyLoading, lastRefresh,
  cpu, memoria, almacenamiento, loadAll,
} = useInfrastructure()

function fmtPct(v) {
  if (v == null || Number.isNaN(v)) return '—'
  return `${Number(v).toFixed(1)}%`
}

// Anillo de porcentaje (SVG con stroke-dasharray), compilado como parte
// del template de este SFC para que el CSS con scope se aplique bien
// (un componente aparte creado con h() no hereda el atributo de scope).
const RING_R = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R

function ringOffset(value) {
  const pct = Math.min(Math.max(value ?? 0, 0), 100)
  return RING_CIRCUMFERENCE * (1 - pct / 100)
}

const resourceRings = computed(() => {
  const theme = readChartTheme()
  return [
    { key: 'cpu', label: 'CPU', value: cpu.value, color: theme.success, caption: 'Uso promedio de CPU en todos los nodos' },
    { key: 'mem', label: 'Memoria', value: memoria.value, color: theme.blue, caption: 'Uso total de memoria RAM del clúster' },
    { key: 'disk', label: 'Almacenamiento', value: almacenamiento.value, color: '#a78bfa', caption: 'Uso total del almacenamiento configurado' },
  ]
})

const resourceSegments = computed(() => {
  const theme = readChartTheme()
  return [
    { label: 'CPU',            value: Math.round(cpu.value),            color: theme.accent },
    { label: 'Memoria',        value: Math.round(memoria.value),        color: theme.warning },
    { label: 'Almacenamiento', value: Math.round(almacenamiento.value), color: theme.blue },
  ]
})

const autoOn = ref(true)
let timer = null
const REFRESH_MS = 30000

const loader = useLoaderStore()

onMounted(async () => {
  await loader.wrap(loadAll(), 'Cargando infraestructura...')
  timer = setInterval(() => { if (autoOn.value) loadAll(true) }, REFRESH_MS)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.infra { max-width: auto; }

.infra__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.infra__title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-1); }
.infra__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }
.infra__head-right { display: flex; align-items: center; gap: 10px; }
.infra__updated { display: inline-flex; align-items: center; gap: 6px; font-size: .74rem; color: var(--text-3); font-family: var(--font-mono); }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.infra__auto { display: flex; align-items: center; gap: 7px; padding: 6px 11px; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-3); font-family: var(--font-mono); font-size: .7rem; font-weight: 600; cursor: pointer; }
.infra__auto-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); }
.infra__auto--on { color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, var(--border)); }
.infra__auto--on .infra__auto-dot { background: var(--success); box-shadow: 0 0 7px var(--success); animation: pulse 2s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.infra__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
.kpi { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; text-align: center; }
.kpi__icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; margin-bottom: 10px; }
.kpi--blue .kpi__icon { background: var(--blue-muted); color: var(--blue); }
.kpi--green .kpi__icon { background: var(--success-muted); color: var(--success); }
.kpi--amber .kpi__icon { background: var(--warning-muted); color: var(--warning); }
.kpi--purple .kpi__icon { background: rgba(167,139,250,.12); color: #a78bfa; }
.kpi__label { font-size: .68rem; font-weight: 700; color: var(--text-3); letter-spacing: .05em; }
.kpi__value { font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-1); line-height: 1.1; margin: 4px 0 8px; }
.kpi--green .kpi__value { color: var(--success); }
.kpi--purple .kpi__value { color: #a78bfa; }
.kpi__foot { font-size: .72rem; }
.kpi__muted { color: var(--text-3); }

.infra__body { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }

.panel { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
.panel__head { padding: 12px 16px; border-bottom: 1px solid var(--border); }
.panel__title { font-family: var(--font-display); font-size: .82rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .03em; }
.panel__body { padding: 22px 18px; flex: 1; }
.panel__body--center { display: flex; align-items: center; justify-content: center; }
.panel__foot { padding: 10px 16px; border-top: 1px solid var(--border); font-size: .72rem; color: var(--text-3); text-align: center; }
.panel__err { padding: 16px; font-size: .8rem; color: var(--danger); }

.rings { display: flex; align-items: flex-start; justify-content: space-around; gap: 16px; flex-wrap: wrap; }
.ring { display: flex; flex-direction: column; align-items: center; gap: 12px; max-width: 160px; }
.ring__label { font-size: .8rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .04em; }
.ring__circle { position: relative; width: 120px; height: 120px; }
.ring__circle svg { width: 100%; height: 100%; }
.ring__fill { transition: stroke-dashoffset .6s ease; }
.ring__center {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-1);
}
.ring__caption { font-size: .72rem; color: var(--text-3); text-align: center; line-height: 1.4; }

.chart-sk { width: 100%; height: 170px; background: var(--bg-3); border-radius: var(--radius); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

@media (max-width: 900px) {
  .infra__body { grid-template-columns: 1fr; }
}
</style>