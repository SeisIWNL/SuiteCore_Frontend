<template>
  <div class="ipp">

    <!-- Stats -->
    <div class="ipp__stats">
      <div class="stat-chip">
        <span class="stat-chip__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
            <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
          </svg>
        </span>
        <div>
          <div class="stat-chip__value">{{ totalIps }}</div>
          <div class="stat-chip__label">Direcciones IP</div>
        </div>
      </div>
      <div class="stat-chip">
        <span class="stat-chip__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/>
            <rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/>
            <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </span>
        <div>
          <div class="stat-chip__value">{{ totalSubnets }}</div>
          <div class="stat-chip__label">Subredes</div>
        </div>
      </div>
      <div class="stat-chip">
        <span class="stat-chip__icon stat-chip__icon--ok">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </span>
        <div>
          <div class="stat-chip__value">{{ activeIps }}</div>
          <div class="stat-chip__label">Activas</div>
        </div>
      </div>
    </div>

    <!-- Card -->
    <div class="ipp__card">

      <!-- Toolbar -->
      <div class="ipp__toolbar">
        <div class="search">
          <svg class="search__icon" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQuery" type="text" class="search__input"
            placeholder="Buscar IP, DNS o descripción..." />
          <button v-if="searchQuery" class="search__clear" @click="searchQuery = ''">✕</button>
        </div>

        <!-- Filtro de estado -->
        <div class="ipp__filters">
          <button
            class="chip-filter"
            :class="{ 'chip-filter--active': statusFilter === 'all' }"
            @click="statusFilter = 'all'"
          >Todos</button>
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            class="chip-filter"
            :class="{ 'chip-filter--active': statusFilter === opt.value }"
            @click="statusFilter = opt.value"
          >
            <span class="chip-filter__dot" :class="`chip-filter__dot--${opt.value}`" />
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Sub-toolbar: contador + expandir/colapsar -->
      <div class="ipp__subbar">
        <span class="ipp__count">{{ filteredIps.length }} de {{ totalIps }} direcciones</span>
        <div class="ipp__group-actions">
          <button class="link-btn" @click="expandAll">Expandir todo</button>
          <span class="ipp__sep">·</span>
          <button class="link-btn" @click="collapseAll">Colapsar todo</button>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="ipp__error">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Skeleton -->
      <div v-else-if="loading && !hasData" class="ipp__skeleton">
        <div v-for="i in 3" :key="`sg-${i}`" class="ipp__skel-group">
          <div class="skeleton" style="width:160px;height:16px" />
          <div class="skeleton" style="width:100%;height:40px;margin-top:8px" />
          <div class="skeleton" style="width:100%;height:40px;margin-top:6px" />
        </div>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="hasData && !hasResults" class="ipp__empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>No se encontraron direcciones IP con esos criterios</span>
        <button class="table__clear-btn" @click="clearFilters">Limpiar filtros</button>
      </div>

      <!-- Sin datos -->
      <div v-else-if="!hasData" class="ipp__empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
        </svg>
        <span>No hay direcciones IP registradas</span>
      </div>

      <!-- Grupos por subred -->
      <div v-else class="ipp__groups">
        <div v-for="group in groupedIps" :key="group.subnet" class="subnet">
          <button class="subnet__header" @click="toggleSubnet(group.subnet)">
            <svg class="subnet__chevron"
              :class="{ 'subnet__chevron--open': !isCollapsed(group.subnet) }"
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span class="subnet__icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/>
                <rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/>
                <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </span>
            <code class="subnet__cidr">{{ group.subnet }}</code>
            <span class="subnet__badge">{{ group.items.length }}</span>
          </button>

          <Transition name="subnet-expand">
            <div v-if="!isCollapsed(group.subnet)" class="subnet__body">
              <table class="table">
                <thead>
                  <tr>
                    <th class="table__th">Dirección</th>
                    <th class="table__th">Estado</th>
                    <th class="table__th">DNS</th>
                    <th class="table__th">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ip in group.items" :key="ip.id" class="table__row">
                    <td class="table__td">
                      <code class="ip-cell">{{ ip.address }}</code>
                    </td>
                    <td class="table__td">
                      <span class="status-pill" :class="`status-pill--${ip.status?.value}`">
                        <span class="status-pill__dot" />
                        {{ ip.status?.label ?? '—' }}
                      </span>
                    </td>
                    <td class="table__td">
                      <span v-if="ip.dnsName" class="table__desc">{{ ip.dnsName }}</span>
                      <span v-else class="table__empty">—</span>
                    </td>
                    <td class="table__td">
                      <span v-if="ip.description" class="table__desc">{{ ip.description }}</span>
                      <span v-else class="table__empty">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Transition>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useIpAddresses } from '@/modules/inventory/composables/useIpAddresses.js'

const {
  error, loading,
  searchQuery, statusFilter, statusOptions,
  filteredIps, groupedIps,
  totalIps, totalSubnets, activeIps, hasData, hasResults,
  fetchIpAddresses,
  toggleSubnet, isCollapsed, expandAll, collapseAll, clearFilters,
} = useIpAddresses()

onMounted(() => fetchIpAddresses())
</script>

<style scoped>
/* Stats */
.ipp__stats { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.stat-chip {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 12px 18px; min-width: 150px;
}
.stat-chip__icon {
  width: 38px; height: 38px; border-radius: var(--radius);
  background: var(--accent-muted); color: var(--accent);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-chip__icon--ok { background: var(--success-muted); color: var(--success); }
.stat-chip__value {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1); line-height: 1;
}
.stat-chip__label { font-size: .72rem; color: var(--text-3); margin-top: 3px; }

/* Card */
.ipp__card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden;
}
.ipp__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.search { position: relative; flex: 1; min-width: 220px; max-width: 340px; }
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
  transition: background .12s, color .12s;
}
.search__clear:hover { background: var(--border-mid); color: var(--text-1); }

/* Filtros de estado */
.ipp__filters { display: flex; gap: 6px; flex-wrap: wrap; }
.chip-filter {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 99px; color: var(--text-2);
  font-family: var(--font-sans); font-size: .74rem; font-weight: 600;
  cursor: pointer; transition: background .12s, color .12s, border-color .12s;
}
.chip-filter:hover { background: var(--bg-hover); color: var(--text-1); }
.chip-filter--active {
  background: var(--accent-muted); border-color: var(--accent); color: var(--accent);
}
.chip-filter__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-3); }
.chip-filter__dot--active    { background: var(--success); }
.chip-filter__dot--reserved  { background: var(--warning); }
.chip-filter__dot--deprecated { background: var(--danger); }
.chip-filter__dot--dhcp      { background: var(--accent); }

/* Sub-toolbar */
.ipp__subbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; border-bottom: 1px solid var(--border);
  background: var(--bg-2);
}
.ipp__count { font-size: .72rem; color: var(--text-3); }
.ipp__group-actions { display: flex; align-items: center; gap: 8px; }
.ipp__sep { color: var(--text-3); font-size: .72rem; }
.link-btn {
  background: none; border: none; cursor: pointer;
  color: var(--accent); font-family: var(--font-sans);
  font-size: .72rem; font-weight: 600; padding: 0;
  transition: color .12s;
}
.link-btn:hover { color: var(--accent-dim); text-decoration: underline; }

/* Error / vacío */
.ipp__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; margin: 14px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .8rem; color: var(--danger);
}
.ipp__empty { padding: 48px 20px; text-align: center; color: var(--text-3); font-size: .85rem; }
.ipp__empty svg { display: block; margin: 0 auto 12px; opacity: .5; }
.table__clear-btn {
  display: block; margin: 12px auto 0; padding: 6px 14px;
  background: var(--accent); border: none; border-radius: var(--radius);
  color: #fff; font-family: var(--font-sans); font-size: .76rem; font-weight: 500;
  cursor: pointer; transition: background .12s;
}
.table__clear-btn:hover { background: var(--accent-dim); }

/* Skeleton */
.ipp__skeleton { padding: 16px; }
.ipp__skel-group { margin-bottom: 20px; }
.skeleton { border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

/* Subredes (acordeón) */
.ipp__groups { padding: 6px; display: flex; flex-direction: column; gap: 4px; }
.subnet {
  border: 1px solid var(--border); border-radius: var(--radius);
  overflow: hidden; background: var(--bg-1);
}
.subnet__header {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 14px; background: var(--bg-2); border: none; cursor: pointer;
  transition: background .12s;
}
.subnet__header:hover { background: var(--bg-hover); }
.subnet__chevron { color: var(--text-3); transition: transform .18s; flex-shrink: 0; }
.subnet__chevron--open { transform: rotate(90deg); }
.subnet__icon {
  width: 24px; height: 24px; border-radius: var(--radius-sm);
  background: var(--accent-muted); color: var(--accent);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.subnet__cidr {
  font-family: var(--font-mono); font-size: .82rem; font-weight: 600;
  color: var(--text-1); flex: 1; text-align: left;
}
.subnet__badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 24px; padding: 2px 8px;
  background: var(--bg-3); border-radius: 99px;
  font-family: var(--font-mono); font-size: .74rem; font-weight: 600; color: var(--text-2);
}

.subnet__body { overflow: hidden; }

/* Tabla interna */
.table { width: 100%; border-collapse: collapse; }
.table__th {
  text-align: left; padding: 9px 16px;
  font-size: .66rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border); white-space: nowrap;
  background: var(--bg-1);
}
.table__row { transition: background .1s; }
.table__row:hover { background: var(--bg-2); }
.table__td {
  padding: 10px 16px; font-size: .83rem; color: var(--text-1);
  border-bottom: 1px solid var(--border);
}
.table tbody tr:last-child .table__td { border-bottom: none; }
.table__desc { color: var(--text-2); }
.table__empty { color: var(--text-3); }

.ip-cell {
  font-family: var(--font-mono); font-size: .8rem; color: var(--text-1);
  background: var(--bg-2); padding: 2px 8px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
}

/* Status pills */
.status-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 99px;
  font-size: .72rem; font-weight: 600;
  background: var(--bg-3); color: var(--text-2);
}
.status-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.status-pill--active     { background: var(--success-muted); color: var(--success); }
.status-pill--reserved   { background: var(--warning-muted); color: var(--warning); }
.status-pill--deprecated { background: var(--danger-muted);  color: var(--danger); }
.status-pill--dhcp       { background: var(--accent-muted);  color: var(--accent); }

/* Transición acordeón */
.subnet-expand-enter-active { transition: opacity .18s, transform .18s; }
.subnet-expand-leave-active { transition: opacity .12s, transform .12s; }
.subnet-expand-enter-from, .subnet-expand-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 640px) {
  .ipp__toolbar { flex-direction: column; align-items: stretch; }
  .search { max-width: none; }
}
</style>
