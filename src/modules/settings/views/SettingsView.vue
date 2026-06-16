<template>
  <div class="settings">

    <!-- Header -->
    <div class="settings__head">
      <h1 class="settings__title">Configuración</h1>
      <p class="settings__sub">Preferencias personales de tu cuenta</p>
    </div>

    <!-- Sección: Perfil -->
    <section class="settings__section">
      <div class="settings__section-head">
        <h2 class="settings__section-title">Perfil</h2>
        <p class="settings__section-sub">Información de tu cuenta</p>
      </div>

      <div class="settings__card">
        <div class="settings__profile">
          <div class="settings__profile-avatar">{{ authStore.userInitials }}</div>
          <div class="settings__profile-info">
            <div class="settings__profile-name">{{ fullName }}</div>
            <div class="settings__profile-user mono">{{ user?.username }}</div>
            <div class="settings__profile-dept">{{ user?.department || 'Sin departamento asignado' }}</div>
          </div>
        </div>

        <div class="settings__divider" />

        <div class="settings__rows">
          <div class="settings__row">
            <span class="settings__row-label">Nombre</span>
            <span class="settings__row-value">{{ user?.firstName }} {{ user?.lastName }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">Usuario</span>
            <span class="settings__row-value mono">{{ user?.username }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">Departamento</span>
            <span class="settings__row-value">{{ user?.department || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">Título</span>
            <span class="settings__row-value">{{ user?.title || '—' }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">UID</span>
            <span class="settings__row-value mono">{{ user?.uidNumber }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">Roles</span>
            <span class="settings__row-value">
              <span v-if="user?.roles?.length" class="settings__tags">
                <span v-for="role in user.roles" :key="role" class="settings__tag">{{ role }}</span>
              </span>
              <span v-else class="settings__muted">Sin roles asignados</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Sección: Apariencia -->
    <section class="settings__section">
      <div class="settings__section-head">
        <h2 class="settings__section-title">Apariencia</h2>
        <p class="settings__section-sub">Personaliza la interfaz del dashboard</p>
      </div>

      <div class="settings__card">

        <!-- Toggle de tema -->
        <div class="settings__pref">
          <div class="settings__pref-info">
            <div class="settings__pref-label">Tema de la interfaz</div>
            <div class="settings__pref-desc">
              Alterna entre el tema claro (corporativo) y oscuro (NOC).
            </div>
          </div>
          <div class="settings__theme-toggle">
            <!-- Botón claro -->
            <button
              class="settings__theme-btn"
              :class="{ 'settings__theme-btn--active': themeStore.isLight }"
              @click="themeStore.setTheme('light')"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Claro
            </button>
            <!-- Botón oscuro -->
            <button
              class="settings__theme-btn"
              :class="{ 'settings__theme-btn--active': themeStore.isDark }"
              @click="themeStore.setTheme('dark')"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Oscuro
            </button>
          </div>
        </div>

        <div class="settings__divider" />

        <!-- Preview del tema activo -->
        <div class="settings__theme-preview">
          <div class="settings__preview-label">Vista previa</div>
          <div class="settings__preview-box" :class="{ 'settings__preview-box--dark': themeStore.isDark }">
            <div class="settings__preview-sidebar">
              <div class="settings__preview-dot" />
              <div class="settings__preview-dot" />
              <div class="settings__preview-dot" />
            </div>
            <div class="settings__preview-content">
              <div class="settings__preview-bar" style="width:60%" />
              <div class="settings__preview-bar" style="width:40%;margin-top:6px" />
              <div class="settings__preview-cards">
                <div class="settings__preview-card" />
                <div class="settings__preview-card" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Sección: Sesión -->
    <section class="settings__section">
      <div class="settings__section-head">
        <h2 class="settings__section-title">Sesión</h2>
        <p class="settings__section-sub">Información sobre tu sesión activa</p>
      </div>

      <div class="settings__card">
        <div class="settings__rows">
          <div class="settings__row">
            <span class="settings__row-label">Estado</span>
            <span class="settings__row-value">
              <span class="settings__status-pill">
                <span class="settings__status-dot" />
                Activa
              </span>
            </span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">Expira</span>
            <span class="settings__row-value mono">{{ expiresFormatted }}</span>
          </div>
          <div class="settings__row">
            <span class="settings__row-label">Tiempo restante</span>
            <span class="settings__row-value mono" :class="{ 'settings__val--warn': msLeft < 10 * 60 * 1000 }">
              {{ timeLeft }}
            </span>
          </div>
        </div>

        <div class="settings__divider" />

        <button class="settings__logout-btn" @click="handleLogout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore }  from '@/modules/auth/store.js'
import { useThemeStore } from '@/stores/theme.js'

const authStore  = useAuthStore()
const themeStore = useThemeStore()
const router     = useRouter()

const user     = computed(() => authStore.user)
const fullName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
})

// Sesión
const expiresFormatted = computed(() => {
  if (!authStore.expiresAt) return '—'
  return new Date(authStore.expiresAt).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
})

const msLeft   = computed(() => authStore.msUntilExpiry)
const timeLeft = ref('')

function updateTimeLeft() {
  const ms = authStore.msUntilExpiry
  if (ms <= 0) { timeLeft.value = 'Expirada'; return }
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  timeLeft.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

let timer
onMounted(() => { updateTimeLeft(); timer = setInterval(updateTimeLeft, 1000) })
onUnmounted(() => clearInterval(timer))

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.settings { max-width: 680px; display: flex; flex-direction: column; gap: 28px; }

/* Header */
.settings__head { margin-bottom: 4px; }
.settings__title {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; color: var(--text-1);
}
.settings__sub { font-size: .82rem; color: var(--text-3); margin-top: 4px; }

/* Section */
.settings__section { display: flex; flex-direction: column; gap: 12px; }
.settings__section-head {}
.settings__section-title {
  font-size: .88rem; font-weight: 700; color: var(--text-1);
}
.settings__section-sub { font-size: .75rem; color: var(--text-3); margin-top: 2px; }

/* Card */
.settings__card {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Perfil */
.settings__profile {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px;
}
.settings__profile-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 700; color: #fff; flex-shrink: 0;
  font-family: var(--font-display);
}
.settings__profile-name {
  font-size: .95rem; font-weight: 700; color: var(--text-1);
}
.settings__profile-user { font-size: .78rem; color: var(--text-2); margin-top: 2px; }
.settings__profile-dept { font-size: .72rem; color: var(--text-3); margin-top: 1px; }

/* Divider */
.settings__divider { height: 1px; background: var(--border); }

/* Rows */
.settings__rows { display: flex; flex-direction: column; }
.settings__row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 20px;
  border-bottom: 1px solid var(--border);
  font-size: .82rem;
}
.settings__row:last-child { border-bottom: none; }
.settings__row-label { color: var(--text-3); font-weight: 500; min-width: 120px; }
.settings__row-value { color: var(--text-1); }
.settings__muted { color: var(--text-3); }

/* Tags */
.settings__tags { display: flex; gap: 5px; flex-wrap: wrap; }
.settings__tag {
  padding: 2px 8px; border-radius: 99px; font-size: .7rem; font-weight: 600;
  background: var(--accent-muted); color: var(--accent);
  border: 1px solid rgba(37,99,235,.15);
}

/* Status pill */
.settings__status-pill {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: .75rem; font-weight: 600;
  color: var(--success);
}
.settings__status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: var(--success);
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.settings__val--warn { color: var(--warning); }

/* Logout btn */
.settings__logout-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 12px 20px;
  background: none; border: none;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 500;
  color: var(--danger); cursor: pointer;
  transition: background .12s;
  text-align: left;
}
.settings__logout-btn:hover { background: var(--danger-muted); }

/* ── Preferencia de tema ── */
.settings__pref {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; padding: 16px 20px;
}
.settings__pref-label {
  font-size: .85rem; font-weight: 600; color: var(--text-1);
}
.settings__pref-desc {
  font-size: .75rem; color: var(--text-3); margin-top: 3px; line-height: 1.4;
}

/* Botones de tema */
.settings__theme-toggle {
  display: flex; gap: 6px; flex-shrink: 0;
}
.settings__theme-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text-2);
  font-family: var(--font-sans); font-size: .78rem; font-weight: 500;
  cursor: pointer; transition: background .15s, border-color .15s, color .15s;
  white-space: nowrap;
}
.settings__theme-btn:hover { background: var(--bg-3); color: var(--text-1); }
.settings__theme-btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.settings__theme-btn--active:hover { background: var(--accent-dim); }

/* Preview del tema */
.settings__theme-preview { padding: 16px 20px; }
.settings__preview-label {
  font-size: .72rem; font-weight: 600; color: var(--text-3);
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: 10px;
}
.settings__preview-box {
  display: flex; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--border); height: 80px;
  background: #f5f6f8;
  transition: background .25s;
}
.settings__preview-box--dark { background: #0f1117; }

.settings__preview-sidebar {
  width: 32px; height: 100%;
  background: #1e2532;
  display: flex; flex-direction: column;
  align-items: center; padding: 8px 0; gap: 6px;
}
.settings__preview-dot {
  width: 12px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.2);
}

.settings__preview-content {
  flex: 1; padding: 10px 12px;
}
.settings__preview-bar {
  height: 6px; border-radius: 3px;
  background: var(--border);
}
.settings__preview-box--dark .settings__preview-bar { background: #2a3347; }

.settings__preview-cards {
  display: flex; gap: 6px; margin-top: 10px;
}
.settings__preview-card {
  flex: 1; height: 28px; border-radius: 4px;
  background: var(--bg-1); border: 1px solid var(--border);
}
.settings__preview-box--dark .settings__preview-card {
  background: #161b27; border-color: #2a3347;
}

/* Mono */
.mono { font-family: var(--font-mono); }
</style>
