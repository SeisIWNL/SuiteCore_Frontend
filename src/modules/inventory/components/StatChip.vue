<template>
  <div class="stat-chip" :class="`stat-chip--${tone}`">
    <div class="stat-chip__value">{{ value }}</div>
    <div class="stat-chip__label">{{ label }}</div>
  </div>
</template>

<script setup>
defineProps({
  value: { type: [Number, String], default: 0 },
  label: { type: String, default: '' },
  tone:  { type: String, default: 'default' },   // default | ok | info | warn
})
</script>

<style scoped>
.stat-chip {
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 12px 16px;
  min-width: 110px; position: relative; overflow: hidden;
}
.stat-chip::before {
  content: ''; position: absolute; left: 0; top: 0; width: 3px; height: 100%;
  background: var(--border-mid);
}
.stat-chip--ok::before   { background: var(--success); }
.stat-chip--info::before { background: var(--blue); }
.stat-chip--warn::before { background: var(--warning); }
.stat-chip__value {
  font-family: var(--font-display); font-size: 1.35rem; font-weight: 700;
  color: var(--text-1); line-height: 1;
}
.stat-chip__label { font-size: .68rem; color: var(--text-3); margin-top: 4px; }
</style>
