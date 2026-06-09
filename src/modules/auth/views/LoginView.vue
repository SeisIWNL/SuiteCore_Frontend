<template>
  <AuthLayout>
    <div class="card">

      <!-- Encabezado -->
      <div class="card__head">
        <h1 class="card__title">Iniciar sesión</h1>
        <p class="card__sub">Ingresa tus credenciales de administrador</p>
      </div>

      <!-- Error del servidor -->
      <AlertBanner
        v-if="serverError"
        :message="serverError"
        type="error"
        :show="!!serverError"
        @close="serverError = ''"
      />

      <!-- Formulario — vee-validate se integra con v-model + errors -->
      <form class="card__form" novalidate @submit="onSubmit">

        <BaseInput
          v-model="username"
          v-bind="usernameAttrs"
          id="username"
          label="Usuario"
          placeholder="admin"
          autocomplete="username"
          :error="errors.username"
        >
          <template #prefix>
            <!-- Ícono usuario -->
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </template>
        </BaseInput>

        <BaseInput
          v-model="password"
          v-bind="passwordAttrs"
          id="password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="errors.password"
        >
          <template #prefix>
            <!-- Ícono candado -->
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </template>
        </BaseInput>

        <!-- Recordar + ¿Olvidaste? -->
        <div class="card__options">
          <label class="checkbox-row">
            <input
              v-model="rememberMe"
              v-bind="rememberMeAttrs"
              type="checkbox"
              class="checkbox"
            />
            Recordar sesión
          </label>
          <RouterLink to="/forgot-password" class="link-muted">¿Olvidaste tu contraseña?</RouterLink>
        </div>

        <BaseButton
          type="submit"
          variant="primary"
          size="md"
          :loading="loading"
          :disabled="!meta.valid && meta.dirty"
          block
        >
          Ingresar al sistema
        </BaseButton>

      </form>

      <!-- Divider -->
      <div class="divider"><span>o continúa con</span></div>

      <!-- SSO -->
      <BaseButton variant="ghost" size="md" block @click="handleSso">
        <!-- Ícono edificio -->
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="15" rx="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        SSO Corporativo (Active Directory)
      </BaseButton>

      <!-- Nota segura -->
      <p class="secure-note">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Conexión cifrada con TLS 1.3
      </p>

    </div>
  </AuthLayout>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AuthLayout   from '@/modules/auth/layouts/AuthLayout.vue'
import BaseInput    from '@/components/ui/BaseInput.vue'
import BaseButton   from '@/components/ui/BaseButton.vue'
import AlertBanner  from '@/components/ui/AlertBanner.vue'
import { useLogin } from '@/modules/auth/composables/useLogin.js'

const {
  username, usernameAttrs,
  password, passwordAttrs,
  rememberMe, rememberMeAttrs,
  errors, meta, loading, serverError,
  onSubmit,
} = useLogin()

function handleSso() {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/sso`
}
</script>

<style scoped>
.card {
  width: 100%; max-width: 368px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
  padding: 26px 26px 22px;
  display: flex; flex-direction: column; gap: 14px;
}

/* Encabezado */
.card__head {}
.card__title { font-size: 1.05rem; font-weight: 700; letter-spacing: -.2px; }
.card__sub   { font-size: .78rem; color: var(--text-2); margin-top: 3px; }

/* Formulario */
.card__form  { display: flex; flex-direction: column; gap: 11px; }

/* Opciones */
.card__options {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1px;
}
.checkbox-row {
  display: flex; align-items: center; gap: 5px;
  font-size: .78rem; color: var(--text-2); cursor: pointer; user-select: none;
}
.checkbox { width: 13px; height: 13px; accent-color: var(--primary); cursor: pointer; }
.link-muted { font-size: .78rem; color: var(--text-2); }
.link-muted:hover { color: var(--primary); }

/* Divider */
.divider {
  display: flex; align-items: center; gap: 10px;
  color: var(--text-3); font-size: .72rem;
}
.divider::before,
.divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* Nota segura */
.secure-note {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: .7rem; color: var(--text-3); margin-top: -3px;
}
</style>
