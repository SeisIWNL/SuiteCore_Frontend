<template>
  <Teleport to="body">
    <Transition name="loader">
      <div v-if="isLoading" class="loader-overlay" role="status" aria-label="Cargando">
        <div class="loader-box">
          <!-- Logo mark animado -->
          <div class="loader-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="1" y="1" width="34" height="34" rx="4"
                stroke="var(--accent)" stroke-width="1"
                stroke-dasharray="136"
                stroke-dashoffset="0"
                class="loader-logo__border"/>
              <text x="18" y="23" text-anchor="middle"
                font-family="'Syne', sans-serif"
                font-weight="800" font-size="13"
                fill="var(--accent)" letter-spacing="-1">SC</text>
            </svg>
          </div>

          <!-- Barra de progreso indeterminada -->
          <div class="loader-bar-track">
            <div class="loader-bar-fill" />
          </div>

          <!-- Mensaje -->
          <span class="loader-msg">{{ message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useLoaderStore } from '@/stores/loader.js'

const store   = useLoaderStore()
const isLoading = computed(() => store.isLoading)
const message   = computed(() => store.message)
</script>

<style scoped>
.loader-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(8, 12, 16, .82);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
}

.loader-box {
  display: flex; flex-direction: column; align-items: center; gap: 18px;
}

/* Logo border animation */
.loader-logo svg { overflow: visible; }
.loader-logo__border {
  animation: dash 1.6s ease-in-out infinite;
  transform-origin: center;
}
@keyframes dash {
  0%   { stroke-dashoffset: 136; opacity: .3; }
  50%  { stroke-dashoffset: 0;   opacity: 1; }
  100% { stroke-dashoffset: -136; opacity: .3; }
}

/* Progress bar */
.loader-bar-track {
  width: 140px; height: 2px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.loader-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  animation: slide 1.4s ease-in-out infinite;
}
@keyframes slide {
  0%   { transform: translateX(-100%) scaleX(.4); }
  50%  { transform: translateX(40%)   scaleX(.6); }
  100% { transform: translateX(200%)  scaleX(.4); }
}

/* Mensaje */
.loader-msg {
  font-family: var(--font-mono);
  font-size: .72rem;
  color: var(--text-3);
  letter-spacing: .08em;
  text-transform: uppercase;
}

/* Transition */
.loader-enter-active { transition: opacity .15s ease; }
.loader-leave-active { transition: opacity .25s ease; }
.loader-enter-from, .loader-leave-to { opacity: 0; }
</style>
