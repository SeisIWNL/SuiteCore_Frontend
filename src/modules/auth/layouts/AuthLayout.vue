<template>
  <div class="auth-shell">

    <!-- Grid de fondo decorativo -->
    <div class="auth-shell__grid" aria-hidden="true" />

    <!-- Punto de luz superior -->
    <div class="auth-shell__glow" aria-hidden="true" />

    <!-- Contenido central -->
    <main class="auth-shell__main">
      <slot />
    </main>

    <!-- Footer minimalista -->
    <footer class="auth-shell__footer">
      <span>SuiteCore NOC</span>
      <span class="auth-shell__dot">·</span>
      <span>v1.0.0</span>
      <span class="auth-shell__dot">·</span>
      <span>© {{ year }}</span>
    </footer>

  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

/* Grid punteado de fondo */
.auth-shell__grid {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle, var(--border) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: .45;
  pointer-events: none;
}

/* Luz difusa desde arriba */
.auth-shell__glow {
  position: absolute;
  top: -120px; left: 50%; transform: translateX(-50%);
  width: 600px; height: 400px;
  background: radial-gradient(ellipse, rgba(57,211,83,.07) 0%, transparent 70%);
  pointer-events: none;
}

/* Main */
.auth-shell__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  position: relative;
  z-index: 1;
}

/* Footer */
.auth-shell__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  font-size: .68rem;
  color: var(--text-3);
  letter-spacing: .06em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}
.auth-shell__dot { color: var(--border-mid); }
</style>
