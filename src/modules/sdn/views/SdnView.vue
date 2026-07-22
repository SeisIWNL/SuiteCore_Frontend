<template>
  <div class="sdn">

    <!-- Header -->
    <div class="sdn__head">
      <div>
        <h1 class="sdn__title">Supervisión SDN</h1>
        <p class="sdn__sub">Controlador SCNO, topología OpenFlow, flujos, seguridad y ciclo de vida de hosts</p>
      </div>
      <div class="sdn__head-right">
        <span v-if="lastRefresh" class="sdn__updated">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" :class="{ spin: busy }">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Última actualización: {{ lastRefresh }}
        </span>
        <button class="sdn__auto" :class="{ 'sdn__auto--on': autoOn }" @click="autoOn = !autoOn">
          <span class="sdn__auto-dot" />
          {{ autoOn ? 'En vivo' : 'Pausado' }}
        </button>
      </div>
    </div>

    <!-- ══════ Tarjetas de estado ══════ -->
    <div class="sdn__cards">
      <!-- Estado del controlador -->
      <div class="scard">
        <div class="scard__head">
          <span class="scard__ico" :class="isOnline ? 'scard__ico--ok' : 'scard__ico--bad'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
            </svg>
          </span>
          <span class="scard__label">Estado del controlador</span>
        </div>
        <div class="scard__state" :class="isOnline ? 'scard__state--ok' : 'scard__state--bad'">
          {{ isOnline ? 'Operativo' : (health.data?.status || 'Desconocido') }}
        </div>
        <div class="scard__rows">
          <div class="scard__row"><span>Bridge:</span><strong>{{ health.data?.bridge || topology.data?.bridge || '—' }}</strong></div>
          <div class="scard__row"><span>Controller:</span><strong class="mono">{{ health.data?.controller || topology.data?.controller || '—' }}</strong></div>
          <div class="scard__row"><span>OpenFlow:</span><strong>{{ health.data?.openflow || '—' }}</strong></div>
          <div class="scard__row"><span>OVS Version:</span><strong>{{ topology.data?.ovsVersion || '—' }}</strong></div>
        </div>
      </div>

      <!-- Topología SDN -->
      <div class="scard">
        <div class="scard__head">
          <span class="scard__ico scard__ico--blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
              <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
            </svg>
          </span>
          <span class="scard__label">Topología SDN</span>
        </div>
        <div class="scard__big">{{ topologyPorts.length }}</div>
        <div class="scard__cap">Puertos conectados</div>
        <div class="scard__rows">
          <div class="scard__row"><span>Switches SDN</span><strong>{{ topology.data?.bridge ? 1 : 0 }}</strong></div>
          <div class="scard__row"><span>Conexiones activas</span><strong>{{ topologyPorts.length }}</strong></div>
        </div>
      </div>

      <!-- Flujos OpenFlow -->
      <div class="scard">
        <div class="scard__head">
          <span class="scard__ico scard__ico--purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6h16M4 12h10M4 18h6"/><circle cx="19" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>
            </svg>
          </span>
          <span class="scard__label">Flujos OpenFlow</span>
        </div>
        <div class="scard__big">{{ flowCount }}</div>
        <div class="scard__cap">Reglas activas</div>
        <div class="scard__rows">
          <div class="scard__row"><span>Tabla 0</span><strong>{{ flowCount }}</strong></div>
          <div class="scard__row"><span>Bloqueos activos</span><strong>{{ blockedCount }}</strong></div>
        </div>
      </div>

      <!-- Ciclo de vida de hosts -->
      <div class="scard">
        <div class="scard__head">
          <span class="scard__ico scard__ico--amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
          </span>
          <span class="scard__label">Ciclo de vida de hosts</span>
        </div>
        <div class="scard__rows scard__rows--lg">
          <div class="scard__row"><span>Detectados</span><strong>{{ lifecycle.detectados ?? 0 }}</strong></div>
          <div class="scard__row"><span>Elegibles</span><strong>{{ lifecycle.elegibles ?? 0 }}</strong></div>
          <div class="scard__row"><span>Onboarded</span><strong>{{ lifecycle.onboarded ?? 0 }}</strong></div>
          <div class="scard__row"><span>Retirados</span><strong>{{ lifecycle.retirados ?? 0 }}</strong></div>
        </div>
      </div>
    </div>

    <!-- ══════ Onboarding: ciclo de vida ══════ -->
    <OnboardingPanel
      :status="onbStatus"
      :candidates="onbCandidates"
      :plans="onbPlans"
      :readiness="onbReadiness"
      :executions="onbExecutions"
      :candidate-items="candidateItems"
      :candidate-total="candidateTotal"
      :plan-items="planItems"
      :plan-total="planTotal"
      :lifecycle="lifecycle"
      :execution-total="executionTotal"
      :executions-by-operation="executionsByOperation"
      :is-execution-ready="isExecutionReady"
      :stage-of="stageOf"
      :search-hosts="searchHosts"
      :onboard-flow="onboardFlow"
      :ask-start-onboarding="askStartOnboarding"
      :cancel-onboarding="cancelOnboarding"
      :confirm-start-onboarding="confirmStartOnboarding"
      :close-onboard-result="closeOnboardResult"
      :decommission-flow="decommissionFlow"
      :ask-decommission="askDecommission"
      :cancel-decommission="cancelDecommission"
      :proceed-to-decommission-reason="proceedToDecommissionReason"
      :submit-decommission="submitDecommission"
      :close-decommission-result="closeDecommissionResult"
    />

    <!-- ══════ MikroTik + interfaces ══════ -->
    <div class="sdn__two">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">MikroTik</span></div>
        <div v-if="mkInfo.loading" class="panel__pad"><div v-for="i in 4" :key="i" class="sk sk--row" /></div>
        <div v-else-if="mkInfo.error" class="panel__err">{{ mkInfo.error }}</div>
        <div v-else class="mk">
          <div class="mk__row"><span>Identidad</span><strong>{{ mkInfo.data?.identity || '—' }}</strong></div>
          <div class="mk__row"><span>RouterOS</span><strong>{{ mkInfo.data?.version || '—' }}</strong></div>
          <div class="mk__row"><span>Arquitectura</span><strong>{{ mkInfo.data?.architecture || '—' }}</strong></div>
          <div class="mk__row"><span>Uptime</span><strong>{{ mkInfo.data?.uptime || '—' }}</strong></div>
          <div class="mk__gauge">
            <div class="mk__gauge-head"><span>CPU</span><strong>{{ mkInfo.data?.cpuLoad ?? 0 }}%</strong></div>
            <div class="mk__track"><div class="mk__fill" :class="gaugeTone(mkInfo.data?.cpuLoad ?? 0)" :style="{ width: (mkInfo.data?.cpuLoad ?? 0) + '%' }" /></div>
          </div>
          <div class="mk__gauge">
            <div class="mk__gauge-head"><span>Memoria</span><strong>{{ memoryPct }}%</strong></div>
            <div class="mk__track"><div class="mk__fill" :class="gaugeTone(memoryPct)" :style="{ width: memoryPct + '%' }" /></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Interfaces MikroTik</span>
          <span class="panel__hint">{{ interfaces.length }}</span>
        </div>
        <div v-if="mkIfaces.loading" class="panel__pad"><div v-for="i in 4" :key="i" class="sk sk--row" /></div>
        <div v-else-if="mkIfaces.error" class="panel__err">{{ mkIfaces.error }}</div>
        <div v-else-if="!interfaces.length" class="panel__empty">Sin interfaces</div>
        <div v-else class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr><th class="tbl__th">Interfaz</th><th class="tbl__th">Tipo</th><th class="tbl__th">Estado</th><th class="tbl__th">Comentario</th></tr>
            </thead>
            <tbody>
              <tr v-for="(itf, idx) in interfaces" :key="idx" class="tbl__tr">
                <td class="tbl__td"><code class="mono">{{ itf.name }}</code></td>
                <td class="tbl__td">{{ itf.type || '—' }}</td>
                <td class="tbl__td">
                  <span class="badge" :class="itf.disabled ? 'badge--muted' : (itf.running ? 'badge--ok' : 'badge--danger')">
                    {{ itf.disabled ? 'Deshabilitada' : (itf.running ? 'Activa' : 'Inactiva') }}
                  </span>
                </td>
                <td class="tbl__td"><span class="muted">{{ itf.comment || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════ Acciones ══════ -->
    <div class="sdn__two sdn__two--single">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Seguridad SDN</span></div>
        <div class="act">
          <p class="act__hint">Bloquea o desbloquea el tráfico de una dirección IP en el controlador.</p>
          <div class="act__form">
            <input v-model="security.ip" type="text" class="act__input" placeholder="192.168.1.50" />
            <button class="act__btn act__btn--danger" :disabled="security.loading" @click="runBlockIp(true)">Bloquear</button>
            <button class="act__btn" :disabled="security.loading" @click="runBlockIp(false)">Desbloquear</button>
          </div>
          <div v-if="security.error" class="act__msg act__msg--err">{{ security.error }}</div>
          <div v-else-if="security.message" class="act__msg"
            :class="security.messageType === 'error' ? 'act__msg--err' : 'act__msg--ok'">
            {{ security.message }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSdn } from '@/modules/sdn/composables/useSdn.js'
import { useOnboarding } from '@/modules/sdn/composables/useOnboarding.js'
import OnboardingPanel from '@/modules/sdn/components/OnboardingPanel.vue'
import { useLoaderStore } from '@/stores/loader.js'

const {
  health, topology, flows, mkInfo, mkIfaces,
  anyLoading, isOnline, memoryPct, interfaces, flowCount,
  security, runBlockIp,
  loadAll: loadSdn,
} = useSdn()

const {
  status: onbStatus, candidates: onbCandidates, plans: onbPlans,
  readiness: onbReadiness, executions: onbExecutions,
  anyLoading: onbLoading,
  candidateItems, candidateTotal, stageOf, lifecycle,
  planItems, planTotal,
  executionTotal, executionsByOperation,
  isExecutionReady,
  loadAll: loadOnb,
  searchHosts,
  onboardFlow, askStartOnboarding, cancelOnboarding,
  confirmStartOnboarding, closeOnboardResult,
  decommissionFlow, askDecommission, cancelDecommission,
  proceedToDecommissionReason, submitDecommission, closeDecommissionResult,
} = useOnboarding()

const busy = computed(() => anyLoading.value || onbLoading.value)

const topologyPorts = computed(() => topology.value.data?.ports ?? [])
const blockedCount = computed(() => 0)

function gaugeTone(v) {
  if (v >= 85) return 'mk__fill--danger'
  if (v >= 60) return 'mk__fill--warn'
  return 'mk__fill--ok'
}

// Refresco
const lastRefresh = ref(null)
const autoOn = ref(true)
let timer = null
const REFRESH_MS = 30000

async function refreshAll(silent = false) {
  await Promise.all([loadSdn(silent), loadOnb(silent)])
  lastRefresh.value = new Date().toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

const loader = useLoaderStore()

onMounted(async () => {
  await loader.wrap(refreshAll(), 'Cargando supervisión SDN...')
  timer = setInterval(() => { if (autoOn.value) refreshAll(true) }, REFRESH_MS)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.sdn { max-width: 1320px; display: flex; flex-direction: column; gap: 16px; }

.sdn__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.sdn__title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-1); }
.sdn__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }
.sdn__head-right { display: flex; align-items: center; gap: 10px; }
.sdn__updated { display: inline-flex; align-items: center; gap: 6px; font-size: .72rem; color: var(--text-3); font-family: var(--font-mono); }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.sdn__auto { display: flex; align-items: center; gap: 7px; padding: 6px 11px; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-3); font-family: var(--font-mono); font-size: .7rem; font-weight: 600; cursor: pointer; }
.sdn__auto-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); }
.sdn__auto--on { color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, var(--border)); }
.sdn__auto--on .sdn__auto-dot { background: var(--success); box-shadow: 0 0 7px var(--success); animation: pulse 2s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

/* Tarjetas de estado */
.sdn__cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.scard { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
.scard__head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.scard__ico { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--bg-3); color: var(--text-3); }
.scard__ico--ok { background: var(--success-muted); color: var(--success); }
.scard__ico--bad { background: var(--danger-muted); color: var(--danger); }
.scard__ico--blue { background: var(--blue-muted); color: var(--blue); }
.scard__ico--purple { background: rgba(167,139,250,.12); color: #a78bfa; }
.scard__ico--amber { background: var(--warning-muted); color: var(--warning); }
.scard__label { font-size: .68rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .05em; }
.scard__state { font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; margin-bottom: 10px; }
.scard__state--ok { color: var(--success); }
.scard__state--bad { color: var(--danger); }
.scard__big { font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-1); line-height: 1; }
.scard__cap { font-size: .7rem; color: var(--text-3); margin: 3px 0 10px; }
.scard__rows { display: flex; flex-direction: column; gap: 6px; }
.scard__rows--lg { gap: 9px; }
.scard__row { display: flex; align-items: center; justify-content: space-between; font-size: .76rem; color: var(--text-3); gap: 10px; }
.scard__row strong { color: var(--text-1); font-weight: 600; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Paneles genéricos */
.sdn__two { display: grid; grid-template-columns: 1fr 1.3fr; gap: 14px; }
.sdn__two--single { grid-template-columns: 1fr; }
.sdn__two--single .panel { max-width: 480px; }
.panel { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
.panel__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.panel__title { font-family: var(--font-display); font-size: .8rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .03em; }
.panel__hint { font-family: var(--font-mono); font-size: .68rem; color: var(--text-3); }
.panel__pad { padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; }
.panel__err { padding: 16px; font-size: .8rem; color: var(--danger); }
.panel__empty { padding: 30px; text-align: center; color: var(--text-3); font-size: .82rem; }

.sk { background: var(--bg-3); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
.sk--row { height: 28px; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

/* MikroTik */
.mk { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.mk__row { display: flex; align-items: center; justify-content: space-between; font-size: .8rem; color: var(--text-3); }
.mk__row strong { color: var(--text-1); font-weight: 600; }
.mk__gauge { margin-top: 4px; }
.mk__gauge-head { display: flex; justify-content: space-between; font-size: .76rem; color: var(--text-3); margin-bottom: 5px; }
.mk__gauge-head strong { color: var(--text-1); font-family: var(--font-mono); }
.mk__track { height: 8px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
.mk__fill { height: 100%; border-radius: 99px; transition: width .4s ease; }
.mk__fill--ok { background: var(--success); }
.mk__fill--warn { background: var(--warning); }
.mk__fill--danger { background: var(--danger); }

/* Tablas */
.tbl-wrap { overflow-x: auto; overflow-y: auto; max-height: 300px; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl__th { position: sticky; top: 0; z-index: 1; text-align: left; padding: 9px 14px; font-size: .62rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2); }
.tbl__tr:hover { background: var(--bg-2); }
.tbl__td { padding: 9px 14px; font-size: .8rem; color: var(--text-1); border-bottom: 1px solid var(--border); white-space: nowrap; }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }
.mono { font-family: var(--font-mono); font-size: .76rem; color: var(--text-2); }
.muted { color: var(--text-3); font-size: .76rem; }
.badge { font-size: .68rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; }
.badge--ok { background: var(--success-muted); color: var(--success); }
.badge--danger { background: var(--danger-muted); color: var(--danger); }
.badge--muted { background: var(--bg-3); color: var(--text-3); }

/* Acciones */
.act { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.act__hint { font-size: .78rem; color: var(--text-3); }
.act__form { display: flex; gap: 8px; flex-wrap: wrap; }
.act__input { flex: 1; min-width: 150px; height: 34px; padding: 0 11px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-1); font-family: var(--font-mono); font-size: .8rem; outline: none; }
.act__input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.act__btn { padding: 0 14px; height: 34px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-1); font-family: var(--font-sans); font-size: .78rem; font-weight: 600; cursor: pointer; }
.act__btn:hover:not(:disabled) { background: var(--bg-hover); }
.act__btn:disabled { opacity: .45; cursor: not-allowed; }
.act__btn--danger { background: var(--danger-muted); border-color: transparent; color: var(--danger); }
.act__btn--accent { background: var(--accent-muted); border-color: transparent; color: var(--accent); }
.act__msg { font-size: .78rem; padding: 8px 11px; border-radius: var(--radius); }
.act__msg--ok { background: var(--success-muted); color: var(--success); }
.act__msg--err { background: var(--danger-muted); color: var(--danger); }

@media (max-width: 900px) {
  .sdn__two { grid-template-columns: 1fr; }
}
</style>