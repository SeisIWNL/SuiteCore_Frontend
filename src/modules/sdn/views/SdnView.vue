<template>
  <div class="sdn">

    <!-- Header -->
    <div class="sdn__head">
      <div>
        <div class="sdn__eyebrow">RED DEFINIDA POR SOFTWARE</div>
        <h1 class="sdn__title">Controlador SDN</h1>
        <p class="sdn__sub">Estado del SCNO (OVS + OpenFlow) y del dispositivo MikroTik administrado</p>
      </div>
      <button class="sdn__refresh" :class="{ 'sdn__refresh--loading': anyLoading }"
        :disabled="anyLoading" @click="loadAll">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          :class="{ 'spin': anyLoading }">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Actualizar
      </button>
    </div>

    <!-- Fila de tarjetas de estado -->
    <div class="sdn__status-grid">
      <!-- SCNO -->
      <div class="st-card st-card--accent">
        <div class="st-card__label">SCNO</div>
        <div v-if="health.loading" class="st-card__load"><span class="skeleton" style="width:50%;height:16px"/></div>
        <div v-else-if="health.error" class="st-card__err">Sin conexión</div>
        <template v-else-if="health.data">
          <div class="st-card__value">
            <span class="st-dot" :class="isOnline ? 'st-dot--on' : 'st-dot--off'" />
            {{ isOnline ? 'Online' : (health.data.status || 'Offline') }}
          </div>
          <div class="st-card__sub">{{ health.data.version || '—' }}</div>
        </template>
      </div>

      <!-- Bridge -->
      <div class="st-card">
        <div class="st-card__label">Bridge</div>
        <div v-if="topology.loading" class="st-card__load"><span class="skeleton" style="width:50%;height:16px"/></div>
        <div v-else-if="topology.error" class="st-card__err">—</div>
        <template v-else-if="topology.data">
          <div class="st-card__value st-card__value--plain">{{ topology.data.bridge || '—' }}</div>
          <div class="st-card__sub">{{ (topology.data.ports?.length ?? 0) }} ports activos</div>
        </template>
      </div>

      <!-- OpenFlow -->
      <div class="st-card">
        <div class="st-card__label">OpenFlow</div>
        <div v-if="health.loading" class="st-card__load"><span class="skeleton" style="width:50%;height:16px"/></div>
        <div v-else-if="health.error" class="st-card__err">—</div>
        <template v-else-if="health.data">
          <div class="st-card__value st-card__value--plain">{{ health.data.openflow || '—' }}</div>
          <div class="st-card__sub">{{ health.data.controller || '—' }}</div>
        </template>
      </div>

      <!-- MikroTik -->
      <div class="st-card">
        <div class="st-card__label">MikroTik</div>
        <div v-if="mkInfo.loading" class="st-card__load"><span class="skeleton" style="width:50%;height:16px"/></div>
        <div v-else-if="mkInfo.error" class="st-card__err">Sin conexión</div>
        <template v-else-if="mkInfo.data">
          <div class="st-card__value">
            <span class="st-dot" :class="mkOnline ? 'st-dot--on' : 'st-dot--off'" />
            {{ mkOnline ? 'Online' : (mkInfo.data.status || 'Offline') }}
          </div>
          <div class="st-card__sub">Up: {{ shortUptime(mkInfo.data.uptime) }}</div>
        </template>
      </div>
    </div>

    <!-- Topología + MikroTik en dos columnas -->
    <div class="sdn__two-col">
    <!-- Topología SDN -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">
          <span class="panel__icon panel__icon--accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/>
              <rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/>
              <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </span>
          Topología SDN
        </span>
        <span v-if="topology.data?.ovsVersion" class="panel__badge">OVS {{ topology.data.ovsVersion }}</span>
      </div>

      <div v-if="topology.loading" class="panel__body"><span class="skeleton" style="width:40%;height:16px"/></div>
      <div v-else-if="topology.error" class="panel__err">{{ topology.error }}</div>
      <div v-else-if="topology.data" class="panel__body">
        <div class="field">
          <div class="field__label">Controlador</div>
          <code class="field__value">{{ topology.data.controller || '—' }}</code>
        </div>
        <div class="field">
          <div class="field__label">Puertos activos</div>
          <div class="ports">
            <span v-for="port in topology.data.ports" :key="port" class="port-chip">{{ port }}</span>
            <span v-if="!topology.data.ports?.length" class="ports__empty">Sin puertos activos</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MikroTik: sistema -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">
          <span class="panel__icon panel__icon--blue">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
              <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
            </svg>
          </span>
          MikroTik {{ mkInfo.data?.identity || '' }}
        </span>
      </div>

      <div v-if="mkInfo.loading" class="panel__body"><span class="skeleton" style="width:60%;height:16px"/></div>
      <div v-else-if="mkInfo.error" class="panel__err">{{ mkInfo.error }}</div>
      <div v-else-if="mkInfo.data" class="panel__body">
        <div class="mk-grid">
          <div class="field">
            <div class="field__label">Versión</div>
            <div class="field__value">{{ mkInfo.data.version || '—' }}</div>
          </div>
          <div class="field">
            <div class="field__label">Arquitectura</div>
            <div class="field__value">{{ mkInfo.data.architecture || '—' }}</div>
          </div>
          <div class="field" v-if="mkInfo.data.platform">
            <div class="field__label">Plataforma</div>
            <div class="field__value">{{ mkInfo.data.platform }}</div>
          </div>
        </div>

        <!-- CPU -->
        <div class="bar-block">
          <div class="bar-block__head">
            <span>CPU Load</span>
            <span class="bar-block__pct">{{ mkInfo.data.cpuLoad }}%</span>
          </div>
          <div class="bar"><div class="bar__fill" :class="barClass(mkInfo.data.cpuLoad)" :style="{ width: mkInfo.data.cpuLoad + '%' }" /></div>
        </div>

        <!-- Memoria -->
        <div class="bar-block">
          <div class="bar-block__head">
            <span>Uso de memoria</span>
            <span class="bar-block__pct">{{ fmtBytes(memoryUsed) }} / {{ fmtBytes(mkInfo.data.totalMemory) }}</span>
          </div>
          <div class="bar"><div class="bar__fill" :class="barClass(memoryPct)" :style="{ width: memoryPct + '%' }" /></div>
        </div>

        <!-- Uptime -->
        <div class="field field--row">
          <div class="field__label">Uptime del sistema</div>
          <div class="field__value field__value--strong">{{ mkInfo.data.uptime || '—' }}</div>
        </div>
      </div>
    </div>
    </div>
    <!-- /Topología + MikroTik -->

    <!-- MikroTik: interfaces -->
    <div class="panel">
      <div class="panel__head">
        <span class="panel__title">
          <span class="panel__icon panel__icon--success">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
              <path d="M18 9a9 9 0 0 1-9 9"/>
            </svg>
          </span>
          Interfaces MikroTik
        </span>
        <span v-if="interfaces.length" class="panel__badge panel__badge--muted">{{ interfaces.length }}</span>
      </div>

      <div v-if="mkIfaces.loading" class="panel__pad">
        <div v-for="i in 4" :key="`if-sk-${i}`" class="if-sk"><span class="skeleton" style="width:100%;height:14px"/></div>
      </div>
      <div v-else-if="mkIfaces.error" class="panel__err">{{ mkIfaces.error }}</div>
      <div v-else-if="!interfaces.length" class="panel__empty">Sin interfaces reportadas</div>
      <div v-else class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="tbl__th">Interfaz</th>
              <th class="tbl__th">Tipo</th>
              <th class="tbl__th tbl__th--center">Estado</th>
              <th class="tbl__th tbl__th--center">Deshabilitada</th>
              <th class="tbl__th">Comentario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="iface in interfaces" :key="iface.name" class="tbl__tr"
              :class="{ 'tbl__tr--disabled': iface.disabled }">
              <td class="tbl__td"><span class="iface-name">{{ iface.name }}</span></td>
              <td class="tbl__td"><span class="iface-type">{{ ifaceType(iface.type) }}</span></td>
              <td class="tbl__td tbl__td--center">
                <span class="state-dot" :class="iface.running ? 'state-dot--on' : 'state-dot--off'"
                  :title="iface.running ? 'Activa' : 'Inactiva'" />
              </td>
              <td class="tbl__td tbl__td--center">
                <span class="yn" :class="iface.disabled ? 'yn--yes' : 'yn--no'">
                  {{ iface.disabled ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="tbl__td"><span class="iface-comment">{{ iface.comment || '—' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fila inferior: Flows + Statistics -->
    <div class="sdn__bottom">
      <!-- OpenFlow flows -->
      <div class="panel panel--center">
        <div class="panel__head panel__head--center">
          <span class="panel__title-sm">OPENFLOW FLOWS</span>
        </div>
        <div v-if="flows.loading" class="flow-center"><span class="skeleton" style="width:60px;height:48px"/></div>
        <div v-else-if="flows.error" class="panel__err">{{ flows.error }}</div>
        <div v-else class="flow-center">
          <div class="flow-count">{{ flowCount }}</div>
          <svg class="flow-icon" width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="12" x2="2" y2="12"/>
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          <p v-if="flowCount === 0" class="flow-empty">No hay flujos activos en el bridge SDN</p>
          <p v-else class="flow-active">{{ flowCount }} flujo(s) OpenFlow activo(s)</p>
        </div>
      </div>

      <!-- Statistics -->
      <div class="panel panel--center">
        <div v-if="statistics.loading" class="stat-center"><span class="skeleton" style="width:60%;height:16px"/></div>
        <div v-else-if="statistics.error" class="panel__err">{{ statistics.error }}</div>
        <div v-else-if="!statPorts.length" class="stat-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 20V10M12 20V4M6 20v-6"/><circle cx="20" cy="16" r="3"/><line x1="22.5" y1="18.5" x2="21.5" y2="17.5"/>
          </svg>
          <p class="stat-empty-title">Sin estadísticas disponibles</p>
          <p class="stat-empty-sub">Esperando telemetría de los puertos</p>
        </div>
        <!-- Cuando el SCNO retorne datos, se renderiza genéricamente -->
        <div v-else class="stat-list">
          <div class="stat-list__head">Estadísticas de puertos</div>
          <pre class="stat-raw">{{ prettyPorts }}</pre>
        </div>
      </div>
    </div>
    <!-- /Fila inferior -->

    <!-- Seguridad + Automatización en dos columnas -->
    <div class="sdn__two-col">

      <!-- Seguridad SDN -->
      <div class="panel panel--danger">
        <div class="panel__head">
          <span class="panel__title">
            <span class="panel__icon panel__icon--danger">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span class="panel__title--danger">Seguridad SDN</span>
          </span>
        </div>
        <div class="panel__body">
          <div class="section-label">Control de acceso por IP</div>
          <div class="field">
            <label class="field__label">Dirección IP</label>
            <input
              v-model="security.ip"
              type="text"
              class="input"
              placeholder="X.X.X.X"
              @keyup.enter="runBlockIp(true)"
            />
          </div>
          <div class="action-row">
            <button class="btn btn--block" :disabled="security.loading" @click="runBlockIp(true)">
              <span v-if="security.loading" class="btn__spinner" />
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              Bloquear IP
            </button>
            <button class="btn btn--unblock" :disabled="security.loading" @click="runBlockIp(false)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
              </svg>
              Desbloquear
            </button>
          </div>
          <div v-if="security.error" class="msg msg--error">{{ security.error }}</div>
          <div v-else-if="security.message" class="msg" :class="`msg--${security.messageType}`">
            <svg v-if="security.messageType === 'success'" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ security.message }}
          </div>
        </div>
      </div>

      <!-- Automatización SDN -->
      <div class="panel">
        <div class="panel__head">
          <span class="panel__title">
            <span class="panel__icon panel__icon--warn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            Automatización SDN
          </span>
        </div>
        <div class="panel__body">
          <div class="field">
            <label class="field__label">Acción</label>
            <input
              v-model="automation.action"
              type="text"
              class="input"
              placeholder="nombre-de-accion"
              @keyup.enter="runAutomation"
            />
          </div>
          <button class="btn btn--exec" :disabled="automation.loading" @click="runAutomation">
            <span v-if="automation.loading" class="btn__spinner" />
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Ejecutar acción
          </button>
          <div v-if="automation.message" class="msg" :class="`msg--${automation.messageType}`">
            <svg v-if="automation.messageType === 'success'" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ automation.message }}
          </div>
          <div class="hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Ingresa el nombre de la acción a ejecutar en el controlador SDN. Asegúrate de que el script esté cargado en la base de datos de políticas.</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSdn, formatBytes, ifaceTypeLabel } from '@/modules/sdn/composables/useSdn.js'

const {
  health, topology, statistics, flows, mkInfo, mkIfaces,
  anyLoading, isOnline,
  memoryUsed, memoryPct, interfaces, flowCount, statPorts,
  security, automation,
  runBlockIp, runAutomation,
  loadAll,
} = useSdn()

const fmtBytes = formatBytes
const ifaceType = ifaceTypeLabel

const mkOnline = computed(() => {
  const s = (mkInfo.value.data?.status ?? '').toLowerCase()
  return s === 'online' || s === 'ok' || s === 'running'
})

function barClass(pct) {
  if (pct >= 85) return 'bar__fill--danger'
  if (pct >= 60) return 'bar__fill--warn'
  return 'bar__fill--ok'
}

// Uptime abreviado para la tarjeta (ej: "2w 6d 16h 17m" → "2w 6d")
function shortUptime(uptime) {
  if (!uptime) return '—'
  const parts = String(uptime).split(' ').slice(0, 2)
  return parts.join(' ')
}

const prettyPorts = computed(() => {
  try { return JSON.stringify(statPorts.value, null, 2) }
  catch { return String(statPorts.value) }
})

onMounted(loadAll)
</script>

<style scoped>
.sdn { max-width: auto; }

/* Header */
.sdn__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 20px;
}
.sdn__eyebrow {
  font-family: var(--font-mono);
  font-size: .64rem; font-weight: 700; color: var(--accent);
  letter-spacing: .12em; margin-bottom: 6px;
}
.sdn__title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--text-1); }
.sdn__sub { font-size: .8rem; color: var(--text-3); margin-top: 5px; }
.sdn__refresh {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 8px 14px; background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.sdn__refresh:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-mid); }
.sdn__refresh:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Tarjetas de estado */
.sdn__status-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 18px;
}
.st-card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 14px 16px;
  position: relative; overflow: hidden;
}
.st-card--accent::before {
  content: ''; position: absolute; left: 0; top: 0; width: 3px; height: 100%;
  background: var(--accent);
}
.st-card__label {
  font-size: .64rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px;
}
.st-card__value {
  font-family: var(--font-display); font-size: 1.05rem; font-weight: 700;
  color: var(--text-1); display: flex; align-items: center; gap: 7px; line-height: 1.1;
}
.st-card__value--plain { font-family: var(--font-mono); font-size: 1rem; }
.st-card__sub { font-size: .68rem; color: var(--text-3); margin-top: 5px; font-family: var(--font-mono); }
.st-card__load { padding: 4px 0; }
.st-card__err { font-size: .82rem; color: var(--danger); font-weight: 600; }
.st-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.st-dot--on { background: var(--success); box-shadow: 0 0 7px var(--success); }
.st-dot--off { background: var(--danger); }

/* Paneles */
.panel {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); margin-bottom: 16px; overflow: hidden;
}
.panel__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.panel__head--center { justify-content: center; border-bottom: none; padding-bottom: 0; }
.panel__title {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--font-display); font-size: .98rem; font-weight: 700; color: var(--text-1);
}
.panel__title-sm {
  font-size: .68rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .08em;
}
.panel__icon {
  width: 30px; height: 30px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.panel__icon--accent { background: var(--accent-muted); color: var(--accent); }
.panel__icon--blue { background: var(--blue-muted); color: var(--blue); }
.panel__icon--success { background: var(--success-muted); color: var(--success); }
.panel__badge {
  font-family: var(--font-mono); font-size: .64rem; font-weight: 700;
  padding: 3px 9px; border-radius: 4px;
  background: var(--bg-3); color: var(--text-2); letter-spacing: .03em;
}
.panel__badge--muted { background: var(--accent-muted); color: var(--accent); border-radius: 99px; }
.panel__body { padding: 16px 18px; display: flex; flex-direction: column; gap: 14px; }
.panel__pad { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
.panel__err { padding: 16px 18px; font-size: .8rem; color: var(--danger); }
.panel__empty { padding: 28px 18px; text-align: center; font-size: .82rem; color: var(--text-3); }

/* Campos */
.field { display: flex; flex-direction: column; gap: 5px; }
.field--row { flex-direction: row; align-items: center; justify-content: space-between; }
.field__label {
  font-size: .64rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
}
.field__value { font-size: .84rem; color: var(--text-1); }
.field__value--strong { font-family: var(--font-display); font-weight: 700; }
code.field__value {
  font-family: var(--font-mono); font-size: .8rem;
  background: var(--bg-2); border: 1px solid var(--border);
  padding: 8px 12px; border-radius: var(--radius); color: var(--text-1);
  display: block; width: fit-content;
}

.ports { display: flex; flex-wrap: wrap; gap: 7px; }
.port-chip {
  font-family: var(--font-mono); font-size: .74rem; color: var(--text-1);
  background: var(--bg-2); border: 1px solid var(--border);
  padding: 5px 11px; border-radius: var(--radius);
}
.ports__empty { font-size: .78rem; color: var(--text-3); }

.mk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; }

/* Barras */
.bar-block { display: flex; flex-direction: column; gap: 6px; }
.bar-block__head {
  display: flex; align-items: center; justify-content: space-between;
  font-size: .74rem; color: var(--text-2);
}
.bar-block__pct { font-family: var(--font-mono); font-size: .72rem; color: var(--text-1); }
.bar { height: 7px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
.bar__fill { height: 100%; border-radius: 99px; transition: width .4s ease; }
.bar__fill--ok { background: var(--success); }
.bar__fill--warn { background: var(--warning); }
.bar__fill--danger { background: var(--danger); }

/* Tabla interfaces */
.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl__th {
  text-align: left; padding: 10px 18px;
  font-size: .64rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2);
}
.tbl__th--center { text-align: center; }
.tbl__tr:hover { background: var(--bg-2); }
.tbl__tr--disabled { opacity: .5; }
.tbl__td { padding: 10px 18px; font-size: .82rem; color: var(--text-1); border-bottom: 1px solid var(--border); }
.tbl__td--center { text-align: center; }
.tbl tbody tr:last-child .tbl__td { border-bottom: none; }
.iface-name { font-family: var(--font-mono); font-weight: 600; color: var(--text-1); }
.iface-type { font-size: .78rem; color: var(--text-2); }
.iface-comment { font-size: .78rem; color: var(--text-3); }
.state-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; }
.state-dot--on { background: var(--success); box-shadow: 0 0 6px var(--success); }
.state-dot--off { background: var(--text-3); }
.yn { font-size: .72rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; }
.yn--yes { background: var(--warning-muted); color: var(--warning); }
.yn--no { background: var(--bg-3); color: var(--text-3); }
.if-sk { padding: 3px 0; }

/* Fila inferior */
.sdn__bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.panel--center { display: flex; flex-direction: column; }
.flow-center, .stat-center {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 28px 18px 32px; text-align: center; flex: 1;
}
.flow-count { font-family: var(--font-display); font-size: 3rem; font-weight: 800; color: var(--text-1); line-height: 1; }
.flow-icon { color: var(--text-3); opacity: .5; margin-top: 4px; }
.flow-empty { font-size: .8rem; color: var(--text-3); max-width: 200px; line-height: 1.4; }
.flow-active { font-size: .82rem; color: var(--success); font-weight: 600; }
.stat-center svg { color: var(--text-3); opacity: .45; }
.stat-empty-title { font-size: .84rem; color: var(--text-2); font-weight: 600; margin-top: 4px; }
.stat-empty-sub { font-size: .74rem; color: var(--text-3); }
.stat-list { padding: 16px 18px; width: 100%; }
.stat-list__head { font-size: .7rem; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 10px; }
.stat-raw {
  font-family: var(--font-mono); font-size: .72rem; color: var(--text-2);
  background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 12px; overflow-x: auto; max-height: 240px; margin: 0;
}
.skeleton { border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; display: inline-block; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

/* Dos columnas */
.sdn__two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.sdn__two-col .panel { margin-bottom: 0; }

/* Panel con acento de peligro (Seguridad) */
.panel--danger { border-color: color-mix(in srgb, var(--danger) 25%, var(--border)); }
.panel--danger .panel__head { background: var(--danger-muted); border-bottom-color: color-mix(in srgb, var(--danger) 20%, var(--border)); }
.panel__title--danger { color: var(--danger); }
.panel__icon--danger { background: var(--danger-muted); color: var(--danger); }
.panel__icon--warn { background: var(--warning-muted); color: var(--warning); }

.section-label { font-size: .76rem; color: var(--danger); font-weight: 600; }

/* Inputs */
.input {
  width: 100%; height: 38px; padding: 0 12px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-mono); font-size: .84rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.input::placeholder { color: var(--text-3); font-family: var(--font-sans); }
.input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); background: var(--bg-1); }

/* Botones de acción */
.action-row { display: flex; gap: 10px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 40px; padding: 0 16px; flex: 1;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 600;
  border: 1px solid transparent; color: #fff;
  transition: filter .12s, background .12s;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn--block { background: var(--danger); }
.btn--block:hover:not(:disabled) { filter: brightness(.92); }
.btn--unblock { background: var(--success); }
.btn--unblock:hover:not(:disabled) { filter: brightness(.92); }
.btn--exec { background: #0f1729; width: 100%; }
.btn--exec:hover:not(:disabled) { background: #1a2540; }
.btn__spinner {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  animation: spin .7s linear infinite;
}

/* Mensajes */
.msg {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 12px; border-radius: var(--radius);
  font-size: .78rem; font-weight: 500;
}
.msg--success { background: var(--success-muted); color: var(--success); }
.msg--error { background: var(--danger-muted); color: var(--danger); }

/* Hint */
.hint {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: .72rem; color: var(--text-3); line-height: 1.5;
}
.hint svg { flex-shrink: 0; margin-top: 2px; color: var(--accent); }

@media (max-width: 720px) {
  .sdn__head { flex-direction: column; }
  .sdn__bottom { grid-template-columns: 1fr; }
  .sdn__two-col { grid-template-columns: 1fr; }
}
</style>