<template>
  <div class="auth-shell">
    <main class="auth-shell__main">
      <slot />
    </main>

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
  background: #f4f5f7;
}

.auth-shell__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.auth-shell__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  font-size: .7rem;
  color: #9ca3af;
  letter-spacing: .04em;
}
.auth-shell__dot { color: #d1d5db; }
</style>
