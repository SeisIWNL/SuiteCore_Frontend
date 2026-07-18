<template>
  <div class="onb">

    <!-- Acciones rápidas -->
    <div class="panel">
      <div class="panel__head"><span class="panel__title">Acciones rápidas</span></div>
      <div class="qa">
        <button class="qa__btn qa__btn--blue" :disabled="scanLocal.loading" @click="runLocalScan">
          <span class="qa__ico" :class="{ 'qa__ico--spin': scanLocal.loading }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </span>
          <span class="qa__title">Escanear red local</span>
          <span class="qa__cap">Descubrimiento MikroTik</span>
        </button>

        <button class="qa__btn qa__btn--blue" :disabled="scanTailscale.loading" @click="runTailscaleScan">
          <span class="qa__ico" :class="{ 'qa__ico--spin': scanTailscale.loading }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/>
            </svg>
          </span>
          <span class="qa__title">Escanear Tailscale</span>
          <span class="qa__cap">Descubrimiento en malla</span>
        </button>

        <a href="#onb-plans" class="qa__btn qa__btn--purple">
          <span class="qa__ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <span class="qa__title">Ver planes</span>
          <span class="qa__cap">Pendientes y aprobados</span>
        </a>

        <button class="qa__btn qa__btn--disabled" disabled title="Aún no disponible: el backend no expone un endpoint de retiro.">
          <span class="qa__ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </span>
          <span class="qa__title">Preview retiro</span>
          <span class="qa__cap">Próximamente</span>
        </button>

        <button class="qa__btn qa__btn--disabled" disabled title="Aún no disponible: el backend no expone un endpoint de retiro.">
          <span class="qa__ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </span>
          <span class="qa__title">Ejecutar retiro</span>
          <span class="qa__cap">Próximamente</span>
        </button>
      </div>

      <!-- Resultados de las acciones de escaneo -->
      <div v-if="scanLocal.message || scanLocal.error" class="qa__msg" :class="scanLocal.error ? 'qa__msg--err' : 'qa__msg--ok'">
        <strong>Descubrimiento local:</strong> {{ scanLocal.error || scanLocal.message }}
      </div>
      <div v-if="scanTailscale.message || scanTailscale.error" class="qa__msg" :class="scanTailscale.error ? 'qa__msg--err' : 'qa__msg--ok'">
        <strong>Descubrimiento Tailscale:</strong> {{ scanTailscale.error || scanTailscale.message }}
      </div>
    </div>

    <div class="onb__top">
      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Estado del ciclo de vida</span>
        </div>
        <div v-if="candidates.loading" class="panel__body"><div class="sk sk--chart" /></div>
        <div v-else-if="candidates.error" class="panel__err">{{ candidates.error }}</div>
        <div v-else class="panel__body panel__body--center">
          <StatusDonut :segments="lifecycleSegments" />
        </div>
        <div class="panel__foot">Distribución actual de dispositivos en el ciclo de vida</div>
      </div>

      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">Ejecuciones automáticas</span>
          <span class="panel__hint">total: {{ executionTotal }}</span>
        </div>
        <div v-if="executions.loading" class="panel__body"><div class="sk sk--chart" /></div>
        <div v-else-if="executions.error" class="panel__err">{{ executions.error }}</div>
        <div v-else-if="!execBars.length" class="panel__empty">
          Sin ejecuciones registradas todavía
        </div>
        <div v-else class="panel__body">
          <OpsBarChart :items="execBars" />
        </div>
        <div class="panel__foot">Total ejecuciones: {{ executionTotal }}</div>
      </div>
    </div>

    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">Hosts administrados</span>
        <span class="panel__hint">{{ candidateItems.length }} de {{ candidateTotal }}</span>
      </div>
      <div v-if="candidates.loading" class="panel__pad">
        <div v-for="i in 3" :key="i" class="sk sk--row" />
      </div>
      <div v-else-if="candidates.error" class="panel__err">{{ candidates.error }}</div>
      <div v-else-if="!candidateItems.length" class="panel__empty">
        No hay candidatos detectados. Ejecuta un descubrimiento para escanear la red.
      </div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Host</th>
              <th class="tbl__th">IP</th>
              <th class="tbl__th">Tipo</th>
              <th class="tbl__th">Estado</th>
              <th class="tbl__th">Última detección</th>
              <th class="tbl__th">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in candidateItems" :key="c.candidateId" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ c.name || c.hostname || '—' }}</span></td>
              <td class="tbl__td"><code class="mono">{{ c.managementIp || '—' }}</code></td>
              <td class="tbl__td">{{ c.operatingSystem || c.discoveredRole || '—' }}</td>
              <td class="tbl__td">
                <span class="badge" :class="stageClass(stageOf(c))">
                  {{ stageLabel(stageOf(c)) }}
                </span>
              </td>
              <td class="tbl__td"><span class="muted">{{ fmtDate(c.lastSeenAt) }}</span></td>
              <td class="tbl__td">
                <button
                  v-if="stageOf(c) === 'elegibles' && !hasPlanForCandidate(c.candidateId)"
                  class="row-btn"
                  :disabled="candidateActionState(c.candidateId).loading"
                  @click="generatePlan(c.candidateId)"
                >
                  {{ candidateActionState(c.candidateId).loading ? 'Generando…' : 'Generar plan' }}
                </button>
                <span v-else-if="hasPlanForCandidate(c.candidateId)" class="row-note">Plan generado</span>
                <span v-else class="row-note row-note--muted">—</span>
                <div v-if="candidateActionState(c.candidateId).error" class="row-err">
                  {{ candidateActionState(c.candidateId).error }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel" id="onb-plans">
      <div class="panel__head">
        <span class="panel__title">Planes de onboarding</span>
        <span class="panel__hint">{{ planItems.length }} de {{ planTotal }}</span>
      </div>
      <div v-if="plans.loading" class="panel__pad">
        <div v-for="i in 3" :key="i" class="sk sk--row" />
      </div>
      <div v-else-if="plans.error" class="panel__err">{{ plans.error }}</div>
      <div v-else-if="!planItems.length" class="panel__empty">
        No hay planes generados. Genera un plan a partir de un candidato elegible.
      </div>
      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Plan</th>
              <th class="tbl__th">Estado</th>
              <th class="tbl__th">Riesgo</th>
              <th class="tbl__th">Solicitado por</th>
              <th class="tbl__th">Pasos</th>
              <th class="tbl__th">Creado</th>
              <th class="tbl__th">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in planItems" :key="p.planId" class="tbl__tr">
              <td class="tbl__td"><code class="mono">{{ shortId(p.planId) }}</code></td>
              <td class="tbl__td">
                <span class="badge" :class="planStatusClass(p.status)">{{ p.status || '—' }}</span>
              </td>
              <td class="tbl__td">
                <span class="risk" :class="riskClass(p.riskLevel)">{{ p.riskLevel || '—' }}</span>
              </td>
              <td class="tbl__td">{{ p.requestedBy || '—' }}</td>
              <td class="tbl__td">
                <span class="count-badge">{{ p.plan?.steps?.length ?? 0 }}</span>
              </td>
              <td class="tbl__td"><span class="muted">{{ fmtDate(p.createdAt) }}</span></td>
              <td class="tbl__td">
                <button
                  v-if="planIsExecutable(p.status)"
                  class="row-btn row-btn--accent"
                  :disabled="executeActionState(p.planId).loading"
                  @click="executePlanAction(p.planId)"
                >
                  {{ executeActionState(p.planId).loading ? 'Ejecutando…' : 'Ejecutar' }}
                </button>
                <span v-else class="row-note row-note--muted">Ejecutado</span>
                <div v-if="executeActionState(p.planId).error" class="row-err">
                  {{ executeActionState(p.planId).error }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="onb__bottom">
      <div class="panel">
        <div class="panel__head"><span class="panel__title">Salud del sistema de onboarding</span></div>
        <div v-if="status.loading || readiness.loading" class="panel__pad">
          <div v-for="i in 4" :key="i" class="sk sk--row" />
        </div>
        <div v-else class="health">
          <div class="health__row">
            <span class="health__label">Servicio de onboarding</span>
            <span class="health__tag" :class="okClass(status.data?.status)">
              {{ status.data?.status || '—' }}
            </span>
          </div>
          <div class="health__row">
            <span class="health__label">Integridad</span>
            <span class="health__tag" :class="okClass(status.data?.integrity)">
              {{ status.data?.integrity || '—' }}
            </span>
          </div>
          <div class="health__row">
            <span class="health__label">Ejecución habilitada</span>
            <span class="health__tag" :class="isExecutionReady ? 'health__tag--ok' : 'health__tag--warn'">
              {{ isExecutionReady ? 'Sí' : 'No' }}
            </span>
          </div>
          <div class="health__row">
            <span class="health__label">Alcance de ejecución</span>
            <span class="health__val">{{ readiness.data?.executionScope || '—' }}</span>
          </div>
          <div class="health__row">
            <span class="health__label">Ejecutor instalado</span>
            <span class="health__tag" :class="readiness.data?.executorInstalled ? 'health__tag--ok' : 'health__tag--muted'">
              {{ readiness.data?.executorInstalled ? 'Sí' : 'No' }}
            </span>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head"><span class="panel__title">Último escaneo</span></div>
        <div v-if="status.loading" class="panel__pad">
          <div v-for="i in 4" :key="i" class="sk sk--row" />
        </div>
        <div v-else-if="!latestScan" class="panel__empty">Aún no se ha ejecutado un escaneo</div>
        <div v-else class="scan">
          <div class="scan__row"><span>Origen</span><strong>{{ latestScan.source || '—' }}</strong></div>
          <div class="scan__row"><span>Solicitado por</span><strong>{{ latestScan.requestedBy || '—' }}</strong></div>
          <div class="scan__row"><span>Fecha</span><strong>{{ fmtDate(latestScan.createdAt) }}</strong></div>
          <div class="scan__grid">
            <div class="scan__chip"><span class="scan__num">{{ latestScan.totalSeen ?? 0 }}</span><span class="scan__lbl">Vistos</span></div>
            <div class="scan__chip"><span class="scan__num scan__num--ok">{{ latestScan.eligibleCount ?? 0 }}</span><span class="scan__lbl">Elegibles</span></div>
            <div class="scan__chip"><span class="scan__num">{{ latestScan.knownCount ?? 0 }}</span><span class="scan__lbl">Conocidos</span></div>
            <div class="scan__chip"><span class="scan__num scan__num--muted">{{ latestScan.ignoredCount ?? 0 }}</span><span class="scan__lbl">Ignorados</span></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateTime } from '@/modules/sdn/composables/useOnboarding.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import StatusDonut from '@/modules/network/components/StatusDonut.vue'
import OpsBarChart from '@/modules/sdn/components/OpsBarChart.vue'

const props = defineProps({
  status:         { type: Object, required: true },
  candidates:     { type: Object, required: true },
  plans:          { type: Object, required: true },
  readiness:      { type: Object, required: true },
  executions:     { type: Object, required: true },
  candidateItems: { type: Array,  default: () => [] },
  candidateTotal: { type: Number, default: 0 },
  planItems:      { type: Array,  default: () => [] },
  planTotal:      { type: Number, default: 0 },
  lifecycle:      { type: Object, default: () => ({}) },
  executionTotal: { type: Number, default: 0 },
  executionsByOperation: { type: Object, default: () => ({}) },
  isExecutionReady: { type: Boolean, default: false },
  latestScan:     { type: Object, default: null },
  stageOf:        { type: Function, required: true },
  // Acciones (POST)
  scanLocal:            { type: Object,   default: () => ({ loading: false, error: null, message: null }) },
  scanTailscale:        { type: Object,   default: () => ({ loading: false, error: null, message: null }) },
  runLocalScan:         { type: Function, default: () => () => {} },
  runTailscaleScan:     { type: Function, default: () => () => {} },
  hasPlanForCandidate:  { type: Function, default: () => () => false },
  generatePlan:         { type: Function, default: () => () => {} },
  candidateActionState: { type: Function, default: () => () => ({ loading: false, error: null, message: null }) },
  planIsExecutable:     { type: Function, default: () => () => true },
  executePlanAction:    { type: Function, default: () => () => {} },
  executeActionState:   { type: Function, default: () => () => ({ loading: false, error: null, message: null }) },
})

const fmtDate = formatDateTime

const lifecycleSegments = computed(() => {
  const theme = readChartTheme()
  const l = props.lifecycle ?? {}
  const segs = [
    { label: `Detectados (${l.detectados ?? 0})`, value: l.detectados ?? 0, color: theme.blue },
    { label: `Elegibles (${l.elegibles ?? 0})`,   value: l.elegibles ?? 0,  color: theme.success },
    { label: `Onboarded (${l.onboarded ?? 0})`,   value: l.onboarded ?? 0,  color: theme.accent },
    { label: `Retirados (${l.retirados ?? 0})`,   value: l.retirados ?? 0,  color: theme.danger },
  ]
  return segs.some(s => s.value > 0) ? segs : [{ label: 'Sin datos', value: 1, color: theme.text3 }]
})

const execBars = computed(() => {
  const theme = readChartTheme()
  const map = props.executionsByOperation ?? {}
  const palette = [theme.blue, theme.warning, theme.success, theme.danger]
  return Object.entries(map).map(([label, value], i) => ({
    label, value, color: palette[i % palette.length],
  }))
})

function stageLabel(s) {
  return { detectados: 'Detectado', elegibles: 'Elegible', onboarded: 'Onboarded', retirados: 'Retirado' }[s] ?? s
}
function stageClass(s) {
  return {
    detectados: 'badge--info', elegibles: 'badge--ok',
    onboarded: 'badge--accent', retirados: 'badge--danger',
  }[s] ?? 'badge--muted'
}
function planStatusClass(st) {
  const s = (st ?? '').toLowerCase()
  if (s.includes('aprob') || s.includes('approved')) return 'badge--ok'
  if (s.includes('pend')) return 'badge--warn'
  if (s.includes('rechaz') || s.includes('reject')) return 'badge--danger'
  return 'badge--muted'
}
function riskClass(r) {
  const s = (r ?? '').toLowerCase()
  if (s.includes('alto') || s.includes('high')) return 'risk--high'
  if (s.includes('medio') || s.includes('medium')) return 'risk--mid'
  return 'risk--low'
}
function okClass(v) {
  const s = (v ?? '').toLowerCase()
  if (['ok','healthy','operativo','valid','ready'].includes(s)) return 'health__tag--ok'
  if (!s) return 'health__tag--muted'
  return 'health__tag--warn'
}
function shortId(id) {
  if (!id) return '—'
  return id.length > 12 ? id.slice(0, 12) + '…' : id
}
</script>

<style scoped>
.onb { display: flex; flex-direction: column; gap: 14px; }
.onb__top { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; }
.onb__bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.panel { background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; display: flex; flex-direction: column; }
.panel__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.panel__title { font-family: var(--font-display); font-size: .8rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .03em; }
.panel__hint { font-family: var(--font-mono); font-size: .68rem; color: var(--text-3); }
.panel__body { padding: 18px; flex: 1; }
.panel__body--center { display: flex; align-items: center; justify-content: center; }
.panel__foot { padding: 10px 16px; border-top: 1px solid var(--border); font-size: .7rem; color: var(--text-3); text-align: center; }
.panel__pad { padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; }
.panel__err { padding: 16px; font-size: .8rem; color: var(--danger); }
.panel__empty { padding: 32px 20px; text-align: center; color: var(--text-3); font-size: .82rem; }

.sk { background: var(--bg-3); border-radius: 4px; animation: shimmer 1.4s ease infinite; }
.sk--chart { width: 100%; height: 170px; }
.sk--row { height: 30px; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.7} }

.tbl-wrap { overflow-x: auto; overflow-y: auto; max-height: 320px; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl__th { position: sticky; top: 0; z-index: 1; text-align: left; padding: 9px 14px; font-size: .62rem; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2); }
.tbl__tr:hover { background: var(--bg-2); }
.tbl__td { padding: 9px 14px; font-size: .8rem; color: var(--text-1); border-bottom: 1px solid var(--border); white-space: nowrap; }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }
.strong { font-weight: 600; }
.mono { font-family: var(--font-mono); font-size: .76rem; color: var(--text-2); }
.muted { color: var(--text-3); font-size: .76rem; }

.badge { font-size: .68rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; text-transform: capitalize; }
.badge--ok { background: var(--success-muted); color: var(--success); }
.badge--info { background: var(--blue-muted); color: var(--blue); }
.badge--accent { background: var(--accent-muted); color: var(--accent); }
.badge--warn { background: var(--warning-muted); color: var(--warning); }
.badge--danger { background: var(--danger-muted); color: var(--danger); }
.badge--muted { background: var(--bg-3); color: var(--text-3); }

.risk { font-size: .7rem; font-weight: 700; text-transform: capitalize; }
.risk--low { color: var(--success); }
.risk--mid { color: var(--warning); }
.risk--high { color: var(--danger); }

.count-badge { font-family: var(--font-mono); font-size: .72rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; background: var(--bg-3); color: var(--text-2); }

.health { padding: 14px 16px; display: flex; flex-direction: column; gap: 11px; }
.health__row { display: flex; align-items: center; justify-content: space-between; font-size: .8rem; }
.health__label { color: var(--text-2); }
.health__val { font-family: var(--font-mono); font-size: .76rem; color: var(--text-1); }
.health__tag { font-size: .68rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; text-transform: capitalize; }
.health__tag--ok { background: var(--success-muted); color: var(--success); }
.health__tag--warn { background: var(--warning-muted); color: var(--warning); }
.health__tag--muted { background: var(--bg-3); color: var(--text-3); }

.scan { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.scan__row { display: flex; align-items: center; justify-content: space-between; font-size: .8rem; color: var(--text-2); }
.scan__row strong { color: var(--text-1); font-weight: 600; }
.scan__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 4px; }
.scan__chip { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 9px 6px; text-align: center; }
.scan__num { display: block; font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; color: var(--text-1); }
.scan__num--ok { color: var(--success); }
.scan__num--muted { color: var(--text-3); }
.scan__lbl { font-size: .62rem; color: var(--text-3); }

@media (max-width: 900px) {
  .onb__top, .onb__bottom { grid-template-columns: 1fr; }
}

/* Acciones rápidas */
.qa { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; padding: 16px; }
.qa__btn {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 12px; border-radius: var(--radius); border: 1px solid var(--border);
  background: var(--bg-2); cursor: pointer; text-decoration: none;
  font-family: var(--font-sans); transition: background .12s, border-color .12s, opacity .12s;
}
.qa__btn:hover:not(:disabled) { background: var(--bg-hover); }
.qa__btn:disabled { opacity: .55; cursor: not-allowed; }
.qa__btn--blue { border-color: color-mix(in srgb, var(--blue) 30%, var(--border)); }
.qa__btn--blue .qa__ico { color: var(--blue); }
.qa__btn--purple { border-color: color-mix(in srgb, var(--accent) 30%, var(--border)); }
.qa__btn--purple .qa__ico { color: var(--accent); }
.qa__btn--disabled { opacity: .5; cursor: not-allowed; }
.qa__ico { display: flex; }
.qa__ico--spin svg { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.qa__title { font-size: .82rem; font-weight: 700; color: var(--text-1); }
.qa__cap { font-size: .68rem; color: var(--text-3); }

.qa__msg {
  margin: 0 16px 14px; padding: 9px 12px; border-radius: var(--radius);
  font-size: .78rem;
}
.qa__msg--ok { background: var(--success-muted); color: var(--success); }
.qa__msg--err { background: var(--danger-muted); color: var(--danger); }

/* Botones de acción por fila */
.row-btn {
  padding: 5px 11px; border-radius: var(--radius); border: 1px solid transparent;
  background: var(--accent-muted); color: var(--accent);
  font-family: var(--font-sans); font-size: .72rem; font-weight: 700; cursor: pointer;
  white-space: nowrap;
}
.row-btn:hover:not(:disabled) { filter: brightness(1.1); }
.row-btn:disabled { opacity: .6; cursor: not-allowed; }
.row-btn--accent { background: var(--success-muted); color: var(--success); }
.row-note { font-size: .74rem; color: var(--text-3); }
.row-note--muted { color: var(--text-3); }
.row-err { font-size: .68rem; color: var(--danger); margin-top: 4px; max-width: 160px; }
</style>