<template>
  <Transition name="alert">
    <div v-if="visible" class="alert" :class="`alert--${type}`" role="alert">
      <span class="alert__icon">{{ iconMap[type] }}</span>
      <span class="alert__text">{{ message }}</span>
      <button v-if="dismissible" class="alert__close" @click="visible = false">✕</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message:     { type: String,  required: true },
  type:        { type: String,  default: 'error' },   // error | success | warning | info
  dismissible: { type: Boolean, default: true },
  show:        { type: Boolean, default: true },
})

const iconMap = { error: '✕', success: '✓', warning: '!', info: 'i' }
const visible = ref(props.show)
watch(() => props.show, (v) => (visible.value = v))
</script>

<style scoped>
.alert {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 8px 10px; border-radius: var(--radius);
  font-size: .78rem; line-height: 1.4; border: 1px solid;
}
.alert--error   { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.alert--success { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
.alert--warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.alert--info    { background: var(--primary-muted); border-color: #bfdbfe; color: #1e40af; }

.alert__icon  { flex-shrink: 0; font-weight: 800; font-size: .68rem; margin-top: 1px; }
.alert__text  { flex: 1; }
.alert__close { background: none; border: none; cursor: pointer; opacity: .55; color: inherit; }
.alert__close:hover { opacity: 1; }

.alert-enter-active, .alert-leave-active { transition: opacity .2s, transform .2s; }
.alert-enter-from, .alert-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
