<template>
  <div class="inventory">

    <!-- Header -->
    <div class="inventory__head">
      <div>
        <h1 class="inventory__title">Inventario y documentación</h1>
        <p class="inventory__sub">
          {{ activeTab === 'regions' ? 'Regiones registradas en NetBox' : 'Direcciones IP registradas en NetBox' }}
        </p>
      </div>
      <div class="inventory__head-actions">
        <button
          v-if="activeTab === 'regions'"
          class="inventory__refresh"
          :class="{ 'inventory__refresh--loading': loading }"
          :disabled="loading"
          @click="fetchRegions"
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
        <button
          v-if="activeTab === 'regions'"
          class="inventory__add"
          @click="openCreate"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva región
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="inventory__tabs">
      <button
        class="inv-tab"
        :class="{ 'inv-tab--active': activeTab === 'regions' }"
        @click="activeTab = 'regions'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        Regiones
      </button>
      <button
        class="inv-tab"
        :class="{ 'inv-tab--active': activeTab === 'ips' }"
        @click="activeTab = 'ips'"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        Direcciones IP
      </button>
    </div>

    <!-- ─────────── Pestaña: Direcciones IP ─────────── -->
    <IpAddressesPanel v-if="activeTab === 'ips'" />

    <!-- ─────────── Pestaña: Regiones ─────────── -->
    <template v-else>
    <!-- Stats -->
    <div class="inventory__stats">
      <div class="stat-chip">
        <span class="stat-chip__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </span>
        <div>
          <div class="stat-chip__value">{{ totalRegions }}</div>
          <div class="stat-chip__label">Regiones</div>
        </div>
      </div>
      <div class="stat-chip">
        <span class="stat-chip__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </span>
        <div>
          <div class="stat-chip__value">{{ totalSites }}</div>
          <div class="stat-chip__label">Sitios totales</div>
        </div>
      </div>
    </div>

    <!-- Card -->
    <div class="inventory__card">

      <!-- Toolbar -->
      <div class="inventory__toolbar">
        <div class="search">
          <svg class="search__icon" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQuery" type="text" class="search__input" placeholder="Buscar región..." />
          <button v-if="searchQuery" class="search__clear" @click="clearSearch">✕</button>
        </div>
        <span class="inventory__count">{{ filteredRegions.length }} de {{ totalRegions }} regiones</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="inventory__error">
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
              <th class="table__th table__th--sortable" @click="setSort('name')">
                Región
                <SortIcon :active="sortKey === 'name'" :dir="sortDir" />
              </th>
              <th class="table__th table__th--sortable" @click="setSort('slug')">
                Slug
                <SortIcon :active="sortKey === 'slug'" :dir="sortDir" />
              </th>
              <th class="table__th table__th--center table__th--sortable" @click="setSort('siteCount')">
                Sitios
                <SortIcon :active="sortKey === 'siteCount'" :dir="sortDir" />
              </th>
              <th class="table__th">Descripción</th>
              <th class="table__th table__th--right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton -->
            <template v-if="loading && !hasData">
              <tr v-for="i in 4" :key="`sk-${i}`">
                <td class="table__td"><div class="skeleton" style="width:60%"/></td>
                <td class="table__td table__td--center"><div class="skeleton" style="width:30px;margin:0 auto"/></td>
                <td class="table__td"><div class="skeleton" style="width:80%"/></td>
                <td class="table__td"><div class="skeleton" style="width:50px;margin-left:auto"/></td>
              </tr>
            </template>

            <!-- Filas -->
            <template v-else-if="hasResults">
              <tr v-for="region in filteredRegions" :key="region.id ?? region.name" class="table__row">
                <td class="table__td">
                  <div class="region-cell">
                    <span class="region-cell__icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </span>
                    <span class="region-cell__name">{{ region.name }}</span>
                  </div>
                </td>
                <!-- En el <tbody>, dentro del v-for, después de la celda del nombre -->
                <td class="table__td">
                  <code class="slug-cell">{{ region.slug }}</code>
                </td>
                <td class="table__td table__td--center">
                  <span class="site-badge">{{ region.siteCount }}</span>
                </td>
                <td class="table__td">
                  <span v-if="region.description" class="table__desc">{{ region.description }}</span>
                  <span v-else class="table__empty">—</span>
                </td>
                <td class="table__td table__td--right">
                  <div class="row-actions">
                    <button class="row-action" title="Editar" @click="openEdit(region)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="row-action row-action--danger" title="Eliminar" @click="confirmDelete(region)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Sin resultados de búsqueda -->
            <template v-else-if="hasData && !hasResults">
              <tr>
                <td colspan="5" class="table__no-results">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>No se encontraron regiones para "<strong>{{ searchQuery }}</strong>"</span>
                  <button class="table__clear-btn" @click="clearSearch">Limpiar búsqueda</button>
                </td>
              </tr>
            </template>

            <!-- Sin datos -->
            <template v-else>
              <tr>
                <td colspan="5" class="table__no-results">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>No hay regiones registradas</span>
                  <button class="table__clear-btn" @click="openCreate">Crear la primera región</button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <RegionFormModal
      :mode="modalMode"
      :form="form"
      :errors="formErrors"
      :saving="saving"
      @close="closeModal"
      @save="saveRegion"
      @name-input="onNameInput"
      @slug-input="onSlugInput"
      @update-field="updateField"
    />

    <!-- Modal eliminar -->
    <DeleteConfirmModal
      :target="deleteTarget"
      :deleting="deleting"
      @cancel="cancelDelete"
      @confirm="deleteRegion"
    />
    </template>

  </div>
</template>

<script setup>
import { onMounted, ref, h } from 'vue'
import { useInventory } from '@/modules/inventory/composables/useInventory.js'
import RegionFormModal   from '@/modules/inventory/components/RegionFormModal.vue'
import DeleteConfirmModal from '@/modules/inventory/components/DeleteConfirmModal.vue'
import IpAddressesPanel  from '@/modules/inventory/components/IpAddressesPanel.vue'

// Pestaña activa: 'regions' | 'ips'
const activeTab = ref('regions')

// Ícono de orden inline
const SortIcon = {
  props: { active: Boolean, dir: String },
  setup(props) {
    return () => h('svg', {
      width: 11, height: 11, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': 2.5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      style: {
        opacity: props.active ? 1 : .3, marginLeft: '4px', verticalAlign: 'middle',
        transform: props.active && props.dir === 'desc' ? 'rotate(180deg)' : 'none',
        transition: 'transform .15s, opacity .15s',
      },
    }, [h('polyline', { points: '18 15 12 9 6 15' })])
  },
}

const {
  searchQuery, sortKey, sortDir,
  filteredRegions, totalRegions, totalSites,
  loading, error, hasResults, hasData,
  fetchRegions, setSort, clearSearch,
  modalMode, form, formErrors, saving,
  openCreate, openEdit, closeModal,
  onNameInput, onSlugInput, saveRegion,
  deleteTarget, deleting, confirmDelete, cancelDelete, deleteRegion,
} = useInventory()

// El modal emite update-field para mantener el form sincronizado
function updateField({ key, value }) {
  form[key] = value
}

onMounted(fetchRegions)
</script>

<style scoped>
.inventory { max-width: 1700px; }

.inventory__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 18px;
}
.inventory__title {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1);
}
.inventory__sub { font-size: .8rem; color: var(--text-3); margin-top: 4px; }
.inventory__head-actions { display: flex; gap: 10px; }

.inventory__refresh, .inventory__add {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.inventory__refresh {
  background: var(--bg-1); border: 1px solid var(--border); color: var(--text-1);
}
.inventory__refresh:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-mid); }
.inventory__refresh:disabled { opacity: .5; cursor: not-allowed; }
.inventory__add {
  background: var(--accent); border: 1px solid var(--accent); color: #fff;
}
.inventory__add:hover { background: var(--accent-dim); border-color: var(--accent-dim); }

.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Tabs */
.inventory__tabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.inv-tab {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; margin-bottom: -1px;
  background: none; border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-3); cursor: pointer;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 600;
  transition: color .12s, border-color .12s;
}
.inv-tab:hover { color: var(--text-1); }
.inv-tab--active { color: var(--accent); border-bottom-color: var(--accent); }

/* Stats */
.inventory__stats { display: flex; gap: 12px; margin-bottom: 16px; }
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
.stat-chip__value {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1); line-height: 1;
}
.stat-chip__label { font-size: .72rem; color: var(--text-3); margin-top: 3px; }

/* Card */
.inventory__card {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card); overflow: hidden;
}
.inventory__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.search { position: relative; flex: 1; max-width: 320px; }
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
.inventory__count { font-size: .72rem; color: var(--text-3); white-space: nowrap; }

.inventory__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; margin: 14px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .8rem; color: var(--danger);
}

/* Tabla */
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
.table__th {
  text-align: left; padding: 10px 16px;
  font-size: .68rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em;
  border-bottom: 1px solid var(--border); white-space: nowrap;
}
.table__th--center { text-align: center; }
.table__th--right { text-align: right; }
.table__th--sortable { cursor: pointer; user-select: none; transition: color .12s; }
.table__th--sortable:hover { color: var(--text-1); }

.table__row { transition: background .1s; }
.table__row:hover { background: var(--bg-2); }
.table__td {
  padding: 12px 16px; font-size: .85rem; color: var(--text-1);
  border-bottom: 1px solid var(--border);
}
.table__td--center { text-align: center; }
.table__td--right { text-align: right; }
.table tbody tr:last-child .table__td { border-bottom: none; }

.region-cell { display: flex; align-items: center; gap: 9px; }
.region-cell__icon {
  width: 26px; height: 26px; border-radius: var(--radius-sm);
  background: var(--accent-muted); color: var(--accent);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.region-cell__name { font-weight: 600; }

.slug-cell {
  font-family: var(--font-mono);
  font-size: .76rem;
  color: var(--text-2);
  background: var(--bg-2);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.site-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; padding: 2px 8px;
  background: var(--bg-3); border-radius: 99px;
  font-family: var(--font-mono); font-size: .78rem; font-weight: 600; color: var(--text-1);
}
.table__desc { color: var(--text-2); }
.table__empty { color: var(--text-3); }

/* Row actions */
.row-actions { display: flex; gap: 6px; justify-content: flex-end; }
.row-action {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-2);
  cursor: pointer; transition: background .12s, color .12s, border-color .12s;
}
.row-action:hover { background: var(--bg-hover); color: var(--text-1); border-color: var(--border-mid); }
.row-action--danger:hover {
  background: var(--danger-muted); color: var(--danger); border-color: var(--danger);
}

.table__no-results { padding: 48px 20px; text-align: center; color: var(--text-3); font-size: .85rem; }
.table__no-results svg { display: block; margin: 0 auto 12px; opacity: .5; }
.table__clear-btn {
  display: block; margin: 12px auto 0; padding: 6px 14px;
  background: var(--accent); border: none; border-radius: var(--radius);
  color: #fff; font-family: var(--font-sans); font-size: .76rem; font-weight: 500;
  cursor: pointer; transition: background .12s;
}
.table__clear-btn:hover { background: var(--accent-dim); }

.skeleton { height: 12px; border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

@media (max-width: 640px) {
  .inventory__head { flex-direction: column; gap: 12px; }
  .inventory__toolbar { flex-direction: column; align-items: stretch; }
  .search { max-width: none; }
}
</style>
