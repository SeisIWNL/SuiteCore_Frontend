<template>
  <span class="st-badge" :class="toneClass">
    <span class="st-badge__dot" />
    {{ status?.label ?? '—' }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: Object, default: null },   // { value, label }
})

// Mapea el valor de estado de NetBox a un tono visual
const toneClass = computed(() => {
  const v = (props.status?.value ?? '').toLowerCase()
  if (['active', 'connected', 'staged'].includes(v)) return 'st-badge--ok'
  if (['planned', 'reserved', 'staging'].includes(v)) return 'st-badge--info'
  if (['offline', 'failed', 'decommissioning', 'deprecated'].includes(v)) return 'st-badge--danger'
  if (['inventory', 'available'].includes(v)) return 'st-badge--warn'
  return 'st-badge--muted'
})
</script>

<style scoped>
.st-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 9px; border-radius: 99px;
  font-size: .72rem; font-weight: 600; white-space: nowrap;
}
.st-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.st-badge--ok     { background: var(--success-muted); color: var(--success); }
.st-badge--info   { background: var(--blue-muted);    color: var(--blue); }
.st-badge--warn   { background: var(--warning-muted); color: var(--warning); }
.st-badge--danger { background: var(--danger-muted);  color: var(--danger); }
.st-badge--muted  { background: var(--bg-3);          color: var(--text-3); }
</style>
