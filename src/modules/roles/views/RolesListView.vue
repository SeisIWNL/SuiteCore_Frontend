<template>
  <div class="roles">

    <!-- Header -->
    <div class="roles__head">
      <div>
        <div class="roles__eyebrow">RBAC · DIRECTORIO LDAP</div>
        <h1 class="roles__title">Gestión de roles</h1>
        <p class="roles__sub">
          Configura los módulos del dashboard que cada rol del directorio puede visualizar.
        </p>
      </div>
      <button
        class="roles__refresh"
        :class="{ 'roles__refresh--loading': loading }"
        :disabled="loading"
        @click="fetchRoles"
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

    <!-- Métricas -->
    <div class="roles__stats">
      <div class="rstat rstat--accent">
        <div class="rstat__body">
          <div class="rstat__label">Roles gestionados</div>
          <div class="rstat__value">{{ totalRoles }}</div>
        </div>
        <span class="rstat__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </span>
      </div>
      <div class="rstat rstat--blue">
        <div class="rstat__body">
          <div class="rstat__label">Asignaciones activas</div>
          <div class="rstat__value">
            {{ totalAssignments }}
            <span class="rstat__hint">· {{ uniqueUsers }} usuarios únicos</span>
          </div>
        </div>
        <span class="rstat__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
      </div>
      <div class="rstat rstat--success">
        <div class="rstat__body">
          <div class="rstat__label">Estado de sincronización</div>
          <div class="rstat__value rstat__value--sm">
            <span class="rstat__dot" /> {{ error ? 'Error' : 'OK' }}
          </div>
        </div>
        <span class="rstat__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="roles__toolbar">
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
          placeholder="Buscar rol o usuario..."
        />
        <button v-if="searchQuery" class="search__clear" @click="clearSearch">✕</button>
      </div>
      <span class="roles__count">{{ filteredRoles.length }} de {{ totalRoles }}</span>
    </div>

    <!-- Error -->
    <div v-if="error" class="roles__error">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Skeleton -->
    <div v-else-if="loading && !hasData" class="roles__list">
      <div v-for="i in 4" :key="`sk-${i}`" class="rcard">
        <div class="rcard__main">
          <div class="skeleton" style="width:38px;height:38px;border-radius:8px"/>
          <div style="flex:1">
            <div class="skeleton" style="width:30%;height:14px"/>
            <div class="skeleton" style="width:60%;height:11px;margin-top:7px"/>
          </div>
          <div class="skeleton" style="width:70px;height:32px;border-radius:6px"/>
        </div>
      </div>
    </div>

    <!-- Sin resultados -->
    <div v-else-if="hasData && !hasResults" class="roles__empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span>No se encontraron roles para "<strong>{{ searchQuery }}</strong>"</span>
      <button class="link-btn" @click="clearSearch">Limpiar búsqueda</button>
    </div>

    <!-- Sin datos -->
    <div v-else-if="!hasData" class="roles__empty">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span>No hay roles registrados en el directorio</span>
    </div>

    <!-- Lista de roles -->
    <div v-else class="roles__list">
      <div
        v-for="role in filteredRoles"
        :key="role.id"
        class="rcard"
        :class="{ 'rcard--open': isExpanded(role.id) }"
      >
        <!-- Fila principal -->
        <div class="rcard__main">
          <span class="rcard__icon" :class="`rcard__icon--${roleVisual(role).tone}`">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </span>

          <div class="rcard__info">
            <div class="rcard__title-row">
              <span class="rcard__name">{{ role.name }}</span>
              <span class="rcard__badge" :class="`rcard__badge--${roleVisual(role).tone}`">
                {{ roleVisual(role).label }}
              </span>
              <code class="rcard__gid">gid {{ role.id }}</code>
            </div>
            <p class="rcard__desc">
              {{ role.description || 'Sin descripción asignada en el directorio.' }}
            </p>
          </div>

          <div class="rcard__users">
            <div class="rcard__users-label">Usuarios</div>
            <div class="rcard__users-count">{{ role.totalUsers ?? 0 }}</div>
          </div>

          <div class="rcard__actions">
            <button class="btn btn--primary btn--sm" @click="editRole(role)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <button
              class="rcard__chevron"
              :class="{ 'rcard__chevron--open': isExpanded(role.id) }"
              :disabled="!role.users?.length"
              :title="role.users?.length ? 'Ver usuarios' : 'Sin usuarios'"
              @click="toggleExpand(role.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Panel desplegable de usuarios -->
        <Transition name="expand">
          <div v-if="isExpanded(role.id)" class="rcard__panel">
            <div class="rcard__panel-head">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Usuarios con este rol
              <span class="rcard__panel-count">{{ role.users?.length ?? 0 }}</span>
            </div>
            <ul class="ulist">
              <li v-for="u in role.users" :key="u.username" class="uitem">
                <span class="uitem__avatar">{{ initials(u) }}</span>
                <div class="uitem__info">
                  <span class="uitem__name">{{ fullName(u) }}</span>
                  <code class="uitem__user">{{ u.username }}</code>
                </div>
                <span v-if="u.department" class="uitem__dept">{{ u.department }}</span>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoles, roleVisual } from '@/modules/roles/composables/useRoles.js'

const router = useRouter()

const {
  searchQuery, filteredRoles,
  totalRoles, totalAssignments, uniqueUsers,
  loading, error, hasData, hasResults,
  fetchRoles, toggleExpand, isExpanded, clearSearch,
} = useRoles()

function fullName(u) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
}
function initials(u) {
  const a = u.firstName?.[0] ?? ''
  const b = u.lastName?.[0] ?? ''
  return (a + b).toUpperCase() || u.username?.slice(0, 2).toUpperCase() || '··'
}
function editRole(role) {
  router.push({
    name: 'role-permissions',
    params: { gidNumber: role.id },
    query: { name: role.name },
  })
}

onMounted(fetchRoles)
</script>

<style scoped>
.roles { max-width: 1100px; }

/* Header */
.roles__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 20px;
}
.roles__eyebrow {
  font-family: var(--font-mono);
  font-size: .64rem; font-weight: 700; color: var(--accent);
  letter-spacing: .12em; margin-bottom: 6px;
}
.roles__title {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700; color: var(--text-1);
}
.roles__sub { font-size: .8rem; color: var(--text-3); margin-top: 5px; max-width: 520px; }
.roles__refresh {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 8px 14px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 600;
  cursor: pointer; transition: background .12s, border-color .12s;
}
.roles__refresh:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--border-mid); }
.roles__refresh:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Métricas */
.roles__stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px; margin-bottom: 18px;
}
.rstat {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px;
  position: relative; overflow: hidden;
}
.rstat::before {
  content: ''; position: absolute; left: 0; top: 0; width: 3px; height: 100%;
}
.rstat--accent::before  { background: var(--accent); }
.rstat--blue::before    { background: var(--blue); }
.rstat--success::before { background: var(--success); }
.rstat__label {
  font-size: .66rem; color: var(--text-3); font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em;
}
.rstat__value {
  font-family: var(--font-display);
  font-size: 1.6rem; font-weight: 700; color: var(--text-1);
  margin-top: 5px; line-height: 1; display: flex; align-items: baseline; gap: 8px;
}
.rstat__value--sm { font-size: 1.1rem; align-items: center; }
.rstat__hint { font-family: var(--font-sans); font-size: .68rem; font-weight: 500; color: var(--text-3); }
.rstat__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 8px var(--success);
}
.rstat__icon { color: var(--text-3); opacity: .5; }

/* Toolbar */
.roles__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px; margin-bottom: 12px;
}
.search { position: relative; flex: 1; max-width: 340px; }
.search__icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--text-3); pointer-events: none;
}
.search__input {
  width: 100%; height: 36px; padding: 0 32px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-1);
  font-family: var(--font-sans); font-size: .82rem; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.search__input::placeholder { color: var(--text-3); }
.search__input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.search__clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; background: var(--bg-3); border: none; border-radius: 50%;
  color: var(--text-2); cursor: pointer; font-size: .65rem;
  display: flex; align-items: center; justify-content: center;
}
.search__clear:hover { background: var(--border-mid); color: var(--text-1); }
.roles__count { font-size: .72rem; color: var(--text-3); white-space: nowrap; }

/* Error / vacío */
.roles__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .82rem; color: var(--danger);
}
.roles__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 56px 20px; text-align: center;
  color: var(--text-3); font-size: .85rem;
  background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius-lg);
}
.roles__empty svg { opacity: .4; }
.link-btn {
  background: none; border: none; cursor: pointer;
  color: var(--accent); font-family: var(--font-sans);
  font-size: .76rem; font-weight: 600; padding: 0;
}
.link-btn:hover { text-decoration: underline; }

/* Lista */
.roles__list { display: flex; flex-direction: column; gap: 10px; }

/* Tarjeta de rol */
.rcard {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
  transition: border-color .12s, box-shadow .12s;
}
.rcard:hover { border-color: var(--border-mid); box-shadow: var(--shadow-card); }
.rcard--open { border-color: var(--accent); }

.rcard__main {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
}
.rcard__icon {
  width: 38px; height: 38px; border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: var(--bg-3); color: var(--text-2);
}
.rcard__icon--critical { background: var(--danger-muted);  color: var(--danger); }
.rcard__icon--security { background: var(--warning-muted); color: var(--warning); }
.rcard__icon--audit    { background: var(--blue-muted);    color: var(--blue); }
.rcard__icon--operator { background: var(--accent-muted);  color: var(--accent); }
.rcard__icon--base     { background: var(--success-muted); color: var(--success); }

.rcard__info { flex: 1; min-width: 0; }
.rcard__title-row { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.rcard__name {
  font-family: var(--font-display);
  font-size: .95rem; font-weight: 700; color: var(--text-1);
}
.rcard__badge {
  font-family: var(--font-mono);
  font-size: .6rem; font-weight: 700; letter-spacing: .04em;
  padding: 2px 8px; border-radius: 4px;
  text-transform: uppercase;
  background: var(--bg-3); color: var(--text-2);
}
.rcard__badge--critical { background: var(--danger-muted);  color: var(--danger); }
.rcard__badge--security { background: var(--warning-muted); color: var(--warning); }
.rcard__badge--audit    { background: var(--blue-muted);    color: var(--blue); }
.rcard__badge--operator { background: var(--accent-muted);  color: var(--accent); }
.rcard__badge--base     { background: var(--success-muted); color: var(--success); }
.rcard__gid {
  font-family: var(--font-mono); font-size: .66rem; color: var(--text-3);
}
.rcard__desc {
  font-size: .76rem; color: var(--text-3); margin-top: 4px;
  line-height: 1.45; max-width: 460px;
}

.rcard__users { text-align: right; flex-shrink: 0; }
.rcard__users-label {
  font-size: .62rem; color: var(--text-3); font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em;
}
.rcard__users-count {
  font-family: var(--font-display);
  font-size: 1.25rem; font-weight: 700; color: var(--accent); line-height: 1.1;
}

.rcard__actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.rcard__chevron {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-2);
  cursor: pointer; transition: background .12s, color .12s, transform .18s;
}
.rcard__chevron:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-1); }
.rcard__chevron:disabled { opacity: .35; cursor: not-allowed; }
.rcard__chevron--open { transform: rotate(180deg); background: var(--accent-muted); color: var(--accent); border-color: var(--accent); }

/* Panel usuarios */
.rcard__panel {
  border-top: 1px solid var(--border);
  background: var(--bg-2);
  padding: 14px 18px 16px;
}
.rcard__panel-head {
  display: flex; align-items: center; gap: 7px;
  font-size: .68rem; font-weight: 700; color: var(--text-2);
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: 12px;
}
.rcard__panel-count {
  background: var(--accent-muted); color: var(--accent);
  font-size: .64rem; padding: 1px 7px; border-radius: 99px;
}
.ulist {
  list-style: none; margin: 0; padding: 0;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;
}
.uitem {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius);
}
.uitem__avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-muted); color: var(--accent);
  font-size: .68rem; font-weight: 700;
}
.uitem__info { min-width: 0; display: flex; flex-direction: column; }
.uitem__name {
  font-size: .8rem; font-weight: 600; color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.uitem__user { font-family: var(--font-mono); font-size: .68rem; color: var(--text-3); }
.uitem__dept {
  margin-left: auto; font-size: .66rem; color: var(--text-3);
  background: var(--bg-3); padding: 2px 7px; border-radius: 4px; white-space: nowrap;
}

/* Botones */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 14px;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .8rem; font-weight: 600;
  border: 1px solid transparent; transition: background .12s, border-color .12s;
}
.btn--sm { height: 32px; padding: 0 12px; font-size: .76rem; }
.btn--primary { background: var(--accent); color: #fff; }
.btn--primary:hover { background: var(--accent-dim); }

/* Skeleton */
.skeleton { border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

/* Transición desplegable */
.expand-enter-active, .expand-leave-active { transition: opacity .18s ease, transform .18s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 720px) {
  .roles__head { flex-direction: column; }
  .rcard__main { flex-wrap: wrap; }
  .rcard__users { order: 3; }
  .ulist { grid-template-columns: 1fr; }
}
</style>
