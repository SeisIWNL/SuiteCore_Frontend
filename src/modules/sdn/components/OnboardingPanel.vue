<template>
  <div class="onb">

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
        <div class="panel__head-right">
          <span class="panel__hint">{{ candidateItems.length }} de {{ candidateTotal }}</span>
          <button
            class="search-btn"
            :disabled="searching"
            title="Buscar hosts en la red"
            @click="onSearchHosts"
          >
            <svg v-if="!searching" width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span v-else class="search-btn__spinner" />
          </button>
        </div>
      </div>
      <div v-if="candidates.loading" class="panel__pad">
        <div v-for="i in 3" :key="i" class="sk sk--row" />
      </div>
      <div v-else-if="candidates.error" class="panel__err">{{ candidates.error }}</div>
      <div v-else-if="!candidateItems.length" class="panel__empty">
        No hay candidatos detectados. Usa el buscador para escanear la red.
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
            <tr v-for="c in candidateItems" :key="c.candidate_id" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ c.name || c.hostname || '—' }}</span></td>
              <td class="tbl__td"><code class="mono">{{ c.management_ip || '—' }}</code></td>
              <td class="tbl__td">{{ c.operating_system || c.discovered_role || '—' }}</td>
              <td class="tbl__td">
                <span class="badge" :class="stageClass(stageOf(c))">
                  {{ stageLabel(stageOf(c)) }}
                </span>
              </td>
              <td class="tbl__td"><span class="muted">{{ fmtDate(c.last_seen_at) }}</span></td>
              <td class="tbl__td">
                <button
                  v-if="stageOf(c) === 'onboarded'"
                  class="row-btn row-btn--danger"
                  @click="askDecommission(c)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                  Retirar
                </button>
                <button
                  v-else
                  class="row-btn row-btn--onboard"
                  @click="askStartOnboarding(c)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Generar onboarding
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Resultado de la búsqueda de hosts -->
    <Teleport to="body">
      <div v-if="searchModal.open" class="modal-backdrop" @click.self="searchModal.open = false">
        <div class="modal">
          <div class="modal__icon" :class="searchModal.tone === 'ok' ? 'modal__icon--ok' : 'modal__icon--muted'">
            <svg v-if="searchModal.tone === 'ok'" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="modal__title">{{ searchModal.title }}</div>
          <div class="modal__msg">{{ searchModal.message }}</div>
          <button class="modal__ok" @click="searchModal.open = false">OK</button>
        </div>
      </div>
    </Teleport>

    <!-- Flujo de onboarding: confirmación → progreso → resultado -->
    <Teleport to="body">
      <div v-if="onboardFlow.open" class="modal-backdrop" @click.self="onModalBackdropClick">
        <div class="modal">

          <!-- Confirmación -->
          <template v-if="onboardFlow.mode === 'confirm'">
            <div class="modal__icon modal__icon--muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="modal__title">{{ onboardFlow.title }}</div>
            <div class="modal__msg">{{ onboardFlow.message }}</div>
            <div class="modal__actions">
              <button class="modal__btn modal__btn--ghost" @click="cancelOnboarding">No</button>
              <button class="modal__btn modal__btn--accent" @click="confirmStartOnboarding">Sí</button>
            </div>
          </template>

          <!-- Progreso (no se puede cerrar) -->
          <template v-else-if="onboardFlow.mode === 'progress'">
            <div class="modal__spinner" />
            <div class="modal__title">{{ onboardFlow.title }}</div>
            <div class="modal__msg">{{ onboardFlow.message }}</div>
          </template>

          <!-- Resultado final -->
          <template v-else>
            <div class="modal__icon" :class="onboardFlow.tone === 'ok' ? 'modal__icon--ok' : 'modal__icon--error'">
              <svg v-if="onboardFlow.tone === 'ok'" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="modal__title">{{ onboardFlow.title }}</div>
            <div class="modal__msg">{{ onboardFlow.message }}</div>
            <button class="modal__ok" @click="closeOnboardResult">OK</button>
          </template>

        </div>
      </div>
    </Teleport>

    <!-- Flujo de retiro: confirmación → motivo → progreso → resultado -->
    <Teleport to="body">
      <div v-if="decommissionFlow.open" class="modal-backdrop" @click.self="onDecommissionBackdropClick">
        <div class="modal">

          <!-- Confirmación -->
          <template v-if="decommissionFlow.mode === 'confirm'">
            <div class="modal__icon modal__icon--danger-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="modal__title">{{ decommissionFlow.title }}</div>
            <div class="modal__msg">{{ decommissionFlow.message }}</div>
            <div class="modal__actions">
              <button class="modal__btn modal__btn--ghost" @click="cancelDecommission">No</button>
              <button class="modal__btn modal__btn--danger" @click="proceedToDecommissionReason">Sí</button>
            </div>
          </template>

          <!-- Motivo del retiro -->
          <template v-else-if="decommissionFlow.mode === 'reason'">
            <div class="modal__icon modal__icon--danger-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div class="modal__title">{{ decommissionFlow.title }}</div>
            <div class="modal__msg">{{ decommissionFlow.message }}</div>
            <textarea
              v-model="decommissionFlow.reason"
              class="modal__textarea"
              rows="3"
              placeholder="Ej. Reemplazo de equipo, fin de vida útil, migración..."
            />
            <div class="modal__actions">
              <button class="modal__btn modal__btn--ghost" @click="cancelDecommission">Cancelar</button>
              <button
                class="modal__btn modal__btn--danger"
                :disabled="!decommissionFlow.reason?.trim()"
                @click="submitDecommission"
              >
                Confirmar retiro
              </button>
            </div>
          </template>

          <!-- Progreso (no se puede cerrar) -->
          <template v-else-if="decommissionFlow.mode === 'progress'">
            <div class="modal__spinner" />
            <div class="modal__title">{{ decommissionFlow.title }}</div>
            <div class="modal__msg">{{ decommissionFlow.message }}</div>
          </template>

          <!-- Resultado final -->
          <template v-else>
            <div class="modal__icon" :class="decommissionFlow.tone === 'ok' ? 'modal__icon--ok' : 'modal__icon--error'">
              <svg v-if="decommissionFlow.tone === 'ok'" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="modal__title">{{ decommissionFlow.title }}</div>
            <div class="modal__msg">{{ decommissionFlow.message }}</div>
            <button class="modal__ok" @click="closeDecommissionResult">OK</button>
          </template>

        </div>
      </div>
    </Teleport>

    <div class="panel" id="onb-plans">
      <div class="panel__head">
        <span class="panel__title">Historial de onboarding</span>
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
              <th class="tbl__th">Dispositivo</th>
              <th class="tbl__th">IP</th>
              <th class="tbl__th">Riesgo</th>
              <th class="tbl__th">Solicitado / aprobado por</th>
              <th class="tbl__th">Fecha de creado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in planItems" :key="p.planId" class="tbl__tr">
              <td class="tbl__td"><span class="strong">{{ deviceLabel(p) }}</span></td>
              <td class="tbl__td"><code class="mono">{{ deviceIp(p) }}</code></td>
              <td class="tbl__td">
                <span class="risk" :class="riskClass(p.riskLevel)">{{ p.riskLevel || '—' }}</span>
              </td>
              <td class="tbl__td">
                <span class="strong">{{ responsibleName(p) }}</span>
                <span v-if="responsibleName(p) !== '—'" class="responsible-tag">
                  {{ p.approvedBy ? 'Aprobado' : 'Solicitado' }}
                </span>
              </td>
              <td class="tbl__td"><span class="muted">{{ fmtDate(p.createdAt) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { formatDateTime } from '@/modules/sdn/composables/useOnboarding.js'
import { readChartTheme } from '@/modules/main/composables/useChartTheme.js'
import StatusDonut from '@/modules/network/components/StatusDonut.vue'
import OpsBarChart from '@/modules/sdn/components/OpsBarChart.vue'

const props = defineProps({
  candidates:     { type: Object, required: true },
  plans:          { type: Object, required: true },
  executions:     { type: Object, required: true },
  candidateItems: { type: Array,  default: () => [] },
  candidateTotal: { type: Number, default: 0 },
  planItems:      { type: Array,  default: () => [] },
  planTotal:      { type: Number, default: 0 },
  lifecycle:      { type: Object, default: () => ({}) },
  executionTotal: { type: Number, default: 0 },
  executionsByOperation: { type: Object, default: () => ({}) },
  stageOf:        { type: Function, required: true },
  // Acciones
  searchHosts:            { type: Function, default: () => async () => ({ items: [] }) },
  onboardFlow:            { type: Object,   default: () => ({ open: false, mode: 'confirm', tone: 'ok', title: '', message: '', candidate: null }) },
  askStartOnboarding:     { type: Function, default: () => () => {} },
  cancelOnboarding:       { type: Function, default: () => () => {} },
  confirmStartOnboarding: { type: Function, default: () => () => {} },
  closeOnboardResult:     { type: Function, default: () => () => {} },
  decommissionFlow:            { type: Object,   default: () => ({ open: false, mode: 'confirm', tone: 'ok', title: '', message: '', candidate: null, reason: '' }) },
  askDecommission:              { type: Function, default: () => () => {} },
  cancelDecommission:           { type: Function, default: () => () => {} },
  proceedToDecommissionReason:  { type: Function, default: () => () => {} },
  submitDecommission:           { type: Function, default: () => () => {} },
  closeDecommissionResult:      { type: Function, default: () => () => {} },
})

const fmtDate = formatDateTime

// El backdrop solo cierra el modal en confirmación (cancela) o resultado
// (cierra). Mientras está en progreso, no se puede interrumpir haciendo clic afuera.
function onModalBackdropClick() {
  if (props.onboardFlow.mode === 'confirm') props.cancelOnboarding()
  else if (props.onboardFlow.mode === 'result') props.closeOnboardResult()
}

// El backdrop cancela en confirmación/motivo, y cierra en resultado. En
// progreso no se puede interrumpir haciendo clic afuera.
function onDecommissionBackdropClick() {
  const mode = props.decommissionFlow.mode
  if (mode === 'confirm' || mode === 'reason') props.cancelDecommission()
  else if (mode === 'result') props.closeDecommissionResult()
}

// ── Buscar hosts en la red (GET /onboarding/candidates) ────────
const searching = ref(false)
const searchModal = reactive({ open: false, tone: 'ok', title: '', message: '' })

async function onSearchHosts() {
  searching.value = true
  try {
    const data = await props.searchHosts()
    const count = data?.items?.length ?? data?.count ?? 0
    if (count === 0) {
      searchModal.tone = 'muted'
      searchModal.title = 'Sin hosts disponibles'
      searchModal.message = 'No hay hosts disponibles para realizar el onboarding.'
    } else {
      searchModal.tone = 'ok'
      searchModal.title = 'Hosts encontrados'
      searchModal.message = `Se han encontrado ${count} host${count === 1 ? '' : 's'} disponibles para el proceso de onboarding.`
    }
  } catch (err) {
    searchModal.tone = 'muted'
    searchModal.title = 'Error al buscar'
    searchModal.message = err?.message ?? 'No se pudo completar la búsqueda de hosts.'
  } finally {
    searching.value = false
    searchModal.open = true
  }
}

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
function riskClass(r) {
  const s = (r ?? '').toLowerCase()
  if (s.includes('alto') || s.includes('high')) return 'risk--high'
  if (s.includes('medio') || s.includes('medium')) return 'risk--mid'
  return 'risk--low'
}

// ── Historial de onboarding: dispositivo por candidateSnapshot ─────
// Cada plan ya trae la info del candidato incrustada (candidateSnapshot,
// con respaldo en plan.candidate) — no hace falta cruzar con la tabla
// de Hosts administrados.
function planCandidate(plan) {
  return plan.candidateSnapshot ?? plan.plan?.candidate ?? null
}
function deviceLabel(plan) {
  const c = planCandidate(plan)
  return c?.name || c?.hostname || '—'
}
function deviceIp(plan) {
  const c = planCandidate(plan)
  return c?.management_ip || '—'
}
/** Prioriza quién aprobó el plan; si aún no está aprobado, muestra quién lo solicitó. */
function responsibleName(plan) {
  return plan.approvedBy || plan.requestedBy || '—'
}
</script>

<style scoped>
.onb { display: flex; flex-direction: column; gap: 14px; }
.onb__top { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; }

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
.responsible-tag {
  display: block; margin-top: 2px;
  font-size: .64rem; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .04em;
}

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


@media (max-width: 900px) {
  .onb__top { grid-template-columns: 1fr; }
}

/* Cabecera de panel con acciones a la derecha */
.panel__head-right { display: flex; align-items: center; gap: 10px; }

/* Botón de búsqueda de hosts */
.search-btn {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; flex-shrink: 0;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-2);
  cursor: pointer; transition: background .12s, color .12s;
}
.search-btn:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-1); }
.search-btn:disabled { opacity: .6; cursor: not-allowed; }
.search-btn__spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid var(--border); border-top-color: var(--accent);
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal de resultado de búsqueda */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal {
  width: 100%; max-width: 360px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 26px 22px;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px;
  box-shadow: 0 20px 50px rgba(0,0,0,.4);
}
.modal__icon {
  width: 46px; height: 46px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.modal__icon--ok { background: var(--success-muted); color: var(--success); }
.modal__icon--muted { background: var(--bg-3); color: var(--text-3); }
.modal__icon--error { background: var(--danger-muted); color: var(--danger); }
.modal__icon--danger-soft { background: var(--danger-muted); color: var(--danger); }
.modal__title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-1); }
.modal__msg { font-size: .84rem; color: var(--text-3); line-height: 1.5; }
.modal__ok {
  margin-top: 8px; padding: 8px 28px;
  background: var(--accent); color: #fff; border: none;
  border-radius: var(--radius); font-family: var(--font-sans);
  font-size: .82rem; font-weight: 700; cursor: pointer;
}
.modal__ok:hover { filter: brightness(1.1); }
.modal__actions { display: flex; gap: 10px; margin-top: 10px; width: 100%; }
.modal__btn {
  flex: 1; padding: 9px 0; border-radius: var(--radius); border: 1px solid transparent;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 700; cursor: pointer;
}
.modal__btn--ghost { background: var(--bg-2); border-color: var(--border); color: var(--text-2); }
.modal__btn--ghost:hover { background: var(--bg-hover); }
.modal__btn--accent { background: var(--accent); color: #fff; }
.modal__btn--accent:hover { filter: brightness(1.1); }
.modal__btn--danger { background: var(--danger); color: #fff; }
.modal__btn--danger:hover:not(:disabled) { filter: brightness(1.1); }
.modal__btn--danger:disabled { opacity: .5; cursor: not-allowed; }
.modal__textarea {
  width: 100%; margin-top: 4px; padding: 9px 11px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .82rem; resize: vertical;
  outline: none;
}
.modal__textarea:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.modal__textarea::placeholder { color: var(--text-3); }
.modal__spinner {
  width: 34px; height: 34px; border-radius: 50%;
  border: 3px solid var(--border); border-top-color: var(--accent);
  animation: spin .7s linear infinite; margin-bottom: 4px;
}

.row-btn { display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border-radius: var(--radius); border: 1px solid transparent;
  background: var(--accent-muted); color: var(--accent);
  font-family: var(--font-sans); font-size: .72rem; font-weight: 700; cursor: pointer;
  white-space: nowrap;
}
.row-btn:hover:not(:disabled) { filter: brightness(1.1); }
.row-btn:disabled { opacity: .6; cursor: not-allowed; }
.row-btn--accent { background: var(--success-muted); color: var(--success); }
.row-btn--onboard { background: var(--success-muted); color: var(--success); }
.row-btn--danger { background: var(--danger-muted); color: var(--danger); }
.row-note { font-size: .74rem; color: var(--text-3); }
.row-note--muted { color: var(--text-3); }
.row-err { font-size: .68rem; color: var(--danger); margin-top: 4px; max-width: 160px; }
</style>