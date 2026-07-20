<template>
  <AuthLayout>
    <div class="login">

      <!-- Logo + marca -->
      <div class="login__brand">
        <img src="@/assets/logo.png" alt="SuiteCore" class="login__logo" />
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
          <span>Sistema operacional</span>
        </div>

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
            <label class="field__label" for="username">Usuario</label>
            <div class="field__wrap">
              <svg class="field__icon" width="15" height="15" viewBox="0 0 24 24"
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
            <label class="field__label" for="password">Contraseña</label>
            <div class="field__wrap">
              <svg class="field__icon" width="15" height="15" viewBox="0 0 24 24"
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
                <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24"
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
          <!-- <label class="login__remember">
            <input
              v-model="rememberMe"
              v-bind="rememberMeAttrs"
              type="checkbox"
              class="login__checkbox"
            />
            <span class="login__checkbox-box" />
            <span>Recordar sesión en este equipo</span>
          </label> -->

          <!-- Submit -->
          <button
            type="submit"
            class="login__btn"
            :class="{ 'login__btn--loading': loading }"
            :disabled="loading"
          >
            <span v-if="!loading" class="login__btn-text">
              Ingresar
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
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
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
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
import { ref, computed } from 'vue'
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
</script>

<style scoped>
/* ── Wrapper ── */
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 26px;
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
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  object-fit: contain;
}
.login__brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.login__brand-name {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -.3px;
  line-height: 1.15;
}
.login__brand-tag {
  font-size: .72rem;
  color: #2563eb;
  letter-spacing: .12em;
  text-transform: uppercase;
  font-weight: 700;
}

/* ── Card ── */
.login__card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 30px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, .04), 0 12px 32px rgba(15, 23, 42, .06);
}

/* ── Status bar ── */
.login__status {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .78rem;
  color: #6b7280;
}
.login__status-dot {
  width: 7px; height: 7px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(34,197,94,.5);
  flex-shrink: 0;
}

/* ── Head ── */
.login__title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -.3px;
}
.login__sub {
  font-size: .82rem;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 6px;
}

/* ── Error ── */
.login__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: .78rem;
  color: #dc2626;
}
.login__error-icon {
  width: 16px; height: 16px;
  border: 1px solid #dc2626;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .65rem; font-weight: 700;
  flex-shrink: 0;
}
.login__error-close {
  margin-left: auto;
  background: none; border: none;
  color: #dc2626; cursor: pointer;
  font-size: .7rem; opacity: .7;
}
.login__error-close:hover { opacity: 1; }

/* ── Session expired ── */
.login__expired {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  font-size: .76rem;
}
.login__expired-icon {
  color: #2563eb;
  flex-shrink: 0;
  margin-top: 1px;
}
.login__expired-title {
  font-weight: 700;
  color: #2563eb;
  font-size: .8rem;
  margin-bottom: 2px;
}
.login__expired-desc {
  color: #4b5563;
  line-height: 1.4;
}
.login__expired-close {
  margin-left: auto;
  background: none; border: none;
  color: #9ca3af; cursor: pointer; font-size: .7rem;
  flex-shrink: 0; padding: 0 2px;
}
.login__expired-close:hover { color: #111827; }

.alert-fade-enter-active, .alert-fade-leave-active { transition: opacity .2s, transform .2s; }
.alert-fade-enter-from, .alert-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Form ── */
.login__form { display: flex; flex-direction: column; gap: 16px; }

/* Fields */
.field { display: flex; flex-direction: column; gap: 7px; }
.field__label {
  font-size: .72rem;
  color: #374151;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-weight: 700;
}
.field__wrap { position: relative; }
.field__icon {
  position: absolute;
  left: 12px; top: 50%; transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}
.field__input {
  display: block; width: 100%;
  height: 44px;
  padding: 0 12px 0 36px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #111827;
  font-size: .9rem;
  font-family: var(--font-sans);
  outline: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.field__input::placeholder { color: #9ca3af; }
.field__input:focus {
  background: #ffffff;
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.field__input--pr { padding-right: 40px; }
.field--error .field__input { border-color: #fca5a5; }
.field--error .field__input:focus { box-shadow: 0 0 0 3px rgba(220,38,38,.12); }
.field__toggle {
  position: absolute;
  right: 0; top: 0; height: 100%; width: 40px;
  background: none; border: none;
  color: #9ca3af; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s;
}
.field__toggle:hover { color: #4b5563; }
.field__error { font-size: .72rem; color: #dc2626; }

/* Recordar sesión */
.login__remember {
  display: flex; align-items: center; gap: 9px;
  font-size: .82rem; color: #4b5563;
  cursor: pointer; user-select: none;
}
.login__checkbox { display: none; }
.login__checkbox-box {
  width: 16px; height: 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 5px;
  background: #ffffff;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: border-color .15s, background .15s;
}
.login__checkbox:checked + .login__checkbox-box {
  background: #2563eb;
  border-color: #2563eb;
}
.login__checkbox:checked + .login__checkbox-box::after {
  content: '✓';
  font-size: .68rem;
  color: #ffffff;
  font-weight: 700;
}

/* Submit button */
.login__btn {
  width: 100%;
  height: 46px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-family: var(--font-sans);
  font-size: .92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .15s, transform .1s, box-shadow .15s;
  margin-top: 2px;
}
.login__btn:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 4px 14px rgba(37,99,235,.3);
}
.login__btn:active:not(:disabled) { transform: translateY(1px); }
.login__btn:disabled { opacity: .55; cursor: not-allowed; }
.login__btn-text, .login__btn-loader {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.login__btn--loading { background: #1d4ed8; }

/* Spinner del botón */
.login__spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* TLS note */
.login__tls {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: .72rem; color: #9ca3af;
}
</style>
