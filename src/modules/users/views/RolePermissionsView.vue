<template>
  <div class="perms">

    <!-- Back -->
    <button class="perms__back" @click="goBack">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Volver a roles
    </button>

    <!-- Header -->
    <div class="perms__head">
      <div>
        <div class="perms__eyebrow">EDITAR PERMISOS · {{ roleLabel }}</div>
        <h1 class="perms__title">{{ roleLabel }}</h1>
        <p class="perms__meta">
          <code class="perms__gid">gid {{ gidNumber }}</code>
          <span class="perms__meta-sep">·</span>
          Define qué módulos del dashboard puede ver este rol.
          Los cambios se aplican a todos los usuarios asignados.
        </p>
      </div>
      <div class="perms__actions">
        <button
          class="btn btn--ghost"
          :disabled="!hasChanges || saving"
          @click="resetChanges"
        >
          Descartar
        </button>
        <button
          class="btn btn--primary"
          :disabled="!hasChanges || saving"
          @click="save"
        >
          <span v-if="saving" class="btn__spinner" />
          <svg v-else-if="saved" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios' }}
        </button>
      </div>
    </div>

    <!-- Barra de estado -->
    <div class="perms__status">
      <div class="pstat">
        <span class="pstat__label">Módulos visibles</span>
        <span class="pstat__value">{{ totalSelected }} <span class="pstat__total">/ {{ totalMenus }}</span></span>
      </div>
      <div class="pstat">
        <span class="pstat__label">Cambios sin guardar</span>
        <span class="pstat__value" :class="{ 'pstat__value--warn': hasChanges }">
          {{ hasChanges ? 'Sí' : 'No' }}
        </span>
      </div>
      <div class="pstat pstat--session">
        <span class="pstat__pulse" /> Sesión activa
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="perms__error">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Skeleton -->
    <div v-else-if="loading && !hasData" class="perms__grid">
      <div v-for="i in 4" :key="`bsk-${i}`" class="pblock">
        <div class="skeleton" style="width:40%;height:14px;margin-bottom:16px"/>
        <div v-for="j in 4" :key="j" class="skeleton" style="width:100%;height:20px;margin-bottom:10px"/>
      </div>
    </div>

    <!-- Grid de bloques -->
    <div v-else class="perms__grid">
      <div v-for="block in blocks" :key="block.block" class="pblock">
        <div class="pblock__head">
          <div class="pblock__title-wrap">
            <span class="pblock__icon" v-html="iconSvg(blockVisual(block.block).icon)" />
            <span class="pblock__title">{{ block.block }}</span>
          </div>
          <code class="pblock__code">{{ blockVisual(block.block).code }}</code>
        </div>

        <!-- Toggle de bloque completo -->
        <button class="pblock__all" @click="toggleBlock(block, blockState(block) !== 'all')">
          <span class="pcheck" :class="`pcheck--${blockState(block)}`">
            <svg v-if="blockState(block) === 'all'" width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span v-else-if="blockState(block) === 'some'" class="pcheck__dash" />
          </span>
          <span class="pblock__all-label">
            {{ blockState(block) === 'all' ? 'Quitar todos' : 'Seleccionar todos' }}
          </span>
        </button>

        <!-- Menús del bloque -->
        <ul class="pmenu">
          <li
            v-for="menu in block.menus"
            :key="menu.id"
            class="pmenu__item"
            :class="{
              'pmenu__item--on':     checked[menu.id],
              'pmenu__item--locked': isLocked(menu.id),
            }"
            @click="toggle(menu.id)"
          >
            <span class="pmenu__label">{{ menu.name }}</span>
            <span v-if="isLocked(menu.id)" class="pmenu__lock" title="Siempre visible para todos los roles">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <code class="pmenu__slug">{{ menu.slug }}</code>
            <span class="pcheck" :class="{ 'pcheck--all': checked[menu.id], 'pcheck--locked': isLocked(menu.id) }">
              <svg v-if="checked[menu.id]" width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Footer informativo -->
    <div v-if="!loading && hasData" class="perms__footer">
      <div class="pfoot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <div>
          <div class="pfoot__label">Control de acceso</div>
          <div class="pfoot__value">El Dashboard principal es visible para todos los roles</div>
        </div>
      </div>
      <div class="pfoot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
        </svg>
        <div>
          <div class="pfoot__label">Verificación de integridad</div>
          <div class="pfoot__value pfoot__value--ok">Permisos sincronizados con LDAP</div>
        </div>
      </div>
      <div class="pfoot">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <div class="pfoot__label">Cambios pendientes</div>
          <div class="pfoot__value">{{ hasChanges ? 'Sin guardar' : 'Ninguno' }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRolePermissions, blockVisual } from '@/modules/users/composables/useRolePermissions.js'

const props = defineProps({
  gidNumber: { type: String, required: true },
})

const router = useRouter()

const {
  blocks, checked,
  error, loading, saving, saved,
  hasChanges, totalSelected, totalMenus, hasData,
  fetchPermissions, save,
  toggle, toggleBlock, blockState, resetChanges, isLocked,
} = useRolePermissions(props.gidNumber)

// El nombre del rol llega por query (desde la lista) o cae al gid
const roleLabel = computed(() =>
  router.currentRoute.value.query.name || `Rol ${props.gidNumber}`
)

function goBack() {
  router.push({ name: 'users' })
}

// Íconos por bloque
function iconSvg(name) {
  const stroke = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  const map = {
    grid:     `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>`,
    activity: `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
    shield:   `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    network:  `<rect x="9" y="2" width="6" height="6"/><rect x="9" y="16" width="6" height="6"/><rect x="2" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>`,
    box:      `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>`,
    file:     `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`,
    users:    `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
  }
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" ${stroke}>${map[name] ?? map.box}</svg>`
}

onMounted(fetchPermissions)
</script>

<style scoped>
.perms { max-width: 1100px; }

/* Back */
.perms__back {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  color: var(--text-2); font-family: var(--font-sans);
  font-size: .8rem; font-weight: 500; padding: 0;
  margin-bottom: 16px; transition: color .12s;
}
.perms__back:hover { color: var(--accent); }

/* Header */
.perms__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; margin-bottom: 18px;
}
.perms__eyebrow {
  font-family: var(--font-mono);
  font-size: .64rem; font-weight: 700; color: var(--accent);
  letter-spacing: .1em; margin-bottom: 6px;
  text-transform: uppercase;
}
.perms__title {
  font-family: var(--font-display);
  font-size: 1.4rem; font-weight: 700; color: var(--text-1);
}
.perms__meta {
  font-size: .76rem; color: var(--text-3); margin-top: 6px;
  max-width: 560px; line-height: 1.5;
}
.perms__gid { font-family: var(--font-mono); font-size: .7rem; color: var(--text-2); }
.perms__meta-sep { margin: 0 6px; color: var(--border-mid); }

.perms__actions { display: flex; gap: 10px; flex-shrink: 0; }

/* Status bar */
.perms__status {
  display: flex; align-items: center; gap: 0;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 16px;
}
.pstat {
  display: flex; flex-direction: column; gap: 3px;
  padding: 12px 18px; border-right: 1px solid var(--border);
}
.pstat__label {
  font-size: .62rem; color: var(--text-3); font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em;
}
.pstat__value {
  font-family: var(--font-display);
  font-size: 1.05rem; font-weight: 700; color: var(--text-1);
}
.pstat__total { color: var(--text-3); font-weight: 500; font-size: .85rem; }
.pstat__value--warn { color: var(--warning); }
.pstat--session {
  margin-left: auto; flex-direction: row; align-items: center; gap: 7px;
  border-right: none; font-family: var(--font-mono);
  font-size: .7rem; color: var(--success); font-weight: 600;
}
.pstat__pulse {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 8px var(--success);
  animation: pulse 2s ease infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

/* Error */
.perms__error {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; margin-bottom: 16px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .82rem; color: var(--danger);
}

/* Grid de bloques */
.perms__grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
}
.pblock {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px 18px;
}
.pblock__head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.pblock__title-wrap { display: flex; align-items: center; gap: 9px; }
.pblock__icon {
  width: 28px; height: 28px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-muted); color: var(--accent);
}
.pblock__title {
  font-family: var(--font-display);
  font-size: .92rem; font-weight: 700; color: var(--text-1);
  text-transform: uppercase; letter-spacing: .02em;
}
.pblock__code {
  font-family: var(--font-mono); font-size: .62rem; color: var(--text-3);
  letter-spacing: .04em;
}

/* Toggle bloque completo */
.pblock__all {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 7px 0; margin-bottom: 4px;
  background: none; border: none; border-bottom: 1px dashed var(--border);
  cursor: pointer; transition: opacity .12s;
}
.pblock__all:hover { opacity: .8; }
.pblock__all-label {
  font-size: .68rem; color: var(--text-3); font-weight: 600;
  text-transform: uppercase; letter-spacing: .04em;
}

/* Lista de menús */
.pmenu { list-style: none; margin: 8px 0 0; padding: 0; }
.pmenu__item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; margin: 0 -10px;
  border-radius: var(--radius-sm); cursor: pointer;
  transition: background .1s;
}
.pmenu__item:hover { background: var(--bg-2); }
.pmenu__item--locked { cursor: default; opacity: .9; }
.pmenu__item--locked:hover { background: transparent; }
.pmenu__lock { color: var(--text-3); display: inline-flex; margin-left: 7px; }
.pmenu__label {
  font-size: .82rem; color: var(--text-2); flex-shrink: 0;
}
.pmenu__item--on .pmenu__label { color: var(--text-1); font-weight: 500; }
.pmenu__slug {
  font-family: var(--font-mono); font-size: .66rem; color: var(--text-3);
  margin-left: auto;
}

/* Checkbox */
.pcheck {
  width: 18px; height: 18px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-2); border: 1.5px solid var(--border-mid);
  border-radius: 5px; color: #fff;
  transition: background .12s, border-color .12s;
}
.pcheck--all {
  background: var(--accent); border-color: var(--accent);
}
.pcheck--some { background: var(--accent-muted); border-color: var(--accent); }
.pcheck--locked { background: var(--text-3); border-color: var(--text-3); opacity: .6; }
.pcheck__dash { width: 8px; height: 2px; background: var(--accent); border-radius: 1px; }

/* Footer */
.perms__footer {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  margin-top: 16px;
}
.pfoot {
  display: flex; align-items: center; gap: 11px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 13px 16px;
  color: var(--text-3);
}
.pfoot__label {
  font-size: .62rem; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: 2px;
}
.pfoot__value { font-size: .76rem; color: var(--text-2); }
.pfoot__value--ok { color: var(--success); }

/* Botones */
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 16px;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .8rem; font-weight: 600;
  border: 1px solid transparent; transition: background .12s, border-color .12s;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn--ghost { background: var(--bg-1); border-color: var(--border); color: var(--text-1); }
.btn--ghost:hover:not(:disabled) { background: var(--bg-hover); }
.btn--primary { background: var(--accent); color: #fff; }
.btn--primary:hover:not(:disabled) { background: var(--accent-dim); }
.btn__spinner {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Skeleton */
.skeleton { border-radius: 4px; background: var(--bg-3); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }

@media (max-width: 820px) {
  .perms__grid { grid-template-columns: 1fr; }
  .perms__footer { grid-template-columns: 1fr; }
  .perms__head { flex-direction: column; }
  .perms__actions { width: 100%; }
  .btn { flex: 1; justify-content: center; }
  .perms__status { flex-wrap: wrap; }
  .pstat--session { margin-left: 0; width: 100%; padding: 10px 18px; border-top: 1px solid var(--border); }
}
</style>
