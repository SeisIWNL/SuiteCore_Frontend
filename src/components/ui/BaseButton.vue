<template>
  <button
    v-bind="$attrs"
    :type="type"
    :disabled="disabled || loading"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
  >
    <!-- Spinner de carga -->
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <span :class="{ 'btn__label--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup>
defineProps({
  type:     { type: String,  default: 'button' },
  variant:  { type: String,  default: 'primary' },   // primary | ghost | danger | link
  size:     { type: String,  default: 'md' },         // sm | md | lg
  disabled: { type: Boolean, default: false },
  loading:  { type: Boolean, default: false },
  block:    { type: Boolean, default: false },
})
</script>

<style scoped>
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 1px solid transparent; border-radius: var(--radius);
  font-weight: 600; cursor: pointer; white-space: nowrap;
  outline: none; position: relative; user-select: none;
  transition: background .15s, border-color .15s, opacity .15s;
}
.btn:focus-visible { box-shadow: var(--shadow-focus); }
.btn:disabled      { opacity: .5; cursor: not-allowed; }
.btn--block        { width: 100%; }

/* Tamaños */
.btn--sm { height: 30px; padding: 0 10px; font-size: .78rem; }
.btn--md { height: 34px; padding: 0 14px; font-size: .85rem; }
.btn--lg { height: 40px; padding: 0 20px; font-size: .92rem; }

/* Variantes */
.btn--primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn--primary:hover:not(:disabled) { background: var(--primary-h); border-color: var(--primary-h); }

.btn--ghost { background: transparent; border-color: var(--border); color: var(--text-1); }
.btn--ghost:hover:not(:disabled) { background: var(--bg); }

.btn--danger { background: var(--danger); color: #fff; }
.btn--danger:hover:not(:disabled) { filter: brightness(.9); }

.btn--link {
  background: transparent; border-color: transparent;
  color: var(--primary); padding: 0; height: auto; font-weight: 500;
}
.btn--link:hover:not(:disabled) { text-decoration: underline; }

/* Spinner */
.btn__spinner {
  position: absolute;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .6s linear infinite;
}
.btn--ghost .btn__spinner,
.btn--link  .btn__spinner {
  border-color: rgba(0,0,0,.15);
  border-top-color: var(--primary);
}
.btn__label--hidden { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
