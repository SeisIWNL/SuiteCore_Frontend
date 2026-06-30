<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal.open" class="modal-overlay" @click.self="$emit('cancel')">
        <div class="ucm">
          <!-- Icono -->
          <div class="ucm__icon" :class="isDisable ? 'ucm__icon--warn' : 'ucm__icon--ok'">
            <svg v-if="isDisable" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          <!-- Texto -->
          <h2 class="ucm__title">
            {{ isDisable ? '¿Deshabilitar usuario?' : '¿Reactivar usuario?' }}
          </h2>
          <p class="ucm__text">
            <template v-if="isDisable">
              Estás por deshabilitar a <strong>{{ fullName }}</strong>
              (<code>{{ modal.user?.username }}</code>). El usuario no se elimina,
              pero <strong>se perderá la contraseña registrada</strong>; al reactivarlo
              tendrás que volver a configurarla.
            </template>
            <template v-else>
              Estás por reactivar a <strong>{{ fullName }}</strong>
              (<code>{{ modal.user?.username }}</code>). Se le asignará una
              <strong>contraseña por defecto</strong> que deberá actualizarse.
            </template>
          </p>

          <!-- Error -->
          <div v-if="error" class="ucm__error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ error }}</span>
          </div>

          <!-- Acciones -->
          <div class="ucm__actions">
            <button class="btn btn--ghost" :disabled="saving" @click="$emit('cancel')">
              Cancelar
            </button>
            <button
              class="btn"
              :class="isDisable ? 'btn--warn' : 'btn--ok'"
              :disabled="saving"
              @click="$emit('confirm')"
            >
              <span v-if="saving" class="btn__spinner" />
              {{ saving ? 'Procesando...' : (isDisable ? 'Deshabilitar' : 'Reactivar') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modal:  { type: Object, required: true },   // confirmModal de useUserActions
  saving: { type: Boolean, default: false },
  error:  { type: String, default: null },
})
defineEmits(['cancel', 'confirm'])

const isDisable = computed(() => props.modal.action === 'disable')
const fullName = computed(() => {
  const u = props.modal.user
  if (!u) return ''
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
})
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 7100;
  background: rgba(0,0,0,.5); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.ucm {
  width: 100%; max-width: 400px;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-md);
  padding: 24px; text-align: center;
}
.ucm__icon {
  width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 14px;
  display: flex; align-items: center; justify-content: center;
}
.ucm__icon--warn { background: var(--warning-muted); color: var(--warning); }
.ucm__icon--ok   { background: var(--success-muted); color: var(--success); }
.ucm__title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-bottom: 8px; }
.ucm__text { font-size: .82rem; color: var(--text-2); line-height: 1.5; margin-bottom: 18px; }
.ucm__text code { font-family: var(--font-mono); font-size: .78rem; color: var(--text-1); }

.ucm__error {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  padding: 9px 12px; margin-bottom: 14px;
  background: var(--danger-muted); border: 1px solid var(--danger);
  border-radius: var(--radius); font-size: .76rem; color: var(--danger);
}

.ucm__actions { display: flex; gap: 10px; justify-content: center; }
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 38px; padding: 0 20px; flex: 1; justify-content: center;
  border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 600;
  border: 1px solid transparent; transition: background .12s, border-color .12s;
}
.btn:disabled { opacity: .55; cursor: not-allowed; }
.btn--ghost { background: none; border-color: var(--border); color: var(--text-2); }
.btn--ghost:hover:not(:disabled) { background: var(--bg-2); color: var(--text-1); }
.btn--warn { background: var(--warning); color: #fff; }
.btn--warn:hover:not(:disabled) { filter: brightness(.92); }
.btn--ok { background: var(--success); color: #fff; }
.btn--ok:hover:not(:disabled) { filter: brightness(.92); }
.btn__spinner {
  width: 13px; height: 13px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .ucm { transition: transform .2s; }
.modal-enter-from .ucm { transform: scale(.96) translateY(8px); }
</style>
