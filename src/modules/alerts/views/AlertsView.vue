<template>
  <div class="alerts">

    <!-- Header -->
    <div class="alerts__head">
      <div>
        <h1 class="alerts__title">Alertas e incidentes</h1>
        <p class="alerts__sub">Monitoreo y gestión de alertas generadas por LibreNMS y servicios integrados</p>
      </div>
      <div class="alerts__head-right">
        <span v-if="lastRefresh" class="alerts__updated">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" :class="{ spin: anyLoading }">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Última actualización: {{ lastRefresh }}
        </span>
        <button class="alerts__auto" :class="{ 'alerts__auto--on': autoOn }" @click="autoOn = !autoOn">
          <span class="alerts__auto-dot" />
          {{ autoOn ? 'En vivo' : 'Pausado' }}
        </button>
      </div>
    </div>

    <!-- ══════ Tarjetas de resumen ══════ -->
    <div class="alerts__cards">
      <div class="scard">
        <span class="scard__ico scard__ico--ok">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
        <div class="scard__label">ESTADO DEL SISTEMA</div>
        <div class="scard__state scard__state--ok">{{ summary.data?.estado || '—' }}</div>
        <div class="scard__cap">{{ (indicadores?.alertasActivas ?? 0) === 0 ? 'Todos los servicios funcionando' : 'Hay alertas que requieren atención' }}</div>
      </div>

      <div class="scard">
        <span class="scard__ico" :class="(indicadores?.alertasActivas ?? 0) > 0 ? 'scard__ico--bad' : 'scard__ico--muted'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </span>
        <div class="scard__label">ALERTAS ACTIVAS</div>
        <div class="scard__big">{{ indicadores?.alertasActivas ?? '—' }}</div>
        <div class="scard__cap">{{ (indicadores?.alertasActivas ?? 0) === 0 ? 'Sin alertas activas' : 'Requieren revisión' }}</div>
      </div>

      <div class="scard">
        <span class="scard__ico scard__ico--blue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </span>
        <div class="scard__label">INCIDENTES HISTÓRICOS</div>
        <div class="scard__big">{{ indicadores?.incidentesHistoricos ?? '—' }}</div>
        <div class="scard__cap">Últimos 7 días</div>
      </div>

      <div class="scard">
        <span class="scard__ico scard__ico--amber">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </span>
        <div class="scard__label">NOTIFICACIONES</div>
        <div class="notif__rows">
          <div class="notif__row">
            <span>Telegram</span>
            <span class="notif__badge" :class="notificaciones?.telegram ? 'notif__badge--on' : 'notif__badge--off'">
              {{ notificaciones?.telegram ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>
          <div class="notif__row">
            <span>Correo</span>
            <span class="notif__badge" :class="notificaciones?.correo ? 'notif__badge--on' : 'notif__badge--off'">
              {{ notificaciones?.correo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════ Gráficos ══════ -->
    <div class="alerts__charts">
      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Alertas por severidad</span>
          <span class="panel__hint">Distribución por nivel</span>
        </div>
        <div v-if="severityChart.loading" class="panel__body"><div class="sk sk--chart" /></div>
        <div v-else-if="severityChart.error" class="panel__err">{{ severityChart.error }}</div>
        <div v-else class="panel__body panel__body--center">
          <StatusDonut :segments="severitySegments" />
        </div>
      </div>

      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Alertas por módulo</span>
          <span class="panel__hint">Distribución por módulo o servicio</span>
        </div>
        <div v-if="modulesChart.loading" class="panel__body"><div class="sk sk--chart" /></div>
        <div v-else-if="modulesChart.error" class="panel__err">{{ modulesChart.error }}</div>
        <div v-else-if="!moduleBars.length" class="panel__empty">Sin datos por módulo</div>
        <div v-else class="panel__body panel__body--scroll">
          <ModuleAlertsChart :items="moduleBars" />
        </div>
      </div>
    </div>

    <!-- ══════ Tablas ══════ -->
    <div class="alerts__tables">
      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Últimos incidentes</span>
          <span class="panel__hint">Historial reciente detectado</span>
        </div>
        <div v-if="events.loading" class="panel__pad"><div v-for="i in 5" :key="i" class="sk sk--row" /></div>
        <div v-else-if="events.error" class="panel__err">{{ events.error }}</div>
        <div v-else-if="!incidentRows.length" class="panel__empty">No hay incidentes registrados</div>
        <div v-else class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th class="tbl__th">Fecha/Hora</th><th class="tbl__th">Servicio afectado</th>
                <th class="tbl__th">Módulo</th><th class="tbl__th">Severidad</th><th class="tbl__th">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in incidentRows" :key="row.id" class="tbl__tr">
                <td class="tbl__td"><span class="muted">{{ row.time }}</span></td>
                <td class="tbl__td"><span class="strong">{{ row.service }}</span></td>
                <td class="tbl__td">{{ row.module }}</td>
                <td class="tbl__td">
                  <span class="badge" :class="`badge--${row.severityTone}`">{{ row.severityLabel }}</span>
                </td>
                <td class="tbl__td"><span class="muted" :title="row.detail">{{ row.detail }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="panel__foot-link">
          <span class="hint-note">El estado de resolución no está disponible en el backend todavía.</span>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Eventos y logs recientes</span>
          <span class="panel__hint">Graylog · operativos y de seguridad</span>
        </div>
        <div v-if="events.loading" class="panel__pad"><div v-for="i in 5" :key="i" class="sk sk--row" /></div>
        <div v-else-if="events.error" class="panel__err">{{ events.error }}</div>
        <div v-else-if="!recentEvents.length" class="panel__empty">No hay eventos recientes</div>
        <div v-else class="ev-list">
          <div v-for="ev in recentEvents" :key="ev.id" class="ev">
            <span class="ev__dot" :class="`ev__dot--${ev._tone}`" />
            <div class="ev__body">
              <div class="ev__time">{{ ev._time }}</div>
              <div class="ev__msg">{{ ev.message || '(sin mensaje)' }}</div>
              <div class="ev__src">{{ ev.source || ev.applicationName || '—' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════ Flujo de información (informativo) ══════ -->
    <!--
    <div class="panel">
      <div class="panel__head"><span class="panel__title">Flujo de información del sistema de alertas</span></div>
      <div class="flow">
        <div class="flow__step">
          <span class="flow__ico flow__ico--muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
            </svg>
          </span>
          <div class="flow__title">Dispositivos / Servicios</div>
        </div>
        <span class="flow__arrow">→</span>
        <div class="flow__step">
          <span class="flow__ico flow__ico--green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </span>
          <div class="flow__title">LibreNMS</div>
          <div class="flow__sub">Monitoreo</div>
        </div>
        <span class="flow__arrow">→</span>
        <div class="flow__step">
          <span class="flow__ico flow__ico--danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          <div class="flow__title">Alert Manager SCNO</div>
          <div class="flow__sub">Alertas normalizadas</div>
        </div>
        <span class="flow__arrow">→</span>
        <div class="flow__step">
          <span class="flow__ico flow__ico--blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
          </span>
          <div class="flow__title">API SCNO</div>
          <div class="flow__sub">Datos consolidados</div>
        </div>
        <span class="flow__arrow">→</span>
        <div class="flow__step">
          <span class="flow__ico flow__ico--accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </span>
          <div class="flow__title">Frontend SuiteCore</div>
          <div class="flow__sub">Visualización unificada</div>
        </div>
      </div>
      <div class="flow__note">
        Las alertas provienen de LibreNMS, se normalizan en Alert Manager SCNO y se presentan de forma unificada en la plataforma SuiteCore.
      </div>
    </div>
  -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAlerts } from '@/modules/alerts/composables/useAlerts.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import StatusDonut       from '@/modules/network/components/StatusDonut.vue'
import ModuleAlertsChart from '@/modules/alerts/components/ModuleAlertsChart.vue'

const {
  summary, severityChart, modulesChart, events, securityEvents,
  anyLoading, lastRefresh, indicadores, notificaciones,
  moduleBars, recentEvents, incidentRows,
  loadAll,
} = useAlerts()

const severitySegments = computed(() => {
  const theme = readChartTheme()
  const d = severityChart.value.data?.datos ?? { criticas: 0, advertencias: 0, informativas: 0 }
  return [
    { label: 'Críticas',     value: d.criticas ?? 0,     color: theme.danger },
    { label: 'Advertencias', value: d.advertencias ?? 0, color: theme.warning },
    { label: 'Informativas', value: d.informativas ?? 0, color: theme.blue },
  ]
})

const autoOn = ref(true)
let timer = null
const REFRESH_MS = 30000

onMounted(async () => {
  await loadAll()
  timer = setInterval(() => { if (autoOn.value) loadAll(true) }, REFRESH_MS)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.alerts { max-width: 1320px; display: flex; flex-direction: column; gap: 16px; }

.alerts__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.alerts__title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-1); }
.alerts__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }
.alerts__head-right { display: flex; align-items: center; gap: 10px; }
.alerts__updated { display: inline-flex; align-items: center; gap: 6px; font-size: .72rem; color: var(--text-3); font-family: var(--font-mono); }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.alerts__auto { display: flex; align-items: center; gap: 7px; padding: 6px 11px; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-3); font-family: var(--font-mono); font-size: .7rem; font-weight: 600; cursor: pointer; }
.alerts__auto-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); }
.alerts__auto--on { color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, var(--border)); }
.alerts__auto--on .alerts__auto-dot { background: var(--success); box-shadow: 0 0 7px var(--success); animation: pulse 2s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

/* Tarjetas */
.alerts__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.scard { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
.scard__ico { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; margin-bottom: 10px; }
.scard__ico--ok { background: var(--success-muted); color: var(--success); }
.scard__ico--bad { background: var(--danger-muted); color: var(--danger); }
.scard__ico--muted { background: var(--bg-3); color: var(--text-3); }
.scard__ico--blue { background: var(--blue-muted); color: var(--blue); }
.scard__ico--amber { background: var(--warning-muted); color: var(--warning); }
.scard__label { font-size: .68rem; font-weight: 700; color: var(--text-3); letter-spacing: .05em; }
.scard__state { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; margin: 4px 0 6px; }
.scard__state--ok { color: var(--success); }
.scard__big { font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-1); line-height: 1.1; margin: 4px 0 6px; }
.scard__cap { font-size: .74rem; color: var(--text-3); }

.notif__rows { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.notif__row { display: flex; align-items: center; justify-content: space-between; font-size: .82rem; color: var(--text-2); }
.notif__badge { font-size: .64rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.notif__badge--on { background: var(--success-muted); color: var(--success); }
.notif__badge--off { background: var(--bg-3); color: var(--text-3); }

/* Paneles */
.panel { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
.panel__head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.panel__title { font-family: var(--font-display); font-size: .82rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .03em; }
.panel__hint { font-size: .72rem; color: var(--text-3); }
.panel__body { padding: 18px; flex: 1; }
.panel__body--center { display: flex; align-items: center; justify-content: center; }
.panel__body--scroll { max-height: 320px; overflow-y: auto; }
.panel__pad { padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; }
.panel__err { padding: 16px; font-size: .8rem; color: var(--danger); }
.panel__empty { padding: 32px 20px; text-align: center; color: var(--text-3); font-size: .82rem; }

.sk { background: var(--bg-3); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
.sk--chart { width: 100%; height: 190px; }
.sk--row { height: 30px; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

.alerts__charts { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; }
.alerts__tables { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; }

/* Tabla incidentes */
.tbl-wrap { overflow-x: auto; overflow-y: auto; max-height: 360px; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl__th { position: sticky; top: 0; z-index: 1; text-align: left; padding: 9px 14px; font-size: .62rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2); }
.tbl__tr:hover { background: var(--bg-2); }
.tbl__td { padding: 9px 14px; font-size: .8rem; color: var(--text-1); border-bottom: 1px solid var(--border); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }
.strong { font-weight: 600; }
.muted { color: var(--text-3); font-size: .78rem; }
.panel__foot-link { padding: 8px 16px; border-top: 1px solid var(--border); }
.hint-note { font-size: .68rem; color: var(--text-3); font-style: italic; }

.badge { font-size: .68rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; white-space: nowrap; }
.badge--danger { background: var(--danger-muted); color: var(--danger); }
.badge--warning { background: var(--warning-muted); color: var(--warning); }
.badge--info { background: var(--blue-muted); color: var(--blue); }
.badge--muted { background: var(--bg-3); color: var(--text-3); }

/* Lista de eventos */
.ev-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; max-height: 360px; overflow-y: auto; }
.ev { display: flex; gap: 10px; align-items: flex-start; }
.ev__dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.ev__dot--danger { background: var(--danger); }
.ev__dot--warning { background: var(--warning); }
.ev__dot--info { background: var(--blue); }
.ev__dot--muted { background: var(--text-3); }
.ev__body { min-width: 0; }
.ev__time { font-family: var(--font-mono); font-size: .68rem; color: var(--text-3); }
.ev__msg { font-size: .82rem; color: var(--text-1); font-weight: 600; margin-top: 2px; }
.ev__src { font-size: .72rem; color: var(--text-3); margin-top: 1px; }

/* Flujo de información */
.flow { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; padding: 22px 16px; flex-wrap: wrap; }
.flow__step { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 7px; min-width: 100px; flex: 1; }
.flow__ico { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.flow__ico--muted { background: var(--bg-3); color: var(--text-3); }
.flow__ico--green { background: var(--success-muted); color: var(--success); }
.flow__ico--danger { background: var(--danger-muted); color: var(--danger); }
.flow__ico--blue { background: var(--blue-muted); color: var(--blue); }
.flow__ico--accent { background: var(--accent-muted); color: var(--accent); }
.flow__title { font-size: .78rem; font-weight: 700; color: var(--text-1); }
.flow__sub { font-size: .68rem; color: var(--text-3); }
.flow__arrow { color: var(--text-3); font-size: 1.1rem; padding-top: 8px; flex-shrink: 0; }
.flow__note { padding: 10px 16px; border-top: 1px solid var(--border); font-size: .76rem; color: var(--text-3); text-align: center; }

@media (max-width: 1000px) {
  .alerts__charts, .alerts__tables { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .flow { flex-direction: column; align-items: stretch; }
  .flow__arrow { transform: rotate(90deg); align-self: center; }
}
</style>
