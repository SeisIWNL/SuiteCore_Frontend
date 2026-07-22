<template>
  <Teleport to="body">
    <div class="toasts">
      <TransitionGroup name="toast">
        <div v-for="t in toastStore.toasts" :key="t.id" class="toast" :class="`toast--${t.type}`">
          <span class="toast__ico">
            <svg v-if="t.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else-if="t.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </span>
          <div class="toast__body">
            <div class="toast__title">{{ t.title }}</div>
            <div v-if="t.message" class="toast__msg">{{ t.message }}</div>
          </div>
          <button class="toast__close" @click="toastStore.dismiss(t.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast.js'

const toastStore = useToastStore()
</script>

<style scoped>
.toasts {
  position: fixed; top: 18px; right: 18px; z-index: 9999;
  display: flex; flex-direction: column; gap: 10px;
  width: min(360px, calc(100vw - 36px));
  pointer-events: none;
}
.toast {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; border-radius: var(--radius-lg);
  background: var(--bg-1); border: 1px solid var(--border);
  box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,.35));
  pointer-events: auto;
}
.toast__ico {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
}
.toast--success .toast__ico { background: var(--success-muted); color: var(--success); }
.toast--error   .toast__ico { background: var(--danger-muted);  color: var(--danger); }
.toast--info    .toast__ico { background: var(--blue-muted);    color: var(--blue); }
.toast--success { border-left: 3px solid var(--success); }
.toast--error   { border-left: 3px solid var(--danger); }
.toast--info    { border-left: 3px solid var(--blue); }

.toast__body { flex: 1; min-width: 0; }
.toast__title { font-size: .84rem; font-weight: 700; color: var(--text-1); }
.toast__msg { font-size: .76rem; color: var(--text-3); margin-top: 3px; word-break: break-word; }
.toast__close {
  background: none; border: none; color: var(--text-3); cursor: pointer;
  font-size: .72rem; padding: 2px; flex-shrink: 0; line-height: 1;
}
.toast__close:hover { color: var(--text-1); }

.toast-move,
.toast-enter-active,
.toast-leave-active { transition: all .25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(24px); }
.toast-leave-to { opacity: 0; transform: translateX(24px); }
.toast-leave-active { position: absolute; }
</style>
