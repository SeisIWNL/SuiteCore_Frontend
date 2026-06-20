<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="target" class="modal-overlay" @click.self="$emit('cancel')">
        <div class="confirm">

          <div class="confirm__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </div>

          <h2 class="confirm__title">Eliminar región</h2>
          <p class="confirm__text">
            ¿Estás seguro de eliminar la región
            <strong>{{ target.name }}</strong>?
            Esta acción no se puede deshacer.
          </p>

          <div v-if="target.siteCount > 0" class="confirm__warning">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Esta región tiene <strong>{{ target.siteCount }}</strong> sitio(s) asociado(s).</span>
          </div>

          <div class="confirm__actions">
            <button class="btn btn--ghost" @click="$emit('cancel')" :disabled="deleting">
              Cancelar
            </button>
            <button class="btn btn--danger" @click="$emit('confirm')" :disabled="deleting">
              <span v-if="deleting" class="btn__spinner" />
              {{ deleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  target:   { type: Object,  default: null },
  deleting: { type: Boolean, default: false },
})
defineEmits(['cancel', 'confirm'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 7000;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.confirm {
  width: 100%; max-width: 380px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 24px;
  text-align: center;
}
.confirm__icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--danger-muted); color: var(--danger);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
}
.confirm__title {
  font-family: var(--font-display);
  font-size: 1.05rem; font-weight: 700; color: var(--text-1);
}
.confirm__text {
  font-size: .82rem; color: var(--text-2);
  line-height: 1.5; margin-top: 8px;
}
.confirm__warning {
  display: flex; align-items: center; gap: 7px;
  justify-content: center;
  margin-top: 12px; padding: 8px 12px;
  background: var(--warning-muted);
  border: 1px solid var(--warning);
  border-radius: var(--radius);
  font-size: .74rem; color: var(--warning);
}
.confirm__actions {
  display: flex; gap: 10px; margin-top: 20px;
}
.btn {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 38px; border-radius: var(--radius); cursor: pointer;
  font-family: var(--font-sans); font-size: .82rem; font-weight: 600;
  border: 1px solid transparent;
  transition: background .12s, border-color .12s;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn--ghost {
  background: var(--bg-1); border-color: var(--border); color: var(--text-1);
}
.btn--ghost:hover:not(:disabled) { background: var(--bg-hover); }
.btn--danger { background: var(--danger); color: #fff; }
.btn--danger:hover:not(:disabled) { filter: brightness(.92); }
.btn__spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
  border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active { transition: opacity .2s; }
.modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .confirm { transition: transform .2s; }
.modal-enter-from .confirm { transform: scale(.96) translateY(8px); }
</style>
