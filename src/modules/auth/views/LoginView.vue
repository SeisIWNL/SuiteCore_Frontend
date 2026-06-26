<template>
  <AuthLayout>
    <div class="login">

      <!-- Logo + marca -->
      <div class="login__brand">
        <div class="login__logo">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <!-- Marco exterior con esquinas cortadas -->
            <path d="M8 1h26l7 7v26l-7 7H8L1 34V8L8 1z"
              fill="none" stroke="var(--accent)" stroke-width="1"/>
            <!-- Líneas internas decorativas -->
            <line x1="1"  y1="8"  x2="6"  y2="8"  stroke="var(--accent)" stroke-width=".8" opacity=".5"/>
            <line x1="36" y1="1"  x2="36" y2="6"   stroke="var(--accent)" stroke-width=".8" opacity=".5"/>
            <line x1="41" y1="34" x2="36" y2="34"  stroke="var(--accent)" stroke-width=".8" opacity=".5"/>
            <line x1="6"  y1="41" x2="6"  y2="36"  stroke="var(--accent)" stroke-width=".8" opacity=".5"/>
            <!-- Texto SC -->
            <text x="21" y="26" text-anchor="middle"
              font-family="'Syne', sans-serif"
              font-weight="800" font-size="15"
              fill="var(--accent)" letter-spacing="-1">SC</text>
          </svg>
        </div>
        <div class="login__brand-text">
          <span class="login__brand-name">SuiteCore</span>
          <span class="login__brand-tag">NOC Dashboard</span>
        </div>
      </div>

      <!-- Card -->
      <div class="login__card">

        <!-- Indicador de estado del sistema -->
        <div class="login__status">
          <span class="login__status-dot" />
          <span class="login__status-label">Sistema operacional</span>
          <span class="login__status-time">{{ currentTime }}</span>
        </div>

        <!-- Separador -->
        <div class="login__sep" />

        <!-- Encabezado -->
        <div class="login__head">
          <h1 class="login__title">Acceso al sistema</h1>
          <p class="login__sub">
            El acceso es provisto exclusivamente por el administrador de la plataforma.
          </p>
        </div>

        <!-- Error del servidor -->
        <Transition name="alert-fade">
          <div v-if="serverError" class="login__error">
            <span class="login__error-icon">!</span>
            <span>{{ serverError }}</span>
            <button class="login__error-close" @click="serverError = ''">✕</button>
          </div>
        </Transition>

        <!-- ── Aviso de sesión expirada (viene del router) ── -->
        <Transition name="alert-fade">
          <div v-if="sessionExpired" class="login__expired">
            <div class="login__expired-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div class="login__expired-title">Sesión expirada</div>
              <div class="login__expired-desc">
                Tu sesión ha expirado. Vuelve a iniciar sesión para continuar.
              </div>
            </div>
            <button class="login__expired-close" @click="sessionStore.clearExpiredReason()">✕</button>
          </div>
        </Transition>

        <!-- Formulario -->
        <form class="login__form" novalidate @submit="onSubmit">

          <!-- Usuario -->
          <div class="field" :class="{ 'field--error': errors.username }">
            <label class="field__label" for="username">
              <span class="field__label-prefix">01</span> Usuario
            </label>
            <div class="field__wrap">
              <svg class="field__icon" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                v-model="username"
                v-bind="usernameAttrs"
                id="username"
                type="text"
                placeholder="usuario.noc"
                autocomplete="username"
                class="field__input"
              />
            </div>
            <span v-if="errors.username" class="field__error">{{ errors.username }}</span>
          </div>

          <!-- Contraseña -->
          <div class="field" :class="{ 'field--error': errors.password }">
            <label class="field__label" for="password">
              <span class="field__label-prefix">02</span> Contraseña
            </label>
            <div class="field__wrap">
              <svg class="field__icon" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                v-model="password"
                v-bind="passwordAttrs"
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••••"
                autocomplete="current-password"
                class="field__input field__input--pr"
              />
              <button
                type="button"
                class="field__toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar' : 'Mostrar'"
              >
                <svg v-if="!showPassword" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="field__error">{{ errors.password }}</span>
          </div>

          <!-- Recordar sesión -->
          <label class="login__remember">
            <input
              v-model="rememberMe"
              v-bind="rememberMeAttrs"
              type="checkbox"
              class="login__checkbox"
            />
            <span class="login__checkbox-box" />
            <span>Recordar sesión en este equipo</span>
          </label>

          <!-- Submit -->
          <button
            type="submit"
            class="login__btn"
            :class="{ 'login__btn--loading': loading }"
            :disabled="loading"
          >
            <span v-if="!loading" class="login__btn-text">
              Ingresar
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </span>
            <span v-else class="login__btn-loader">
              <span class="login__spinner" />
              Autenticando...
            </span>
          </button>

        </form>

        <!-- Nota TLS -->
        <div class="login__tls">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Cifrado TLS 1.3 · LDAP</span>
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AuthLayout  from '@/modules/auth/layouts/AuthLayout.vue'
import { useLogin } from '@/modules/auth/composables/useLogin.js'
import { useSessionStore } from '@/stores/session.js'

const {
  username, usernameAttrs,
  password, passwordAttrs,
  rememberMe, rememberMeAttrs,
  errors, loading, serverError,
  onSubmit,
} = useLogin()

const showPassword = ref(false)
const sessionStore   = useSessionStore()
const sessionExpired = computed(() => sessionStore.expiredReason === 'expired')


// Limpia el motivo una vez que el usuario lo ve
onMounted(() => {
  // Lo dejamos visible para que lo lea; se limpia al cerrar o al hacer login
})

// Reloj en tiempo real
const currentTime = ref('')
let clockInterval
function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}
onMounted(() => { updateClock(); clockInterval = setInterval(updateClock, 1000) })
onUnmounted(() => clearInterval(clockInterval))
</script>

<style scoped>
/* ── Wrapper ── */
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
  max-width: 400px;
  animation: loginIn .4s ease both;
}
@keyframes loginIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Marca / Logo ── */
.login__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.login__logo {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(57,211,83,.3));
}
.login__brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.login__brand-name {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-1);
  letter-spacing: -.5px;
  line-height: 1;
}
.login__brand-tag {
  font-size: .65rem;
  color: var(--accent);
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 500;
}

/* ── Session expired ── */
.login__expired {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(88, 166, 255, .06);
  border: 1px solid rgba(88, 166, 255, .2);
  border-radius: var(--radius);
  font-size: .75rem;
}
.login__expired-icon {
  color: var(--blue);
  flex-shrink: 0;
  margin-top: 1px;
}
.login__expired-title {
  font-weight: 700;
  color: var(--blue);
  font-size: .78rem;
  margin-bottom: 2px;
}
.login__expired-desc {
  color: var(--text-2);
  line-height: 1.4;
}
.login__expired-close {
  margin-left: auto;
  background: none; border: none;
  color: var(--text-3); cursor: pointer; font-size: .7rem;
  flex-shrink: 0; padding: 0 2px;
}
.login__expired-close:hover { color: var(--text-1); }

/* ── Card ── */
.login__card {
  width: 100%;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}
/* Esquina decorativa */
.login__card::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 60px; height: 60px;
  background: linear-gradient(225deg, var(--accent-muted) 0%, transparent 60%);
  pointer-events: none;
}

/* ── Status bar ── */
.login__status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .68rem;
  color: var(--text-3);
  letter-spacing: .04em;
}
.login__status-dot {
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--accent);
  animation: pulse 2s infinite;
  flex-shrink: 0;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}
.login__status-time {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--text-3);
}

/* ── Separator ── */
.login__sep {
  height: 1px;
  background: var(--border);
}

/* ── Head ── */
.login__title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-1);
  letter-spacing: -.2px;
}
.login__sub {
  font-size: .72rem;
  color: var(--text-3);
  line-height: 1.5;
  margin-top: 4px;
}

/* ── Error ── */
.login__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--danger-muted);
  border: 1px solid rgba(248,81,73,.25);
  border-radius: var(--radius);
  font-size: .75rem;
  color: var(--danger);
}
.login__error-icon {
  width: 16px; height: 16px;
  border: 1px solid var(--danger);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700;
  flex-shrink: 0;
}
.login__error-close {
  margin-left: auto;
  background: none; border: none;
  color: var(--danger); cursor: pointer;
  font-size: .7rem; opacity: .7;
}
.login__error-close:hover { opacity: 1; }

.alert-fade-enter-active, .alert-fade-leave-active { transition: opacity .2s, transform .2s; }
.alert-fade-enter-from, .alert-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Form ── */
.login__form { display: flex; flex-direction: column; gap: 14px; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 5px; }
.field__label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .7rem;
  color: var(--text-2);
  letter-spacing: .05em;
  text-transform: uppercase;
}
.field__label-prefix {
  color: var(--accent);
  font-size: .62rem;
  opacity: .7;
}
.field__wrap { position: relative; }
.field__icon {
  position: absolute;
  left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}
.field__input {
  display: block; width: 100%;
  height: 38px;
  padding: 0 10px 0 32px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-1);
  font-size: .88rem;
  font-family: var(--font-mono);
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.field__input::placeholder { color: var(--text-3); }
.field__input:focus {
  border-color: var(--accent-dim);
  box-shadow: 0 0 0 2px var(--accent-glow);
}
.field__input--pr { padding-right: 36px; }
.field--error .field__input { border-color: var(--danger); }
.field--error .field__input:focus { box-shadow: 0 0 0 2px var(--danger-muted); }
.field__toggle {
  position: absolute;
  right: 0; top: 0; height: 100%; width: 36px;
  background: none; border: none;
  color: var(--text-3); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s;
}
.field__toggle:hover { color: var(--text-1); }
.field__error { font-size: .7rem; color: var(--danger); }

/* Recordar sesión */
.login__remember {
  display: flex; align-items: center; gap: 8px;
  font-size: .75rem; color: var(--text-2);
  cursor: pointer; user-select: none;
}
.login__checkbox { display: none; }
.login__checkbox-box {
  width: 14px; height: 14px;
  border: 1px solid var(--border-mid);
  border-radius: 3px;
  background: var(--bg-2);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: border-color .15s, background .15s;
}
.login__checkbox:checked + .login__checkbox-box {
  background: var(--accent);
  border-color: var(--accent);
}
.login__checkbox:checked + .login__checkbox-box::after {
  content: '✓';
  font-size: .6rem;
  color: var(--bg);
  font-weight: 700;
}

/* Submit button */
.login__btn {
  width: 100%;
  height: 40px;
  background: var(--accent);
  color: var(--bg);
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: .85rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: .04em;
  transition: background .15s, transform .1s, box-shadow .15s;
  margin-top: 2px;
}
.login__btn:hover:not(:disabled) {
  background: var(--accent-dim);
  box-shadow: 0 0 20px var(--accent-glow);
}
.login__btn:active:not(:disabled) { transform: translateY(1px); }
.login__btn:disabled { opacity: .5; cursor: not-allowed; }
.login__btn-text, .login__btn-loader {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.login__btn--loading { background: var(--accent-dim); }

/* Spinner del botón */
.login__spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(8,12,16,.3);
  border-top-color: var(--bg);
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* TLS note */
.login__tls {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: .67rem; color: var(--text-3);
  letter-spacing: .04em;
}
</style>
