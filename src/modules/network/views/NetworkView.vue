<template>
  <div class="net">

    <!-- Header -->
    <div class="net__head">
      <div>
        <h1 class="net__title">Red y conectividad</h1>
        <p class="net__sub">Vista general del estado de la red y dispositivos monitoreados (LibreNMS)</p>
      </div>
      <div class="net__head-right">
        <span v-if="lastRefresh" class="net__updated">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" :class="{ spin: anyLoading }">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Última actualización: {{ lastRefresh }}
        </span>
        <button class="net__auto" :class="{ 'net__auto--on': autoOn }" @click="autoOn = !autoOn">
          <span class="net__auto-dot" />
          {{ autoOn ? 'En vivo' : 'Pausado' }}
        </button>
      </div>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="net__cards">
      <div class="kpi kpi--blue">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>
            <circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
            <line x1="6.5" y1="6.5" x2="10.5" y2="10.5"/><line x1="17.5" y1="6.5" x2="13.5" y2="10.5"/>
            <line x1="6.5" y1="17.5" x2="10.5" y2="13.5"/><line x1="17.5" y1="17.5" x2="13.5" y2="13.5"/>
          </svg>
        </span>
        <div class="kpi__label">DISPOSITIVOS</div>
        <div class="kpi__value">{{ summary.data?.dispositivos ?? '—' }}</div>
        <div class="kpi__foot">
          <span class="kpi__ok">Activos: {{ summary.data?.dispositivosActivos ?? 0 }}</span>
          <span class="kpi__sep">|</span>
          <span class="kpi__bad">Caídos: {{ devicesDown }}</span>
        </div>
      </div>

      <div class="kpi kpi--green">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="10" rx="2"/><line x1="6" y1="11" x2="6" y2="13"/>
            <line x1="10" y1="11" x2="10" y2="13"/><line x1="14" y1="11" x2="14" y2="13"/><line x1="18" y1="11" x2="18" y2="13"/>
          </svg>
        </span>
        <div class="kpi__label">INTERFACES</div>
        <div class="kpi__value">{{ summary.data?.interfaces ?? '—' }}</div>
        <div class="kpi__foot"><span class="kpi__muted">Monitoreadas</span></div>
      </div>

      <div class="kpi kpi--amber">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <div class="kpi__label">ALERTAS ACTIVAS</div>
        <div class="kpi__value">{{ summary.data?.alertasActivas ?? '—' }}</div>
        <div class="kpi__foot">
          <span class="kpi__bad">Críticas: {{ alertChart.data?.datos?.criticas ?? 0 }}</span>
          <span class="kpi__sep">|</span>
          <span class="kpi__warn">Advertencias: {{ alertChart.data?.datos?.advertencias ?? 0 }}</span>
        </div>
      </div>

      <div class="kpi kpi--purple">
        <span class="kpi__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        </span>
        <div class="kpi__label">DISPONIBILIDAD DE RED</div>
        <div class="kpi__value">{{ availability != null ? availability.toFixed(1) + '%' : '—' }}</div>
        <div class="kpi__foot"><span class="kpi__muted">Disponibilidad general</span></div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="net__charts">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Estado de dispositivos</span></div>
        <div class="panel__body panel__body--center">
          <div v-if="devChart.loading" class="chart-sk" />
          <div v-else-if="devChart.error" class="panel__err">{{ devChart.error }}</div>
          <StatusDonut v-else :segments="deviceSegments" />
        </div>
        <div class="panel__foot">Dispositivos monitoreados por LibreNMS</div>
      </div>

      <div class="panel">
        <div class="panel__head"><span class="panel__title">Estado de interfaces</span></div>
        <div class="panel__body panel__body--center">
          <div v-if="ifChart.loading" class="chart-sk" />
          <div v-else-if="ifChart.error" class="panel__err">{{ ifChart.error }}</div>
          <StatusDonut v-else :segments="interfaceSegments" />
        </div>
        <div class="panel__foot">Interfaces monitoreadas por LibreNMS</div>
      </div>

      <div class="panel">
        <div class="panel__head"><span class="panel__title">Alertas de red por severidad</span></div>
        <div class="panel__body">
          <div v-if="alertChart.loading" class="chart-sk" />
          <div v-else-if="alertChart.error" class="panel__err">{{ alertChart.error }}</div>
          <AlertsSeverityChart v-else
            :criticas="alertChart.data?.datos?.criticas ?? 0"
            :advertencias="alertChart.data?.datos?.advertencias ?? 0"
          />
        </div>
        <div class="panel__foot">Alertas activas en la red</div>
      </div>
    </div>

    <!-- Tablas -->
    <div class="net__tables">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Dispositivos de red</span></div>
        <div v-if="devTable.loading" class="panel__pad"><div v-for="i in 5" :key="i" class="row-sk" /></div>
        <div v-else-if="devTable.error" class="panel__err">{{ devTable.error }}</div>
        <div v-else-if="!devices.length" class="panel__empty">Sin dispositivos</div>
        <div v-else class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr><th class="tbl__th">Nombre</th><th class="tbl__th">IP</th><th class="tbl__th">Tipo</th><th class="tbl__th">Estado</th><th class="tbl__th">Última actualización</th></tr>
            </thead>
            <tbody>
              <tr v-for="d in devices" :key="d.deviceId" class="tbl__tr">
                <td class="tbl__td"><span class="strong">{{ d.display || d.hostname || d.sysName }}</span></td>
                <td class="tbl__td"><code class="mono">{{ d.ip }}</code></td>
                <td class="tbl__td">{{ d.type || '—' }}</td>
                <td class="tbl__td">
                  <span class="pill" :class="d.status === 1 ? 'pill--up' : 'pill--down'">
                    {{ d.status === 1 ? 'Activo' : (d.statusLabel || 'Caído') }}
                  </span>
                </td>
                <td class="tbl__td"><span class="muted">{{ d.lastPolled || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head"><span class="panel__title">Interfaces de red</span></div>
        <div v-if="ifTable.loading" class="panel__pad"><div v-for="i in 5" :key="i" class="row-sk" /></div>
        <div v-else-if="ifTable.error" class="panel__err">{{ ifTable.error }}</div>
        <div v-else-if="!interfaces.length" class="panel__empty">Sin interfaces</div>
        <div v-else class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr><th class="tbl__th">Dispositivo</th><th class="tbl__th">Interfaz</th><th class="tbl__th">Estado</th><th class="tbl__th">Administración</th><th class="tbl__th">Descripción</th></tr>
            </thead>
            <tbody>
              <tr v-for="i in interfaces" :key="i.portId" class="tbl__tr">
                <td class="tbl__td"><span class="strong">{{ deviceNameFor(i.deviceId) }}</span></td>
                <td class="tbl__td"><code class="mono">{{ i.ifName }}</code></td>
                <td class="tbl__td"><StateTag :value="i.ifOperStatus" /></td>
                <td class="tbl__td"><StateTag :value="i.ifAdminStatus" /></td>
                <td class="tbl__td"><span class="muted">{{ i.ifAlias || i.ifDescr || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head"><span class="panel__title">Alertas de red</span></div>
        <div v-if="alertTable.loading" class="panel__pad"><div v-for="i in 5" :key="i" class="row-sk" /></div>
        <div v-else-if="alertTable.error" class="panel__err">{{ alertTable.error }}</div>
        <div v-else-if="!alerts.length" class="alerts-empty">
          <span class="alerts-empty__check">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <div class="alerts-empty__title">No hay alertas activas</div>
          <div class="alerts-empty__sub">La red se encuentra operativa</div>
        </div>
        <div v-else class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr><th class="tbl__th">Fecha/Hora</th><th class="tbl__th">Dispositivo</th><th class="tbl__th">Severidad</th><th class="tbl__th">Evento</th><th class="tbl__th">Estado</th></tr>
            </thead>
            <tbody>
              <tr v-for="(a, idx) in alerts" :key="idx" class="tbl__tr">
                <td class="tbl__td"><span class="muted">{{ a.timestamp || a.fecha || '—' }}</span></td>
                <td class="tbl__td">{{ a.device || a.hostname || '—' }}</td>
                <td class="tbl__td">{{ a.severity || a.severidad || '—' }}</td>
                <td class="tbl__td">{{ a.rule || a.evento || a.message || '—' }}</td>
                <td class="tbl__td">{{ a.state || a.estado || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h } from 'vue'
import { useNetwork } from '@/modules/network/composables/useNetwork.js'
import { useLoaderStore } from '@/stores/loader.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import StatusDonut         from '@/modules/network/components/StatusDonut.vue'
import AlertsSeverityChart from '@/modules/network/components/AlertsSeverityChart.vue'

const {
  summary, devChart, ifChart, alertChart, devTable, ifTable, alertTable,
  anyLoading, lastRefresh, devicesDown, availability,
  devices, interfaces, alerts, deviceNameFor,
  loadAll,
} = useNetwork()

const StateTag = {
  props: { value: String },
  setup(props) {
    return () => {
      const v = (props.value ?? '').toLowerCase()
      const up = v === 'up'
      const cls = up ? 'tag--up' : (v === 'down' ? 'tag--down' : 'tag--muted')
      return h('span', { class: ['tag', cls] }, [
        h('span', { class: 'tag__dot' }),
        props.value || '—',
      ])
    }
  },
}

const deviceSegments = computed(() => {
  const theme = readChartTheme()
  const d = devChart.value.data?.datos ?? { activos: 0, caidos: 0 }
  return [
    { label: 'Activos', value: d.activos ?? 0, color: theme.success },
    { label: 'Caídos',  value: d.caidos ?? 0,  color: theme.danger },
  ]
})

const interfaceSegments = computed(() => {
  const theme = readChartTheme()
  const d = ifChart.value.data?.datos ?? { activas: 0, inactivas: 0 }
  return [
    { label: 'Activas',   value: d.activas ?? 0,   color: theme.success },
    { label: 'Inactivas', value: d.inactivas ?? 0, color: theme.danger },
  ]
})

const autoOn = ref(true)
let timer = null
const REFRESH_MS = 30000

const loader = useLoaderStore()

onMounted(async () => {
  await loader.wrap(loadAll(), 'Cargando red...')
  timer = setInterval(() => { if (autoOn.value) loadAll(true) }, REFRESH_MS)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.net { max-width: 1320px; }

.net__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.net__title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-1); }
.net__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }
.net__head-right { display: flex; align-items: center; gap: 10px; }
.net__updated { display: inline-flex; align-items: center; gap: 6px; font-size: .74rem; color: var(--text-3); font-family: var(--font-mono); }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.net__auto { display: flex; align-items: center; gap: 7px; padding: 6px 11px; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-3); font-family: var(--font-mono); font-size: .7rem; font-weight: 600; cursor: pointer; }
.net__auto-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); }
.net__auto--on { color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, var(--border)); }
.net__auto--on .net__auto-dot { background: var(--success); box-shadow: 0 0 7px var(--success); animation: pulse 2s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

.net__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 18px; }
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
.kpi__foot { font-size: .72rem; display: flex; align-items: center; justify-content: center; gap: 6px; }
.kpi__ok { color: var(--success); font-weight: 600; }
.kpi__bad { color: var(--danger); font-weight: 600; }
.kpi__warn { color: var(--warning); font-weight: 600; }
.kpi__muted { color: var(--text-3); }
.kpi__sep { color: var(--border-mid); }

.panel { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
.panel__head { padding: 12px 16px; border-bottom: 1px solid var(--border); }
.panel__title { font-family: var(--font-display); font-size: .82rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .03em; }
.panel__body { padding: 18px; flex: 1; }
.panel__body--center { display: flex; align-items: center; justify-content: center; }
.panel__foot { padding: 10px 16px; border-top: 1px solid var(--border); font-size: .72rem; color: var(--text-3); text-align: center; }
.panel__pad { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.panel__err { padding: 16px; font-size: .8rem; color: var(--danger); }
.panel__empty { padding: 30px; text-align: center; color: var(--text-3); font-size: .82rem; }

.net__charts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
.net__tables { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: start; }
.net__tables .panel { height: 460px; }
.net__tables .panel__pad,
.net__tables .panel__err,
.net__tables .panel__empty,
.net__tables .alerts-empty { flex: 1; }

.chart-sk { width: 100%; height: 170px; background: var(--bg-3); border-radius: var(--radius); animation: shimmer 1.4s ease infinite; }
.row-sk { height: 32px; background: var(--bg-3); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

.tbl-wrap { overflow-x: auto; overflow-y: auto; flex: 1; min-height: 0; }
.tbl-wrap .tbl__th { position: sticky; top: 0; z-index: 1; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl__th { text-align: left; padding: 9px 14px; font-size: .62rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2); }
.tbl__tr:hover { background: var(--bg-2); }
.tbl__td { padding: 9px 14px; font-size: .8rem; color: var(--text-1); border-bottom: 1px solid var(--border); white-space: nowrap; }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }
.strong { font-weight: 600; }
.mono { font-family: var(--font-mono); font-size: .76rem; color: var(--text-2); }
.muted { color: var(--text-3); font-size: .76rem; }

.pill { font-size: .68rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; }
.pill--up { background: var(--success-muted); color: var(--success); }
.pill--down { background: var(--danger-muted); color: var(--danger); }

.tag { display: inline-flex; align-items: center; gap: 5px; font-size: .74rem; font-weight: 600; }
.tag__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tag--up { color: var(--success); }
.tag--down { color: var(--danger); }
.tag--muted { color: var(--text-3); }

.alerts-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 20px; text-align: center; flex: 1; }
.alerts-empty__check { width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--success-muted); color: var(--success); }
.alerts-empty__title { font-family: var(--font-display); font-size: .92rem; font-weight: 700; color: var(--success); }
.alerts-empty__sub { font-size: .76rem; color: var(--text-3); }

@media (max-width: 1000px) {
  .net__charts { grid-template-columns: 1fr; }
  .net__tables { grid-template-columns: 1fr; }
}
</style>