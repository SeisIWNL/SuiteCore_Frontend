<template>
  <Teleport to="body">

    <!-- ── Aviso: sesión por expirar ── -->
    <Transition name="session-banner">
      <div v-if="sessionStore.warningVisible" class="session-banner session-banner--warning">
        <div class="session-banner__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="session-banner__body">
          <span class="session-banner__title">Sesión por expirar</span>
          <span class="session-banner__desc">
            Tu sesión expirará en
            <strong>{{ sessionStore.warningMinutes }} minuto{{ sessionStore.warningMinutes !== 1 ? 's' : '' }}</strong>.
            Guarda tu trabajo.
          </span>
        </div>
        <!-- Barra de countdown visual -->
        <div class="session-banner__countdown">
          <div
            class="session-banner__countdown-fill"
            :style="{ animationDuration: `${sessionStore.warningMinutes * 60}s` }"
          />
        </div>
        <button class="session-banner__close" @click="sessionStore.hideWarning()">✕</button>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup>
import { useSessionStore } from '@/stores/session.js'
const sessionStore = useSessionStore()
</script>

<style scoped>
.session-banner {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  border-radius: 10px;
  padding: 14px 14px 6px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  z-index: 8000;
  overflow: hidden;
  border: 1px solid transparent;
}

/* Variante warning */
.session-banner--warning {
  background: #1a1500;
  border-color: rgba(210,153,34,.3);
}
.session-banner--warning .session-banner__icon { color: var(--warning); }

/* Icono */
.session-banner__icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* Cuerpo */
.session-banner__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-bottom: 10px;
}
.session-banner__title {
  font-size: .8rem;
  font-weight: 700;
  color: var(--warning);
  font-family: var(--font-display);
}
.session-banner__desc {
  font-size: .72rem;
  color: var(--text-2);
  line-height: 1.4;
}
.session-banner__desc strong {
  color: var(--text-1);
}

/* Barra countdown */
.session-banner__countdown {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: rgba(210,153,34,.15);
}
.session-banner__countdown-fill {
  height: 100%;
  background: var(--warning);
  border-radius: 0 99px 99px 0;
  animation: countdown linear forwards;
  transform-origin: left;
}
@keyframes countdown {
  from { width: 100%; }
  to   { width: 0%; }
}

/* Close */
.session-banner__close {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: .7rem;
  padding: 2px 4px;
  border-radius: 3px;
  flex-shrink: 0;
  transition: color .12s;
}
.session-banner__close:hover { color: var(--text-1); }

/* Transitions */
.session-banner-enter-active { transition: opacity .25s, transform .25s; }
.session-banner-leave-active { transition: opacity .2s,  transform .2s; }
.session-banner-enter-from,
.session-banner-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
