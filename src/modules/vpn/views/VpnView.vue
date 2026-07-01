<template>
  <div class="vpn">

    <!-- Header -->
    <div class="vpn__head">
      <div>
        <div class="vpn__eyebrow">ACCESO REMOTO</div>
        <h1 class="vpn__title">VPN y conectividad</h1>
        <p class="vpn__sub">Estado de los servicios de acceso remoto y máquinas conectadas</p>
      </div>
      <div class="vpn__head-actions">
        <button class="vpn__auto" :class="{ 'vpn__auto--on': autoRefresh }"
          :title="autoRefresh ? 'Auto-actualización activada (cada 15s)' : 'Auto-actualización pausada'"
          @click="toggleAutoRefresh">
          <span class="vpn__auto-dot" />
          {{ autoRefresh ? 'En vivo' : 'Pausado' }}
        </button>
        <button class="vpn__refresh" :class="{ 'vpn__refresh--loading': anyLoading }"
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
    </div>

    <!-- Fila de servicios (paneles de apoyo) -->
    <div class="vpn__services">

      <!-- RADIUS / Servidor VPN -->
      <div class="svc-card">
        <div class="svc-card__head">
          <span class="svc-card__title">
            <span class="svc-ico svc-ico--gateway">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
            </span>
            <span class="svc-card__label">Servidor VPN</span>
          </span>
          <span v-if="status.data" class="svc-badge"
            :class="status.data.isOnline ? 'svc-badge--on' : 'svc-badge--off'">
            <span class="svc-badge__dot" />
            {{ status.data.isOnline ? 'ONLINE' : 'OFFLINE' }}
          </span>
        </div>
        <div v-if="status.loading" class="svc-card__loading"><span class="skeleton" style="width:60%;height:16px"/></div>
        <div v-else-if="status.error" class="svc-card__err">{{ status.error }}</div>
        <template v-else-if="status.data">
          <div class="svc-card__value">{{ status.data.server }}</div>
          <div class="svc-card__rows">
            <div class="svc-row"><span>IP gestión</span><code>{{ status.data.managementIp }}</code></div>
            <div class="svc-row"><span>Uptime</span><strong>{{ status.data.uptime }}</strong></div>
            <div class="svc-row">
              <span>Estado</span>
              <span class="pill" :class="status.data.isOnline ? 'pill--on' : 'pill--off'">
                {{ status.data.isOnline ? 'En línea' : 'Caído' }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- WireGuard -->
      <div class="svc-card">
        <div class="svc-card__head">
          <span class="svc-card__title">
            <span class="svc-ico svc-ico--wg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span class="svc-card__label">WireGuard{{ wireguard.data ? ' · ' + wireguard.data.interface : '' }}</span>
          </span>
          <span v-if="wireguard.data" class="svc-badge"
            :class="wireguard.data.isActive ? 'svc-badge--on' : 'svc-badge--off'">
            <span class="svc-badge__dot" />
            {{ wireguard.data.isActive ? 'ACTIVE' : 'INACTIVE' }}
          </span>
        </div>
        <div v-if="wireguard.loading" class="svc-card__loading"><span class="skeleton" style="width:60%;height:16px"/></div>
        <div v-else-if="wireguard.error" class="svc-card__err">{{ wireguard.error }}</div>
        <template v-else-if="wireguard.data">
          <div class="svc-card__value">
            {{ wireguard.data.interface }}
            <span class="svc-card__peers">{{ wireguard.data.connectedPeers }} peer(s)</span>
          </div>
          <div class="svc-card__rows">
            <div class="svc-row"><span>Red</span><code>{{ wireguard.data.network }}</code></div>
            <div class="svc-row"><span>IP servidor</span><code>{{ wireguard.data.serverIp }}</code></div>
            <div class="svc-row" v-if="wgStats.data">
              <span>Tráfico</span>
              <span class="traffic">
                <span class="traffic__down">↓ {{ fmtBytes(wgStats.data.rxBytes) }}</span>
                <span class="traffic__up">↑ {{ fmtBytes(wgStats.data.txBytes) }}</span>
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Política de acceso -->
      <div class="svc-card">
        <div class="svc-card__head">
          <span class="svc-card__title">
            <span class="svc-ico svc-ico--policy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
              </svg>
            </span>
            <span class="svc-card__label">Política de acceso</span>
          </span>
        </div>
        <div v-if="policy.loading" class="svc-card__loading"><span class="skeleton" style="width:60%;height:16px"/></div>
        <div v-else-if="policy.error" class="svc-card__err">{{ policy.error }}</div>
        <template v-else-if="policy.data">
          <div class="svc-card__value svc-card__value--sm">
            <code>{{ policy.data.origin }}</code>
          </div>
          <div class="policy-list">
            <div v-for="d in policy.data.destinations" :key="d.network" class="policy-item">
              <span class="policy-item__net">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  :stroke="d.isAllowed ? 'currentColor' : 'currentColor'" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round"
                  :class="d.isAllowed ? 'policy-ico--ok' : 'policy-ico--no'">
                  <polyline v-if="d.isAllowed" points="20 6 9 17 4 12"/>
                  <template v-else><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></template>
                </svg>
                {{ d.network }}
              </span>
              <span class="policy-item__state" :class="d.isAllowed ? 'is-ok' : 'is-no'">
                {{ d.isAllowed ? 'Permitido' : 'Bloqueado' }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Panel de tráfico WireGuard -->
    <div class="traffic-panel" v-if="!wgStats.error">
      <div class="traffic-panel__head">
        <span class="traffic-panel__title">
          <span class="svc-ico svc-ico--wg">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </span>
          Tráfico WireGuard{{ wgStats.data ? ' — ' + wgStats.data.interface : '' }}
        </span>
      </div>
      <WireguardTrafficChart :history="trafficHistory" />
      <!-- Métricas de tráfico acumulado -->
      <div class="traffic-metrics" v-if="wgStats.data">
        <div class="tmetric"><span class="tmetric__lbl">RX TOTAL</span><span class="tmetric__val tmetric__val--rx">{{ fmtBytes(wgStats.data.rxBytes) }}</span></div>
        <div class="tmetric"><span class="tmetric__lbl">TX TOTAL</span><span class="tmetric__val tmetric__val--tx">{{ fmtBytes(wgStats.data.txBytes) }}</span></div>
        <div class="tmetric"><span class="tmetric__lbl">RX PKTS</span><span class="tmetric__val">{{ wgStats.data.rxPackets.toLocaleString() }}</span></div>
        <div class="tmetric"><span class="tmetric__lbl">TX PKTS</span><span class="tmetric__val">{{ wgStats.data.txPackets.toLocaleString() }}</span></div>
        <div class="tmetric" v-if="wgStats.data.rxErrors || wgStats.data.txErrors">
          <span class="tmetric__lbl">ERRORES</span>
          <span class="tmetric__val tmetric__val--err">{{ wgStats.data.rxErrors + wgStats.data.txErrors }}</span>
        </div>
      </div>
    </div>

    <!-- ═══════ Tailscale: máquinas de la red mesh (principal) ═══════ -->
    <div class="ts">
      <div class="ts__head">
        <div class="ts__title-wrap">
          <span class="ts__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/>
              <rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/>
              <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </span>
          <div>
            <h2 class="ts__title">Red Tailscale</h2>
            <p class="ts__meta" v-if="tailscale.data">
              Nodo <strong>{{ tailscale.data.nodeName }}</strong> ·
              <code>{{ tailscale.data.meshIp }}</code> ·
              <span :class="tailscale.data.isConnected ? 'ts-conn--on' : 'ts-conn--off'">
                {{ tailscale.data.isConnected ? 'Conectado' : 'Desconectado' }}
              </span>
              <span class="derp-badge" :class="tailscale.data.derpActive ? 'derp-badge--relay' : 'derp-badge--direct'">
                {{ tailscale.data.derpActive ? 'DERP Relay' : 'DERP Directo' }}
              </span>
            </p>
          </div>
        </div>

        <!-- Contadores -->
        <div class="ts__head-right" v-if="tailscale.data">
          <span class="svc-badge" :class="tailscale.data.isConnected ? 'svc-badge--on' : 'svc-badge--off'">
            <span class="svc-badge__dot" />
            {{ tailscale.data.isConnected ? 'CONNECTED' : 'OFFLINE' }}
          </span>
          <div class="ts__counts">
            <div class="ts-count"><span class="ts-count__val ts-count__val--on">{{ onlineCount }}</span><span class="ts-count__lbl">En línea</span></div>
            <div class="ts-count"><span class="ts-count__val ts-count__val--off">{{ offlineCount }}</span><span class="ts-count__lbl">Desconectadas</span></div>
            <div class="ts-count"><span class="ts-count__val">{{ totalPeers }}</span><span class="ts-count__lbl">Total</span></div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="ts__toolbar" v-if="tailscale.data && !tailscale.error">
        <div class="search">
          <svg class="search__icon" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQuery" type="text" class="search__input"
            placeholder="Buscar por hostname, IP, usuario u OS..." />
          <button v-if="searchQuery" class="search__clear" @click="searchQuery = ''">✕</button>
        </div>
        <div class="ts__filters">
          <button class="chip" :class="{ 'chip--active': statusFilter === 'all' }"
            @click="statusFilter = 'all'">Todas</button>
          <button class="chip" :class="{ 'chip--active': statusFilter === 'online' }"
            @click="statusFilter = 'online'">
            <span class="chip__dot chip__dot--on" /> En línea
          </button>
          <button class="chip" :class="{ 'chip--active': statusFilter === 'offline' }"
            @click="statusFilter = 'offline'">
            <span class="chip__dot chip__dot--off" /> Desconectadas
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="tailscale.loading" class="ts__skeleton">
        <div v-for="i in 5" :key="`ts-sk-${i}`" class="ts-row-sk">
          <span class="skeleton" style="width:30px;height:30px;border-radius:50%"/>
          <span class="skeleton" style="flex:1;height:14px"/>
          <span class="skeleton" style="width:100px;height:14px"/>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="tailscale.error" class="ts__error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ tailscale.error }}</span>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="!filteredPeers.length" class="ts__empty">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>No se encontraron máquinas con esos criterios</span>
        <button class="link-btn" @click="clearFilters">Limpiar filtros</button>
      </div>

      <!-- Tabla de máquinas -->
      <div v-else class="ts__table-wrap">
        <table class="ts-table">
          <thead>
            <tr>
              <th class="ts-th">Máquina</th>
              <th class="ts-th">IP Mesh</th>
              <th class="ts-th">Usuario</th>
              <th class="ts-th">SO</th>
              <th class="ts-th">Estado</th>
              <th class="ts-th">Última conexión</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredPeers" :key="p.ip"
              class="ts-tr" :class="{ 'ts-tr--offline': !p.isOnline }">
              <td class="ts-td">
                <div class="machine">
                  <span class="machine__avatar" :class="p.isOnline ? 'machine__avatar--on' : 'machine__avatar--off'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </span>
                  <span class="machine__name">{{ p.hostname }}</span>
                </div>
              </td>
              <td class="ts-td"><code class="ts-ip">{{ p.ip }}</code></td>
              <td class="ts-td"><span class="ts-user">{{ p.user }}</span></td>
              <td class="ts-td"><span class="ts-os">{{ osName(p.os) }}</span></td>
              <td class="ts-td">
                <span class="status-pill" :class="p.isOnline ? 'status-pill--on' : 'status-pill--off'">
                  <span class="status-pill__dot" />
                  {{ p.isOnline ? 'En línea' : 'Desconectada' }}
                </span>
              </td>
              <td class="ts-td"><span class="ts-seen">{{ p.isOnline ? '—' : (p.lastSeen || '—') }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useVpn, formatBytes, osLabel } from '@/modules/vpn/composables/useVpn.js'
import WireguardTrafficChart from '@/modules/vpn/components/WireguardTrafficChart.vue'

const {
  status, wireguard, wgStats, tailscale, policy,
  searchQuery, statusFilter, trafficHistory,
  filteredPeers, onlineCount, offlineCount, totalPeers,
  loadAll, clearFilters,
  autoRefresh, startAutoRefresh, stopAutoRefresh, toggleAutoRefresh,
} = useVpn()

const anyLoading = computed(() =>
  status.value.loading || wireguard.value.loading || wgStats.value.loading ||
  tailscale.value.loading || policy.value.loading
)

const fmtBytes = formatBytes
const osName = osLabel

onMounted(async () => {
  await loadAll()
  startAutoRefresh()
})
onUnmounted(stopAutoRefresh)
</script>

<style scoped>
.vpn { max-width: auto; }

/* Header */
.vpn__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 20px;
}
.vpn__eyebrow {
  font-family: var(--font-mono);
  font-size: .64rem; font-weight: 700; color: var(--accent);
  letter-spacing: .12em; margin-bottom: 6px;
}
.vpn__title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--text-1); }
.vpn__sub { font-size: .8rem; color: var(--text-3); margin-top: 5px; }
.vpn__refresh {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 8px 14px; background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.vpn__refresh:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-mid); }
.vpn__refresh:disabled { opacity: .5; cursor: not-allowed; }

.vpn__head-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.vpn__auto {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 12px; background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-3);
  font-family: var(--font-mono); font-size: .7rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s, color .12s;
}
.vpn__auto:hover { background: var(--bg-hover); }
.vpn__auto-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--text-3);
}
.vpn__auto--on { color: var(--success); border-color: color-mix(in srgb, var(--success) 30%, var(--border)); }
.vpn__auto--on .vpn__auto-dot {
  background: var(--success); box-shadow: 0 0 7px var(--success);
  animation: pulse 2s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Servicios (fila superior) */
.vpn__services {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px; margin-bottom: 20px;
}
.svc-card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px;
}
.svc-card__head {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.svc-card__title { display: flex; align-items: center; gap: 8px; }
.svc-ico {
  width: 26px; height: 26px; border-radius: var(--radius-sm); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.svc-ico--gateway { background: var(--blue-muted); color: var(--blue); }
.svc-ico--wg { background: var(--accent-muted); color: var(--accent); }
.svc-ico--policy { background: var(--success-muted); color: var(--success); }

/* Badge de estado (ONLINE / ACTIVE / CONNECTED) */
.svc-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 9px; border-radius: 99px;
  font-family: var(--font-mono); font-size: .62rem; font-weight: 700;
  letter-spacing: .04em;
}
.svc-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.svc-badge--on  { background: var(--success-muted); color: var(--success); }
.svc-badge--off { background: var(--danger-muted); color: var(--danger); }
.svc-card__label {
  font-size: .68rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
}
.svc-dot { width: 9px; height: 9px; border-radius: 50%; }
.svc-dot--on  { background: var(--success); box-shadow: 0 0 7px var(--success); }
.svc-dot--off { background: var(--danger); }
.svc-card__value {
  font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
  color: var(--text-1); margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.svc-card__value--sm { font-size: .95rem; }
.svc-card__peers {
  font-family: var(--font-sans); font-size: .68rem; font-weight: 600;
  color: var(--accent); background: var(--accent-muted); padding: 2px 8px; border-radius: 99px;
}
.svc-card__loading { padding: 8px 0; }
.svc-card__err { font-size: .76rem; color: var(--danger); padding: 4px 0; }
.svc-card__rows { display: flex; flex-direction: column; gap: 7px; }
.svc-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: .76rem;
}
.svc-row span:first-child { color: var(--text-3); }
.svc-row code { font-family: var(--font-mono); font-size: .74rem; color: var(--text-1); }
.svc-row strong { color: var(--text-1); font-weight: 600; }

.pill { font-size: .68rem; font-weight: 700; padding: 2px 9px; border-radius: 99px; }
.pill--on  { background: var(--success-muted); color: var(--success); }
.pill--off { background: var(--danger-muted); color: var(--danger); }

.traffic { display: flex; gap: 8px; font-family: var(--font-mono); font-size: .72rem; }
.traffic__down { color: var(--success); }
.traffic__up { color: var(--blue); }

/* Política de acceso */
.policy-list { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.policy-item {
  display: flex; align-items: center; justify-content: space-between;
  font-size: .74rem;
}
.policy-item__net { display: flex; align-items: center; gap: 7px; color: var(--text-1); font-family: var(--font-mono); font-size: .72rem; }
.policy-ico--ok { color: var(--success); }
.policy-ico--no { color: var(--danger); }
.policy-item__state { font-size: .64rem; font-weight: 700; padding: 1px 7px; border-radius: 4px; }
.policy-item__state.is-ok { background: var(--success-muted); color: var(--success); }
.policy-item__state.is-no { background: var(--danger-muted); color: var(--danger); }

/* ── Panel de tráfico WireGuard ── */
.traffic-panel {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px; margin-bottom: 20px;
}
.traffic-panel__head { margin-bottom: 12px; }
.traffic-panel__title {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-display); font-size: .9rem; font-weight: 700; color: var(--text-1);
}
.traffic-metrics {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border);
}
.tmetric { display: flex; flex-direction: column; gap: 3px; }
.tmetric__lbl { font-family: var(--font-mono); font-size: .6rem; color: var(--text-3); letter-spacing: .05em; }
.tmetric__val { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-1); }
.tmetric__val--rx { color: var(--success); }
.tmetric__val--tx { color: var(--blue); }
.tmetric__val--err { color: var(--danger); }

/* DERP badge */
.derp-badge {
  display: inline-block; margin-left: 6px;
  font-family: var(--font-mono); font-size: .58rem; font-weight: 700;
  padding: 1px 7px; border-radius: 4px; letter-spacing: .03em;
}
.derp-badge--direct { background: var(--success-muted); color: var(--success); }
.derp-badge--relay  { background: var(--warning-muted); color: var(--warning); }

.ts__head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }

/* ── Tailscale ── */
.ts {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden;
}
.ts__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; padding: 18px; border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.ts__title-wrap { display: flex; align-items: flex-start; gap: 12px; }
.ts__icon {
  width: 36px; height: 36px; border-radius: var(--radius);
  background: var(--accent-muted); color: var(--accent);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ts__title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--text-1); }
.ts__meta { font-size: .76rem; color: var(--text-3); margin-top: 3px; }
.ts__meta code { font-family: var(--font-mono); color: var(--text-2); }
.ts-conn--on  { color: var(--success); font-weight: 600; }
.ts-conn--off { color: var(--danger); font-weight: 600; }

.ts__counts { display: flex; gap: 20px; }
.ts-count { display: flex; flex-direction: column; align-items: center; }
.ts-count__val { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--text-1); line-height: 1; }
.ts-count__val--on  { color: var(--success); }
.ts-count__val--off { color: var(--text-3); }
.ts-count__lbl { font-size: .62rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; margin-top: 3px; }

/* Toolbar */
.ts__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; padding: 14px 18px; border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.search { position: relative; flex: 1; min-width: 220px; max-width: 360px; }
.search__icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
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

.ts__filters { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 99px; color: var(--text-2);
  font-family: var(--font-sans); font-size: .74rem; font-weight: 600;
  cursor: pointer; transition: background .12s, color .12s, border-color .12s;
}
.chip:hover { background: var(--bg-hover); color: var(--text-1); }
.chip--active { background: var(--accent-muted); border-color: var(--accent); color: var(--accent); }
.chip__dot { width: 7px; height: 7px; border-radius: 50%; }
.chip__dot--on { background: var(--success); }
.chip__dot--off { background: var(--text-3); }

/* Estados */
.ts__skeleton { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.ts-row-sk { display: flex; align-items: center; gap: 12px; }
.skeleton { border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; display: inline-block; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
.ts__error {
  display: flex; align-items: center; gap: 10px; margin: 16px 18px;
  padding: 14px 16px; background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .82rem; color: var(--danger);
}
.ts__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; text-align: center; color: var(--text-3); font-size: .85rem;
}
.ts__empty svg { opacity: .4; }
.link-btn { background: none; border: none; cursor: pointer; color: var(--accent); font-size: .76rem; font-weight: 600; padding: 0; }
.link-btn:hover { text-decoration: underline; }

/* Tabla */
.ts__table-wrap { overflow-x: auto; }
.ts-table { width: 100%; border-collapse: collapse; }
.ts-th {
  text-align: left; padding: 11px 18px;
  font-size: .66rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--bg-2);
}
.ts-tr { transition: background .1s; }
.ts-tr:hover { background: var(--bg-2); }
.ts-tr--offline { opacity: .62; }
.ts-td { padding: 11px 18px; font-size: .82rem; color: var(--text-1); border-bottom: 1px solid var(--border); }
.ts-table tbody tr:last-child .ts-td { border-bottom: none; }

.machine { display: flex; align-items: center; gap: 10px; }
.machine__avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.machine__avatar--on  { background: var(--success-muted); color: var(--success); }
.machine__avatar--off { background: var(--bg-3); color: var(--text-3); }
.machine__name { font-weight: 600; color: var(--text-1); white-space: nowrap; }

.ts-ip { font-family: var(--font-mono); font-size: .78rem; color: var(--text-1); background: var(--bg-2); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
.ts-user { font-size: .78rem; color: var(--text-2); }
.ts-os { font-size: .76rem; color: var(--text-2); }
.ts-seen { font-size: .76rem; color: var(--text-3); }

.status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 99px; font-size: .72rem; font-weight: 600;
}
.status-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-pill--on  { background: var(--success-muted); color: var(--success); }
.status-pill--off { background: var(--bg-3); color: var(--text-3); }

@media (max-width: 720px) {
  .vpn__head { flex-direction: column; }
  .ts__head { flex-direction: column; }
  .ts__counts { width: 100%; justify-content: space-around; }
}
</style>