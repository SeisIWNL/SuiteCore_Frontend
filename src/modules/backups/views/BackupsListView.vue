<template>
  <div class="backups">

    <!-- Header -->
    <div class="backups__head">
      <div>
        <h1 class="backups__title">Respaldos de configuración</h1>
        <p class="backups__sub">
          Gestiona y monitorea los respaldos de dispositivos
        </p>
      </div>
      <button
        class="backups__refresh"
        :class="{ 'backups__refresh--loading': loading }"
        :disabled="loading"
        @click="fetchDevices"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"
          :class="{ 'spin': loading }">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Actualizar
      </button>
    </div>

    <!-- Stats cards -->
    <div class="stats-grid">
      <div class="stat-card stat-card--accent">
        <div class="stat-card__label">Total dispositivos</div>
        <div class="stat-card__value">{{ totalDevices }}</div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-card__label">Status: Success</div>
        <div class="stat-card__value">{{ successCount }}</div>
      </div>
      <div class="stat-card stat-card--danger">
        <div class="stat-card__label">Status: Failed</div>
        <div class="stat-card__value">{{ failedCount }}</div>
      </div>
      <div class="stat-card stat-card--info">
        <div class="stat-card__label">Última sincronización</div>
        <div class="stat-card__value stat-card__value--sm">
          {{ lastSync ? formatRelative(lastSyncStr) : '—' }}
        </div>
      </div>
    </div>

    <!-- Card con tabla -->
    <div class="backups__card">

      <!-- Toolbar -->
      <div class="backups__toolbar">
        <div class="search">
          <svg class="search__icon" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search__input"
            placeholder="Buscar por nombre, IP o modelo..."
          />
          <button v-if="searchQuery" class="search__clear" @click="clearSearch">✕</button>
        </div>
        <span class="backups__count">{{ filteredDevices.length }} de {{ totalDevices }}</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="backups__error">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Tabla -->
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="table__th">Dispositivo</th>
              <th class="table__th">IP</th>
              <th class="table__th">Modelo / Grupo</th>
              <th class="table__th">Último respaldo</th>
              <th class="table__th table__th--center">Estado</th>
              <th class="table__th table__th--center">Historial</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton -->
            <template v-if="loading && !hasData">
              <tr v-for="i in 3" :key="`sk-${i}`">
                <td class="table__td"><div class="skeleton" style="width:60%"/></td>
                <td class="table__td"><div class="skeleton" style="width:70%"/></td>
                <td class="table__td"><div class="skeleton" style="width:50%"/></td>
                <td class="table__td"><div class="skeleton" style="width:65%"/></td>
                <td class="table__td table__td--center"><div class="skeleton" style="width:40px;margin:0 auto"/></td>
              </tr>
            </template>

            <!-- Filas reales -->
            <template v-else-if="hasResults">
              <tr
                v-for="device in filteredDevices"
                :key="device.name"
                class="table__row table__row--clickable"
                @click="goToDetail(device.name)"
              >
                <td class="table__td">
                  <div class="device-cell">
                    <span class="device-cell__icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2"/>
                        <rect x="2" y="14" width="20" height="8" rx="2"/>
                        <line x1="6" y1="6" x2="6.01" y2="6"/>
                        <line x1="6" y1="18" x2="6.01" y2="18"/>
                      </svg>
                    </span>
                    <span class="device-cell__name">{{ device.name }}</span>
                  </div>
                </td>
                <td class="table__td">
                  <span class="mono">{{ device.ip }}</span>
                </td>
                <td class="table__td">
                  <div class="model-cell">
                    <span class="model-cell__model">{{ device.model }}</span>
                    <span class="model-cell__group">{{ device.group }}</span>
                  </div>
                </td>
                <td class="table__td">
                  <div class="backup-time">
                    <span class="backup-time__abs mono">{{ formatDateTime(device.last?.end) }}</span>
                    <span class="backup-time__rel">{{ formatRelative(device.last?.end) }}</span>
                  </div>
                </td>
                <td class="table__td table__td--center">
                  <span
                    class="status-badge"
                    :class="device.status === 'success' ? 'status-badge--up' : 'status-badge--down'"
                  >
                    <span class="status-badge__dot" />
                    {{ device.status === 'success' ? 'Success' : 'Failed' }}
                  </span>
                </td>
                <td class="table__td table__td--center" @click.stop>
                  <button class="hist-btn" @click="openHistory(device.name)" title="Ver historial de versiones">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Historial
                  </button>
                </td>
              </tr>
            </template>

            <!-- Sin resultados -->
            <template v-else-if="hasData && !hasResults">
              <tr>
                <td colspan="6" class="table__no-results">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>No se encontraron dispositivos para "<strong>{{ searchQuery }}</strong>"</span>
                  <button class="table__clear-btn" @click="clearSearch">Limpiar búsqueda</button>
                </td>
              </tr>
            </template>

            <!-- Sin datos -->
            <template v-else>
              <tr>
                <td colspan="6" class="table__no-results">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                  </svg>
                  <span>No hay dispositivos registrados en Oxidized</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de historial de versiones -->
    <VersionHistoryModal
      :open="historyOpen"
      :device-name="historyDevice"
      @close="closeHistory"
    />
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBackups }    from '@/modules/backups/composables/useBackups.js'
import { useDateFormat } from '@/modules/backups/composables/useDateFormat.js'
import VersionHistoryModal from '@/modules/backups/components/VersionHistoryModal.vue'

const router = useRouter()
const { formatDateTime, formatRelative } = useDateFormat()

const {
  searchQuery, filteredDevices,
  totalDevices, successCount, failedCount, lastSync,
  loading, error, hasResults, hasData,
  fetchDevices, clearSearch,
} = useBackups()

// Para formatRelative del lastSync necesitamos el string ISO
const lastSyncStr = computed(() => lastSync.value?.toISOString() ?? null)

// ── Modal de historial ──────────────────────────────────────
const historyOpen   = ref(false)
const historyDevice = ref('')

function openHistory(deviceName) {
  historyDevice.value = deviceName
  historyOpen.value   = true
}
function closeHistory() {
  historyOpen.value = false
}

function goToDetail(deviceName) {
  router.push({ name: 'backup-detail', params: { deviceName } })
}

onMounted(fetchDevices)
</script>

<style scoped>
.backups { max-width: auto; }

/* Header */
.backups__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 18px;
}
.backups__title {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1);
}
.backups__sub { font-size: .8rem; color: var(--text-3); margin-top: 4px; }
.backups__refresh {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.backups__refresh:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-mid); }
.backups__refresh:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Stats grid */
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.stat-card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 14px 18px;
  position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; left: 0; top: 0;
  width: 3px; height: 100%;
}
.stat-card--accent::before  { background: var(--accent); }
.stat-card--success::before { background: var(--success); }
.stat-card--danger::before  { background: var(--danger); }
.stat-card--info::before    { background: var(--blue); }
.stat-card__label {
  font-size: .68rem; color: var(--text-3); font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em;
}
.stat-card__value {
  font-family: var(--font-display);
  font-size: 1.5rem; font-weight: 700; color: var(--text-1);
  margin-top: 4px; line-height: 1;
}
.stat-card__value--sm { font-size: 1rem; }

/* Card */
.backups__card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden;
}
.backups__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.search { position: relative; flex: 1; max-width: 340px; }
.search__icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--text-3); pointer-events: none;
}
.search__input {
  width: 100%; height: 34px; padding: 0 32px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .82rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.search__input::placeholder { color: var(--text-3); }
.search__input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); background: var(--bg-1); }
.search__clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; background: var(--bg-3); border: none; border-radius: 50%;
  color: var(--text-2); cursor: pointer; font-size: .65rem;
  display: flex; align-items: center; justify-content: center;
}
.search__clear:hover { background: var(--border-mid); color: var(--text-1); }
.backups__count { font-size: .72rem; color: var(--text-3); white-space: nowrap; }

.backups__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; margin: 14px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .8rem; color: var(--danger);
}

/* Tabla */
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
.table__th {
  text-align: left; padding: 11px 16px;
  font-size: .68rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.table__th--center { text-align: center; }
.table__row { transition: background .1s; }
.table__row--clickable { cursor: pointer; }
.table__row--clickable:hover { background: var(--bg-2); }
.table__td {
  padding: 13px 16px; font-size: .85rem; color: var(--text-1);
  border-bottom: 1px solid var(--border); vertical-align: middle;
}
.table__td--center { text-align: center; }
.table tbody tr:last-child .table__td { border-bottom: none; }

.device-cell { display: flex; align-items: center; gap: 10px; }
.device-cell__icon {
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  background: var(--accent-muted); color: var(--accent);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.device-cell__name { font-weight: 600; }

.model-cell { display: flex; flex-direction: column; gap: 2px; }
.model-cell__model { color: var(--text-1); }
.model-cell__group {
  font-size: .7rem; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .04em;
}

.backup-time { display: flex; flex-direction: column; gap: 2px; }
.backup-time__abs { font-size: .8rem; color: var(--text-1); }
.backup-time__rel { font-size: .7rem; color: var(--text-3); }

/* Status badge */
.status-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 99px;
  font-size: .7rem; font-weight: 700;
}
.status-badge__dot { width: 5px; height: 5px; border-radius: 50%; }
.status-badge--up {
  background: var(--success-muted); color: var(--success);
  border: 1px solid var(--success);
}
.status-badge--up .status-badge__dot { background: var(--success); }
.status-badge--down {
  background: var(--danger-muted); color: var(--danger);
  border: 1px solid var(--danger);
}
.status-badge--down .status-badge__dot { background: var(--danger); }

.mono { font-family: var(--font-mono); font-size: .8rem; }

.table__no-results { padding: 48px 20px; text-align: center; color: var(--text-3); font-size: .85rem; }
.table__no-results svg { display: block; margin: 0 auto 12px; opacity: .5; }
.table__clear-btn {
  display: block; margin: 12px auto 0; padding: 6px 14px;
  background: var(--accent); border: none; border-radius: var(--radius);
  color: #fff; font-family: var(--font-sans); font-size: .76rem; font-weight: 500; cursor: pointer;
}
.table__clear-btn:hover { background: var(--accent-dim); }

.skeleton { height: 12px; border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

@media (max-width: 640px) {
  .backups__head { flex-direction: column; gap: 12px; }
}
/* Historial button */
.hist-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-2);
  font-family: var(--font-sans); font-size: .72rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: background .12s, color .12s, border-color .12s;
}
.hist-btn:hover {
  background: var(--accent-muted); border-color: var(--accent);
  color: var(--accent);
}

</style>