<template>
  <div class="auth-shell">

    <header class="auth-shell__header">
      <div class="logo">
        <span class="logo-mark">SC</span>
        <span class="logo-name">SuiteCore</span>
      </div>
      <span class="auth-shell__version">v1.0.0</span>
    </header>

    <main class="auth-shell__main">
      <slot />
    </main>

    <footer class="auth-shell__footer">
      © {{ year }} SuiteCore &nbsp;·&nbsp;
      <a href="#">Política de privacidad</a> &nbsp;·&nbsp;
      <a href="#">Soporte</a>
    </footer>

  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.auth-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }

/* Header */
.auth-shell__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 24px;
  background: var(--surface); border-bottom: 1px solid var(--border);
}
.logo { display: flex; align-items: center; gap: 8px; }
.logo-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 27px; height: 27px;
  background: var(--primary); color: #fff;
  border-radius: var(--radius-sm);
  font-size: .72rem; font-weight: 800; letter-spacing: -.5px;
}
.logo-name { font-size: .92rem; font-weight: 700; color: var(--text-1); }
.auth-shell__version { font-size: .7rem; color: var(--text-3); }

/* Main */
.auth-shell__main {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 32px 16px;
}

/* Footer */
.auth-shell__footer {
  text-align: center; padding: 14px;
  font-size: .72rem; color: var(--text-3);
  border-top: 1px solid var(--border);
}
</style>
